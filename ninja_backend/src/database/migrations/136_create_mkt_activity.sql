-- Marketing Workspace: activity / audit history.
-- An append-only history of meaningful marketing events (campaign created/edited/
-- scheduled/activated/paused/completed, audience created, contact added, email/SMS
-- sent, form submitted, lead created, conversion recorded, automation executed).
-- Team-scoped. Drives the Recent Activity panel from REAL events (never fabricated).
CREATE TABLE IF NOT EXISTS mkt_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  actor_id UUID,
  actor_name TEXT,
  action TEXT NOT NULL,
  subject TEXT,
  entity_type TEXT,
  entity_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mkt_activity_team ON mkt_activity(team_id);
CREATE INDEX IF NOT EXISTS idx_mkt_activity_created ON mkt_activity(created_at);
