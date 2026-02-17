-- Standardize property_type: allow only house, apartment, land, commercial, villa, office (or NULL)
DO $$
BEGIN
  -- Set any non-standard values to NULL so the constraint can be applied
  UPDATE properties
  SET property_type = NULL
  WHERE property_type IS NOT NULL
    AND LOWER(TRIM(property_type)) NOT IN ('house', 'apartment', 'land', 'commercial', 'villa', 'office');
  -- Drop existing check if any (e.g. from a previous run)
  ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_property_type_check;
  -- Add constraint: NULL or one of the allowed values
  ALTER TABLE properties ADD CONSTRAINT properties_property_type_check
    CHECK (property_type IS NULL OR property_type IN ('house', 'apartment', 'land', 'commercial', 'villa', 'office'));
END $$;
