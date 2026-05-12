import { Injectable } from "@nestjs/common";
import { randomBytes } from "crypto";
import { DatabaseService } from "../../database/database.service";

@Injectable()
export class ZapierIntegrationService {
  constructor(private readonly db: DatabaseService) {}

  private createKey(): string {
    return "zap_" + randomBytes(24).toString("hex");
  }

  async getConfig(teamId: string) {
    const { rows } = await this.db.query(
      `SELECT
          team_id as "teamId",
          api_key as "apiKey",
          is_active as "isActive",
          created_at as "createdAt",
          updated_at as "updatedAt"
       FROM zapier_integrations
       WHERE team_id = $1`,
      [teamId],
    );

    return rows[0] || null;
  }

  async generateApiKey(teamId: string) {
    const apiKey = this.createKey();

    const { rows } = await this.db.query(
      `INSERT INTO zapier_integrations (
          team_id,
          api_key,
          is_active
       )
       VALUES ($1, $2, true)
       ON CONFLICT (team_id)
       DO UPDATE SET
         api_key = EXCLUDED.api_key,
         is_active = true,
         updated_at = NOW()
       RETURNING
         team_id as "teamId",
         api_key as "apiKey",
         is_active as "isActive"`,
      [teamId, apiKey],
    );

    return rows[0];
  }

  async regenerateApiKey(teamId: string) {
    return this.generateApiKey(teamId);
  }

  async getStatus(teamId: string) {
    const config = await this.getConfig(teamId);

    return {
      isConfigured: !!config,
      isActive: config?.isActive || false,
    };
  }
}