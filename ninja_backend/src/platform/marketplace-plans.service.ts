import { BadRequestException, Injectable, NotFoundException, Logger, ServiceUnavailableException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { NuveiClientService } from '../nuvei/nuvei-client.service';
import { ConfigService } from '../config/config.service';
import * as crypto from 'crypto';

// Marketplace-only entitlements. No modification to CRM or E-Commerce Nuvei products.
const PLANS = {
  'owner-standard': { audience: 'owner', priceCents: 6700, maxListings: 2 },
  'owner-enhanced': { audience: 'owner', priceCents: 9700, maxListings: 3 },
  'owner-maximum': { audience: 'owner', priceCents: 14700, maxListings: 4 },
  'agent-essential': { audience: 'agent', priceCents: 9700, maxListings: 20 },
  'agent-growth': { audience: 'agent', priceCents: 14700, maxListings: null },
  'owner-free-launch': { audience: 'owner', priceCents: 0, maxListings: 1 },
  'agent-free-launch': { audience: 'agent', priceCents: 0, maxListings: 1 },
} as const;

@Injectable()
export class MarketplacePlansService {
  private readonly logger = new Logger(MarketplacePlansService.name);
  constructor(private readonly db: DatabaseService, private readonly nuvei: NuveiClientService, private readonly config: ConfigService) {}
  private async schema() {
    await this.db.query(`CREATE TABLE IF NOT EXISTS marketplace_plan_enrollments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id),
      plan_key text NOT NULL, status text NOT NULL CHECK(status IN ('pending_payment','active','failed','canceled')),
      price_cents integer NOT NULL, currency text NOT NULL DEFAULT 'USD',
      payment_reference text UNIQUE, provider_transaction_id text, created_at timestamptz NOT NULL DEFAULT NOW(),
      updated_at timestamptz NOT NULL DEFAULT NOW()
    )`);
    await this.db.query(`ALTER TABLE marketplace_plan_enrollments ADD COLUMN IF NOT EXISTS provider_transaction_id text`);
    await this.db.query(`ALTER TABLE marketplace_plan_enrollments ADD COLUMN IF NOT EXISTS current_period_start timestamptz`);
    await this.db.query(`ALTER TABLE marketplace_plan_enrollments ADD COLUMN IF NOT EXISTS current_period_end timestamptz`);
    await this.db.query(`ALTER TABLE marketplace_plan_enrollments ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false`);
    await this.db.query(`ALTER TABLE marketplace_plan_enrollments ADD COLUMN IF NOT EXISTS canceled_at timestamptz`);
    await this.db.query(`ALTER TABLE marketplace_plan_enrollments ADD COLUMN IF NOT EXISTS billing_interval text NOT NULL DEFAULT 'monthly'`);
    // Legacy paid activations: derive an initial monthly period from activation timestamp.
    // This prevents paid entitlements from remaining active indefinitely after the first charge.
    await this.db.query(`UPDATE marketplace_plan_enrollments SET current_period_start=updated_at,
      current_period_end=updated_at + INTERVAL '1 month'
      WHERE status='active' AND price_cents>0 AND current_period_end IS NULL`);
    await this.db.query(`CREATE INDEX IF NOT EXISTS marketplace_enrollments_user_idx ON marketplace_plan_enrollments(user_id,created_at DESC)`);
  }
  plans() { return Object.entries(PLANS).map(([key,p])=>({key,...p,currency:'USD'})); }
  private async expireDue(userId?:string) {
    await this.db.query(`UPDATE marketplace_plan_enrollments SET status='canceled',updated_at=NOW()
      WHERE status='active' AND price_cents>0 AND current_period_end IS NOT NULL
      AND current_period_end<=NOW() AND ($1::uuid IS NULL OR user_id=$1::uuid)`,[userId||null]);
  }
  async cancel(userId:string,enrollmentId:string) {
    await this.schema();
    await this.expireDue(userId);
    const r=await this.db.query(`UPDATE marketplace_plan_enrollments SET
      cancel_at_period_end=true,canceled_at=NOW(),updated_at=NOW()
      WHERE id=$1 AND user_id=$2 AND status='active' AND price_cents>0
      RETURNING id,plan_key,status,current_period_end,cancel_at_period_end`,[enrollmentId,userId]);
    if(!r.rows.length) throw new BadRequestException('No active paid enrollment to cancel');
    return {enrollment:r.rows[0],message:'Auto-renewal is not enabled; access ends at the current period end'};
  }
  // Explicit customer-initiated renewal: creates a new payable enrollment, never charges
  // a saved card automatically. An existing verified transaction is never charged twice.
  async renew(userId:string, enrollmentId:string) {
    await this.schema();
    await this.expireDue(userId);
    const old=(await this.db.query(`SELECT * FROM marketplace_plan_enrollments WHERE id=$1 AND user_id=$2`,[enrollmentId,userId])).rows[0];
    if(!old) throw new NotFoundException('Enrollment not found');
    if(Number(old.price_cents)<=0) throw new BadRequestException('Free plans do not require renewal');
    if(old.status==='active' && old.current_period_end && new Date(old.current_period_end).getTime()>Date.now()+7*86400000)
      throw new BadRequestException('Renewal is available within seven days of expiration');
    const pending=(await this.db.query(`SELECT * FROM marketplace_plan_enrollments WHERE user_id=$1 AND plan_key=$2 AND status='pending_payment' ORDER BY created_at DESC LIMIT 1`,[userId,old.plan_key])).rows[0];
    if(pending) return {enrollment:pending,next:'/marketplace/checkout',requiresPayment:true};
    const result=await this.db.query(`INSERT INTO marketplace_plan_enrollments(user_id,plan_key,status,price_cents,currency,billing_interval)
      VALUES($1,$2,'pending_payment',$3,$4,$5) RETURNING *`,[userId,old.plan_key,old.price_cents,old.currency,old.billing_interval||'monthly']);
    return {enrollment:result.rows[0],next:'/marketplace/checkout',requiresPayment:true};
  }
  async resume(userId:string,enrollmentId:string) {
    await this.schema();
    const result=await this.db.query(`UPDATE marketplace_plan_enrollments SET cancel_at_period_end=false,canceled_at=NULL,updated_at=NOW()
      WHERE id=$1 AND user_id=$2 AND status='active' AND current_period_end>NOW()
      RETURNING id,plan_key,status,current_period_end,cancel_at_period_end`,[enrollmentId,userId]);
    if(!result.rows.length) throw new BadRequestException('No active enrollment to resume');
    // No recurring billing is configured: resuming only reverses the cancellation flag.
    return {enrollment:result.rows[0],autoRenewEnabled:false};
  }
  async billingHistory(userId:string) {
    await this.schema();
    const result=await this.db.query(`SELECT id,plan_key,status,price_cents,currency,provider_transaction_id,
      current_period_start,current_period_end,created_at FROM marketplace_plan_enrollments
      WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100`,[userId]);
    return {data:result.rows};
  }
  async enroll(userId: string, planKey: string) {
    const plan = PLANS[planKey as keyof typeof PLANS];
    if (!plan) throw new BadRequestException('Invalid Marketplace plan');
    await this.schema();
    await this.expireDue(userId);
    if (plan.priceCents === 0) {
      // Free launch is a distinct Marketplace entitlement; never calls Nuvei.
      const existing = await this.db.query(`SELECT * FROM marketplace_plan_enrollments WHERE user_id=$1 AND plan_key=$2 AND status='active' ORDER BY created_at DESC LIMIT 1`,[userId,planKey]);
      if (existing.rows.length) return { enrollment: existing.rows[0], next: '/create-listing', message:'Your account is ready. Create your first listing' };
      const r=await this.db.query(`INSERT INTO marketplace_plan_enrollments(user_id,plan_key,status,price_cents) VALUES ($1,$2,'active',0) RETURNING *`,[userId,planKey]);
      return { enrollment:r.rows[0], next:'/create-listing', message:'Your account is ready. Create your first listing' };
    }
    const existing=await this.db.query(`SELECT * FROM marketplace_plan_enrollments
      WHERE user_id=$1 AND plan_key=$2 AND status='pending_payment'
      ORDER BY created_at DESC LIMIT 1`,[userId,planKey]);
    if(existing.rows.length) return {enrollment:existing.rows[0],next:'/marketplace/checkout',requiresPayment:true};
    const r=await this.db.query(`INSERT INTO marketplace_plan_enrollments(user_id,plan_key,status,price_cents)
      VALUES ($1,$2,'pending_payment',$3) RETURNING *`,[userId,planKey,plan.priceCents]);
    return {enrollment:r.rows[0],next:'/marketplace/checkout',requiresPayment:true};
  }
  async mine(userId:string) {
    await this.schema();
    await this.expireDue(userId);
    const r=await this.db.query(`SELECT id,plan_key,status,price_cents,currency,payment_reference,
      current_period_start,current_period_end,cancel_at_period_end,billing_interval,created_at
      FROM marketplace_plan_enrollments WHERE user_id=$1 ORDER BY created_at DESC`,[userId]);
    return { data:r.rows, active:r.rows.some(x=>x.status==='active') };
  }
  async requireEntitlement(userId:string) {
    const state=await this.mine(userId);
    const active=state.data.find(x=>x.status==='active' && x.price_cents>0) || state.data.find(x=>x.status==='active');
    if (!active) throw new BadRequestException('Activate or renew a Marketplace plan before submitting a listing');
    const plan=PLANS[active.plan_key as keyof typeof PLANS];
    return {...state,entitlement:active,maxListings:plan?.maxListings ?? null};
  }

  bankDetails() {
    // Bank details are configured by the merchant; never return invented account information.
    const get=(key:string)=>String(process.env[key]||'').trim();
    const bankName=get('MARKETPLACE_BANK_NAME');
    const accountHolder=get('MARKETPLACE_BANK_ACCOUNT_HOLDER');
    const accountNumber=get('MARKETPLACE_BANK_ACCOUNT_NUMBER');
    const accountType=get('MARKETPLACE_BANK_ACCOUNT_TYPE');
    const ruc=get('MARKETPLACE_BANK_RUC');
    const configured=!!(bankName&&accountHolder&&accountNumber&&accountType);
    return {configured,bankName:configured?bankName:null,accountHolder:configured?accountHolder:null,
      accountNumber:configured?accountNumber:null,accountType:configured?accountType:null,ruc:configured?ruc:null,currency:'USD'};
  }
  async bankTransfer(userId:string,enrollmentId:string) {
    await this.schema();
    if(!this.bankDetails().configured) throw new ServiceUnavailableException('Verified bank transfer details are not configured');
    const row=(await this.db.query(`SELECT id,status,price_cents,payment_reference FROM marketplace_plan_enrollments WHERE id=$1 AND user_id=$2`,[enrollmentId,userId])).rows[0];
    if(!row) throw new NotFoundException('Marketplace enrollment not found');
    if(row.status!=='pending_payment'||Number(row.price_cents)<=0) throw new BadRequestException('Enrollment is not payable');
    if(row.payment_reference && !String(row.payment_reference).startsWith('LQB-')) throw new BadRequestException('A card payment is already in progress');
    const reference=`LQB-${row.id}`;
    await this.db.query(`UPDATE marketplace_plan_enrollments SET payment_reference=$3,updated_at=NOW()
      WHERE id=$1 AND user_id=$2 AND payment_reference IS NULL`,[enrollmentId,userId,reference]);
    // Bank transfers are never activated automatically from a browser claim.
    // Operations must reconcile actual bank settlement before activating.
    return {reference,status:'pending_payment',amount:Number(row.price_cents)/100,currency:'USD',requiresManualVerification:true};
  }

  private async transferSchema() {
    await this.schema();
    await this.db.query(`CREATE TABLE IF NOT EXISTS marketplace_bank_transfer_requests (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), enrollment_id uuid NOT NULL UNIQUE REFERENCES marketplace_plan_enrollments(id),
      user_id uuid NOT NULL REFERENCES users(id), reference text NOT NULL UNIQUE,
      bank_transaction_reference text NOT NULL, note text, status text NOT NULL DEFAULT 'pending_review'
      CHECK(status IN ('pending_review','approved','rejected')),
      reviewed_by uuid REFERENCES users(id), reviewed_at timestamptz, review_note text,
      created_at timestamptz NOT NULL DEFAULT NOW(), updated_at timestamptz NOT NULL DEFAULT NOW()
    )`);
  }
  async submitBankConfirmation(userId:string,enrollmentId:string,bankTransactionReference:string,note?:string) {
    await this.transferSchema();
    const ref=String(bankTransactionReference||'').trim();
    if(ref.length<4||ref.length>120) throw new BadRequestException('Provide your bank transaction reference (4–120 characters)');
    const row=(await this.db.query(`SELECT id,status,price_cents,payment_reference FROM marketplace_plan_enrollments WHERE id=$1 AND user_id=$2`,[enrollmentId,userId])).rows[0];
    if(!row) throw new NotFoundException('Enrollment not found');
    if(row.status!=='pending_payment'||!String(row.payment_reference||'').startsWith('LQB-')) throw new BadRequestException('Generate a bank transfer reference before submitting confirmation');
    const result=await this.db.query(`INSERT INTO marketplace_bank_transfer_requests(enrollment_id,user_id,reference,bank_transaction_reference,note)
      VALUES($1,$2,$3,$4,$5) ON CONFLICT(enrollment_id) DO UPDATE SET
      bank_transaction_reference=EXCLUDED.bank_transaction_reference,note=EXCLUDED.note,updated_at=NOW()
      WHERE marketplace_bank_transfer_requests.status='rejected'
      RETURNING id,status,reference,created_at`,[enrollmentId,userId,row.payment_reference,ref,String(note||'').slice(0,1000)]);
    if(!result.rows.length) throw new BadRequestException('This transfer is already awaiting review or approved');
    return {request:result.rows[0],next:'/marketplace/payment-pending'};
  }
  async bankRequestStatus(userId:string,enrollmentId:string) {
    await this.transferSchema();
    const result=await this.db.query(`SELECT r.id,r.reference,r.status,r.review_note,r.created_at,e.plan_key,e.price_cents,e.currency,e.status AS enrollment_status
      FROM marketplace_bank_transfer_requests r JOIN marketplace_plan_enrollments e ON e.id=r.enrollment_id
      WHERE r.enrollment_id=$1 AND r.user_id=$2`,[enrollmentId,userId]);
    if(!result.rows.length) throw new NotFoundException('Bank transfer request not found');
    return {request:result.rows[0]};
  }
  async adminBankRequests(status?:string) {
    await this.transferSchema();
    if(status && !['pending_review','approved','rejected'].includes(status)) throw new BadRequestException('Invalid status');
    const result=await this.db.query(`SELECT r.*,e.plan_key,e.price_cents,e.currency,e.status AS enrollment_status,u.email AS customer_email
      FROM marketplace_bank_transfer_requests r JOIN marketplace_plan_enrollments e ON e.id=r.enrollment_id
      JOIN users u ON u.id=r.user_id WHERE ($1::text IS NULL OR r.status=$1) ORDER BY r.created_at DESC LIMIT 200`,[status||null]);
    return {data:result.rows};
  }
  async adminReviewBankRequest(id:string,adminId:string,approve:boolean,note:string) {
    await this.transferSchema();
    if(!String(note||'').trim()) throw new BadRequestException('Review note is required');
    // Atomic, idempotent review: only pending_review requests can change state.
    const result=await this.db.query(`WITH claimed AS (
      UPDATE marketplace_bank_transfer_requests SET status=$2,reviewed_by=$3,reviewed_at=NOW(),review_note=$4,updated_at=NOW()
      WHERE id=$1 AND status='pending_review' AND ($2='rejected' OR EXISTS (SELECT 1 FROM marketplace_plan_enrollments e WHERE e.id=enrollment_id AND e.status='pending_payment' AND e.payment_reference LIKE 'LQB-%')) RETURNING enrollment_id,status
    ), activated AS (
      UPDATE marketplace_plan_enrollments e SET status='active',
      current_period_start=NOW(),current_period_end=NOW()+INTERVAL '1 month',updated_at=NOW()
      FROM claimed c WHERE c.status='approved' AND e.id=c.enrollment_id AND e.status='pending_payment'
      AND e.payment_reference LIKE 'LQB-%' RETURNING e.id
    ) SELECT (SELECT enrollment_id FROM claimed) AS enrollment_id,(SELECT status FROM claimed) AS status,
      (SELECT id FROM activated) AS activated_id`,[id,approve?'approved':'rejected',adminId,String(note).trim().slice(0,1000)]);
    const row=result.rows[0];
    if(!row?.enrollment_id) throw new BadRequestException('Request already reviewed or not found');
    if(approve&&!row.activated_id) throw new BadRequestException('Enrollment not activated; investigate payment state');
    return {id,status:row.status,enrollmentId:row.enrollment_id};
  }
  paymentConfig() {
    const config = this.nuvei.publicConfig();
    return { environment: config.environment, clientAppCode: config.clientAppCode,
      clientAppKey: config.clientAppKey, configured: config.configured && !!config.clientAppCode && !!config.clientAppKey };
  }

  // A token is created inside Nuvei's own iframe. PAN/CVC never enter this API.
  async checkout(userId: string, enrollmentId: string, token: string) {
    await this.schema();
    if (!/^[a-zA-Z0-9_-]{6,512}$/.test(token)) throw new BadRequestException('Invalid secure card token');
    const row = (await this.db.query(`SELECT * FROM marketplace_plan_enrollments WHERE id=$1 AND user_id=$2`, [enrollmentId,userId])).rows[0];
    if (!row) throw new NotFoundException('Marketplace enrollment not found');
    if (row.status === 'active') return { status:'active', next:'/create-listing' };
    if (row.status !== 'pending_payment' || Number(row.price_cents) <= 0) throw new BadRequestException('Enrollment is not payable');
    if (!this.nuvei.isConfigured()) throw new ServiceUnavailableException('Nuvei is not configured');
    const user = (await this.db.query(`SELECT id,email FROM users WHERE id=$1`,[userId])).rows[0];
    if (!user) throw new NotFoundException('Customer not found');
    const reference = `LQ-${row.id}`;
    // Claim once: never initiate a second charge for a pending/unknown first charge.
    const claim = await this.db.query(`UPDATE marketplace_plan_enrollments SET payment_reference=$3,updated_at=NOW()
      WHERE id=$1 AND user_id=$2 AND payment_reference IS NULL AND status='pending_payment' RETURNING id`,[row.id,userId,reference]);
    if (!claim.rows.length) throw new BadRequestException('Payment already submitted. Await verification before retrying.');
    let response: any;
    try {
      response = await this.nuvei.debit({id:String(user.id),email:String(user.email)},
        {amount:Number(row.price_cents)/100,description:`ListoQasa ${row.plan_key}`,dev_reference:reference,currency:'USD'},token);
    } catch (err) {
      // A network exception is ambiguous: the processor might have charged the card.
      this.logger.error('Marketplace Nuvei debit uncertain',err instanceof Error?err.stack:String(err));
      return {status:'pending_payment',message:'Payment submitted; awaiting provider verification'};
    }
    const tx = response?.body?.transaction || {};
    const transactionId = String(tx.id || '');
    if (transactionId) await this.db.query(`UPDATE marketplace_plan_enrollments SET provider_transaction_id=$2,updated_at=NOW()
      WHERE id=$1 AND status='pending_payment'`,[row.id,transactionId]);
    if (transactionId) {
      try { await this.verifyEnrollmentTransaction(row.id,transactionId); }
      catch(err) { this.logger.warn('Marketplace verification deferred: '+String(err)); }
    }
    const state = (await this.db.query(`SELECT status FROM marketplace_plan_enrollments WHERE id=$1`,[row.id])).rows[0]?.status;
    if (state === 'active') return {status:'active',next:'/create-listing'};
    if (state === 'failed') return {status:'failed',message:'Nuvei declined the payment'};
    return {status:'pending_payment',message:'Waiting for secure payment confirmation'};
  }

  private async activateVerifiedEnrollment(enrollmentId:string,transactionId?:string) {
    // A verified renewal starts after the previous paid period, never discarding
    // already-paid time. The conditional update makes duplicate callbacks idempotent.
    await this.db.query(`UPDATE marketplace_plan_enrollments AS e SET
      status='active',provider_transaction_id=COALESCE($2,e.provider_transaction_id),
      current_period_start=GREATEST(NOW(),COALESCE((SELECT MAX(p.current_period_end)
        FROM marketplace_plan_enrollments p WHERE p.user_id=e.user_id AND p.id<>e.id
        AND p.status='active' AND p.plan_key=e.plan_key AND p.current_period_end>NOW()),NOW())),
      current_period_end=GREATEST(NOW(),COALESCE((SELECT MAX(p.current_period_end)
        FROM marketplace_plan_enrollments p WHERE p.user_id=e.user_id AND p.id<>e.id
        AND p.status='active' AND p.plan_key=e.plan_key AND p.current_period_end>NOW()),NOW()))
        + CASE WHEN e.billing_interval='yearly' THEN INTERVAL '1 year' ELSE INTERVAL '1 month' END,
      updated_at=NOW() WHERE e.id=$1 AND e.status='pending_payment'`,[enrollmentId,transactionId||null]);
  }
  private async verifyEnrollmentTransaction(enrollmentId:string, transactionId:string) {
    const verification = await this.nuvei.verifyTransaction(transactionId);
    if (!verification.ok || !verification.body?.transaction) return;
    const tx = verification.body.transaction;
    const row = (await this.db.query(`SELECT * FROM marketplace_plan_enrollments WHERE id=$1`,[enrollmentId])).rows[0];
    if (!row || row.status !== 'pending_payment' || row.provider_transaction_id !== transactionId) return;
    const ref = String(tx.dev_reference || tx.order?.dev_reference || verification.body?.order?.dev_reference || '');
    const rawAmount = tx.amount ?? tx.order?.amount ?? verification.body?.order?.amount;
    const amount = rawAmount === undefined || rawAmount === null || rawAmount === '' ? NaN : Number(rawAmount);
    const currency = String(tx.currency || tx.order?.currency || verification.body?.order?.currency || '').toUpperCase();
    if (ref !== row.payment_reference || !Number.isFinite(amount) || Math.abs(amount-Number(row.price_cents)/100) > 0.01 || (currency !== '' && currency !== String(row.currency).toUpperCase())) {
      // Log only non-sensitive verification metadata. Never log card tokens, PAN or full provider payload.
      this.logger.error(`Marketplace payment verification mismatch enrollment=${enrollmentId} tx=${transactionId} ` +
        `reference=${ref ? (ref === row.payment_reference ? 'match' : 'different') : 'missing'} ` +
        `amount=${Number.isFinite(amount) ? amount : 'missing'} expectedAmount=${Number(row.price_cents)/100} ` +
        `currency=${currency || 'missing'} expectedCurrency=${row.currency} ` +
        `status=${String(tx.status ?? 'missing')} detail=${String(tx.status_detail ?? 'missing')} ` +
        `transactionKeys=${Object.keys(tx).filter(k => !/card|token|pan|cvv|cvc|email|phone|name/i.test(k)).slice(0,30).join(',')}`);
      return;
    }
    const status = String(tx.status||'').toLowerCase();
    if (['success','1'].includes(status) && Number(tx.status_detail) === 3) {
      await this.activateVerifiedEnrollment(enrollmentId);
    } else if (['failure','failed','2','cancelled','canceled','rejected'].includes(status)) {
      await this.db.query(`UPDATE marketplace_plan_enrollments SET status='failed',updated_at=NOW() WHERE id=$1 AND status='pending_payment'`,[enrollmentId]);
    }
  }
  async paymentStatus(userId:string,enrollmentId:string){
    await this.schema();
    await this.expireDue(userId);
    const r=await this.db.query(`SELECT id,plan_key,status,current_period_end,created_at FROM marketplace_plan_enrollments WHERE id=$1 AND user_id=$2`,[enrollmentId,userId]);
    if(!r.rows.length) throw new NotFoundException('Enrollment not found');
    if(r.rows[0].status==='pending_payment') {
      const tx=(await this.db.query(`SELECT provider_transaction_id FROM marketplace_plan_enrollments WHERE id=$1`,[enrollmentId])).rows[0]?.provider_transaction_id;
      if(tx) await this.verifyEnrollmentTransaction(enrollmentId,tx).catch(err=>this.logger.warn(String(err)));
      const updated=(await this.db.query(`SELECT id,plan_key,status,created_at FROM marketplace_plan_enrollments WHERE id=$1`,[enrollmentId])).rows[0];
      return updated;
    }
    return r.rows[0];
  }
  private safeEqual(a:string,b:string){const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&crypto.timingSafeEqual(x,y)}
  async handlePaymentCallback(payload:any,headerToken?:string){
    await this.schema();
    const tx=payload?.transaction||{};
    const reference=String(tx.dev_reference||payload?.order?.dev_reference||'');
    if(!/^LQ-[0-9a-f-]{36}$/i.test(reference)) return {handled:'ignored'};
    const id=String(tx.id||'');const appCode=String(tx.application_code||'');const userId=String(payload?.user?.id||'');
    const signature=String(tx.stoken||'').toLowerCase();
    const configuredToken=String(this.config.get('NUVEI_CALLBACK_TOKEN')||'');
    const tokenOk=!!configuredToken&&!!headerToken&&this.safeEqual(configuredToken,String(headerToken));
    let signatureOk=false;
    for(const code of [this.nuvei.serverAppCode(),this.nuvei.linkToPayAppCode()]){
      if(!code||(appCode&&appCode!==code))continue;
      const key=this.nuvei.appKeyFor(code);if(!key||!id||!signature)continue;
      const h=crypto.createHmac('sha256',key).update(`${id}_${code}_${userId}`).digest('hex');
      const m=crypto.createHash('md5').update(`${id}_${code}_${userId}_${key}`).digest('hex');
      if(this.safeEqual(signature,h)||this.safeEqual(signature,m))signatureOk=true;
    }
    if(!tokenOk&&!signatureOk) throw new BadRequestException('Invalid Nuvei callback signature');
    const row=(await this.db.query(`SELECT * FROM marketplace_plan_enrollments WHERE payment_reference=$1`,[reference])).rows[0];
    if(!row)return {handled:'unknown_reference'};
    if(row.status==='active')return {handled:'already_active'};
    if(row.status!=='pending_payment')return {handled:'not_pending'};
    if(!id)throw new BadRequestException('Missing provider transaction id');
    // Do not trust callback status or redirect. Recheck with the Nuvei server.
    const verification=await this.nuvei.verifyTransaction(id);
    if(!verification.ok||!verification.body?.transaction)throw new BadRequestException('Unable to verify Nuvei transaction');
    const verified=verification.body.transaction;
    const approved=['success','1'].includes(String(verified.status).toLowerCase())&&Number(verified.status_detail)===3;
    const verifiedRef=String(verified.dev_reference||verification.body?.order?.dev_reference||'');
    const amount=Number(verified.amount);
    const verifiedCurrency=String(verified.currency||verification.body?.order?.currency||'').toUpperCase();
    if((verifiedCurrency !== '' && verifiedCurrency!==String(row.currency).toUpperCase())||!verifiedRef||verifiedRef!==reference||!Number.isFinite(amount)||Math.abs(amount-Number(row.price_cents)/100)>0.01)throw new BadRequestException('Nuvei transaction reference or amount mismatch');
    if(approved){
      await this.activateVerifiedEnrollment(row.id,id);
      return {handled:'activated'};
    }
    const failed=['failure','failed','2','cancelled','canceled','rejected'].includes(String(verified.status).toLowerCase());
    if(failed){await this.db.query(`UPDATE marketplace_plan_enrollments SET status='failed',provider_transaction_id=$2,updated_at=NOW() WHERE id=$1 AND status='pending_payment'`,[row.id,id]);return {handled:'failed'};}
    return {handled:'pending'};
  }
}

// Paid Marketplace purchases use an independent reference and entitlement table.
// CRM and E-Commerce Nuvei subscriptions are never modified.
