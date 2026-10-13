-- Apply before deploying the Pipeline stage-management endpoints.
-- Requires existing deals.workspace_id UUID column.
CREATE TABLE IF NOT EXISTS pipeline_workspace_stages (
  workspace_id uuid NOT NULL,
  stage_key varchar(40) NOT NULL,
  label varchar(80) NOT NULL,
  color varchar(7) NOT NULL DEFAULT '#3b82f6',
  position integer NOT NULL,
  PRIMARY KEY (workspace_id, stage_key),
  UNIQUE (workspace_id, position)
);
CREATE INDEX IF NOT EXISTS idx_pipeline_workspace_stages_workspace
  ON pipeline_workspace_stages(workspace_id);
