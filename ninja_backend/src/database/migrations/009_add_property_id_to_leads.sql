-- Migration: Add property_id column to leads table
-- Purpose: Enable lead-to-property relationships for:
--   - Property-based lead assignment (Milestone 4)
--   - Tracking which property generated which leads
--   - AI matching and analytics
--   - CRM dashboard property context

-- Add property_id column to leads table (nullable, as leads can exist without properties)
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES properties(id) ON DELETE SET NULL;

-- Add index for performance (property-based queries)
CREATE INDEX IF NOT EXISTS idx_leads_property_id ON leads(property_id) 
WHERE property_id IS NOT NULL;

-- Add composite index for property + status queries (for analytics and filtering)
CREATE INDEX IF NOT EXISTS idx_leads_property_status ON leads(property_id, status) 
WHERE property_id IS NOT NULL;

-- Add index for property + created_at (for recent leads by property)
CREATE INDEX IF NOT EXISTS idx_leads_property_created ON leads(property_id, created_at DESC) 
WHERE property_id IS NOT NULL;
