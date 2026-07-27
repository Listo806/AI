-- Appointments backing the permanent Calendar module (showings, consultations,
-- calls, meetings). The "Appointments Booked" dashboard metric already reads
-- this table. google_event_id links a row to its synced Google Calendar event.
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  created_by UUID,
  assigned_to UUID,
  lead_id UUID,
  contact_id UUID,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'other',
  status TEXT NOT NULL DEFAULT 'pending',
  location TEXT,
  notes TEXT,
  attendee_name TEXT,
  attendee_email TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  timezone TEXT,
  all_day BOOLEAN DEFAULT false,
  google_event_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_team ON appointments(team_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start ON appointments(start_at);
