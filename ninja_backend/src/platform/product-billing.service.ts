import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { NuveiClientService } from '../nuvei/nuvei-client.service';
import { ConfigService } from '../config/config.service';
import { Cron, CronExpression } from '@nestjs/schedule';

const PLANS: Record<string, { category: string; cents: number; limit: number | null; addon?: boolean }> = {
  'vacation_rentals.starter': { category: 'vacation_rentals', cents: 7700, limit: 3 },
  'vacation_rentals.growth': { category: 'vacation_rentals', cents: 10700, limit: 6 },
  'vacation_rentals.premium': { category: 'vacation_rentals', cents: 17700, limit: null },
  'marketplace_agents.essential': { category: 'marketplace_agents', cents: 14700, limit: 20 },
  'marketplace_agents.growth': { category: 'marketplace_agents', cents: 19700, limit: null },
  'marketplace_agents.ai_crm_addon': { category: 'marketplace_agents', cents: 12700, limit: 0, addon: true },
};

@Injectable()
export class ProductBillingService {
  constructor(private readonly db: DatabaseService, private readonly nuvei: NuveiClientService, private readonly config: ConfigService) {}

  catalog() {
    return Object.entries(PLANS).map(([key, value]) => ({ key, ...value, currency: 'USD', monthlyPrice: value.cents / 100, annualReviewPrice: value.addon ? null : Math.round(value.cents * 12 * .8) / 100, annualApprovedPrice: this.approvedAnnualOrNull(key) }));
  }

  private approvedAnnualOrNull(key: string): number | null {
    const plan = PLANS[key];
    if (!plan || plan.addon) return null;
    if (key === 'marketplace_agents.essential') return 1411.20;
    if (key === 'marketplace_agents.growth') return 1891.20;
    const raw = String(this.config.get(`APPROVED_ANNUAL_${key.replace(/\W/g, '_').toUpperCase()}_CENTS`) || '');
    return /^[1-9]\d*$/.test(raw) ? Number(raw) / 100 : null;
  }

  private approvedPrice(key: string, interval: string): number {
    const plan = PLANS[key];
    if (!plan) throw new BadRequestException('Unknown product plan');
    if (interval === 'monthly') return plan.cents;
    if (interval !== 'yearly' || plan.addon || !['vacation_rentals','marketplace_agents'].includes(plan.category)) throw new BadRequestException('Unsupported billing interval');
    const envKey = `APPROVED_ANNUAL_${key.replace(/\W/g, '_').toUpperCase()}_CENTS`;
    if (key === 'marketplace_agents.essential') return 141120;
    if (key === 'marketplace_agents.growth') return 189120;
    const configured = String(this.config.get(envKey) || '');
    if (!/^[1-9]\d*$/.test(configured)) throw new BadRequestException('Annual price not approved');
    return Number(configured);
  }

  async enroll(userId: string, key: string, interval = 'monthly', parentId?: string, autoRenew = false) {
    const plan = PLANS[key];
    const cents = this.approvedPrice(key, interval);
    if (plan.addon && parentId) {
      const existingAddon = await this.db.query(`SELECT id FROM product_billing_enrollments
        WHERE user_id=$1 AND parent_id=$2 AND plan_key=$3 AND status IN ('active','pending_payment')
        AND (status='pending_payment' OR period_end>NOW()) LIMIT 1`, [userId,parentId,key]);
      if (existingAddon.rows.length) throw new BadRequestException('This add-on is already active or awaiting payment');
    }
    if (plan.addon) {
      if (!parentId) throw new BadRequestException('Active Marketplace Agents subscription required');
      const parent = await this.db.query(`SELECT id FROM product_billing_enrollments WHERE id=$1 AND user_id=$2
        AND plan_key IN ('marketplace_agents.essential','marketplace_agents.growth')
        AND status='active' AND period_end>NOW()`, [parentId, userId]);
      if (!parent.rows.length) throw new BadRequestException('Parent subscription not eligible');
    } else if (parentId) throw new BadRequestException('Base plans cannot have a parent');
    if (!plan.addon) {
      const active = await this.db.query(`SELECT id FROM product_billing_enrollments WHERE user_id=$1
        AND plan_key=$2 AND status='active' AND period_end>NOW()`, [userId, key]);
      if (active.rows.length) throw new BadRequestException('An active subscription for this plan already exists');
    }
    const result = await this.db.query(`INSERT INTO product_billing_enrollments
      (user_id,plan_key,parent_id,interval,price_cents,status,auto_renew) VALUES ($1,$2,$3,$4,$5,'pending_payment',$6)
      RETURNING id,plan_key,parent_id,interval,price_cents,status`, [userId, key, parentId || null, interval, cents, Boolean(autoRenew)]);
    return result.rows[0];
  }

  async mine(userId: string) {
    const result = await this.db.query(`SELECT id,plan_key,parent_id,interval,price_cents,status,period_end,refund_status,cancel_at_period_end,auto_renew
      FROM product_billing_enrollments WHERE user_id=$1 ORDER BY created_at DESC`, [userId]);
    return result.rows;
  }

  async checkout(userId: string, id: string, token: string) {
    if (!/^[a-zA-Z0-9_-]{6,512}$/.test(token)) throw new BadRequestException('Secure card token required');
    if (!this.nuvei.isConfigured()) throw new ServiceUnavailableException('Nuvei not configured');
    const user = (await this.db.query('SELECT id,email FROM users WHERE id=$1', [userId])).rows[0];
    if (!user) throw new NotFoundException('User not found');
    const claimed = await this.db.query(`UPDATE product_billing_enrollments
      SET payment_reference='CP-'||id::text,updated_at=NOW()
      WHERE id=$1 AND user_id=$2 AND status='pending_payment' AND payment_reference IS NULL
      RETURNING *`, [id, userId]);
    if (!claimed.rows.length) throw new BadRequestException('Enrollment not payable or already submitted');
    const row = claimed.rows[0];
    if (this.approvedPrice(row.plan_key, row.interval) !== Number(row.price_cents)) {
      await this.db.query('UPDATE product_billing_enrollments SET payment_reference=NULL WHERE id=$1', [id]);
      throw new BadRequestException('Price changed; create a new enrollment');
    }
    if (row.parent_id) {
      const parent = await this.db.query(`SELECT id FROM product_billing_enrollments WHERE id=$1 AND user_id=$2
        AND status='active' AND refund_status IS DISTINCT FROM 'confirmed' AND period_end>NOW()`, [row.parent_id, userId]);
      if (!parent.rows.length) {
        await this.db.query('UPDATE product_billing_enrollments SET payment_reference=NULL WHERE id=$1', [id]);
        throw new BadRequestException('Parent subscription expired');
      }
    }
    try {
      const response = await this.nuvei.debit({ id: String(user.id), email: String(user.email) },
        { amount: Number(row.price_cents) / 100, currency: 'USD', description: row.plan_key, dev_reference: row.payment_reference }, token);
      const transactionId = response?.body?.transaction?.id;
      if (transactionId) await this.db.query(`UPDATE product_billing_enrollments SET provider_transaction_id=$2 WHERE id=$1`, [id, String(transactionId)]);
    } catch (_) {
      // Provider outcome may be unknown. Never retry a debit automatically.
      return { status: 'pending_payment', message: 'Manual payment verification required' };
    }
    return this.verify(userId, id);
  }

  async verify(userId: string, id: string) {
    const result = await this.db.query('SELECT * FROM product_billing_enrollments WHERE id=$1 AND user_id=$2', [id, userId]);
    const row = result.rows[0];
    if (!row) throw new NotFoundException('Enrollment not found');
    if (row.status !== 'pending_payment' || !row.provider_transaction_id) return { status: row.status };
    const verification = await this.nuvei.verifyTransaction(String(row.provider_transaction_id));
    const tx = verification?.body?.transaction;
    if (!verification.ok || !tx) return { status: 'pending_payment', message: 'Verification pending' };
    const reference = String(tx.dev_reference || verification.body?.order?.dev_reference || '');
    const amount = Number(tx.amount ?? verification.body?.order?.amount);
    const currency = String(tx.currency || verification.body?.order?.currency || '').toUpperCase();
    if (reference !== row.payment_reference || !Number.isFinite(amount) || Math.abs(amount * 100 - Number(row.price_cents)) > 1 || currency !== 'USD') {
      return { status: 'pending_payment', message: 'Payment mismatch: manual review required' };
    }
    if (String(tx.status).toLowerCase() === 'success' && Number(tx.status_detail) === 3) {
      await this.db.query(`UPDATE product_billing_enrollments SET status='active',period_start=NOW(),
        period_end=NOW()+CASE WHEN interval='yearly' THEN INTERVAL '1 year' ELSE INTERVAL '1 month' END,
        updated_at=NOW() WHERE id=$1 AND status='pending_payment' AND refund_status IS NULL`, [id]);
      return { status: 'active' };
    }
    return { status: 'pending_payment', message: 'Provider has not confirmed a successful payment' };
  }

  /** Public notification handler: verifies the transaction with Nuvei, not the supplied body. */
  async handlePaymentNotification(reference: string, payload: any) {
    const enrollment = (await this.db.query(`SELECT id,user_id,payment_reference FROM product_billing_enrollments
      WHERE payment_reference=$1`,[reference])).rows[0];
    if (!enrollment) return {handled:false};
    const txId = String(payload?.transaction?.id || '');
    if (!txId || !/^[a-zA-Z0-9_-]{3,128}$/.test(txId)) return {handled:false};
    const verified = await this.nuvei.verifyTransaction(txId);
    const tx = verified?.body?.transaction;
    if (!verified?.ok || !tx || String(tx.dev_reference || verified.body?.order?.dev_reference || '') !== reference)
      return {handled:false};
    await this.db.query(`UPDATE product_billing_enrollments SET provider_transaction_id=$2,
      updated_at=NOW() WHERE id=$1 AND (provider_transaction_id IS NULL OR provider_transaction_id=$2)`,
      [enrollment.id,txId]);
    return {handled:true, ...(await this.verify(enrollment.user_id,enrollment.id))};
  }

  /** Cancel future renewal. Paid access continues until period_end; children lose access when parent expires. */
  async cancel(userId: string, id: string) {
    const r = await this.db.query(`UPDATE product_billing_enrollments
      SET cancel_at_period_end=TRUE,updated_at=NOW()
      WHERE id=$1 AND user_id=$2 AND status='active'
      RETURNING id,status,cancel_at_period_end,period_end`, [id,userId]);
    if (!r.rows.length) throw new NotFoundException('Active enrollment not found');
    return r.rows[0];
  }

  /** Customer request only: payment is NOT refunded until an authorized reviewer acts. */
  async requestRefund(userId: string, id: string) {
    const result = await this.db.query(`UPDATE product_billing_enrollments
      SET refund_status='pending',updated_at=NOW()
      WHERE id=$1 AND user_id=$2 AND status='active' AND provider_transaction_id IS NOT NULL AND refund_status IS NULL
      RETURNING id,refund_status`, [id,userId]);
    if (!result.rows.length) throw new BadRequestException('Enrollment not refundable or refund already requested');
    return result.rows[0];
  }

  /** Only a super-admin may invoke this; pending request is locked before calling Nuvei. */
  async executeApprovedRefund(id: string) {
    const claim = await this.db.query(`UPDATE product_billing_enrollments
      SET refund_status='processing',updated_at=NOW()
      WHERE id=$1 AND refund_status='pending' AND provider_transaction_id IS NOT NULL
      RETURNING id,provider_transaction_id,price_cents`, [id]);
    if (!claim.rows.length) throw new BadRequestException('Refund is not pending or already processing');
    const row = claim.rows[0];
    try {
      const response = await this.nuvei.refund(String(row.provider_transaction_id), Number(row.price_cents) / 100);
      // Provider acknowledgment is NOT the same as settled refund. Reconcile with provider
      // or authenticated refund notification before revoking paid access.
      const refundId = String(response?.body?.transaction?.id || '');
      if (response?.ok && refundId && refundId !== String(row.provider_transaction_id)) {
        await this.db.query(`UPDATE product_billing_enrollments SET refund_transaction_id=$2,
          updated_at=NOW() WHERE id=$1 AND refund_status='processing'`, [id,refundId]);
      }
      return { id, status: 'processing', providerAccepted: Boolean(response?.ok),
        message: 'Verify the refund in Nuvei before confirming settlement' };
    } catch (_) {
      // An unknown network outcome must not be retried automatically (double refund risk).
      return { id, status: 'processing', message: 'Unknown provider outcome; verify in Nuvei' };
    }
  }

  /** Verify a distinct provider refund transaction, never the original charge.
   * Unknown provider statuses stay processing and retain access until verified. */
  async settleApprovedRefund(id: string) {
    const row = (await this.db.query(`SELECT provider_transaction_id,refund_transaction_id,
      refund_status,price_cents FROM product_billing_enrollments WHERE id=$1`,[id])).rows[0];
    if (!row || row.refund_status !== 'processing')
      throw new BadRequestException('Refund is not awaiting settlement');
    if (!row.refund_transaction_id || row.refund_transaction_id === row.provider_transaction_id)
      return {id,status:'processing',message:'Separate Nuvei refund transaction reference is required'};
    const verification = await this.nuvei.verifyTransaction(String(row.refund_transaction_id));
    const tx = verification?.body?.transaction;
    if (!verification?.ok || !tx) return {id,status:'processing',message:'Nuvei refund verification pending'};
    const type = String(tx.type || tx.transaction_type || tx.action || '').toLowerCase();
    const amount = Number(tx.amount ?? verification.body?.order?.amount);
    const currency = String(tx.currency || verification.body?.order?.currency || '').toUpperCase();
    if (!type.includes('refund') || !Number.isFinite(amount) ||
        Math.abs(amount * 100 - Number(row.price_cents)) > 1 || currency !== 'USD' ||
        String(tx.status).toLowerCase() !== 'success' || Number(tx.status_detail) !== 3)
      return {id,status:'processing',message:'Refund has not been verified as settled by Nuvei'};
    await this.db.transaction(async client => {
      const updated = await client.query(`UPDATE product_billing_enrollments
        SET refund_status='confirmed',status='canceled',auto_renew=FALSE,
          cancel_at_period_end=TRUE,period_end=NOW(),updated_at=NOW()
        WHERE id=$1 AND refund_status='processing' RETURNING id`,[id]);
      if (updated.rows.length) await client.query(`UPDATE product_billing_enrollments
        SET status='canceled',auto_renew=FALSE,period_end=NOW(),updated_at=NOW()
        WHERE parent_id=$1 AND status='active'`,[id]);
    });
    return {id,status:'confirmed'};
  }

  /**
   * Hourly reconciliation is safe to retry. It never assumes an unverified
   * payment succeeded and never debits a card without a provider-vaulted token.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async reconcilePeriods(): Promise<{ expired: number; children: number; pending: number }> {
    const expired = await this.db.query(`UPDATE product_billing_enrollments
      SET status='canceled',updated_at=NOW()
      WHERE status='active' AND period_end<=NOW() AND (auto_renew=FALSE OR cancel_at_period_end=TRUE OR period_end<NOW()-INTERVAL '2 days') RETURNING id`);
    const children = await this.db.query(`UPDATE product_billing_enrollments child
      SET status='canceled',period_end=LEAST(child.period_end,NOW()),updated_at=NOW()
      WHERE child.status='active' AND child.parent_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM product_billing_enrollments parent
        WHERE parent.id=child.parent_id AND parent.status='active'
          AND parent.period_end>NOW() AND parent.refund_status IS DISTINCT FROM 'confirmed'
      ) RETURNING child.id`);
    // Provider-confirmed renewals may arrive after a network timeout. Reconcile
    // the existing transaction instead of charging a second time.
    const renewalPending=await this.db.query(`SELECT r.reference,r.transaction_id,r.enrollment_id,e.price_cents
      FROM product_billing_renewals r JOIN product_billing_enrollments e ON e.id=r.enrollment_id
      WHERE r.status='pending' AND r.transaction_id IS NOT NULL LIMIT 30`);
    for(const renewal of renewalPending.rows){
      try{
        const verified=await this.nuvei.verifyTransaction(String(renewal.transaction_id));
        const tx=verified?.body?.transaction;
        if(!verified?.ok||!tx||String(tx.dev_reference||verified.body?.order?.dev_reference||'')!==renewal.reference
          ||String(tx.currency||verified.body?.order?.currency||'').toUpperCase()!=='USD'
          ||Math.abs(Number(tx.amount??verified.body?.order?.amount)*100-Number(renewal.price_cents))>1
          ||String(tx.status).toLowerCase()!=='success'||Number(tx.status_detail)!==3)continue;
        await this.db.transaction(async client=>{
          const paid=await client.query(`UPDATE product_billing_renewals SET status='paid'
            WHERE reference=$1 AND status='pending' RETURNING enrollment_id`,[renewal.reference]);
          if(paid.rows.length)await client.query(`UPDATE product_billing_enrollments SET status='active',
            period_end=period_end+CASE WHEN interval='yearly' THEN INTERVAL '1 year' ELSE INTERVAL '1 month' END,
            updated_at=NOW() WHERE id=$1 AND refund_status IS NULL`,[renewal.enrollment_id]);
        });
      }catch(_){ /* retry verification, never the charge */ }
    }
    const pending = await this.db.query(`SELECT id,user_id FROM product_billing_enrollments
      WHERE status='pending_payment' AND provider_transaction_id IS NOT NULL
        AND updated_at<NOW()-INTERVAL '5 minutes' ORDER BY updated_at LIMIT 30`);
    for (const row of pending.rows) {
      try { await this.verify(row.user_id,row.id); }
      catch (_) { /* retry next hour; never mark paid on provider failure */ }
    }
    return {expired:expired.rows.length,children:children.rows.length,pending:pending.rows.length};
  }

  /** Recurring debits use a Nuvei-vaulted card; the card token is never stored here.
   * A unique per-period ledger prevents duplicate charges on retries or concurrent workers.
   * Unknown outcomes remain pending for human/provider verification, not automatic retry.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async renewDue(): Promise<{ renewed: number; pending: number }> {
    const due = await this.db.query(`SELECT id,user_id,plan_key,interval,price_cents,period_end
      FROM product_billing_enrollments WHERE status='active' AND auto_renew=TRUE
      AND cancel_at_period_end=FALSE AND refund_status IS NULL
      AND period_end BETWEEN NOW()-INTERVAL '2 days' AND NOW()+INTERVAL '1 hour'
      ORDER BY period_end LIMIT 30`);
    let renewed=0,pending=0;
    for (const row of due.rows) {
      const reference=`CPR-${row.id}-${new Date(row.period_end).toISOString().slice(0,10)}`;
      const claim=await this.db.query(`INSERT INTO product_billing_renewals
        (enrollment_id,reference,period_end,status) VALUES ($1,$2,$3,'pending')
        ON CONFLICT (reference) DO NOTHING RETURNING reference`,[row.id,reference,row.period_end]);
      if (!claim.rows.length) continue;
      pending++;
      try {
        if (this.approvedPrice(row.plan_key,row.interval)!==Number(row.price_cents)) continue;
        const cards=await this.nuvei.listCards(String(row.user_id));
        const available=Array.isArray(cards?.body?.cards)?cards.body.cards:[];
        const card=available.find((c:any)=>c?.token&&String(c.status||'').toLowerCase()!=='rejected');
        if (!card) continue;
        const user=(await this.db.query('SELECT id,email FROM users WHERE id=$1',[row.user_id])).rows[0];
        if (!user) continue;
        const response=await this.nuvei.debit({id:String(user.id),email:String(user.email)},
          {amount:Number(row.price_cents)/100,currency:'USD',description:'Cortexa renewal '+row.plan_key,dev_reference:reference},String(card.token));
        const txId=String(response?.body?.transaction?.id||'');
        if (!txId) continue;
        await this.db.query(`UPDATE product_billing_renewals SET transaction_id=$2 WHERE reference=$1`,[reference,txId]);
        const verification=await this.nuvei.verifyTransaction(txId);
        const tx=verification?.body?.transaction;
        if (!verification?.ok||!tx||String(tx.dev_reference||verification.body?.order?.dev_reference||'')!==reference
          ||String(tx.currency||verification.body?.order?.currency||'').toUpperCase()!=='USD'
          ||Math.abs(Number(tx.amount??verification.body?.order?.amount)*100-Number(row.price_cents))>1
          ||String(tx.status).toLowerCase()!=='success'||Number(tx.status_detail)!==3) continue;
        await this.db.transaction(async(client)=>{
          const update=await client.query(`UPDATE product_billing_renewals SET status='paid'
            WHERE reference=$1 AND status='pending' RETURNING enrollment_id`,[reference]);
          if (!update.rows.length) return;
          await client.query(`UPDATE product_billing_enrollments SET
            period_end=period_end+CASE WHEN interval='yearly' THEN INTERVAL '1 year' ELSE INTERVAL '1 month' END,
            updated_at=NOW() WHERE id=$1 AND status='active'`,[row.id]);
        });
        renewed++;
      }catch (_) { /* Unknown provider outcome: do not debit again. */ }
    }
    return {renewed,pending};
  }

  async entitlement(userId: string, category: string) {
    if (!['vacation_rentals', 'marketplace_agents'].includes(category)) throw new BadRequestException('Unknown category');
    const rows = (await this.mine(userId)).filter((x: any) => x.status === 'active' && x.refund_status !== 'confirmed' && new Date(x.period_end) > new Date());
    const parents = rows.filter((x: any) => !x.parent_id && PLANS[x.plan_key]?.category === category);
    if (!parents.length) return { active: false, maxListings: 0, aiCrm: false };
    const limits = parents.map((x: any) => PLANS[x.plan_key].limit);
    const aiCrm = category === 'marketplace_agents' && rows.some((x: any) => x.plan_key === 'marketplace_agents.ai_crm_addon' && parents.some((p: any) => p.id === x.parent_id));
    return { active: true, maxListings: limits.includes(null) ? null : Math.max(0, ...(limits as number[])), aiCrm };
  }
}
