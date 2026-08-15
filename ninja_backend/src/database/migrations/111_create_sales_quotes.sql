-- Sales Workspace quotes. The spine of the sales lifecycle
-- (quote -> proposal -> order -> contract -> invoice -> commission). Team-scoped.
-- A quote may link to an existing Cortexa contact (reuse, not a second customer
-- database) and, later, to a pipeline deal. House style: no hard FKs.
CREATE TABLE IF NOT EXISTS sales_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  created_by UUID,
  quote_number TEXT,
  contact_id UUID,
  customer_name TEXT,
  segment TEXT,
  contact_name TEXT,
  contact_role TEXT,
  deal_id UUID,
  deal_name TEXT,
  stage TEXT,
  value NUMERIC(14,2),
  status TEXT NOT NULL DEFAULT 'Draft',
  valid_until DATE,
  owner_id UUID,
  owner_name TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_quotes_team ON sales_quotes(team_id);
CREATE INDEX IF NOT EXISTS idx_sales_quotes_status ON sales_quotes(status);
CREATE INDEX IF NOT EXISTS idx_sales_quotes_contact ON sales_quotes(contact_id);
