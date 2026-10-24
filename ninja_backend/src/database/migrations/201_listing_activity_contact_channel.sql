-- Contact channel is non-personal metadata for auditing event sources.
ALTER TABLE listing_activity_events ADD COLUMN IF NOT EXISTS contact_channel VARCHAR(16);
ALTER TABLE listing_activity_events DROP CONSTRAINT IF EXISTS listing_activity_contact_channel_check;
ALTER TABLE listing_activity_events ADD CONSTRAINT listing_activity_contact_channel_check
 CHECK (contact_channel IS NULL OR contact_channel IN ('phone', 'whatsapp', 'email'));
