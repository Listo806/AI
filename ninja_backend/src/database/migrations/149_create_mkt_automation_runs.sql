-- Automation execution log. Idempotent: a partial UNIQUE on (team_id, automation_id,
-- dedup_key) means the same automation applied to the same entity records exactly one
-- APPLIED run — retries/replays never duplicate the action (no duplicate sends).
CREATE TABLE IF NOT EXISTS mkt_automation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  automation_id UUID NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  dedup_key TEXT,
  status TEXT NOT NULL DEFAULT 'applied',
  detail TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_mkt_automation_runs_dedup
  ON mkt_automation_runs(team_id, automation_id, dedup_key) WHERE dedup_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mkt_automation_runs_team ON mkt_automation_runs(team_id);
CREATE INDEX IF NOT EXISTS idx_mkt_automation_runs_auto ON mkt_automation_runs(automation_id);
