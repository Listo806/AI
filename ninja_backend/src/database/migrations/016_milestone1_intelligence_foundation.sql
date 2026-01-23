-- Milestone 1: Intelligence Foundation
-- This migration adds zones, buyers, buyer events, intent scoring, and market signals

-- ============================================================================
-- ZONES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city VARCHAR(100) NOT NULL,
  neighborhood VARCHAR(100), -- Optional neighborhood/sector
  name VARCHAR(200) NOT NULL, -- Display name: "City – Neighborhood" or just "City"
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(city, neighborhood) -- Ensure unique zone per city+neighborhood combo
);

-- Index for zone lookups
CREATE INDEX IF NOT EXISTS idx_zones_city ON zones(city);
CREATE INDEX IF NOT EXISTS idx_zones_name ON zones(name);

-- ============================================================================
-- ADD ZONE_ID TO PROPERTIES TABLE
-- ============================================================================
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS zone_id UUID REFERENCES zones(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_properties_zone_id ON properties(zone_id);

-- ============================================================================
-- BUYERS TABLE (Anonymous buyer tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS buyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Linked when buyer registers
  session_id VARCHAR(255), -- Session identifier
  ip_hash VARCHAR(64), -- Hashed IP address (fallback only)
  user_agent_hash VARCHAR(64), -- Hashed user agent (fallback only)
  first_seen_at TIMESTAMP DEFAULT NOW(),
  last_activity_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for buyer lookups
CREATE INDEX IF NOT EXISTS idx_buyers_user_id ON buyers(user_id);
CREATE INDEX IF NOT EXISTS idx_buyers_session_id ON buyers(session_id);
CREATE INDEX IF NOT EXISTS idx_buyers_last_activity ON buyers(last_activity_at);

-- ============================================================================
-- BUYER EVENTS TABLE (All buyer behavior events)
-- ============================================================================
CREATE TABLE IF NOT EXISTS buyer_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- 'property_search', 'filters_applied', 'listing_view', 'revisit', 'contacted'
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
  metadata JSONB, -- Additional event-specific data (filters, search terms, etc.)
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_buyer_events_buyer_id ON buyer_events(buyer_id);
CREATE INDEX IF NOT EXISTS idx_buyer_events_event_type ON buyer_events(event_type);
CREATE INDEX IF NOT EXISTS idx_buyer_events_property_id ON buyer_events(property_id);
CREATE INDEX IF NOT EXISTS idx_buyer_events_zone_id ON buyer_events(zone_id);
CREATE INDEX IF NOT EXISTS idx_buyer_events_created_at ON buyer_events(created_at);
CREATE INDEX IF NOT EXISTS idx_buyer_events_buyer_type_created ON buyer_events(buyer_id, event_type, created_at);

-- ============================================================================
-- BUYER INTENT SCORES TABLE (Current intent score per buyer)
-- ============================================================================
CREATE TABLE IF NOT EXISTS buyer_intent_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL UNIQUE REFERENCES buyers(id) ON DELETE CASCADE,
  score DECIMAL(5, 2) NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  last_calculated_at TIMESTAMP DEFAULT NOW(),
  last_activity_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for score queries
CREATE INDEX IF NOT EXISTS idx_buyer_intent_scores_buyer_id ON buyer_intent_scores(buyer_id);
CREATE INDEX IF NOT EXISTS idx_buyer_intent_scores_score ON buyer_intent_scores(score);
CREATE INDEX IF NOT EXISTS idx_buyer_intent_scores_last_activity ON buyer_intent_scores(last_activity_at);

-- ============================================================================
-- BUYER INTENT SCORE LOGS TABLE (All score changes with before/after + reason)
-- ============================================================================
CREATE TABLE IF NOT EXISTS buyer_intent_score_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  score_before DECIMAL(5, 2) NOT NULL,
  score_after DECIMAL(5, 2) NOT NULL,
  change_reason VARCHAR(200) NOT NULL, -- 'event:property_search', 'decay:5%', 'event:contacted', etc.
  event_id UUID REFERENCES buyer_events(id) ON DELETE SET NULL, -- Link to event if applicable
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for score log queries
CREATE INDEX IF NOT EXISTS idx_buyer_intent_score_logs_buyer_id ON buyer_intent_score_logs(buyer_id);
CREATE INDEX IF NOT EXISTS idx_buyer_intent_score_logs_created_at ON buyer_intent_score_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_buyer_intent_score_logs_event_id ON buyer_intent_score_logs(event_id);

-- ============================================================================
-- BUYER PROPERTY VIEWS TABLE (Track last view per buyer per property for revisit detection)
-- ============================================================================
CREATE TABLE IF NOT EXISTS buyer_property_views (
  buyer_id UUID NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  first_viewed_at TIMESTAMP DEFAULT NOW(),
  last_viewed_at TIMESTAMP DEFAULT NOW(),
  view_count INTEGER DEFAULT 1,
  PRIMARY KEY (buyer_id, property_id)
);

-- Index for efficient revisit detection
CREATE INDEX IF NOT EXISTS idx_buyer_property_views_buyer_id ON buyer_property_views(buyer_id);
CREATE INDEX IF NOT EXISTS idx_buyer_property_views_property_id ON buyer_property_views(property_id);
CREATE INDEX IF NOT EXISTS idx_buyer_property_views_last_viewed ON buyer_property_views(buyer_id, last_viewed_at);
