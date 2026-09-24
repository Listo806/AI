-- Customer-owned Twilio for Business Phone / Voice / SMS.
-- Credentials are encrypted at rest and isolated by team + workspace.
CREATE TABLE IF NOT EXISTS customer_twilio_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  workspace_id TEXT NOT NULL DEFAULT 'default',
  account_sid TEXT NOT NULL,
  api_key_sid TEXT NOT NULL,
  encrypted_api_key_secret TEXT NOT NULL,
  encrypted_auth_token TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'connected' CHECK (status IN ('connected','disconnected','error')),
  verified_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, workspace_id)
);
CREATE INDEX IF NOT EXISTS idx_customer_twilio_account ON customer_twilio_connections(account_sid) WHERE status='connected';

CREATE TABLE IF NOT EXISTS customer_twilio_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  workspace_id TEXT NOT NULL DEFAULT 'default',
  connection_id UUID NOT NULL REFERENCES customer_twilio_connections(id) ON DELETE CASCADE,
  number_sid TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  friendly_name TEXT,
  voice_capable BOOLEAN NOT NULL DEFAULT FALSE,
  sms_capable BOOLEAN NOT NULL DEFAULT FALSE,
  mms_capable BOOLEAN NOT NULL DEFAULT FALSE,
  selected BOOLEAN NOT NULL DEFAULT FALSE,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, workspace_id, number_sid)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_customer_twilio_selected_number
ON customer_twilio_numbers(team_id, workspace_id) WHERE selected=TRUE;
CREATE INDEX IF NOT EXISTS idx_customer_twilio_phone ON customer_twilio_numbers(phone_number) WHERE selected=TRUE;

CREATE TABLE IF NOT EXISTS customer_twilio_call_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  workspace_id TEXT NOT NULL DEFAULT 'default',
  number_sid TEXT NOT NULL,
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  call_sid TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'queued',
  provider_status TEXT,
  callback_verified BOOLEAN NOT NULL DEFAULT FALSE,
  error_code TEXT,
  error_message TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
