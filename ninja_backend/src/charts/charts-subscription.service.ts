import { BadRequestException, ForbiddenException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { randomBytes, createHmac, timingSafeEqual } from 'crypto';

@Injectable()
export class ChartsSubscriptionService {
  constructor(private readonly db: DatabaseService) {}
  private async schema() {
    await this.db.query(`CREATE TABLE IF NOT EXISTS charts_entitlements (
      user_id uuid PRIMARY KEY REFERENCES users(id), trial_started_at timestamptz,
      trial_ends_at timestamptz, plan text CHECK(plan IN ('monthly','annual')),
      paid_until timestamptz, updated_at timestamptz NOT NULL DEFAULT now())`);
    await this.db.query(`CREATE TABLE IF NOT EXISTS charts_bank_orders (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id),
      billing text NOT NULL CHECK(billing IN ('monthly','annual')),
      offer_code text,
      renewal_amount_cents integer,
      amount_cents integer NOT NULL, currency text NOT NULL DEFAULT 'USD',
      reference text NOT NULL UNIQUE, status text NOT NULL DEFAULT 'pending_payment'
        CHECK(status IN ('pending_payment','pending_review','approved','rejected')),
      bank_transaction_reference text, receipt_data bytea, receipt_mime text,
      reviewed_by uuid, reviewed_at timestamptz, review_note text,
      created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now())`);
    await this.db.query('ALTER TABLE charts_bank_orders ADD COLUMN IF NOT EXISTS offer_code text');
    await this.db.query('ALTER TABLE charts_bank_orders ADD COLUMN IF NOT EXISTS renewal_amount_cents integer');
    await this.db.query(`CREATE TABLE IF NOT EXISTS charts_offer_claims(
      user_id uuid NOT NULL REFERENCES users(id), offer_code text NOT NULL,
      order_id uuid NOT NULL UNIQUE REFERENCES charts_bank_orders(id),
      created_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY(user_id,offer_code))`);
    await this.db.query('CREATE INDEX IF NOT EXISTS charts_orders_user_idx ON charts_bank_orders(user_id,created_at DESC)');
  }
  private bank() {
    const get=(key:string)=>String(process.env[key]||'').trim();
    const bankName=get('CHARTS_BANK_NAME')||get('MARKETPLACE_BANK_NAME');
    const accountHolder=get('CHARTS_BANK_ACCOUNT_HOLDER')||get('MARKETPLACE_BANK_ACCOUNT_HOLDER');
    const accountNumber=get('CHARTS_BANK_ACCOUNT_NUMBER')||get('MARKETPLACE_BANK_ACCOUNT_NUMBER');
    const accountType=get('CHARTS_BANK_ACCOUNT_TYPE')||get('MARKETPLACE_BANK_ACCOUNT_TYPE');
    const ruc=get('CHARTS_BANK_RUC')||get('MARKETPLACE_BANK_RUC');
    if(!bankName||!accountHolder||!accountNumber||!accountType) throw new ServiceUnavailableException('Bank transfer details are not configured');
    return {bankName,accountHolder,accountNumber,accountType,ruc,currency:'USD'};
  }
  async access(userId:string) {
    await this.schema();
    const row=(await this.db.query(`SELECT trial_started_at,trial_ends_at,plan,paid_until FROM charts_entitlements WHERE user_id=$1`,[userId])).rows[0];
    const now=Date.now();
    const owner=!!process.env.CHARTS_OWNER_USER_ID && userId===process.env.CHARTS_OWNER_USER_ID;
    const trial=!!row?.trial_ends_at && new Date(row.trial_ends_at).getTime()>now;
    const paid=!!row?.paid_until && new Date(row.paid_until).getTime()>now;
    return {allowed:owner||trial||paid,owner,trialActive:trial,paidActive:paid,trialEndsAt:row?.trial_ends_at||null,paidUntil:row?.paid_until||null,plan:row?.plan||null,trialUsed:!!row?.trial_started_at};
  }
  async startTrial(userId:string) {
    await this.schema();
    // One trial per account, never reset by subsequent requests or account login.
    await this.db.query(`INSERT INTO charts_entitlements(user_id,trial_started_at,trial_ends_at)
      VALUES($1,now(),now()+interval '7 days') ON CONFLICT(user_id) DO NOTHING`,[userId]);
    return this.access(userId);
  }
  issueExitOffer(userId:string) {
    const secret=String(process.env.CHARTS_EXIT_OFFER_SECRET||'');
    if(secret.length<32) throw new ServiceUnavailableException('Charts offer signing key is not configured');
    const payload=Buffer.from(JSON.stringify({userId,offer:'CHARTS_EXIT_444',exp:Date.now()+15*60*1000})).toString('base64url');
    const sig=createHmac('sha256',secret).update(payload).digest('base64url');
    return {offerCode:'CHARTS_EXIT_444',offerToken:payload+'.'+sig,expiresInSeconds:900};
  }
  private verifyExitOffer(userId:string,token?:string){
    const secret=String(process.env.CHARTS_EXIT_OFFER_SECRET||'');
    if(secret.length<32) throw new ServiceUnavailableException('Charts offer signing key is not configured');
    const [payload,sig,extra]=String(token||'').split('.');
    if(!payload||!sig||extra) throw new BadRequestException('Offer token required');
    const expected=createHmac('sha256',secret).update(payload).digest('base64url');
    if(Buffer.byteLength(sig)>128 || Buffer.byteLength(sig)!==Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(expected),Buffer.from(sig))) throw new BadRequestException('Invalid offer token');
    let claim:any;try{claim=JSON.parse(Buffer.from(payload,'base64url').toString());}catch{throw new BadRequestException('Invalid offer token');}
    if(claim.userId!==userId||claim.offer!=='CHARTS_EXIT_444'||!Number.isFinite(claim.exp)||claim.exp<Date.now())
      throw new BadRequestException('Offer expired or belongs to another account');
  }
  async createOrder(userId:string,billing:string,offerCode?:string,offerToken?:string) {
    await this.schema();
    if(!['monthly','annual'].includes(billing)) throw new BadRequestException('Invalid billing interval');
    if(offerCode && (offerCode!=='CHARTS_EXIT_444'||billing!=='annual')) throw new BadRequestException('Invalid offer');
    const offer=offerCode||null;
    if(offer) {
      this.verifyExitOffer(userId,offerToken);
      const existingPaid=await this.db.query('SELECT 1 FROM charts_entitlements WHERE user_id=$1 AND paid_until>now()',[userId]);
      if(existingPaid.rows.length) throw new BadRequestException('Introductory offer is for new Charts subscriptions');
      const previous=await this.db.query(`SELECT 1 FROM charts_offer_claims WHERE user_id=$1 AND offer_code=$2`,[userId,offer]);
      if(previous.rows.length) throw new BadRequestException('This introductory offer was already used');
    }
    const bank=this.bank();
    const pending=(await this.db.query(`SELECT id,billing,amount_cents,reference,status,offer_code,renewal_amount_cents FROM charts_bank_orders
      WHERE user_id=$1 AND billing=$2 AND offer_code IS NOT DISTINCT FROM $3 AND status IN ('pending_payment','pending_review') ORDER BY created_at DESC LIMIT 1`,[userId,billing,offer])).rows[0];
    if(pending) return {order:pending,bank};
    const reference='CH-'+randomBytes(8).toString('hex').toUpperCase();
    const amount=offer?44400:billing==='annual'?80400:9700;
    const renewal=offer?80400:amount;
    const order=(await this.db.query(`INSERT INTO charts_bank_orders(user_id,billing,amount_cents,reference,offer_code,renewal_amount_cents)
      VALUES($1,$2,$3,$4,$5,$6) RETURNING id,billing,amount_cents,reference,status,offer_code,renewal_amount_cents`,[userId,billing,amount,reference,offer,renewal])).rows[0];
    return {order,bank};
  }
  async submitReceipt(userId:string,id:string,bankReference:string,receipt?:Express.Multer.File) {
    await this.schema();
    if(!/^[0-9a-f-]{36}$/i.test(id)) throw new BadRequestException('Invalid order');
    if(!receipt?.buffer?.length) throw new BadRequestException('Payment receipt is required');
    if(!['image/jpeg','image/png','application/pdf'].includes(receipt.mimetype)) throw new BadRequestException('Only JPEG, PNG or PDF receipts are supported');
    const ref=String(bankReference||'').trim().slice(0,120);
    if(ref.length<3) throw new BadRequestException('Bank transaction reference is required');
    const result=await this.db.query(`UPDATE charts_bank_orders SET status='pending_review',bank_transaction_reference=$3,
      receipt_data=$4,receipt_mime=$5,updated_at=now() WHERE id=$1 AND user_id=$2 AND status IN ('pending_payment','rejected')
      RETURNING id,status,reference`,[id,userId,ref,receipt.buffer,receipt.mimetype]);
    if(result.rows.length) return {order:result.rows[0]};
    const existing=(await this.db.query(`SELECT id,status,reference FROM charts_bank_orders WHERE id=$1 AND user_id=$2`,[id,userId])).rows[0];
    if(existing?.status==='pending_review'||existing?.status==='approved') return {order:existing};
    throw new NotFoundException('Order not found or cannot be updated');
  }
  async myOrders(userId:string) { await this.schema(); return (await this.db.query(`SELECT id,billing,offer_code,amount_cents,renewal_amount_cents,currency,reference,status,created_at FROM charts_bank_orders WHERE user_id=$1 ORDER BY created_at DESC LIMIT 30`,[userId])).rows; }
  async adminOrders(status?:string) { await this.schema(); const state=['pending_review','approved','rejected','pending_payment'].includes(status||'')?status:null;
    return (await this.db.query(`SELECT o.id,o.user_id,u.email,o.billing,o.offer_code,o.amount_cents,o.renewal_amount_cents,o.currency,o.reference,o.status,o.bank_transaction_reference,o.created_at,o.reviewed_at FROM charts_bank_orders o JOIN users u ON u.id=o.user_id WHERE ($1::text IS NULL OR o.status=$1) ORDER BY o.created_at DESC LIMIT 200`,[state])).rows; }
  async adminPlans(){
    return [
      {code:'charts-monthly',name:'Cortexa Charts Monthly',billing:'monthly',amount_cents:9700,currency:'USD',period_months:1},
      {code:'charts-annual',name:'Cortexa Charts Annual',billing:'annual',amount_cents:80400,currency:'USD',period_months:12,monthly_equivalent_cents:6700},
      {code:'charts-exit444',name:'Cortexa Charts Annual Introductory Offer',billing:'annual',amount_cents:44400,currency:'USD',period_months:12,monthly_equivalent_cents:3700,renewal_amount_cents:80400,visibility:'exit-popup-only'}
    ];
  }
  async adminBillingCalendar(month?:string){
    await this.schema();
    const m=String(month||new Date().toISOString().slice(0,7));
    if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(m)) throw new BadRequestException('Invalid month');
    const rows=await this.db.query(`SELECT e.user_id,u.email,e.plan,e.paid_until,
      CASE WHEN e.plan='annual' THEN 80400 ELSE 9700 END AS renewal_amount_cents,
      'USD' AS currency
      FROM charts_entitlements e JOIN users u ON u.id=e.user_id
      WHERE e.paid_until >= ($1::text||'-01')::date
      AND e.paid_until < (($1::text||'-01')::date+interval '1 month')
      ORDER BY e.paid_until`,[m]);
    return {month:m,renewals:rows.rows,notice:'Scheduled renewals are informational; bank transfers require a new verified payment.'};
  }
  async adminReceipt(id:string) {await this.schema(); const r=(await this.db.query('SELECT receipt_data,receipt_mime FROM charts_bank_orders WHERE id=$1',[id])).rows[0]; if(!r?.receipt_data) throw new NotFoundException('Receipt not found'); return r;}
  async review(id:string,adminId:string,approve:boolean,note:string) {
    await this.schema();
    return this.db.transaction(async(client)=>{
      const r=await client.query(`SELECT * FROM charts_bank_orders WHERE id=$1 FOR UPDATE`,[id]);
      const order=r.rows[0]; if(!order) throw new NotFoundException('Order not found');
      if(order.status==='approved') { if(!approve) throw new BadRequestException('Approved payment cannot be rejected'); return {id,status:'approved',alreadyProcessed:true}; }
      if(order.status!=='pending_review') throw new BadRequestException('Only submitted receipts can be reviewed');
      await client.query(`UPDATE charts_bank_orders SET status=$2,reviewed_by=$3,reviewed_at=now(),review_note=$4,updated_at=now() WHERE id=$1`,[id,approve?'approved':'rejected',adminId,String(note||'').slice(0,1000)]);
      if(approve) {
        if(order.offer_code) {
          await client.query(`INSERT INTO charts_offer_claims(user_id,offer_code,order_id)
            VALUES($1,$2,$3) ON CONFLICT(user_id,offer_code) DO NOTHING`,[order.user_id,order.offer_code,id]);
          const claim=await client.query('SELECT order_id FROM charts_offer_claims WHERE user_id=$1 AND offer_code=$2',[order.user_id,order.offer_code]);
          if(claim.rows[0]?.order_id!==id) throw new BadRequestException('Offer already redeemed');
        }
        // Atomic, idempotent activation. A retry of the same approval cannot extend paid_until.
        const duration=order.billing==='annual'?'1 year':'1 month';
        await client.query(`INSERT INTO charts_entitlements(user_id,plan,paid_until)
          VALUES($1,$2,now()+($3::text)::interval)
          ON CONFLICT(user_id) DO UPDATE SET plan=$2,paid_until=GREATEST(now(),COALESCE(charts_entitlements.paid_until,now()))+($3::text)::interval,updated_at=now()`,[order.user_id,order.billing,duration]);
      }
      return {id,status:approve?'approved':'rejected'};
    });
  }
}
