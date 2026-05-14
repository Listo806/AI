CREATE TABLE make_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  team_id UUID NOT NULL,

  name TEXT NOT NULL,

  trigger_event TEXT NOT NULL,

  webhook_secret TEXT NOT NULL,

  webhook_url TEXT NOT NULL,

  enabled BOOLEAN DEFAULT true,

  last_triggered_at TIMESTAMP NULL,

  created_at TIMESTAMP DEFAULT NOW(),

  updated_at TIMESTAMP DEFAULT NOW()
);