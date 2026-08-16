-- Customer Service Workspace: satisfaction surveys.
-- One row per survey sent for a ticket. rating/comment/responded_at stay NULL until
-- the customer actually responds; the Customer Satisfaction KPI is computed ONLY from
-- responded surveys, so it is empty (never fabricated) until real responses exist.
-- Team-scoped and associated to a ticket and (optionally) a CRM contact.
CREATE TABLE IF NOT EXISTS cs_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  created_by UUID,
  ticket_id UUID,
  contact_id UUID,
  customer_name TEXT,
  rating INTEGER,
  comment TEXT,
  status TEXT NOT NULL DEFAULT 'Sent',
  sent_at TIMESTAMP DEFAULT NOW(),
  responded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cs_surveys_team ON cs_surveys(team_id);
CREATE INDEX IF NOT EXISTS idx_cs_surveys_status ON cs_surveys(status);
CREATE INDEX IF NOT EXISTS idx_cs_surveys_ticket ON cs_surveys(ticket_id);
CREATE INDEX IF NOT EXISTS idx_cs_surveys_contact ON cs_surveys(contact_id);
