import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DatabaseService } from "../database/database.service";

const WS = "aesthetic-wellness";
const EDIT_ROLES = new Set(["owner","admin","super_admin","developer","provider","receptionist"]);
const ARCHIVE_ROLES = new Set(["owner","admin","super_admin","developer"]);
const CREATE_ROLES = new Set(["owner","admin","super_admin","developer","provider","receptionist"]);

@Injectable()
export class AestheticClientsService {
  private schemaReady: Promise<void> | null = null;
  constructor(private readonly db: DatabaseService) {}

  private teamId(user:any) {
    const id=user?.teamId||user?.team_id;
    if(!id) throw new ForbiddenException("A clinic workspace is required.");
    return id;
  }
  private role(user:any){return String(user?.role||"restricted").toLowerCase();}
  private permissions(user:any){const r=this.role(user);return {canView:true,canCreate:CREATE_ROLES.has(r),canEdit:EDIT_ROLES.has(r),canArchive:ARCHIVE_ROLES.has(r),canViewSensitive:EDIT_ROLES.has(r)||r==="restricted"}}
  private require(user:any,action:"create"|"edit"|"archive"){
    const p=this.permissions(user);
    if(action==="create"&&!p.canCreate) throw new ForbiddenException("You do not have permission to add clients.");
    if(action==="edit"&&!p.canEdit) throw new ForbiddenException("You do not have permission to edit clients.");
    if(action==="archive"&&!p.canArchive) throw new ForbiddenException("You do not have permission to archive clients.");
  }
  private ensureSchema(){
    if(this.schemaReady)return this.schemaReady;
    this.schemaReady=(async()=>{
      await this.db.query(`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS workspace_id varchar(64)`);
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS aesthetic_client_profiles(
          contact_id uuid PRIMARY KEY,
          team_id uuid NOT NULL,
          workspace_id varchar(64) NOT NULL DEFAULT '${WS}',
          date_of_birth date,
          preferred_contact varchar(32),
          referral_source varchar(160),
          provider_id uuid REFERENCES aesthetic_providers(id) ON DELETE SET NULL,
          treatment_interest text,
          preferences jsonb NOT NULL DEFAULT '[]'::jsonb,
          alerts jsonb NOT NULL DEFAULT '[]'::jsonb,
          internal_notes text,
          follow_up_required boolean NOT NULL DEFAULT false,
          archived_at timestamptz,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        )`);
      await this.db.query(`CREATE INDEX IF NOT EXISTS idx_aw_client_profiles_team ON aesthetic_client_profiles(team_id,workspace_id,archived_at)`);
      await this.db.query(`
        CREATE TABLE IF NOT EXISTS aesthetic_client_audit(
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          team_id uuid NOT NULL,
          workspace_id varchar(64) NOT NULL DEFAULT '${WS}',
          contact_id uuid NOT NULL,
          user_id uuid,
          action varchar(80) NOT NULL,
          details jsonb NOT NULL DEFAULT '{}'::jsonb,
          created_at timestamptz NOT NULL DEFAULT now()
        )`);
      await this.db.query(`CREATE INDEX IF NOT EXISTS idx_aw_client_audit_contact ON aesthetic_client_audit(team_id,contact_id,created_at DESC)`);
    })().catch(e=>{this.schemaReady=null;throw e});
    return this.schemaReady;
  }
  private async audit(user:any,contactId:string,action:string,details:any={}){
    await this.ensureSchema();
    await this.db.query(`INSERT INTO aesthetic_client_audit(team_id,contact_id,user_id,action,details) VALUES($1,$2,$3,$4,$5::jsonb)`,
      [this.teamId(user),contactId,user?.id||null,action,JSON.stringify(details||{})]);
  }
  private async assertClient(user:any,id:string){
    await this.ensureSchema(); const team=this.teamId(user);
    const {rows}=await this.db.query(`SELECT c.id FROM contacts c WHERE c.id=$1 AND c.team_id=$2 AND c.workspace_id=$3 LIMIT 1`,[id,team,WS]);
    if(!rows.length)throw new NotFoundException("Client not found.");
    return team;
  }
  private arrays(v:any){if(Array.isArray(v))return v.filter(Boolean);return String(v||"").split(",").map(x=>x.trim()).filter(Boolean)}

  async stats(user:any){
    await this.ensureSchema();const team=this.teamId(user);
    const [a,b,c,d,p]=await Promise.all([
      this.db.query(`SELECT count(*)::int n FROM contacts c LEFT JOIN aesthetic_client_profiles cp ON cp.contact_id=c.id WHERE c.team_id=$1 AND c.workspace_id=$2 AND cp.archived_at IS NULL`,[team,WS]),
      this.db.query(`SELECT count(*)::int n FROM appointments WHERE team_id=$1 AND workspace_id=$2 AND start_at>=CURRENT_DATE AND start_at<CURRENT_DATE+interval '1 day' AND status<>'canceled'`,[team,WS]),
      this.db.query(`SELECT count(DISTINCT r.contact_id)::int n FROM aesthetic_treatment_records r JOIN contacts c ON c.id=r.contact_id AND c.team_id=r.team_id LEFT JOIN aesthetic_client_profiles cp ON cp.contact_id=c.id WHERE r.team_id=$1 AND r.workspace_id=$2 AND r.next_rebook_at<=now()+interval '30 days' AND r.next_rebook_at IS NOT NULL AND cp.archived_at IS NULL`,[team,WS]),
      this.db.query(`SELECT count(*)::int n FROM aesthetic_client_profiles WHERE team_id=$1 AND workspace_id=$2 AND follow_up_required=true AND archived_at IS NULL`,[team,WS]),
      this.db.query(`SELECT id,name FROM aesthetic_providers WHERE team_id=$1 AND workspace_id=$2 AND is_active=true ORDER BY name`,[team,WS]),
    ]);
    return {totalClients:a.rows[0]?.n||0,appointmentsToday:b.rows[0]?.n||0,readyToRebook:c.rows[0]?.n||0,followUpRequired:d.rows[0]?.n||0,providers:p.rows};
  }

  async list(user:any,q:any){
    await this.ensureSchema();const team=this.teamId(user);
    const page=Math.max(1,Number(q.page)||1),limit=Math.min(100,Math.max(1,Number(q.limit)||20)),off=(page-1)*limit;
    const where=[`c.team_id=$1`,`c.workspace_id=$2`];const v:any[]=[team,WS];let n=3;
    if(q.search){where.push(`(c.name ILIKE $${n} OR c.email ILIKE $${n} OR c.phone ILIKE $${n})`);v.push(`%${String(q.search).trim()}%`);n++}
    if(q.status==="inactive")where.push(`cp.archived_at IS NOT NULL`);
    else {where.push(`cp.archived_at IS NULL`);if(q.status==="follow_up")where.push(`cp.follow_up_required=true`);if(q.status==="ready_to_rebook")where.push(`lr.next_rebook_at IS NOT NULL AND lr.next_rebook_at<=now()+interval '30 days'`)}
    const sortMap:any={"name:asc":"c.name ASC","name:desc":"c.name DESC","spent:desc":"total_spent DESC","next:asc":"next_appointment ASC NULLS LAST","updated:desc":"c.updated_at DESC"};
    const order=sortMap[q.sort]||"c.name ASC";
    const from=`
      FROM contacts c
      LEFT JOIN aesthetic_client_profiles cp ON cp.contact_id=c.id AND cp.team_id=c.team_id
      LEFT JOIN aesthetic_providers p ON p.id=cp.provider_id AND p.team_id=c.team_id
      LEFT JOIN LATERAL (SELECT max(r.completed_at) last_appointment,coalesce(sum(r.revenue) FILTER(WHERE r.status='completed'),0) total_spent,max(r.next_rebook_at) next_rebook_at FROM aesthetic_treatment_records r WHERE r.team_id=c.team_id AND r.workspace_id=$2 AND r.contact_id=c.id) lr ON true
      LEFT JOIN LATERAL (SELECT a.start_at next_appointment FROM appointments a WHERE a.team_id=c.team_id AND a.workspace_id=$2 AND a.contact_id=c.id AND a.start_at>=now() AND a.status<>'canceled' ORDER BY a.start_at LIMIT 1) na ON true`;
    const count=await this.db.query(`SELECT count(*)::int total ${from} WHERE ${where.join(" AND ")}`,v);
    v.push(limit,off);const lp=n,op=n+1;
    const {rows}=await this.db.query(`SELECT c.id,c.name,c.email,c.phone,c.status,c.created_at "createdAt",c.updated_at "updatedAt",
      coalesce(cp.treatment_interest,c.interest) "treatmentInterest",cp.provider_id "providerId",p.name "providerName",
      lr.last_appointment "lastAppointment",na.next_appointment "nextAppointment",lr.next_rebook_at "nextRebookAt",
      (lr.next_rebook_at IS NOT NULL AND lr.next_rebook_at<=now()+interval '30 days') "rebookingDue",
      lr.total_spent "totalSpent",cp.follow_up_required "followUpRequired",cp.archived_at "archivedAt",
      CASE WHEN cp.archived_at IS NOT NULL THEN 'inactive' WHEN cp.follow_up_required THEN 'follow_up'
           WHEN lr.next_rebook_at IS NOT NULL AND lr.next_rebook_at<=now()+interval '30 days' THEN 'ready_to_rebook' ELSE 'active' END "clientStatus"
      ${from} WHERE ${where.join(" AND ")} ORDER BY ${order} LIMIT $${lp} OFFSET $${op}`,v);
    return {items:rows.map((x:any)=>({...x,clientStatusLabel:x.clientStatus==="ready_to_rebook"?"Ready to Rebook":x.clientStatus==="follow_up"?"Follow-Up":x.clientStatus==="inactive"?"Inactive":"Active"})),page,limit,total:count.rows[0]?.total||0,pages:Math.max(1,Math.ceil((count.rows[0]?.total||0)/limit))};
  }

  async get(user:any,id:string){
    const team=await this.assertClient(user,id);
    const {rows}=await this.db.query(`SELECT c.id,c.name,c.email,c.phone,c.status,c.notes,c.created_at "createdAt",
      cp.date_of_birth "dateOfBirth",cp.preferred_contact "preferredContact",cp.referral_source "referralSource",
      cp.provider_id "providerId",p.name "providerName",coalesce(cp.treatment_interest,c.interest) "treatmentInterest",
      cp.preferences,cp.alerts,cp.internal_notes "internalNotes",cp.follow_up_required "followUpRequired",cp.archived_at "archivedAt"
      FROM contacts c LEFT JOIN aesthetic_client_profiles cp ON cp.contact_id=c.id
      LEFT JOIN aesthetic_providers p ON p.id=cp.provider_id
      WHERE c.id=$1 AND c.team_id=$2 AND c.workspace_id=$3`,[id,team,WS]);
    const client=rows[0];
    const [ap,tr,act,providers]=await Promise.all([
      this.db.query(`SELECT a.id,a.title,a.type,a.start_at "startAt",a.status,
        coalesce(p.name,u.name,'Unassigned') "providerName",t.name "treatmentName"
        FROM appointments a LEFT JOIN aesthetic_providers p ON p.id=a.aesthetic_provider_id LEFT JOIN users u ON u.id=a.assigned_to
        LEFT JOIN aesthetic_treatments t ON t.id=a.aesthetic_treatment_id
        WHERE a.team_id=$1 AND a.workspace_id=$2 AND a.contact_id=$3 ORDER BY a.start_at DESC LIMIT 100`,[team,WS,id]),
      this.db.query(`SELECT r.id,r.revenue,r.status,r.completed_at "completedAt",r.next_rebook_at "nextRebookAt",
        t.name "treatmentName",p.name "providerName",r.notes
        FROM aesthetic_treatment_records r LEFT JOIN aesthetic_treatments t ON t.id=r.treatment_id LEFT JOIN aesthetic_providers p ON p.id=r.provider_id
        WHERE r.team_id=$1 AND r.workspace_id=$2 AND r.contact_id=$3 ORDER BY coalesce(r.completed_at,r.created_at) DESC LIMIT 100`,[team,WS,id]),
      this.db.query(`SELECT x.id,x.action,x.details,x.created_at "createdAt",u.name "actorName" FROM aesthetic_client_audit x LEFT JOIN users u ON u.id=x.user_id WHERE x.team_id=$1 AND x.contact_id=$2
        UNION ALL SELECT ca.id,ca.type action,jsonb_build_object('title',ca.title,'sub',ca.sub) details,ca.created_at "createdAt",u.name "actorName" FROM contact_activities ca LEFT JOIN users u ON u.id=ca.user_id WHERE ca.team_id=$1 AND ca.contact_id=$2 ORDER BY "createdAt" DESC LIMIT 100`,[team,id]),
      this.db.query(`SELECT id,name FROM aesthetic_providers WHERE team_id=$1 AND workspace_id=$2 AND is_active=true ORDER BY name`,[team,WS])
    ]);
    await this.audit(user,id,"profile_view",{});
    const totalSpent=tr.rows.filter((x:any)=>x.status==="completed").reduce((s:number,x:any)=>s+Number(x.revenue||0),0);
    const rebook=tr.rows.find((x:any)=>x.nextRebookAt);
    return {client:{...client,status:client.archivedAt?"inactive":"active",statusLabel:client.archivedAt?"Inactive":"Active"},summary:{totalSpent,appointmentCount:ap.rows.length,rebookingText:rebook?.nextRebookAt?`Due ${new Date(rebook.nextRebookAt).toLocaleDateString()}`:"Not due"},appointments:ap.rows,treatments:tr.rows,activity:act.rows.map((x:any)=>({...x,title:x.details?.title||x.action,sub:x.details?.sub||""})),providers:providers.rows,permissions:this.permissions(user)};
  }

  async create(user:any,b:any){
    this.require(user,"create");await this.ensureSchema();const team=this.teamId(user);
    if(!String(b.name||"").trim()||!String(b.email||"").trim())throw new BadRequestException("Name and email are required.");
    const {rows}=await this.db.query(`INSERT INTO contacts(team_id,created_by,name,email,phone,source,workspace_id,interest,created_at,updated_at)
      VALUES($1,$2,$3,$4,$5,'aesthetic-wellness',$6,$7,now(),now()) RETURNING id,name,email,phone`,
      [team,user.id,String(b.name).trim(),String(b.email).trim(),b.phone||null,WS,b.treatmentInterest||null]);
    const c=rows[0];await this.db.query(`INSERT INTO aesthetic_client_profiles(contact_id,team_id,provider_id,treatment_interest) VALUES($1,$2,$3,$4)`,
      [c.id,team,b.providerId||null,b.treatmentInterest||null]);await this.audit(user,c.id,"client_created",{name:c.name});return c;
  }
  async update(user:any,id:string,b:any){
    this.require(user,"edit");const team=await this.assertClient(user,id);
    if(b.name!==undefined&&!String(b.name).trim())throw new BadRequestException("Name is required.");
    await this.db.query(`UPDATE contacts SET name=coalesce($3,name),email=coalesce($4,email),phone=coalesce($5,phone),interest=coalesce($6,interest),updated_at=now() WHERE id=$1 AND team_id=$2`,
      [id,team,b.name?.trim?.()||null,b.email?.trim?.()||null,b.phone??null,b.treatmentInterest??null]);
    await this.db.query(`INSERT INTO aesthetic_client_profiles(contact_id,team_id,date_of_birth,preferred_contact,referral_source,provider_id,treatment_interest,preferences,alerts,internal_notes,follow_up_required)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb,$10,$11)
      ON CONFLICT(contact_id) DO UPDATE SET date_of_birth=coalesce(EXCLUDED.date_of_birth,aesthetic_client_profiles.date_of_birth),
      preferred_contact=coalesce(EXCLUDED.preferred_contact,aesthetic_client_profiles.preferred_contact),referral_source=coalesce(EXCLUDED.referral_source,aesthetic_client_profiles.referral_source),
      provider_id=coalesce(EXCLUDED.provider_id,aesthetic_client_profiles.provider_id),treatment_interest=coalesce(EXCLUDED.treatment_interest,aesthetic_client_profiles.treatment_interest),
      preferences=CASE WHEN $12 THEN EXCLUDED.preferences ELSE aesthetic_client_profiles.preferences END,alerts=CASE WHEN $13 THEN EXCLUDED.alerts ELSE aesthetic_client_profiles.alerts END,
      internal_notes=coalesce(EXCLUDED.internal_notes,aesthetic_client_profiles.internal_notes),follow_up_required=coalesce($14,aesthetic_client_profiles.follow_up_required),updated_at=now()`,
      [id,team,b.dateOfBirth||null,b.preferredContact||null,b.referralSource||null,b.providerId||null,b.treatmentInterest||null,JSON.stringify(this.arrays(b.preferences)),JSON.stringify(this.arrays(b.alerts)),b.internalNotes||null,b.status==="follow_up",b.preferences!==undefined,b.alerts!==undefined,b.status==="follow_up"?true:b.status==="active"?false:null]);
    await this.audit(user,id,"client_updated",{fields:Object.keys(b).filter(k=>!["internalNotes"].includes(k))});return this.get(user,id);
  }
  async archive(user:any,id:string){
    this.require(user,"archive");const team=await this.assertClient(user,id);
    await this.db.query(`INSERT INTO aesthetic_client_profiles(contact_id,team_id,archived_at) VALUES($1,$2,now()) ON CONFLICT(contact_id) DO UPDATE SET archived_at=now(),updated_at=now()`,[id,team]);
    await this.audit(user,id,"client_archived",{});return {success:true};
  }
  async activity(user:any,id:string){await this.assertClient(user,id);await this.audit(user,id,"activity_view",{});return this.db.query(`SELECT action,details,created_at "createdAt" FROM aesthetic_client_audit WHERE team_id=$1 AND contact_id=$2 ORDER BY created_at DESC`,[this.teamId(user),id]).then(r=>r.rows)}
}