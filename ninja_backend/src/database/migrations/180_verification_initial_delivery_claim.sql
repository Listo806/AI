-- Keep payment confirmation recoverable if the first verification email fails.
-- This is a short-lived delivery claim, not an activation flag.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS verification_email_initial_claimed_at TIMESTAMPTZ;
