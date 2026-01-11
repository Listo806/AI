-- Add wholesaler and investor roles to users table
-- This migration updates the CHECK constraint to include the new roles

-- Drop the existing CHECK constraint on role column
-- PostgreSQL automatically names CHECK constraints, so we need to find and drop it
DO $$ 
DECLARE
  constraint_name TEXT;
BEGIN
  -- Find the constraint name for the role CHECK constraint
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'users'::regclass
  AND contype = 'c'
  AND pg_get_constraintdef(oid) LIKE '%role%IN%';
  
  -- Drop the constraint if it exists
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE users DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

-- Add the new CHECK constraint with all roles including wholesaler and investor
ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('owner', 'agent', 'developer', 'admin', 'wholesaler', 'investor'));
