-- Add property_type for marketplace search (house, apartment, condo, etc.)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'properties' AND column_name = 'property_type'
  ) THEN
    ALTER TABLE properties ADD COLUMN property_type VARCHAR(50);
    COMMENT ON COLUMN properties.property_type IS 'Kind of property: house, apartment, condo, townhouse, land, commercial, other';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_properties_property_type ON properties(property_type) WHERE property_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_properties_city_type_mode ON properties(city, type) WHERE status = 'published';
