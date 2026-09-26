-- Attribution: search intent and competitor, only when a campaign link declares
-- them (utm_intent / intent / cx_intent and utm_competitor / competitor /
-- cx_competitor). Never inferred from anything else: an empty value means the
-- visit did not say, and the report shows it as Unknown. The first-touch pair is
-- write-once like the rest of the first touch; the last-touch pair follows the
-- visit that brought the customer back. Both are optional and nothing about
-- sign-up or payment depends on them. The same columns are also ensured at
-- runtime (ACQUISITION_EXTRA_COLUMNS), because migrations are not auto-run in
-- every environment. Idempotent.

ALTER TABLE users ADD COLUMN IF NOT EXISTS first_touch_intent TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_touch_competitor TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_touch_intent TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_touch_competitor TEXT;
