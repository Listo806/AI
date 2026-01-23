-- Migration: Update lead status enum to include Follow-Up, Closed-Won, Closed-Lost
-- Purpose: Support AI CRM lead status management with more granular statuses

-- Update existing 'converted' status to 'closed-won'
UPDATE leads 
SET status = 'closed-won' 
WHERE status = 'converted';

-- Update existing 'lost' status to 'closed-lost'
UPDATE leads 
SET status = 'closed-lost' 
WHERE status = 'lost';

-- Drop the old check constraint if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'leads_status_check'
  ) THEN
    ALTER TABLE leads DROP CONSTRAINT leads_status_check;
  END IF;
END $$;

-- Add new check constraint with updated statuses
ALTER TABLE leads 
ADD CONSTRAINT leads_status_check 
CHECK (status IN ('new', 'contacted', 'qualified', 'follow-up', 'closed-won', 'closed-lost'));

-- Add index for status filtering (if not exists)
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
