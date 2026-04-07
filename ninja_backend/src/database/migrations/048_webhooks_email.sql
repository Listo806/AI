-- ============================================================
-- Migration 048: Webhooks & Email Provider (SendGrid)
-- ============================================================

-- 1. Webhook Endpoints
CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id       UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,
  events        JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  secret_token  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_team_id ON webhook_endpoints(team_id);
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_active  ON webhook_endpoints(team_id, is_active);

-- 2. Webhook Logs
CREATE TABLE IF NOT EXISTS webhook_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id         UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  endpoint_id     UUID REFERENCES webhook_endpoints(id) ON DELETE SET NULL,
  event_name      TEXT NOT NULL,
  endpoint_url    TEXT NOT NULL,
  status_code     INTEGER,
  success         BOOLEAN NOT NULL DEFAULT false,
  response_time_ms INTEGER,
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_team_id   ON webhook_logs(team_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created   ON webhook_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_endpoint  ON webhook_logs(endpoint_id);

-- 3. Team Email Config (SendGrid)
-- Stores per-team SendGrid API key + sender email
CREATE TABLE IF NOT EXISTS team_email_config (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id         UUID NOT NULL UNIQUE REFERENCES teams(id) ON DELETE CASCADE,
  sendgrid_api_key TEXT NOT NULL,
  from_email      TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
