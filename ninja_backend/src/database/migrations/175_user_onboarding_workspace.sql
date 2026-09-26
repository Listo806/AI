-- Post-activation onboarding (verified email -> workspace selection -> CRM).
-- The selected workspace itself is stored as a plan-included
-- workspace_entitlements row (the same record the sidebar "Add to My Plan"
-- creates). These columns record on the user that onboarding was completed,
-- which workspace was chosen and the questionnaire answers, so a returning
-- customer is sent straight to their workspace on any device. Also ensured at
-- runtime by OnboardingService, because migrations are not auto-run everywhere.
-- Existing users keep NULL here and are never forced through onboarding.

ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_workspace_id VARCHAR(64);
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_answers JSONB;
