-- Requests submitted from /dashboard/integrations for integrations that are not yet available.
-- The service also ensures this table at runtime for environments where migrations are manual.
CREATE TABLE IF NOT EXISTS integration_requests (
  id BIGSERIAL PRIMARY KEY,
  integration_key TEXT,
  integration_name TEXT NOT NULL,
  user_id UUID NOT NULL,
  team_id UUID NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  workspace_id TEXT,
  message TEXT NOT NULL,
  email_to TEXT NOT NULL DEFAULT 'support@cortexaaicrm.com',
  email_status VARCHAR(16) NOT NULL DEFAULT 'pending',
  email_error TEXT,
  emailed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_integration_requests_team_created
  ON integration_requests(team_id, created_at DESC);
