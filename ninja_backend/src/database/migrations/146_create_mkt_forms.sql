-- Forms & landing pages. A form has a field definition (fields_json) and, when
-- Published, accepts real submissions at a public endpoint. The owning account is
-- ALWAYS derived from the form row (team_id), never from the submitter's request, so
-- a public submission can never target or leak another account's data.
CREATE TABLE IF NOT EXISTS mkt_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  created_by UUID,
  name TEXT,
  type TEXT NOT NULL DEFAULT 'form',
  status TEXT NOT NULL DEFAULT 'Draft',
  fields_json JSONB,
  campaign_id UUID,
  campaign_name TEXT,
  audience_id UUID,
  source TEXT,
  redirect_url TEXT,
  submit_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mkt_forms_team ON mkt_forms(team_id);
CREATE INDEX IF NOT EXISTS idx_mkt_forms_status ON mkt_forms(status);
CREATE INDEX IF NOT EXISTS idx_mkt_forms_campaign ON mkt_forms(campaign_id);
