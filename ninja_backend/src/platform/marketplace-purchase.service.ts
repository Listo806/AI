import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PoolClient } from 'pg';
import { ListoqasaGoogleAdsService } from '../integrations/google-ads/listoqasa-google-ads.service';

/** Durable approval outbox. An offline Google Ads conversion action is required for API uploads. */
@Injectable()
export class MarketplacePurchaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MarketplacePurchaseService.name);
  private timer?: NodeJS.Timeout;
  constructor(private readonly db: DatabaseService, private readonly listoqasaAds: ListoqasaGoogleAdsService) {}
  async schema() {
    await this.db.query(`CREATE TABLE IF NOT EXISTS marketplace_purchase_outbox (
      enrollment_id uuid PRIMARY KEY REFERENCES marketplace_plan_enrollments(id),
      transaction_id text NOT NULL UNIQUE, amount_cents integer NOT NULL CHECK(amount_cents > 0),
      currency text NOT NULL DEFAULT 'USD', approved_at timestamptz NOT NULL,
      gclid text, gbraid text, wbraid text,
      status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sending','sent','unattributed','failed','needs_review')),
      attempts integer NOT NULL DEFAULT 0, next_attempt_at timestamptz NOT NULL DEFAULT now(),
      last_error text, sent_at timestamptz, response jsonb, updated_at timestamptz NOT NULL DEFAULT now()
    )`);
    // Existing installations may have the original CHECK constraint without needs_review.
    // Unknown outcomes must not be automatically replayed: Google may already have
    // accepted the conversion even when our HTTP response was lost.
    await this.db.query(`ALTER TABLE marketplace_purchase_outbox DROP CONSTRAINT IF EXISTS marketplace_purchase_outbox_status_check`);
    await this.db.query(`ALTER TABLE marketplace_purchase_outbox ADD CONSTRAINT marketplace_purchase_outbox_status_check CHECK (status IN ('pending','sending','sent','unattributed','failed','needs_review'))`);
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
    // Explicitly opt into the offline path only after disabling website Purchase for
    // these bank-transfer transactions; otherwise the same payment could be counted twice.
    if (process.env.LISTOQASA_OFFLINE_PURCHASE_ENABLED !== 'true' ||
        process.env.LISTOQASA_BANK_PURCHASE_WEBSITE_DISABLED !== 'true') return;
    // Upload only to a dedicated offline CLICK conversion action; a website tag action is not uploadable.
    const customerId = (process.env.LISTOQASA_GOOGLE_ADS_CUSTOMER_ID || '').replace(/-/g,'');
    const actionId = process.env.LISTOQASA_GOOGLE_ADS_OFFLINE_PURCHASE_ACTION_ID;
    const developerToken = process.env.LISTOQASA_GOOGLE_ADS_DEVELOPER_TOKEN;
    const clientId = process.env.LISTOQASA_GOOGLE_ADS_CLIENT_ID;
    const clientSecret = process.env.LISTOQASA_GOOGLE_ADS_CLIENT_SECRET;
    if (![customerId,actionId,developerToken,clientId,clientSecret].every(Boolean)) {
      this.logger.warn('Google Ads Purchase upload disabled: customer ID, offline action ID, developer token or OAuth client configuration missing');
      return;
    }
    // Do not reuse CRM refresh tokens or any shared Cortexa Google Ads settings.
    await this.listoqasaAds.schema();
    const row = (await this.db.query('SELECT refresh_token FROM listoqasa_google_ads_connection WHERE id=1 AND customer_id=$1', [customerId])).rows[0];
    const refreshToken: string | undefined = row?.refresh_token;
    if (!refreshToken) {
      this.logger.warn('ListoQasa Purchase upload paused: dedicated OAuth connection missing');
      return;
    }
    // Fail closed: website (WEBPAGE) actions must never be used for offline click uploads.
    let verified: any;
    try { verified = await this.listoqasaAds.verifyConversionAction(); }
    catch (e) { this.logger.warn('ListoQasa Purchase upload paused: action verification failed; check API diagnostic logs'); return; }
    if (!verified.uploadEligible) {
      this.logger.warn(`ListoQasa Purchase upload paused: action ${actionId} not an enabled UPLOAD_CLICKS PURCHASE action`);
      return;
    }
    await this.db.query(`UPDATE marketplace_purchase_outbox SET status='needs_review',last_error='Upload interrupted; confirm Google Ads outcome before any manual replay',updated_at=now() WHERE status='sending' AND updated_at<now()-interval '15 minutes'`);
    const claim = await this.db.query(`UPDATE marketplace_purchase_outbox SET status='sending',attempts=attempts+1,updated_at=now()
      WHERE enrollment_id IN (SELECT enrollment_id FROM marketplace_purchase_outbox
        WHERE status IN ('pending','failed') AND next_attempt_at<=now()
        AND (gclid IS NOT NULL OR gbraid IS NOT NULL OR wbraid IS NOT NULL)
        ORDER BY approved_at LIMIT 10 FOR UPDATE SKIP LOCKED)
      RETURNING *`);
    for (const row of claim.rows) {
      let uploadStarted = false;
      try {
        const oauth = await fetch('https://oauth2.googleapis.com/token', {method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:clientId!,client_secret:clientSecret!,refresh_token:refreshToken!,grant_type:'refresh_token'})});
        const token = await oauth.json();
        if (!oauth.ok || !token.access_token) throw new Error(`ListoQasa OAuth refresh HTTP ${oauth.status}`);
        const conversion: any = {
          conversionAction:`customers/${customerId}/conversionActions/${actionId}`,
          conversionDateTime:new Date(row.approved_at).toISOString().replace('T',' ').replace('Z','+00:00'),
          conversionValue:Number(row.amount_cents)/100, currencyCode:'USD', orderId:row.transaction_id,
        };
        if (row.gclid) conversion.gclid=row.gclid;
        else if (row.gbraid) conversion.gbraid=row.gbraid;
        else conversion.wbraid=row.wbraid;
        const url=`https://googleads.googleapis.com/${process.env.LISTOQASA_GOOGLE_ADS_API_VERSION || 'v24'}/customers/${customerId}:uploadClickConversions`;
        const headers:any={'Authorization':`Bearer ${token.access_token}`,'developer-token':developerToken!,'Content-Type':'application/json'};
        if (process.env.LISTOQASA_GOOGLE_ADS_LOGIN_CUSTOMER_ID) headers['login-customer-id']=process.env.LISTOQASA_GOOGLE_ADS_LOGIN_CUSTOMER_ID.replace(/-/g,'');
        uploadStarted = true;
        const res=await fetch(url,{method:'POST',headers,body:JSON.stringify({conversions:[conversion],partialFailure:true})});
        const body=await res.json();
        if (!res.ok || body.partialFailureError || !body.results?.length) {
          this.listoqasaAds.logApiError('listoqasa.purchase.upload', { response: { status: res.status, data: body, headers: { 'request-id': res.headers.get('request-id') } } });
          throw new Error(`Google Ads upload rejected (HTTP ${res.status}); see sanitized backend diagnostics`);
        }
        await this.db.query(`UPDATE marketplace_purchase_outbox SET status='sent',sent_at=now(),response=$2::jsonb,last_error=NULL,updated_at=now() WHERE enrollment_id=$1`,[row.enrollment_id,JSON.stringify(body)]);
      } catch(e) {
        // A transport failure or a missing response after starting the upload has
        // an UNKNOWN outcome. Do not risk a second conversion automatically.
        // Explicit API rejections are also held for review in this conservative mode.
        const state = uploadStarted ? 'needs_review' : 'failed';
        await this.db.query(`UPDATE marketplace_purchase_outbox SET status=$2,last_error=$3,next_attempt_at=CASE WHEN $2='failed' THEN now()+make_interval(mins => LEAST(1440,POWER(2,LEAST(attempts,10))::int)) ELSE next_attempt_at END,updated_at=now() WHERE enrollment_id=$1 AND status='sending'`,[row.enrollment_id,state,String(e).slice(0,1500)]);
        this.logger.warn(`Purchase upload ${state} for enrollment ${row.enrollment_id}; check diagnostics before manual replay`);
      }
    }
  }
  async status(enrollmentId: string) {
    await this.schema();
    return (await this.db.query(`SELECT enrollment_id,transaction_id,amount_cents,currency,status,attempts,last_error,sent_at,approved_at FROM marketplace_purchase_outbox WHERE enrollment_id=$1`,[enrollmentId])).rows[0] || null;
  }
}
