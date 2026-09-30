import {
  Injectable,
  NotFoundException,
  BadRequestException,
  BadGatewayException,
  OnModuleInit,
} from "@nestjs/common";

import { DatabaseService } from "../../database/database.service";
import { UsageService } from "../../plans/usage.service";
import { PlatformMailerService } from "../../platform-mail/platform-mailer.service";

import { installAppsIntegrationsTable } from "./apps-integrations.install";

@Injectable()
export class AppsIntegrationsService implements OnModuleInit {
  constructor(
    private readonly db: DatabaseService,
    private readonly usage: UsageService,
    private readonly mailer: PlatformMailerService,
  ) {}

  async onModuleInit() {
    await installAppsIntegrationsTable(this.db);
    await this.installIntegrationRequestsTable();
  }


  private async installIntegrationRequestsTable() {
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS integration_requests (
        id BIGSERIAL PRIMARY KEY,
        integration_key TEXT,
        integration_name TEXT NOT NULL,
        user_id UUID NOT NULL,
        team_id UUID NOT NULL,
        customer_name TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        workspace_id TEXT,
        message TEXT NOT NULL,
        email_to TEXT NOT NULL DEFAULT 'support@cortexaaicrm.com',
        email_status VARCHAR(16) NOT NULL DEFAULT 'pending',
        email_error TEXT,
        emailed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await this.db.query(`CREATE INDEX IF NOT EXISTS idx_integration_requests_team_created ON integration_requests(team_id, created_at DESC)`);
  }

  private esc(value: unknown): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  async getRequestContext(user: any) {
    const userId = user?.id || user?._id || user?.userId;
    const teamId = user?.teamId || user?.team_id || user?.workspaceId || user?.workspace_id;
    if (!userId || !teamId) throw new NotFoundException('Customer workspace could not be resolved');

    let workspaceId: string | null = null;
    try {
      const ws = await this.db.query(
        `SELECT workspace_id FROM workspace_entitlements
          WHERE team_id=$1 AND status='active'
          ORDER BY updated_at DESC NULLS LAST, created_at DESC LIMIT 1`,
        [teamId],
      );
      workspaceId = ws.rows?.[0]?.workspace_id || null;
    } catch (_) {}
    if (!workspaceId) {
      try {
        const ws = await this.db.query(`SELECT onboarding_workspace_id FROM users WHERE id=$1`, [userId]);
        workspaceId = ws.rows?.[0]?.onboarding_workspace_id || null;
      } catch (_) {}
    }

    return {
      name: String(user?.name || '').trim(),
      email: String(user?.email || '').trim().toLowerCase(),
      workspace: workspaceId || 'Core CRM',
    };
  }

  async requestIntegration(user: any, body: any) {
    const userId = user?.id || user?._id || user?.userId;
    const teamId = user?.teamId || user?.team_id || user?.workspaceId || user?.workspace_id;
    if (!userId || !teamId) throw new NotFoundException('Customer workspace could not be resolved');

    const integrationKey = String(body?.integrationKey || '').trim().slice(0, 120) || null;
    const integrationName = String(body?.integrationName || '').trim().slice(0, 160);
    const message = String(body?.message || '').trim();
    if (!integrationName) throw new BadRequestException('Integration name is required');
    if (!message) throw new BadRequestException('Message is required');
    if (message.length > 3000) throw new BadRequestException('Message must be at most 3000 characters');

    const context = await this.getRequestContext(user);
    if (!context.email) throw new BadRequestException('Customer email is missing');
    const to = 'support@cortexaaicrm.com';

    // Store first. The UI only shows success after this insert has completed.
    const saved = await this.db.query(
      `INSERT INTO integration_requests
        (integration_key,integration_name,user_id,team_id,customer_name,customer_email,workspace_id,message,email_to)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [integrationKey, integrationName, userId, teamId, context.name || context.email, context.email, context.workspace, message, to],
    );
    const id = String(saved.rows[0].id);

    const html = `<div style="font-family:Arial,sans-serif;max-width:680px;color:#0f172a">
      <h2>Integration request</h2>
      <p><b>Integration:</b> ${this.esc(integrationName)}</p>
      <p><b>Customer:</b> ${this.esc(context.name || '-')}</p>
      <p><b>Email:</b> ${this.esc(context.email)}</p>
      <p><b>Workspace:</b> ${this.esc(context.workspace)}</p>
      <h3>What they would like to connect or sync</h3>
      <div style="white-space:pre-wrap;border:1px solid #e2e8f0;border-radius:8px;padding:12px;background:#f8fafc">${this.esc(message)}</div>
      <p style="color:#64748b;font-size:12px">Integration request #${this.esc(id)}. Reply to this email to contact the customer directly.</p>
    </div>`;
    const text = `Integration request #${id}\nIntegration: ${integrationName}\nCustomer: ${context.name || '-'}\nEmail: ${context.email}\nWorkspace: ${context.workspace}\n\n${message}`;

    try {
      const result = await this.mailer.sendCustomEmail({
        to, subject: `Integration request: ${integrationName}`.slice(0, 200), html, text,
        template: 'integration_request', language: 'en',
        replyTo: { email: context.email, name: context.name || undefined },
      });
      if (!result.sent) throw new Error(result.reason || 'send_failed');
      await this.db.query(`UPDATE integration_requests SET email_status='sent', emailed_at=NOW(), email_error=NULL WHERE id=$1`, [id]);
    } catch (err: any) {
      await this.db.query(`UPDATE integration_requests SET email_status='failed', email_error=$2 WHERE id=$1`, [id, String(err?.message || 'send_failed').slice(0,500)]);
      throw new BadGatewayException({ success: false, stored: true, message: 'Request was saved, but the notification email could not be sent. Please retry.' });
    }

    return { success: true, id, message: 'Request received. Our team will contact you to discuss this integration.' };
  }

  private DEFAULT_INTEGRATIONS = [
  {
    key: "zapier",
    name: "Zapier",
    category: "Automation",
  },

  {
    key: "email_provider",
    name: "Email Provider",
    category: "Communication",
  },

  {
    key: "webhooks",
    name: "Webhooks",
    category: "API & Webhooks",
  },

  {
    key: "google_calendar",
    name: "Google Calendar",
    category: "Calendars",
  },

  {
    key: "instagram",
    name: "Instagram",
    category: "Marketing",
  },
  {
    key: "appointment",
    name: "AI Appointment Booking",
    category: "Communication",
  },
  {
    key: "whatsapp",
    name: "WhatsApp",
    category: "Communication",
  },

  {
    key: "crm_import",
    name: "CRM Migration Tool",
    category: "CRM Imports",
  },

  {
    key: "google_drive",
    name: "Google Drive",
    category: "Storage",
  },

  {
    key: "csv_lead_import",
    name: "CSV Lead Import",
    category: "CRM Imports",
  },

  {
    key: "property_feed_sync",
    name: "Property Feed Sync",
    category: "CRM Imports",
  },

  {
    key: "make",
    name: "Make.com",
    category: "Automation",
  },

  {
    key: "google_ads",
    name: "Google Ads",
    category: "Marketing",
  },

  {
    key: "tiktok",
    name: "TikTok Lead Sync",
    category: "Marketing",
  },

  {
    key: "api_access",
    name: "API Access",
    category: "API & Webhooks",
  },

  {
    key: "mls_idx_feed",
    name: "MLS / IDX Feed",
    category: "CRM Imports",
  },
];

  async getAll(teamId: string, userId: string) {
    for (const app of this.DEFAULT_INTEGRATIONS) {
      await this.db.query(
        `
        INSERT INTO integrations (
          team_id,
          user_id,
          key,
          name,
          category,
          status
        )
        VALUES ($1,$2,$3,$4,$5,'not_connected')
        ON CONFLICT (team_id, key)
        DO NOTHING
        `,
        [
          teamId,
          userId,
          app.key,
          app.name,
          app.category,
        ],
      );
    }

    const { rows } = await this.db.query(
      `
      SELECT *
      FROM integrations
      WHERE team_id = $1
      ORDER BY category ASC, name ASC
      `,
      [teamId],
    );

    return rows;
  }

  async getOne(teamId: string, key: string) {
    const { rows } = await this.db.query(
      `
      SELECT *
      FROM integrations
      WHERE team_id = $1
      AND key = $2
      LIMIT 1
      `,
      [teamId, key],
    );

    if (!rows[0]) {
      throw new NotFoundException(
        "Integration not found",
      );
    }

    return rows[0];
  }

  async connect(
    teamId: string,
    key: string,
    body: any,
  ) {
    // Free plan is capped at 1 connected integration. Paid plans are unlimited;
    // re-connecting an already-connected integration is always allowed.
    await this.usage.assertCanConnectIntegration(teamId, key);

    const { rows } = await this.db.query(
      `
      UPDATE integrations
      SET
        config = $1,
        credentials = $2,
        status = 'connected',
        updated_at = NOW()
      WHERE team_id = $3
      AND key = $4
      RETURNING *
      `,
      [
        body.config || {},
        body.credentials || {},
        teamId,
        key,
      ],
    );

    return rows[0];
  }

  async disconnect(
    teamId: string,
    key: string,
  ) {
    const { rows } = await this.db.query(
      `
      UPDATE integrations
      SET
        config = '{}'::jsonb,
        credentials = '{}'::jsonb,
        status = 'not_connected',
        updated_at = NOW()
      WHERE team_id = $1
      AND key = $2
      RETURNING *
      `,
      [teamId, key],
    );

    return rows[0];
  }

  async sync(
    teamId: string,
    key: string,
  ) {
    const { rows } = await this.db.query(
      `
      UPDATE integrations
      SET
        status = 'active',
        last_synced_at = NOW(),
        updated_at = NOW()
      WHERE team_id = $1
      AND key = $2
      RETURNING *
      `,
      [teamId, key],
    );

    return rows[0];
  }
}