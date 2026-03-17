-- WhatsApp QR production hardening: indexes, last message columns, dedupe doc

-- Inbox list: fast lookup by user + recency
CREATE INDEX IF NOT EXISTS idx_whatsapp_qr_conv_user_updated
  ON whatsapp_qr_conversations (user_id, updated_at DESC NULLS LAST);

-- Denormalized last message for inbox (avoid joining messages for preview)
ALTER TABLE whatsapp_qr_conversations ADD COLUMN IF NOT EXISTS last_message TEXT;
ALTER TABLE whatsapp_qr_conversations ADD COLUMN IF NOT EXISTS last_message_type VARCHAR(20);

-- Optional listing context when conversation is tied to a property
ALTER TABLE whatsapp_qr_conversations ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES properties(id) ON DELETE SET NULL;

-- Partial unique on message_id already in 045; ensure name stable for ops
-- idx_whatsapp_qr_messages_message_id_unique ON whatsapp_qr_messages(message_id) WHERE message_id IS NOT NULL AND message_id <> ''
