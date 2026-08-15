-- Sales invoices. Team-scoped tracking records for the sales cycle. Where an
-- invoice represents a real Cortexa Paddle payment, payment_reference holds the
-- Paddle transaction id; status must not be faked as Paid from the UI for
-- Paddle-sourced invoices (Paddle is the source of truth). House style: no FKs.
CREATE TABLE IF NOT EXISTS sales_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  created_by UUID,
  invoice_number TEXT,
  order_id UUID,
  contact_id UUID,
  customer_name TEXT,
  segment TEXT,
  contact_name TEXT,
  contact_role TEXT,
  deal_name TEXT,
  amount NUMERIC(14,2),
  status TEXT NOT NULL DEFAULT 'Open',
  due_date DATE,
  paid_date DATE,
  payment_reference TEXT,
  owner_name TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_invoices_team ON sales_invoices(team_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_status ON sales_invoices(status);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_order ON sales_invoices(order_id);
