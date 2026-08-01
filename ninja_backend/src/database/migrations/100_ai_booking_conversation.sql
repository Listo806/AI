-- AI appointment booking over WhatsApp (conversational).
--
-- Everything here is additive and defaults to OFF, so an existing team's live
-- behavior is unchanged until it explicitly turns booking on.
--
--  1) ai_agent_appointment_rules.booking_enabled — master switch. When false
--     (the default, incl. every existing row), the AI never auto-books; it
--     behaves exactly as before (qualify -> hand to a human).
--  2) leads.lead_ai_state — add the two conversational booking states so the
--     multi-turn flow (offer a time -> confirm) has somewhere to live.
--  3) leads.booking_prompt_count — bounds how many times the AI re-asks for a
--     time before it gives up and escalates to a human.
--  4) appointments.wa_reminder_sent_at — idempotency for the WhatsApp reminder,
--     kept separate from the existing email reminder_sent_at so the two
--     channels never cancel each other out.

-- 1) Master switch -----------------------------------------------------------
ALTER TABLE ai_agent_appointment_rules
  ADD COLUMN IF NOT EXISTS booking_enabled boolean NOT NULL DEFAULT false;

-- 2) New lead AI states ------------------------------------------------------
-- The column was created with a CHECK constraint that only allows the original
-- five states. Drop and re-add it with the two booking states included.
DO $$
DECLARE
  cons_name text;
BEGIN
  SELECT conname INTO cons_name
    FROM pg_constraint
   WHERE conrelid = 'leads'::regclass
     AND contype = 'c'
     AND pg_get_constraintdef(oid) ILIKE '%lead_ai_state%';

  IF cons_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE leads DROP CONSTRAINT %I', cons_name);
  END IF;

  ALTER TABLE leads
    ADD CONSTRAINT leads_lead_ai_state_check
    CHECK (lead_ai_state IN (
      'new',
      'collecting_info',
      'qualified',
      'booking_offered',
      'booked',
      'booking_blocked',
      'escalated_to_human'
    ));
END $$;

-- 3) Re-ask counter ----------------------------------------------------------
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS booking_prompt_count smallint NOT NULL DEFAULT 0;

-- 4) WhatsApp reminder idempotency ------------------------------------------
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS wa_reminder_sent_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_appointments_wa_reminder_due
  ON appointments(start_at)
  WHERE wa_reminder_sent_at IS NULL;
