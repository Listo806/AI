CREATE TABLE IF NOT EXISTS public.ai_agent_test_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    team_id uuid NOT NULL
      REFERENCES public.teams(id)
      ON DELETE CASCADE,

    created_by uuid
      REFERENCES public.users(id)
      ON DELETE SET NULL,

    title varchar(255) NOT NULL DEFAULT 'AI Agent Test',

    status varchar(20) NOT NULL DEFAULT 'active',

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT ai_agent_test_sessions_status_check
      CHECK (status IN ('active', 'completed', 'archived'))
);

CREATE TABLE IF NOT EXISTS public.ai_agent_test_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    session_id uuid NOT NULL
      REFERENCES public.ai_agent_test_sessions(id)
      ON DELETE CASCADE,

    role varchar(20) NOT NULL,
    content text NOT NULL,

    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

    created_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT ai_agent_test_messages_role_check
      CHECK (role IN ('user', 'assistant', 'system'))
);

CREATE INDEX IF NOT EXISTS idx_ai_test_sessions_team_updated
  ON public.ai_agent_test_sessions(team_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_test_messages_session_created
  ON public.ai_agent_test_messages(session_id, created_at ASC);