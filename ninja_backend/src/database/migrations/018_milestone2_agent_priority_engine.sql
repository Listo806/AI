-- Milestone 2: Agent Priority Engine
-- This migration adds tables for trigger history, intent snapshots, agent engagements, and buyer-lead linking

-- ============================================================================
-- ADD BUYER_ID TO LEADS TABLE
-- ============================================================================
-- Link buyers to leads when they contact via property
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES buyers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_leads_buyer_id ON leads(buyer_id) WHERE buyer_id IS NOT NULL;

-- ============================================================================
-- INTENT SCORE SNAPSHOTS TABLE
-- ============================================================================
-- Store periodic snapshots of intent scores for spike detection
CREATE TABLE IF NOT EXISTS intent_score_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  score DECIMAL(5, 2) NOT NULL CHECK (score >= 0 AND score <= 100),
  snapshot_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_intent_snapshots_buyer_id ON intent_score_snapshots(buyer_id);
CREATE INDEX IF NOT EXISTS idx_intent_snapshots_snapshot_at ON intent_score_snapshots(snapshot_at);
CREATE INDEX IF NOT EXISTS idx_intent_snapshots_buyer_snapshot ON intent_score_snapshots(buyer_id, snapshot_at DESC);

-- ============================================================================
-- BUYER TRIGGER HISTORY TABLE
-- ============================================================================
-- Track all triggers fired for buyers to prevent duplicates and enforce cooldowns
CREATE TABLE IF NOT EXISTS buyer_trigger_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trigger_type VARCHAR(50) NOT NULL, -- 'intent_spike', 'new_matching_listing', 'market_scarcity'
  triggered_at TIMESTAMP DEFAULT NOW(),
  cooldown_until TIMESTAMP NOT NULL, -- When this trigger can fire again
  metadata JSONB, -- Additional trigger-specific data (property_id, zone_id, etc.)
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_trigger_history_buyer_id ON buyer_trigger_history(buyer_id);
CREATE INDEX IF NOT EXISTS idx_trigger_history_agent_id ON buyer_trigger_history(agent_id);
CREATE INDEX IF NOT EXISTS idx_trigger_history_trigger_type ON buyer_trigger_history(trigger_type);
CREATE INDEX IF NOT EXISTS idx_trigger_history_triggered_at ON buyer_trigger_history(triggered_at);
CREATE INDEX IF NOT EXISTS idx_trigger_history_cooldown_until ON buyer_trigger_history(cooldown_until);
CREATE INDEX IF NOT EXISTS idx_trigger_history_buyer_agent ON buyer_trigger_history(buyer_id, agent_id);
CREATE INDEX IF NOT EXISTS idx_trigger_history_buyer_agent_type ON buyer_trigger_history(buyer_id, agent_id, trigger_type);

-- ============================================================================
-- AGENT BUYER ENGAGEMENTS TABLE
-- ============================================================================
-- Track when agents engage with buyers (suppresses triggers during cooldown)
CREATE TABLE IF NOT EXISTS agent_buyer_engagements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL, -- Optional link to lead
  engagement_type VARCHAR(50) NOT NULL, -- 'lead_created', 'lead_updated', 'contact_attempt', 'note_added', 'whatsapp_click', 'call_click', 'email_click'
  engagement_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB, -- Additional engagement data
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_engagements_agent_id ON agent_buyer_engagements(agent_id);
CREATE INDEX IF NOT EXISTS idx_engagements_buyer_id ON agent_buyer_engagements(buyer_id);
CREATE INDEX IF NOT EXISTS idx_engagements_lead_id ON agent_buyer_engagements(lead_id);
CREATE INDEX IF NOT EXISTS idx_engagements_engagement_at ON agent_buyer_engagements(engagement_at);
CREATE INDEX IF NOT EXISTS idx_engagements_agent_buyer ON agent_buyer_engagements(agent_id, buyer_id);
CREATE INDEX IF NOT EXISTS idx_engagements_agent_buyer_at ON agent_buyer_engagements(agent_id, buyer_id, engagement_at DESC);

-- ============================================================================
-- ZONE SCARCITY HISTORY TABLE
-- ============================================================================
-- Track historical scarcity state changes for market scarcity triggers
CREATE TABLE IF NOT EXISTS zone_scarcity_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  is_scarcity BOOLEAN NOT NULL,
  active_listings_count INTEGER NOT NULL,
  changed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_scarcity_history_zone_id ON zone_scarcity_history(zone_id);
CREATE INDEX IF NOT EXISTS idx_scarcity_history_changed_at ON zone_scarcity_history(changed_at);
CREATE INDEX IF NOT EXISTS idx_scarcity_history_zone_changed ON zone_scarcity_history(zone_id, changed_at DESC);
