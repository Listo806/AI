-- Migration: Add action tracking fields to leads table
-- Purpose: Track lead engagement, activity, and action history for AI sales assistant behavior

-- Add action tracking fields
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS has_responded BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS last_action_type VARCHAR(50), -- 'call', 'whatsapp', 'email', 'sms'
ADD COLUMN IF NOT EXISTS last_action_at TIMESTAMP;

-- Initialize last_activity_at for existing leads (use updated_at as proxy)
UPDATE leads 
SET last_activity_at = updated_at
WHERE last_activity_at IS NULL;

-- Add index for activity-based queries
CREATE INDEX IF NOT EXISTS idx_leads_last_activity_at ON leads(last_activity_at DESC)
WHERE last_activity_at IS NOT NULL;

-- Add index for action tracking queries
CREATE INDEX IF NOT EXISTS idx_leads_last_action_at ON leads(last_action_at DESC)
WHERE last_action_at IS NOT NULL;

-- Add index for response tracking
CREATE INDEX IF NOT EXISTS idx_leads_has_responded ON leads(has_responded)
WHERE has_responded = true;
