import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";

@Injectable()
export class SendgridService {
  constructor(private readonly db: DatabaseService) {}

  // ── Config CRUD ───────────────────────────────────────────────────

  async saveConfig(teamId: string, apiKey: string, fromEmail: string) {
    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromEmail)) {
      throw new BadRequestException("Invalid from_email address");
    }

    const { rows } = await this.db.query(
      `INSERT INTO team_email_config (team_id, sendgrid_api_key, from_email)
       VALUES ($1, $2, $3)
       ON CONFLICT (team_id) DO UPDATE SET
         sendgrid_api_key = EXCLUDED.sendgrid_api_key,
         from_email       = EXCLUDED.from_email,
         updated_at       = NOW()
       RETURNING id, team_id AS "teamId", from_email AS "fromEmail",
                 created_at AS "createdAt", updated_at AS "updatedAt"`,
      [teamId, apiKey, fromEmail],
    );

    // Return with masked key
    return { ...rows[0], apiKeyMasked: this.maskKey(apiKey) };
  }

  async getConfig(teamId: string) {
    const { rows } = await this.db.query(
      `SELECT id, team_id AS "teamId", sendgrid_api_key AS "apiKey", from_email AS "fromEmail",
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM team_email_config
       WHERE team_id = $1`,
      [teamId],
    );

    if (!rows.length) return null;

    return {
      id: rows[0].id,
      teamId: rows[0].teamId,
      fromEmail: rows[0].fromEmail,
      apiKeyMasked: this.maskKey(rows[0].apiKey),
      createdAt: rows[0].createdAt,
      updatedAt: rows[0].updatedAt,
    };
  }

  // ── Send Email ────────────────────────────────────────────────────

  async sendEmail(teamId: string, to: string, subject: string, html: string) {
    // Validate recipient
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      throw new BadRequestException("Invalid recipient email address");
    }

    const config = await this.getFullConfig(teamId);
    if (!config) {
      throw new NotFoundException(
        "SendGrid is not configured for this team. Please add your API key first.",
      );
    }

    const body = {
      personalizations: [{ to: [{ email: to }] }],
      from: { email: config.fromEmail },
      subject,
      content: [{ type: "text/html", value: html }],
    };

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      throw new BadRequestException(
        `SendGrid API error (${response.status}): ${errorBody.slice(0, 500)}`,
      );
    }

    return { success: true, statusCode: response.status };
  }

  // ── Send Test Email ───────────────────────────────────────────────

  async sendTestEmail(teamId: string) {
    const config = await this.getFullConfig(teamId);
    if (!config) {
      throw new NotFoundException("SendGrid is not configured for this team.");
    }

    return this.sendEmail(
      teamId,
      config.fromEmail,
      "CORTEXA CRM - Test Email",
      "<h2>Test Email from CORTEXA CRM</h2><p>Your SendGrid integration is working correctly.</p>",
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────

  private async getFullConfig(teamId: string) {
    const { rows } = await this.db.query(
      `SELECT sendgrid_api_key AS "apiKey", from_email AS "fromEmail"
       FROM team_email_config
       WHERE team_id = $1`,
      [teamId],
    );
    return rows[0] || null;
  }

  private maskKey(key: string): string {
    if (!key || key.length < 8) return "****";
    return key.slice(0, 4) + "****" + key.slice(-4);
  }

  async getConfigStatus(teamId: string) {
    const config = await this.getFullConfig(teamId);

    return {
      isConfigured: !!config,
      fromEmail: config?.fromEmail || null,
    };
  }
}
