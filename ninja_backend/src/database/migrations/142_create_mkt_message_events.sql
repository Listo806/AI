-- Real message events (delivered / open / click / bounce / unsubscribe / complaint).
-- These are the ONLY source of open/click metrics — nothing is inferred. Each event
-- is idempotent via a partial UNIQUE on (team_id, dedup_key) so a retried provider
-- webhook never inflates opens or clicks.
CREATE TABLE IF NOT EXISTS mkt_message_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  message_id UUID NOT NULL,
  recipient_id UUID,
  event_type TEXT NOT NULL,
  url TEXT,
  dedup_key TEXT,
  occurred_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_mkt_msg_events_dedup
  ON mkt_message_events(team_id, dedup_key) WHERE dedup_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mkt_msg_events_team ON mkt_message_events(team_id);
CREATE INDEX IF NOT EXISTS idx_mkt_msg_events_msg ON mkt_message_events(message_id);
CREATE INDEX IF NOT EXISTS idx_mkt_msg_events_recip ON mkt_message_events(recipient_id);
CREATE INDEX IF NOT EXISTS idx_mkt_msg_events_type ON mkt_message_events(event_type);
CREATE INDEX IF NOT EXISTS idx_mkt_msg_events_occurred ON mkt_message_events(occurred_at);
