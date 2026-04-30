-- Milestone 6: Add priority to leads for Zapier update_lead and manual override
-- update_lead action supports: status, priority, notes, assigned_agent

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

CREATE INDEX IF NOT EXISTS idx_leads_priority ON leads(priority) WHERE priority IS NOT NULL;
