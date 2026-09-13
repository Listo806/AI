BEGIN;

CREATE TABLE IF NOT EXISTS workspace_ai_setup_configs (
  team_id uuid NOT NULL,
  workspace_id varchar(64) NOT NULL,
  business_profile jsonb NOT NULL DEFAULT '{}'::jsonb,
  appointment_rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  behavior jsonb NOT NULL DEFAULT '{}'::jsonb,
  automations jsonb NOT NULL DEFAULT '{}'::jsonb,
  pipeline_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  qualification_questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  safety_rules jsonb NOT NULL DEFAULT '[]'::jsonb,
  faqs jsonb NOT NULL DEFAULT '[]'::jsonb,
  business_profile_completed boolean NOT NULL DEFAULT false,
  appointment_rules_configured boolean NOT NULL DEFAULT false,
  behavior_configured boolean NOT NULL DEFAULT false,
  automations_configured boolean NOT NULL DEFAULT false,
  tested boolean NOT NULL DEFAULT false,
  launched boolean NOT NULL DEFAULT false,
  paused boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, workspace_id)
);

CREATE INDEX IF NOT EXISTS idx_workspace_ai_setup_workspace
  ON workspace_ai_setup_configs (workspace_id, team_id);

CREATE TABLE IF NOT EXISTS aesthetic_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  workspace_id varchar(64) NOT NULL DEFAULT 'aesthetic-wellness',
  name varchar(180) NOT NULL,
  address_line1 text,
  address_line2 text,
  city varchar(120),
  state varchar(120),
  postal_code varchar(32),
  country varchar(120),
  timezone varchar(100) DEFAULT 'UTC',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aesthetic_locations_team_ws
  ON aesthetic_locations (team_id, workspace_id, is_active);

CREATE TABLE IF NOT EXISTS aesthetic_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  workspace_id varchar(64) NOT NULL DEFAULT 'aesthetic-wellness',
  user_id uuid,
  location_id uuid REFERENCES aesthetic_locations(id) ON DELETE SET NULL,
  name varchar(180) NOT NULL,
  email varchar(255),
  phone varchar(50),
  title varchar(120),
  availability jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aesthetic_providers_team_ws
  ON aesthetic_providers (team_id, workspace_id, is_active);

CREATE TABLE IF NOT EXISTS aesthetic_treatments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  workspace_id varchar(64) NOT NULL DEFAULT 'aesthetic-wellness',
  name varchar(180) NOT NULL,
  category varchar(120),
  description text,
  duration_minutes integer NOT NULL DEFAULT 30,
  price numeric(12,2) NOT NULL DEFAULT 0,
  rebooking_days integer,
  booking_buffer_before integer NOT NULL DEFAULT 0,
  booking_buffer_after integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aesthetic_treatments_team_ws
  ON aesthetic_treatments (team_id, workspace_id, is_active);

CREATE TABLE IF NOT EXISTS aesthetic_provider_treatments (
  provider_id uuid NOT NULL REFERENCES aesthetic_providers(id) ON DELETE CASCADE,
  treatment_id uuid NOT NULL REFERENCES aesthetic_treatments(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (provider_id, treatment_id)
);

CREATE TABLE IF NOT EXISTS aesthetic_treatment_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  workspace_id varchar(64) NOT NULL DEFAULT 'aesthetic-wellness',
  appointment_id uuid,
  contact_id uuid,
  lead_id uuid,
  provider_id uuid REFERENCES aesthetic_providers(id) ON DELETE SET NULL,
  treatment_id uuid REFERENCES aesthetic_treatments(id) ON DELETE SET NULL,
  revenue numeric(12,2) NOT NULL DEFAULT 0,
  status varchar(32) NOT NULL DEFAULT 'scheduled',
  completed_at timestamptz,
  next_rebook_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT aesthetic_treatment_records_status_check
    CHECK (status IN ('scheduled','confirmed','completed','cancelled','no_show'))
);

CREATE INDEX IF NOT EXISTS idx_aesthetic_records_team_ws
  ON aesthetic_treatment_records (team_id, workspace_id, status, completed_at);
CREATE INDEX IF NOT EXISTS idx_aesthetic_records_rebook
  ON aesthetic_treatment_records (team_id, workspace_id, next_rebook_at);

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS workspace_id varchar(64);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS aesthetic_location_id uuid;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS aesthetic_provider_id uuid;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS aesthetic_treatment_id uuid;

ALTER TABLE leads ADD COLUMN IF NOT EXISTS workspace_id varchar(64);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS workspace_id varchar(64);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS workspace_id varchar(64);
ALTER TABLE ai_activity ADD COLUMN IF NOT EXISTS workspace_id varchar(64);
ALTER TABLE lead_tasks ADD COLUMN IF NOT EXISTS workspace_id varchar(64);
ALTER TABLE whatsapp_qr_messages ADD COLUMN IF NOT EXISTS workspace_id varchar(64);

CREATE INDEX IF NOT EXISTS idx_appointments_team_workspace
  ON appointments (team_id, workspace_id, start_at);
CREATE INDEX IF NOT EXISTS idx_leads_team_workspace
  ON leads (team_id, workspace_id, created_at);
CREATE INDEX IF NOT EXISTS idx_contacts_team_workspace
  ON contacts (team_id, workspace_id, created_at);
CREATE INDEX IF NOT EXISTS idx_deals_team_workspace
  ON deals (team_id, workspace_id, stage);
CREATE INDEX IF NOT EXISTS idx_ai_activity_team_workspace
  ON ai_activity (team_id, workspace_id, created_at);
CREATE INDEX IF NOT EXISTS idx_lead_tasks_team_workspace
  ON lead_tasks (team_id, workspace_id, due_date);
CREATE INDEX IF NOT EXISTS idx_wa_messages_team_workspace
  ON whatsapp_qr_messages (team_id, workspace_id, created_at);

COMMIT;
