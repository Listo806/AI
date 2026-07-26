-- Dedup / mapping table for imported property-feed listings. Maps a feed's
-- external listing id to the CRM property row it created, so the 5-minute sync
-- updates existing listings instead of inserting duplicates on every run.
CREATE TABLE IF NOT EXISTS property_feed_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id UUID NOT NULL REFERENCES property_feed_integrations(id) ON DELETE CASCADE,
  team_id UUID NOT NULL,
  external_ref TEXT NOT NULL,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (feed_id, external_ref)
);

CREATE INDEX IF NOT EXISTS idx_property_feed_items_feed
ON property_feed_items(feed_id);
