-- Financial Services Workspace: commissions.
-- A commission is a CRM record of advisor/firm fee revenue tied to a client and
-- optional account. "amount" is the recorded fee; "rate" is an optional percent.
-- Commissions drive the Revenue figure (Approved + Paid within a period); Revenue is
-- kept strictly separate from AUM and account balances. Every row is team-scoped.
CREATE TABLE IF NOT EXISTS financial_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  created_by UUID,
  commission_number TEXT,
  client_id UUID,
  account_id UUID,
  advisor_name TEXT,
  amount NUMERIC(16,2),
  rate NUMERIC(6,3),
  status TEXT NOT NULL DEFAULT 'Pending',
  commission_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_financial_commissions_team ON financial_commissions(team_id);
CREATE INDEX IF NOT EXISTS idx_financial_commissions_status ON financial_commissions(status);
CREATE INDEX IF NOT EXISTS idx_financial_commissions_client ON financial_commissions(client_id);
CREATE INDEX IF NOT EXISTS idx_financial_commissions_account ON financial_commissions(account_id);
CREATE INDEX IF NOT EXISTS idx_financial_commissions_date ON financial_commissions(commission_date);
