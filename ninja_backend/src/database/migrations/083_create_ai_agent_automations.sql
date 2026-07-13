CREATE TABLE IF NOT EXISTS ai_agent_automations
(
    team_id uuid PRIMARY KEY
        REFERENCES teams(id)
        ON DELETE CASCADE,

    auto_reply boolean NOT NULL DEFAULT true,

    auto_follow_up boolean NOT NULL DEFAULT true,

    auto_book_appointment boolean NOT NULL DEFAULT true,

    auto_assign_agent boolean NOT NULL DEFAULT false,

    auto_create_task boolean NOT NULL DEFAULT true,

    auto_send_property_matches boolean NOT NULL DEFAULT true,

    auto_send_market_report boolean NOT NULL DEFAULT false,

    auto_collect_contact_info boolean NOT NULL DEFAULT true,

    auto_collect_budget boolean NOT NULL DEFAULT true,

    auto_collect_timeline boolean NOT NULL DEFAULT true,

    follow_up_after_minutes integer NOT NULL DEFAULT 30,

    reminder_after_hours integer NOT NULL DEFAULT 24,

    hot_lead_score integer NOT NULL DEFAULT 80,

    created_at timestamptz DEFAULT now(),

    updated_at timestamptz DEFAULT now()
);