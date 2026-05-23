-- =========================================================
-- TEAM NOTIFICATIONS - PRODUCTION UPGRADE
-- =========================================================

ALTER TABLE team_notifications

-- actor
ADD COLUMN IF NOT EXISTS actor_user_id uuid
REFERENCES users(id)
ON DELETE SET NULL,

-- classification
ADD COLUMN IF NOT EXISTS category varchar(50),

ADD COLUMN IF NOT EXISTS priority varchar(20)
DEFAULT 'normal',

-- deep link
ADD COLUMN IF NOT EXISTS url text,

-- entity reference
ADD COLUMN IF NOT EXISTS entity_type varchar(50),

ADD COLUMN IF NOT EXISTS entity_id uuid,

-- ui
ADD COLUMN IF NOT EXISTS icon varchar(50),

ADD COLUMN IF NOT EXISTS image_url text,

-- actions
ADD COLUMN IF NOT EXISTS action_label varchar(100),

ADD COLUMN IF NOT EXISTS action_url text,

-- read tracking
ADD COLUMN IF NOT EXISTS read_at timestamp,

-- soft delete
ADD COLUMN IF NOT EXISTS deleted_at timestamp;



CREATE INDEX IF NOT EXISTS idx_team_notifications_team
ON team_notifications(team_id);

CREATE INDEX IF NOT EXISTS idx_team_notifications_user
ON team_notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_team_notifications_unread
ON team_notifications(user_id, is_read);

CREATE INDEX IF NOT EXISTS idx_team_notifications_created
ON team_notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_team_notifications_type
ON team_notifications(type);

CREATE INDEX IF NOT EXISTS idx_team_notifications_entity
ON team_notifications(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_team_notifications_deleted
ON team_notifications(deleted_at);