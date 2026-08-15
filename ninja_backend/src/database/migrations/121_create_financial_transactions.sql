-- Financial Services Workspace: transactions.
-- A transaction is a CRM TRACKING record of money movement on a client account
-- (contribution, withdrawal, fee, dividend, interest, transfer, adjustment). This
-- is a record only — Cortexa never executes, settles or custodies any funds. Every
-- row is team-scoped; amount is a recorded figure, never live custodial data.
CREATE TABLE IF NOT EXISTS financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  created_by UUID,
  transaction_number TEXT,
  account_id UUID,
  client_id UUID,
  transaction_type TEXT,
  amount NUMERIC(16,2),
  status TEXT NOT NULL DEFAULT 'Completed',
  transaction_date DATE,
  description TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_financial_transactions_team ON financial_transactions(team_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_status ON financial_transactions(status);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_account ON financial_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_client ON financial_transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON financial_transactions(transaction_date);
