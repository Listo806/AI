-- 102_email_automation.sql
--
-- Email automation + sign-up tracking. Enriches the sign-up record captured
-- before checkout, adds the abandoned-sequence stage marker, and adds the email
-- scheduling/engagement tracking used by the 3-step abandoned flow and the admin
-- Sign-ups / Customers views. All idempotent; the services also self-heal these
-- at runtime since migrations are not auto-run here.

-- --- Enriched sign-up attribution (captured at registration, before checkout) ---
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(5) DEFAULT 'en';
ALTER TABLE users ADD COLUMN IF NOT EXISTS registered_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS landing_page TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS utm_campaign TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS utm_term TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS utm_content TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gclid TEXT;
-- 'exit7' when the visitor came through the $7 exit-intent offer, else 'standard'.
ALTER TABLE users ADD COLUMN IF NOT EXISTS offer_used VARCHAR(32);
-- registered -> checkout_started -> abandoned -> paid
ALTER TABLE users ADD COLUMN IF NOT EXISTS checkout_status VARCHAR(24) DEFAULT 'registered';

-- --- Abandoned-sequence progress (0 none, 1/2/3 = which email was last sent) ---
ALTER TABLE users ADD COLUMN IF NOT EXISTS abandoned_stage SMALLINT NOT NULL DEFAULT 0;
-- once-only welcome marker also used to suppress abandoned emails after payment
ALTER TABLE users ADD COLUMN IF NOT EXISTS welcome_email_sent_at TIMESTAMPTZ;

-- --- Email delivery log (extends 101 email_log with engagement tracking) ---
CREATE TABLE IF NOT EXISTS email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  to_email TEXT NOT NULL,
  template VARCHAR(64) NOT NULL,
  language VARCHAR(5) NOT NULL DEFAULT 'en',
  subject TEXT,
  status VARCHAR(16) NOT NULL DEFAULT 'sent', -- scheduled | sent | skipped | error | canceled
  error TEXT,
  provider VARCHAR(32) NOT NULL DEFAULT 'smtp',
  track_token UUID DEFAULT gen_random_uuid(),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- bring an existing (migration-101) email_log up to the tracking schema
ALTER TABLE email_log ADD COLUMN IF NOT EXISTS track_token UUID DEFAULT gen_random_uuid();
ALTER TABLE email_log ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
ALTER TABLE email_log ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;
ALTER TABLE email_log ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE email_log ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ;
ALTER TABLE email_log ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMPTZ;
-- email_log.status: scheduled | sending | sent | delivered | skipped | error | canceled
CREATE INDEX IF NOT EXISTS idx_email_log_due ON email_log(status, scheduled_at);

CREATE INDEX IF NOT EXISTS idx_email_log_user ON email_log(user_id);
CREATE INDEX IF NOT EXISTS idx_email_log_template ON email_log(template);
CREATE INDEX IF NOT EXISTS idx_email_log_created ON email_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_log_track ON email_log(track_token);

CREATE INDEX IF NOT EXISTS idx_users_checkout_status ON users(checkout_status);
CREATE INDEX IF NOT EXISTS idx_users_abandoned_stage ON users(abandoned_stage);
