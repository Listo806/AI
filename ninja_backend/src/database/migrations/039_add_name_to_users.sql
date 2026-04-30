-- Add optional display name to users for profile
ALTER TABLE users
ADD COLUMN IF NOT EXISTS name VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_users_name ON users(name)
WHERE name IS NOT NULL;
