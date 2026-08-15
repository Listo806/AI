-- Sales orders. Team-scoped. An order may originate from an accepted quote and/or
-- proposal (quote_id / proposal_id) and links to an existing Cortexa contact.
-- House style: no hard FKs.
CREATE TABLE IF NOT EXISTS sales_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  created_by UUID,
  order_number TEXT,
  quote_id UUID,
  proposal_id UUID,
  contact_id UUID,
  customer_name TEXT,
  segment TEXT,
  contact_name TEXT,
  contact_role TEXT,
  deal_name TEXT,
  value NUMERIC(14,2),
  status TEXT NOT NULL DEFAULT 'Pending',
  owner_name TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_orders_team ON sales_orders(team_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON sales_orders(status);
CREATE INDEX IF NOT EXISTS idx_sales_orders_contact ON sales_orders(contact_id);
