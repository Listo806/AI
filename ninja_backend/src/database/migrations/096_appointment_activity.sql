-- Appointment activity log: who created, edited, rescheduled, or canceled an
-- appointment, and when. Useful for teams and auditing.
--
-- Cascades with the appointment: marking an appointment canceled is a status
-- change, so the appointment and its full history are kept. A hard delete
-- removes the appointment and its history together.
CREATE TABLE IF NOT EXISTS appointment_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  team_id UUID NOT NULL,
  actor_id UUID,
  action TEXT NOT NULL,   -- created | updated | rescheduled | canceled
  detail TEXT,            -- short human-readable summary of what changed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appt_activity_appointment ON appointment_activity(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appt_activity_team ON appointment_activity(team_id);
