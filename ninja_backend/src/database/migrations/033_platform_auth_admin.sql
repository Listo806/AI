-- Migration: Platform Auth and Admin Controls
-- Roles: SUPER_ADMIN, VA_UPLOADER, USER
-- Property status: PENDING_REVIEW, APPROVED, REJECTED
-- Property origin: PLATFORM, VA, CRM

-- ============================================================================
-- USERS: Add new roles
-- ============================================================================
DO $$
DECLARE
  conname text;
BEGIN
  SELECT c.conname INTO conname
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
  WHERE t.relname = 'users' AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) LIKE '%role%';
  IF conname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE users DROP CONSTRAINT %I', conname);
  END IF;
END $$;

ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN (
    'owner', 'agent', 'developer', 'admin',
    'wholesaler', 'investor', 'va',
    'super_admin', 'va_uploader', 'user'
  ));

-- ============================================================================
-- PROPERTIES: Add status values and origin
-- ============================================================================
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_status_check;

ALTER TABLE properties ADD CONSTRAINT properties_status_check
  CHECK (status IN (
    'draft', 'pending_review', 'approved', 'rejected',
    'published', 'sold', 'rented', 'archived', 'reserved'
  ));

-- Add origin column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'properties' AND column_name = 'origin'
  ) THEN
    ALTER TABLE properties ADD COLUMN origin VARCHAR(20) DEFAULT 'platform'
      CHECK (origin IN ('platform', 'va', 'crm'));
  END IF;
END $$;

-- Add reviewed_by, reviewed_at, rejection_reason for admin workflow
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'properties' AND column_name = 'reviewed_by'
  ) THEN
    ALTER TABLE properties ADD COLUMN reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'properties' AND column_name = 'reviewed_at'
  ) THEN
    ALTER TABLE properties ADD COLUMN reviewed_at TIMESTAMP;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'properties' AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE properties ADD COLUMN rejection_reason TEXT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_properties_origin ON properties(origin);
CREATE INDEX IF NOT EXISTS idx_properties_status_origin ON properties(status, origin);
CREATE INDEX IF NOT EXISTS idx_properties_reviewed_by ON properties(reviewed_by) WHERE reviewed_by IS NOT NULL;
