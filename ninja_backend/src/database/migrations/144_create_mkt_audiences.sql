-- Marketing audiences (segments). Strictly team-scoped. A 'static' audience is an
-- explicit member list; a 'dynamic' audience stores a filter definition (applied at
-- read time). Member counts are computed from real members, never guessed.
CREATE TABLE IF NOT EXISTS mkt_audiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  created_by UUID,
  name TEXT,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'static',
  status TEXT NOT NULL DEFAULT 'Active',
  filter_json JSONB,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mkt_audiences_team ON mkt_audiences(team_id);
CREATE INDEX IF NOT EXISTS idx_mkt_audiences_status ON mkt_audiences(status);
