import { DatabaseService } from "../../database/database.service";

export async function installAppsIntegrationsTable(
  db: DatabaseService,
) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS integrations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

      team_id UUID NOT NULL,
      user_id UUID NOT NULL,

      key VARCHAR(100) NOT NULL,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(255) NOT NULL,

      status VARCHAR(50) NOT NULL DEFAULT 'not_connected',

      config JSONB DEFAULT '{}'::jsonb,
      credentials JSONB DEFAULT '{}'::jsonb,

      last_synced_at TIMESTAMP NULL,
      last_error TEXT NULL,

      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

      UNIQUE(team_id, key)
    );
  `);

  console.log("integrations table ready");
}