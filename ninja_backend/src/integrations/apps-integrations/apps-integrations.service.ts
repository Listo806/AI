import {
  Injectable,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";

import { DatabaseService } from "../../database/database.service";

import { installAppsIntegrationsTable } from "./apps-integrations.install";

@Injectable()
export class AppsIntegrationsService implements OnModuleInit {
  constructor(
    private readonly db: DatabaseService,
  ) {}

  async onModuleInit() {
    await installAppsIntegrationsTable(this.db);
  }

  private DEFAULT_INTEGRATIONS = [
    {
      key: "zapier",
      name: "Zapier",
      category: "Automation",
    },
    {
      key: "google_calendar",
      name: "Google Calendar",
      category: "Calendars",
    },
    {
      key: "whatsapp",
      name: "WhatsApp",
      category: "Communication",
    },
    {
      key: "instagram",
      name: "Instagram",
      category: "Marketing",
    },
    {
      key: "google_drive",
      name: "Google Drive",
      category: "Storage",
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