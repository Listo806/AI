-- Insurance policies: the spine of the Insurance Workspace. Every policy is
-- scoped to one customer account via team_id (tenant isolation). It links to the
-- EXISTING Cortexa contact (the insured) and lead, so we do NOT duplicate the
-- customer database. Amounts are validated server-side, never trusted from the
-- client. No hard FK constraints, matching house style (094_create_appointments).
CREATE TABLE IF NOT EXISTS insurance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  created_by UUID,
  policy_number TEXT,
  contact_id UUID,
  lead_id UUID,
  holder_name TEXT,
  carrier_id UUID,
  policy_type TEXT,
  coverage_start DATE,
  coverage_end DATE,
  premium NUMERIC(12,2),
  billing_frequency TEXT,
  next_billing DATE,
  status TEXT NOT NULL DEFAULT 'Pending',
  assigned_to UUID,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insurance_policies_team ON insurance_policies(team_id);
CREATE INDEX IF NOT EXISTS idx_insurance_policies_contact ON insurance_policies(contact_id);
CREATE INDEX IF NOT EXISTS idx_insurance_policies_carrier ON insurance_policies(carrier_id);
CREATE INDEX IF NOT EXISTS idx_insurance_policies_status ON insurance_policies(status);
CREATE INDEX IF NOT EXISTS idx_insurance_policies_next_billing ON insurance_policies(next_billing);
