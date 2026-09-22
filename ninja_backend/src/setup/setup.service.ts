import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { DatabaseService } from "../database/database.service";
import { NotificationsService } from "../notifications/notifications.service";
import { AiCenterService } from "../ai-center/ai-center.service";
import { LeadsService } from "../leads/leads.service";
import { PipelineService } from "../pipeline/pipeline.service";
@Injectable()
export class SetupService {
 constructor(
  private readonly db:DatabaseService,
  private readonly notifications:NotificationsService,
  private readonly aiCenter:AiCenterService,
  private readonly leads:LeadsService,
  private readonly pipeline:PipelineService,
){}
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
 private readiness(c:any){
   const cfg=c.config||{};
   const channels=cfg.customerChannels||[];
   const checks:any={
     trained:!!cfg.trainingComplete,
     website:!channels.includes('website')||!!(cfg.website?.url&&cfg.website?.ctaLabel&&cfg.website?.destination),
     phone:!channels.some((x:string)=>['phone','sms'].includes(x))||cfg.phone?.connectionStatus==='connected',
     whatsapp:!channels.includes('whatsapp')||cfg.whatsapp?.connected===true,
     consent:!!cfg.consent?.configured && cfg.consent?.captureSource===true,
     routing:!!(cfg.routing?.pipelineId&&cfg.routing?.stageId),
     handoff:!!cfg.handoff?.verified,
     conversionTest:Array.isArray(c.tests)&&c.tests.some((x:any)=>x.status==='pass')
   };
   return {...checks,ready:Object.values(checks).every(Boolean)};
 }
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
   let setup=await this.loadResolved(teamId,ws);

   // Existing AI Agent setup is the training source of truth.
   const aiSettings=await this.db.query(
     `SELECT business_profile_completed,appointment_rules_configured,
             behavior_configured,automations_configured,tested
        FROM ai_agent_settings WHERE team_id=$1 LIMIT 1`,
     [teamId]
   );
   const ai=aiSettings.rows[0];
   if(ai){
     const trainingComplete=Boolean(
       ai.business_profile_completed &&
       ai.appointment_rules_configured &&
       ai.behavior_configured &&
       ai.automations_configured &&
       ai.tested
     );
     if(setup.config?.trainingComplete!==trainingComplete){
       const merged={...(setup.config||{}),trainingComplete};
       await this.db.query(
         `UPDATE customer_setup_configs SET config=$3::jsonb,updated_at=now()
           WHERE team_id=$1 AND workspace_id=$2`,
         [teamId,ws,JSON.stringify(merged)]
       );
       setup=await this.loadResolved(teamId,ws);
     }
   }

   // Sync WhatsApp readiness from the real QR session instead of trusting a manual flag.
   const userId=this.userId(u);
   if(userId){
     const wa=await this.db.query(
       `SELECT phone,status,connected_at,updated_at
          FROM whatsapp_qr_sessions
         WHERE user_id=$1
         ORDER BY updated_at DESC
         LIMIT 1`,
       [userId]
     );
     const row=wa.rows[0];
     const current=setup.config?.whatsapp||{};
     const whatsapp={
       ...current,
       connected:row?.status==='connected',
       number:row?.status==='connected' ? (row?.phone||null) : null,
       status:row?.status||'disconnected',
       connectedAt:row?.connected_at||null
     };
     if(JSON.stringify(current)!==JSON.stringify(whatsapp)){
       const merged={...(setup.config||{}),whatsapp};
       await this.db.query(
         `UPDATE customer_setup_configs SET config=$3::jsonb,updated_at=now() WHERE team_id=$1 AND workspace_id=$2`,
         [teamId,ws,JSON.stringify(merged)]
       );
       setup=await this.loadResolved(teamId,ws);
     }
   }

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

 async runTest(u:any,requested:string|undefined,b:any){
   await this.ensure();
   const teamId=await this.resolveTeamId(u);
   const userId=this.userId(u);
   if(!userId) throw new ForbiddenException('Authenticated user is missing an id');
   const ws=await this.workspace(teamId,requested);
   const c=await this.loadResolved(teamId,ws);
   const cfg=c.config||{};

   const channel=String(b?.channel||'').trim().toLowerCase();
   const selectedKey=channel==='voice'?'phone':channel;
   const selected=cfg.customerChannels||[];
   if(!['website','voice','sms','whatsapp'].includes(channel))
     throw new BadRequestException('Select a supported test channel');
   if(!selected.includes(selectedKey))
     throw new BadRequestException('Selected test channel is not enabled in Customer Channels');

   const channelReady=
     channel==='website' ? !!(cfg.website?.url&&cfg.website?.ctaLabel&&cfg.website?.destination) :
     channel==='whatsapp' ? cfg.whatsapp?.connected===true :
     ['voice','sms'].includes(channel) ? cfg.phone?.connectionStatus==='connected' : false;
   if(!channelReady) throw new BadRequestException('Selected test channel is not connected yet');

   if(!(cfg.consent?.configured && cfg.consent?.captureSource===true))
     throw new BadRequestException('Configure consent and source tracking before testing');

   const pipelineId=String(cfg.routing?.pipelineId||'').trim();
   const stageId=String(cfg.routing?.stageId||'').trim().toLowerCase();
   if(!pipelineId||!stageId) throw new BadRequestException('Configure CRM pipeline and stage before testing');

   const validStages=['new','qualified','proposal','negotiation','won','lost'];
   if(!validStages.includes(stageId))
     throw new BadRequestException(`Stage must be one of: ${validStages.join(', ')}`);

   const name=String(b?.name||'').trim();
   const email=String(b?.email||'').trim()||undefined;
   const phone=String(b?.phone||'').trim()||undefined;
   const scenario=String(b?.scenario||'Product or service inquiry').trim();
   const entryPoint=String(b?.entryPoint||'').trim();
   if(!name) throw new BadRequestException('Test customer name is required');
   if(!entryPoint) throw new BadRequestException('Entry point is required');

   const source=entryPoint||channel;
   const testId=randomUUID();
   const evidence:any={
     contactReceived:false,aiResponded:false,crmRecordCreated:false,
     sourceRecorded:false,pipelineUpdated:false,handoffVerified:false,
     conversionVerified:false
   };
   let lead:any=null,contact:any=null,deal:any=null,ai:any=null;
   let errorDetails:string|null=null;

   try{
     const prompt=[
       'This is an end-to-end setup verification.',
       `Scenario: ${scenario}.`,
       `Entry point: ${entryPoint}.`,
       `Customer name: ${name}.`,
       'Respond to the customer as the configured Cortexa AI Agent.',
       'Keep the response concise and appropriate for the selected business objective.'
     ].join(' ');
     ai=await this.aiCenter.runAgentTest(teamId,userId,prompt);
     evidence.aiResponded=Boolean(ai?.success&&ai?.answer);

     lead=await this.leads.create({
       name,email,phone,source,
       notes:`Setup E2E test ${testId}: ${scenario}`
     } as any,userId,teamId);
     evidence.contactReceived=Boolean(lead?.id);
     evidence.sourceRecorded=lead?.source===source;

     const contactResult=await this.db.query(
       `INSERT INTO contacts(team_id,created_by,name,email,phone,lead_id,notes,created_at,updated_at)
        VALUES($1,$2,$3,$4,$5,$6,$7,NOW(),NOW())
        RETURNING id,name,email,phone,lead_id,created_at`,
       [teamId,userId,name,email||null,phone||null,lead.id,`Setup E2E test ${testId}`]
     );
     contact=contactResult.rows[0];
     evidence.crmRecordCreated=Boolean(contact?.id);

     deal=await this.pipeline.createDeal({
       name:`${name} — ${scenario}`,
       stage:stageId as any,
       leadId:lead.id,
       assignedTo:cfg.routing?.ownerId||userId,
       notes:`Setup E2E test ${testId}; source=${source}; pipeline=${pipelineId}`
     } as any,userId,teamId);
     evidence.pipelineUpdated=Boolean(deal?.id&&deal?.stage===stageId);

     const transferTarget=cfg.handoff?.target||cfg.phone?.humanTransferNumber||cfg.routing?.ownerId||null;
     const handoffMethod=cfg.handoff?.method||(cfg.phone?.humanTransferNumber?'phone':'crm_owner');
     evidence.handoffVerified=Boolean(transferTarget);

     if(evidence.handoffVerified&&!cfg.handoff?.verified){
       const merged={...cfg,handoff:{...(cfg.handoff||{}),verified:true,target:transferTarget,
         method:handoffMethod,verifiedAt:new Date().toISOString(),verifiedBy:userId}};
       await this.db.query(
         `UPDATE customer_setup_configs SET config=$3::jsonb,updated_at=now()
           WHERE team_id=$1 AND workspace_id=$2`,
         [teamId,ws,JSON.stringify(merged)]
       );
     }

     evidence.conversionVerified=Boolean(
       (cfg.conversion?.objective||c.selected_objective) &&
       cfg.conversion?.desiredAction &&
       evidence.aiResponded&&evidence.crmRecordCreated&&evidence.pipelineUpdated
     );
   }catch(err:any){
     errorDetails=err?.message||'End-to-end test failed';
   }

   const pass=Object.values(evidence).every(Boolean)&&!errorDetails;
   const messages=[
     {role:'customer',text:`${name}: ${scenario}`,timestamp:new Date().toISOString()},
     ...(ai?.answer?[{role:'ai',text:String(ai.answer),timestamp:new Date().toISOString()}]:[])
   ];
   const result={
     id:testId,workspaceId:ws,aiAgentId:c.ai_agent_id||null,channel,scenario,entryPoint,
     timestamp:new Date().toISOString(),customerName:name,
     leadId:lead?.id||null,contactId:contact?.id||null,dealId:deal?.id||null,
     source:lead?.source||source,pipelineId,pipeline:pipelineId,
     stageId:deal?.stage||stageId,stage:deal?.stage||stageId,
     owner:deal?.assignedTo||cfg.routing?.ownerId||userId,
     interest:cfg.conversion?.objective||c.selected_objective||scenario,
     conversionResult:evidence.conversionVerified?'verified':'not_verified',
     handoffResult:evidence.handoffVerified?'verified':'not_verified',
     handoffTarget:cfg.handoff?.target||cfg.phone?.humanTransferNumber||cfg.routing?.ownerId||null,
     handoffMethod:cfg.handoff?.method||(cfg.phone?.humanTransferNumber?'phone':'crm_owner'),
     evidence,messages,status:pass?'pass':'fail',
     errorDetails:errorDetails||(pass?null:'One or more end-to-end checks did not pass.')
   };

   const fresh=await this.loadResolved(teamId,ws);
   const tests=[...(fresh.tests||[]),result].slice(-50);
   await this.db.query(
     `UPDATE customer_setup_configs SET tests=$3::jsonb,updated_at=now()
       WHERE team_id=$1 AND workspace_id=$2`,
     [teamId,ws,JSON.stringify(tests)]
   );
   return {result,setup:await this.loadResolved(teamId,ws)};
 }
 async activate(u:any,requested?:string){ const teamId=await this.resolveTeamId(u); const ws=await this.workspace(teamId,requested); const c=await this.loadResolved(teamId,ws); if(!c.readiness.ready) throw new BadRequestException('Complete all required launch-readiness checks before activation.'); await this.db.query(`UPDATE customer_setup_configs SET status='active',activated_at=now(),activated_by=$3,updated_at=now() WHERE team_id=$1 AND workspace_id=$2`,[teamId,ws,this.userId(u)]); return this.loadResolved(teamId,ws); }
 async assistance(u:any,requested:string|undefined,b:any){ const teamId=await this.resolveTeamId(u); const ws=await this.workspace(teamId,requested); if(!['AI Agent Setup Assistance','Website & Connection Assistance'].includes(b.assistanceType)) throw new BadRequestException('Select an assistance type'); if(!b.businessName||!b.contactName||!b.contactEmail) throw new BadRequestException('Business name, contact name and email are required'); const duplicate=await this.db.query(`SELECT * FROM setup_assistance_requests WHERE team_id=$1 AND workspace_id=$2 AND status IN ('Submitted','Reviewing','Quote Sent','Approved','In Progress') ORDER BY created_at DESC LIMIT 1`,[teamId,ws]); if(duplicate.rows[0]) return {duplicate:true,request:duplicate.rows[0]}; const c=await this.loadResolved(teamId,ws); const code='SET-'+Date.now().toString(36).toUpperCase(); const q=await this.db.query(`INSERT INTO setup_assistance_requests(request_code,team_id,workspace_id,ai_agent_id,requested_by,assistance_type,payload) VALUES($1,$2,$3,$4,$5,$6,$7::jsonb) RETURNING *`,[code,teamId,ws,c.ai_agent_id||null,this.userId(u),b.assistanceType,JSON.stringify(b)]); await this.notifications.create({teamId,type:'setup.assistance.submitted',category:'team',priority:'high',title:'New setup assistance request',message:`${b.assistanceType} — ${code}`,url:'/dashboard/ai-cortexa-setup/assistance',entityType:'setup_assistance',entityId:q.rows[0].id,metadata:{requestCode:code,assistanceType:b.assistanceType}}); return {duplicate:false,request:q.rows[0]}; }
}
