-- Add wholesaler and investor roles to users table
-- This migration updates the CHECK constraint to include the new roles

-- Step 1: Check if constraint already has wholesaler and investor
DO $$
DECLARE
  constraint_def TEXT;
  has_wholesaler BOOLEAN := false;
  has_investor BOOLEAN := false;
  has_va BOOLEAN := false;
BEGIN
  -- Get current constraint definition if it exists
  SELECT pg_get_constraintdef(oid) INTO constraint_def
  FROM pg_constraint
  WHERE conrelid = 'users'::regclass
  AND conname = 'users_role_check'
  LIMIT 1;
  
  IF constraint_def IS NOT NULL THEN
    has_wholesaler := constraint_def LIKE '%wholesaler%';
    has_investor := constraint_def LIKE '%investor%';
    has_va := constraint_def LIKE '%va%';
    
    -- If constraint already has both wholesaler and investor, skip
    IF has_wholesaler AND has_investor THEN
      RAISE NOTICE 'Constraint already includes wholesaler and investor - skipping migration';
      RETURN;
    END IF;
  END IF;
  
  -- Step 2: Drop existing constraint if it exists
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
  -- Include 'va' in the check in case it exists (will be properly added in migration 017)
  UPDATE users 
  SET role = 'owner' 
  WHERE role IS NOT NULL 
  AND role NOT IN ('owner', 'agent', 'developer', 'admin', 'wholesaler', 'investor', 'va');
  
  -- Step 4: Add constraint with wholesaler and investor
  -- Include 'va' if it exists in the database to avoid constraint violation
  -- Migration 017 will ensure 'va' is properly included
  BEGIN
    ALTER TABLE users 
    ADD CONSTRAINT users_role_check 
    CHECK (role IN ('owner', 'agent', 'developer', 'admin', 'wholesaler', 'investor', 'va'));
    RAISE NOTICE 'Added constraint with wholesaler, investor, and va roles';
  EXCEPTION 
    WHEN duplicate_object THEN
      RAISE NOTICE 'Constraint already exists - skipping';
    WHEN check_violation THEN
      RAISE EXCEPTION 'Cannot add constraint: existing users have invalid roles. Please fix them first.';
  END;
END $$;
