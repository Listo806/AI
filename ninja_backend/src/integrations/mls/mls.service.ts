import { BadRequestException, Injectable } from "@nestjs/common";

import { DatabaseService } from "../../database/database.service";

@Injectable()
export class MlsService {
  constructor(private readonly db: DatabaseService) {}

  async getConfig(teamId: string) {
    const { rows } = await this.db.query(
      `
        SELECT *
        FROM mls_integrations
        WHERE team_id = $1
        LIMIT 1
        `,
      [teamId],
    );

    return rows[0] || null;
  }

  async save(teamId: string, body: any) {
    if (!body.endpointUrl) {
      throw new BadRequestException("Endpoint URL required");
    }

    try {
      new URL(body.endpointUrl);
    } catch {
      throw new BadRequestException("Invalid endpoint URL");
    }

    await this.db.query(
      `
      INSERT INTO mls_integrations (
        team_id,
        provider_name,
        country,
        integration_type,
        endpoint_url,
        username,
        password,
        api_key,
        sync_enabled,
        sync_frequency_minutes,
        compatibility_mode
      )
      VALUES (
        $1,$2,$3,$4,$5,
        $6,$7,$8,$9,$10,$11
      )
      ON CONFLICT (team_id)
      DO UPDATE SET
        provider_name = EXCLUDED.provider_name,
        country = EXCLUDED.country,
        integration_type = EXCLUDED.integration_type,
        endpoint_url = EXCLUDED.endpoint_url,
        username = EXCLUDED.username,
        password = EXCLUDED.password,
        api_key = EXCLUDED.api_key,
        sync_enabled = EXCLUDED.sync_enabled,
        sync_frequency_minutes =
          EXCLUDED.sync_frequency_minutes,
        compatibility_mode =
          EXCLUDED.compatibility_mode
      `,
      [
        teamId,
        body.providerName,
        body.country,
        body.integrationType,
        body.endpointUrl,
        body.username,
        body.password,
        body.apiKey,
        body.syncEnabled,
        body.syncFrequencyMinutes,
        body.compatibilityMode,
      ],
    );

    return {
      success: true,
    };
  }

  async sync(teamId: string) {
    /*
     * TODO:
     * RETS LOGIN
     * RESO API FETCH
     * MEDIA DOWNLOAD
     * AGENT MAPPING
     * PROPERTY UPSERT
     */

    return {
      success: true,
      started: true,
    };
  }

  async getAll(teamId: string) {
    const { rows } = await this.db.query(
      `
      SELECT *
      FROM mls_integrations
      WHERE team_id = $1
      ORDER BY created_at DESC
      `,
      [teamId],
    );

    return rows;
  }
}
