CREATE TABLE IF NOT EXISTS mls_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  team_id UUID UNIQUE NOT NULL,

  provider_name TEXT,
  country TEXT,

  integration_type TEXT,

  endpoint_url TEXT,

  username TEXT,
  password TEXT,

  api_key TEXT,

  sync_enabled BOOLEAN DEFAULT true,

  sync_frequency_minutes INTEGER DEFAULT 60,

  compatibility_mode TEXT DEFAULT 'reso',

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);