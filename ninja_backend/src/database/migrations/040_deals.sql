-- =========================================
-- DEALS TABLE FOR CRM PIPELINE
-- Stores deals with stage and position for Kanban pipeline.
-- =========================================

CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  value NUMERIC(12, 2) DEFAULT 0,
  stage TEXT NOT NULL CHECK (stage IN ('new', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
  position INT NOT NULL DEFAULT 0,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deals_team_id ON deals(team_id);
CREATE INDEX IF NOT EXISTS idx_deals_team_stage ON deals(team_id, stage);
CREATE INDEX IF NOT EXISTS idx_deals_lead_id ON deals(lead_id) WHERE lead_id IS NOT NULL;

COMMENT ON TABLE deals IS 'CRM pipeline deals; stage and position define Kanban board order.';
