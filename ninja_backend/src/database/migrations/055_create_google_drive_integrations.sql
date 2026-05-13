CREATE TABLE IF NOT EXISTS google_drive_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,

  google_email VARCHAR(255),

  access_token TEXT,
  refresh_token TEXT,

  root_folder_id VARCHAR(255),

  token_expiry TIMESTAMP,

  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(team_id)
);

CREATE INDEX IF NOT EXISTS idx_google_drive_integrations_team_id
ON google_drive_integrations(team_id);