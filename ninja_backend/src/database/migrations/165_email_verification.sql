-- Post-payment email verification / account activation.
-- Raw verification tokens are NEVER stored; only SHA-256 hashes are persisted.

ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status VARCHAR(48) DEFAULT 'registered';
ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_activated_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_email_sent_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_email_resent_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pending_email_changed_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_failed_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pending_payment_status VARCHAR(32);

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  invalidated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user
  ON email_verification_tokens(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS account_activation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(64) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_account_activation_events_user
  ON account_activation_events(user_id, created_at DESC);
