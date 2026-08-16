-- Customer Service Workspace: automation rules.
-- Team-scoped automation records (auto-assign, priority routing, SLA escalation,
-- follow-up reminders, notifications, categorization, status updates, survey-on-
-- resolution). Persisted config; the runtime that executes them is idempotent and
-- must never send duplicate messages, create duplicate tasks, or re-escalate the
-- same event (tracked via last_run_at + run_status).
CREATE TABLE IF NOT EXISTS cs_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  created_by UUID,
  name TEXT,
  trigger TEXT,
  conditions TEXT,
  actions TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMP,
  run_status TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cs_automations_team ON cs_automations(team_id);
CREATE INDEX IF NOT EXISTS idx_cs_automations_active ON cs_automations(active);
