-- Marketing touchpoints. The real interaction history behind attribution: each row
-- is one touch (form, click, open, visit, import) for a lead on a channel/campaign,
-- with the moment it happened. Last-touch attribution reads the most recent
-- campaign-bearing touchpoint at/before a conversion. Nothing here is inferred —
-- rows are only written from real recorded events.
CREATE TABLE IF NOT EXISTS mkt_touchpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  lead_id UUID NOT NULL,
  campaign_id UUID,
  campaign_name TEXT,
  channel TEXT,
  touch_type TEXT,
  occurred_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mkt_touchpoints_team ON mkt_touchpoints(team_id);
CREATE INDEX IF NOT EXISTS idx_mkt_touchpoints_lead ON mkt_touchpoints(lead_id);
CREATE INDEX IF NOT EXISTS idx_mkt_touchpoints_campaign ON mkt_touchpoints(campaign_id);
CREATE INDEX IF NOT EXISTS idx_mkt_touchpoints_occurred ON mkt_touchpoints(occurred_at);
