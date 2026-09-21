CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS customer_setup_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  workspace_id text NOT NULL,
  ai_agent_id uuid NULL,
  selected_objective text NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  tests jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'setup',
  activated_at timestamptz NULL,
  activated_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(team_id, workspace_id)
);

CREATE INDEX IF NOT EXISTS idx_customer_setup_team_ws
ON customer_setup_configs(team_id, workspace_id);

CREATE TABLE IF NOT EXISTS setup_assistance_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_code text UNIQUE NOT NULL,
  team_id uuid NOT NULL,
  workspace_id text NOT NULL,
  ai_agent_id uuid NULL,
  requested_by uuid NOT NULL,
  assistance_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'Submitted',
  latest_response text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_setup_assistance_team_ws
ON setup_assistance_requests(team_id, workspace_id, created_at DESC);
