CREATE TABLE IF NOT EXISTS public.ai_agent_business_profiles (
    team_id uuid PRIMARY KEY REFERENCES public.teams(id) ON DELETE CASCADE,
    business_name varchar(200) NOT NULL,
    business_type varchar(80) NOT NULL DEFAULT 'real_estate',
    description text,
    website varchar(500),
    email varchar(255),
    phone varchar(40),
    address_line1 varchar(255),
    address_line2 varchar(255),
    city varchar(120),
    state varchar(120),
    postal_code varchar(30),
    country varchar(120),
    service_areas jsonb NOT NULL DEFAULT '[]'::jsonb,
    specialties jsonb NOT NULL DEFAULT '[]'::jsonb,
    languages jsonb NOT NULL DEFAULT '[]'::jsonb,
    timezone varchar(100),
    currency varchar(10) NOT NULL DEFAULT 'USD',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_agent_business_profiles_city
  ON public.ai_agent_business_profiles(city);