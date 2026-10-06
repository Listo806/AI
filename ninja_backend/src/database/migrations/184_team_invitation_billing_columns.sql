-- Team invitation fields required by the Nuvei paid-seat invite flow.
-- Safe to run repeatedly on existing production databases.
ALTER TABLE team_invitations
  ADD COLUMN IF NOT EXISTS invitee_name TEXT;

ALTER TABLE team_invitations
  ADD COLUMN IF NOT EXISTS source VARCHAR(30) NOT NULL DEFAULT 'workspace';

UPDATE team_invitations
SET source = 'workspace'
WHERE source IS NULL OR BTRIM(source) = '';
