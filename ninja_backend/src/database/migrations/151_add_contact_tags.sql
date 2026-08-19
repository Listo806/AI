BEGIN;

ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT ARRAY[]::text[];

CREATE INDEX IF NOT EXISTS idx_contacts_tags_gin
  ON public.contacts
  USING gin (tags);

COMMIT;
