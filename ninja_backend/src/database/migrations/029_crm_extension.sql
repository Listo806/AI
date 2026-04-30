-- =========================================
-- CRM EXTENSION (NO NEW PROPERTY TABLE)
-- Extend properties for CRM control; add projects grouping.
-- =========================================

-- 1) Extend properties table (assigned_agent_id already in 020)
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
  ADD COLUMN IF NOT EXISTS internal_notes TEXT,
  ADD COLUMN IF NOT EXISTS project_id UUID,
  ADD COLUMN IF NOT EXISTS reserved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sold_at TIMESTAMPTZ;

-- 2) Add status 'reserved' (and future values) so re-running migrations never narrows the constraint
-- Include pending_review/approved/rejected (033) to avoid violation when DB was previously migrated
-- Fix invalid/NULL status before adding constraint
UPDATE properties SET status = 'draft' WHERE status IS NULL OR status NOT IN (
  'draft', 'pending_review', 'approved', 'rejected',
  'published', 'sold', 'rented', 'archived', 'reserved'
);
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_status_check;
ALTER TABLE properties ADD CONSTRAINT properties_status_check
  CHECK (status IN (
    'draft', 'pending_review', 'approved', 'rejected',
    'published', 'sold', 'rented', 'archived', 'reserved'
  ));

-- 3) Index for CRM filtering by project
CREATE INDEX IF NOT EXISTS idx_properties_project_id ON properties(project_id)
  WHERE project_id IS NOT NULL;

-- 4) Projects table (grouping only; team_id = org)
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_team_id ON projects(team_id);

-- 5) FK from properties to projects (if not already valid)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'properties' AND constraint_name = 'properties_project_id_fkey'
  ) THEN
    ALTER TABLE properties
      ADD CONSTRAINT properties_project_id_fkey
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;
  END IF;
END $$;
