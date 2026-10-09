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
    await this.db.query(`CREATE INDEX IF NOT EXISTS marketplace_enrollments_user_idx ON marketplace_plan_enrollments(user_id,created_at DESC)`);
  }
  plans() { return Object.entries(PLANS).map(([key,p])=>({key,...p,currency:'USD'})); }
  async enroll(userId: string, planKey: string) {
    const plan = PLANS[planKey as keyof typeof PLANS];
    if (!plan) throw new BadRequestException('Invalid Marketplace plan');
    await this.schema();
    if (plan.priceCents === 0) {
      // Free launch is a distinct Marketplace entitlement; never calls Nuvei.
      const existing = await this.db.query(`SELECT * FROM marketplace_plan_enrollments WHERE user_id=$1 AND plan_key=$2 AND status='active' ORDER BY created_at DESC LIMIT 1`,[userId,planKey]);
      if (existing.rows.length) return { enrollment: existing.rows[0], next: '/create-listing', message:'Your account is ready. Create your first listing' };
      const r=await this.db.query(`INSERT INTO marketplace_plan_enrollments(user_id,plan_key,status,price_cents) VALUES ($1,$2,'active',0) RETURNING *`,[userId,planKey]);
      return { enrollment:r.rows[0], next:'/create-listing', message:'Your account is ready. Create your first listing' };
    }
    const r=await this.db.query(`INSERT INTO marketplace_plan_enrollments(user_id,plan_key,status,price_cents) VALUES ($1,$2,'pending_payment',$3) RETURNING *`,[userId,planKey,plan.priceCents]);
    return {enrollment:r.rows[0],next:'/marketplace/checkout',requiresPayment:true};
  }
  async mine(userId:string) {
    await this.schema();
    const r=await this.db.query(`SELECT id,plan_key,status,price_cents,currency,payment_reference,created_at FROM marketplace_plan_enrollments WHERE user_id=$1 ORDER BY created_at DESC`,[userId]);
    return { data:r.rows, active:r.rows.some(x=>x.status==='active') };
  }
  async requireEntitlement(userId:string) {
    const state=await this.mine(userId);
    if (!state.active) throw new BadRequestException('Activate a Marketplace plan before submitting a listing');
    return state;
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

  private async verifyEnrollmentTransaction(enrollmentId:string, transactionId:string) {
    const verification = await this.nuvei.verifyTransaction(transactionId);
    if (!verification.ok || !verification.body?.transaction) return;
    const tx = verification.body.transaction;
    const row = (await this.db.query(`SELECT * FROM marketplace_plan_enrollments WHERE id=$1`,[enrollmentId])).rows[0];
    if (!row || row.status !== 'pending_payment' || row.provider_transaction_id !== transactionId) return;
    const ref = String(tx.dev_reference || verification.body?.order?.dev_reference || '');
    const amount = Number(tx.amount ?? verification.body?.order?.amount);
    const currency = String(tx.currency || verification.body?.order?.currency || '').toUpperCase();
    if (ref !== row.payment_reference || !Number.isFinite(amount) || Math.abs(amount-Number(row.price_cents)/100) > 0.01 || currency !== row.currency) {
      this.logger.error(`Marketplace payment verification mismatch enrollment=${enrollmentId}`);
      return;
    }
    const status = String(tx.status||'').toLowerCase();
    if (['success','1'].includes(status) && Number(tx.status_detail) === 3) {
      await this.db.query(`UPDATE marketplace_plan_enrollments SET status='active',updated_at=NOW() WHERE id=$1 AND status='pending_payment'`,[enrollmentId]);
    } else if (['failure','failed','2','cancelled','canceled','rejected'].includes(status)) {
      await this.db.query(`UPDATE marketplace_plan_enrollments SET status='failed',updated_at=NOW() WHERE id=$1 AND status='pending_payment'`,[enrollmentId]);
    }
  }
  async paymentStatus(userId:string,enrollmentId:string){
    await this.schema();
    const r=await this.db.query(`SELECT id,plan_key,status,created_at FROM marketplace_plan_enrollments WHERE id=$1 AND user_id=$2`,[enrollmentId,userId]);
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
    if(!verifiedCurrency||verifiedCurrency!==String(row.currency).toUpperCase()||!verifiedRef||verifiedRef!==reference||!Number.isFinite(amount)||Math.abs(amount-Number(row.price_cents)/100)>0.01)throw new BadRequestException('Nuvei transaction reference or amount mismatch');
    if(approved){
      await this.db.query(`UPDATE marketplace_plan_enrollments SET status='active',provider_transaction_id=$2,updated_at=NOW() WHERE id=$1 AND status='pending_payment'`,[row.id,id]);
      return {handled:'activated'};
    }
    const failed=['failure','failed','2','cancelled','canceled','rejected'].includes(String(verified.status).toLowerCase());
    if(failed){await this.db.query(`UPDATE marketplace_plan_enrollments SET status='failed',provider_transaction_id=$2,updated_at=NOW() WHERE id=$1 AND status='pending_payment'`,[row.id,id]);return {handled:'failed'};}
    return {handled:'pending'};
  }
}

// Paid Marketplace purchases use an independent reference and entitlement table.
// CRM and E-Commerce Nuvei subscriptions are never modified.
