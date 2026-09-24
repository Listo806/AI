import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { encrypt, decrypt } from '../common/encryption.util';
import twilio from 'twilio';

@Injectable()
export class CustomerTwilioService {
  private readonly logger = new Logger(CustomerTwilioService.name);
  constructor(private readonly db: DatabaseService) {}

  private userId(u:any){ return u?.id || u?.userId || u?.sub || null; }
  async context(u:any, requested?:string){
    const userId=this.userId(u); if(!userId) throw new ForbiddenException('Authenticated user is missing an id');
    let teamId=u?.teamId || u?.team_id || u?.team?.id || null;
    if(!teamId){ const r=await this.db.query('SELECT team_id FROM users WHERE id=$1 LIMIT 1',[userId]); teamId=r.rows[0]?.team_id||null; }
    if(!teamId){ const r=await this.db.query(`SELECT team_id FROM team_members WHERE user_id=$1 AND status='active' ORDER BY created_at LIMIT 1`,[userId]); teamId=r.rows[0]?.team_id||null; }
    if(!teamId) throw new ForbiddenException('No team access');
    const workspaceId=String(requested||'default').trim()||'default';
    if(workspaceId!=='default'){
      const r=await this.db.query(`SELECT 1 FROM workspace_entitlements WHERE team_id=$1 AND workspace_id=$2 AND status='active' LIMIT 1`,[teamId,workspaceId]);
      if(!r.rows.length) throw new ForbiddenException('Workspace access denied');
    }
    return {userId,teamId,workspaceId};
  }

  private apiClient(row:any){
    return (twilio as any)(row.api_key_sid, decrypt(row.encrypted_api_key_secret), {accountSid: row.account_sid});
  }
  private async connection(teamId:string, workspaceId:string){
    const r=await this.db.query(`SELECT * FROM customer_twilio_connections WHERE team_id=$1 AND workspace_id=$2 AND status='connected' LIMIT 1`,[teamId,workspaceId]);
    return r.rows[0]||null;
  }
  private publicBase(){
    const base=String(process.env.PUBLIC_API_URL || process.env.BACKEND_URL || '').replace(/\/$/,'');
    if(!/^https:\/\//i.test(base)) throw new BadRequestException('PUBLIC_API_URL must be configured with the public HTTPS backend URL');
    return base;
  }

  async connect(u:any, ws:string|undefined, body:any){
    const {userId,teamId,workspaceId}=await this.context(u,ws);
    const accountSid=String(body?.accountSid||'').trim();
    const apiKeySid=String(body?.apiKeySid||'').trim();
    const apiKeySecret=String(body?.apiKeySecret||'');
    const authToken=String(body?.authToken||'');
    if(!/^AC[a-fA-F0-9]{32}$/.test(accountSid)) throw new BadRequestException('Invalid Twilio Account SID');
    if(!/^SK[a-fA-F0-9]{32}$/.test(apiKeySid)) throw new BadRequestException('Invalid Twilio API Key SID');
    if(!apiKeySecret || !authToken) throw new BadRequestException('Twilio API Key Secret and Auth Token are required');
    const client=(twilio as any)(apiKeySid,apiKeySecret,{accountSid});
    try { await client.api.accounts(accountSid).fetch(); }
    catch(e:any){ this.logger.warn(`Customer Twilio verification failed team=${teamId} workspace=${workspaceId}: ${e?.code||'Twilio error'}`); throw new BadRequestException('Twilio credentials could not be verified'); }
    await this.db.query(`INSERT INTO customer_twilio_connections(team_id,workspace_id,account_sid,api_key_sid,encrypted_api_key_secret,encrypted_auth_token,status,verified_at,created_by,updated_at)
      VALUES($1,$2,$3,$4,$5,$6,'connected',NOW(),$7,NOW())
      ON CONFLICT(team_id,workspace_id) DO UPDATE SET account_sid=EXCLUDED.account_sid,api_key_sid=EXCLUDED.api_key_sid,encrypted_api_key_secret=EXCLUDED.encrypted_api_key_secret,encrypted_auth_token=EXCLUDED.encrypted_auth_token,status='connected',verified_at=NOW(),created_by=EXCLUDED.created_by,updated_at=NOW()`,
      [teamId,workspaceId,accountSid,apiKeySid,encrypt(apiKeySecret),encrypt(authToken),userId]);
    await this.syncNumbersResolved(teamId,workspaceId);
    return this.status(u,ws);
  }

  async disconnect(u:any,ws?:string){ const {teamId,workspaceId}=await this.context(u,ws); await this.db.query(`UPDATE customer_twilio_connections SET status='disconnected',updated_at=NOW() WHERE team_id=$1 AND workspace_id=$2`,[teamId,workspaceId]); await this.db.query(`UPDATE customer_twilio_numbers SET selected=FALSE WHERE team_id=$1 AND workspace_id=$2`,[teamId,workspaceId]); return {connected:false,provider:'twilio'}; }

  async status(u:any,ws?:string){
    const {teamId,workspaceId}=await this.context(u,ws); const c=await this.connection(teamId,workspaceId);
    if(!c) return {connected:false,provider:'twilio',workspaceId};
    const n=await this.db.query(`SELECT number_sid,phone_number,friendly_name,voice_capable,sms_capable,mms_capable FROM customer_twilio_numbers WHERE team_id=$1 AND workspace_id=$2 AND selected=TRUE LIMIT 1`,[teamId,workspaceId]);
    return {connected:true,provider:'twilio',workspaceId,verifiedAt:c.verified_at,accountSidMasked:`${c.account_sid.slice(0,6)}…${c.account_sid.slice(-4)}`,selectedNumber:n.rows[0]||null};
  }

  async syncNumbers(u:any,ws?:string){ const {teamId,workspaceId}=await this.context(u,ws); return this.syncNumbersResolved(teamId,workspaceId); }
  private async syncNumbersResolved(teamId:string,workspaceId:string){
    const c=await this.connection(teamId,workspaceId); if(!c) throw new BadRequestException('Connect your Twilio account first');
    const client=this.apiClient(c); let list:any[]=[]; try{ list=await client.incomingPhoneNumbers.list({limit:1000}); } catch { throw new BadRequestException('Unable to load phone numbers from Twilio'); }
    for(const n of list){ const caps=n.capabilities||{}; await this.db.query(`INSERT INTO customer_twilio_numbers(team_id,workspace_id,connection_id,number_sid,phone_number,friendly_name,voice_capable,sms_capable,mms_capable,synced_at)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW()) ON CONFLICT(team_id,workspace_id,number_sid) DO UPDATE SET phone_number=EXCLUDED.phone_number,friendly_name=EXCLUDED.friendly_name,voice_capable=EXCLUDED.voice_capable,sms_capable=EXCLUDED.sms_capable,mms_capable=EXCLUDED.mms_capable,synced_at=NOW()`,
      [teamId,workspaceId,c.id,n.sid,n.phoneNumber,n.friendlyName||null,!!caps.voice,!!caps.sms,!!caps.mms]); }
    const ids=list.map(x=>x.sid); if(ids.length) await this.db.query(`DELETE FROM customer_twilio_numbers WHERE team_id=$1 AND workspace_id=$2 AND number_sid <> ALL($3::text[])`,[teamId,workspaceId,ids]); else await this.db.query(`DELETE FROM customer_twilio_numbers WHERE team_id=$1 AND workspace_id=$2`,[teamId,workspaceId]);
    return this.listNumbersResolved(teamId,workspaceId);
  }
  async numbers(u:any,ws?:string){ const {teamId,workspaceId}=await this.context(u,ws); return this.listNumbersResolved(teamId,workspaceId); }
  private async listNumbersResolved(teamId:string,workspaceId:string){ const r=await this.db.query(`SELECT number_sid AS "numberSid",phone_number AS "phoneNumber",friendly_name AS "friendlyName",voice_capable AS "voice",sms_capable AS "sms",mms_capable AS "mms",selected FROM customer_twilio_numbers WHERE team_id=$1 AND workspace_id=$2 ORDER BY selected DESC,phone_number`,[teamId,workspaceId]); return r.rows; }

  async selectNumber(u:any,ws:string|undefined,body:any){
    const {teamId,workspaceId}=await this.context(u,ws); const sid=String(body?.numberSid||'').trim(); if(!sid) throw new BadRequestException('numberSid is required');
    const c=await this.connection(teamId,workspaceId); if(!c) throw new BadRequestException('Connect your Twilio account first');
    const r=await this.db.query(`SELECT * FROM customer_twilio_numbers WHERE team_id=$1 AND workspace_id=$2 AND number_sid=$3 LIMIT 1`,[teamId,workspaceId,sid]); if(!r.rows[0]) throw new NotFoundException('Phone number does not belong to this connected Twilio account');
    const n=r.rows[0], client=this.apiClient(c), base=this.publicBase();
    try{ await client.incomingPhoneNumbers(sid).update({voiceUrl:`${base}/customer-twilio/webhooks/voice`,voiceMethod:'POST',smsUrl:`${base}/customer-twilio/webhooks/sms`,smsMethod:'POST'}); } catch { throw new BadRequestException('Twilio could not configure this number for Cortexa webhooks'); }
    await this.db.transaction(async tx=>{ await tx.query(`UPDATE customer_twilio_numbers SET selected=FALSE WHERE team_id=$1 AND workspace_id=$2`,[teamId,workspaceId]); await tx.query(`UPDATE customer_twilio_numbers SET selected=TRUE WHERE team_id=$1 AND workspace_id=$2 AND number_sid=$3`,[teamId,workspaceId,sid]); });
    await this.mergeSetupPhone(teamId,workspaceId,{number:n.phone_number,provider:'twilio',providerReference:sid,connectionStatus:'connected',providerVerified:true,providerCapabilities:{voice:!!n.voice_capable,sms:!!n.sms_capable,callerId:true}});
    return this.status(u,ws);
  }

  private async mergeSetupPhone(teamId:string,workspaceId:string,phonePatch:any){
    await this.db.query(`INSERT INTO customer_setup_configs(team_id,workspace_id,config) VALUES($1,$2,'{}'::jsonb) ON CONFLICT(team_id,workspace_id) DO NOTHING`,[teamId,workspaceId]);
    const r=await this.db.query(`SELECT config FROM customer_setup_configs WHERE team_id=$1 AND workspace_id=$2 LIMIT 1`,[teamId,workspaceId]); const cfg=r.rows[0]?.config||{}; const phone={...(cfg.phone||{}),...phonePatch};
    await this.db.query(`UPDATE customer_setup_configs SET config=$3::jsonb,updated_at=NOW() WHERE team_id=$1 AND workspace_id=$2`,[teamId,workspaceId,JSON.stringify({...cfg,phone})]);
  }

  async startTest(u:any,ws:string|undefined,body:any){
    const {userId,teamId,workspaceId}=await this.context(u,ws); const to=String(body?.toNumber||'').trim(); if(!/^\+[1-9]\d{7,14}$/.test(to)) throw new BadRequestException('Test destination must be E.164');
    const c=await this.connection(teamId,workspaceId); if(!c) throw new BadRequestException('Connect your Twilio account first');
    const nr=await this.db.query(`SELECT * FROM customer_twilio_numbers WHERE team_id=$1 AND workspace_id=$2 AND selected=TRUE LIMIT 1`,[teamId,workspaceId]); const n=nr.rows[0]; if(!n||!n.voice_capable) throw new BadRequestException('Select a Voice-capable Twilio number first');
    const tr=await this.db.query(`INSERT INTO customer_twilio_call_tests(team_id,workspace_id,number_sid,from_number,to_number,status,created_by) VALUES($1,$2,$3,$4,$5,'queued',$6) RETURNING id`,[teamId,workspaceId,n.number_sid,n.phone_number,to,userId]); const testId=tr.rows[0].id; const base=this.publicBase(), client=this.apiClient(c);
    try{ const call=await client.calls.create({from:n.phone_number,to,url:`${base}/customer-twilio/webhooks/test-answer?test_id=${encodeURIComponent(testId)}`,method:'POST',statusCallback:`${base}/customer-twilio/webhooks/call-status?test_id=${encodeURIComponent(testId)}`,statusCallbackMethod:'POST',statusCallbackEvent:['initiated','ringing','answered','completed']}); await this.db.query(`UPDATE customer_twilio_call_tests SET call_sid=$2,provider_status=$3,updated_at=NOW() WHERE id=$1`,[testId,call.sid,call.status||'queued']); return {testId,status:'queued'}; }
    catch(e:any){ await this.db.query(`UPDATE customer_twilio_call_tests SET status='failed',error_code=$2,error_message=$3,updated_at=NOW() WHERE id=$1`,[testId,String(e?.code||''),String(e?.message||'Twilio call failed').slice(0,500)]); throw new BadRequestException('Twilio could not start the test call'); }
  }
  async testStatus(u:any,ws:string|undefined,id:string){ const {teamId,workspaceId}=await this.context(u,ws); const r=await this.db.query(`SELECT id,call_sid AS "callSid",status,provider_status AS "providerStatus",callback_verified AS "callbackVerified",error_code AS "errorCode",error_message AS "errorMessage",created_at AS "createdAt",completed_at AS "completedAt" FROM customer_twilio_call_tests WHERE id=$1 AND team_id=$2 AND workspace_id=$3 LIMIT 1`,[id,teamId,workspaceId]); if(!r.rows[0]) throw new NotFoundException('Test not found'); return r.rows[0]; }

  private async webhookConnection(accountSid:string,to:string){ const r=await this.db.query(`SELECT c.*,n.phone_number,n.number_sid,n.voice_capable,n.sms_capable FROM customer_twilio_connections c JOIN customer_twilio_numbers n ON n.connection_id=c.id AND n.selected=TRUE WHERE c.account_sid=$1 AND n.phone_number=$2 AND c.status='connected' LIMIT 1`,[accountSid,to]); return r.rows[0]||null; }
  private validate(row:any,signature:string,url:string,params:any){ if(!signature) return false; try{return (twilio as any).validateRequest(decrypt(row.encrypted_auth_token),signature,url,params||{});}catch{return false;} }
  async voiceWebhook(signature:string,url:string,b:any){ const row=await this.webhookConnection(String(b?.AccountSid||''),String(b?.To||'')); if(!row||!this.validate(row,signature,url,b)) throw new ForbiddenException('Invalid Twilio signature'); const response=new (twilio as any).twiml.VoiceResponse(); const cfg=await this.setupPhone(row.team_id,row.workspace_id); const greeting=String(cfg?.greeting||'Hello. You have reached our AI assistant. How can I help you today?'); const gather=response.gather({input:'speech',action:`${this.publicBase()}/customer-twilio/webhooks/voice-intent`,method:'POST',speechTimeout:'auto',language:this.twilioLanguage(cfg?.language)}); gather.say({voice:'alice'},greeting); response.say({voice:'alice'},'We did not receive a response. Please call again.'); return response.toString(); }
  async voiceIntentWebhook(signature:string,url:string,b:any){ const row=await this.webhookConnection(String(b?.AccountSid||''),String(b?.To||'')); if(!row||!this.validate(row,signature,url,b)) throw new ForbiddenException('Invalid Twilio signature'); await this.upsertInboundCrm(row,String(b?.From||''),'voice',String(b?.SpeechResult||'')); const response=new (twilio as any).twiml.VoiceResponse(); response.say({voice:'alice'},'Thank you. Your request has been captured. A team member can follow up if needed.'); return response.toString(); }
  async smsWebhook(signature:string,url:string,b:any){ const row=await this.webhookConnection(String(b?.AccountSid||''),String(b?.To||'')); if(!row||!this.validate(row,signature,url,b)) throw new ForbiddenException('Invalid Twilio signature'); await this.upsertInboundCrm(row,String(b?.From||''),'sms',String(b?.Body||'')); const response=new (twilio as any).twiml.MessagingResponse(); response.message('Thanks for your message. Cortexa has received it and updated the CRM.'); return response.toString(); }
  async testAnswerWebhook(signature:string,url:string,b:any,testId:string){ const r=await this.db.query(`SELECT t.*,c.encrypted_auth_token,c.account_sid FROM customer_twilio_call_tests t JOIN customer_twilio_connections c ON c.team_id=t.team_id AND c.workspace_id=t.workspace_id WHERE t.id=$1 LIMIT 1`,[testId]); const row=r.rows[0]; if(!row||String(b?.AccountSid||'')!==row.account_sid||!this.validate(row,signature,url,b)) throw new ForbiddenException('Invalid Twilio signature'); const response=new (twilio as any).twiml.VoiceResponse(); response.say({voice:'alice'},'This is a Cortexa test call. Your customer owned Twilio voice connection is working.'); return response.toString(); }
  async callStatusWebhook(signature:string,url:string,b:any,testId:string){ const r=await this.db.query(`SELECT t.*,c.encrypted_auth_token,c.account_sid FROM customer_twilio_call_tests t JOIN customer_twilio_connections c ON c.team_id=t.team_id AND c.workspace_id=t.workspace_id WHERE t.id=$1 LIMIT 1`,[testId]); const row=r.rows[0]; if(!row||String(b?.AccountSid||'')!==row.account_sid||!this.validate(row,signature,url,b)) throw new ForbiddenException('Invalid Twilio signature'); const s=String(b?.CallStatus||''); const passed=s==='completed'; const failed=['busy','failed','no-answer','canceled'].includes(s); await this.db.query(`UPDATE customer_twilio_call_tests SET provider_status=$2,callback_verified=TRUE,status=CASE WHEN $3 THEN 'passed' WHEN $4 THEN 'failed' ELSE 'running' END,error_code=COALESCE($5,error_code),completed_at=CASE WHEN $3 OR $4 THEN NOW() ELSE completed_at END,updated_at=NOW() WHERE id=$1`,[testId,s,passed,failed,b?.ErrorCode?String(b.ErrorCode):null]); if(passed) await this.mergeSetupPhone(row.team_id,row.workspace_id,{testStatus:'connected',lastTestId:testId,lastTestAt:new Date().toISOString()}); return {ok:true}; }

  private async setupPhone(teamId:string,workspaceId:string){ const r=await this.db.query(`SELECT config->'phone' AS phone FROM customer_setup_configs WHERE team_id=$1 AND workspace_id=$2 LIMIT 1`,[teamId,workspaceId]); return r.rows[0]?.phone||{}; }
  private twilioLanguage(v:any){ const s=String(v||'').toLowerCase(); if(s.includes('span')) return 'es-US'; if(s.includes('port')) return 'pt-BR'; return 'en-US'; }
  private async upsertInboundCrm(row:any,from:string,channel:string,body:string){
    if(!from) return; let c=await this.db.query(`SELECT id FROM contacts WHERE team_id=$1 AND phone=$2 ORDER BY updated_at DESC LIMIT 1`,[row.team_id,from]); let contactId=c.rows[0]?.id;
    if(!contactId){ const owner=await this.db.query(`SELECT id FROM users WHERE team_id=$1 ORDER BY created_at LIMIT 1`,[row.team_id]); const uid=owner.rows[0]?.id||null; const cr=await this.db.query(`INSERT INTO contacts(team_id,created_by,name,phone,notes) VALUES($1,$2,$3,$4,$5) RETURNING id`,[row.team_id,uid,`Twilio ${from}`,from,`Inbound ${channel} via customer-owned Twilio`]); contactId=cr.rows[0].id; }
    await this.db.query(`INSERT INTO contact_activities(contact_id,user_id,team_id,type,title,sub,created_at) VALUES($1,NULL,$2,$3,$4,$5,NOW())`,[contactId,row.team_id,channel==='sms'?'message':'call',channel==='sms'?'Inbound SMS':'Inbound call',String(body||'').slice(0,1000)]).catch(()=>{});
  }
}
