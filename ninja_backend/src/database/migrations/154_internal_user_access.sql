BEGIN;

CREATE TABLE IF NOT EXISTS internal_user_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  internal_role varchar(32) NOT NULL,
  status varchar(16) NOT NULL DEFAULT 'active',
  permissions jsonb NOT NULL DEFAULT '[]'::jsonb,
  granted_by uuid REFERENCES users(id) ON DELETE SET NULL,
  granted_at timestamptz NOT NULL DEFAULT NOW(),
  deactivated_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT internal_user_access_role_check
    CHECK (internal_role IN ('super_admin', 'admin', 'developer', 'support')),
  CONSTRAINT internal_user_access_status_check
    CHECK (status IN ('active', 'inactive')),
  CONSTRAINT internal_user_access_permissions_array_check
    CHECK (jsonb_typeof(permissions) = 'array')
);

CREATE INDEX IF NOT EXISTS idx_internal_user_access_role
  ON internal_user_access(internal_role);
CREATE INDEX IF NOT EXISTS idx_internal_user_access_status
  ON internal_user_access(status);
CREATE INDEX IF NOT EXISTS idx_internal_user_access_user
  ON internal_user_access(user_id);

CREATE TABLE IF NOT EXISTS internal_access_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  target_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  internal_access_id uuid,
  action varchar(64) NOT NULL,
  before_data jsonb,
  after_data jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_internal_access_audit_target
  ON internal_access_audit(target_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_internal_access_audit_actor
  ON internal_access_audit(actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_internal_access_audit_action
  ON internal_access_audit(action, created_at DESC);

-- Backfill the guaranteed bootstrap-level internal accounts.
INSERT INTO internal_user_access (
  user_id,
  internal_role,
  status,
  permissions,
  granted_by,
  granted_at,
  deactivated_at,
  updated_at
)
SELECT
  u.id,
  'super_admin',
  CASE WHEN COALESCE(u.is_active, true) THEN 'active' ELSE 'inactive' END,
  '["*"]'::jsonb,
  NULL,
  COALESCE(u.created_at, NOW()),
  CASE WHEN COALESCE(u.is_active, true) THEN NULL ELSE NOW() END,
  NOW()
FROM users u
WHERE u.role = 'super_admin'
ON CONFLICT (user_id) DO UPDATE
SET internal_role = 'super_admin',
    status = CASE WHEN COALESCE((SELECT is_active FROM users WHERE id = EXCLUDED.user_id), true)
                  THEN 'active' ELSE 'inactive' END,
    permissions = '["*"]'::jsonb,
    updated_at = NOW();

-- Conservative legacy backfill for admin/developer accounts that do not look
-- like customer/workspace accounts. This prevents ordinary customers from
-- gaining internal access just because their legacy users.role happens to be
-- admin/developer.
INSERT INTO internal_user_access (
  user_id,
  internal_role,
  status,
  permissions,
  granted_by,
  granted_at,
  deactivated_at,
  updated_at
)
SELECT
  u.id,
  u.role,
  CASE WHEN COALESCE(u.is_active, true) THEN 'active' ELSE 'inactive' END,
  CASE
    WHEN u.role = 'admin' THEN '["admin:read","admin:write","internal_users:manage"]'::jsonb
    ELSE '["admin:read","developer:tools"]'::jsonb
  END,
  NULL,
  COALESCE(u.created_at, NOW()),
  CASE WHEN COALESCE(u.is_active, true) THEN NULL ELSE NOW() END,
  NOW()
FROM users u
WHERE u.role IN ('admin', 'developer')
  AND u.team_id IS NULL
  AND u.ecommerce_workspace_id IS NULL
  AND COALESCE(u.plan, '') = ''
  AND COALESCE(u.selected_plan, '') = ''
  AND COALESCE(u.payment_status, '') = ''
  AND NOT EXISTS (SELECT 1 FROM teams t WHERE t.owner_id = u.id)
  AND NOT EXISTS (SELECT 1 FROM team_members tm WHERE tm.user_id = u.id)
ON CONFLICT (user_id) DO NOTHING;

COMMIT;
