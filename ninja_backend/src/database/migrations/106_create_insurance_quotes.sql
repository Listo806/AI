-- Insurance quotes. Team-scoped. A quote can link to an existing contact and,
-- when accepted, be converted into a policy (converted_policy_id records the
-- resulting policy so a quote is never converted twice). House style: no hard
-- FKs (see 094_create_appointments.sql).
CREATE TABLE IF NOT EXISTS insurance_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  created_by UUID,
  quote_number TEXT,
  contact_id UUID,
  holder_name TEXT,
  carrier_id UUID,
  policy_type TEXT,
  quoted_premium NUMERIC(12,2),
  coverage_start DATE,
  coverage_end DATE,
  billing_frequency TEXT,
  valid_until DATE,
  status TEXT NOT NULL DEFAULT 'Draft',
  assigned_to UUID,
  notes TEXT,
  converted_policy_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insurance_quotes_team ON insurance_quotes(team_id);
CREATE INDEX IF NOT EXISTS idx_insurance_quotes_contact ON insurance_quotes(contact_id);
CREATE INDEX IF NOT EXISTS idx_insurance_quotes_status ON insurance_quotes(status);
