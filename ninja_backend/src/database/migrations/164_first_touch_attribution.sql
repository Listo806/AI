-- First-touch acquisition: where a customer originally came from.
--
-- Written once when the account is created and never changed afterwards, so a
-- customer who later returns through Google, social or direct traffic keeps the
-- source that first brought them in. Deliberately separate from signup_country,
-- which is resolved from the request and stays exactly as it is.
--
-- Migrations are not auto-run in this environment, so the same columns are also
-- created on demand by the sign-up and admin read paths. Every statement here is
-- idempotent and safe to run more than once.

ALTER TABLE users ADD COLUMN IF NOT EXISTS first_touch_source TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_touch_medium TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_touch_campaign TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_touch_landing_route TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_visit_at TIMESTAMPTZ;

-- Reporting by acquisition source ("show me every business card customer") is
-- the only query pattern here, and it is always narrowed to a small subset.
CREATE INDEX IF NOT EXISTS idx_users_first_touch_source
  ON users (LOWER(first_touch_source))
  WHERE first_touch_source IS NOT NULL;
