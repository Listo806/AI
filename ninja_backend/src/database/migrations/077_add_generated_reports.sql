-- Historical storage for generated analytics reports so they can be retrieved
-- after generation (previously reports were generated but never persisted).
CREATE TABLE IF NOT EXISTS generated_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id TEXT,
  team_id UUID,
  generated_by UUID,
  type TEXT NOT NULL,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  summary JSONB,
  report JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generated_reports_team_created
  ON generated_reports (team_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_generated_reports_generated_by_created
  ON generated_reports (generated_by, created_at DESC);
