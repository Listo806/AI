-- Ensure only one primary image per property (data integrity)
-- First fix any existing duplicates: keep one primary per property (lowest id)
UPDATE property_media pm
SET is_primary = false
WHERE pm.is_primary = true
  AND pm.id NOT IN (
    SELECT DISTINCT ON (property_id) id
    FROM property_media
    WHERE is_primary = true
    ORDER BY property_id, display_order ASC, id ASC
  );

CREATE UNIQUE INDEX IF NOT EXISTS idx_property_media_unique_primary
  ON property_media (property_id) WHERE is_primary = true;
