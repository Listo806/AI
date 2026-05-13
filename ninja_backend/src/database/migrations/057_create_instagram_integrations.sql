CREATE TABLE IF NOT EXISTS instagram_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  team_id UUID NOT NULL UNIQUE,

  facebook_page_id TEXT,
  facebook_page_name TEXT,

  instagram_account_id TEXT,
  instagram_username TEXT,

  access_token TEXT NOT NULL,

  sync_enabled BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);