import {
  Injectable,
} from "@nestjs/common";

import axios from "axios";
import { DatabaseService } from "../../database/database.service";

@Injectable()
export class MakeService {
  constructor(
    private readonly db: DatabaseService,
  ) {}

  async getConfig(teamId: string) {
    const { rows } =
      await this.db.query(
        `
        SELECT *
        FROM make_integrations
        WHERE team_id = $1
        LIMIT 1
        `,
        [teamId],
      );

    return rows[0] || null;
  }

  async getStatus(teamId: string) {
    const config =
      await this.getConfig(teamId);

    return {
      isConfigured: !!config,
    };
  }

  async saveConfig(
    teamId: string,
    body: any,
  ) {
    const existing =
      await this.getConfig(teamId);

    if (existing) {
      const { rows } =
        await this.db.query(
          `
          UPDATE make_integrations
          SET
            webhook_url = $1,
            triggers = $2,
            updated_at = NOW()
          WHERE team_id = $3
          RETURNING *
          `,
          [
            body.webhookUrl,
            JSON.stringify(
              body.triggers || [],
            ),
            teamId,
          ],
        );

      return rows[0];
    }

    const { rows } =
      await this.db.query(
        `
        INSERT INTO make_integrations (
          team_id,
          webhook_url,
          triggers
        )
        VALUES ($1,$2,$3)
        RETURNING *
        `,
        [
          teamId,
          body.webhookUrl,
          JSON.stringify(
            body.triggers || [],
          ),
        ],
      );

    return rows[0];
  }

  async triggerWebhook(
    teamId: string,
    body: any,
  ) {
    try {
      const {
        event,
        payload,
      } = body;

      const config =
        await this.getConfig(teamId);

      if (!config) {
        return {
          success: false,
        };
      }

      const triggers =
        config.triggers || [];

      let parsedTriggers = triggers;

      if (
        typeof triggers === "string"
      ) {
        parsedTriggers =
          JSON.parse(triggers);
      }

      if (
        !parsedTriggers.includes(
          event,
        )
      ) {
        return {
          success: false,
          skipped: true,
        };
      }

      await axios.post(
        config.webhook_url,
        {
          event,
          payload,
          createdAt:
            new Date().toISOString(),
        },
      );

      return {
        success: true,
      };
    } catch (err) {
      console.error(err);

      return {
        success: false,
      };
    }
  }
}