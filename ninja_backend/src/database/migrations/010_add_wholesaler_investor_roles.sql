-- Add wholesaler and investor roles to users table
-- This migration updates the CHECK constraint to include the new roles

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

-- Add the new CHECK constraint with all roles including wholesaler and investor
-- Only add if it doesn't already exist with the correct values
DO $$
BEGIN
  -- Check if constraint already exists with the new values (wholesaler and investor)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'users'::regclass
    AND conname = 'users_role_check'
    AND pg_get_constraintdef(oid) LIKE '%wholesaler%'
    AND pg_get_constraintdef(oid) LIKE '%investor%'
  ) THEN
    ALTER TABLE users 
    ADD CONSTRAINT users_role_check 
    CHECK (role IN ('owner', 'agent', 'developer', 'admin', 'wholesaler', 'investor'));
  END IF;
END $$;
