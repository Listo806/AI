CREATE TABLE team_ai_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  generated_by uuid,
  mode varchar(20),
  payload jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);