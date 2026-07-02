-- =========================================
-- DEALS: lost_reason and expected_close_date
-- Backing fields for Analytics "Lost Deal Reasons" and Dashboard "Upcoming Closings".
-- Additive only; existing rows keep NULL (UI shows honest empty states until populated).
-- =========================================

ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS lost_reason TEXT,
  ADD COLUMN IF NOT EXISTS expected_close_date DATE;

CREATE INDEX IF NOT EXISTS idx_deals_expected_close_date
  ON deals(expected_close_date)
  WHERE expected_close_date IS NOT NULL;
