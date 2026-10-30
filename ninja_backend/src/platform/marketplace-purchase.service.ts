import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PoolClient } from 'pg';

/** Durable approval outbox. An offline Google Ads conversion action is required for API uploads. */
@Injectable()
export class MarketplacePurchaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MarketplacePurchaseService.name);
  private timer?: NodeJS.Timeout;
  constructor(private readonly db: DatabaseService) {}
  async schema() {
    await this.db.query(`CREATE TABLE IF NOT EXISTS marketplace_purchase_outbox (
      enrollment_id uuid PRIMARY KEY REFERENCES marketplace_plan_enrollments(id),
      transaction_id text NOT NULL UNIQUE, amount_cents integer NOT NULL CHECK(amount_cents > 0),
      currency text NOT NULL DEFAULT 'USD', approved_at timestamptz NOT NULL,
      gclid text, gbraid text, wbraid text,
      status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sending','sent','unattributed','failed')),
      attempts integer NOT NULL DEFAULT 0, next_attempt_at timestamptz NOT NULL DEFAULT now(),
      last_error text, sent_at timestamptz, response jsonb, updated_at timestamptz NOT NULL DEFAULT now()
    )`);
    await this.db.query(`CREATE TABLE IF NOT EXISTS marketplace_ad_attribution (
      enrollment_id uuid PRIMARY KEY REFERENCES marketplace_plan_enrollments(id),
      user_id uuid NOT NULL REFERENCES users(id), gclid text, gbraid text, wbraid text,
      captured_at timestamptz NOT NULL DEFAULT now()
    )`);
  }
  async capture(userId: string, enrollmentId: string, data: any) {
    await this.schema();
    const clean = (value: any) => typeof value === 'string' && /^[a-zA-Z0-9_\-.]{5,512}$/.test(value) ? value : null;
    const [gclid, gbraid, wbraid] = [clean(data?.gclid), clean(data?.gbraid), clean(data?.wbraid)];
    if (!gclid && !gbraid && !wbraid) return {saved:false};
    const r = await this.db.query(`INSERT INTO marketplace_ad_attribution(enrollment_id,user_id,gclid,gbraid,wbraid)
      SELECT id,user_id,$3,$4,$5 FROM marketplace_plan_enrollments WHERE id=$1 AND user_id=$2 AND status='pending_payment'
      ON CONFLICT(enrollment_id) DO NOTHING RETURNING enrollment_id`, [enrollmentId,userId,gclid,gbraid,wbraid]);
    return {saved:r.rowCount === 1}; // first touch is immutable; never replace with admin attribution
  }
  async enqueue(client: PoolClient, enrollmentId: string) {
    await client.query(`INSERT INTO marketplace_purchase_outbox(enrollment_id,transaction_id,amount_cents,currency,approved_at,gclid,gbraid,wbraid)
      SELECT e.id,e.payment_reference,e.price_cents,e.currency,now(),a.gclid,a.gbraid,a.wbraid
      FROM marketplace_plan_enrollments e LEFT JOIN marketplace_ad_attribution a ON a.enrollment_id=e.id
      WHERE e.id=$1 AND e.status='active' AND e.price_cents>0 AND e.currency='USD' AND e.payment_reference LIKE 'LQB-%'
      ON CONFLICT(enrollment_id) DO NOTHING`, [enrollmentId]);
  }
  async onModuleInit() {
    try { await this.schema(); } catch(e) { this.logger.error(`Purchase outbox schema: ${String(e)}`); }
    this.timer = setInterval(() => void this.flush().catch(e=>this.logger.error(String(e))), 60000);
    this.timer.unref?.();
  }
  onModuleDestroy() { if (this.timer) clearInterval(this.timer); }
  async flush() {
    await this.schema();
    // Upload only to a dedicated offline CLICK conversion action; a website tag action is not uploadable.
    const customerId = (process.env.GOOGLE_ADS_CUSTOMER_ID || '').replace(/-/g,'');
    const actionId = process.env.GOOGLE_ADS_OFFLINE_PURCHASE_ACTION_ID;
    const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    const clientId = process.env.GOOGLE_ADS_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
    if (![customerId,actionId,developerToken,clientId,clientSecret].every(Boolean)) {
      this.logger.warn('Google Ads Purchase upload disabled: customer ID, offline action ID, developer token or OAuth client configuration missing');
      return;
    }
    // An existing CRM OAuth connection can supply a refresh token, but only when
    // its connected Ads customer matches the configured conversion customer.
    // Never use an arbitrary team's OAuth credentials for marketplace purchases.
    let refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN;
    if (!refreshToken) {
      const connected = await this.db.query(`SELECT refresh_token FROM google_ads_integrations
        WHERE REPLACE(google_ads_account_id, '-', '') = $1
          AND is_active = true AND refresh_token IS NOT NULL
        ORDER BY updated_at DESC LIMIT 1`, [customerId]);
      refreshToken = connected.rows[0]?.refresh_token;
    }
    if (!refreshToken) {
      this.logger.warn('Google Ads Purchase upload paused: no matching authorized Google Ads OAuth refresh token');
      return;
    }
    await this.db.query(`UPDATE marketplace_purchase_outbox SET status='failed',next_attempt_at=now(),last_error='Interrupted upload; retry with same order ID' WHERE status='sending' AND updated_at<now()-interval '15 minutes'`);
    const claim = await this.db.query(`UPDATE marketplace_purchase_outbox SET status='sending',attempts=attempts+1,updated_at=now()
      WHERE enrollment_id IN (SELECT enrollment_id FROM marketplace_purchase_outbox
        WHERE status IN ('pending','failed') AND next_attempt_at<=now()
        AND (gclid IS NOT NULL OR gbraid IS NOT NULL OR wbraid IS NOT NULL)
        ORDER BY approved_at LIMIT 10 FOR UPDATE SKIP LOCKED)
      RETURNING *`);
    for (const row of claim.rows) {
      try {
        const oauth = await fetch('https://oauth2.googleapis.com/token', {method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:clientId!,client_secret:clientSecret!,refresh_token:refreshToken!,grant_type:'refresh_token'})});
        const token = await oauth.json();
        if (!oauth.ok || !token.access_token) throw new Error(`OAuth HTTP ${oauth.status}`);
        const conversion: any = {
          conversionAction:`customers/${customerId}/conversionActions/${actionId}`,
          conversionDateTime:new Date(row.approved_at).toISOString().replace('T',' ').replace('Z','+00:00'),
          conversionValue:Number(row.amount_cents)/100, currencyCode:'USD', orderId:row.transaction_id,
        };
        if (row.gclid) conversion.gclid=row.gclid;
        else if (row.gbraid) conversion.gbraid=row.gbraid;
        else conversion.wbraid=row.wbraid;
        const url=`https://googleads.googleapis.com/${process.env.GOOGLE_ADS_API_VERSION || 'v22'}/customers/${customerId}:uploadClickConversions`;
        const headers:any={'Authorization':`Bearer ${token.access_token}`,'developer-token':developerToken!,'Content-Type':'application/json'};
        if (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID) headers['login-customer-id']=process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID.replace(/-/g,'');
        const res=await fetch(url,{method:'POST',headers,body:JSON.stringify({conversions:[conversion],partialFailure:true})});
        const body=await res.json();
        if (!res.ok || body.partialFailureError || !body.results?.length) throw new Error(JSON.stringify(body).slice(0,1500));
        await this.db.query(`UPDATE marketplace_purchase_outbox SET status='sent',sent_at=now(),response=$2::jsonb,last_error=NULL,updated_at=now() WHERE enrollment_id=$1`,[row.enrollment_id,JSON.stringify(body)]);
      } catch(e) {
        await this.db.query(`UPDATE marketplace_purchase_outbox SET status='failed',last_error=$2,next_attempt_at=now()+make_interval(mins => LEAST(1440,POWER(2,LEAST(attempts,10))::int)),updated_at=now() WHERE enrollment_id=$1`,[row.enrollment_id,String(e).slice(0,1500)]);
        this.logger.warn(`Purchase upload pending retry for enrollment ${row.enrollment_id}`);
      }
    }
  }
  async status(enrollmentId: string) {
    await this.schema();
    return (await this.db.query(`SELECT enrollment_id,transaction_id,amount_cents,currency,status,attempts,last_error,sent_at,approved_at FROM marketplace_purchase_outbox WHERE enrollment_id=$1`,[enrollmentId])).rows[0] || null;
  }
}
