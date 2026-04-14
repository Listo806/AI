-- ============================================================
-- Migration 053: Amenities + Reviews for Vacation Rentals
-- - properties.amenities JSONB array of slugs (e.g. ["wifi", "pool"])
-- - property_reviews table for guest reviews + rating
-- ============================================================

-- 1. Amenities column (array of canonical slugs)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS amenities JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_properties_amenities_gin ON properties USING GIN (amenities);

-- 2. Property reviews
CREATE TABLE IF NOT EXISTS property_reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id     UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  reviewer_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewer_name   TEXT,
  rating          NUMERIC(2, 1) NOT NULL,
  comment         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_rating_range CHECK (rating >= 1 AND rating <= 5)
);

CREATE INDEX IF NOT EXISTS idx_property_reviews_property ON property_reviews(property_id);
CREATE INDEX IF NOT EXISTS idx_property_reviews_created  ON property_reviews(created_at DESC);
