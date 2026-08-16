-- Marketing integration connections. One row per (account, provider). The DEFAULT is
-- no row / 'not_connected', and the API reports a provider as Not Connected until the
-- account explicitly connects it. Performance from an external ad platform is NEVER
-- fabricated here — only a real, connected integration could ever supply it.
CREATE TABLE IF NOT EXISTS mkt_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_connected',
  external_account TEXT,
  config JSONB,
  connected_by UUID,
  connected_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_mkt_integrations_provider
  ON mkt_integrations(team_id, provider);
CREATE INDEX IF NOT EXISTS idx_mkt_integrations_team ON mkt_integrations(team_id);
