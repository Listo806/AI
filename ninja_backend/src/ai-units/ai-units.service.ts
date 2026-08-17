import { Injectable, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { UsageService } from '../plans/usage.service';
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
    const { rows } = await this.db.query(`SELECT id FROM teams WHERE owner_id = $1 LIMIT 1`, [user?.id]);
    return rows[0]?.id || null;
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

  /** Read the account, rolling the monthly Free cycle if the reset has passed. */
  private async rollCycleIfNeeded(teamId: string): Promise<any> {
    await this.ensureAccount(teamId);
    const sel = `SELECT team_id, free_used, purchased_balance,
                        to_char(cycle_start,'YYYY-MM-DD') AS cycle_start,
                        to_char(cycle_reset,'YYYY-MM-DD') AS cycle_reset,
                        (cycle_reset <= CURRENT_DATE) AS rolled
                 FROM ai_unit_accounts WHERE team_id = $1`;
    let { rows } = await this.db.query(sel, [teamId]);
    let acct = rows[0];
    if (!acct) return { free_used: 0, purchased_balance: 0, cycle_start: null, cycle_reset: null };

    if (acct.rolled) {
      const signup = await this.getTeamSignup(teamId);
      const { cycleStart, cycleReset } = computeCycleReset(signup, new Date());
      await this.db.query(
        `UPDATE ai_unit_accounts
           SET free_used = 0, cycle_start = $2, cycle_reset = $3, updated_at = NOW()
         WHERE team_id = $1`,
        [teamId, toYMD(cycleStart), toYMD(cycleReset)],
      );
      acct = {
        ...acct,
        free_used: 0,
        cycle_start: toYMD(cycleStart),
        cycle_reset: toYMD(cycleReset),
      };
    }
    return acct;
  }

  // ---------------------------------------------------------------------------
  // Admin HUD preview override (per-admin, opt-in). Lets an admin see the exact
  // Free floating-HUD experience on THEIR OWN account for UX review, without
  // changing the global rule — Solo/Business/Scale/unlimited still never see it.
  // ---------------------------------------------------------------------------
  private async getAdminPreviewIds(): Promise<string[]> {
    try {
      const { rows } = await this.db.query(`SELECT admin_preview_user_ids AS ids FROM ai_unit_config WHERE id = 1`);
      const ids = rows[0]?.ids;
      return Array.isArray(ids) ? ids : [];
    } catch {
      return [];
    }
  }

  async isAdminPreview(userId: string): Promise<boolean> {
    await this.ensureSchema();
    if (!userId) return false;
    const ids = await this.getAdminPreviewIds();
    return ids.includes(userId);
  }

  async setAdminPreview(userId: string, enabled: boolean): Promise<{ enabled: boolean }> {
    await this.ensureSchema();
    await this.db.query(
      `INSERT INTO ai_unit_config (id, config) VALUES (1, '{}'::jsonb) ON CONFLICT (id) DO NOTHING`,
    );
    let ids = await this.getAdminPreviewIds();
    ids = ids.filter((x) => x !== userId);
    if (enabled) ids.push(userId);
    await this.db.query(
      `UPDATE ai_unit_config SET admin_preview_user_ids = $1::jsonb, updated_at = NOW() WHERE id = 1`,
      [JSON.stringify(ids)],
    );
    return { enabled };
  }

  // ---------------------------------------------------------------------------
  // Public balance (the single source of truth for sidebar + HUD + admin).
  // ---------------------------------------------------------------------------
  async getBalance(user: any): Promise<any> {
    await this.ensureSchema();
    const teamId = await this.resolveAccountTeam(user);
    const config = await this.getConfig();

    if (!teamId) {
      return { entitled: false, unlimited: false, showHud: false };
    }

    const plan = await this.usage.resolveTeamPlan(teamId).catch(() => ({ planId: 'free', isFree: true, paid: false } as any));

    // Admin preview: an admin who explicitly enabled preview on their own
    // account sees the Free HUD experience even though their plan is unlimited.
    const previewOn =
      ['admin', 'super_admin'].includes(user?.role) && (await this.isAdminPreview(user?.id));

    // Paid / unlimited-AI plans never see the limited-AI HUD — unless this is the
    // admin's own opt-in preview.
    if (!plan.isFree && !previewOn) {
      return {
        entitled: true,
        unlimited: true,
        showHud: false,
        plan: plan.planId,
      };
    }

    const acct = await this.rollCycleIfNeeded(teamId);
    const view = computeBalanceView(acct.free_used || 0, acct.purchased_balance || 0, config);
    return {
      entitled: true,
      unlimited: false,
      showHud: true,
      preview: previewOn && !plan.isFree,
      plan: plan.planId,
      ...view,
      cycleStart: acct.cycle_start,
      cycleReset: acct.cycle_reset,
      resetDate: acct.cycle_reset,
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
    const packs: Record<string, { units: number; env: string }> = {
      boost: { units: 500, env: 'PADDLE_PRICE_AI_UNITS_500' },
      plus: { units: 1000, env: 'PADDLE_PRICE_AI_UNITS_1000' },
      max: { units: 2000, env: 'PADDLE_PRICE_AI_UNITS_2000' },
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
