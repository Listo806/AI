-- WhatsApp QR Enterprise Module – isolated from Twilio tables
-- Spec: WHATSAPP-QR-ENTERPRISE-SPEC.md

-- ============================================================================
-- 4.1 whatsapp_qr_sessions (one row per user)
-- ============================================================================
CREATE TABLE IF NOT EXISTS whatsapp_qr_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phone VARCHAR(20),
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'connecting', 'connected', 'disconnected', 'failed')),
  last_qr_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ,
  disconnected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_qr_sessions_user ON whatsapp_qr_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_qr_sessions_status ON whatsapp_qr_sessions(status);

-- ============================================================================
-- 4.2 whatsapp_qr_conversations
-- ============================================================================
CREATE TABLE IF NOT EXISTS whatsapp_qr_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES whatsapp_qr_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  contact_phone VARCHAR(20) NOT NULL,
  owner_type VARCHAR(20) NOT NULL DEFAULT 'ai' CHECK (owner_type IN ('ai', 'human')),
  ai_enabled BOOLEAN NOT NULL DEFAULT true,
  stage VARCHAR(20) NOT NULL DEFAULT 'new'
    CHECK (stage IN ('new', 'qualified', 'presented', 'escalated', 'converted', 'closed')),
  last_message_at TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  source VARCHAR(20) DEFAULT 'organic' CHECK (source IN ('organic', 'ad')),
  source_meta JSONB,
  unread_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (session_id, contact_phone)
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_qr_conv_session ON whatsapp_qr_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_qr_conv_user ON whatsapp_qr_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_qr_conv_team ON whatsapp_qr_conversations(team_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_qr_conv_lead ON whatsapp_qr_conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_qr_conv_last_msg ON whatsapp_qr_conversations(last_message_at DESC NULLS LAST);

-- ============================================================================
-- 4.3 whatsapp_qr_messages
-- ============================================================================
CREATE TABLE IF NOT EXISTS whatsapp_qr_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES whatsapp_qr_sessions(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES whatsapp_qr_conversations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  contact_phone VARCHAR(20) NOT NULL,
  direction VARCHAR(20) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('lead', 'ai', 'agent')),
  message_type VARCHAR(20) NOT NULL DEFAULT 'text'
    CHECK (message_type IN ('text', 'image', 'audio', 'video', 'document', 'location', 'sticker')),
  body TEXT,
  message_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_qr_msg_session ON whatsapp_qr_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_qr_msg_conversation ON whatsapp_qr_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_qr_msg_conv_created ON whatsapp_qr_messages(conversation_id, created_at DESC);

-- Dedupe: one row per Baileys/WhatsApp message_id when present
CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_qr_messages_message_id_unique
  ON whatsapp_qr_messages(message_id) WHERE message_id IS NOT NULL AND message_id <> '';

-- ============================================================================
-- 4.4 intent_events_qr
-- ============================================================================
CREATE TABLE IF NOT EXISTS intent_events_qr (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_conversation_id UUID NOT NULL REFERENCES whatsapp_qr_conversations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  intent_type VARCHAR(30) NOT NULL,
  confidence DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intent_events_qr_conv ON intent_events_qr(qr_conversation_id);
CREATE INDEX IF NOT EXISTS idx_intent_events_qr_created ON intent_events_qr(qr_conversation_id, created_at DESC);

-- ============================================================================
-- 4.5 routing_events_qr (route = reply_ai | notify_agent)
-- ============================================================================
CREATE TABLE IF NOT EXISTS routing_events_qr (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_conversation_id UUID NOT NULL REFERENCES whatsapp_qr_conversations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  route VARCHAR(50) NOT NULL CHECK (route IN ('reply_ai', 'notify_agent')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_routing_events_qr_conv ON routing_events_qr(qr_conversation_id);
