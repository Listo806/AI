-- Marketing Workspace: campaigns (core entity).
-- Industry-neutral marketing campaigns. Every row is team-scoped. BUDGET is the
-- planned amount and is a field here; actual SPEND is NEVER stored here — it is the
-- sum of recorded mkt_campaign_costs, kept strictly separate. Leads/conversions/ROI
-- shown per campaign are computed from real mkt_leads / mkt_conversions records (a
-- later slice), never fabricated. channel holds one or more channel keys.
CREATE TABLE IF NOT EXISTS mkt_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  created_by UUID,
  campaign_number TEXT,
  name TEXT,
  campaign_type TEXT,
  channel TEXT,
  audience_id UUID,
  audience_name TEXT,
  status TEXT NOT NULL DEFAULT 'Draft',
  budget NUMERIC(14,2),
  owner_name TEXT,
  goals TEXT,
  tags TEXT[],
  notes TEXT,
  tracking TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mkt_campaigns_team ON mkt_campaigns(team_id);
CREATE INDEX IF NOT EXISTS idx_mkt_campaigns_status ON mkt_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_mkt_campaigns_type ON mkt_campaigns(campaign_type);
CREATE INDEX IF NOT EXISTS idx_mkt_campaigns_audience ON mkt_campaigns(audience_id);
CREATE INDEX IF NOT EXISTS idx_mkt_campaigns_start ON mkt_campaigns(start_date);
