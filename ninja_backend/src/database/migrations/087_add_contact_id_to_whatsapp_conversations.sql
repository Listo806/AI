BEGIN;

ALTER TABLE whatsapp_qr_conversations
ADD COLUMN IF NOT EXISTS contact_id UUID NULL;

ALTER TABLE whatsapp_qr_messages
ADD COLUMN IF NOT EXISTS contact_id UUID NULL;

ALTER TABLE whatsapp_qr_conversations
DROP CONSTRAINT IF EXISTS whatsapp_qr_conversations_contact_id_fkey;

ALTER TABLE whatsapp_qr_conversations
ADD CONSTRAINT whatsapp_qr_conversations_contact_id_fkey
FOREIGN KEY (contact_id)
REFERENCES contacts(id)
ON DELETE SET NULL;

ALTER TABLE whatsapp_qr_messages
DROP CONSTRAINT IF EXISTS whatsapp_qr_messages_contact_id_fkey;

ALTER TABLE whatsapp_qr_messages
ADD CONSTRAINT whatsapp_qr_messages_contact_id_fkey
FOREIGN KEY (contact_id)
REFERENCES contacts(id)
ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_whatsapp_qr_conversations_contact_id
ON whatsapp_qr_conversations(contact_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_qr_messages_contact_id
ON whatsapp_qr_messages(contact_id);

COMMIT;