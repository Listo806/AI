import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

const EXPECTED: Record<string, number> = { EC:9, CO:6, PE:6, CL:6, AR:6, BR:6, MX:6, PA:6, CR:6 };
const COUNTRY: Record<string, string> = { EC:'Ecuador', CO:'Colombia', PE:'Peru', CL:'Chile', AR:'Argentina', BR:'Brazil', MX:'Mexico', PA:'Panama', CR:'Costa Rica' };
@Injectable()
export class VacationSampleImportService {
 constructor(private readonly db: DatabaseService) {}
 private admin(user: any) {
  if (!['admin','super_admin'].includes(String(user?.role || '')) || !user?.id || !user?.teamId)
   throw new BadRequestException('Admin account with team required');
 }
 private validate(records: any[]) {
  if (!Array.isArray(records) || !records.length || records.length > 57) throw new BadRequestException('Expected 1-57 vacation samples');
  const ids = new Set<string>();
  for (const r of records) {
   if (!r || typeof r.external_id !== 'string' || !/^LQ-VR-(EC|CO|PE|CL|AR|BR|MX|PA|CR)-\d{3}$/.test(r.external_id) || ids.has(r.external_id)) throw new BadRequestException('Invalid or repeated external_id');
   ids.add(r.external_id);
   const code = r.external_id.split('-')[2];
   if (r.country_code !== code || r.country !== COUNTRY[code] || typeof r.city !== 'string' || !r.city.trim() || typeof r.title !== 'string' || !r.title.trim() || typeof r.description !== 'string' || !r.description.trim()) throw new BadRequestException(`Invalid location or content: ${r.external_id}`);
   if (r.is_sample !== true || r.booking_enabled !== false || r.availability_verified !== false || r.latitude != null || r.longitude != null || r.exact_address != null) throw new BadRequestException(`Unsafe demo flags: ${r.external_id}`);
   if (!Number.isFinite(r.nightly_price) || r.nightly_price < 0 || r.currency !== 'USD' || !Number.isInteger(r.max_guests) || r.max_guests < 1 || !Number.isInteger(r.bedrooms) || r.bedrooms < 0 || !Number.isFinite(r.bathrooms) || r.bathrooms < 0 || !Array.isArray(r.amenities)) throw new BadRequestException(`Invalid values: ${r.external_id}`);
   if (typeof r.cover_url !== 'string' || !r.cover_url.startsWith('https://')) throw new BadRequestException(`Missing HTTPS cover: ${r.external_id}`);
   const bucket = process.env.AWS_S3_BUCKET || process.env.AWS_S3_BUCKET_NAME;
   const region = process.env.AWS_REGION || 'us-east-1';
   const prefix = `https://${bucket}.s3.${region}.amazonaws.com/listoqasa/vacation-covers/${r.external_id}/`;
   if (!bucket || !r.cover_url.startsWith(prefix)) throw new BadRequestException(`Cover must be uploaded to the configured S3 bucket/prefix: ${r.external_id}`);
  }
  return ids;
 }
 async status(user: any) {
  this.admin(user);
  const q = await this.db.query(`SELECT v.external_id, p.status, p.thumbnail_url AS "coverUrl", p.city, p.country FROM listoqasa_vacation_samples v JOIN properties p ON p.id=v.property_id WHERE p.team_id=$1 ORDER BY v.external_id`,[user.teamId]);
  return { total:q.rows.length, published:q.rows.filter(x=>x.status==='published').length, items:q.rows };
 }
 async preview(body:any,user:any) {
  this.admin(user);
  const records=body?.records; this.validate(records);
  const q=await this.db.query('SELECT external_id FROM listoqasa_vacation_samples WHERE external_id=ANY($1::text[])',[records.map((x:any)=>x.external_id)]);
  return {count:records.length,existing:q.rows.length,newRecords:records.length-q.rows.length,dryRun:true};
 }
 async commit(body:any,user:any) {
  this.admin(user);
  const records=body?.records; this.validate(records);
  return this.db.transaction(async c=>{
   await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',['listoqasa-vacation-samples']);
   let created=0,unchanged=0;
   for(const r of records){
    const match=await c.query('SELECT property_id FROM listoqasa_vacation_samples WHERE external_id=$1 FOR UPDATE',[r.external_id]);
    if(match.rows.length){
     const current=await c.query('SELECT p.team_id,p.listing_type,p.thumbnail_url,p.status FROM properties p WHERE p.id=$1 FOR UPDATE',[match.rows[0].property_id]);
     if(!current.rows.length || current.rows[0].team_id!==user.teamId || current.rows[0].listing_type!=='vacation' || current.rows[0].thumbnail_url!==r.cover_url) throw new ConflictException(`Existing sample differs or is not owned: ${r.external_id}`);
     unchanged++;continue;
    }
    const inserted=await c.query(`INSERT INTO properties (title,description,city,state,country,price,type,status,listing_type,property_type,bedrooms,bathrooms,max_guests,amenities,thumbnail_url,created_by,team_id,latitude,longitude,published_at)
     VALUES ($1,$2,$3,NULL,$4,$5,NULL,'published','vacation',$6,$7,$8,$9,$10::jsonb,$11,$12,$13,NULL,NULL,NOW()) RETURNING id`,
     [r.title,r.description,r.city,r.country,r.nightly_price,({condo:'apartment',studio:'apartment',loft:'apartment',cabin:'house',bungalow:'house'} as Record<string,string>)[String(r.property_type||'house').toLowerCase()] || String(r.property_type||'house').toLowerCase(),r.bedrooms,r.bathrooms,r.max_guests,JSON.stringify(r.amenities),r.cover_url,user.id,user.teamId]);
    const id=inserted.rows[0].id;
    await c.query(`INSERT INTO property_media (property_id,url,type,is_primary,display_order) VALUES($1,$2,'image',true,0)`,[id,r.cover_url]);
    await c.query(`INSERT INTO listoqasa_vacation_samples(external_id,property_id,payload) VALUES($1,$2,$3::jsonb)`,[r.external_id,id,JSON.stringify(r)]);
    created++;
   }
   return {created,unchanged,total:records.length};
  });
 }
}
