-- Agent-Owned WhatsApp Integration (Final Phase 2 Milestone)
-- Twilio-only: one connection per agent (sub-account); sender_type platform | agent.

-- ============================================================================
-- AGENT WHATSAPP CONNECTIONS (one per agent)
-- ============================================================================
CREATE TABLE IF NOT EXISTS agent_whatsapp_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  whatsapp_number VARCHAR(20) NOT NULL,
  provider VARCHAR(20) NOT NULL DEFAULT 'twilio' CHECK (provider IN ('twilio')),
  external_account_id VARCHAR(100) NOT NULL,
  encrypted_auth_token TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (agent_id)
);

CREATE INDEX IF NOT EXISTS idx_agent_whatsapp_agent_id ON agent_whatsapp_connections(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_whatsapp_whatsapp_number ON agent_whatsapp_connections(whatsapp_number) WHERE status = 'connected';
CREATE INDEX IF NOT EXISTS idx_agent_whatsapp_status ON agent_whatsapp_connections(status) WHERE status = 'connected';

-- ============================================================================
-- LEAD_MESSAGES: add sender_type and agent_id (WhatsApp only)
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'lead_messages' AND column_name = 'sender_type'
  ) THEN
    ALTER TABLE lead_messages ADD COLUMN sender_type VARCHAR(20) DEFAULT 'platform'
      CHECK (sender_type IN ('platform', 'agent'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'lead_messages' AND column_name = 'agent_id'
  ) THEN
    ALTER TABLE lead_messages ADD COLUMN agent_id UUID REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Backfill existing rows: platform, no agent
UPDATE lead_messages SET sender_type = 'platform', agent_id = NULL WHERE sender_type IS NULL;

-- Enforce non-null sender_type for new rows (default already set)
ALTER TABLE lead_messages ALTER COLUMN sender_type SET DEFAULT 'platform';

CREATE INDEX IF NOT EXISTS idx_lead_messages_sender_type ON lead_messages(lead_id, sender_type);
