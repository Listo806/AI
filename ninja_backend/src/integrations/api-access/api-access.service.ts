import { Injectable } from "@nestjs/common";
import { randomBytes } from "crypto";

import { DatabaseService } from "../../database/database.service";

@Injectable()
export class ApiAccessService {
  constructor(
    private readonly db: DatabaseService,
  ) {}

  /*
   |--------------------------------------------------------------------------
   | GET API KEY
   |--------------------------------------------------------------------------
   */

  async getApiKey(teamId: string) {
    const { rows } = await this.db.query(
      `
      SELECT *
      FROM api_keys_integrations
      WHERE team_id = $1
      AND revoked = false
      LIMIT 1
      `,
      [teamId],
    );

    return rows[0] || null;
  }

  /*
   |--------------------------------------------------------------------------
   | GENERATE API KEY
   |--------------------------------------------------------------------------
   */

  async generateApiKey(teamId: string) {
    const apiKey =
      "ninja_" +
      randomBytes(32).toString("hex");

    await this.db.query(
      `
      UPDATE api_keys_integrations
      SET revoked = true
      WHERE team_id = $1
      `,
      [teamId],
    );

    const { rows } = await this.db.query(
      `
      INSERT INTO api_keys_integrations (
        team_id,
        api_key
      )
      VALUES ($1,$2)
      RETURNING *
      `,
      [teamId, apiKey],
    );

    return rows[0];
  }

  /*
   |--------------------------------------------------------------------------
   | REVOKE
   |--------------------------------------------------------------------------
   */

  async revoke(teamId: string) {
    await this.db.query(
      `
      UPDATE api_keys_integrations
      SET revoked = true
      WHERE team_id = $1
      `,
      [teamId],
    );

    return {
      success: true,
    };
  }

  /*
   |--------------------------------------------------------------------------
   | VALIDATE API KEY
   |--------------------------------------------------------------------------
   */

  async validateApiKey(apiKey: string) {
    const { rows } = await this.db.query(
      `
      SELECT *
      FROM api_keys_integrations
      WHERE api_key = $1
      AND revoked = false
      LIMIT 1
      `,
      [apiKey],
    );

    return rows[0] || null;
  }

  /*
   |--------------------------------------------------------------------------
   | LOG USAGE
   |--------------------------------------------------------------------------
   */

  async logUsage(data: {
    apiKeyId: string;
    endpoint: string;
    method: string;
    ipAddress: string;
    responseStatus: number;
  }) {
    await this.db.query(
      `
      INSERT INTO api_usage_logs (
        api_key_id,
        endpoint,
        method,
        ip_address,
        response_status
      )
      VALUES ($1,$2,$3,$4,$5)
      `,
      [
        data.apiKeyId,
        data.endpoint,
        data.method,
        data.ipAddress,
        data.responseStatus,
      ],
    );
  }

  /*
   |--------------------------------------------------------------------------
   | USAGE STATS
   |--------------------------------------------------------------------------
   */

  async getUsage(teamId: string) {
    const { rows } = await this.db.query(
      `
      SELECT
        l.*
      FROM api_usage_logs l
      INNER JOIN api_keys_integrations k
      ON k.id = l.api_key_id
      WHERE k.team_id = $1
      ORDER BY l.created_at DESC
      LIMIT 100
      `,
      [teamId],
    );

    return rows;
  }
}