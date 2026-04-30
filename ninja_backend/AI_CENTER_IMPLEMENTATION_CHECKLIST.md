# AI Center + AI Appointment Setter — Implementation Checklist

This document is the verification checklist for the **AI Center** and **AI Appointment Setter** MVP. Logic and structure only — no marketing or sales copy.

---

## 1. Database

### 1.1 Migration: `030_ai_center.sql`

- [ ] **Run migration** against your database (via setup-db.js or migration runner / psql).
- [ ] **Teams table — new columns** (all `IF NOT EXISTS`):
  - [ ] `ai_appointment_setter_enabled` (BOOLEAN, DEFAULT false)
  - [ ] `ai_auto_reply_enabled` (BOOLEAN, DEFAULT true)
  - [ ] `ai_auto_reply_tone` (VARCHAR(20), DEFAULT 'professional'; CHECK: professional | friendly | sales)
- [ ] **team_ai_config table** exists:
  - [ ] Columns: `team_id` (PK, FK teams), `name` (VARCHAR 50, DEFAULT 'Default'), `updated_at` (TIMESTAMPTZ).
  - [ ] Index: `idx_team_ai_config_team_id`.
- [ ] **ai_activity table** exists:
  - [ ] Columns: `id` (UUID PK), `team_id` (FK teams), `action` (VARCHAR 30), `lead_id` (FK leads, nullable), `channel` (VARCHAR 20), `outcome` (VARCHAR 50), `metadata` (JSONB), `created_at` (TIMESTAMPTZ).
  - [ ] Indexes: `idx_ai_activity_team_id`, `idx_ai_activity_created_at`, `idx_ai_activity_team_created`.
- [ ] **team_addon_history table** (optional): `team_id`, `addon_key`, `enabled_at`, `disabled_at`.

**Quick DB check (after migration):**

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'teams'
AND column_name IN ('ai_appointment_setter_enabled','ai_auto_reply_enabled','ai_auto_reply_tone');

SELECT column_name FROM information_schema.columns WHERE table_name = 'team_ai_config' ORDER BY ordinal_position;
SELECT column_name FROM information_schema.columns WHERE table_name = 'ai_activity' ORDER BY ordinal_position;
```

---

## 2. Backend — AI Center Module

Base path: **`/api/ai-center`**. All require **JWT + CRM access + AI Center access** (roles: ADMIN, OWNER, AGENT). Edit (PUT/POST enable/disable) requires ADMIN or OWNER only.

### 2.1 GET `/api/ai-center/overview`

- [ ] **Implemented:** `AiCenterController.overview` → `AiCenterService.getOverview`.
- [ ] **Response:** `ai_auto_reply` (enabled, tone), `ai_appointment_setter` (enabled), `active_channels` (array), `connected_calendars` (array), `recent_ai_actions` (last 5).
- [ ] **Channels:** WhatsApp = connected if platform number or ≥1 agent-owned connected; Instagram = connected if ≥1 team agent has IG connected; SMS/Messenger not in backend (UI shows “Coming soon”).

### 2.2 GET `/api/ai-center/auto-reply`

- [ ] **Implemented:** Returns `enabled`, `tone` for current team.

### 2.3 PUT `/api/ai-center/auto-reply`

- [ ] **Implemented:** Body `{ "enabled"?: boolean, "tone"?: "professional" | "friendly" | "sales" }`. Admin/Owner only.
- [ ] **Behavior:** Updates `teams.ai_auto_reply_enabled`, `teams.ai_auto_reply_tone`; returns updated settings.

### 2.4 POST `/api/ai-center/appointment-setter/enable`

- [ ] **Implemented:** Sets `teams.ai_appointment_setter_enabled = true`. Admin/Owner only. Returns `{ ok: true }`.

### 2.5 POST `/api/ai-center/appointment-setter/disable`

- [ ] **Implemented:** Sets `teams.ai_appointment_setter_enabled = false`. Admin/Owner only. Returns `{ ok: true }`.

### 2.6 GET `/api/ai-center/appointment-setter/status`

- [ ] **Implemented:** Returns `enabled`, `appointments_booked_count`, `conversion_rate`, `leads_qualified_count`, `escalated_to_human_count` (Phase 1: 0), `connected_channels`, `connected_calendars` ([]).

### 2.7 GET `/api/ai-center/activity?limit=10`

- [ ] **Implemented:** Returns array of actions from `ai_activity` for team, ordered by `created_at` DESC, capped by limit (1–100).

### 2.8 GET `/api/ai-center/qualification-rules`

- [ ] **Implemented:** Returns `name`, `updated_at` for team; ensures default row in `team_ai_config` exists.

### 2.9 Permissions

- [ ] **AiCenterAccessGuard:** Only ADMIN, OWNER, AGENT can access; others get 403.
- [ ] **Edit endpoints** (PUT auto-reply, POST enable/disable): `RolesGuard` with ADMIN, OWNER only; AGENT gets 403 on edit.

---

## 3. Backend — New conversation default

- [ ] **ConversationsService.getOrCreateForLead:** When creating a new conversation, if `ai_enabled` not in dto, read lead’s team `ai_auto_reply_enabled` and use it for the new conversation’s `ai_enabled`.

---

## 3b. Backend — WhatsApp flow wired to AI Center

- [ ] **Routing respects team “AI Auto-Reply” OFF:** In `WhatsAppRoutingService.routeMessage`, after checking per-conversation `ai_enabled`, check the lead’s team `teams.ai_auto_reply_enabled`. If false, return `notify_agent` with reason `team_auto_reply_off` so AI does not reply even if the conversation had been created with AI on.
- [ ] **Activity logging:** In `WhatsAppInboundService.handleInbound`, after routing: when `action === 'reply_ai'` and AI reply is sent, insert into `ai_activity` (action `auto_reply`, channel `whatsapp`, lead_id, team_id, outcome `sent`). When `action === 'notify_agent'`, insert into `ai_activity` (action `escalated`, channel `whatsapp`, lead_id, team_id, outcome = reason). Log ad greeting as `auto_reply` with outcome `ad_greeting`. Only insert when `lead.team_id` is not null.

---

## 4. Frontend — Sidebar

- [ ] **AI Center** is a **collapsible** group in the sidebar (icon: bot).
- [ ] **Sub-items:** Overview, AI Auto-Reply, AI Appointment Setter, AI Qualification Rules, AI Messaging & Follow-Ups, AI Activity & Logs.
- [ ] **Routes:** `/dashboard/ai-center`, `/dashboard/ai-auto-reply`, `/dashboard/ai-appointment-setter`, `/dashboard/ai-qualification-rules`, `/dashboard/ai-messaging`, `/dashboard/ai-logs`.
- [ ] **Removed:** `/dashboard/ai-assistant` and `/dashboard/ai-automations` from nav and routes.
- [ ] **Visibility:** AI Center section visible only for roles admin, owner, agent; VA and others do not see it.
- [ ] **Collapsed sidebar:** Single “AI Center” link goes to `/dashboard/ai-center`.

---

## 5. Frontend — Pages and UI

- [ ] **Overview:** Reads `/ai-center/overview`; shows AI status summary (stat cards), recent AI actions (table or empty state). Read-only. Uses `ai-center.css` (sections, stat cards, table).
- [ ] **AI Auto-Reply:** GET/PUT `/ai-center/auto-reply`; toggle + tone selector (Professional / Friendly / Sales); Save button. Styled with sections and form controls.
- [ ] **AI Appointment Setter:** GET status; when disabled: “Enable AI Appointment Setter” CTA with confirmation; when enabled: metrics cards, channel status list, Calendar link to `/dashboard/integrations`, guardrails list, Disable with confirmation. Styled with sections, badges, channel list.
- [ ] **AI Qualification Rules:** GET `/ai-center/qualification-rules`; shows active ruleset name and last updated. Placeholder for edit (Phase 2).
- [ ] **AI Messaging & Follow-Ups:** Placeholder page; no API calls. Styled with section and empty state.
- [ ] **AI Activity & Logs:** GET `/ai-center/activity?limit=50`; table (Timestamp, Action, Lead ID, Channel, Outcome) or empty state. Styled with section and table.
- [ ] **Styling:** All six pages use `ai-center.css` (page title + icon, subtitle, sections, stat cards, badges, tables, buttons) consistent with Dashboard/Integrations.

---

## 6. i18n and layout

- [ ] **Nav keys:** `nav.aiCenter.label`, `nav.aiCenter.overview`, `nav.aiCenter.autoReply`, `nav.aiCenter.appointmentSetter`, `nav.aiCenter.qualificationRules`, `nav.aiCenter.messaging`, `nav.aiCenter.activityLogs` in en (and es/pt if used).
- [ ] **DashboardLayout route titles:** All six AI Center routes have correct page titles in breadcrumb/header.

---

## 7. Out of scope (confirm not done)

- [ ] **No** Paddle/Stripe API calls for addon billing in this milestone.
- [ ] **No** real calendar integration; “Manage Calendar” links to Integrations; `connected_calendars` always [].
- [ ] **No** new user roles (Manager = OWNER for AI Center).
- [ ] **No** marketing or sales copy on AI Center pages.

---

## 8. Files reference

| Purpose | File(s) |
|--------|--------|
| Migration | `src/database/migrations/030_ai_center.sql` |
| Backend | `src/ai-center/ai-center.controller.ts`, `ai-center.service.ts`, `ai-center.module.ts`, `guards/ai-center-access.guard.ts` |
| New conversation default | `src/messaging/conversations.service.ts` |
| Team auto-reply check in routing | `src/messaging/whatsapp-routing.service.ts` |
| Activity logging from WhatsApp | `src/messaging/whatsapp-inbound.service.ts` |
| Frontend sidebar | `AI-Listo/src/components/Sidebar.jsx` |
| Frontend routes | `AI-Listo/src/App.jsx` |
| Frontend pages | `AI-Listo/src/pages/ai-center/*.jsx` |
| Frontend styles | `AI-Listo/src/pages/ai-center/ai-center.css` |
| i18n | `AI-Listo/src/i18n/locales/en.json` (and es, pt) |
| Layout titles | `AI-Listo/src/layouts/DashboardLayout.jsx` |

---

*AI Center + AI Appointment Setter MVP — implementation checklist. Check off each item as verified.*
