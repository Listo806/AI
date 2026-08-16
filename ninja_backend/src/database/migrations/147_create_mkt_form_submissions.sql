-- Real form submissions. Each submission captures the submitted data and, when it
-- carries an email, creates a marketing lead (with a first-touch touchpoint) so form
-- capture feeds attribution honestly. Team is inherited from the form, never trusted
-- from the request.
CREATE TABLE IF NOT EXISTS mkt_form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  form_id UUID NOT NULL,
  data_json JSONB,
  email TEXT,
  name TEXT,
  lead_id UUID,
  source_ip TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mkt_form_subs_team ON mkt_form_submissions(team_id);
CREATE INDEX IF NOT EXISTS idx_mkt_form_subs_form ON mkt_form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_mkt_form_subs_created ON mkt_form_submissions(created_at);
