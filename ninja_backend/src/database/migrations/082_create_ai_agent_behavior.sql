CREATE TABLE IF NOT EXISTS public.ai_agent_behavior (
    team_id uuid PRIMARY KEY
      REFERENCES public.teams(id)
      ON DELETE CASCADE,

    tone varchar(30) NOT NULL DEFAULT 'professional',
    personality varchar(50) NOT NULL DEFAULT 'helpful',
    response_length varchar(20) NOT NULL DEFAULT 'balanced',

    greeting_message text,
    fallback_message text,
    escalation_message text,

    qualification_questions jsonb NOT NULL DEFAULT '[]'::jsonb,
    forbidden_topics jsonb NOT NULL DEFAULT '[]'::jsonb,
    custom_instructions text,

    ask_one_question_at_a_time boolean NOT NULL DEFAULT true,
    confirm_before_booking boolean NOT NULL DEFAULT true,
    mention_ai_identity boolean NOT NULL DEFAULT false,
    use_emojis boolean NOT NULL DEFAULT false,
    proactive_follow_up boolean NOT NULL DEFAULT true,
    auto_escalate_hot_leads boolean NOT NULL DEFAULT true,

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT ai_agent_behavior_tone_check
      CHECK (tone IN ('professional', 'friendly', 'sales')),

    CONSTRAINT ai_agent_behavior_personality_check
      CHECK (
        personality IN (
          'helpful',
          'consultative',
          'concise',
          'luxury',
          'investor_focused'
        )
      ),

    CONSTRAINT ai_agent_behavior_response_length_check
      CHECK (
        response_length IN (
          'concise',
          'balanced',
          'detailed'
        )
      )
);