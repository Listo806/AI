-- Financial Services Workspace: investments (holdings).
-- An investment is a CRM record of a holding on a client account, grouped by
-- category (Equities, Fixed Income, Cash, etc.). The recorded value ("amount") is a
-- figure entered/maintained by the advisor — Cortexa never fetches live market
-- prices and never fabricates valuations. Active holdings feed the Portfolio
-- Allocation breakdown. Every row is team-scoped.
CREATE TABLE IF NOT EXISTS financial_investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  created_by UUID,
  investment_number TEXT,
  account_id UUID,
  client_id UUID,
  name TEXT,
  category TEXT,
  amount NUMERIC(16,2),
  units NUMERIC(18,4),
  status TEXT NOT NULL DEFAULT 'Active',
  as_of_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_financial_investments_team ON financial_investments(team_id);
CREATE INDEX IF NOT EXISTS idx_financial_investments_status ON financial_investments(status);
CREATE INDEX IF NOT EXISTS idx_financial_investments_account ON financial_investments(account_id);
CREATE INDEX IF NOT EXISTS idx_financial_investments_client ON financial_investments(client_id);
CREATE INDEX IF NOT EXISTS idx_financial_investments_category ON financial_investments(category);
