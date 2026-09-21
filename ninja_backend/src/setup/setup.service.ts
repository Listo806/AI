import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { DatabaseService } from "../database/database.service";
import { NotificationsService } from "../notifications/notifications.service";
@Injectable()
export class SetupService {
 constructor(private readonly db:DatabaseService,private readonly notifications:NotificationsService){}
 private userId(u:any){ return u?.id || u?.userId || u?.sub || null; }

 private async resolveTeamId(u:any):Promise<string>{
   const direct=u?.teamId || u?.team_id || u?.team?.id || null;
   if(direct) return direct;

   const userId=this.userId(u);
   if(!userId) throw new ForbiddenException('Authenticated user is missing an id');

   // Source of truth #1: users.team_id. JwtStrategy normally returns this as teamId,
   // but resolve it again here so Setup does not depend on the request-user shape.
   const uq=await this.db.query(
     `SELECT team_id FROM users WHERE id=$1 LIMIT 1`,
     [userId]
   );
   if(uq.rows[0]?.team_id) return uq.rows[0].team_id;

   // Source of truth #2: active team membership for accounts whose users.team_id
   // has not yet been populated.
   const mq=await this.db.query(
     `SELECT team_id
        FROM team_members
       WHERE user_id=$1
         AND status='active'
       ORDER BY joined_at ASC NULLS LAST, created_at ASC
       LIMIT 1`,
     [userId]
   );
   if(mq.rows[0]?.team_id) return mq.rows[0].team_id;

   throw new ForbiddenException('Authenticated user is not attached to a team');
 }

 private async workspace(teamId:string, requested?:string){
   if(!teamId) throw new ForbiddenException('Authenticated user is not attached to a team');

   // New workspace-enabled accounts: enforce the team's active entitlements.
   const q=await this.db.query(
     `SELECT workspace_id
        FROM workspace_entitlements
       WHERE team_id=$1
         AND status='active'
       ORDER BY created_at ASC`,
     [teamId]
   );

   if(q.rows.length){
     if(requested){
       const allowed=q.rows.some((row:any)=>row.workspace_id===requested);
       if(!allowed) throw new ForbiddenException('Workspace access denied');
       return requested;
     }
     return q.rows[0].workspace_id;
   }

   // Legacy/current accounts can legitimately have no workspace_entitlements yet.
   // Keep one stable team-scoped setup record until entitlements are provisioned.
   if(requested && requested!=='default'){
     throw new ForbiddenException('Workspace access denied');
   }
   return 'default';
 }
 private async ensure(){ await this.db.query(`CREATE TABLE IF NOT EXISTS customer_setup_configs(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),team_id uuid NOT NULL,workspace_id text NOT NULL,ai_agent_id uuid NULL,selected_objective text NULL,config jsonb NOT NULL DEFAULT '{}'::jsonb,tests jsonb NOT NULL DEFAULT '[]'::jsonb,status text NOT NULL DEFAULT 'setup',activated_at timestamptz NULL,activated_by uuid NULL,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),UNIQUE(team_id,workspace_id)); CREATE INDEX IF NOT EXISTS idx_customer_setup_team_ws ON customer_setup_configs(team_id,workspace_id); CREATE TABLE IF NOT EXISTS setup_assistance_requests(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),request_code text UNIQUE NOT NULL,team_id uuid NOT NULL,workspace_id text NOT NULL,ai_agent_id uuid NULL,requested_by uuid NOT NULL,assistance_type text NOT NULL,payload jsonb NOT NULL DEFAULT '{}'::jsonb,status text NOT NULL DEFAULT 'Submitted',latest_response text NULL,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());`); }
 private readiness(c:any){ const cfg=c.config||{}; const channels=cfg.customerChannels||[]; const checks:any={ trained:!!cfg.trainingComplete, website:!channels.includes('website')||!!(cfg.website?.url&&cfg.website?.ctaLabel&&cfg.website?.destination), phone:!channels.some((x:string)=>['phone','sms'].includes(x))||cfg.phone?.connectionStatus==='connected', whatsapp:!channels.includes('whatsapp')||cfg.whatsapp?.connected===true, consent:!!cfg.consent?.configured, routing:!!(cfg.routing?.pipelineId&&cfg.routing?.stageId), handoff:!!cfg.handoff?.verified, conversionTest:Array.isArray(c.tests)&&c.tests.some((x:any)=>x.status==='pass')}; return {...checks,ready:Object.values(checks).every(Boolean)}; }
 private shape(r:any){ const c={...r,config:r?.config||{},tests:r?.tests||[]}; const ready=this.readiness(c); return {...c,readiness:ready,progress:Math.round(Object.entries(ready).filter(([k])=>k!=='ready').filter(([,v])=>v).length/8*100)}; }
 private async loadResolved(teamId:string,ws:string){
   await this.db.query(
     `INSERT INTO customer_setup_configs(team_id,workspace_id)
      VALUES($1,$2)
      ON CONFLICT(team_id,workspace_id) DO NOTHING`,
     [teamId,ws]
   );
   const r=await this.db.query(
     `SELECT * FROM customer_setup_configs WHERE team_id=$1 AND workspace_id=$2 LIMIT 1`,
     [teamId,ws]
   );
   return this.shape(r.rows[0]);
 }
 async get(u:any,requested?:string){
   await this.ensure();
   const teamId=await this.resolveTeamId(u);
   const ws=await this.workspace(teamId,requested);
   const setup=await this.loadResolved(teamId,ws);

   const req=await this.db.query(
     `SELECT id,request_code,assistance_type,status,latest_response,created_at,updated_at
        FROM setup_assistance_requests
       WHERE team_id=$1 AND workspace_id=$2
       ORDER BY created_at DESC LIMIT 1`,
     [teamId,ws]
   );

   return {...setup,assistanceRequest:req.rows[0]||null};
 }

 async patch(u:any,requested:string|undefined,body:any){
   await this.ensure();
   const teamId=await this.resolveTeamId(u);
   const ws=await this.workspace(teamId,requested);
   const old=await this.loadResolved(teamId,ws);

   const allowed=['customerChannels','website','phone','whatsapp','marketing','consent','conversion','routing','handoff','trainingComplete','assistanceDismissed'];
   const patch:any={};
   for(const k of allowed) if(body[k]!==undefined) patch[k]=body[k];

   const merged={...(old.config||{}),...patch};
   await this.db.query(
     `UPDATE customer_setup_configs
         SET selected_objective=COALESCE($3,selected_objective),
             config=$4::jsonb,
             updated_at=now()
       WHERE team_id=$1 AND workspace_id=$2`,
     [teamId,ws,body.selectedObjective??null,JSON.stringify(merged)]
   );

   return this.loadResolved(teamId,ws);
 }

 async runTest(u:any,requested:string|undefined,b:any){ const teamId=await this.resolveTeamId(u); const ws=await this.workspace(teamId,requested); const c=await this.loadResolved(teamId,ws); const connected=(c.config?.customerChannels||[]).includes(b.channel); if(!connected) throw new BadRequestException('Selected test channel is not configured'); const routing=!!(c.config?.routing?.pipelineId&&c.config?.routing?.stageId); const handoff=!!c.config?.handoff?.verified; const pass=connected&&routing&&handoff; const result={id:randomUUID(),workspaceId:ws,aiAgentId:c.ai_agent_id||null,channel:b.channel,scenario:b.scenario,entryPoint:b.entryPoint||null,timestamp:new Date().toISOString(),contactId:null,source:b.entryPoint||b.channel,pipelineId:c.config?.routing?.pipelineId||null,stageId:c.config?.routing?.stageId||null,conversionResult:pass?'verified':'not_verified',handoffResult:handoff?'verified':'not_verified',status:pass?'pass':'fail',errorDetails:pass?null:'Complete routing and human handoff before the end-to-end test.'}; const tests=[...(c.tests||[]),result].slice(-50); await this.db.query(`UPDATE customer_setup_configs SET tests=$3::jsonb,updated_at=now() WHERE team_id=$1 AND workspace_id=$2`,[teamId,ws,JSON.stringify(tests)]); return {result,setup:await this.loadResolved(teamId,ws)}; }
 async activate(u:any,requested?:string){ const teamId=await this.resolveTeamId(u); const ws=await this.workspace(teamId,requested); const c=await this.loadResolved(teamId,ws); if(!c.readiness.ready) throw new BadRequestException('Complete all required launch-readiness checks before activation.'); await this.db.query(`UPDATE customer_setup_configs SET status='active',activated_at=now(),activated_by=$3,updated_at=now() WHERE team_id=$1 AND workspace_id=$2`,[teamId,ws,this.userId(u)]); return this.loadResolved(teamId,ws); }
 async assistance(u:any,requested:string|undefined,b:any){ const teamId=await this.resolveTeamId(u); const ws=await this.workspace(teamId,requested); if(!['AI Agent Setup Assistance','Website & Connection Assistance'].includes(b.assistanceType)) throw new BadRequestException('Select an assistance type'); if(!b.businessName||!b.contactName||!b.contactEmail) throw new BadRequestException('Business name, contact name and email are required'); const duplicate=await this.db.query(`SELECT * FROM setup_assistance_requests WHERE team_id=$1 AND workspace_id=$2 AND status IN ('Submitted','Reviewing','Quote Sent','Approved','In Progress') ORDER BY created_at DESC LIMIT 1`,[teamId,ws]); if(duplicate.rows[0]) return {duplicate:true,request:duplicate.rows[0]}; const c=await this.loadResolved(teamId,ws); const code='SET-'+Date.now().toString(36).toUpperCase(); const q=await this.db.query(`INSERT INTO setup_assistance_requests(request_code,team_id,workspace_id,ai_agent_id,requested_by,assistance_type,payload) VALUES($1,$2,$3,$4,$5,$6,$7::jsonb) RETURNING *`,[code,teamId,ws,c.ai_agent_id||null,this.userId(u),b.assistanceType,JSON.stringify(b)]); await this.notifications.create({teamId,type:'setup.assistance.submitted',category:'team',priority:'high',title:'New setup assistance request',message:`${b.assistanceType} — ${code}`,url:'/dashboard/ai-cortexa-setup/assistance',entityType:'setup_assistance',entityId:q.rows[0].id,metadata:{requestCode:code,assistanceType:b.assistanceType}}); return {duplicate:false,request:q.rows[0]}; }
}