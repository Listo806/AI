-- 101_email_localization_and_tracking.sql
--
-- Platform lifecycle email: user language preference, once-only send markers,
-- and a delivery log for admin tracking. All statements are idempotent; the
-- PlatformMailerService also applies these at runtime (self-healing) since
-- migrations are not auto-run in this environment.

-- Language the user picked at signup / in the app (drives localized emails + UI).
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(5) DEFAULT 'en';

-- Once-only markers so welcome + abandoned-signup each send exactly once.
ALTER TABLE users ADD COLUMN IF NOT EXISTS welcome_email_sent_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS abandoned_email_sent_at TIMESTAMPTZ;

-- Delivery log for the admin email-tracking view.
CREATE TABLE IF NOT EXISTS email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  to_email TEXT NOT NULL,
  template VARCHAR(64) NOT NULL,
  language VARCHAR(5) NOT NULL DEFAULT 'en',
  subject TEXT,
  status VARCHAR(16) NOT NULL DEFAULT 'sent', -- sent | skipped | error
  error TEXT,
  provider VARCHAR(32) NOT NULL DEFAULT 'smtp',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_log_user ON email_log(user_id);
CREATE INDEX IF NOT EXISTS idx_email_log_template ON email_log(template);
CREATE INDEX IF NOT EXISTS idx_email_log_created ON email_log(created_at DESC);
