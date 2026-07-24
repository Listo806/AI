BEGIN;

ALTER TABLE whatsapp_qr_conversations
  ALTER COLUMN lead_id DROP NOT NULL;

ALTER TABLE whatsapp_qr_conversations
  DROP CONSTRAINT IF EXISTS whatsapp_qr_conversations_lead_id_fkey;

ALTER TABLE whatsapp_qr_conversations
  ADD CONSTRAINT whatsapp_qr_conversations_lead_id_fkey
  FOREIGN KEY (lead_id)
  REFERENCES leads(id)
  ON DELETE SET NULL;

COMMIT;