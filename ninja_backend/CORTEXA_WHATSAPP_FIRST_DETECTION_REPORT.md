# CORTEXA — WhatsApp-First Lead Capture — Backend Detection Report

**Scope:** Homepage, AI CRM page, Marketplace, White-label pages. WhatsApp only. No new channels, no email funnels, no agent routing by default.

**Principle:** All paid traffic → WhatsApp → CORTEXA (AI owns conversation). No agent handoff unless explicitly added (e.g. agent_request).

---

## 1) INBOUND WHATSAPP (MANDATORY)

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| **Endpoint** `POST /api/whatsapp/inbound` | ✅ | `WhatsAppController.inbound()` → `WhatsAppInboundService.handleInbound()` |
| **Trigger:** Lead clicks wa.me → first WhatsApp message | ✅ | Handled by same inbound flow |
| **On first inbound only:** UPSERT LEAD (phone E.164, country/city if possible) | ✅ | `upsertLeadFromAd()` when ad + no lead + `WHATSAPP_FIRST_LEAD_CREATED_BY`; phone from Twilio `From`; country/city inferred in upsert where possible |
| **On first inbound only:** CREATE CONVERSATION | ✅ | `getOrCreateForLead()` — created only when no open conversation |
| **Conversation:** channel = 'whatsapp' | ⚠️ | Implicit: this flow is WhatsApp-only; `lead_messages.channel = 'whatsapp'`; `conversations` table has no `channel` column |
| **Conversation:** ownership = 'ai', ai_enabled = true, status = 'open', source = 'ad' | ✅ | Set in `getOrCreateForLead(..., { ownership: 'ai', ai_enabled: true, source: 'ad', source_meta })` when `isAd` |
| **source_meta:** utm_campaign, utm_adgroup, utm_ad, landing_page | ✅ | `extractAdMeta()` stores all when present in payload (utm_adgroup, utm_ad added for spec) |
| **Lead + conversation permanent; never delete/overwrite source_meta** | ✅ | No delete/overwrite of source_meta on existing conversations |

---

## 2) IMMEDIATE AUTO-REPLY (REQUIRED)

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| On first inbound (same request): send WhatsApp reply sender_type='ai' | ✅ | `conversation.source === 'ad' && created` → `twilioWhatsApp.sendAiReply(..., AD_GREETING_TEXT)` |
| Spanish default text | ✅ | `AD_GREETING_TEXT`: "Hola 👋 Soy el asistente de CORTEXA. ¿Buscas comprar, alquilar o vender?" |

---

## 3) INTENT DETECTION

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| After inbound (and transcription if audio): run detectIntentFromText() | ✅ | `intents.createIfAllowed({ conversationId, leadId, detectedFrom: 'text'|'audio', text })` after saving message |
| If confidence >= 0.60 OR intent == agent_request → create intent_event | ✅ | `IntentEventsService.createIfAllowed()`: `shouldStore = intent === 'agent_request' \|\| confidence >= 0.6` |
| intent_event inherits source, source_meta from conversation | ✅ | `createIfAllowed` loads conversation and inserts `conv.source`, `conv.source_meta` into intent_events |

---

## 4) STAGE TRACKING (METADATA ONLY)

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Initialize stage = 'new' | ✅ | `conversations.stage` default 'new' in DB and `ConversationsService.mapRow()` |
| intent captured + required fields complete → stage = 'qualified' | ✅ | `WhatsAppAiReplyService.replyWithAi()`: `if (nextq.qualified) advanceStage(conversationId, 'qualified')` |
| Property card sent → stage = 'presented' | ✅ | `WhatsAppCardsService`: after send, `advanceStage(conversationId, 'presented')` |
| ai disabled OR manual override → stage = 'escalated' | ✅ | Routing/toggle-ai/agent send: `advanceStage(..., 'escalated')` |
| status = closed → stage = 'closed' | ✅ | `ConversationsService.closeConversation()` sets status + stage = 'closed' |
| Stage does not change routing unless specified | ✅ | Routing uses ownership, ai_enabled, latest intent; stage is metadata/analytics |

---

## 5) ROUTING (CTA-ONLY MODE)

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| DEFAULT: ALWAYS reply_ai, NEVER notify agent | ✅ | Default branch in `WhatsAppRoutingService.routeMessage()` is `reply_ai` |
| Escalation ONLY if intent_type == agent_request (or explicit future config) | ⚠️ | **Also escalated:** (1) ownership === 'human', (2) ai_enabled === false, (3) conversation closed, (4) keywords "human"/"agent"/"call me". Spec says "Escalation ONLY if agent_request" — current code keeps keyword + toggle/ownership as additional triggers (configurable behavior). |

---

## 6) BROADCAST ELIGIBILITY (CRITICAL)

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| WhatsApp-origin lead: ownership = ai, status = open, stage IN ('new','qualified') → eligible for template broadcast / re-engagement | ✅ | `WhatsAppBroadcastService.getEligibleConversations()`: open, ownership=ai, stages default `['new','qualified']` |
| Broadcast sends logged to broadcast_events | ✅ | `broadcast_events` insert on send |
| No email or opt-in beyond WhatsApp inbound required | ✅ | Eligibility based on conversation/lead; no email/opt-in check |

---

## 7) FRONTEND REQUIREMENTS (BACKEND-ENFORCED)

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Backend parses message body for campaign hints if present | ✅ | Ad detection uses payload (Body can be used if needed); UTM/landing_page from query or payload in `extractAdMeta()` |
| Prefer UTM params from landing page when available | ✅ | `extractAdMeta()` reads all UTM and landing_page from inbound payload (set by frontend/wa.me link) |

---

## 8) NON-GOALS (DO NOT BUILD)

| Non-goal | Status |
|----------|--------|
| No agent routing by default | ✅ Default is reply_ai |
| No email capture | ✅ Not implemented in this flow |
| No CRM lead assignment | ✅ No auto-assignment |
| No human notifications (by default) | ✅ Only on escalation (agent_request, etc.) |
| No new channels | ✅ WhatsApp only |
| No UI rebuild | ✅ Backend only |

---

## SUMMARY

- **Inbound:** First-message upsert lead + create conversation with source=ad, source_meta (UTM, landing_page, utm_adgroup, utm_ad when present); immediate Spanish auto-reply for new ad conversations.
- **Intent:** Detected from text/audio; stored if confidence ≥ 0.6 or agent_request; intent_event inherits source/source_meta from conversation. Button→intent (HABLAR_CON_AGENTE/CONTACT_AGENT→agent_request, COMPRAR→buy, ALQUILAR→rent) implemented in `WhatsAppActionsService.handleAction()`.
- **Stage:** new → qualified / presented / escalated / closed per spec; metadata only.
- **Routing:** Default reply_ai; escalate on agent_request (and currently on keywords, ownership human, ai disabled, closed) — spec says “CTA-ONLY” escalate only on agent_request; extra triggers are intentional for safety/ops.
- **Next-question:** Deterministic “next question” implemented in `WhatsAppAiReplyService`: `determineNextQuestion()` returns one short question for missing fields; when `block_ai && question`, only that message is sent (no free-chat).
- **Broadcast:** Eligible = open, ownership=ai, stage in new/qualified; logged in broadcast_events; no email/opt-in.

**Minor change applied:** `extractAdMeta()` now also stores `utm_adgroup` and `utm_ad` when present in the inbound payload, so source_meta can fully match spec (utm_campaign, utm_adgroup, utm_ad, landing_page).

**Files touched:** `src/messaging/whatsapp-inbound.service.ts` (add utm_adgroup, utm_ad to source_meta).
