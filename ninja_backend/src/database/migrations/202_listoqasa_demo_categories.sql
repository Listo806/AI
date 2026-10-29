-- Demo catalogue categories; existing listings remain untouched.
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_property_type_check;
ALTER TABLE properties ADD CONSTRAINT properties_property_type_check CHECK (property_type IS NULL OR property_type IN ('house','apartment','land','commercial','villa','office','retail','warehouse','apartment_development','house_development','mixed_use_development'));
