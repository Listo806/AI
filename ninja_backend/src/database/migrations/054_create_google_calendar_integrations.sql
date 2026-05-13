CREATE TABLE IF NOT EXISTS google_calendar_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,

    google_email VARCHAR(255),
    access_token TEXT,
    refresh_token TEXT,
    token_expiry TIMESTAMP NULL,

    calendar_id VARCHAR(255),

    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(team_id)
);

CREATE INDEX IF NOT EXISTS idx_google_calendar_integrations_team
ON google_calendar_integrations(team_id);