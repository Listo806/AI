-- Financial Services clients. A financial client profile that extends an existing
-- Cortexa contact (reuse, not a second customer database). Team-scoped. AUM here is
-- a RECORDED/manual balance for CRM tracking, not live custodial data. House style:
-- no hard FKs.
CREATE TABLE IF NOT EXISTS financial_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  created_by UUID,
  client_number TEXT,
  contact_id UUID,
  client_name TEXT,
  kind TEXT,
  client_type TEXT,
  advisor_id UUID,
  advisor_name TEXT,
  account_type TEXT,
  aum NUMERIC(16,2),
  risk_level TEXT,
  status TEXT NOT NULL DEFAULT 'Active',
  last_activity_at TIMESTAMP,
  next_review_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_financial_clients_team ON financial_clients(team_id);
CREATE INDEX IF NOT EXISTS idx_financial_clients_status ON financial_clients(status);
CREATE INDEX IF NOT EXISTS idx_financial_clients_contact ON financial_clients(contact_id);
CREATE INDEX IF NOT EXISTS idx_financial_clients_review ON financial_clients(next_review_date);
