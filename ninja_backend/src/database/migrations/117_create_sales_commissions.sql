-- Sales commissions. Team-scoped. A commission may reference an order/invoice and
-- the sales rep (kept as text for V1, alongside an optional rep_id). The amount is
-- entered/derived and validated server-side. House style: no hard FKs.
CREATE TABLE IF NOT EXISTS sales_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  created_by UUID,
  commission_number TEXT,
  order_id UUID,
  invoice_id UUID,
  contact_id UUID,
  customer_name TEXT,
  deal_name TEXT,
  rep_id UUID,
  rep_name TEXT,
  source TEXT,
  rate NUMERIC(6,3),
  amount NUMERIC(14,2),
  status TEXT NOT NULL DEFAULT 'Pending',
  earned_date DATE,
  paid_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_commissions_team ON sales_commissions(team_id);
CREATE INDEX IF NOT EXISTS idx_sales_commissions_status ON sales_commissions(status);
CREATE INDEX IF NOT EXISTS idx_sales_commissions_order ON sales_commissions(order_id);
