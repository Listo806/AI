ALTER TABLE whatsapp_qr_messages
ADD COLUMN IF NOT EXISTS status varchar(20) DEFAULT 'sent',
ADD COLUMN IF NOT EXISTS sent_at timestamptz,
ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
ADD COLUMN IF NOT EXISTS read_at timestamptz,
ADD COLUMN IF NOT EXISTS failed_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'whatsapp_qr_messages_status_check'
  ) THEN
    ALTER TABLE whatsapp_qr_messages
    ADD CONSTRAINT whatsapp_qr_messages_status_check
    CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed'));
  END IF;
END $$;

UPDATE whatsapp_qr_messages
SET
  status = CASE
    WHEN direction = 'inbound' THEN 'read'
    ELSE COALESCE(status, 'sent')
  END,
  sent_at = CASE
    WHEN direction = 'outbound' THEN COALESCE(sent_at, created_at)
    ELSE sent_at
  END,
  read_at = CASE
    WHEN direction = 'inbound' THEN COALESCE(read_at, created_at)
    ELSE read_at
  END
WHERE status IS NULL
   OR sent_at IS NULL
   OR read_at IS NULL;