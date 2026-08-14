-- Insurance renewals. A renewal is tied to an original policy and snapshots that
-- policy's current terms (expiration, premium, customer, carrier) at creation.
-- When renewed, a NEW policy term is created (renewed_policy_id) while the
-- original policy is kept intact for history. Team-scoped; no hard FKs.
CREATE TABLE IF NOT EXISTS insurance_renewals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  created_by UUID,
  policy_id UUID,
  contact_id UUID,
  carrier_id UUID,
  policy_type TEXT,
  holder_name TEXT,
  billing_frequency TEXT,
  current_expiration DATE,
  renewal_date DATE,
  current_premium NUMERIC(12,2),
  renewal_premium NUMERIC(12,2),
  status TEXT NOT NULL DEFAULT 'Upcoming',
  assigned_to UUID,
  notes TEXT,
  renewed_policy_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insurance_renewals_team ON insurance_renewals(team_id);
CREATE INDEX IF NOT EXISTS idx_insurance_renewals_policy ON insurance_renewals(policy_id);
CREATE INDEX IF NOT EXISTS idx_insurance_renewals_status ON insurance_renewals(status);
