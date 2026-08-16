-- Customer Service Workspace: escalation rules.
-- Team-scoped rules describing when a ticket should escalate (SLA approaching /
-- SLA breached / high priority / ticket age / no agent response / customer reply
-- awaiting) and what action to take (notify / reassign / raise priority). These are
-- persisted rule records; the runtime that fires them keys off a last-run marker so
-- the same event is never actioned twice (idempotent).
CREATE TABLE IF NOT EXISTS cs_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  created_by UUID,
  name TEXT,
  trigger TEXT,
  threshold_mins INTEGER,
  action TEXT,
  target TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cs_escalations_team ON cs_escalations(team_id);
CREATE INDEX IF NOT EXISTS idx_cs_escalations_active ON cs_escalations(active);
