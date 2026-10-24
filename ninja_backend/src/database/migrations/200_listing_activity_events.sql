-- Counts start when this migration and the tracking API are deployed.
-- Session keys are random browser-generated values, not IPs or personal identifiers.
CREATE TABLE IF NOT EXISTS listing_activity_events (
  id BIGSERIAL PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  owner_account_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(24) NOT NULL CHECK (event_type IN ('view','inquiry','contact_click')),
  session_key VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS listing_activity_unique_session_view
 ON listing_activity_events(listing_id, session_key) WHERE event_type='view' AND session_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS listing_activity_owner_type_date
 ON listing_activity_events(owner_account_id,event_type,created_at DESC);
CREATE INDEX IF NOT EXISTS listing_activity_listing_type
 ON listing_activity_events(listing_id,event_type);
