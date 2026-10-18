-- Listo Qasa selected illustrative inventory; do not modify genuine listings.
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_property_type_check;
ALTER TABLE properties ADD CONSTRAINT properties_property_type_check
 CHECK (property_type IS NULL OR property_type IN ('house','apartment','land','commercial','villa','office','retail','warehouse'));
CREATE TABLE IF NOT EXISTS listoqasa_sample_imports (
 external_id TEXT PRIMARY KEY,
 property_id UUID NOT NULL UNIQUE REFERENCES properties(id) ON DELETE RESTRICT,
 group_name TEXT NOT NULL,
 payload JSONB NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lq_sample_group ON listoqasa_sample_imports(group_name);
CREATE TABLE IF NOT EXISTS listoqasa_sample_images (
 external_id TEXT NOT NULL REFERENCES listoqasa_sample_imports(external_id) ON DELETE CASCADE,
 image_index INTEGER NOT NULL CHECK(image_index BETWEEN 0 AND 19),
 image_url TEXT NOT NULL,
 media_id UUID NOT NULL UNIQUE REFERENCES property_media(id) ON DELETE CASCADE,
 PRIMARY KEY(external_id,image_index)
);
