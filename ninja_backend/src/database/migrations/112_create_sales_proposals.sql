-- Sales proposals. Team-scoped. A proposal may originate from a quote (quote_id)
-- and links to an existing Cortexa contact. House style: no hard FKs.
CREATE TABLE IF NOT EXISTS sales_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  created_by UUID,
  proposal_number TEXT,
  quote_id UUID,
  contact_id UUID,
  customer_name TEXT,
  segment TEXT,
  contact_name TEXT,
  contact_role TEXT,
  deal_name TEXT,
  value NUMERIC(14,2),
  status TEXT NOT NULL DEFAULT 'Draft',
  valid_until DATE,
  owner_name TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_proposals_team ON sales_proposals(team_id);
CREATE INDEX IF NOT EXISTS idx_sales_proposals_status ON sales_proposals(status);
CREATE INDEX IF NOT EXISTS idx_sales_proposals_quote ON sales_proposals(quote_id);
CREATE INDEX IF NOT EXISTS idx_sales_proposals_contact ON sales_proposals(contact_id);
