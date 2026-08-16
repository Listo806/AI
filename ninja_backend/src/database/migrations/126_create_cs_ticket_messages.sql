-- Customer Service Workspace: ticket messages + internal notes.
-- Every message belongs to a ticket AND a team (double scoped). message_type marks
-- who/what it is: 'customer' (inbound), 'agent' (support reply), 'internal_note'
-- (agent-only, MUST never be exposed on a customer-facing channel), or 'system'.
-- The first 'agent' message stamps the ticket's first_response_at, which drives the
-- Average Response Time KPI.
CREATE TABLE IF NOT EXISTS cs_ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  ticket_id UUID NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'agent',
  body TEXT,
  author_id UUID,
  author_name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cs_ticket_messages_team ON cs_ticket_messages(team_id);
CREATE INDEX IF NOT EXISTS idx_cs_ticket_messages_ticket ON cs_ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_cs_ticket_messages_type ON cs_ticket_messages(message_type);
