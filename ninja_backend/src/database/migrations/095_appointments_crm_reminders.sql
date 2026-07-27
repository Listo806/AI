-- Extend the Calendar appointments for CRM property links and email reminders.
--  * property_id             — optional link to a property/listing (a showing's home)
--  * reminder_minutes_before — how long before start_at to send the email reminder
--                              (0 or NULL = no reminder). Default 60 minutes.
--  * reminder_sent_at        — set once the reminder has been sent (idempotency).
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS property_id UUID;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_minutes_before INTEGER DEFAULT 60;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

-- Fast lookups of a CRM record's appointments (contact/lead profile panels).
CREATE INDEX IF NOT EXISTS idx_appointments_lead ON appointments(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_contact ON appointments(contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_property ON appointments(property_id) WHERE property_id IS NOT NULL;

-- The reminder sweep only scans rows that have not been reminded yet.
CREATE INDEX IF NOT EXISTS idx_appointments_reminder_due
  ON appointments(start_at)
  WHERE reminder_sent_at IS NULL;
