-- Suppression list (compliance). An address here is never sent to again. Populated by
-- unsubscribe / bounce / complaint events and by manual entries. Unique per account +
-- channel + address so the same address cannot be double-listed or leak across teams.
CREATE TABLE IF NOT EXISTS mkt_suppression (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  channel TEXT NOT NULL DEFAULT 'Email',
  address TEXT NOT NULL,
  reason TEXT,
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_mkt_suppression_addr
  ON mkt_suppression(team_id, channel, lower(address));
CREATE INDEX IF NOT EXISTS idx_mkt_suppression_team ON mkt_suppression(team_id);
