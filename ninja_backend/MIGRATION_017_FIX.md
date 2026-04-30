# Migration 017 Fix - Role Constraint Issue

## Problem

When running migration 017 or 018, you may encounter:
```
Database setup failed: check constraint "users_role_check" of relation "users" is violated by some row
Error code: 23514
```

## Root Cause

This error occurs when:
1. There are existing users in the database with role values that are NOT in the allowed list
2. Migration 017 tries to add a new constraint that includes 'va' role, but existing data violates it

## Solution

Migration 017 has been updated to:
1. **First fix invalid roles**: Update any users with invalid role values to 'owner' (default)
2. **Then add the constraint**: Add the new constraint with all valid roles including 'va'

## Migration Order

**IMPORTANT**: Migration 017 must be run BEFORE migration 018.

Correct order:
1. ✅ Migration 016 (Milestone 1 - Intelligence Foundation)
2. ✅ Migration 017 (Add VA role and edited_by)
3. ✅ Migration 018 (Milestone 2 - Agent Priority Engine)

## Manual Fix (if needed)

If you still encounter the error, you can manually fix invalid roles:

```sql
-- Check for users with invalid roles
SELECT id, email, role 
FROM users 
WHERE role NOT IN ('owner', 'agent', 'developer', 'admin', 'wholesaler', 'investor', 'va');

-- Fix invalid roles (set to 'owner')
UPDATE users 
SET role = 'owner' 
WHERE role NOT IN ('owner', 'agent', 'developer', 'admin', 'wholesaler', 'investor', 'va');

-- Then drop and recreate the constraint
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'users'::regclass
    AND conname = 'users_role_check'
  ) THEN
    ALTER TABLE users DROP CONSTRAINT users_role_check;
  END IF;
END $$;

ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('owner', 'agent', 'developer', 'admin', 'wholesaler', 'investor', 'va'));
```

## Verification

After running migration 017, verify:

```sql
-- Check constraint exists
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'users'::regclass 
AND conname = 'users_role_check';

-- Should show: CHECK (role IN ('owner', 'agent', 'developer', 'admin', 'wholesaler', 'investor', 'va'))

-- Verify all users have valid roles
SELECT COUNT(*) as invalid_roles
FROM users 
WHERE role NOT IN ('owner', 'agent', 'developer', 'admin', 'wholesaler', 'investor', 'va');
-- Should return 0
```
