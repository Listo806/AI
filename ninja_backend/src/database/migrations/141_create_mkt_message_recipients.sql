-- Per-recipient send records. The real denominator for delivery-based rates. A
-- recipient is skipped (status 'Suppressed') when its address is on the suppression
-- list, so unsubscribed / bounced people are never sent to again.
CREATE TABLE IF NOT EXISTS mkt_message_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  message_id UUID NOT NULL,
  contact_id UUID,
  lead_id UUID,
  address TEXT,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'Queued',
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mkt_msg_recips_team ON mkt_message_recipients(team_id);
CREATE INDEX IF NOT EXISTS idx_mkt_msg_recips_msg ON mkt_message_recipients(message_id);
CREATE INDEX IF NOT EXISTS idx_mkt_msg_recips_status ON mkt_message_recipients(status);
CREATE INDEX IF NOT EXISTS idx_mkt_msg_recips_addr ON mkt_message_recipients(team_id, lower(address));
