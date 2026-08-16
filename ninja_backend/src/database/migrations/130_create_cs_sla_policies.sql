-- Customer Service Workspace: SLA policies.
-- Team-scoped SLA targets. A policy applies to tickets by priority (and optionally
-- category); first_response_target_mins / resolution_target_mins are the targets used
-- to DERIVE a ticket's real SLA state (On Track / At Risk / Breached / Completed) from
-- its timestamps. Priority NULL means "any priority".
CREATE TABLE IF NOT EXISTS cs_sla_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  created_by UUID,
  name TEXT,
  priority TEXT,
  category TEXT,
  first_response_target_mins INTEGER,
  resolution_target_mins INTEGER,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cs_sla_policies_team ON cs_sla_policies(team_id);
CREATE INDEX IF NOT EXISTS idx_cs_sla_policies_active ON cs_sla_policies(active);
