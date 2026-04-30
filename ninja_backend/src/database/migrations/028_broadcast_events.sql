-- CORTEXA WhatsApp Broadcast Add-on: audit log for template broadcasts
-- Compliance, analytics, and safety. No UI required.

CREATE TABLE IF NOT EXISTS broadcast_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  template_name VARCHAR(255) NOT NULL,
  sent_at TIMESTAMP NOT NULL DEFAULT NOW(),
  source_meta JSONB
);

CREATE INDEX IF NOT EXISTS idx_broadcast_events_conversation_id ON broadcast_events(conversation_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_events_lead_id ON broadcast_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_events_sent_at ON broadcast_events(sent_at DESC);
