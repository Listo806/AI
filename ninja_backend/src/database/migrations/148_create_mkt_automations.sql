-- Marketing automations. A definition: WHEN trigger THEN action, strictly team-scoped.
-- Definitions are inert data; execution is recorded in mkt_automation_runs and is
-- idempotent, so an automation applies to a given entity at most once.
CREATE TABLE IF NOT EXISTS mkt_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  created_by UUID,
  name TEXT,
  description TEXT,
  trigger_type TEXT NOT NULL DEFAULT 'manual',
  trigger_config JSONB,
  action_type TEXT NOT NULL DEFAULT 'add_tag',
  action_config JSONB,
  status TEXT NOT NULL DEFAULT 'Active',
  last_run_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mkt_automations_team ON mkt_automations(team_id);
CREATE INDEX IF NOT EXISTS idx_mkt_automations_status ON mkt_automations(status);
