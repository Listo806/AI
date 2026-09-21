import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ConfigService } from '../config/config.service';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';

@Injectable()
export class SecurityService {
  constructor(private readonly db: DatabaseService, private readonly config: ConfigService) {}

  private b32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  private base32Encode(buf: Buffer) {
    let bits = ''; for (const b of buf) bits += b.toString(2).padStart(8,'0');
    let out=''; for(let i=0;i<bits.length;i+=5) out += this.b32[parseInt(bits.slice(i,i+5).padEnd(5,'0'),2)];
    return out;
  }
  private base32Decode(s: string) {
    let bits=''; for(const c of s.replace(/=+$/,'').toUpperCase()){ const i=this.b32.indexOf(c); if(i<0) continue; bits += i.toString(2).padStart(5,'0'); }
    const bytes:number[]=[]; for(let i=0;i+8<=bits.length;i+=8) bytes.push(parseInt(bits.slice(i,i+8),2));
    return Buffer.from(bytes);
  }
  private totp(secret:string, step=Math.floor(Date.now()/30000)) {
    const key=this.base32Decode(secret); const msg=Buffer.alloc(8); msg.writeBigUInt64BE(BigInt(step));
    const h=crypto.createHmac('sha1',key).update(msg).digest(); const o=h[h.length-1]&15;
    const n=((h[o]&127)<<24)|((h[o+1]&255)<<16)|((h[o+2]&255)<<8)|(h[o+3]&255);
    return String(n%1000000).padStart(6,'0');
  }
  private verifyTotp(secret:string, code:string){ const c=String(code||'').replace(/\s/g,''); return [-1,0,1].some(w=>this.totp(secret,Math.floor(Date.now()/30000)+w)===c); }
  private hashCode(code:string){ return crypto.createHash('sha256').update(code).digest('hex'); }
  private async ensure(userId:string){ await this.db.query(`INSERT INTO user_security(user_id) VALUES($1) ON CONFLICT(user_id) DO NOTHING`,[userId]); }

  async status(userId:string){
    await this.ensure(userId);
    const {rows}=await this.db.query(`SELECT two_factor_enabled AS "twoFactorEnabled", two_factor_enabled_at AS "twoFactorEnabledAt", password_changed_at AS "passwordChangedAt", jsonb_array_length(recovery_codes) AS "recoveryCodesRemaining" FROM user_security WHERE user_id=$1`,[userId]);
    return rows[0];
  }
  async begin2fa(user:any){
    await this.ensure(user.id); const secret=this.base32Encode(crypto.randomBytes(20));
    await this.db.query(`UPDATE user_security SET two_factor_pending_secret=$2, updated_at=NOW() WHERE user_id=$1`,[user.id,secret]);
    const label=encodeURIComponent(`Cortexa:${user.email}`); const issuer=encodeURIComponent('Cortexa');
    const otpauthUri=`otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&digits=6&period=30`;
    const qrDataUrl=await QRCode.toDataURL(otpauthUri,{margin:1,width:220});
    return {secret,otpauthUri,qrDataUrl};
  }
  async confirm2fa(userId:string, code:string, meta:any={}){
    await this.ensure(userId); const {rows}=await this.db.query(`SELECT two_factor_pending_secret FROM user_security WHERE user_id=$1`,[userId]);
    const secret=rows[0]?.two_factor_pending_secret; if(!secret || !this.verifyTotp(secret,code)) throw new BadRequestException('Invalid authentication code.');
    const codes=Array.from({length:10},()=>`${crypto.randomBytes(3).toString('hex').toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`);
    await this.db.query(`UPDATE user_security SET two_factor_enabled=true,two_factor_secret=$2,two_factor_pending_secret=NULL,two_factor_enabled_at=NOW(),recovery_codes=$3::jsonb,updated_at=NOW() WHERE user_id=$1`,[userId,secret,JSON.stringify(codes.map(x=>this.hashCode(x)))]);
    await this.activity(userId,'two_factor_enabled','Two-factor authentication enabled',meta); return {success:true,recoveryCodes:codes};
  }
  async disable2fa(userId:string, code:string, meta:any={}){
    const ok=await this.verifySecondFactor(userId,code,false); if(!ok) throw new BadRequestException('Invalid authentication or recovery code.');
    await this.db.query(`UPDATE user_security SET two_factor_enabled=false,two_factor_secret=NULL,two_factor_pending_secret=NULL,recovery_codes='[]'::jsonb,updated_at=NOW() WHERE user_id=$1`,[userId]);
    await this.activity(userId,'two_factor_disabled','Two-factor authentication disabled',meta); return {success:true};
  }
  async verifySecondFactor(userId:string, code:string, consumeRecovery=true){
    await this.ensure(userId); const {rows}=await this.db.query(`SELECT two_factor_enabled,two_factor_secret,recovery_codes FROM user_security WHERE user_id=$1`,[userId]); const r=rows[0];
    if(!r?.two_factor_enabled) return true; if(r.two_factor_secret && this.verifyTotp(r.two_factor_secret,code)) return true;
    const hash=this.hashCode(String(code||'').toUpperCase()); const arr=Array.isArray(r.recovery_codes)?r.recovery_codes:[]; const idx=arr.indexOf(hash);
    if(idx>=0){ if(consumeRecovery){arr.splice(idx,1); await this.db.query(`UPDATE user_security SET recovery_codes=$2::jsonb,updated_at=NOW() WHERE user_id=$1`,[userId,JSON.stringify(arr)]);} return true; }
    return false;
  }
  async needs2fa(userId:string){ await this.ensure(userId); const {rows}=await this.db.query(`SELECT two_factor_enabled FROM user_security WHERE user_id=$1`,[userId]); return rows[0]?.two_factor_enabled===true; }
  async generateRecoveryCodes(userId:string, code:string, meta:any={}){
    if(!(await this.verifySecondFactor(userId,code,false))) throw new BadRequestException('Invalid authentication code.');
    const codes=Array.from({length:10},()=>`${crypto.randomBytes(3).toString('hex').toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`);
    await this.db.query(`UPDATE user_security SET recovery_codes=$2::jsonb,updated_at=NOW() WHERE user_id=$1`,[userId,JSON.stringify(codes.map(x=>this.hashCode(x)))]);
    await this.activity(userId,'recovery_codes_generated','Recovery codes regenerated',meta); return {recoveryCodes:codes};
  }
  async createSession(userId:string, meta:any={}){
    const {rows}=await this.db.query(`INSERT INTO auth_sessions(user_id,user_agent,ip_address,device_label,location_label) VALUES($1,$2,NULLIF($3,'')::inet,$4,$5) RETURNING id`,[userId,meta.userAgent||null,meta.ip||'',this.device(meta.userAgent),meta.location||null]); return rows[0].id;
  }
  async sessionValid(userId:string,sid?:string){ if(!sid) return true; const {rows}=await this.db.query(`SELECT 1 FROM auth_sessions WHERE id=$1 AND user_id=$2 AND revoked_at IS NULL`,[sid,userId]); return !!rows.length; }
  async touchSession(sid?:string){ if(!sid)return; await this.db.query(`UPDATE auth_sessions SET last_active_at=NOW() WHERE id=$1 AND revoked_at IS NULL`,[sid]); }
  async sessions(userId:string,currentSid?:string){ const {rows}=await this.db.query(`SELECT id,device_label AS "device",location_label AS "location",user_agent AS "userAgent",created_at AS "createdAt",last_active_at AS "lastActiveAt",(id=$2::uuid) AS "current" FROM auth_sessions WHERE user_id=$1 AND revoked_at IS NULL ORDER BY (id=$2::uuid) DESC,last_active_at DESC`,[userId,currentSid||null]); return rows; }
  async revokeSession(userId:string,id:string,currentSid?:string){ if(id===currentSid) throw new BadRequestException('Use sign out to end the current session.'); await this.db.query(`UPDATE auth_sessions SET revoked_at=NOW() WHERE id=$1 AND user_id=$2`,[id,userId]); await this.activity(userId,'session_revoked','Signed out another device'); return {success:true}; }
  async revokeOthers(userId:string,currentSid?:string){ await this.db.query(`UPDATE auth_sessions SET revoked_at=NOW() WHERE user_id=$1 AND revoked_at IS NULL AND ($2::uuid IS NULL OR id<>$2::uuid)`,[userId,currentSid||null]); await this.activity(userId,'other_sessions_revoked','Signed out all other devices'); return {success:true}; }
  async revokeCurrent(userId:string,currentSid?:string){ if(!currentSid) return {success:true}; await this.db.query(`UPDATE auth_sessions SET revoked_at=NOW() WHERE id=$1 AND user_id=$2 AND revoked_at IS NULL`,[currentSid,userId]); await this.activity(userId,'session_signed_out','Signed out current session'); return {success:true}; }
  async activity(userId:string,type:string,description:string,meta:any={}){ await this.db.query(`INSERT INTO security_activity(user_id,event_type,description,ip_address,user_agent,location_label) VALUES($1,$2,$3,NULLIF($4,'')::inet,$5,$6)`,[userId,type,description,meta.ip||'',meta.userAgent||null,meta.location||null]); }
  async recentActivity(userId:string,limit=20){ const {rows}=await this.db.query(`SELECT id,event_type AS "eventType",description,location_label AS "location",created_at AS "createdAt" FROM security_activity WHERE user_id=$1 ORDER BY created_at DESC LIMIT $2`,[userId,Math.min(Math.max(limit,1),100)]); return rows; }
  async passwordChanged(userId:string,meta:any={}){ await this.ensure(userId); await this.db.query(`UPDATE user_security SET password_changed_at=NOW(),updated_at=NOW() WHERE user_id=$1`,[userId]); await this.activity(userId,'password_changed','Password changed',meta); }
  private device(ua=''){ const s=String(ua||''); const os=/Android/i.test(s)?'Android':/iPhone|iPad/i.test(s)?'iPhone / iPad':/Windows/i.test(s)?'Windows PC':/Mac OS/i.test(s)?'Mac':'Device'; const b=/Edg\//.test(s)?'Microsoft Edge':/Chrome\//.test(s)?'Chrome':/Firefox\//.test(s)?'Firefox':/Safari\//.test(s)?'Safari':'Browser'; return `${os} · ${b}`; }
}
