-- Email / SMS broadcasts. One row per message (a send), strictly team-scoped and
-- optionally tied to a campaign and an audience. "Sent" means we attempted delivery;
-- actual delivery/open/click are separate real signals recorded as events — this
-- table never claims a message was delivered or opened on its own.
CREATE TABLE IF NOT EXISTS mkt_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  created_by UUID,
  campaign_id UUID,
  channel TEXT NOT NULL DEFAULT 'Email',
  name TEXT,
  subject TEXT,
  body TEXT,
  from_name TEXT,
  from_address TEXT,
  audience_id UUID,
  audience_name TEXT,
  status TEXT NOT NULL DEFAULT 'Draft',
  scheduled_at TIMESTAMP,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mkt_messages_team ON mkt_messages(team_id);
CREATE INDEX IF NOT EXISTS idx_mkt_messages_campaign ON mkt_messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_mkt_messages_channel ON mkt_messages(channel);
CREATE INDEX IF NOT EXISTS idx_mkt_messages_status ON mkt_messages(status);
CREATE INDEX IF NOT EXISTS idx_mkt_messages_sent ON mkt_messages(sent_at);
