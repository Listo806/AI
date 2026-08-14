-- Insurance commissions. Team-scoped. A commission links to a policy (and its
-- customer/agent). The amount is validated/derived server-side (premium x rate)
-- and never trusted from the client. House style: no hard FKs.
CREATE TABLE IF NOT EXISTS insurance_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  created_by UUID,
  policy_id UUID,
  contact_id UUID,
  agent_id UUID,
  rate NUMERIC(5,2),
  amount NUMERIC(12,2),
  status TEXT NOT NULL DEFAULT 'Pending',
  period TEXT,
  earned_date DATE,
  due_date DATE,
  paid_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insurance_commissions_team ON insurance_commissions(team_id);
CREATE INDEX IF NOT EXISTS idx_insurance_commissions_policy ON insurance_commissions(policy_id);
CREATE INDEX IF NOT EXISTS idx_insurance_commissions_status ON insurance_commissions(status);
