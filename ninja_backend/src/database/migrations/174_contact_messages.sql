-- Public website contact form (/contact, /es/contact, /pt/contact).
-- Every submission is stored here BEFORE the email is sent, so no message is
-- lost if the email provider fails. The same table is also ensured at runtime
-- by ContactService, because migrations are not auto-run in every environment.

CREATE TABLE IF NOT EXISTS contact_messages (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  topic TEXT,
  message TEXT NOT NULL,
  language VARCHAR(8),
  page_path TEXT,
  ip TEXT,
  user_agent TEXT,
  email_to TEXT,
  email_status VARCHAR(16) NOT NULL DEFAULT 'pending',
  email_error TEXT,
  emailed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages (created_at DESC);
