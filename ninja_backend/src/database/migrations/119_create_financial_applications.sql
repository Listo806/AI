-- Financial Services applications. Team-scoped. Links to a financial client (and
-- optionally an account). CRM/workflow records, not regulated filings. House
-- style: no hard FKs.
CREATE TABLE IF NOT EXISTS financial_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  created_by UUID,
  application_number TEXT,
  client_id UUID,
  account_id UUID,
  client_name TEXT,
  application_type TEXT,
  advisor_name TEXT,
  status TEXT NOT NULL DEFAULT 'Draft',
  submitted_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_financial_applications_team ON financial_applications(team_id);
CREATE INDEX IF NOT EXISTS idx_financial_applications_status ON financial_applications(status);
CREATE INDEX IF NOT EXISTS idx_financial_applications_client ON financial_applications(client_id);
