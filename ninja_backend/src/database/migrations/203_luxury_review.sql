-- Explicit, reviewable Luxury designation; never inferred from price or keywords.
ALTER TABLE properties ADD COLUMN IF NOT EXISTS luxury_status varchar(16) NOT NULL DEFAULT 'none';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS luxury_requested_at timestamptz;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS luxury_reviewed_at timestamptz;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS luxury_reviewed_by uuid;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS luxury_review_note text;
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_luxury_status_check;
ALTER TABLE properties ADD CONSTRAINT properties_luxury_status_check CHECK (luxury_status IN ('none','pending','approved','rejected'));
CREATE INDEX IF NOT EXISTS idx_properties_approved_luxury ON properties (published_at DESC, id) WHERE luxury_status='approved' AND status='published' AND listing_type='marketplace';
