import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { DatabaseService } from '../database/database.service';
import { PlatformMailerService } from './platform-mailer.service';
import { UsageService } from '../plans/usage.service';
import {
  PLAN_ORDER,
  getPlan,
  normalizePlanId,
  publicPlansConfig,
  resolveEffectivePlan,
} from '../plans/plan-config';
// AI-credits display only: the SAME pure functions the dashboard balance uses
// (AiUnitsService.getBalance), so the admin number can never drift from the
// customer's own meter. Pure logic import — no service/DI, no module cycle.
import {
  DEFAULT_AI_UNITS_CONFIG,
  mergeAiUnitsConfig,
  computeBalanceView,
} from '../ai-units/ai-units-logic';

// A paid tier was SELECTED (intent to buy), independent of whether payment
// succeeded. Shared by the checkout-pending / registered predicates below so the
// tabs, filters, KPI counts, and the row status all split the two states the
// SAME way (single source of truth).
const PAID_SELECTED_SQL = `LOWER(COALESCE(selected_plan,'')) IN ('solo','pro','team','business','growth','scale')`;

// Checkout pending: a paid plan is in flight but no successful payment yet.
// Covers the explicit checkout-open states (payment_status trial/pending) AND the
// current signup flow, where the account is created 'registered' with a paid plan
// chosen (Register -> Pricing -> Checkout). This is exactly what the main table
// shows as "Checkout Pending", so the dedicated Checkout Pending view/tab uses it too.
const CHECKOUT_PENDING_SQL = `(payment_status IN ('trial', 'pending') OR (COALESCE(payment_status,'') IN ('', 'registered') AND COALESCE(checkout_status,'') <> 'paid' AND ${PAID_SELECTED_SQL}))`;

// Registered - No Plan: account created but no paid plan chosen and not on Free.
// The complement of CHECKOUT_PENDING_SQL within the registered universe, so a
// customer is counted in exactly one of the two.
const REGISTERED_NO_PLAN_SQL = `(COALESCE(payment_status,'') IN ('', 'registered') AND COALESCE(checkout_status,'') <> 'paid' AND NOT (${PAID_SELECTED_SQL}))`;

// The plans that count as a paid tier SELECTION, mirrored in JS for deriveStatus
// so the row's status matches the SQL predicates above exactly.
const PAID_SELECTED_PLANS = ['solo', 'pro', 'team', 'business', 'growth', 'scale'];

// The master Customers admin data layer. One record per account (a team OWNER
// row on `users`), covering the whole lifecycle: registered, free, trialing,
// active paid, past due, canceled. Amounts come from the canonical plan-config;
// the `users` table is the reliably-populated source the app itself uses.
@Injectable()
export class CustomersAdminService {
  private readonly logger = new Logger(CustomersAdminService.name);
  private notesReady = false;

  constructor(
    private readonly db: DatabaseService,
    private readonly mailer: PlatformMailerService,
    private readonly usage: UsageService,
  ) {}

  // Self-healing internal-notes table (migrations are not auto-run here).
  private async ensureNotes(): Promise<void> {
    if (this.notesReady) return;
    try {
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS customer_notes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          author_id UUID,
          author_name TEXT,
          note TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`);
      await this.db.query(
        `CREATE INDEX IF NOT EXISTS idx_customer_notes_user ON customer_notes(user_id)`,
      );
      this.notesReady = true;
    } catch (err: any) {
      this.logger.error(`ensureNotes failed: ${err?.message}`);
    }
  }

  private async ready(): Promise<void> {
    await this.mailer.ensureSchema();
    await this.ensureNotes();
    await this.ensureCountryColumn();
  }

  // Registration country (ISO-3166 alpha-2), captured from the signup request IP.
  // Self-healing so the admin read paths never fail before the first new signup.
  private countryColReady = false;
  private async ensureCountryColumn(): Promise<void> {
    if (this.countryColReady) return;
    await this.db.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_country VARCHAR(2)`,
    );
    // Trial end / first recurring charge date (written by the Paddle webhook while
    // a subscription is trialing); shown in the admin for trialing customers.
    await this.db.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ`,
    );
    this.countryColReady = true;
  }

  // Escape a plain-text admin message and turn newlines into a simple HTML body.
  private textToHtml(text: string): string {
    const esc = String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#0f172a;line-height:1.6">${esc.replace(/\r?\n/g, '<br>')}</div>`;
  }

  // Send a free-form email to a single customer through the platform SendGrid
  // integration (the "Send Email" action on the Customers page). When `html` is
  // provided (the composer: own text + uploaded images + a CTA button), it is sent
  // as authored, wrapped in the responsive email shell; otherwise `message` is
  // treated as plain text and escaped.
  async sendCustomerEmail(
    customerId: string,
    subject: string,
    message: string,
    html?: string | null,
  ) {
    const subj = String(subject || '').trim();
    const msg = String(message || '').trim();
    const bodyHtml = String(html || '').trim();
    if (!subj) throw new BadRequestException('A subject is required.');
    if (!bodyHtml && !msg) throw new BadRequestException('A message is required.');

    const { rows } = await this.db.query(
      `SELECT id, email, name FROM users WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
      [customerId],
    );
    const cust = rows[0];
    if (!cust?.email) {
      throw new NotFoundException('Customer not found or has no email address.');
    }

    const finalHtml = bodyHtml
      ? this.mailer.wrapCustomEmail(bodyHtml)
      : this.textToHtml(msg);
    const res = await this.mailer.sendCustomEmail({
      to: cust.email,
      userId: cust.id,
      subject: subj,
      html: finalHtml,
    });

    if (res.status === 'skipped') {
      throw new BadRequestException(
        'No email provider is configured. Set the platform SendGrid key (SENDGRID_API_KEY + SENDGRID_FROM_EMAIL) first.',
      );
    }
    if (res.status === 'error') {
      throw new BadRequestException(res.reason || 'The email could not be sent.');
    }
    return { success: true, to: cust.email };
  }

  // ── Team & Seats (admin management of a customer's account team) ──────────
  private readonly MEMBER_ROLES = ['admin', 'manager', 'agent', 'viewer'];

  // Resolve the customer (account owner) + their team, or throw.
  private async ownerTeam(customerId: string) {
    const { rows } = await this.db.query(
      `SELECT id, team_id, name, email, selected_plan, plan,
              payment_status, checkout_status
         FROM users WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
      [customerId],
    );
    const owner = rows[0];
    if (!owner) throw new NotFoundException('Customer not found.');
    if (!owner.team_id) throw new BadRequestException('This customer has no workspace/team yet.');
    return owner;
  }

  private seatLimitFor(owner: any): number {
    // Payment-gated seats via the shared rule: an unpaid plan-selector caps at 1,
    // a confirmed-paid Business/Scale gets 3/5. Matches TeamsService.getTeamSeatLimit.
    return getPlan(resolveEffectivePlan(owner).planId).seats;
  }

  // Roster + seat totals for the account.
  async teamAndSeats(customerId: string) {
    const { rows } = await this.db.query(
      `SELECT id, team_id, name, email, selected_plan, plan
         FROM users WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
      [customerId],
    );
    const owner = rows[0];
    if (!owner) throw new NotFoundException('Customer not found.');
    const seatLimit = this.seatLimitFor(owner);
    if (!owner.team_id) {
      return { ownerId: owner.id, teamId: null, members: [], seats: { limit: seatLimit, used: 0, available: seatLimit } };
    }
    const { rows: members } = await this.db.query(
      `SELECT tm.user_id AS id, tm.role, tm.status, tm.joined_at,
              u.name, u.email, u.last_seen_at
         FROM team_members tm
         JOIN users u ON u.id = tm.user_id
        WHERE tm.team_id = $1 AND tm.status <> 'removed'
        ORDER BY (tm.role = 'owner') DESC, tm.joined_at ASC NULLS LAST`,
      [owner.team_id],
    );
    const used = members.filter((m) => m.status === 'active').length;
    return {
      ownerId: owner.id,
      teamId: owner.team_id,
      members: members.map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        role: m.id === owner.id ? 'owner' : m.role,
        status: m.status,
        seatAssigned: m.status === 'active',
        isOwner: m.id === owner.id || m.role === 'owner',
        joinedAt: m.joined_at,
        lastActive: m.last_seen_at,
      })),
      seats: { limit: seatLimit, used, available: Math.max(0, seatLimit - used) },
    };
  }

  async addTeamMember(customerId: string, body: { email?: string; name?: string; role?: string }) {
    const owner = await this.ownerTeam(customerId);
    const email = String(body?.email || '').trim().toLowerCase();
    const name = String(body?.name || '').trim();
    const role = this.MEMBER_ROLES.includes(String(body?.role || '').toLowerCase())
      ? String(body.role).toLowerCase()
      : 'agent';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('A valid email address is required.');
    }
    const seatLimit = this.seatLimitFor(owner);
    const { rows: cnt } = await this.db.query(
      `SELECT COUNT(*)::int AS n FROM team_members WHERE team_id = $1 AND status = 'active'`,
      [owner.team_id],
    );
    if ((cnt[0]?.n ?? 0) >= seatLimit) {
      throw new BadRequestException(
        `This account's plan includes ${seatLimit} seat${seatLimit > 1 ? 's' : ''}. Change the plan to add more users.`,
      );
    }
    let { rows: urows } = await this.db.query(
      `SELECT id FROM users WHERE LOWER(email) = $1 LIMIT 1`,
      [email],
    );
    let userId = urows[0]?.id;
    if (!userId) {
      const hash = await bcrypt.hash(randomUUID(), 10);
      const ins = await this.db.query(
        `INSERT INTO users (email, password, name, role, team_id, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, 'agent', $4, true, NOW(), NOW()) RETURNING id`,
        [email, hash, name || null, owner.team_id],
      );
      userId = ins.rows[0].id;
    } else {
      await this.db.query(`UPDATE users SET team_id = $2, updated_at = NOW() WHERE id = $1`, [userId, owner.team_id]);
    }
    await this.db.query(
      `INSERT INTO team_members (team_id, user_id, role, status, joined_at, created_at, updated_at)
       VALUES ($1, $2, $3, 'active', NOW(), NOW(), NOW())
       ON CONFLICT (team_id, user_id) DO UPDATE SET role = EXCLUDED.role, status = 'active', updated_at = NOW()`,
      [owner.team_id, userId, role],
    );
    return { success: true };
  }

  async removeTeamMember(customerId: string, memberUserId: string) {
    const owner = await this.ownerTeam(customerId);
    if (memberUserId === owner.id) {
      throw new BadRequestException('You cannot remove the account owner. Transfer ownership first.');
    }
    await this.db.query(
      `UPDATE team_members SET status = 'removed', updated_at = NOW() WHERE team_id = $1 AND user_id = $2`,
      [owner.team_id, memberUserId],
    );
    return { success: true };
  }

  async changeMemberRole(customerId: string, memberUserId: string, roleRaw: string) {
    const owner = await this.ownerTeam(customerId);
    if (memberUserId === owner.id) {
      throw new BadRequestException('The owner role is managed by ownership transfer.');
    }
    const role = this.MEMBER_ROLES.includes(String(roleRaw || '').toLowerCase())
      ? String(roleRaw).toLowerCase()
      : null;
    if (!role) throw new BadRequestException('Invalid role.');
    await this.db.query(
      `UPDATE team_members SET role = $3, updated_at = NOW() WHERE team_id = $1 AND user_id = $2`,
      [owner.team_id, memberUserId, role],
    );
    return { success: true };
  }

  async setMemberSeat(customerId: string, memberUserId: string, assigned: boolean) {
    const owner = await this.ownerTeam(customerId);
    if (memberUserId === owner.id) {
      throw new BadRequestException('The owner always holds a seat.');
    }
    if (assigned) {
      const seatLimit = this.seatLimitFor(owner);
      const { rows: cnt } = await this.db.query(
        `SELECT COUNT(*)::int AS n FROM team_members WHERE team_id = $1 AND status = 'active' AND user_id <> $2`,
        [owner.team_id, memberUserId],
      );
      if ((cnt[0]?.n ?? 0) >= seatLimit) {
        throw new BadRequestException(`All ${seatLimit} seats are in use. Free a seat or upgrade the plan.`);
      }
      await this.db.query(
        `UPDATE team_members SET status = 'active', updated_at = NOW() WHERE team_id = $1 AND user_id = $2`,
        [owner.team_id, memberUserId],
      );
    } else {
      await this.db.query(
        `UPDATE team_members SET status = 'inactive', updated_at = NOW() WHERE team_id = $1 AND user_id = $2`,
        [owner.team_id, memberUserId],
      );
    }
    return { success: true };
  }

  async transferOwnership(customerId: string, newOwnerUserId: string) {
    const owner = await this.ownerTeam(customerId);
    if (!newOwnerUserId || newOwnerUserId === owner.id) {
      throw new BadRequestException('Choose a different team member to transfer ownership to.');
    }
    const { rows } = await this.db.query(
      `SELECT user_id FROM team_members WHERE team_id = $1 AND user_id = $2 AND status <> 'removed' LIMIT 1`,
      [owner.team_id, newOwnerUserId],
    );
    if (!rows.length) throw new BadRequestException('The new owner must be an existing member of this team.');
    const client = await this.db.getClient();
    try {
      await client.query('BEGIN');
      await client.query(`UPDATE teams SET owner_id = $2, updated_at = NOW() WHERE id = $1`, [owner.team_id, newOwnerUserId]);
      await client.query(
        `UPDATE team_members SET role = 'owner', status = 'active', updated_at = NOW() WHERE team_id = $1 AND user_id = $2`,
        [owner.team_id, newOwnerUserId],
      );
      await client.query(
        `UPDATE team_members SET role = 'admin', updated_at = NOW() WHERE team_id = $1 AND user_id = $2`,
        [owner.team_id, owner.id],
      );
      await client.query(`UPDATE users SET role = 'owner', updated_at = NOW() WHERE id = $1`, [newOwnerUserId]);
      await client.query(`UPDATE users SET role = 'admin', updated_at = NOW() WHERE id = $1`, [owner.id]);
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
    return { success: true, newOwnerId: newOwnerUserId };
  }

  private readonly cols = `
    id, email, name, phone, COALESCE(preferred_language, 'en') AS language,
    offer_used, checkout_status, payment_status, plan, selected_plan,
    billing_cycle, plan_status, paddle_customer_id, paddle_subscription_id,
    signup_source, utm_source, utm_medium, utm_campaign, utm_term, utm_content,
    gclid, landing_page, signup_country, trial_ends_at, created_at, registered_at, upgraded_at, last_seen_at,
    team_id,
    (SELECT COUNT(*)::int FROM team_members tm WHERE tm.team_id = users.team_id) AS seat_count,
    (SELECT COUNT(*)::int FROM team_members tm WHERE tm.team_id = users.team_id AND tm.status = 'active') AS seats_used,
    (SELECT COALESCE(SUM(p.amount), 0)::float
       FROM payments p JOIN subscriptions s ON s.id = p.subscription_id
      WHERE s.team_id = users.team_id AND p.status = 'succeeded') AS ltv,
    (SELECT s.current_period_end FROM subscriptions s
      WHERE s.team_id = users.team_id
      ORDER BY s.created_at DESC LIMIT 1) AS next_billing`;

  // Friendly, normalized acquisition source used by both the filter and the
  // breakdown so they always agree.
  private readonly sourceExpr = `
    CASE
      WHEN COALESCE(gclid,'') <> '' THEN 'Google Ads'
      WHEN LOWER(COALESCE(utm_source,'')) LIKE '%google%' THEN 'Google Ads'
      WHEN LOWER(COALESCE(signup_source,'')) = 'exit_popup' THEN 'Exit Popup'
      WHEN LOWER(COALESCE(utm_medium,'')) LIKE '%referr%'
        OR LOWER(COALESCE(utm_source,'')) LIKE '%referr%' THEN 'Referral'
      WHEN COALESCE(signup_source,'') = '' AND COALESCE(utm_source,'') = ''
        THEN 'Direct / Organic'
      ELSE 'Other'
    END`;

  // Active seats in use = active team_members on the owner's team.
  private readonly seatsUsedExpr = `(SELECT COUNT(*)::int FROM team_members tm WHERE tm.team_id = users.team_id AND tm.status = 'active')`;

  // Plan seat allowance, mirrored from plan-config (free/solo=1, business=3,
  // scale=5) so seat filters can run in SQL alongside pagination.
  private readonly seatLimitExpr = `(CASE
      WHEN LOWER(COALESCE(selected_plan, plan, '')) IN ('business','team') THEN 3
      WHEN LOWER(COALESCE(selected_plan, plan, '')) IN ('scale','growth') THEN 5
      ELSE 1 END)`;

  // Normalized lifecycle status the tabs and badges use.
  private deriveStatus(row: any): string {
    const ps = String(row.payment_status || '').toLowerCase();
    const cs = String(row.checkout_status || '').toLowerCase();
    // A lapsed/terminated payment_status wins over checkout_status='paid' (set at
    // purchase and never cleared on cancel), so a canceled/past-due/refunded account
    // is never shown as active.
    if (ps === 'failed') return 'failed';
    if (ps === 'past_due') return 'past_due';
    if (
      ps === 'canceled' ||
      ps === 'cancelled' ||
      ps === 'suspended' ||
      ps === 'refunded' ||
      ps === 'expired'
    )
      return 'canceled';
    // A real provider trial (Paddle status 'trialing') is distinct from an account
    // that only selected a paid plan and never paid.
    if (ps === 'trialing') return 'trialing';
    if (ps === 'active' || cs === 'paid') return 'active';
    // Selected a paid plan / opened checkout but no successful payment = checkout
    // pending (NOT a trial). ps='trial' is the pre-checkout signup state, 'pending'
    // is set when a checkout is opened.
    if (ps === 'trial' || ps === 'pending') return 'checkout_pending';
    if (ps === 'free') return 'free';
    // Current signup flow (Register -> Pricing -> Checkout): the account is left
    // 'registered' with a paid plan chosen until payment lands. That IS checkout
    // pending — keep this in lock-step with CHECKOUT_PENDING_SQL so the row status,
    // the tabs, and the dedicated Checkout Pending view never disagree.
    const selected = String(row.selected_plan || '').toLowerCase();
    if (PAID_SELECTED_PLANS.includes(selected) && cs !== 'paid') {
      return 'checkout_pending';
    }
    return 'registered';
  }

  // Read-only billing lifecycle trace for ONE customer, so the Paddle
  // checkout/trial flow can be verified end-to-end (sandbox or production)
  // WITHOUT an admin login. It surfaces the exact evidence behind each
  // checkpoint: the derived admin status, the effective entitlement, the trial
  // end date, every Paddle webhook we received for this customer, all recorded
  // payments (revenue), and the lifecycle emails sent (esp. checkout recovery).
  // It performs no writes and triggers no charges.
  async billingTrace(email: string): Promise<any> {
    await this.ready();
    const emailNorm = String(email || '').trim().toLowerCase();
    if (!emailNorm) return { ok: false, error: 'A customer email is required.' };

    const userRes = await this.db.query(
      `SELECT ${this.cols} FROM users WHERE LOWER(email) = $1 ORDER BY created_at ASC LIMIT 1`,
      [emailNorm],
    );
    const row = userRes.rows[0];
    if (!row) return { ok: false, error: 'No customer found with that email.' };

    const adminStatus = this.deriveStatus(row);
    const eff = resolveEffectivePlan(row);

    // Payments = revenue evidence (team-scoped, same join the LTV column uses).
    const payRes = await this.db.query(
      `SELECT p.amount::float AS amount, p.currency, p.status,
              p.payment_date, p.created_at, p.paddle_transaction_id
         FROM payments p JOIN subscriptions s ON s.id = p.subscription_id
        WHERE s.team_id = $1
        ORDER BY p.created_at DESC
        LIMIT 25`,
      [row.team_id],
    );
    const succeeded = payRes.rows.filter((p: any) => p.status === 'succeeded');
    const totalSucceeded = succeeded.reduce(
      (a: number, p: any) => a + (Number(p.amount) || 0),
      0,
    );

    // Every Paddle webhook we received that references this customer. The
    // subscription_id column is a Stripe-era UUID FK and is not populated for
    // Paddle, so we match by subscription id / customer id / email inside the
    // JSON payload. Empty ids are guarded so they never match every row.
    const subId = String(row.paddle_subscription_id || '');
    const custId = String(row.paddle_customer_id || '');
    const evRes = await this.db.query(
      `SELECT event_type,
              COALESCE(processed_at, created_at) AS at,
              payload#>>'{data,id}'              AS data_id,
              payload#>>'{data,status}'          AS data_status,
              payload#>>'{data,subscription_id}' AS data_subscription_id,
              COALESCE(payload#>>'{data,next_billed_at}',
                       payload#>>'{data,current_billing_period,ends_at}') AS next_billed_at
         FROM webhook_events
        WHERE provider = 'paddle'
          AND ( ($1 <> '' AND payload::text ILIKE '%' || $1 || '%')
             OR ($2 <> '' AND payload::text ILIKE '%' || $2 || '%')
             OR payload::text ILIKE '%' || $3 || '%' )
        ORDER BY COALESCE(processed_at, created_at) DESC
        LIMIT 40`,
      [subId, custId, emailNorm],
    );

    // Lifecycle emails (esp. checkout_recovery + onboarding), auto vs manual.
    const mailRes = await this.db.query(
      `SELECT template, language, status, send_type,
              COALESCE(sent_at, created_at) AS at
         FROM email_log
        WHERE user_id = $1 OR LOWER(to_email) = $2
        ORDER BY COALESCE(sent_at, created_at) DESC
        LIMIT 40`,
      [row.id, emailNorm],
    );

    return {
      ok: true,
      email: row.email,
      as_of: new Date().toISOString(),
      customer: {
        name: row.name,
        language: row.language,
        selected_plan: row.selected_plan,
        plan: row.plan,
        billing_cycle: row.billing_cycle,
        payment_status: row.payment_status,
        checkout_status: row.checkout_status,
        admin_status: adminStatus,
        effective_plan: eff.planId,
        has_plan_access: eff.paid,
        trial_ends_at: row.trial_ends_at,
        paddle_customer_id: row.paddle_customer_id || null,
        paddle_subscription_id: row.paddle_subscription_id || null,
        created_at: row.created_at,
        next_billing: row.next_billing,
      },
      revenue: {
        succeeded_payment_count: succeeded.length,
        total_succeeded: totalSucceeded,
        ltv: row.ltv,
      },
      payments: payRes.rows,
      paddle_webhooks: evRes.rows,
      emails: mailRes.rows,
    };
  }

  private enrich(row: any) {
    if (!row) return row;
    const status = this.deriveStatus(row);
    // Same source of truth as the CRM guard and the usage layer: selected_plan is
    // intent only; a paid/grandfathered tier comes from `plan`; a terminated paid
    // account drops back to Free.
    const eff = resolveEffectivePlan(row);
    const cfg = getPlan(eff.planId);
    const cycle =
      row.billing_cycle === 'annual'
        ? 'annual'
        : row.billing_cycle === 'monthly'
          ? 'monthly'
          : null;

    // Seats "used / total": the denominator is the SELECTED plan's seat
    // entitlement (Solo=1, Business=3, Scale=5) — driven by the plan, never by the
    // number of users created and never gated down by payment status, so an
    // unpaid/checkout-pending Business still reads /3. The numerator is the
    // active/occupied users; the owner always holds a seat, so it is never below 1.
    const seatsLimit = getPlan(
      normalizePlanId(row.selected_plan || row.plan),
    ).seats;
    const seatsUsed = Math.max(Number(row.seats_used) || 0, 1);

    // A paid or grandfathered paid tier shows its real label and recurring price.
    // An account that only clicked Solo without paying is NOT shown as an assigned
    // "Solo $197/month" plan.
    if (!eff.isFree) {
      const recurringCents =
        cycle === 'annual' ? cfg.pricing.annualCents : cfg.pricing.monthlyCents;
      return {
        ...row,
        status,
        plan_id: eff.planId,
        plan_label: cfg.label,
        billing: cycle || 'monthly',
        intro_amount: cfg.pricing.introCents / 100,
        recurring_amount: recurringCents / 100,
        seats_limit: seatsLimit,
        seats_used: seatsUsed,
        country: row.signup_country || null,
      };
    }

    // Effective Free. Distinguish: picked a paid plan but has not paid -> Registered;
    // genuinely on Free -> Free; never picked anything -> Not selected. Never a paid
    // label or price.
    const pickedPaid =
      !!row.selected_plan && normalizePlanId(row.selected_plan) !== 'free';
    const choseFree =
      String(row.payment_status || '').toLowerCase() === 'free' ||
      (!!row.selected_plan && normalizePlanId(row.selected_plan) === 'free');
    const plan_label = pickedPaid
      ? 'Registered'
      : choseFree
        ? 'Free'
        : 'Not selected';
    const plan_id = pickedPaid
      ? 'registered'
      : choseFree
        ? 'free'
        : 'unselected';
    return {
      ...row,
      status,
      plan_id,
      plan_label,
      billing: 'free',
      intro_amount: 0,
      recurring_amount: 0,
      seats_limit: seatsLimit,
      seats_used: seatsUsed,
      country: row.signup_country || null,
    };
  }

  // WHERE clause for a status tab.
  private tabClause(tab?: string): string | null {
    switch ((tab || 'all').toLowerCase()) {
      case 'registered':
        return REGISTERED_NO_PLAN_SQL;
      case 'free':
        return `payment_status = 'free'`;
      case 'trialing':
        return `payment_status = 'trialing'`;
      case 'checkout_pending':
        return CHECKOUT_PENDING_SQL;
      case 'active':
        // checkout_status='paid' is sticky and never cleared on cancel, so exclude a
        // terminated payment_status from the paid-active set.
        return `(payment_status = 'active' OR (checkout_status = 'paid' AND LOWER(COALESCE(payment_status,'')) NOT IN ('canceled','cancelled','suspended','past_due','refunded','expired','failed')))`;
      case 'past_due':
        return `payment_status = 'past_due'`;
      case 'canceled':
        return `payment_status IN ('canceled', 'suspended')`;
      default:
        return null;
    }
  }

  private planClause(plan: string, params: any[]): string | null {
    const key = String(plan || '').toLowerCase();
    const eff = `LOWER(COALESCE(selected_plan, plan, ''))`;
    if (key === 'free') return `(${eff} = 'free' OR payment_status = 'free')`;
    if (key === 'solo') return `${eff} IN ('solo', 'pro')`;
    if (key === 'business') return `${eff} IN ('team', 'business')`;
    if (key === 'scale') return `${eff} IN ('growth', 'scale')`;
    // Registered - No Plan: account created but no plan activated. Same predicate
    // as the 'registered' tab so the plan filter and the tab agree.
    if (key === 'registered' || key === 'no_plan' || key === 'unselected')
      return REGISTERED_NO_PLAN_SQL;
    return null;
  }

  private buildWhere(opts: any): { where: string; params: any[] } {
    const clauses: string[] = [`role = 'owner'`, `deleted_at IS NULL`];
    const params: any[] = [];

    const tab = this.tabClause(opts.tab);
    if (tab) clauses.push(tab);

    if (opts.q && String(opts.q).trim()) {
      params.push(`%${String(opts.q).trim()}%`);
      clauses.push(`(email ILIKE $${params.length} OR name ILIKE $${params.length})`);
    }
    if (opts.plan && opts.plan !== 'all') {
      const pc = this.planClause(opts.plan, params);
      if (pc) clauses.push(pc);
    }
    if (opts.billing && opts.billing !== 'all') {
      params.push(String(opts.billing).toLowerCase());
      clauses.push(`LOWER(COALESCE(billing_cycle,'')) = $${params.length}`);
    }
    if (opts.paymentStatus && opts.paymentStatus !== 'all') {
      const psv = String(opts.paymentStatus).toLowerCase();
      if (psv === 'registered') {
        // Registered - No Plan (matches the 'registered' tab exactly).
        clauses.push(REGISTERED_NO_PLAN_SQL);
      } else if (psv === 'checkout_pending') {
        // Selected a paid plan but not yet paid (matches the Checkout Pending tab).
        clauses.push(CHECKOUT_PENDING_SQL);
      } else {
        params.push(psv);
        clauses.push(`LOWER(COALESCE(payment_status,'')) = $${params.length}`);
      }
    }
    if (opts.source && opts.source !== 'all') {
      params.push(opts.source);
      clauses.push(`${this.sourceExpr} = $${params.length}`);
    }
    if (opts.language && opts.language !== 'all') {
      params.push(String(opts.language).toLowerCase());
      clauses.push(`LOWER(COALESCE(preferred_language,'en')) = $${params.length}`);
    }
    if (opts.country && opts.country !== 'all') {
      // One OR MANY countries (comma-separated codes, e.g. "CL,AR,ES,EC"), plus the
      // special "Unknown" bucket (no captured country). Multi-select = OR across all.
      const parts = String(opts.country)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const codes: string[] = [];
      let includeUnknown = false;
      for (const p of parts) {
        if (p.toLowerCase() === 'unknown') includeUnknown = true;
        else if (p.toLowerCase() !== 'all') codes.push(p.toUpperCase());
      }
      const ors: string[] = [];
      if (codes.length) {
        const ph = codes
          .map((c) => {
            params.push(c);
            return `$${params.length}`;
          })
          .join(',');
        ors.push(`UPPER(COALESCE(signup_country,'')) IN (${ph})`);
      }
      if (includeUnknown) ors.push(`COALESCE(signup_country,'') = ''`);
      if (ors.length) clauses.push(`(${ors.join(' OR ')})`);
    }
    if (opts.usersRole && opts.usersRole !== 'all') {
      const r = String(opts.usersRole).toLowerCase();
      if (r === 'owner') {
        clauses.push(`EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = users.team_id AND tm.role = 'owner')`);
      } else if (r === 'admin') {
        clauses.push(`EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = users.team_id AND tm.role = 'admin' AND tm.status = 'active')`);
      } else if (r === 'agent') {
        clauses.push(`EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = users.team_id AND tm.role IN ('agent','user','viewer','manager') AND tm.status = 'active')`);
      } else if (r === 'owner_only') {
        clauses.push(`${this.seatsUsedExpr} <= 1`);
      } else if (r === 'has_additional' || r === 'multiple') {
        clauses.push(`${this.seatsUsedExpr} > 1`);
      }
    }
    if (opts.seatStatus && opts.seatStatus !== 'all') {
      const s = String(opts.seatStatus).toLowerCase();
      if (s === 'available') {
        clauses.push(`${this.seatsUsedExpr} < ${this.seatLimitExpr}`);
      } else if (s === 'full') {
        clauses.push(`${this.seatsUsedExpr} >= ${this.seatLimitExpr}`);
      } else if (s === 'one_user') {
        clauses.push(`${this.seatsUsedExpr} = 1`);
      } else if (s === 'multiple_users') {
        clauses.push(`${this.seatsUsedExpr} > 1`);
      } else if (s === 'unused') {
        clauses.push(`${this.seatLimitExpr} > 1 AND ${this.seatsUsedExpr} < ${this.seatLimitExpr}`);
      }
    }
    if (opts.from) {
      params.push(opts.from);
      clauses.push(`created_at >= $${params.length}`);
    }
    if (opts.to) {
      params.push(opts.to);
      clauses.push(`created_at <= $${params.length}`);
    }
    return { where: clauses.join(' AND '), params };
  }

  // AI Credits column (admin visibility only). Read-only, batched (no per-row
  // queries), never writes. Driven by the customer's PLAN ENTITLEMENT so it stays
  // correct automatically for every row:
  //  - Free plan -> credits_remaining / credits_total (default allowance 50, plus
  //    any purchased balance).
  //  - Solo / Business / Scale (a paid tier selected), or an active Unlimited AI
  //    add-on on a Free account -> `credits_unlimited` ("Unlimited").
  // The tier comes from the SAME field the row's Plan column uses (selected_plan,
  // falling back to plan), not the payment-gated effective plan, so a Business
  // customer reads "Unlimited" even while their checkout is still pending.
  private async attachAiCredits(rows: any[]): Promise<void> {
    if (!Array.isArray(rows) || rows.length === 0) return;
    const teamIds = Array.from(
      new Set(rows.map((r) => r?.team_id).filter(Boolean)),
    );

    let config = DEFAULT_AI_UNITS_CONFIG;
    try {
      const cfg = await this.db.query(
        `SELECT config FROM ai_unit_config WHERE id = 1`,
      );
      config = mergeAiUnitsConfig(cfg.rows[0]?.config);
    } catch {
      /* config table absent in this env -> default 50 allowance */
    }

    const accByTeam = new Map<string, any>();
    if (teamIds.length) {
      try {
        const acc = await this.db.query(
          `SELECT team_id, free_used, purchased_balance, unlimited_ai_until
             FROM ai_unit_accounts WHERE team_id = ANY($1::uuid[])`,
          [teamIds],
        );
        for (const a of acc.rows) accByTeam.set(String(a.team_id), a);
      } catch {
        /* ai-units not provisioned in this env -> Free rows show the allowance */
      }
    }

    const now = Date.now();
    for (const r of rows) {
      if (!r) continue;
      // Plan entitlement (same field the Plan column shows): Free = metered 50,
      // every paid tier = Unlimited.
      const isFreeTier =
        normalizePlanId(r.selected_plan || r.plan) === 'free';
      const acct = r.team_id ? accByTeam.get(String(r.team_id)) : null;
      const unlimitedAddon =
        !!acct?.unlimited_ai_until &&
        new Date(acct.unlimited_ai_until).getTime() > now;
      if (!isFreeTier || unlimitedAddon) {
        r.credits_unlimited = true;
        r.credits_remaining = null;
        r.credits_total = null;
        continue;
      }
      const view = computeBalanceView(
        acct?.free_used || 0,
        acct?.purchased_balance || 0,
        config,
      );
      r.credits_unlimited = false;
      r.credits_remaining = view.totalRemaining;
      r.credits_total = config.freeAllowance + view.purchased;
    }
  }

  async list(opts: any = {}) {
    await this.ready();
    // Admin can choose up to 1,000 rows per page from the Customers screen.
    const lim = Math.min(Math.max(Number(opts.limit) || 25, 1), 1000);
    const off = Math.max(Number(opts.offset) || 0, 0);
    const { where, params } = this.buildWhere(opts);

    const listParams = params.slice();
    listParams.push(lim, off);
    const { rows } = await this.db.query(
      `SELECT ${this.cols} FROM users
        WHERE ${where}
        ORDER BY created_at DESC
        LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
      listParams,
    );
    const { rows: cnt } = await this.db.query(
      `SELECT COUNT(*)::int AS n FROM users WHERE ${where}`,
      params,
    );
    const data = rows.map((r) => this.enrich(r));
    await this.attachAiCredits(data);
    return {
      data,
      total: cnt[0]?.n ?? 0,
      limit: lim,
      offset: off,
    };
  }

  // All user ids matching the current filters — for "select all matching" bulk
  // selection. Returns explicit ids (never a silent server-side send), capped so
  // one click can't select an unbounded set.
  async listIds(opts: any = {}) {
    await this.ready();
    const cap = 5000;
    const { where, params } = this.buildWhere(opts);
    const { rows } = await this.db.query(
      `SELECT id FROM users WHERE ${where} ORDER BY created_at DESC LIMIT ${cap}`,
      params,
    );
    const { rows: cnt } = await this.db.query(
      `SELECT COUNT(*)::int AS n FROM users WHERE ${where}`,
      params,
    );
    const total = cnt[0]?.n ?? 0;
    return {
      ids: rows.map((r) => r.id),
      total,
      capped: total > cap,
    };
  }

  async exportRows(opts: any = {}) {
    await this.ready();
    const { where, params } = this.buildWhere({ ...opts, tab: opts.tab });
    const { rows } = await this.db.query(
      `SELECT ${this.cols}, ${this.sourceExpr} AS source_label
         FROM users WHERE ${where} ORDER BY created_at DESC LIMIT 5000`,
      params,
    );
    return rows.map((r) => ({ ...this.enrich(r), source_label: r.source_label }));
  }

  // KPI cards + tab counts + source/offer/language breakdowns + funnel, all
  // respecting the shared filters (date range, plan, source, language, search).
  async summary(opts: any = {}) {
    await this.ready();
    // Filters minus the status tab (KPIs/breakdowns span all statuses).
    const { where, params } = this.buildWhere({ ...opts, tab: 'all' });

    const { rows: k } = await this.db.query(
      `SELECT
         COUNT(*)::int AS total_registered,
         COUNT(*) FILTER (WHERE payment_status = 'active' OR checkout_status = 'paid')::int AS active_paid,
         COUNT(*) FILTER (WHERE payment_status = 'free')::int AS free_accounts,
         COUNT(*) FILTER (WHERE payment_status = 'trialing')::int AS trialing,
         COUNT(*) FILTER (WHERE ${CHECKOUT_PENDING_SQL})::int AS checkout_pending,
         COUNT(*) FILTER (WHERE payment_status = 'past_due')::int AS past_due,
         COUNT(*) FILTER (WHERE payment_status IN ('canceled','suspended'))::int AS canceled,
         COUNT(*) FILTER (WHERE ${REGISTERED_NO_PLAN_SQL})::int AS registered,
         COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::int AS new_this_week
       FROM users WHERE ${where}`,
      params,
    );
    const c = k[0] || {};
    const totalRegistered = c.total_registered ?? 0;
    const activePaid = c.active_paid ?? 0;

    // MRR from active accounts, mapped to plan-config amounts (annual -> /12).
    const { rows: activeRows } = await this.db.query(
      `SELECT selected_plan, plan, billing_cycle FROM users
        WHERE ${where} AND (payment_status = 'active' OR checkout_status = 'paid')`,
      params,
    );
    let mrrCents = 0;
    for (const r of activeRows) {
      const cfg = getPlan(normalizePlanId(r.selected_plan || r.plan));
      if (cfg.isFree) continue;
      mrrCents +=
        r.billing_cycle === 'annual'
          ? Math.round(cfg.pricing.annualCents / 12)
          : cfg.pricing.monthlyCents;
    }
    const mrr = mrrCents / 100;
    const arr = mrr * 12;

    // Breakdowns
    const breakdown = async (expr: string) => {
      const { rows } = await this.db.query(
        `SELECT ${expr} AS key, COUNT(*)::int AS count
           FROM users WHERE ${where}
          GROUP BY 1 ORDER BY count DESC LIMIT 20`,
        params,
      );
      return rows;
    };
    const bySource = await breakdown(this.sourceExpr);
    const byLanguage = await breakdown(`COALESCE(preferred_language, 'en')`);
    const byCountry = await breakdown(
      `COALESCE(NULLIF(signup_country, ''), 'Unknown')`,
    );
    const byPlanRaw = await breakdown(
      `CASE
         WHEN payment_status = 'free' OR LOWER(COALESCE(selected_plan,plan,'')) = 'free' THEN 'free'
         WHEN LOWER(COALESCE(selected_plan,plan,'')) IN ('solo','pro') THEN 'solo'
         WHEN LOWER(COALESCE(selected_plan,plan,'')) IN ('team','business') THEN 'business'
         WHEN LOWER(COALESCE(selected_plan,plan,'')) IN ('growth','scale') THEN 'scale'
         ELSE 'unselected'
       END`,
    );
    const planLabels: Record<string, string> = {
      free: 'Free ($0)',
      solo: 'Solo ($197)',
      business: 'Business ($347)',
      scale: 'Scale ($497)',
      unselected: 'Registered - No Plan',
    };
    const byPlan = byPlanRaw.map((r: any) => ({
      // Keep the machine id (free/solo/business/scale/unselected) alongside the
      // display label so the "Customers by Plan" cards can match on it reliably;
      // the label alone (e.g. "Solo ($197)") broke that lookup and showed 0.
      id: r.key,
      key: planLabels[r.key] || r.key,
      count: r.count,
    }));


    // -------------------------------------------------------------------------
    // Admin analytics cards: same canonical definitions as ECommerceWorkspace,
    // but across the ADMIN'S filtered customer population rather than one tenant.
    // -------------------------------------------------------------------------
    const { rows: analyticsRows } = await this.db.query(
      `SELECT id, team_id, last_seen_at, payment_status, checkout_status,
              selected_plan, plan
         FROM users
        WHERE ${where}`,
      params,
    );

    // Owner accounts can legitimately have users.team_id = NULL while owning a
    // team through teams.owner_id. Resolve that fallback in one batch so
    // Workspace Opportunity does not incorrectly classify those owners as
    // "No Workspace".
    const ownerIds = analyticsRows
      .map((r: any) => String(r?.id || ''))
      .filter(Boolean);

    const ownedTeamByOwner = new Map<string, string>();
    if (ownerIds.length) {
      try {
        const { rows: ownedTeams } = await this.db.query(
          `SELECT owner_id::text AS owner_id, id::text AS team_id
             FROM teams
            WHERE owner_id = ANY($1::uuid[])`,
          [ownerIds],
        );
        ownedTeams.forEach((row: any) => {
          if (row?.owner_id && row?.team_id && !ownedTeamByOwner.has(String(row.owner_id))) {
            ownedTeamByOwner.set(String(row.owner_id), String(row.team_id));
          }
        });
      } catch (error: any) {
        this.logger.warn(
          `Admin workspace owner-team resolution unavailable: ${error?.message || error}`,
        );
      }
    }

    const analyticsTeamId = (r: any): string => {
      const direct = String(r?.team_id || '').trim();
      if (direct) return direct;
      return ownedTeamByOwner.get(String(r?.id || '')) || '';
    };

    // Customer Status — same mutually-exclusive semantics as the admin tabs.
    const paidPlanSelected = (r: any) => {
      const selected = String(r?.selected_plan || r?.plan || '')
        .trim()
        .toLowerCase();
      return ['solo', 'pro', 'business', 'team', 'scale', 'growth'].includes(
        selected,
      );
    };

    const customerStatusRows = [
      {
        id: 'free',
        key: 'Free',
        count: analyticsRows.filter(
          (r: any) => String(r?.payment_status || '').toLowerCase() === 'free',
        ).length,
      },
      {
        id: 'checkout_pending',
        key: 'Checkout Pending',
        count: analyticsRows.filter((r: any) => {
          const ps = String(r?.payment_status || '').toLowerCase();
          const cs = String(r?.checkout_status || '').toLowerCase();
          const paid = ps === 'active' || cs === 'paid';
          return paidPlanSelected(r) && !paid;
        }).length,
      },
      {
        id: 'registered',
        key: 'Registered / No Plan',
        count: analyticsRows.filter((r: any) => {
          const ps = String(r?.payment_status || '').toLowerCase();
          const cs = String(r?.checkout_status || '').toLowerCase();
          const isFree = ps === 'free';
          const paid = ps === 'active' || cs === 'paid';
          return !isFree && !paidPlanSelected(r) && !paid;
        }).length,
      },
      {
        id: 'paid',
        key: 'Paid',
        count: analyticsRows.filter((r: any) => {
          const ps = String(r?.payment_status || '').toLowerCase();
          const cs = String(r?.checkout_status || '').toLowerCase();
          return ps === 'active' || cs === 'paid';
        }).length,
      },
    ];

    // Customer Activity — four non-overlapping buckets that always sum to the
    // filtered customer total. last_seen_at=NULL belongs to Inactive 30+ Days.
    const now = Date.now();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayTs = startOfToday.getTime();
    const sevenDaysAgo = now - 7 * 86400000;
    const thirtyDaysAgo = now - 30 * 86400000;
    const seenAt = (r: any): number | null => {
      const ts = r?.last_seen_at ? new Date(r.last_seen_at).getTime() : NaN;
      return Number.isFinite(ts) ? ts : null;
    };

    const customerActivityRows = [
      {
        id: 'today',
        key: 'Active Today',
        count: analyticsRows.filter((r: any) => {
          const ts = seenAt(r);
          return ts != null && ts >= todayTs;
        }).length,
      },
      {
        id: 'last_7_days',
        key: 'Active Last 7 Days',
        count: analyticsRows.filter((r: any) => {
          const ts = seenAt(r);
          return ts != null && ts >= sevenDaysAgo && ts < todayTs;
        }).length,
      },
      {
        id: 'inactive_7_30',
        key: 'Inactive 7–30 Days',
        count: analyticsRows.filter((r: any) => {
          const ts = seenAt(r);
          return ts != null && ts >= thirtyDaysAgo && ts < sevenDaysAgo;
        }).length,
      },
      {
        id: 'inactive_30_plus',
        key: 'Inactive 30+ Days',
        count: analyticsRows.filter((r: any) => {
          const ts = seenAt(r);
          return ts == null || ts < thirtyDaysAgo;
        }).length,
      },
    ];

    // Workspace Opportunity — same source of truth as ECommerceWorkspace:
    // workspace_entitlements. `active` = paid workspace, `past_due`/`suspended`
    // = trial/pending recovery opportunity. A resolved team with no qualifying
    // entitlement is "Has Workspace"; no resolved team is "No Workspace".
    const entitlementByTeam = new Map<string, Set<string>>();
    const teamIds = [
      ...new Set(
        analyticsRows
          .map((r: any) => analyticsTeamId(r))
          .filter(Boolean),
      ),
    ];

    if (teamIds.length) {
      try {
        const entitlementRes = await this.db.query(
          `SELECT team_id::text AS team_id, status
             FROM workspace_entitlements
            WHERE team_id = ANY($1::uuid[])
              AND status IN ('active','past_due','suspended')`,
          [teamIds],
        );

        entitlementRes.rows.forEach((row: any) => {
          const teamId = String(row?.team_id || '');
          if (!teamId) return;
          if (!entitlementByTeam.has(teamId)) {
            entitlementByTeam.set(teamId, new Set<string>());
          }
          entitlementByTeam
            .get(teamId)!
            .add(String(row?.status || '').toLowerCase());
        });
      } catch (error: any) {
        // Older environments without workspace_entitlements must not break the
        // whole Admin Customers summary.
        this.logger.warn(
          `Admin Workspace Opportunity summary unavailable: ${error?.message || error}`,
        );
      }
    }

    const workspaceBucket = (r: any) => {
      const teamId = analyticsTeamId(r);
      if (!teamId) return 'none';

      const statuses = entitlementByTeam.get(teamId);
      if (statuses?.has('active')) return 'paid_workspace';
      if (statuses?.has('past_due') || statuses?.has('suspended')) {
        return 'trial_pending';
      }
      return 'has_workspace';
    };

    const workspaceOpportunityRows = [
      {
        id: 'none',
        key: 'No Workspace',
        count: analyticsRows.filter(
          (r: any) => workspaceBucket(r) === 'none',
        ).length,
      },
      {
        id: 'has_workspace',
        key: 'Has Workspace',
        count: analyticsRows.filter(
          (r: any) => workspaceBucket(r) === 'has_workspace',
        ).length,
      },
      {
        id: 'trial_pending',
        key: 'Workspace Trial / Pending',
        count: analyticsRows.filter(
          (r: any) => workspaceBucket(r) === 'trial_pending',
        ).length,
      },
      {
        id: 'paid_workspace',
        key: 'Paid Workspace',
        count: analyticsRows.filter(
          (r: any) => workspaceBucket(r) === 'paid_workspace',
        ).length,
      },
    ];

    // Funnel (respects the same filters): registered -> plan selected ->
    // checkout started -> payment completed.
    const { rows: f } = await this.db.query(
      `SELECT
         COUNT(*)::int AS registered,
         COUNT(*) FILTER (WHERE selected_plan IS NOT NULL)::int AS plan_selected,
         COUNT(*) FILTER (WHERE payment_status IN ('trial','pending','active','past_due','canceled') OR checkout_status = 'paid')::int AS checkout_started,
         COUNT(*) FILTER (WHERE payment_status = 'active' OR checkout_status = 'paid')::int AS payment_completed
       FROM users WHERE ${where}`,
      params,
    );
    const fr = f[0] || {};

    return {
      kpis: {
        totalRegistered,
        activeCustomers: activePaid,
        mrr,
        arr,
        conversionRate:
          totalRegistered > 0
            ? Math.round((activePaid / totalRegistered) * 1000) / 10
            : 0,
        freeAccounts: c.free_accounts ?? 0,
        newThisWeek: c.new_this_week ?? 0,
        activePctOfTotal:
          totalRegistered > 0
            ? Math.round((activePaid / totalRegistered) * 1000) / 10
            : 0,
        freePctOfTotal:
          totalRegistered > 0
            ? Math.round(((c.free_accounts ?? 0) / totalRegistered) * 1000) / 10
            : 0,
      },
      tabs: {
        all: totalRegistered,
        registered: c.registered ?? 0,
        free: c.free_accounts ?? 0,
        checkout_pending: c.checkout_pending ?? 0,
        trialing: c.trialing ?? 0,
        active: activePaid,
        past_due: c.past_due ?? 0,
        canceled: c.canceled ?? 0,
      },
      funnel: {
        registered: fr.registered ?? 0,
        planSelected: fr.plan_selected ?? 0,
        checkoutStarted: fr.checkout_started ?? 0,
        paymentCompleted: fr.payment_completed ?? 0,
      },
      breakdowns: {
        source: bySource,
        plan: byPlan,
        language: byLanguage,
        country: byCountry,
        customerStatus: customerStatusRows,
        customerActivity: customerActivityRows,
        workspaceOpportunity: workspaceOpportunityRows,
      },
      // Explicit aliases make these analytics easy to inspect in Network/Swagger and
      // keep older frontends compatible while the Admin UI is being rolled out.
      customerActivity: customerActivityRows,
      workspaceOpportunity: workspaceOpportunityRows,
      analyticsTotals: {
        customerActivity: customerActivityRows.reduce(
          (sum: number, row: any) => sum + Number(row.count || 0),
          0,
        ),
        workspaceOpportunity: workspaceOpportunityRows.reduce(
          (sum: number, row: any) => sum + Number(row.count || 0),
          0,
        ),
      },
    };
  }

  // ---- detail ---------------------------------------------------------------

  async detail(id: string) {
    await this.ready();
    const { rows } = await this.db.query(
      `SELECT ${this.cols}, is_active, ${this.sourceExpr} AS source_label
         FROM users WHERE id = $1`,
      [id],
    );
    const row = rows[0];
    if (!row) return { customer: null };
    const customer = { ...this.enrich(row), source_label: row.source_label };

    const [subscription, payments, notes, activity, usage, emailHistory] =
      await Promise.all([
        this.subscription(row),
        this.payments(row.team_id),
        this.listNotes(id),
        this.activity(id, row),
        this.usageFor(row.team_id),
        // Full email audit for this address (auto / manual / bulk). Best-effort.
        row.email
          ? this.mailer.emailHistoryForAddress(row.email).catch(() => null)
          : Promise.resolve(null),
      ]);

    return { customer, subscription, payments, notes, activity, usage, emailHistory };
  }

  private async subscription(row: any) {
    const planId = normalizePlanId(row.selected_plan || row.plan);
    const cfg = getPlan(planId);
    const cycle = row.billing_cycle === 'annual' ? 'annual' : 'monthly';
    let nextBilling: any = null;
    let periodStart: any = null;
    if (row.team_id) {
      try {
        const { rows } = await this.db.query(
          `SELECT current_period_end, current_period_start, status
             FROM subscriptions WHERE team_id = $1
            ORDER BY created_at DESC LIMIT 1`,
          [row.team_id],
        );
        nextBilling = rows[0]?.current_period_end ?? null;
        periodStart = rows[0]?.current_period_start ?? null;
      } catch {
        /* subscriptions row may not exist */
      }
    }
    return {
      plan: cfg.label,
      planId,
      isFree: cfg.isFree,
      status: this.deriveStatus(row),
      billingCycle: cfg.isFree ? null : cycle,
      seatsLimit: cfg.seats,
      introAmount: cfg.pricing.introCents / 100,
      recurringAmount: cfg.isFree
        ? 0
        : (cycle === 'annual'
            ? cfg.pricing.annualCents
            : cfg.pricing.monthlyCents) / 100,
      startDate: periodStart || row.registered_at || row.created_at,
      nextBillingDate: nextBilling,
      paddleCustomerId: row.paddle_customer_id || null,
      paddleSubscriptionId: row.paddle_subscription_id || null,
    };
  }

  // Real payment history from the payments table (joined via the team's
  // subscription). Never invented — empty when there are no recorded payments.
  private async payments(teamId?: string | null) {
    if (!teamId) return [];
    try {
      const { rows } = await this.db.query(
        `SELECT p.id, p.amount, p.currency, p.status,
                COALESCE(p.paddle_transaction_id, p.stripe_payment_intent_id) AS transaction_id,
                p.payment_date, p.created_at
           FROM payments p
           JOIN subscriptions s ON s.id = p.subscription_id
          WHERE s.team_id = $1
          ORDER BY p.payment_date DESC NULLS LAST, p.created_at DESC
          LIMIT 100`,
        [teamId],
      );
      return rows;
    } catch (err: any) {
      this.logger.error(`payments lookup failed: ${err?.message}`);
      return [];
    }
  }

  // Activity timeline assembled from real timestamps we already store. No new
  // tracking, no fabrication.
  private async activity(id: string, row: any) {
    const events: Array<{ type: string; label: string; at: any }> = [];
    const push = (type: string, label: string, at: any) => {
      if (at) events.push({ type, label, at });
    };
    push('account_created', 'Account created', row.registered_at || row.created_at);
    push('plan_changed', 'Plan changed / upgraded', row.upgraded_at);
    push('email_welcome', 'Welcome email sent', row.welcome_email_sent_at);
    if (row.deleted_at) push('deleted', 'Account removed', row.deleted_at);

    try {
      const { rows: emails } = await this.db.query(
        `SELECT template, subject, status, sent_at, opened_at, clicked_at, created_at
           FROM email_log WHERE user_id = $1
          ORDER BY COALESCE(sent_at, created_at) DESC LIMIT 30`,
        [id],
      );
      for (const e of emails) {
        const label =
          e.template === 'admin_custom'
            ? `Email sent${e.subject ? `: "${e.subject}"` : ''} (${e.status || 'queued'})`
            : `Email: ${e.template} (${e.status || 'queued'})`;
        push('email', label, e.sent_at || e.created_at);
      }
    } catch {
      /* email_log optional */
    }

    const pays = await this.payments(row.team_id);
    for (const p of pays) {
      push(
        'payment',
        `Payment ${p.status}: $${p.amount} ${p.currency || 'USD'}`,
        p.payment_date || p.created_at,
      );
    }

    events.sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
    );
    return events;
  }

  private async usageFor(teamId?: string | null) {
    try {
      return await this.usage.getUsageSummary(teamId || null);
    } catch {
      return null;
    }
  }

  // ---- notes ----------------------------------------------------------------

  async listNotes(userId: string) {
    await this.ensureNotes();
    try {
      const { rows } = await this.db.query(
        `SELECT id, author_id, author_name, note, created_at
           FROM customer_notes WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId],
      );
      return rows;
    } catch {
      return [];
    }
  }

  async addNote(userId: string, note: string, author?: any) {
    await this.ensureNotes();
    const text = String(note || '').trim();
    if (!text) throw new BadRequestException('Note text is required');
    const { rows } = await this.db.query(
      `INSERT INTO customer_notes (user_id, author_id, author_name, note)
       VALUES ($1, $2, $3, $4)
       RETURNING id, author_id, author_name, note, created_at`,
      [userId, author?.id || null, author?.name || author?.email || null, text],
    );
    return rows[0];
  }

  async deleteNote(userId: string, noteId: string) {
    await this.ensureNotes();
    const { rowCount } = await this.db.query(
      `DELETE FROM customer_notes WHERE id = $1 AND user_id = $2`,
      [noteId, userId],
    );
    return { deleted: (rowCount ?? 0) > 0 };
  }

  // ---- lifecycle actions ----------------------------------------------------

  // Move a customer between plans. Updates the real account configuration the
  // app reads (access, limits, display). NOTE: for a customer with a live Paddle
  // subscription this does not itself reprice Paddle — that billing swap is the
  // separate lifecycle step (needs a live Paddle change + verification).
  async changePlan(userId: string, dto: any) {
    await this.ready();
    const planId = normalizePlanId(dto?.plan);
    const isFree = planId === 'free';
    const cycle = ['monthly', 'annual'].includes(String(dto?.billingCycle))
      ? dto.billingCycle
      : isFree
        ? null
        : 'monthly';
    if (isFree) {
      await this.db.query(
        `UPDATE users
            SET selected_plan = 'free', billing_cycle = NULL,
                payment_status = 'free', checkout_status = 'free',
                plan_status = 'active', upgraded_at = NOW(), updated_at = NOW()
          WHERE id = $1`,
        [userId],
      );
    } else {
      const legacyKey =
        planId === 'business' ? 'team' : planId === 'scale' ? 'growth' : 'solo';
      await this.db.query(
        `UPDATE users
            SET selected_plan = $2, billing_cycle = $3,
                plan_status = 'active', upgraded_at = NOW(), updated_at = NOW()
          WHERE id = $1`,
        [userId, legacyKey, cycle],
      );
    }
    const { rows } = await this.db.query(
      `SELECT ${this.cols} FROM users WHERE id = $1`,
      [userId],
    );
    return { success: true, customer: this.enrich(rows[0]) };
  }

  // Edit basic contact fields (name, phone, language). Never blanks existing
  // values with empty input.
  async updateCustomer(userId: string, dto: any) {
    await this.ready();
    const name = dto?.name != null ? String(dto.name).slice(0, 200) : null;
    const phone = dto?.phone != null ? String(dto.phone).slice(0, 40) : null;
    const language = ['en', 'es', 'pt'].includes(
      String(dto?.language || '').toLowerCase(),
    )
      ? String(dto.language).toLowerCase()
      : null;
    await this.db.query(
      `UPDATE users SET
         name = COALESCE(NULLIF($2, ''), name),
         phone = COALESCE(NULLIF($3, ''), phone),
         preferred_language = COALESCE($4, preferred_language),
         updated_at = NOW()
       WHERE id = $1`,
      [userId, name, phone, language],
    );
    const { rows } = await this.db.query(
      `SELECT ${this.cols} FROM users WHERE id = $1`,
      [userId],
    );
    return { success: true, customer: this.enrich(rows[0]) };
  }

  // Deactivate: block access, keep the account and history.
  async deactivate(userId: string) {
    await this.ready();
    const { rowCount } = await this.db.query(
      `UPDATE users SET is_active = false,
              token_version = COALESCE(token_version, 0) + 1, updated_at = NOW()
        WHERE id = $1`,
      [userId],
    );
    return { deactivated: (rowCount ?? 0) > 0 };
  }

  // Delete (soft): hide from the list + block access. Financial records in the
  // payments table are deliberately left untouched.
  async remove(userId: string) {
    await this.ready();
    const { rowCount } = await this.db.query(
      `UPDATE users SET deleted_at = NOW(), is_active = false,
              token_version = COALESCE(token_version, 0) + 1, updated_at = NOW()
        WHERE id = $1 AND deleted_at IS NULL`,
      [userId],
    );
    return { deleted: (rowCount ?? 0) > 0 };
  }

  // Create a proper account (team + owner user + owner membership) with a random
  // password. Shared by import and the admin "Add Customer" action. Caller must
  // have already checked the email does not exist.
  private async createAccount(
    email: string,
    opts: {
      name?: string | null;
      phone?: string | null;
      planId?: string | null;
      language?: string | null;
      source?: string | null;
    },
  ): Promise<{ id: string; teamId: string }> {
    const planId = opts.planId ? normalizePlanId(opts.planId) : null;
    const isFree = planId === 'free';
    const knownPaid = !!planId && !isFree;
    const selectedPlan = planId
      ? isFree
        ? 'free'
        : planId === 'business'
          ? 'team'
          : planId === 'scale'
            ? 'growth'
            : 'solo'
      : null;
    const paymentStatus = isFree ? 'free' : 'registered';
    const checkoutStatus = isFree ? 'free' : 'registered';
    const billingCycle = knownPaid ? 'monthly' : null;

    const teamName = opts.name
      ? `${String(opts.name).split(' ')[0]}'s Team`
      : 'New Team';
    const { rows: t } = await this.db.query(
      `INSERT INTO teams (name, created_at, updated_at) VALUES ($1, NOW(), NOW()) RETURNING id`,
      [teamName],
    );
    const teamId = t[0].id;
    const password = await bcrypt.hash(randomUUID(), 10);
    const { rows: u } = await this.db.query(
      `INSERT INTO users
         (email, password, name, phone, role, plan, selected_plan, is_active,
          payment_status, billing_cycle, checkout_status, team_id,
          preferred_language, signup_source, offer_used, registered_at,
          created_at, updated_at)
       VALUES ($1,$2,$3,$4,'owner','TRIAL',$5,true,$6,$7,$8,$9,$10,$11,'standard',NOW(),NOW(),NOW())
       RETURNING id`,
      [
        email,
        password,
        opts.name || null,
        opts.phone || null,
        selectedPlan,
        paymentStatus,
        billingCycle,
        checkoutStatus,
        teamId,
        opts.language || 'en',
        opts.source || 'admin',
      ],
    );
    const uid = u[0].id;
    await this.db.query(
      `UPDATE teams SET owner_id = $1, updated_at = NOW() WHERE id = $2`,
      [uid, teamId],
    );
    await this.db.query(
      `INSERT INTO team_members (team_id, user_id, role, status, created_at, updated_at)
       VALUES ($1, $2, 'owner', 'active', NOW(), NOW())
       ON CONFLICT (team_id, user_id) DO NOTHING`,
      [teamId, uid],
    );
    return { id: uid, teamId };
  }

  // Admin "Add Customer": create one account. Rejects duplicate emails.
  async createCustomer(dto: any) {
    await this.ready();
    const email = String(dto?.email || '').trim().toLowerCase();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      throw new BadRequestException('A valid email is required');
    }
    const { rows: existing } = await this.db.query(
      `SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [email],
    );
    if (existing[0]) {
      throw new BadRequestException('An account with this email already exists');
    }
    const language = ['en', 'es', 'pt'].includes(
      String(dto?.language || '').toLowerCase(),
    )
      ? String(dto.language).toLowerCase()
      : 'en';
    const { id } = await this.createAccount(email, {
      name: dto?.name ? String(dto.name).slice(0, 200) : null,
      phone: dto?.phone ? String(dto.phone).slice(0, 40) : null,
      planId: dto?.plan ? normalizePlanId(dto.plan) : null,
      language,
      source: dto?.source ? String(dto.source).slice(0, 64) : 'admin',
    });
    const { rows } = await this.db.query(
      `SELECT ${this.cols} FROM users WHERE id = $1`,
      [id],
    );
    return { success: true, customer: this.enrich(rows[0]) };
  }

  // Bulk import customers from parsed CSV rows. Upserts by email: existing
  // accounts get their attributes updated (never overwritten with blanks); new
  // emails get a proper account created (team + owner membership + random
  // password). Capped and best-effort per row so one bad row can't abort the run.
  async importCustomers(rows: any[]) {
    await this.ready();
    const list = Array.isArray(rows) ? rows.slice(0, 2000) : [];
    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const raw of list) {
      const email = String(raw?.email || '').trim().toLowerCase();
      if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        skipped += 1;
        continue;
      }
      const name = raw?.name ? String(raw.name).slice(0, 200) : null;
      const phone = raw?.phone ? String(raw.phone).slice(0, 40) : null;
      const language = ['en', 'es', 'pt'].includes(
        String(raw?.language || '').toLowerCase(),
      )
        ? String(raw.language).toLowerCase()
        : null;
      const source = raw?.source ? String(raw.source).slice(0, 64) : 'import';
      const planId = raw?.plan ? normalizePlanId(raw.plan) : null;

      try {
        const { rows: existing } = await this.db.query(
          `SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
          [email],
        );
        if (existing[0]) {
          await this.db.query(
            `UPDATE users SET
               name = COALESCE($2, name),
               phone = COALESCE($3, phone),
               preferred_language = COALESCE($4, preferred_language),
               signup_source = COALESCE(NULLIF($5, ''), signup_source),
               updated_at = NOW()
             WHERE id = $1`,
            [existing[0].id, name, phone, language, source],
          );
          if (planId) await this.changePlan(existing[0].id, { plan: planId });
          updated += 1;
          continue;
        }

        await this.createAccount(email, { name, phone, planId, language, source });
        created += 1;
      } catch (err: any) {
        errors.push(`${email}: ${err?.message}`);
        skipped += 1;
      }
    }
    return { created, updated, skipped, errors: errors.slice(0, 20) };
  }

  // Read-only plan catalog for the plan filter + Change Plan UI.
  plansCatalog() {
    return publicPlansConfig();
  }

  planKeys() {
    return PLAN_ORDER;
  }
}
