CREATE TABLE IF NOT EXISTS ai_agent_appointment_rules
(
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    team_id uuid NOT NULL
        REFERENCES teams(id)
        ON DELETE CASCADE,

    timezone varchar(100) NOT NULL DEFAULT 'UTC',

    working_days jsonb NOT NULL DEFAULT
    '["monday","tuesday","wednesday","thursday","friday"]'::jsonb,

    start_time time NOT NULL DEFAULT '09:00',

    end_time time NOT NULL DEFAULT '18:00',

    booking_duration integer NOT NULL DEFAULT 30,

    buffer_before integer NOT NULL DEFAULT 0,

    buffer_after integer NOT NULL DEFAULT 0,

    max_daily_bookings integer NOT NULL DEFAULT 20,

    allow_weekends boolean NOT NULL DEFAULT false,

    auto_confirm boolean NOT NULL DEFAULT true,

    require_human_approval boolean NOT NULL DEFAULT false,

    reminder_minutes integer NOT NULL DEFAULT 30,

    google_calendar_enabled boolean NOT NULL DEFAULT false,

    outlook_calendar_enabled boolean NOT NULL DEFAULT false,

    intake_questions jsonb NOT NULL DEFAULT '[]'::jsonb,

    created_at timestamptz DEFAULT now(),

    updated_at timestamptz DEFAULT now(),

    UNIQUE(team_id)
);

CREATE INDEX idx_ai_agent_appointment_team
ON ai_agent_appointment_rules(team_id);