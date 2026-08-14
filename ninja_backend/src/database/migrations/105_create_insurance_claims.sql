-- Insurance claims. Every claim is scoped to one account via team_id and MUST
-- link to a policy (policy_id); the customer is inherited from that policy, so a
-- claim is never disconnected from its policy/customer. Amounts are validated
-- server-side. House style: no hard FKs (see 094_create_appointments.sql).
CREATE TABLE IF NOT EXISTS insurance_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  created_by UUID,
  claim_number TEXT,
  policy_id UUID,
  contact_id UUID,
  claim_type TEXT,
  description TEXT,
  incident_date DATE,
  filed_date DATE,
  amount_claimed NUMERIC(12,2),
  amount_approved NUMERIC(12,2),
  amount_paid NUMERIC(12,2),
  status TEXT NOT NULL DEFAULT 'New',
  assigned_to UUID,
  resolved_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insurance_claims_team ON insurance_claims(team_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_policy ON insurance_claims(policy_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_status ON insurance_claims(status);
