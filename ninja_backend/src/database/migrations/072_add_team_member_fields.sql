ALTER TABLE users
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS job_title varchar(100),
ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_users_team_id
ON users(team_id);

CREATE INDEX IF NOT EXISTS idx_users_last_seen
ON users(last_seen_at DESC);