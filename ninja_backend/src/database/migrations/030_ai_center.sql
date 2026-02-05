-- =========================================
-- AI Center + AI Appointment Setter (MVP)
-- Team-level flags, team_ai_config, ai_activity.
-- =========================================

-- 1) Teams: AI Center flags and auto-reply defaults
ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS ai_appointment_setter_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_auto_reply_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS ai_auto_reply_tone VARCHAR(20) DEFAULT 'professional';

-- Tone constraint (optional; app enforces professional | friendly | sales)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'teams_ai_auto_reply_tone_check'
  ) THEN
    ALTER TABLE teams ADD CONSTRAINT teams_ai_auto_reply_tone_check
      CHECK (ai_auto_reply_tone IN ('professional', 'friendly', 'sales'));
  END IF;
END $$;

-- 2) One active ruleset per team (Phase 1: name + updated_at only)
CREATE TABLE IF NOT EXISTS team_ai_config (
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL DEFAULT 'Default',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (team_id)
);

CREATE INDEX IF NOT EXISTS idx_team_ai_config_team_id ON team_ai_config(team_id);

-- 3) AI activity audit (Overview last 5, Setter last 10, Logs full list)
CREATE TABLE IF NOT EXISTS ai_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  action VARCHAR(30) NOT NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  channel VARCHAR(20),
  outcome VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_activity_team_id ON ai_activity(team_id);
CREATE INDEX IF NOT EXISTS idx_ai_activity_created_at ON ai_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_activity_team_created ON ai_activity(team_id, created_at DESC);

-- 4) Optional: addon history for future billing/proration
CREATE TABLE IF NOT EXISTS team_addon_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  addon_key VARCHAR(50) NOT NULL,
  enabled_at TIMESTAMPTZ NOT NULL,
  disabled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_addon_history_team_id ON team_addon_history(team_id);
CREATE INDEX IF NOT EXISTS idx_team_addon_history_addon_key ON team_addon_history(addon_key);
