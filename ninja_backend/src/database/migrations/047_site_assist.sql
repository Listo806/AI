-- Site Assist: anonymous Webflow/widget sessions + message log (not CRM leads).
-- client_ip + user_agent: abuse / rate-limit forensics only (privacy policy).

CREATE TABLE IF NOT EXISTS site_assist_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  locale VARCHAR(8) NOT NULL DEFAULT 'en',
  client_ip VARCHAR(45),
  user_agent TEXT,
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS site_assist_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES site_assist_sessions(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  body TEXT NOT NULL DEFAULT '',
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_assist_messages_session_created
  ON site_assist_messages(session_id, created_at);

CREATE INDEX IF NOT EXISTS idx_site_assist_sessions_created
  ON site_assist_sessions(created_at);
