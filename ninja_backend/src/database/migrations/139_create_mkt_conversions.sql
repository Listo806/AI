-- Marketing conversions. Explicit, real conversion events (a purchase, signup, demo).
-- Each carries a resolved last-touch attribution snapshot (attributed_campaign_id /
-- name / channel) captured at record time so attribution is deterministic and does
-- not drift. Idempotency: a partial UNIQUE index on (team_id, idempotency_key) makes
-- webhook / retried writes safe — the same event never double-counts.
CREATE TABLE IF NOT EXISTS mkt_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  created_by UUID,
  lead_id UUID,
  contact_id UUID,
  conversion_type TEXT,
  value NUMERIC(14,2),
  currency TEXT DEFAULT 'USD',
  attributed_campaign_id UUID,
  attributed_campaign_name TEXT,
  attributed_channel TEXT,
  attribution_model TEXT DEFAULT 'last_touch',
  source TEXT DEFAULT 'Manual',
  idempotency_key TEXT,
  occurred_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_mkt_conversions_idem
  ON mkt_conversions(team_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mkt_conversions_team ON mkt_conversions(team_id);
CREATE INDEX IF NOT EXISTS idx_mkt_conversions_lead ON mkt_conversions(lead_id);
CREATE INDEX IF NOT EXISTS idx_mkt_conversions_campaign ON mkt_conversions(attributed_campaign_id);
CREATE INDEX IF NOT EXISTS idx_mkt_conversions_occurred ON mkt_conversions(occurred_at);
