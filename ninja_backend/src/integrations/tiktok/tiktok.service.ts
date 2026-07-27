import {
  Injectable,
  BadRequestException,
} from "@nestjs/common";

import axios from "axios";
import { DatabaseService } from "../../database/database.service";

@Injectable()
export class TiktokService {
  constructor(
    private readonly db: DatabaseService,
  ) {}

  async getConfig(teamId: string) {
    const { rows } =
      await this.db.query(
        `
        SELECT *
        FROM tiktok_integrations
        WHERE team_id = $1
        LIMIT 1
        `,
        [teamId],
      );

    return rows[0] || null;
  }

  async save(
    teamId: string,
    body: any,
  ) {
    if (!body.appId) {
      throw new BadRequestException(
        "TikTok App ID required",
      );
    }

    await this.db.query(
      `
      INSERT INTO tiktok_integrations (
        team_id,
        app_id,
        app_secret,
        access_token,
        advertiser_id,
        leadgen_enabled,
        auto_sync,
        sync_frequency_minutes
      )
      VALUES (
        $1,$2,$3,$4,
        $5,$6,$7,$8
      )
      ON CONFLICT (team_id)
      DO UPDATE SET
        app_id = EXCLUDED.app_id,
        app_secret = EXCLUDED.app_secret,
        access_token = EXCLUDED.access_token,
        advertiser_id = EXCLUDED.advertiser_id,
        leadgen_enabled = EXCLUDED.leadgen_enabled,
        auto_sync = EXCLUDED.auto_sync,
        sync_frequency_minutes =
          EXCLUDED.sync_frequency_minutes
      `,
      [
        teamId,
        body.appId,
        body.appSecret,
        body.accessToken,
        body.advertiserId,
        body.leadgenEnabled,
        body.autoSync,
        body.syncFrequencyMinutes,
      ],
    );

    return {
      success: true,
    };
  }

  // Pull leads from the customer's OWN TikTok Business account using their
  // stored access token, and create CRM contacts (deduped by email/phone).
  // Follows the TikTok for Business Lead Generation API; the exact endpoint and
  // response shape should be validated against a live TikTok Business account.
  // Fails gracefully (records last_error) rather than throwing on API issues.
  async sync(teamId: string) {
    const config = await this.getConfig(teamId);

    if (!config) {
      throw new BadRequestException("TikTok is not connected");
    }
    if (!config.access_token || !config.advertiser_id) {
      throw new BadRequestException(
        "TikTok access token and advertiser id are required",
      );
    }

    let imported = 0;
    let duplicates = 0;
    let failed = 0;

    try {
      const response = await axios.get(
        "https://business-api.tiktok.com/open_api/v1.3/pages/leads/",
        {
          headers: { "Access-Token": config.access_token },
          params: {
            advertiser_id: config.advertiser_id,
            page_size: 100,
          },
        },
      );

      const leads =
        response?.data?.data?.list ||
        response?.data?.data?.leads ||
        [];

      for (const lead of leads) {
        try {
          const fields: any = {};
          const rawFields = lead.field_data || lead.fields || [];
          for (const f of rawFields) {
            if (f?.name) {
              fields[String(f.name).toLowerCase()] = f.value;
            }
          }

          const email = fields.email || null;
          const phone = fields.phone || fields.phone_number || null;
          const name =
            fields.name || fields.full_name || fields.first_name || null;

          if (!email && !phone) {
            failed++;
            continue;
          }

          const { rows: existing } = await this.db.query(
            `
            SELECT id
            FROM contacts
            WHERE team_id = $1 AND (email = $2 OR phone = $3)
            LIMIT 1
            `,
            [teamId, email, phone],
          );
          if (existing.length > 0) {
            duplicates++;
            continue;
          }

          await this.db.query(
            `
            INSERT INTO contacts (
              team_id, full_name, email, phone, company, created_at
            )
            VALUES ($1,$2,$3,$4,$5,NOW())
            `,
            [teamId, name, email, phone, "TikTok Lead"],
          );
          imported++;
        } catch {
          failed++;
        }
      }

      await this.db.query(
        `
        UPDATE tiktok_integrations
        SET last_synced_at = NOW(), last_error = NULL, updated_at = NOW()
        WHERE team_id = $1
        `,
        [teamId],
      );

      return { success: true, imported, duplicates, failed };
    } catch (err: any) {
      const message = String(
        err?.response?.data?.message || err?.message || err,
      ).slice(0, 500);

      await this.db.query(
        `
        UPDATE tiktok_integrations
        SET last_error = $1, updated_at = NOW()
        WHERE team_id = $2
        `,
        [message, teamId],
      );

      return { success: false, error: message };
    }
  }
}