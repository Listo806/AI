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
    const r=await this.db.query(`SELECT id,plan_key,status,price_cents,currency,created_at FROM marketplace_plan_enrollments WHERE user_id=$1 ORDER BY created_at DESC`,[userId]);
    return { data:r.rows, active:r.rows.some(x=>x.status==='active') };
  }
  async requireEntitlement(userId:string) {
    const state=await this.mine(userId);
    if (!state.active) throw new BadRequestException('Activate a Marketplace plan before submitting a listing');
    return state;
  }

  async checkout(userId: string, enrollmentId: string) {
    await this.schema();
    const result = await this.db.query(`SELECT * FROM marketplace_plan_enrollments WHERE id=$1 AND user_id=$2`,[enrollmentId,userId]);
    const e=result.rows[0];
    if(!e) throw new NotFoundException('Marketplace enrollment not found');
    if(e.status==='active') return {status:'active',next:'/create-listing'};
    if(e.status!=='pending_payment'||Number(e.price_cents)<=0) throw new BadRequestException('This enrollment cannot be charged');
    if(e.payment_reference) throw new BadRequestException('A checkout already exists for this enrollment. Check its payment status before retrying.');
    if(!this.nuvei.isConfigured()) throw new BadRequestException('Nuvei is not configured');
    const user = (await this.db.query(`SELECT id,email,first_name,last_name FROM users WHERE id=$1`,[userId])).rows[0];
    if(!user) throw new NotFoundException('Customer not found');
    const reference=`LQ-${e.id}`;
    const claim=await this.db.query(`UPDATE marketplace_plan_enrollments SET payment_reference=$3,updated_at=NOW() WHERE id=$1 AND user_id=$2 AND payment_reference IS NULL RETURNING id`,[e.id,userId,reference]);
    if(!claim.rows.length) throw new BadRequestException('Checkout already started');
    try {
      const resultNuvei=await this.nuvei.initReference({user:{id:user.id,email:user.email,first_name:user.first_name||'',last_name:user.last_name||''},order:{amount:Number(e.price_cents)/100,description:`ListoQasa ${e.plan_key}`,dev_reference:reference,currency:'USD'},locale:'en'});
      const body=resultNuvei.body || {};
      const url=body.checkout_url || body.checkoutUrl || body.data?.checkout_url || body.data?.checkoutUrl || body.payment?.checkout_url || body.payment?.checkoutUrl || body.redirect_url || body.data?.redirect_url;
      if(!resultNuvei.ok || !url || !/^https:\/\//i.test(String(url))){
        this.logger.error(`Marketplace Nuvei checkout failed: http=${resultNuvei.httpStatus}, providerCode=${String(body.error?.code||body.code||'unknown')}, message=${String(body.error?.message||body.message||resultNuvei.error||'No valid checkout URL').slice(0,250)}`);
        throw new ServiceUnavailableException('Secure Nuvei checkout is temporarily unavailable. Please retry or contact support. Your plan has not been charged or activated.');
      }
      return {status:'pending_payment',checkoutUrl:String(url),enrollmentId:e.id};
    } catch(err){
      await this.db.query(`UPDATE marketplace_plan_enrollments SET payment_reference=NULL,updated_at=NOW() WHERE id=$1 AND status='pending_payment' AND provider_transaction_id IS NULL`,[e.id]).catch(dbErr=>this.logger.error('Unable to release failed Marketplace checkout claim',dbErr?.stack));
      if(err instanceof ServiceUnavailableException)throw err;
      this.logger.error('Marketplace Nuvei initialization exception',err instanceof Error?err.stack:String(err));
      throw new ServiceUnavailableException('Unable to initialize Nuvei checkout. Your plan has not been charged or activated.');
    }
  }
  async paymentStatus(userId:string,enrollmentId:string){
    await this.schema();
    const r=await this.db.query(`SELECT id,plan_key,status,created_at FROM marketplace_plan_enrollments WHERE id=$1 AND user_id=$2`,[enrollmentId,userId]);
    if(!r.rows.length) throw new NotFoundException('Enrollment not found');
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
