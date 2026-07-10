-- AI Agent settings for the new Cortexa AI flow
CREATE TABLE IF NOT EXISTS ai_agent_settings (
    team_id uuid PRIMARY KEY
        REFERENCES teams(id)
        ON DELETE CASCADE,

    business_profile_completed boolean NOT NULL DEFAULT false,
    appointment_rules_configured boolean NOT NULL DEFAULT false,
    behavior_configured boolean NOT NULL DEFAULT false,
    automations_configured boolean NOT NULL DEFAULT false,
    tested boolean NOT NULL DEFAULT false,
    launched boolean NOT NULL DEFAULT false,
    paused boolean NOT NULL DEFAULT false,

    response_tone character varying(20) NOT NULL DEFAULT 'professional',
    capabilities jsonb NOT NULL DEFAULT '{}'::jsonb,
    quick_controls jsonb NOT NULL DEFAULT '{}'::jsonb,

    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),

    CONSTRAINT ai_agent_settings_response_tone_check
      CHECK (
        response_tone IN ('professional', 'friendly', 'sales')
      )
);

CREATE INDEX IF NOT EXISTS idx_ai_agent_settings_launched
  ON ai_agent_settings (launched);

CREATE INDEX IF NOT EXISTS idx_ai_activity_team_created
  ON ai_activity (team_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_activity_team_action
  ON ai_activity (team_id, action);