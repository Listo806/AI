-- Marketing leads. Real captured leads, one row per lead, strictly team-scoped.
-- A lead may link to a CRM contact (contact_id) and to an originating campaign.
-- "Unique leads" is computed at read time as distinct lower(email); this table does
-- not fabricate leads — rows only exist from real captures (forms, imports, API).
CREATE TABLE IF NOT EXISTS mkt_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  created_by UUID,
  contact_id UUID,
  name TEXT,
  email TEXT,
  phone TEXT,
  source TEXT,
  campaign_id UUID,
  campaign_name TEXT,
  status TEXT NOT NULL DEFAULT 'New',
  value NUMERIC(14,2),
  external_id TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mkt_leads_team ON mkt_leads(team_id);
CREATE INDEX IF NOT EXISTS idx_mkt_leads_campaign ON mkt_leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_mkt_leads_source ON mkt_leads(source);
CREATE INDEX IF NOT EXISTS idx_mkt_leads_status ON mkt_leads(status);
CREATE INDEX IF NOT EXISTS idx_mkt_leads_created ON mkt_leads(created_at);
CREATE INDEX IF NOT EXISTS idx_mkt_leads_email ON mkt_leads(team_id, lower(email));
