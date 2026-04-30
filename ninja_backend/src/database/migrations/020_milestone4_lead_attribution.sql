-- Milestone 4: Lead Creation + Channel Attribution
-- This migration adds first_source column for immutable first-touch attribution

-- ============================================================================
-- ADD FIRST_SOURCE COLUMN TO LEADS TABLE
-- ============================================================================
-- Store the first-ever channel that generated this lead (immutable)
-- This is separate from 'source' which can be updated for current interaction
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS first_source VARCHAR(100);

-- Add index for analytics queries
CREATE INDEX IF NOT EXISTS idx_leads_first_source ON leads(first_source) 
WHERE first_source IS NOT NULL;

-- Add composite index for source + first_source analytics
CREATE INDEX IF NOT EXISTS idx_leads_source_analytics ON leads(source, first_source) 
WHERE source IS NOT NULL OR first_source IS NOT NULL;

-- ============================================================================
-- ADD PHONE COLUMN TO USERS TABLE (if not exists)
-- ============================================================================
-- Store phone numbers for agents/owners for WhatsApp resolution
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone VARCHAR(50);

-- Add index for phone lookups
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone) 
WHERE phone IS NOT NULL;

-- ============================================================================
-- ADD PHONE AND EMAIL COLUMNS TO BUYERS TABLE (if not exists)
-- ============================================================================
-- Store phone and email for buyer matching
ALTER TABLE buyers 
ADD COLUMN IF NOT EXISTS phone VARCHAR(50);

ALTER TABLE buyers 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Add indexes for buyer matching
CREATE INDEX IF NOT EXISTS idx_buyers_phone ON buyers(phone) 
WHERE phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_buyers_email ON buyers(email) 
WHERE email IS NOT NULL;

-- ============================================================================
-- ADD WHATSAPP_PHONE COLUMN TO TEAMS TABLE (if not exists)
-- ============================================================================
-- Store team-level WhatsApp number as fallback
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS whatsapp_phone VARCHAR(50);

-- Add index for team WhatsApp lookups
CREATE INDEX IF NOT EXISTS idx_teams_whatsapp_phone ON teams(whatsapp_phone) 
WHERE whatsapp_phone IS NOT NULL;

-- ============================================================================
-- ADD ASSIGNED_AGENT_ID COLUMN TO PROPERTIES TABLE (if not exists)
-- ============================================================================
-- Store assigned agent for property (for lead assignment hierarchy)
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS assigned_agent_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add index for assigned agent lookups
CREATE INDEX IF NOT EXISTS idx_properties_assigned_agent ON properties(assigned_agent_id) 
WHERE assigned_agent_id IS NOT NULL;
