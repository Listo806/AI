CREATE TABLE IF NOT EXISTS api_keys_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  team_id UUID NOT NULL,

  api_key TEXT NOT NULL UNIQUE,

  name TEXT,

  last_used_at TIMESTAMP,

  revoked BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT NOW(),

  updated_at TIMESTAMP DEFAULT NOW()
);