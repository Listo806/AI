-- Marketing Workspace: recorded campaign spend.
-- Actual spend, kept SEPARATE from a campaign's planned budget. Each row is a real
-- recorded cost with a source (Manual, or the name of a legitimately connected ad
-- platform). Spend for a campaign = SUM(amount) of its cost rows. Ad-platform spend
-- is only ever recorded here from a real integration; it is never fabricated.
CREATE TABLE IF NOT EXISTS mkt_campaign_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  created_by UUID,
  campaign_id UUID,
  amount NUMERIC(14,2),
  cost_date DATE,
  source TEXT DEFAULT 'Manual',
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mkt_campaign_costs_team ON mkt_campaign_costs(team_id);
CREATE INDEX IF NOT EXISTS idx_mkt_campaign_costs_campaign ON mkt_campaign_costs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_mkt_campaign_costs_date ON mkt_campaign_costs(cost_date);
