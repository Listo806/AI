-- Per-agent Meta (Facebook) app credentials for Instagram OAuth.
-- Each agent stores their own App ID and App Secret; OAuth redirect_uri is built from API_PUBLIC_URL.
CREATE TABLE IF NOT EXISTS agent_meta_app_settings (
  agent_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  meta_app_id VARCHAR(255) NOT NULL,
  encrypted_meta_app_secret TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_meta_app_agent_id ON agent_meta_app_settings(agent_id);
