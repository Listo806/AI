-- ============================================================
-- Migration 052: Max Guests for Vacation Rentals
-- Adds max_guests column to properties (nullable, optional)
-- Backfills vacation listings with bedrooms * 2 as a sensible default
-- ============================================================

ALTER TABLE properties ADD COLUMN IF NOT EXISTS max_guests INTEGER;

-- Backfill vacation listings only: assume 2 guests per bedroom
UPDATE properties
SET max_guests = GREATEST(1, COALESCE(bedrooms, 1) * 2)
WHERE listing_type = 'vacation' AND max_guests IS NULL;

-- Guard against negative / zero values
DO $$ BEGIN
  ALTER TABLE properties ADD CONSTRAINT chk_max_guests_positive
    CHECK (max_guests IS NULL OR max_guests >= 1);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_properties_max_guests ON properties(max_guests);
