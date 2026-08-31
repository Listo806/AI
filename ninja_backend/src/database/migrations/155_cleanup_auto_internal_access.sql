BEGIN;

-- Cleanup for environments where 20260831_internal_user_access.sql was already run.
-- Goal: remove ONLY legacy admin/developer rows that were automatically backfilled
-- by the migration. Do NOT delete users or customer/workspace/subscription data.
--
-- Manually authorized internal users created through Add Internal User are preserved
-- because AdminUsersService writes an internal_user_created audit record.
-- Super Admin rows are always preserved.

CREATE TEMP TABLE _removed_auto_internal_access ON COMMIT DROP AS
SELECT
  ia.id AS internal_access_id,
  ia.user_id,
  ia.internal_role,
  ia.status,
  ia.permissions,
  ia.granted_by,
  ia.granted_at,
  ia.deactivated_at,
  ia.updated_at,
  u.email,
  u.name
FROM internal_user_access ia
JOIN users u ON u.id = ia.user_id
WHERE ia.internal_role IN ('admin', 'developer')
  AND ia.granted_by IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM internal_access_audit a
    WHERE a.target_user_id = ia.user_id
      AND (
        a.internal_access_id = ia.id
        OR a.action = 'internal_user_created'
      )
  );

-- Keep a cleanup audit trail before removing the access record.
INSERT INTO internal_access_audit (
  actor_user_id,
  target_user_id,
  internal_access_id,
  action,
  before_data,
  after_data,
  metadata,
  created_at
)
SELECT
  NULL,
  r.user_id,
  r.internal_access_id,
  'migration_auto_access_removed',
  jsonb_build_object(
    'email', r.email,
    'name', r.name,
    'role', r.internal_role,
    'status', r.status,
    'permissions', r.permissions,
    'grantedBy', r.granted_by,
    'grantedAt', r.granted_at
  ),
  NULL,
  jsonb_build_object(
    'reason', 'Removed legacy admin/developer access auto-created by migration; account identity and customer/workspace data were preserved',
    'cleanupMigration', '20260831_cleanup_auto_internal_access.sql'
  ),
  NOW()
FROM _removed_auto_internal_access r;

DELETE FROM internal_user_access ia
USING _removed_auto_internal_access r
WHERE ia.id = r.internal_access_id;

-- Invalidate existing sessions for affected identities so removed internal access
-- is enforced immediately. This does NOT deactivate/delete the user account.
UPDATE users u
SET token_version = COALESCE(u.token_version, 1) + 1,
    updated_at = NOW()
WHERE u.id IN (SELECT user_id FROM _removed_auto_internal_access);

COMMIT;

-- Optional verification after commit:
-- SELECT ia.user_id, u.email, ia.internal_role, ia.status, ia.granted_by
-- FROM internal_user_access ia
-- JOIN users u ON u.id = ia.user_id
-- ORDER BY ia.granted_at DESC;
