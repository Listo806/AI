CREATE TABLE google_ads_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  team_id UUID NOT NULL,

  google_ads_account_id TEXT,
  google_ads_account_name TEXT,

  access_token TEXT,
  refresh_token TEXT,

  conversion_tracking_enabled BOOLEAN DEFAULT true,

  selected_campaign_ids JSONB DEFAULT '[]',

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);