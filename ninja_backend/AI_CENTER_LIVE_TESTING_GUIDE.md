# AI Center + AI Appointment Setter — Live Testing Guide

Step-by-step instructions to test the AI Center and AI Appointment Setter MVP in a live or staging environment.

---

## Prerequisites

- [ ] Backend running (e.g. `npm run start` or deployed URL).
- [ ] Frontend running (e.g. `npm run dev` for AI-Listo).
- [ ] Migration **030_ai_center.sql** has been applied to the database.
- [ ] At least one **team** with:
  - One user with role **owner** or **admin** (for edit tests).
  - One user with role **agent** (for view-only tests).
- [ ] JWT token for an **owner/admin** user (and optionally for an **agent** user) — obtain via sign-in.

**Optional for channel status:**  
- Platform WhatsApp configured (`TWILIO_WHATSAPP_FROM`) and/or at least one agent with WhatsApp connected; and/or one agent with Instagram connected, so “Active channels” and “Connected” badges can be verified.

---

## Part A — API tests (e.g. Swagger or curl)

Use `Authorization: Bearer <JWT>` for all requests. Base URL = backend + `/api` (e.g. `http://localhost:3000/api` or your deployed API URL).

### A.1 Overview

1. **GET** `/ai-center/overview`
   - **Expect:** 200, JSON with `ai_auto_reply` (enabled, tone), `ai_appointment_setter` (enabled), `active_channels` (array), `connected_calendars` (array), `recent_ai_actions` (array, up to 5).
   - **Check:** `active_channels` includes `whatsapp` and/or `instagram` if you have those connected; otherwise may be `[]`. `connected_calendars` is `[]`.

### A.2 Auto-Reply

2. **GET** `/ai-center/auto-reply`  
   - **Expect:** 200, `{ "enabled": true|false, "tone": "professional"|"friendly"|"sales" }`.

3. **PUT** `/ai-center/auto-reply`  
   - Body: `{ "enabled": false }` or `{ "tone": "friendly" }` or both.  
   - **Expect:** 200, updated object.  
   - **Then:** GET again and confirm values changed.

4. **PUT** as **agent** user (use agent’s JWT):  
   - **Expect:** 403 (only admin/owner can edit).

### A.3 Appointment Setter

5. **GET** `/ai-center/appointment-setter/status`  
   - **Expect:** 200, `enabled` (boolean), metrics (0), `connected_channels`, `connected_calendars: []`.

6. **POST** `/ai-center/appointment-setter/enable` (as owner/admin).  
   - **Expect:** 200, `{ "ok": true }`.  
   - **Then:** GET status again → `enabled: true`.

7. **POST** `/ai-center/appointment-setter/disable` (as owner/admin).  
   - **Expect:** 200, `{ "ok": true }`.  
   - **Then:** GET status again → `enabled: false`.

8. **POST** `/ai-center/appointment-setter/enable` as **agent**.  
   - **Expect:** 403.

### A.4 Activity and qualification

9. **GET** `/ai-center/activity?limit=5`  
   - **Expect:** 200, array (may be empty).  
   - **Check:** If you have no `ai_activity` rows, array is `[]`.

10. **GET** `/ai-center/qualification-rules`  
    - **Expect:** 200, `{ "name": "Default", "updated_at": "..." }`.  
    - **Check:** First call may create the default row; subsequent calls return same structure.

### A.5 Access control

11. Call **GET** `/ai-center/overview` with a user that has role **VA** (or other non–admin/owner/agent).  
    - **Expect:** 403 (AI Center not available for that role), **or** 403 from CRM access if VA has no team/CRM.

---

## Part B — Frontend (UI) tests

Use the same owner/admin and agent users. Open the app in a browser and sign in.

### B.1 Sidebar and navigation

1. **Sidebar**
   - As **owner** or **admin** or **agent:** “AI Center” group is visible with bot icon; expanding it shows: Overview, AI Auto-Reply, AI Appointment Setter, AI Qualification Rules, AI Messaging & Follow-Ups, AI Activity & Logs.
   - As **VA** (if you have one): AI Center section is **not** visible; only allowed nav items (e.g. Properties) appear.
   - **Collapsed sidebar:** Collapse the sidebar; single “AI Center” entry should link to Overview (`/dashboard/ai-center`).

2. **Routes**
   - Navigate to each of: `/dashboard/ai-center`, `/dashboard/ai-auto-reply`, `/dashboard/ai-appointment-setter`, `/dashboard/ai-qualification-rules`, `/dashboard/ai-messaging`, `/dashboard/ai-logs`.  
   - **Expect:** Each loads without 404; page title and content match the route (no blank or wrong page).
   - **Check:** Old routes `/dashboard/ai-assistant` and `/dashboard/ai-automations` are **removed** (redirect or 404 is acceptable).

### B.2 Overview page

3. Open **AI Center → Overview**.
   - **Expect:** Page title “AI Center — Overview” and subtitle; “AI Status Summary” section with stat cards (e.g. AI Auto-Reply ON/OFF, AI Appointment Setter ON/OFF, Active Channels count, Connected Calendars 0).
   - **Expect:** “Recent AI Actions (last 5)” section: table if there are actions, or “No recent AI actions” empty state.
   - **Check:** No console errors; layout and styles consistent with other dashboard pages (cards, spacing).

### B.3 AI Auto-Reply page

4. Open **AI Center → AI Auto-Reply**.
   - **Expect:** Toggle “AI Auto-Reply: ON/OFF” and Tone dropdown (Professional / Friendly / Sales), plus Save button.
   - **Action:** Change toggle or tone, click Save.  
   - **Expect:** Success (no error toast); reload or open Overview and confirm status matches (e.g. ON/OFF, tone).
   - **As agent:** Open same page; **expect:** Toggle and dropdown may be visible, but Save (or any edit) should result in 403 or disabled state if backend is called — confirm no success on save for agent.

### B.4 AI Appointment Setter page (disabled state)

5. If status is **disabled:**  
   - **Expect:** “Disabled” badge, short description, and primary button “Enable AI Appointment Setter”.
   - **Action:** Click Enable; confirm browser confirmation modal; confirm.  
   - **Expect:** Page updates to enabled state (or reload shows enabled).

### B.5 AI Appointment Setter page (enabled state)

6. If status is **enabled:**  
   - **Expect:** “ACTIVE” badge (green); “Metrics” section with four stat cards (Appointments Booked, Conversion Rate, Leads Qualified, Escalated to Human — values may be 0); “Channel Status” list (WhatsApp, Instagram, SMS, Messenger) with Connected / Not connected / Coming soon; “Calendar” with “Manage Calendar” link to `/dashboard/integrations`; “Safety & Guardrails” list; “Module Control” with “Disable AI Appointment Setter” button.
   - **Action:** Click “Disable AI Appointment Setter”; confirm in modal.  
   - **Expect:** Page switches back to disabled state (or reload shows disabled).

### B.6 AI Qualification Rules page

7. Open **AI Center → AI Qualification Rules**.  
   - **Expect:** “Active Ruleset” section with ruleset name (e.g. “Default”) and “Last updated” timestamp. Placeholder note for Phase 2 is acceptable.

### B.7 AI Messaging & Follow-Ups page

8. Open **AI Center → AI Messaging & Follow-Ups**.  
   - **Expect:** Title, subtitle (scope: follow-ups, reminders, nurture; no cold outreach/ads/bulk), and placeholder message. No errors.

### B.8 AI Activity & Logs page

9. Open **AI Center → AI Activity & Logs**.  
   - **Expect:** Title, subtitle, and either a table (Timestamp, Action, Lead ID, Channel, Outcome) or “No AI activity recorded yet.”  
   - **Check:** If you have no data, empty state is shown; table styling is consistent with Overview.

### B.9 Permissions (owner vs agent)

10. As **owner or admin:** Confirm you can change Auto-Reply and Enable/Disable Appointment Setter; all six pages load.  
11. As **agent:** Open all six pages; confirm read-only (no 403 on GET). Try saving Auto-Reply or enabling Appointment Setter; **expect:** 403 or disabled behavior so changes are not applied.

---

## Part C — Data and integration checks (optional)

### C.1 Team “AI Auto-Reply” OFF stops WhatsApp AI

- Turn **OFF** “AI Auto-Reply” in **AI Center → AI Auto-Reply** and save.
- Send a WhatsApp message to the platform (or agent) number as a lead that belongs to that team.
- **Expect:** No AI reply; conversation appears for the agent (notify_agent). In **AI Center → Overview** and **AI Activity & Logs** you should see an entry with action `escalated` and outcome `team_auto_reply_off`.

### C.2 New conversation default

- With AI Auto-Reply **ON**, create a **new** lead (or use a new phone) and send a first WhatsApp message. New conversation should have `ai_enabled = true` and AI may reply. With AI Auto-Reply **OFF**, new conversation should have `ai_enabled = false` and no AI reply.

### C.3 Database spot-check

- **teams:** `SELECT id, ai_auto_reply_enabled, ai_auto_reply_tone, ai_appointment_setter_enabled FROM teams LIMIT 1;` — columns exist and values update after API calls.
- **team_ai_config:** `SELECT * FROM team_ai_config LIMIT 1;` — at least one row per team that called qualification-rules.
- **ai_activity:** `SELECT * FROM ai_activity ORDER BY created_at DESC LIMIT 5;` — if your app writes to it (e.g. from WhatsApp AI flow), rows appear; Overview and Activity page should reflect them.

---

## Sign-off

| Area | Result | Notes |
|------|--------|------|
| Migration 030 applied | ☐ Pass / ☐ Fail | |
| Overview API + UI | ☐ Pass / ☐ Fail | |
| Auto-Reply API + UI | ☐ Pass / ☐ Fail | |
| Appointment Setter enable/disable + UI | ☐ Pass / ☐ Fail | |
| Activity + Qualification APIs + UI | ☐ Pass / ☐ Fail | |
| Sidebar + routes + permissions | ☐ Pass / ☐ Fail | |
| Owner/Admin edit; Agent view-only | ☐ Pass / ☐ Fail | |

**Tester:** _________________  
**Date:** _________________  
**Environment:** _________________

---

*AI Center + AI Appointment Setter MVP — live testing guide.*
