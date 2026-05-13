import {
  Injectable,
} from "@nestjs/common";

import { DatabaseService } from "../../database/database.service";

@Injectable()
export class GoogleDriveService {
  constructor(
    private readonly db: DatabaseService,
  ) {}

  async getStatus(teamId: string) {
    const { rows } = await this.db.query(
      `
      SELECT *
      FROM google_drive_integrations
      WHERE team_id = $1
      LIMIT 1
      `,
      [teamId],
    );

    if (rows.length === 0) {
      return {
        isConfigured: false,
      };
    }

    return {
      isConfigured: true,
      integration: {
        google_email: rows[0].google_email,
        root_folder_id: rows[0].root_folder_id,
        is_active: rows[0].is_active,
      },
    };
  }

  async disconnect(teamId: string) {
    await this.db.query(
      `
      DELETE FROM google_drive_integrations
      WHERE team_id = $1
      `,
      [teamId],
    );

    return {
      success: true,
    };
  }
}