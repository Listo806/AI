-- Insurance carriers for the Insurance Workspace. Each carrier belongs to one
-- customer account via team_id (tenant isolation). Policies/quotes/claims
-- reference a carrier by id. No hard FK constraints, matching house style
-- (see 094_create_appointments.sql) so tables can be created in any order.
CREATE TABLE IF NOT EXISTS insurance_carriers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  created_by UUID,
  name TEXT NOT NULL,
  carrier_mark TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insurance_carriers_team ON insurance_carriers(team_id);
