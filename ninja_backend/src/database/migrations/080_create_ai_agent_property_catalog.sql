CREATE TABLE IF NOT EXISTS public.ai_agent_property_catalog (
    team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    is_active boolean NOT NULL DEFAULT true,
    added_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (team_id, property_id)
);
CREATE INDEX IF NOT EXISTS idx_ai_agent_property_catalog_team_active
  ON public.ai_agent_property_catalog(team_id, is_active);
CREATE INDEX IF NOT EXISTS idx_ai_agent_property_catalog_property
  ON public.ai_agent_property_catalog(property_id);