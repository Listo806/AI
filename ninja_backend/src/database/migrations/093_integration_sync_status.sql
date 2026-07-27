-- Sync status columns for the customer-connected TikTok and MLS integrations,
-- plus a dedup/mapping table for imported MLS listings (mirrors
-- property_feed_items) so repeated MLS syncs update existing listings instead
-- of creating duplicates.
ALTER TABLE tiktok_integrations ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP;
ALTER TABLE tiktok_integrations ADD COLUMN IF NOT EXISTS last_error TEXT;

ALTER TABLE mls_integrations ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP;
ALTER TABLE mls_integrations ADD COLUMN IF NOT EXISTS last_error TEXT;

CREATE TABLE IF NOT EXISTS mls_listing_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  external_ref TEXT NOT NULL,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (team_id, external_ref)
);

CREATE INDEX IF NOT EXISTS idx_mls_listing_items_team
ON mls_listing_items(team_id);
