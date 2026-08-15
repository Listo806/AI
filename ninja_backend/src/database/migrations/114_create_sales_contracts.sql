-- Sales contracts. Team-scoped. May relate to a proposal/order and links to an
-- existing Cortexa contact. House style: no hard FKs.
CREATE TABLE IF NOT EXISTS sales_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  created_by UUID,
  contract_number TEXT,
  proposal_id UUID,
  order_id UUID,
  contact_id UUID,
  customer_name TEXT,
  segment TEXT,
  contact_name TEXT,
  contact_role TEXT,
  deal_name TEXT,
  value NUMERIC(14,2),
  status TEXT NOT NULL DEFAULT 'Draft',
  start_date DATE,
  end_date DATE,
  owner_name TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_contracts_team ON sales_contracts(team_id);
CREATE INDEX IF NOT EXISTS idx_sales_contracts_status ON sales_contracts(status);
CREATE INDEX IF NOT EXISTS idx_sales_contracts_contact ON sales_contracts(contact_id);
