ALTER TABLE integration_requests
  ADD COLUMN IF NOT EXISTS request_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS integration_requests_team_request_key_uidx
  ON integration_requests(team_id, request_key)
  WHERE request_key IS NOT NULL;
