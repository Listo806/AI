-- Financial Services accounts. Team-scoped. Links to a financial client (and
-- optionally the originating application). `balance` is a RECORDED value for CRM
-- tracking; Cortexa is NOT a bank/broker/custodian. House style: no hard FKs.
CREATE TABLE IF NOT EXISTS financial_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  created_by UUID,
  account_number TEXT,
  client_id UUID,
  application_id UUID,
  client_name TEXT,
  account_type TEXT,
  advisor_name TEXT,
  status TEXT NOT NULL DEFAULT 'Active',
  balance NUMERIC(16,2),
  opened_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_financial_accounts_team ON financial_accounts(team_id);
CREATE INDEX IF NOT EXISTS idx_financial_accounts_status ON financial_accounts(status);
CREATE INDEX IF NOT EXISTS idx_financial_accounts_client ON financial_accounts(client_id);
