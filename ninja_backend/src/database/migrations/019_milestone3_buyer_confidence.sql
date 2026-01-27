-- Milestone 3: Buyer Confidence + Match Intelligence
-- This migration adds tables for match explanations and comps caching

-- ============================================================================
-- LISTING MATCH EXPLANATIONS TABLE
-- ============================================================================
-- Store match explanations per buyer + listing combination
CREATE TABLE IF NOT EXISTS listing_match_explanations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  why_fits JSONB NOT NULL, -- Array of strings (bullet points)
  why_now TEXT, -- Single text string (market context)
  calculated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL, -- 24 hours from calculation
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(listing_id, buyer_id)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_match_explanations_listing_id ON listing_match_explanations(listing_id);
CREATE INDEX IF NOT EXISTS idx_match_explanations_buyer_id ON listing_match_explanations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_match_explanations_listing_buyer ON listing_match_explanations(listing_id, buyer_id);
CREATE INDEX IF NOT EXISTS idx_match_explanations_expires_at ON listing_match_explanations(expires_at);

-- ============================================================================
-- LISTING COMPS CACHE TABLE
-- ============================================================================
-- Cache comparable listings per listing + buyer combination
CREATE TABLE IF NOT EXISTS listing_comps_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  comp_listing_ids UUID[] NOT NULL, -- Array of comparable listing IDs
  calculated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL, -- 24 hours from calculation
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(listing_id, buyer_id)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_comps_cache_listing_id ON listing_comps_cache(listing_id);
CREATE INDEX IF NOT EXISTS idx_comps_cache_buyer_id ON listing_comps_cache(buyer_id);
CREATE INDEX IF NOT EXISTS idx_comps_cache_listing_buyer ON listing_comps_cache(listing_id, buyer_id);
CREATE INDEX IF NOT EXISTS idx_comps_cache_expires_at ON listing_comps_cache(expires_at);
