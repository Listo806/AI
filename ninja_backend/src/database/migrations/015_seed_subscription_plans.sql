-- Seed subscription plans with the specified tiers
-- This migration seeds all plan tiers as specified in Milestone 5

-- Marketplace Plans
INSERT INTO subscription_plans (name, description, price, seat_limit, listing_limit, crm_access, ai_features, analytics_level, priority_exposure, ai_automation, plan_category, is_active, created_at, updated_at)
VALUES 
  -- FREE
  (
    'FREE',
    'View-only dashboard. No listings, CRM, AI, or analytics.',
    0.00,
    1,
    0,  -- No listings
    false,  -- No CRM
    false,  -- No AI
    'none',  -- No analytics
    false,  -- No priority
    false,  -- No automation
    'marketplace',
    true,
    NOW(),
    NOW()
  ),
  -- PRO
  (
    'PRO',
    '20 listings, basic analytics. No CRM or AI features.',
    0.00,  -- Price to be set via Paddle
    1,
    20,  -- 20 listings
    false,  -- No CRM
    false,  -- No AI
    'basic',  -- Basic analytics
    false,  -- No priority
    false,  -- No automation
    'marketplace',
    true,
    NOW(),
    NOW()
  ),
  -- PRO PLUS
  (
    'PRO PLUS',
    'Unlimited listings, CRM access with AI matching and lead scoring, advanced analytics.',
    0.00,  -- Price to be set via Paddle
    1,
    NULL,  -- Unlimited listings (NULL = unlimited)
    true,  -- CRM access
    true,  -- AI features
    'advanced',  -- Advanced analytics
    false,  -- No priority exposure
    false,  -- No automation
    'marketplace',
    true,
    NOW(),
    NOW()
  ),
  -- PRO MAX
  (
    'PRO MAX',
    'Unlimited listings with priority exposure, CRM with AI automation, priority AI routing, smart follow-ups, advanced analytics with AI insights.',
    0.00,  -- Price to be set via Paddle
    1,
    NULL,  -- Unlimited listings
    true,  -- CRM access
    true,  -- AI features
    'ai_insights',  -- Advanced + AI insights
    true,  -- Priority exposure
    true,  -- AI automation
    'marketplace',
    true,
    NOW(),
    NOW()
  ),
  -- AI CRM PRO+
  (
    'AI CRM – PRO+',
    'Unlimited listings, 1 seat included, extra seats $25/month. AI CRM enabled.',
    149.99,
    1,  -- 1 seat included
    NULL,  -- Unlimited listings
    true,  -- CRM access
    true,  -- AI features
    'advanced',  -- Advanced analytics
    false,  -- No priority
    false,  -- No automation
    'ai_crm',
    true,
    NOW(),
    NOW()
  ),
  -- AI CRM ELITE
  (
    'AI CRM – ELITE',
    'Includes PRO+ features plus advanced AI workflows.',
    199.99,
    1,  -- 1 seat included
    NULL,  -- Unlimited listings
    true,  -- CRM access
    true,  -- AI features
    'advanced',  -- Advanced analytics
    false,  -- No priority
    true,  -- AI automation (advanced workflows)
    'ai_crm',
    true,
    NOW(),
    NOW()
  ),
  -- AI CRM ENTERPRISE
  (
    'AI CRM – ENTERPRISE',
    'Everything unlocked: unlimited listings, CRM, AI features, automation, white-label, SLA.',
    249.99,
    1,  -- Base seats, can add more
    NULL,  -- Unlimited listings
    true,  -- CRM access
    true,  -- AI features
    'ai_insights',  -- AI insights
    true,  -- Priority exposure
    true,  -- AI automation
    'ai_crm',
    true,
    NOW(),
    NOW()
  )
ON CONFLICT (name) DO NOTHING;
