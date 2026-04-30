-- Marketplace: country for Ecuador-only public listings + map data
ALTER TABLE properties ADD COLUMN IF NOT EXISTS country VARCHAR(100);

UPDATE properties
SET country = 'ecuador'
WHERE country IS NULL OR TRIM(country) = '';

ALTER TABLE properties ALTER COLUMN country SET DEFAULT 'ecuador';

ALTER TABLE properties ALTER COLUMN country SET NOT NULL;

COMMENT ON COLUMN properties.country IS 'Marketplace region; public sale/rent search is restricted to ecuador';

CREATE INDEX IF NOT EXISTS idx_properties_country_status_listing
  ON properties (country, status, listing_type)
  WHERE status = 'published';
