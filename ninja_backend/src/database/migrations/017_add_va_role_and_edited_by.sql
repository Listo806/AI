-- Add VA role and edited_by tracking for properties
-- This migration adds the VA (Virtual Assistant) role and enables tracking of who edited properties

-- ============================================================================
-- ADD VA ROLE TO USERS TABLE
-- ============================================================================
-- Step 1: Check if constraint already includes 'va'
DO $$
DECLARE
  constraint_def TEXT;
  has_va BOOLEAN := false;
BEGIN
  -- Get current constraint definition if it exists
  SELECT pg_get_constraintdef(oid) INTO constraint_def
  FROM pg_constraint
  WHERE conrelid = 'users'::regclass
  AND conname = 'users_role_check'
  LIMIT 1;
  
  IF constraint_def IS NOT NULL THEN
    has_va := constraint_def LIKE '%va%';
    
    -- If constraint already has 'va', skip this migration
    IF has_va THEN
      RAISE NOTICE 'Constraint already includes va role - skipping migration';
      RETURN;
    END IF;
  END IF;
  
  -- Step 2: Drop existing constraint
  BEGIN
    ALTER TABLE users DROP CONSTRAINT users_role_check;
    RAISE NOTICE 'Dropped existing users_role_check constraint';
  EXCEPTION 
    WHEN undefined_object THEN
      RAISE NOTICE 'Constraint does not exist';
    WHEN OTHERS THEN
      RAISE NOTICE 'Error dropping constraint: %', SQLERRM;
  END;
  
  -- Step 3: Fix any invalid roles (set to 'owner')
  UPDATE users 
  SET role = 'owner' 
  WHERE role IS NOT NULL 
  AND role NOT IN ('owner', 'agent', 'developer', 'admin', 'wholesaler', 'investor', 'va');
  
  -- Step 4: Add constraint with 'va' included
  BEGIN
    ALTER TABLE users 
    ADD CONSTRAINT users_role_check 
    CHECK (role IN ('owner', 'agent', 'developer', 'admin', 'wholesaler', 'investor', 'va'));
    RAISE NOTICE 'Added constraint with va role';
  EXCEPTION 
    WHEN duplicate_object THEN
      RAISE NOTICE 'Constraint already exists - skipping';
    WHEN check_violation THEN
      RAISE EXCEPTION 'Cannot add constraint: existing users have invalid roles. Please fix them first.';
  END;
END $$;

-- ============================================================================
-- ADD EDITED_BY TO PROPERTIES TABLE
-- ============================================================================
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS edited_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_properties_edited_by ON properties(edited_by);
