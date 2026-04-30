-- Add stored thumbnail_url to properties (fallback: primary image, then first by display_order)
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR(500);

CREATE INDEX IF NOT EXISTS idx_properties_thumbnail_url ON properties(thumbnail_url) WHERE thumbnail_url IS NOT NULL;
