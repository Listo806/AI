CREATE TABLE IF NOT EXISTS tiktok_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  team_id UUID NOT NULL UNIQUE,

  app_id TEXT,
  app_secret TEXT,
  access_token TEXT,

  advertiser_id TEXT,

  leadgen_enabled BOOLEAN DEFAULT true,
  auto_sync BOOLEAN DEFAULT true,

  sync_frequency_minutes INTEGER DEFAULT 60,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);