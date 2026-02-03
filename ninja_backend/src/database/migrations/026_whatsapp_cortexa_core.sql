-- CORTEXA WhatsApp Core: conversations, routing, actions log, lead_messages extensions
-- Deterministic routing (AI vs Agent), structured UI support, ad entry support

-- ============================================================================
-- CONVERSATIONS (one per lead for WhatsApp; get-or-create on first inbound)
-- ============================================================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ownership VARCHAR(20) NOT NULL DEFAULT 'ai' CHECK (ownership IN ('ai', 'human')),
  ai_enabled BOOLEAN NOT NULL DEFAULT true,
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  source VARCHAR(20) NOT NULL DEFAULT 'organic' CHECK (source IN ('organic', 'ad')),
  source_meta JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_lead_whatsapp
  ON conversations(lead_id) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_conversations_lead_id ON conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_conversations_agent_id ON conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);

-- ============================================================================
-- ROUTING EVENTS (log each routing decision)
-- ============================================================================
CREATE TABLE IF NOT EXISTS routing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL CHECK (action IN ('reply_ai', 'notify_agent')),
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_routing_events_conversation_id ON routing_events(conversation_id);
CREATE INDEX IF NOT EXISTS idx_routing_events_created_at ON routing_events(created_at DESC);

-- ============================================================================
-- WHATSAPP ACTIONS LOG (button clicks, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS whatsapp_actions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  action_type VARCHAR(100) NOT NULL,
  payload JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_actions_log_conversation_id ON whatsapp_actions_log(conversation_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_actions_log_lead_id ON whatsapp_actions_log(lead_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_actions_log_created_at ON whatsapp_actions_log(created_at DESC);

-- ============================================================================
-- LEAD_MESSAGES: add conversation_id, message_type, media_url, meta; extend sender_type
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'lead_messages' AND column_name = 'conversation_id'
  ) THEN
    ALTER TABLE lead_messages ADD COLUMN conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'lead_messages' AND column_name = 'message_type'
  ) THEN
    ALTER TABLE lead_messages ADD COLUMN message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'audio', 'card'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'lead_messages' AND column_name = 'media_url'
  ) THEN
    ALTER TABLE lead_messages ADD COLUMN media_url TEXT;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'lead_messages' AND column_name = 'meta'
  ) THEN
    ALTER TABLE lead_messages ADD COLUMN meta JSONB;
  END IF;
END $$;

-- Extend sender_type: drop old check, add new (platform, agent, ai, lead)
DO $$
DECLARE
  conname text;
BEGIN
  SELECT c.conname INTO conname
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
  WHERE t.relname = 'lead_messages' AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) LIKE '%sender_type%';
  IF conname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE lead_messages DROP CONSTRAINT %I', conname);
  END IF;
END $$;
ALTER TABLE lead_messages ADD CONSTRAINT lead_messages_sender_type_check
  CHECK (sender_type IN ('platform', 'agent', 'ai', 'lead'));

-- Backfill sender_type: inbound WhatsApp from lead -> 'lead' (may already be platform)
DO $$
BEGIN
  UPDATE lead_messages SET sender_type = 'lead'
  WHERE direction = 'inbound' AND channel = 'whatsapp' AND sender_type IN ('platform', 'agent');
EXCEPTION WHEN OTHERS THEN
  NULL; -- constraint may not allow; run after constraint change
END $$;

-- Backfill conversation_id: create one open conversation per lead with WhatsApp messages, link messages
INSERT INTO conversations (lead_id, ownership, ai_enabled, status, source, updated_at)
SELECT DISTINCT lm.lead_id, 'ai', true, 'open', 'organic', NOW()
  FROM lead_messages lm
  WHERE lm.channel = 'whatsapp' AND lm.conversation_id IS NULL
    AND NOT EXISTS (SELECT 1 FROM conversations c WHERE c.lead_id = lm.lead_id AND c.status = 'open');

UPDATE lead_messages lm
SET conversation_id = c.id
FROM conversations c
WHERE lm.channel = 'whatsapp' AND lm.lead_id = c.lead_id AND lm.conversation_id IS NULL AND c.status = 'open';

CREATE INDEX IF NOT EXISTS idx_lead_messages_conversation_id ON lead_messages(conversation_id) WHERE conversation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lead_messages_conversation_created ON lead_messages(conversation_id, created_at DESC) WHERE conversation_id IS NOT NULL;
