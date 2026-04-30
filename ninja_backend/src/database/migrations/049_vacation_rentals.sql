-- ============================================================
-- Migration 049: Vacation Rentals – Hard Data Separation
-- Adds listing_type to properties + vacation_bookings table
-- ============================================================

-- 1. Create the listing_type enum
DO $$ BEGIN
  CREATE TYPE listing_type_enum AS ENUM ('sale', 'rent', 'vacation');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Add listing_type column (nullable first for backfill)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS listing_type TEXT;

-- 3. Backfill: derive listing_type from existing type column
UPDATE properties SET listing_type = type WHERE listing_type IS NULL;

-- 4. Set NOT NULL constraint after backfill
ALTER TABLE properties ALTER COLUMN listing_type SET NOT NULL;

-- 5. Add CHECK constraint to enforce allowed values
-- Skip if migration 051 has already replaced it with the marketplace/vacation vertical
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_properties_listing_type_vertical'
      AND conrelid = 'properties'::regclass
  ) THEN
    ALTER TABLE properties ADD CONSTRAINT chk_listing_type
      CHECK (listing_type IN ('sale', 'rent', 'vacation'));
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 6. Set default for new rows
ALTER TABLE properties ALTER COLUMN listing_type SET DEFAULT 'sale';

-- 7. Index for fast filtering
CREATE INDEX IF NOT EXISTS idx_properties_listing_type ON properties(listing_type);

-- 8. Vacation Bookings table (for availability checks)
CREATE TABLE IF NOT EXISTS vacation_bookings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id   UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  booking_start DATE NOT NULL,
  booking_end   DATE NOT NULL,
  guest_name    TEXT,
  guest_email   TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_booking_dates CHECK (booking_end > booking_start)
);

CREATE INDEX IF NOT EXISTS idx_vacation_bookings_property  ON vacation_bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_vacation_bookings_dates     ON vacation_bookings(property_id, booking_start, booking_end);
