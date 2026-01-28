-- Milestone 5: Messaging Core (WhatsApp + Email)
-- Tables for lead messages, delivery status, and email threads

-- ============================================================================
-- LEAD MESSAGES (WhatsApp + Email, unified timeline)
-- ============================================================================
CREATE TABLE IF NOT EXISTS lead_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('whatsapp', 'email')),
  direction VARCHAR(20) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  external_id VARCHAR(255), -- Twilio MessageSid or email message-id
  body TEXT,
  subject VARCHAR(500), -- email only
  status VARCHAR(50) NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed', 'queued')),
  metadata JSONB, -- e.g. MediaUrl0, From, To, error_code
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_messages_lead_id ON lead_messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_messages_channel ON lead_messages(channel);
CREATE INDEX IF NOT EXISTS idx_lead_messages_external_id ON lead_messages(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lead_messages_created_at ON lead_messages(lead_id, created_at DESC);

-- ============================================================================
-- EMAIL THREAD METADATA (optional; lead_messages holds content)
-- ============================================================================
-- We use lead_messages with channel='email' for thread retrieval.
-- Optionally store in_reply_to for threading (add column if needed later).
