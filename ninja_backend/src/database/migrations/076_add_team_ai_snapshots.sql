CREATE TABLE team_ai_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  team_id UUID NOT NULL,

  productivity_score INT DEFAULT 0,
  collaboration_score INT DEFAULT 0,
  efficiency_score INT DEFAULT 0,
  health_score INT DEFAULT 0,

  pipeline_value NUMERIC DEFAULT 0,
  conversion_rate INT DEFAULT 0,

  active_leads INT DEFAULT 0,
  inactive_leads INT DEFAULT 0,

  won_deals INT DEFAULT 0,
  lost_deals INT DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW()
);