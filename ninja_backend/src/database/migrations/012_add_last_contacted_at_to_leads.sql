-- Migration: Add last_contacted_at column to leads table
-- Purpose: Track when leads were actually contacted for accurate AI urgency calculations
-- and follow-up recommendations

-- Add last_contacted_at column (nullable, as existing leads may not have contact history)
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMP;

-- Backfill existing data: Set last_contacted_at for leads with status indicating contact
-- Use updated_at as a proxy for when they were last contacted
UPDATE leads 
SET last_contacted_at = updated_at
WHERE status IN ('contacted', 'qualified', 'follow-up', 'closed-won', 'closed-lost')
  AND last_contacted_at IS NULL;

-- Add index for performance (queries filtering by last_contacted_at)
CREATE INDEX IF NOT EXISTS idx_leads_last_contacted_at ON leads(last_contacted_at DESC)
WHERE last_contacted_at IS NOT NULL;

-- Add composite index for AI urgency calculations (status + last_contacted_at)
CREATE INDEX IF NOT EXISTS idx_leads_status_last_contacted ON leads(status, last_contacted_at DESC)
WHERE last_contacted_at IS NOT NULL;
