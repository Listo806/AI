CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS public.ai_agent_knowledge_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    team_id uuid NOT NULL
      REFERENCES public.teams(id)
      ON DELETE CASCADE,

    created_by uuid
      REFERENCES public.users(id)
      ON DELETE SET NULL,

    category varchar(50) NOT NULL,
    source_type varchar(30) NOT NULL DEFAULT 'text',

    title varchar(255) NOT NULL,
    content text NOT NULL,

    source_url text,

    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

    status varchar(20) NOT NULL DEFAULT 'active',
    priority integer NOT NULL DEFAULT 0,

    last_reviewed_at timestamptz,

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    search_vector tsvector GENERATED ALWAYS AS (
      setweight(
        to_tsvector(
          'simple',
          COALESCE(title, '')
        ),
        'A'
      )
      ||
      setweight(
        to_tsvector(
          'simple',
          COALESCE(content, '')
        ),
        'B'
      )
    ) STORED,

    CONSTRAINT ai_agent_knowledge_category_check
      CHECK (
        category IN (
          'company_information',
          'office_hours',
          'service_areas',
          'property_knowledge',
          'sales_scripts',
          'financing_partners',
          'faqs',
          'policies_processes'
        )
      ),

    CONSTRAINT ai_agent_knowledge_source_type_check
      CHECK (
        source_type IN (
          'text',
          'qa',
          'website',
          'document',
          'system'
        )
      ),

    CONSTRAINT ai_agent_knowledge_status_check
      CHECK (
        status IN (
          'active',
          'inactive',
          'needs_review'
        )
      )
);

CREATE INDEX IF NOT EXISTS idx_ai_agent_knowledge_team_category
  ON public.ai_agent_knowledge_items (
    team_id,
    category,
    status
  );

CREATE INDEX IF NOT EXISTS idx_ai_agent_knowledge_search
  ON public.ai_agent_knowledge_items
  USING GIN(search_vector);

CREATE INDEX IF NOT EXISTS idx_ai_agent_knowledge_title_trgm
  ON public.ai_agent_knowledge_items
  USING GIN(title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_ai_agent_knowledge_updated
  ON public.ai_agent_knowledge_items (
    team_id,
    updated_at DESC
  );