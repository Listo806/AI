-- Attribution, completed: the rest of the first visit, the visit that brought a
-- customer back, the city, and a copy of both on the purchase itself.
--
-- The first touch is written once and never changed. The last touch is meant to
-- change, and is stored in its own columns so it can never overwrite the first.
-- Every column is optional: a visitor with no campaign information is simply a
-- direct visit, and nothing about sign-up or payment depends on these values.

ALTER TABLE users ADD COLUMN IF NOT EXISTS first_touch_term TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_touch_content TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_touch_landing_page TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_touch_channel TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_touch_keyword_theme TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_touch_campaign_cluster TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_touch_language VARCHAR(8);

ALTER TABLE users ADD COLUMN IF NOT EXISTS last_touch_source TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_touch_medium TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_touch_campaign TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_touch_term TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_touch_content TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_touch_landing_route TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_touch_landing_page TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_touch_channel TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_touch_keyword_theme TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_touch_campaign_cluster TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_touch_referrer_host TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_touch_language VARCHAR(8);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_visit_at TIMESTAMPTZ;

-- Alongside the country and the region already stored for each sign-up.
ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_city VARCHAR(80);

-- Where this particular purchase came from, copied from the customer when the
-- subscription is created. Kept on the purchase so a revenue report by campaign
-- reads one row and cannot be changed by a later visit through another channel.
ALTER TABLE nuvei_subscriptions ADD COLUMN IF NOT EXISTS acquisition JSONB;

-- Stamped when a renewal has been reported to the analytics account, so the
-- same renewal is never reported twice.
ALTER TABLE nuvei_transactions ADD COLUMN IF NOT EXISTS analytics_reported_at TIMESTAMPTZ;

-- Reports group by these, so give the heaviest two an index.
CREATE INDEX IF NOT EXISTS users_first_touch_campaign_idx
  ON users (first_touch_campaign)
  WHERE first_touch_campaign IS NOT NULL;
CREATE INDEX IF NOT EXISTS users_last_touch_campaign_idx
  ON users (last_touch_campaign)
  WHERE last_touch_campaign IS NOT NULL;
