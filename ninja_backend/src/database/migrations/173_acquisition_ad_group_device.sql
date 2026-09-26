-- Attribution: the Google Ads ad group and the device category of the first
-- visit (write-once, like the rest of the first touch) and of the visit that
-- brought the customer back. Both are optional: a direct visit, or a campaign
-- without an ad-group tag, simply leaves them empty and nothing about sign-up or
-- payment depends on them. The same columns are also ensured at runtime by
-- ensureAcquisitionColumns / the trial sign-up, because migrations are not
-- auto-run in every environment.

ALTER TABLE users ADD COLUMN IF NOT EXISTS first_touch_ad_group TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_touch_device VARCHAR(16);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_touch_ad_group TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_touch_device VARCHAR(16);

-- Stamped when the activation payment has been reported to GA4 as the
-- server-side payment_confirmed_backend event, so it is never sent twice.
ALTER TABLE nuvei_subscriptions ADD COLUMN IF NOT EXISTS analytics_activation_reported_at TIMESTAMPTZ;
