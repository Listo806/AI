-- Instagram DM Integration (Phase 2 Milestone 2)
-- Agent connects Instagram via Meta OAuth; send/receive DMs; store in lead_messages.

-- ============================================================================
-- AGENT INSTAGRAM CONNECTIONS (one per agent)
-- ============================================================================
CREATE TABLE IF NOT EXISTS agent_instagram_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  instagram_account_id VARCHAR(100) NOT NULL,
  instagram_username VARCHAR(255),
  page_id VARCHAR(100),
  encrypted_access_token TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (agent_id)
);

CREATE INDEX IF NOT EXISTS idx_agent_instagram_agent_id ON agent_instagram_connections(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_instagram_account_id ON agent_instagram_connections(instagram_account_id) WHERE status = 'connected';

-- ============================================================================
-- LEADS: add Instagram identifier for DM recipient
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'instagram_id'
  ) THEN
    ALTER TABLE leads ADD COLUMN instagram_id VARCHAR(100);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_leads_instagram_id ON leads(instagram_id) WHERE instagram_id IS NOT NULL;

-- ============================================================================
-- LEAD_MESSAGES: allow channel instagram_dm
-- ============================================================================
DO $$
DECLARE
  conname text;
BEGIN
  SELECT c.conname INTO conname
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
  WHERE t.relname = 'lead_messages' AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) LIKE '%channel%';
  IF conname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE lead_messages DROP CONSTRAINT %I', conname);
  END IF;
END $$;
ALTER TABLE lead_messages ADD CONSTRAINT lead_messages_channel_check
  CHECK (channel IN ('whatsapp', 'email', 'instagram_dm'));
