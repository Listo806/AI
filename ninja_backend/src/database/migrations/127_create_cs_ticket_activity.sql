-- Customer Service Workspace: ticket activity / audit trail.
-- An append-only history of meaningful ticket events (Created, Assigned, Reassigned,
-- Priority changed, Status changed, SLA changed, Escalated, Agent responded, Customer
-- responded, Resolved, Reopened, Closed, Internal note added). Double scoped to team
-- and ticket. Written by the service on ticket create/update and on new messages.
CREATE TABLE IF NOT EXISTS cs_ticket_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  ticket_id UUID NOT NULL,
  action TEXT NOT NULL,
  detail TEXT,
  actor_id UUID,
  actor_name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cs_ticket_activity_team ON cs_ticket_activity(team_id);
CREATE INDEX IF NOT EXISTS idx_cs_ticket_activity_ticket ON cs_ticket_activity(ticket_id);
CREATE INDEX IF NOT EXISTS idx_cs_ticket_activity_created ON cs_ticket_activity(created_at);
