-- Team invitation accept flow + per-plan seat limits.
-- No schema change is required (team_invitations already carries token, email,
-- role, status, expires_at, accepted_at); these indexes just speed up the two
-- new hot paths:
--   * public invitation lookup + accept, keyed by token
--   * seat-usage counts that gate invites/accepts, keyed by (team_id, status)

CREATE INDEX IF NOT EXISTS idx_team_invitations_token
  ON team_invitations(token);

CREATE INDEX IF NOT EXISTS idx_team_invitations_team_status
  ON team_invitations(team_id, status);
