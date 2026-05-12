import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";

import { DatabaseService } from "../../database/database.service";

import { installAppsIntegrationsTable } from "./apps-integrations.install";

@Injectable()
export class AppsIntegrationsService implements OnModuleInit {
  constructor(private readonly db: DatabaseService) {}

  async onModuleInit() {
    await installAppsIntegrationsTable(this.db);
  }

  private DEFAULT_INTEGRATIONS = [
    {
      key: "zapier",
      name: "Zapier",
      category: "Automation",
      description:
        "Connect thousands of apps and automate workflows instantly.",
    },

    {
      key: "email_provider",
      name: "Email Provider",
      category: "Communication",
      description: "Connect Gmail, Outlook, SMTP, and outbound email services.",
    },

    {
      key: "webhooks",
      name: "Webhooks",
      category: "API & Webhooks",
      description:
        "Send and receive real-time API events and automation triggers.",
    },

    {
      key: "google_calendar",
      name: "Google Calendar",
      category: "Calendars",
      description: "Sync appointments, meetings, and scheduling automatically.",
    },

    {
      key: "instagram",
      name: "Instagram",
      category: "Marketing",
      description: "Connect Instagram messaging, lead capture, and automation.",
    },

    {
      key: "whatsapp",
      name: "WhatsApp",
      category: "Communication",
      description: "Sync WhatsApp conversations and automate lead engagement.",
    },

    {
      key: "crm_migration",
      name: "CRM Migration Tool",
      category: "CRM Imports",
      description:
        "Import leads, pipelines, contacts, and properties from another CRM.",
    },

    {
      key: "google_drive",
      name: "Google Drive",
      category: "Storage",
      description:
        "Store contracts, property documents, and media in the cloud.",
    },

    {
      key: "csv_lead_import",
      name: "CSV Lead Import",
      category: "CRM Imports",
      description:
        "Upload lead lists and import contacts into your CRM instantly.",
    },

    {
      key: "property_feed_sync",
      name: "Property Feed Sync",
      category: "CRM Imports",
      description: "Sync listings and property feeds from external platforms.",
    },

    {
      key: "make",
      name: "Make.com",
      category: "Automation",
      description: "Create advanced automations and visual workflow systems.",
    },

    {
      key: "google_ads",
      name: "Google Ads",
      category: "Marketing",
      description:
        "Track campaigns, leads, and ad performance directly inside CORTEXA.",
    },

    {
      key: "meta_ads",
      name: "Meta Ads",
      category: "Marketing",
      description: "Sync Facebook and Instagram leads directly into your CRM.",
    },

    {
      key: "api_access",
      name: "API Access",
      category: "API & Webhooks",
      description:
        "Connect external CRMs, websites, and custom systems using APIs.",
    },

    {
      key: "mls_idx_feed",
      name: "MLS / IDX Feed",
      category: "CRM Imports",
      description:
        "Import and synchronize property listings from MLS/IDX systems.",
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
          description,
          status
        )
        VALUES ($1,$2,$3,$4,$5,$6,'not_connected')
        ON CONFLICT (team_id, key)
        DO NOTHING
        `,
        [teamId, userId, app.key, app.name, app.category, app.description],
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
      throw new NotFoundException("Integration not found");
    }

    return rows[0];
  }

  async connect(teamId: string, key: string, body: any) {
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
      [body.config || {}, body.credentials || {}, teamId, key],
    );

    return rows[0];
  }

  async disconnect(teamId: string, key: string) {
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

  async sync(teamId: string, key: string) {
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
