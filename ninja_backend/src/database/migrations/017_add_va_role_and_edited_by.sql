-- Add VA role and edited_by tracking for properties
-- This migration adds the VA (Virtual Assistant) role and enables tracking of who edited properties

-- ============================================================================
-- ADD VA ROLE TO USERS TABLE
-- ============================================================================
-- Drop the existing CHECK constraint on role column if it exists
DO $$ 
DECLARE
  constraint_name TEXT;
BEGIN
  -- Try to find and drop the constraint by exact name first
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'users'::regclass
    AND conname = 'users_role_check'
  ) THEN
    ALTER TABLE users DROP CONSTRAINT users_role_check;
  ELSE
    -- If not found by name, try to find it by definition pattern
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'users'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%role%IN%';
    
    -- Drop the constraint if found
    IF constraint_name IS NOT NULL THEN
      EXECUTE format('ALTER TABLE users DROP CONSTRAINT %I', constraint_name);
    END IF;
  END IF;
END $$;

-- First, fix any existing users with invalid roles (set to 'owner' as default)
-- This prevents constraint violation when adding the new constraint
UPDATE users 
SET role = 'owner' 
WHERE role NOT IN ('owner', 'agent', 'developer', 'admin', 'wholesaler', 'investor', 'va');

-- Add the new CHECK constraint with all roles including VA
ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('owner', 'agent', 'developer', 'admin', 'wholesaler', 'investor', 'va'));

-- ============================================================================
-- ADD EDITED_BY TO PROPERTIES TABLE
-- ============================================================================
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS edited_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_properties_edited_by ON properties(edited_by);
