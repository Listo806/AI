-- Marketing content library. Real assets (email templates, posts, pages, files),
-- strictly team-scoped. No external content is fabricated — rows exist only when the
-- account creates them.
CREATE TABLE IF NOT EXISTS mkt_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  created_by UUID,
  title TEXT,
  type TEXT NOT NULL DEFAULT 'asset',
  body TEXT,
  url TEXT,
  status TEXT NOT NULL DEFAULT 'Draft',
  tags TEXT[],
  campaign_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mkt_content_team ON mkt_content(team_id);
CREATE INDEX IF NOT EXISTS idx_mkt_content_status ON mkt_content(status);
CREATE INDEX IF NOT EXISTS idx_mkt_content_type ON mkt_content(type);
