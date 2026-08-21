import { Injectable, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { UsageService } from '../plans/usage.service';
import { PlatformMailerService } from '../platform-mail/platform-mailer.service';
import {
  DEFAULT_AI_UNITS_CONFIG,
  mergeAiUnitsConfig,
  AiUnitsConfig,
  actionCost,
  computeCycleReset,
  computeBalanceView,
  planConsumption,
  toYMD,
} from './ai-units-logic';

@Injectable()
export class AiUnitsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly usage: UsageService,
    private readonly mailer: PlatformMailerService,
  ) {}

  private schemaReady = false;
  private schemaInit: Promise<void> | null = null;

  // ---------------------------------------------------------------------------
  // Schema (serialized init + advisory lock, per the shipped module pattern).
  // ---------------------------------------------------------------------------
  private async ensureSchema(): Promise<void> {
    if (this.schemaReady) return;
    if (!this.schemaInit) {
      this.schemaInit = this.initSchema().then(
        () => {
          this.schemaReady = true;
        },
        (e) => {
          this.schemaInit = null;
          throw e;
        },
      );
    }
    await this.schemaInit;
  }

  private async initSchema(): Promise<void> {
    const lock = await this.db.getClient();
    try {
      await lock.query('SELECT pg_advisory_lock($1)', [792141]);

      await this.db.query(`
        CREATE TABLE IF NOT EXISTS ai_unit_accounts (
          team_id UUID PRIMARY KEY REFERENCES teams(id) ON DELETE CASCADE,
          free_used INT NOT NULL DEFAULT 0,
          purchased_balance INT NOT NULL DEFAULT 0,
          cycle_start DATE NOT NULL,
          cycle_reset DATE NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      await this.db.query(`
        CREATE TABLE IF NOT EXISTS ai_unit_ledger (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
          user_id UUID,
          action_type VARCHAR(40) NOT NULL,
          units_charged INT NOT NULL DEFAULT 0,
          free_charged INT NOT NULL DEFAULT 0,
          purchased_charged INT NOT NULL DEFAULT 0,
          balance_before INT,
          balance_after INT,
          model VARCHAR(80),
          provider VARCHAR(40),
          internal_cost NUMERIC(12,6),
          outcome VARCHAR(20) NOT NULL DEFAULT 'success',
          metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      await this.db.query(
        `CREATE INDEX IF NOT EXISTS idx_ai_unit_ledger_team ON ai_unit_ledger(team_id, created_at DESC)`,
      );

      await this.db.query(`
        CREATE TABLE IF NOT EXISTS ai_unit_purchases (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
          package_id VARCHAR(40),
          units INT NOT NULL,
          amount NUMERIC(12,2),
          currency VARCHAR(8) DEFAULT 'USD',
          paddle_transaction_id VARCHAR(255) UNIQUE,
          status VARCHAR(20) NOT NULL DEFAULT 'completed',
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      await this.db.query(
        `CREATE INDEX IF NOT EXISTS idx_ai_unit_purchases_team ON ai_unit_purchases(team_id, created_at DESC)`,
      );

      await this.db.query(`
        CREATE TABLE IF NOT EXISTS ai_unit_config (
          id INT PRIMARY KEY DEFAULT 1,
          config JSONB NOT NULL DEFAULT '{}'::jsonb,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      // Admin-only HUD preview allow-list (user ids). Kept separate from the
      // merged config so it survives config edits.
      await this.db.query(
        `ALTER TABLE ai_unit_config ADD COLUMN IF NOT EXISTS admin_preview_user_ids JSONB NOT NULL DEFAULT '[]'::jsonb`,
      );
      // Unlimited AI add-on ($147/mo): active while `unlimited_ai_until` is in the
      // future. Each renewal pushes the date forward; a cancel simply stops the
      // renewal so it lapses at the paid-through date. Purchased credits untouched.
      await this.db.query(
        `ALTER TABLE ai_unit_accounts ADD COLUMN IF NOT EXISTS unlimited_ai_until TIMESTAMPTZ`,
      );
      await this.db.query(
        `ALTER TABLE ai_unit_accounts ADD COLUMN IF NOT EXISTS unlimited_ai_sub_id VARCHAR(255)`,
      );
    } finally {
      try {
        await lock.query('SELECT pg_advisory_unlock($1)', [792141]);
      } catch {
        /* ignore */
      }
      lock.release();
    }
  }

  // ---------------------------------------------------------------------------
  // Config (defaults + admin overrides).
  // ---------------------------------------------------------------------------
  async getConfig(): Promise<AiUnitsConfig> {
    await this.ensureSchema();
    try {
      const { rows } = await this.db.query(`SELECT config FROM ai_unit_config WHERE id = 1`);
      return mergeAiUnitsConfig(rows[0]?.config);
    } catch {
      return DEFAULT_AI_UNITS_CONFIG;
    }
  }

  async setConfig(patch: any): Promise<AiUnitsConfig> {
    await this.ensureSchema();
    const current = await this.getConfig();
    const merged = mergeAiUnitsConfig({ ...current, ...(patch || {}) });
    await this.db.query(
      `INSERT INTO ai_unit_config (id, config, updated_at)
       VALUES (1, $1::jsonb, NOW())
       ON CONFLICT (id) DO UPDATE SET config = EXCLUDED.config, updated_at = NOW()`,
      [JSON.stringify(merged)],
    );
    return merged;
  }

  // ---------------------------------------------------------------------------
  // Team resolution + per-account cycle.
  // ---------------------------------------------------------------------------
  private async resolveAccountTeam(user: any): Promise<string | null> {
    if (user?.teamId) return user.teamId;
    if (!user?.id) return null;
    // Team the user owns.
    const owned = await this.db.query(`SELECT id FROM teams WHERE owner_id = $1 LIMIT 1`, [user.id]);
    if (owned.rows[0]?.id) return owned.rows[0].id;
    // Team the user belongs to as a member (covers members/admins whose
    // users.team_id is not set). Guarded in case the table is absent.
    try {
      const member = await this.db.query(
        `SELECT team_id FROM team_members WHERE user_id = $1 AND status <> 'removed' LIMIT 1`,
        [user.id],
      );
      if (member.rows[0]?.team_id) return member.rows[0].team_id;
    } catch {
      /* team_members not present — fall through */
    }
    // Last resort: the team recorded on the user row.
    try {
      const u = await this.db.query(`SELECT team_id FROM users WHERE id = $1 LIMIT 1`, [user.id]);
      if (u.rows[0]?.team_id) return u.rows[0].team_id;
    } catch {
      /* ignore */
    }
    return null;
  }

  private async getTeamSignup(teamId: string): Promise<Date> {
    const { rows } = await this.db.query(`SELECT created_at FROM teams WHERE id = $1`, [teamId]);
    const c = rows[0]?.created_at;
    return c ? new Date(c) : new Date();
  }

  private async ensureAccount(teamId: string): Promise<void> {
    const signup = await this.getTeamSignup(teamId);
    const { cycleStart, cycleReset } = computeCycleReset(signup, new Date());
    await this.db.query(
      `INSERT INTO ai_unit_accounts (team_id, free_used, purchased_balance, cycle_start, cycle_reset)
       VALUES ($1, 0, 0, $2, $3)
       ON CONFLICT (team_id) DO NOTHING`,
      [teamId, toYMD(cycleStart), toYMD(cycleReset)],
    );
  }

  /**
   * Read the account. IMPORTANT (client rule, 2026-08-20): the Free 50-unit
   * allowance is a ONE-TIME grant. It does NOT reset monthly and is never
   * replenished automatically — once `free_used` reaches the allowance the
   * account has 0 free units until it buys more or upgrades. `cycle_start` /
   * `cycle_reset` are retained for historical/compat only and `free_used` is
   * never zeroed here.
   */
  private async rollCycleIfNeeded(teamId: string): Promise<any> {
    await this.ensureAccount(teamId);
    const sel = `SELECT team_id, free_used, purchased_balance,
                        to_char(cycle_start,'YYYY-MM-DD') AS cycle_start,
                        to_char(cycle_reset,'YYYY-MM-DD') AS cycle_reset
                 FROM ai_unit_accounts WHERE team_id = $1`;
    const { rows } = await this.db.query(sel, [teamId]);
    return (
      rows[0] || {
        free_used: 0,
        purchased_balance: 0,
        cycle_start: null,
        cycle_reset: null,
      }
    );
  }

  // ---------------------------------------------------------------------------
  // Unlimited AI add-on ($147/mo). Active while unlimited_ai_until is in the
  // future. A Free account with an active add-on is treated as unlimited (no
  // deduction, no block, "Unlimited AI" shown) — its base plan stays Free.
  // ---------------------------------------------------------------------------
  async isUnlimitedAiActive(teamId: string): Promise<boolean> {
    if (!teamId) return false;
    try {
      const { rows } = await this.db.query(
        `SELECT (unlimited_ai_until IS NOT NULL AND unlimited_ai_until > NOW()) AS active
           FROM ai_unit_accounts WHERE team_id = $1`,
        [teamId],
      );
      return !!rows[0]?.active;
    } catch {
      return false;
    }
  }

  // Grant/renew the Unlimited-AI window to `until` and record the subscription id.
  // Also stops any pending out-of-credits email sequence. Purchased credits are
  // never touched, so they remain available if the subscription later lapses.
  async setUnlimitedAi(
    teamId: string,
    until: string | Date | null,
    subId: string | null,
  ): Promise<void> {
    if (!teamId) return;
    await this.ensureSchema();
    await this.ensureAccount(teamId);
    const untilDate = until ? new Date(until) : null;
    await this.db.query(
      `UPDATE ai_unit_accounts
          SET unlimited_ai_until = $2,
              unlimited_ai_sub_id = COALESCE($3, unlimited_ai_sub_id),
              updated_at = NOW()
        WHERE team_id = $1`,
      [teamId, untilDate, subId],
    );
    this.mailer.cancelAiCreditsSequence(teamId).catch(() => {});
  }

  // Refund/immediate removal: end the Unlimited-AI window now for this sub.
  async revokeUnlimitedAiBySub(subId: string): Promise<void> {
    if (!subId) return;
    await this.ensureSchema();
    try {
      await this.db.query(
        `UPDATE ai_unit_accounts SET unlimited_ai_until = NOW(), updated_at = NOW()
          WHERE unlimited_ai_sub_id = $1`,
        [subId],
      );
    } catch {
      /* best-effort */
    }
  }

  async isKnownUnlimitedSub(subId: string): Promise<boolean> {
    if (!subId) return false;
    try {
      await this.ensureSchema();
      const { rows } = await this.db.query(
        `SELECT 1 FROM ai_unit_accounts WHERE unlimited_ai_sub_id = $1 LIMIT 1`,
        [subId],
      );
      return rows.length > 0;
    } catch {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Public balance (the single source of truth for the sidebar meter + admin).
  // ---------------------------------------------------------------------------
  async getBalance(user: any): Promise<any> {
    await this.ensureSchema();
    const teamId = await this.resolveAccountTeam(user);
    const config = await this.getConfig();

    if (!teamId) {
      return { entitled: false, unlimited: false };
    }

    const plan = await this.usage.resolveTeamPlan(teamId).catch(() => ({ planId: 'free', isFree: true, paid: false } as any));

    // Paid / unlimited-AI plans show "Unlimited" (full green bar), never a
    // limited-unit meter.
    if (!plan.isFree) {
      return {
        entitled: true,
        unlimited: true,
        plan: plan.planId,
      };
    }

    // A Free account with an active Unlimited AI add-on is also unlimited.
    if (await this.isUnlimitedAiActive(teamId)) {
      return {
        entitled: true,
        unlimited: true,
        plan: plan.planId,
        unlimitedAi: true,
      };
    }

    const acct = await this.rollCycleIfNeeded(teamId);
    const view = computeBalanceView(acct.free_used || 0, acct.purchased_balance || 0, config);
    return {
      entitled: true,
      unlimited: false,
      plan: plan.planId,
      ...view,
      // The Free 50 is a one-time grant — there is no monthly reset date.
      oneTime: true,
      cycleStart: null,
      cycleReset: null,
      resetDate: null,
      lowThreshold: config.lowThreshold,
    };
  }

  /** Whether a metered action can currently run (paid plans always can). */
  async canAfford(teamId: string, action: string): Promise<{ ok: boolean; unlimited: boolean; cost: number; totalRemaining: number }> {
    await this.ensureSchema();
    const plan = await this.usage.resolveTeamPlan(teamId).catch(() => ({ isFree: true } as any));
    const config = await this.getConfig();
    const cost = actionCost(config, action);
    if (!plan.isFree) return { ok: true, unlimited: true, cost, totalRemaining: Infinity };
    if (await this.isUnlimitedAiActive(teamId)) return { ok: true, unlimited: true, cost, totalRemaining: Infinity };
    const acct = await this.rollCycleIfNeeded(teamId);
    const view = computeBalanceView(acct.free_used || 0, acct.purchased_balance || 0, config);
    return { ok: view.totalRemaining >= cost, unlimited: false, cost, totalRemaining: view.totalRemaining };
  }

  /**
   * Charge units for a SUCCESSFUL metered AI action. Free units first, then
   * purchased. Paid plans are never charged. Writes a ledger row. Callers must
   * only invoke this after the AI operation actually succeeded.
   */
  async charge(
    teamId: string,
    userId: string | null,
    action: string,
    meta: { model?: string; provider?: string; internalCost?: number; metadata?: any } = {},
  ): Promise<{ ok: boolean; unlimited?: boolean; reason?: string; charged?: number; totalRemaining?: number }> {
    await this.ensureSchema();
    const plan = await this.usage.resolveTeamPlan(teamId).catch(() => ({ isFree: true } as any));
    if (!plan.isFree) return { ok: true, unlimited: true, charged: 0 };
    // Unlimited AI add-on: never deduct while it is active.
    if (await this.isUnlimitedAiActive(teamId)) return { ok: true, unlimited: true, charged: 0 };

    const config = await this.getConfig();
    const cost = actionCost(config, action);

    const client = await this.db.getClient();
    try {
      await client.query('BEGIN');
      // Lock the row so concurrent charges cannot double-spend.
      const { rows } = await client.query(
        `SELECT free_used, purchased_balance FROM ai_unit_accounts WHERE team_id = $1 FOR UPDATE`,
        [teamId],
      );
      if (!rows.length) {
        await client.query('ROLLBACK');
        // No account row yet: provision it and treat as unaffordable if cost>allowance.
        await this.ensureAccount(teamId);
        return this.charge(teamId, userId, action, meta);
      }
      const freeUsed = rows[0].free_used || 0;
      const purchased = rows[0].purchased_balance || 0;
      const beforeView = computeBalanceView(freeUsed, purchased, config);
      const plan2 = planConsumption(freeUsed, config.freeAllowance, purchased, cost);
      if (!plan2.affordable) {
        await client.query('ROLLBACK');
        return { ok: false, reason: 'insufficient_units', charged: 0, totalRemaining: beforeView.totalRemaining };
      }
      await client.query(
        `UPDATE ai_unit_accounts SET free_used = $2, purchased_balance = $3, updated_at = NOW() WHERE team_id = $1`,
        [teamId, plan2.newFreeUsed, plan2.newPurchased],
      );
      const afterView = computeBalanceView(plan2.newFreeUsed, plan2.newPurchased, config);
      await client.query(
        `INSERT INTO ai_unit_ledger
           (team_id, user_id, action_type, units_charged, free_charged, purchased_charged,
            balance_before, balance_after, model, provider, internal_cost, outcome, metadata)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'success',$12::jsonb)`,
        [
          teamId,
          this.isUuid(userId) ? userId : null,
          String(action).slice(0, 40),
          plan2.charged,
          plan2.freeCharge,
          plan2.purchasedCharge,
          beforeView.totalRemaining,
          afterView.totalRemaining,
          meta.model ? String(meta.model).slice(0, 80) : null,
          meta.provider ? String(meta.provider).slice(0, 40) : null,
          typeof meta.internalCost === 'number' ? meta.internalCost : null,
          JSON.stringify(meta.metadata || {}),
        ],
      );
      await client.query('COMMIT');
      // The moment a Free account's balance hits 0, start the Day 0/2/5
      // out-of-credits email sequence (best-effort — never breaks a successful
      // charge, and startAiCreditsSequence is idempotent per user).
      if (beforeView.totalRemaining > 0 && afterView.totalRemaining === 0) {
        this.mailer.startAiCreditsSequence(teamId).catch(() => {});
      }
      return { ok: true, charged: plan2.charged, totalRemaining: afterView.totalRemaining };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  /**
   * Credit purchased units from a verified Paddle payment. Idempotent: the same
   * transaction id can never credit twice (UNIQUE + ON CONFLICT DO NOTHING).
   */
  async creditPurchase(
    teamId: string,
    packageId: string,
    units: number,
    paddleTransactionId: string,
    amount?: number,
    currency = 'USD',
  ): Promise<{ credited: boolean; duplicate: boolean }> {
    await this.ensureSchema();
    await this.ensureAccount(teamId);
    const client = await this.db.getClient();
    try {
      await client.query('BEGIN');
      const ins = await client.query(
        `INSERT INTO ai_unit_purchases (team_id, package_id, units, amount, currency, paddle_transaction_id, status)
         VALUES ($1,$2,$3,$4,$5,$6,'completed')
         ON CONFLICT (paddle_transaction_id) DO NOTHING
         RETURNING id`,
        [teamId, String(packageId).slice(0, 40), units, amount ?? null, String(currency).slice(0, 8), paddleTransactionId],
      );
      if (!ins.rows.length) {
        await client.query('ROLLBACK');
        return { credited: false, duplicate: true };
      }
      await client.query(
        `UPDATE ai_unit_accounts SET purchased_balance = purchased_balance + $2, updated_at = NOW() WHERE team_id = $1`,
        [teamId, Math.max(0, Math.floor(units))],
      );
      await client.query('COMMIT');
      // Balance is positive again → AI unblocks automatically; stop any pending
      // out-of-credits email sequence immediately (best-effort).
      this.mailer.cancelAiCreditsSequence(teamId).catch(() => {});
      return { credited: true, duplicate: false };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  /** Admin: full account snapshot for customer support. */
  async getAdminView(teamId: string): Promise<any> {
    await this.ensureSchema();
    const config = await this.getConfig();
    const plan = await this.usage.resolveTeamPlan(teamId).catch(() => ({ planId: 'free', isFree: true } as any));
    const acct = await this.rollCycleIfNeeded(teamId);
    const view = computeBalanceView(acct.free_used || 0, acct.purchased_balance || 0, config);
    const purchases = await this.db.query(
      `SELECT package_id, units, amount, currency, paddle_transaction_id, status, created_at
       FROM ai_unit_purchases WHERE team_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [teamId],
    );
    const recent = await this.db.query(
      `SELECT action_type, units_charged, outcome, created_at
       FROM ai_unit_ledger WHERE team_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [teamId],
    );
    return {
      plan: plan.planId,
      unlimited: !plan.isFree,
      ...view,
      cycleReset: acct.cycle_reset,
      purchases: purchases.rows,
      recentUsage: recent.rows,
    };
  }

  /**
   * Return Paddle checkout params for a one-time AI-Unit pack. Reads the price
   * id from server-side env; if the packs are not set up yet it reports
   * configured:false so the UI can show an honest "not available" message
   * rather than opening a broken checkout.
   */
  async getCheckout(user: any, packageId: string): Promise<any> {
    // Unlimited AI ($147/month recurring subscription).
    if (packageId === 'unlimited') {
      const priceId = (process.env.PADDLE_PRICE_AI_UNLIMITED || '').trim();
      if (!priceId) {
        return { configured: false, message: 'Unlimited AI is not available yet.' };
      }
      return {
        configured: true,
        priceId,
        recurring: true,
        units: 0,
        price: 147,
        email: user?.email || null,
        customData: { userId: user?.id, product: 'unlimited_ai' },
      };
    }
    const packs: Record<string, { units: number; env: string }> = {
      boost: { units: 100, env: 'PADDLE_PRICE_AI_UNITS_100' },
      p100: { units: 100, env: 'PADDLE_PRICE_AI_UNITS_100' },
      plus: { units: 200, env: 'PADDLE_PRICE_AI_UNITS_200' },
      p200: { units: 200, env: 'PADDLE_PRICE_AI_UNITS_200' },
      max: { units: 400, env: 'PADDLE_PRICE_AI_UNITS_400' },
      p400: { units: 400, env: 'PADDLE_PRICE_AI_UNITS_400' },
    };
    const pack = packs[packageId];
    if (!pack) return { configured: false, message: 'Unknown package.' };
    const priceId = (process.env[pack.env] || '').trim();
    if (!priceId) {
      return {
        configured: false,
        message: 'AI Unit packs are not available yet. Add the Paddle price IDs to enable purchases.',
      };
    }
    return {
      configured: true,
      priceId,
      units: pack.units,
      email: user?.email || null,
      customData: { userId: user?.id, product: 'ai_units', packageId, units: pack.units },
    };
  }

  /**
   * Dashboard metering helpers. Call guardUser BEFORE a user-initiated AI
   * action to stop it (with a surfaced message) when a Free account is out of
   * units, and settleUser AFTER it succeeds to charge the configured cost.
   * Both no-op for paid/unlimited plans and when no team resolves. Only use
   * these on dashboard endpoints — never on customer-facing message paths, so
   * an out-of-units state can never be sent to a lead.
   */
  async guardUser(user: any, action: string): Promise<void> {
    const teamId = await this.resolveAccountTeam(user);
    if (!teamId) return;
    const gate = await this.canAfford(teamId, action);
    if (!gate.unlimited && !gate.ok) {
      // The 🔒 prefix is the convention the frontend uses to surface the real
      // message (same as PaymentGuard), so the user sees a clear prompt.
      throw new ForbiddenException(
        '🔒 You have used all your AI Units for this cycle. Add more AI Units or upgrade to keep using AI.',
      );
    }
  }

  async settleUser(user: any, action: string, meta: any = {}): Promise<void> {
    try {
      const teamId = await this.resolveAccountTeam(user);
      if (!teamId) return;
      await this.charge(teamId, this.isUuid(user?.id) ? user.id : null, action, meta);
    } catch {
      /* metering must never break a successful AI response */
    }
  }

  /** Admin: resolve a customer's team from their (owner) user id, then snapshot. */
  async getAdminViewByUser(userId: string): Promise<any> {
    await this.ensureSchema();
    const { rows } = await this.db.query(
      `SELECT COALESCE(u.team_id, (SELECT id FROM teams WHERE owner_id = u.id LIMIT 1)) AS team_id
         FROM users u WHERE u.id = $1 LIMIT 1`,
      [userId],
    );
    const teamId = rows[0]?.team_id;
    if (!teamId) return { noTeam: true };
    return this.getAdminView(teamId);
  }

  private isUuid(v: any): boolean {
    return (
      typeof v === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
    );
  }
}
