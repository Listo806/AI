-- Customer Service Workspace: tickets (core entity).
-- Industry-neutral support tickets. Every row is team-scoped (the account boundary
-- is the TEAM). A ticket links to an existing CRM contact (the customer) and to a
-- team user (the assigned agent); both links are validated in-team before write.
-- SLA state (On Track / At Risk / Breached / Completed) is a real field derived from
-- timestamps + the applicable policy (policies land in a later slice). first_response_at
-- is set by the first agent reply (conversation slice); resolved_at/closed_at are set
-- automatically on the matching status transition and drive the response/resolution KPIs.
CREATE TABLE IF NOT EXISTS cs_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  created_by UUID,
  ticket_number TEXT,
  subject TEXT,
  description TEXT,
  contact_id UUID,
  customer_name TEXT,
  channel TEXT,
  category TEXT,
  priority TEXT NOT NULL DEFAULT 'Medium',
  status TEXT NOT NULL DEFAULT 'Open',
  sla_status TEXT,
  assigned_to UUID,
  assigned_agent_name TEXT,
  tags TEXT[],
  first_response_at TIMESTAMP,
  resolved_at TIMESTAMP,
  closed_at TIMESTAMP,
  due_at TIMESTAMP,
  last_activity_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cs_tickets_team ON cs_tickets(team_id);
CREATE INDEX IF NOT EXISTS idx_cs_tickets_status ON cs_tickets(status);
CREATE INDEX IF NOT EXISTS idx_cs_tickets_priority ON cs_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_cs_tickets_channel ON cs_tickets(channel);
CREATE INDEX IF NOT EXISTS idx_cs_tickets_sla ON cs_tickets(sla_status);
CREATE INDEX IF NOT EXISTS idx_cs_tickets_contact ON cs_tickets(contact_id);
CREATE INDEX IF NOT EXISTS idx_cs_tickets_agent ON cs_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_cs_tickets_resolved ON cs_tickets(resolved_at);
CREATE INDEX IF NOT EXISTS idx_cs_tickets_created ON cs_tickets(created_at);
