import {
  Injectable,
  BadRequestException,
} from "@nestjs/common";

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

  async sync(teamId: string) {
    /*
     * TODO:
     * FETCH TIKTOK LEADS
     * MAP TO CRM
     * CREATE CONTACTS
     * PIPELINE ASSIGNMENT
     * DUPLICATE CHECK
     */

    return {
      success: true,
      started: true,
    };
  }
}