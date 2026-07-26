-- GoogleCalendarService.handleCallback INSERTs a `scope` value, but the original
-- google_calendar_integrations table (054) has no scope column, so the OAuth
-- callback threw 'column "scope" does not exist' and no calendar could connect.
-- Add the missing column.
ALTER TABLE google_calendar_integrations ADD COLUMN IF NOT EXISTS scope TEXT;
