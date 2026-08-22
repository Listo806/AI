import { TemplateName } from './templates';

// Curated list of templates an admin can send to ONE customer from the customer
// detail screen. Every entry maps to a real production template in templates.ts
// (same copy, same SendGrid pipeline) — no duplicated templates, no separate
// email system. Add a row here to expose a new template in the dropdown later
// (AI offers, workspace offers, upgrades, trial reminders, win-back, etc.).
//
// Recovery/activation emails are intentionally NOT here: they mint a single-use
// account token and belong to an automatic flow, so they should not be blasted
// manually. Add them later with proper token handling if ever needed.
export interface ManualTemplateEntry {
  name: TemplateName;
  label: string;
  category: string;
  description: string;
}

export const MANUAL_EMAIL_CATALOG: ManualTemplateEntry[] = [
  // ── Onboarding sequence (the live Day 0/1/2/4/6/9/12 emails) ──
  { name: 'onb_welcome', label: 'Welcome / Start Here', category: 'Onboarding', description: 'Day 0 welcome — your AI CRM is ready.' },
  { name: 'onb_support', label: "24/7 Support — We're Here for You", category: 'Onboarding', description: 'Trust email, no selling. Reply-to support.' },
  { name: 'onb_ai', label: 'Put Cortexa AI to Work', category: 'Onboarding', description: 'Get the AI agent working across the CRM.' },
  { name: 'onb_invite_team', label: 'Invite Your Team (Day 3)', category: 'Onboarding', description: 'Nudge to invite teammates into the core CRM. CTA opens the Invite Team Member flow.' },
  { name: 'onb_connect', label: 'Connect Your Customer Flow', category: 'Onboarding', description: 'WhatsApp, leads and appointments together.' },
  { name: 'onb_system', label: 'Your Business, One Connected System', category: 'Onboarding', description: 'Everything working together with AI.' },
  { name: 'onb_ready', label: 'Ready for More? (AI, Plans & Workspace)', category: 'Onboarding', description: 'Upgrade options — AI Units, Solo, Workspace.' },
  { name: 'onb_team', label: 'Team Workspace', category: 'Onboarding', description: 'Invite the team and collaborate.' },

  // ── Account / setup ──
  { name: 'welcome', label: 'Welcome (payment confirmed)', category: 'Account', description: 'Account active after a confirmed payment.' },
  { name: 'getting_started', label: 'Getting Started Setup', category: 'Account', description: 'How to set up the AI agent, step by step.' },

  // ── AI credits ──
  // Same email as the automatic Day 0/2/5 out-of-credits sequence. Sending it here
  // is a one-off manual send (send_type='manual'); it does NOT start, duplicate, or
  // alter the automatic scheduled sequence.
  { name: 'ai_credits_out', label: "You're Out of AI Credits", category: 'AI credits', description: 'Out-of-credits nudge — Add AI Credits (same design as the automatic sequence).' },

  // ── Free plan nurture ──
  { name: 'free_welcome', label: 'Free Plan — Welcome', category: 'Free plan', description: 'Welcome to the Free Forever plan.' },
  { name: 'free_plan_value', label: 'Free Plan — What You Can Do', category: 'Free plan', description: 'The value available on the Free plan.' },
  { name: 'free_ai', label: 'Free Plan — Your AI Assistant', category: 'Free plan', description: 'Free-plan AI allowance and how to use it.' },
  { name: 'free_team', label: 'Free Plan — Invite Your Team', category: 'Free plan', description: 'Invite teammates to collaborate.' },
  { name: 'free_upgrade', label: 'Free Plan — Ready to Upgrade', category: 'Free plan', description: 'Upgrade path from the Free plan.' },

  // ── Checkout recovery ──
  { name: 'checkout_recovery', label: 'Checkout — Complete Your Setup', category: 'Checkout', description: 'Paid plan selected but not paid — resume checkout for their plan.' },

  // ── Billing ──
  { name: 'payment_failed', label: 'Payment Failed', category: 'Billing', description: 'A payment or renewal attempt failed (retry link).' },
  { name: 'subscription_canceled', label: 'Subscription Canceled', category: 'Billing', description: 'Subscription canceled (reactivate link).' },

  // ── Re-engagement ──
  { name: 'abandoned_1', label: 'Abandoned Signup — Reminder 1', category: 'Re-engagement', description: 'Account ready, finish activation.' },
  { name: 'abandoned_2', label: 'Abandoned Signup — Reminder 2 (Editorial)', category: 'Re-engagement', description: 'Follow-up with the Business Editorial.' },
  { name: 'abandoned_3', label: 'Abandoned Signup — Reminder 3 (Final)', category: 'Re-engagement', description: 'Final activation reminder.' },
];

const MANUAL_SET = new Set<string>(MANUAL_EMAIL_CATALOG.map((e) => e.name));

export function isManualTemplate(name: string): name is TemplateName {
  return MANUAL_SET.has(name);
}
