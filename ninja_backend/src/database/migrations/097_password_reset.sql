-- Password reset: store a one-time reset token (hashed) and its expiry on the
-- user. Forgot-password writes these; reset-password verifies and clears them.
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMPTZ;

-- Fast lookup by token hash during reset (only rows with a pending token).
CREATE INDEX IF NOT EXISTS idx_users_reset_token
  ON users(reset_token_hash)
  WHERE reset_token_hash IS NOT NULL;
