import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PaddleService } from '../payments/paddle.service';
import { PlatformMailerService } from '../platform-mail/platform-mailer.service';

@Injectable()
export class EcommerceBillingService {
  constructor(private readonly db: DatabaseService, private readonly paddle: PaddleService, private readonly mailer: PlatformMailerService) {}

  private async teamId(user:any){
    if(!user?.id) throw new ForbiddenException('Authenticated user is required.');
    if(user.teamId || user.team_id) return String(user.teamId || user.team_id);

    // Keep billing workspace resolution consistent with WorkspaceLockGuard.
    // Team owners can legitimately have users.team_id = NULL and own the team
    // through teams.owner_id, so checking users.team_id alone rejects valid users.
    const { rows } = await this.db.query(
      `SELECT COALESCE(u.team_id, owned.id) AS team_id
         FROM users u
         LEFT JOIN LATERAL (
           SELECT t.id
             FROM teams t
            WHERE t.owner_id = u.id
            ORDER BY t.created_at ASC
            LIMIT 1
         ) owned ON true
        WHERE u.id = $1
        LIMIT 1`,
      [user.id],
    );
    if(!rows[0]?.team_id) throw new ForbiddenException('Active workspace is required.');
    return String(rows[0].team_id);
  }
  private monthRange(month?:string){
    const v=String(month||''); if(v && !/^\d{4}-\d{2}$/.test(v)) throw new BadRequestException('month must be YYYY-MM');
    const d=v?new Date(`${v}-01T00:00:00Z`):new Date();
    const s=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),1)); const e=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,1));
    return {start:s.toISOString(),end:e.toISOString()};
  }
  private async sub(user:any,id:string){
    const team=await this.teamId(user); const {rows}=await this.db.query(`SELECT s.*,u.id user_id,u.name user_name,u.email user_email,u.selected_plan,u.plan,u.billing_cycle FROM subscriptions s LEFT JOIN LATERAL (SELECT * FROM users x WHERE x.team_id=s.team_id ORDER BY CASE WHEN x.role='owner' THEN 0 ELSE 1 END,x.created_at LIMIT 1) u ON true WHERE s.team_id=$1 AND (s.id::text=$2 OR s.paddle_subscription_id=$2) LIMIT 1`,[team,id]);
    if(!rows[0]) throw new NotFoundException('Subscription not found in this workspace'); return rows[0];
  }
  async dashboard(user:any,month?:string){
    const team=await this.teamId(user); const {start,end}=this.monthRange(month);
    const [metrics,days,upcoming,activity,exceptions,provider,account]=await Promise.all([
      this.db.query(`SELECT COALESCE(SUM(p.amount) FILTER(WHERE p.status IN ('succeeded','paid','completed') AND p.payment_date >= $2 AND p.payment_date < $3),0)::float revenue, COUNT(DISTINCT s.id) FILTER(WHERE s.status IN ('active','trialing'))::int active, COUNT(p.id) FILTER(WHERE p.status IN ('failed','declined','past_due') AND p.created_at >= $2 AND p.created_at < $3)::int failed, COUNT(DISTINCT s.id) FILTER(WHERE s.status='canceled' AND s.updated_at >= $2 AND s.updated_at < $3)::int canceled, COUNT(DISTINCT s.id)::int base FROM subscriptions s LEFT JOIN payments p ON p.subscription_id=s.id WHERE s.team_id=$1`,[team,start,end]),
      this.db.query(`SELECT EXTRACT(DAY FROM s.current_period_end)::int AS "day",COUNT(*)::int count,COALESCE(SUM(COALESCE(sp.price,0)),0)::float amount FROM subscriptions s LEFT JOIN subscription_plans sp ON sp.id=s.plan_id WHERE s.team_id=$1 AND s.current_period_end >= $2 AND s.current_period_end < $3 AND s.status IN ('active','trialing','past_due') GROUP BY 1 ORDER BY 1`,[team,start,end]),
      this.db.query(`SELECT s.current_period_end AS "day",COUNT(*)::int count,COALESCE(SUM(COALESCE(sp.price,0)),0)::float amount FROM subscriptions s LEFT JOIN subscription_plans sp ON sp.id=s.plan_id WHERE s.team_id=$1 AND s.current_period_end>=NOW() AND s.status IN ('active','trialing','past_due') GROUP BY 1 ORDER BY 1 LIMIT 5`,[team]),
      this.db.query(`SELECT p.id,p.status,p.amount,p.currency,p.payment_date,u.name,u.email FROM payments p JOIN subscriptions s ON s.id=p.subscription_id LEFT JOIN LATERAL (SELECT name,email FROM users x WHERE x.team_id=s.team_id ORDER BY CASE WHEN x.role='owner' THEN 0 ELSE 1 END,x.created_at LIMIT 1) u ON true WHERE s.team_id=$1 ORDER BY p.created_at DESC LIMIT 8`,[team]),
      this.db.query(`SELECT COUNT(*) FILTER(WHERE s.status='past_due')::int past_due,COUNT(*) FILTER(WHERE p.status IN ('failed','declined'))::int failed,COUNT(*) FILTER(WHERE p.status='refunded')::int refunded FROM subscriptions s LEFT JOIN payments p ON p.subscription_id=s.id WHERE s.team_id=$1`,[team]),
      this.db.query(`SELECT provider,status,updated_at FROM subscriptions WHERE team_id=$1 ORDER BY updated_at DESC LIMIT 1`,[team]),
      this.db.query(`SELECT name,email,role FROM users WHERE id=$1 LIMIT 1`,[user.id]),
    ]);
    const m=metrics.rows[0]||{}; const base=Number(m.base||0), canceled=Number(m.canceled||0);
    const forecastQ=await this.db.query(`SELECT COALESCE(SUM(COALESCE(sp.price,0)),0)::float value FROM subscriptions s LEFT JOIN subscription_plans sp ON sp.id=s.plan_id WHERE s.team_id=$1 AND s.status IN ('active','trialing') AND s.current_period_end>=NOW() AND s.current_period_end<NOW()+INTERVAL '30 days'`,[team]);
    return {account:account.rows[0]||null,metrics:{monthlyRevenue:Number(m.revenue||0),activeSubscriptions:Number(m.active||0),mrrForecast:Number(forecastQ.rows[0]?.value||0),failedPayments:Number(m.failed||0),churnRate:base?canceled/base*100:0},calendar:days.rows,upcoming:upcoming.rows,activity:activity.rows,exceptions:exceptions.rows[0]||{},provider:{name:provider.rows[0]?.provider||null,status:provider.rows[0]?.provider ? 'connected' : 'not_connected',subscriptionStatus:provider.rows[0]?.status||null,lastSyncAt:provider.rows[0]?.updated_at||null},capabilities:{reschedule:['paddle','nuvei'].includes(String(provider.rows[0]?.provider||'')),sendReminder:true,retryFailed:false,retryFailedReason:'Automatic retry/dunning is managed by the connected payment provider; Cortexa will not create a duplicate charge.',recoveryRules:false,recoveryRulesReason:'No workspace recovery-rules configuration endpoint exists yet.',quickReschedule:['paddle','nuvei'].includes(String(provider.rows[0]?.provider||'')),export:true}};
  }
  async day(user:any,date:string,query:any){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new BadRequestException('date must be YYYY-MM-DD'); const team=await this.teamId(user); const page=Math.max(1,Number(query.page||1)),limit=Math.min(100,Math.max(1,Number(query.limit||7))),off=(page-1)*limit; const search=`%${String(query.search||'').trim()}%`; const status=String(query.status||'all').toLowerCase();
    const params:any[]=[team,date,search,status,limit,off];
    const base=`FROM subscriptions s LEFT JOIN subscription_plans sp ON sp.id=s.plan_id LEFT JOIN LATERAL (SELECT id,name,email,selected_plan,plan FROM users x WHERE x.team_id=s.team_id ORDER BY CASE WHEN x.role='owner' THEN 0 ELSE 1 END,x.created_at LIMIT 1) u ON true WHERE s.team_id=$1 AND s.current_period_end::date=$2::date AND ($3='%%' OR COALESCE(u.name,'') ILIKE $3 OR COALESCE(u.email,'') ILIKE $3) AND ($4='all' OR LOWER(s.status)=$4)`;
    const [rows,total,stats]=await Promise.all([this.db.query(`SELECT s.id,s.provider,s.status,s.current_period_end,COALESCE(sp.name,u.selected_plan,u.plan,'Subscription') plan,COALESCE(sp.price,0)::float amount,u.id customer_id,u.name customer_name,u.email ${base} ORDER BY s.current_period_end LIMIT $5 OFFSET $6`,params),this.db.query(`SELECT COUNT(*)::int count ${base}`,params.slice(0,4)),this.db.query(`SELECT COUNT(DISTINCT s.id)::int scheduled,COUNT(DISTINCT s.id) FILTER(WHERE s.status='past_due')::int past_due,COUNT(p.id) FILTER(WHERE p.status IN ('failed','declined'))::int failed,COUNT(p.id) FILTER(WHERE p.status IN ('succeeded','paid','completed'))::int paid,COALESCE(SUM(p.amount) FILTER(WHERE p.status IN ('succeeded','paid','completed')),0)::float paid_amount FROM subscriptions s LEFT JOIN payments p ON p.subscription_id=s.id LEFT JOIN LATERAL (SELECT id,name,email FROM users x WHERE x.team_id=s.team_id ORDER BY CASE WHEN x.role='owner' THEN 0 ELSE 1 END,x.created_at LIMIT 1) u ON true WHERE s.team_id=$1 AND s.current_period_end::date=$2::date AND ($3='%%' OR COALESCE(u.name,'') ILIKE $3 OR COALESCE(u.email,'') ILIKE $3) AND ($4='all' OR LOWER(s.status)=$4)`,params.slice(0,4))]);
    return {data:rows.rows,total:Number(total.rows[0]?.count||0),page,limit,stats:stats.rows[0]||{}};
  }
  async reschedule(user:any,id:string,body:any){
    const s=await this.sub(user,id); const d=new Date(body?.nextBilledAt || `${body?.date||''}T${body?.time||'12:00'}:00Z`); if(Number.isNaN(d.getTime())||d.getTime()<=Date.now()) throw new BadRequestException('A future billing date is required');
    if(s.provider==='paddle' && s.paddle_subscription_id){ const updated=await this.paddle.changeNextBillingDate(s.paddle_subscription_id,d.toISOString(),body?.prorationBillingMode||'prorated_next_billing_period'); await this.db.query(`UPDATE subscriptions SET current_period_end=$1,updated_at=NOW() WHERE id=$2 AND team_id=$3`,[d.toISOString(),s.id,s.team_id]); return {success:true,provider:'paddle',nextBilledAt:d.toISOString(),subscription:updated}; }
    if(s.provider==='nuvei' || s.nuvei_subscription_id){ await this.db.query(`UPDATE nuvei_subscriptions SET next_billing_date=$1,updated_at=NOW() WHERE id=$2`,[d.toISOString(),s.nuvei_subscription_id]); await this.db.query(`UPDATE subscriptions SET current_period_end=$1,updated_at=NOW() WHERE id=$2 AND team_id=$3`,[d.toISOString(),s.id,s.team_id]); return {success:true,provider:'nuvei',nextBilledAt:d.toISOString()}; }
    throw new BadRequestException('The connected billing provider does not support rescheduling here.');
  }
  async bulkReschedule(user:any,body:any){ const ids: string[] = Array.from(new Set<string>((Array.isArray(body?.subscriptionIds) ? body.subscriptionIds : []).map((value: unknown) => String(value)))); if(!ids.length) throw new BadRequestException('subscriptionIds is required'); const results=[]; for(const id of ids){try{results.push({subscriptionId:id,...await this.reschedule(user,id,body)});}catch(e:any){results.push({subscriptionId:id,success:false,error:e?.message||'Failed'});}} return {success:results.every((x:any)=>x.success),results}; }
  async reminder(user:any,id:string){ const s=await this.sub(user,id); if(!s.user_email) throw new BadRequestException('Customer email is unavailable'); let url:string|null=null; if(s.provider==='paddle'&&s.paddle_subscription_id){ const p:any=await this.paddle.getSubscription(s.paddle_subscription_id); url=p?.managementUrls?.updatePaymentMethod||p?.management_urls?.update_payment_method||p?.data?.managementUrls?.updatePaymentMethod||null; }
    const subject='Billing reminder from Cortexa'; const html=`<p>Hello ${String(s.user_name||'there').replace(/[<>]/g,'')},</p><p>This is a reminder about your Cortexa subscription billing.</p>${url?`<p><a href="${url}">Review payment method</a></p>`:''}`; const sent=await this.mailer.sendCustomEmail({to:s.user_email,userId:s.user_id,subject,html,template:'ecommerce_billing_reminder'}); return {success:sent.status === 'sent',status:sent.status,reason:sent.reason || null,provider:s.provider||null}; }
  async retry(user:any,id:string){ const s=await this.sub(user,id); return {success:false,disabled:true,provider:s.provider||null,message:'Automatic retry/dunning is managed by the connected payment provider. Cortexa will not create a duplicate charge.'}; }
  async integrationsDashboard(user:any){
    const team=await this.teamId(user);
    const {rows}=await this.db.query(
      `SELECT key,name,category,status,last_synced_at,last_error,created_at,updated_at
         FROM integrations
        WHERE team_id=$1
        ORDER BY updated_at DESC`,
      [team],
    );
    const connected=rows.filter((r:any)=>['connected','active'].includes(String(r.status||'').toLowerCase()));
    const healthy=connected.filter((r:any)=>!r.last_error);
    const warning=connected.filter((r:any)=>Boolean(r.last_error));
    const categoryKey=(v:any)=>{
      const x=String(v||'').toLowerCase();
      if(x.includes('payment')) return 'payments';
      if(x.includes('commerce')) return 'ecommerce';
      if(x.includes('email')||x.includes('communication')) return 'messaging';
      if(x.includes('fulfill')||x.includes('shipping')) return 'fulfillment';
      if(x.includes('fraud')||x.includes('risk')) return 'fraud';
      if(x.includes('crm')||x.includes('import')) return 'crm';
      if(x.includes('marketing')||x.includes('automation')) return 'marketing';
      if(x.includes('account')||x.includes('tax')) return 'accounting';
      if(x.includes('storage')) return 'storage';
      if(x.includes('api')||x.includes('webhook')) return 'api';
      if(x.includes('identity')||x.includes('verification')) return 'identity';
      return 'api';
    };
    const grouped=new Map<string,{key:string,total:number,connected:number,warning:number,error:number,status:string}>();
    for(const r of rows){
      const key=categoryKey(r.category); const cur=grouped.get(key)||{key,total:0,connected:0,warning:0,error:0,status:'not_connected'};
      cur.total++;
      if(['connected','active'].includes(String(r.status||'').toLowerCase())) cur.connected++;
      if(r.last_error) cur.warning++;
      if(['error','failed'].includes(String(r.status||'').toLowerCase())) cur.error++;
      if(cur.connected) cur.status='connected';
      grouped.set(key,cur);
    }
    const syncDates=rows.map((r:any)=>r.last_synced_at).filter(Boolean).sort((a:any,b:any)=>new Date(b).getTime()-new Date(a).getTime());
    return {
      summary:{connected:connected.length,total:rows.length,healthy:healthy.length,healthyPercent:connected.length?Math.round(healthy.length/connected.length*100):null,syncs30d:null,syncGrowth:null,failed30d:null,failedChange:null,lastSync:syncDates[0]||null},
      health:{healthy:healthy.length,warning:warning.length,error:rows.filter((r:any)=>['error','failed'].includes(String(r.status||'').toLowerCase())).length,notConnected:rows.filter((r:any)=>!['connected','active','error','failed'].includes(String(r.status||'').toLowerCase())).length,total:rows.length},
      categories:Array.from(grouped.values()),
      events:[],
      recent:connected.slice(0,5).map((r:any)=>({id:r.key,name:r.name,status:r.last_error?'warning':'Connected',lastSync:r.last_synced_at,connectedAt:r.updated_at,categoryKey:categoryKey(r.category)})),
      popular:[],
    };
  }

}
