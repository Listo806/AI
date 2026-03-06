-- =========================================
-- DEALS: created_by and assigned_to
-- Supports ownership, assignment to agents, and audit.
-- =========================================

ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_deals_created_by ON deals(created_by) WHERE created_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deals_assigned_to ON deals(assigned_to) WHERE assigned_to IS NOT NULL;

COMMENT ON COLUMN deals.created_by IS 'User who created the deal';
COMMENT ON COLUMN deals.assigned_to IS 'Agent (user) responsible for the deal; must be team member';
