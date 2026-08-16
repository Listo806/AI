-- Customer Service Workspace: Knowledge Base articles.
-- Team-scoped help/support articles. Status is one of Draft / Published / Archived.
-- Only the authenticated account's articles are ever readable (enforced in the
-- service), and any AI retrieval must be constrained to the same team. Industry
-- neutral: no vertical-specific fields.
CREATE TABLE IF NOT EXISTS cs_kb_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  created_by UUID,
  title TEXT,
  body TEXT,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'Draft',
  author_name TEXT,
  tags TEXT[],
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cs_kb_articles_team ON cs_kb_articles(team_id);
CREATE INDEX IF NOT EXISTS idx_cs_kb_articles_status ON cs_kb_articles(status);
CREATE INDEX IF NOT EXISTS idx_cs_kb_articles_category ON cs_kb_articles(category);
