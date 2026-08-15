-- Sales returns. Team-scoped. Ties to the original order and links to an existing
-- Cortexa contact. House style: no hard FKs.
CREATE TABLE IF NOT EXISTS sales_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  created_by UUID,
  return_number TEXT,
  order_id UUID,
  contact_id UUID,
  customer_name TEXT,
  segment TEXT,
  contact_name TEXT,
  contact_role TEXT,
  reason TEXT,
  value NUMERIC(14,2),
  status TEXT NOT NULL DEFAULT 'Requested',
  completed_date DATE,
  owner_name TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_returns_team ON sales_returns(team_id);
CREATE INDEX IF NOT EXISTS idx_sales_returns_status ON sales_returns(status);
CREATE INDEX IF NOT EXISTS idx_sales_returns_order ON sales_returns(order_id);
