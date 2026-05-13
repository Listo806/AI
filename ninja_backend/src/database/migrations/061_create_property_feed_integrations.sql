CREATE TABLE IF NOT EXISTS property_feed_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  team_id UUID NOT NULL,

  provider_name TEXT,

  feed_url TEXT NOT NULL,

  feed_type TEXT DEFAULT 'xml',

  sync_frequency_minutes INTEGER DEFAULT 60,

  sync_enabled BOOLEAN DEFAULT true,

  total_properties INTEGER DEFAULT 0,

  last_sync_at TIMESTAMP,

  last_error TEXT,

  created_at TIMESTAMP DEFAULT NOW(),

  updated_at TIMESTAMP DEFAULT NOW()
);