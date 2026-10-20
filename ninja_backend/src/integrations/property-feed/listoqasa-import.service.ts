import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import { DatabaseService } from '../../database/database.service';

const GROUPS: Record<string, number> = { Quito:225, Guayaquil:225, Cuenca:150, 'Samborondón':80, 'Cumbayá':70, Manta:60, Tumbaco:30 };
const TYPES = new Set(['house','apartment','office','retail','commercial','warehouse','land']);
const required = (v:any) => typeof v === 'string' && v.trim().length > 0;
@Injectable()
export class ListoqasaImportService {
 constructor(private readonly db:DatabaseService, private readonly storage:StorageService) {}
 private validate(body:any) {
  if (!body || !Array.isArray(body.records) || !GROUPS[body.city] || body.records.length > GROUPS[body.city]) throw new BadRequestException('Invalid city group or record count');
  const ids = new Set<string>(); const slugs = new Set<string>();
  for (const [i,r] of body.records.entries()) {
   if (!required(r.external_id) || !/^LQ-S2-[A-Z]+-\d{5}$/.test(r.external_id) || ids.has(r.external_id)) throw new BadRequestException(`Invalid/duplicate external_id at ${i}`);
   ids.add(r.external_id);
   if (!required(r.slug) || slugs.has(r.slug)) throw new BadRequestException(`Invalid/duplicate slug at ${i}`); slugs.add(r.slug);
   if (!required(r.title) || !required(r.description) || !TYPES.has(r.property_type) || !['sale','rent'].includes(r.listing_type) || (r.property_type==='land' && r.listing_type==='rent') || !Number.isFinite(r.price) || r.price<0 || !Number.isFinite(r.area_m2) || r.area_m2<=0 || r.city!==body.city || r.status!=='draft' || r.is_sample!==true || r.source_type!=='ai_generated_sample' || r.seo_indexable!==false || r.property_inquiry_enabled!==false || r.latitude!=null || r.longitude!=null || (r.images?.length||0)!==0) throw new BadRequestException(`Invalid sample record at ${i}`);
   if (r.currency!=='USD' || r.price_period!==(r.listing_type==='sale'?'total':'month')) throw new BadRequestException(`Invalid price period at ${i}`);
  }
  return {city:body.city, count:body.records.length, ids:[...ids]};
 }
 async preview(body:any) {
  const v=this.validate(body);
  const existing=await this.db.query('SELECT external_id FROM listoqasa_sample_imports WHERE external_id=ANY($1::text[])',[v.ids]);
  return { ...v, newRecords:v.count-existing.rows.length, updates:existing.rows.length, dryRun:true };
 }
 async commit(body:any, user:any) {
  const v=this.validate(body);
  if (!['super_admin','admin'].includes(String(user?.role||''))) throw new BadRequestException('Administrator permission required');
  if (!user?.id || !user?.teamId) throw new BadRequestException('Authenticated team and user required');
  return this.db.transaction(async c=>{
   // Serialize imports to prevent concurrent duplicate slugs and IDs.
   await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',['listoqasa-stage2']);
   let created=0, updated=0;
   // Resolve the canonical location hierarchy once per city batch.
   // Cumbayá and Tumbaco are Quito parishes, not additional Quito-city records.
   const isQuitoParish = ['Cumbayá','Tumbaco'].includes(v.city);
   const zoneCity = isQuitoParish ? 'Quito' : v.city;
   const zoneNeighborhood = isQuitoParish ? v.city : null;
   const existingZones = await c.query(
    `SELECT id FROM zones WHERE lower(trim(city))=lower(trim($1))
       AND (($2::text IS NULL AND neighborhood IS NULL) OR lower(trim(neighborhood))=lower(trim($2)))
     ORDER BY created_at ASC, id ASC LIMIT 2`, [zoneCity,zoneNeighborhood]);
   if (existingZones.rows.length > 1) throw new ConflictException(`Ambiguous zone mapping: ${v.city}`);
   let zoneId = existingZones.rows[0]?.id;
   if (!zoneId) {
    const newZone = await c.query(
     `INSERT INTO zones(city,neighborhood,name) VALUES($1,$2,$3) RETURNING id`,
     [zoneCity,zoneNeighborhood,zoneNeighborhood ? `Quito – ${zoneNeighborhood}` : zoneCity]);
    zoneId = newZone.rows[0].id;
   }
   for (const r of body.records) {
    const match=await c.query('SELECT property_id FROM listoqasa_sample_imports WHERE external_id=$1 FOR UPDATE',[r.external_id]);
    let propertyId=match.rows[0]?.property_id;
    if (propertyId) {
     const owner=await c.query('SELECT id,status FROM properties WHERE id=$1 AND team_id=$2 FOR UPDATE',[propertyId,user.teamId]);
     if (!owner.rows.length || owner.rows[0].status!=='draft') throw new ConflictException(`Protected or non-draft listing: ${r.external_id}`);
    } else {
     const collision=await c.query('SELECT id FROM properties WHERE title=$1 AND city=$2 AND team_id=$3 LIMIT 1',[r.title,r.city,user.teamId]);
     if (collision.rows.length) throw new ConflictException(`Existing listing title collision: ${r.external_id}`);
    }
    const canonicalCity=['Cumbayá','Tumbaco'].includes(r.city)?'Quito':r.city;
    const area=['Cumbayá','Tumbaco'].includes(r.city)?r.city:null;
    const data=[r.title,r.description,r.city,r.province||null,r.price,r.listing_type,r.property_type,r.bedrooms??null,r.bathrooms??null,Math.round(r.area_m2*10.7639104167),r.lot_size_m2==null?null:r.lot_size_m2*10.7639104167];
    if (propertyId) {
     await c.query(`UPDATE properties SET title=$1,description=$2,city=$3,state=$4,price=$5,type=$6,property_type=$7,bedrooms=$8,bathrooms=$9,square_feet=$10,lot_size=$11,zone_id=$12,updated_at=NOW() WHERE id=$13`,[...data,zoneId,propertyId]);
     updated++;
    } else {
     const ins=await c.query(`INSERT INTO properties(title,description,city,state,price,type,property_type,bedrooms,bathrooms,square_feet,lot_size,status,listing_type,country,created_by,team_id,latitude,longitude,zone_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'draft','marketplace','Ecuador',$12,$13,NULL,NULL,$14) RETURNING id`,[...data,user.id,user.teamId,zoneId]);
     propertyId=ins.rows[0].id; created++;
    }
    await c.query(`INSERT INTO listoqasa_sample_imports(external_id,property_id,group_name,payload) VALUES($1,$2,$3,$4::jsonb) ON CONFLICT(external_id) DO UPDATE SET payload=EXCLUDED.payload,updated_at=NOW()`,[r.external_id,propertyId,r.city,JSON.stringify({...r,canonical_city:canonicalCity,parish:area,zone_id:zoneId})]);
   }
   return {city:v.city,created,updated,total:v.count,allDraft:true};
  });
 }
 async imagesPreview(body:any) {
  if (!Array.isArray(body?.images) || body.images.length>1200) throw new BadRequestException('Expected images array');
  const keys=new Set<string>();
  for(const r of body.images){
   if(!required(r.external_id)||!Number.isInteger(r.index)||r.index<0||r.index>19||!required(r.url)||!/^https:\/\//.test(r.url)) throw new BadRequestException('Invalid image manifest');
   const k=`${r.external_id}:${r.index}`; if(keys.has(k)) throw new BadRequestException('Duplicate image index'); keys.add(k);
  }
  const ids=[...new Set(body.images.map((x:any)=>x.external_id))];
  const found=await this.db.query('SELECT external_id FROM listoqasa_sample_imports WHERE external_id=ANY($1::text[])',[ids]);
  const matched=new Set(found.rows.map(x=>x.external_id));
  return {images:body.images.length,properties:ids.length,missing:ids.filter(x=>!matched.has(x)),dryRun:true};
 }
 async imagesCommit(body:any,user:any) {
  if(!['super_admin','admin'].includes(String(user?.role||''))||!user?.teamId) throw new BadRequestException('Administrator permission required');
  const check=await this.imagesPreview(body); if(check.missing.length) throw new BadRequestException('Unknown property IDs');
  return this.db.transaction(async c=>{
   let created=0,unchanged=0;
   for(const r of body.images){
    const q=await c.query(`SELECT i.property_id,p.team_id,p.status FROM listoqasa_sample_imports i JOIN properties p ON p.id=i.property_id WHERE i.external_id=$1 FOR UPDATE`,[r.external_id]);
    if(!q.rows.length||q.rows[0].team_id!==user.teamId||q.rows[0].status!=='draft') throw new ConflictException('Protected property');
    const old=await c.query('SELECT image_url FROM listoqasa_sample_images WHERE external_id=$1 AND image_index=$2',[r.external_id,r.index]);
    if(old.rows.length){if(old.rows[0].image_url!==r.url) throw new ConflictException('Image slot already occupied; no silent replacement');unchanged++;continue;}
    const media=await c.query(`INSERT INTO property_media(property_id,url,type,is_primary,display_order) VALUES($1,$2,'image',$3,$4) RETURNING id`,[q.rows[0].property_id,r.url,r.index===0,r.index]);
    await c.query('INSERT INTO listoqasa_sample_images(external_id,image_index,image_url,media_id) VALUES($1,$2,$3,$4)',[r.external_id,r.index,r.url,media.rows[0].id]);created++;
   }
   return {created,unchanged};
  });
 }
 private admin(user:any) {
  if (!['admin','super_admin'].includes(String(user?.role||'')) || !user?.id || !user?.teamId) throw new BadRequestException('Administrator team required');
 }
 async stage3Status(user:any) {
  this.admin(user);
  const q=await this.db.query(`SELECT i.group_name, COUNT(*)::int AS total,
   COUNT(si.external_id)::int AS covered,
   COUNT(*) FILTER (WHERE p.status='published')::int AS published
   FROM listoqasa_sample_imports i JOIN properties p ON p.id=i.property_id
   LEFT JOIN listoqasa_sample_images si ON si.external_id=i.external_id AND si.image_index=0
   WHERE p.team_id=$1 GROUP BY i.group_name ORDER BY i.group_name`,[user.teamId]);
  return {groups:q.rows};
 }
 async uploadCovers(files:Express.Multer.File[],user:any) {
  this.admin(user);
  if (!files?.length || files.length>6) throw new BadRequestException('Select 1-6 cover images');
  const ids=files.map(f=>f.originalname.replace(/\.(jpe?g|png|webp)$/i,''));
  if(ids.some(id=>!/^LQ-S2-[A-Z]+-\d{5}$/.test(id)) || new Set(ids).size!==ids.length) throw new BadRequestException('Each file must be named external_id.jpg/png/webp, without duplicates');
  const rows=await this.db.query(`SELECT i.external_id,i.property_id,p.status,p.team_id,
    si.image_url FROM listoqasa_sample_imports i JOIN properties p ON p.id=i.property_id
    LEFT JOIN listoqasa_sample_images si ON si.external_id=i.external_id AND si.image_index=0
    WHERE i.external_id=ANY($1::text[])`,[ids]);
  if(rows.rows.length!==ids.length) throw new BadRequestException('Unknown property external ID');
  for(const row of rows.rows) if(row.team_id!==user.teamId || !['draft','published'].includes(row.status)) throw new ConflictException('Property belongs to another team or invalid status');
  const byId=new Map(rows.rows.map(r=>[r.external_id,r]));
  const results:any[]=[];
  for(let i=0;i<files.length;i++) {
   const file=files[i], id=ids[i], existing=byId.get(id);
   if(existing.image_url) { results.push({external_id:id,status:'already_attached',url:existing.image_url}); continue; }
   // Existing StorageService checks image type/size and records S3 ownership.
   const stored=await this.storage.uploadFile({file,folder:`listoqasa/covers/${id}`,userId:user.id,teamId:user.teamId});
   // Public browse requires permanent accessible URLs, not expiring signed URLs.
   let accessible=false;
   try { const response=await fetch(stored.url,{method:'GET',signal:AbortSignal.timeout(10000)}); accessible=response.ok && (response.headers.get('content-type')||'').startsWith('image/'); await response.body?.cancel(); } catch {}
   if(!accessible) throw new BadRequestException(`S3 cover ${id} is not publicly readable. Check bucket/CDN read access before continuing. Uploaded object: ${stored.key}`);
   // Do not overwrite existing media; keep the upload and DB association atomic.
   await this.db.transaction(async c=>{
    const locked=await c.query(`SELECT i.property_id,p.team_id,p.status FROM listoqasa_sample_imports i JOIN properties p ON p.id=i.property_id WHERE i.external_id=$1 FOR UPDATE`,[id]);
    if(locked.rows[0]?.team_id!==user.teamId || !['draft','published'].includes(locked.rows[0]?.status)) throw new ConflictException('Protected property');
    const old=await c.query('SELECT image_url FROM listoqasa_sample_images WHERE external_id=$1 AND image_index=0',[id]);
    if(old.rows.length) throw new ConflictException(`Cover was attached concurrently: ${id}`);
    const media=await c.query(`INSERT INTO property_media(property_id,url,type,is_primary,display_order) VALUES($1,$2,'image',true,0) RETURNING id`,[locked.rows[0].property_id,stored.url]);
    await c.query('INSERT INTO listoqasa_sample_images(external_id,image_index,image_url,media_id) VALUES($1,0,$2,$3)',[id,stored.url,media.rows[0].id]);
    await c.query('UPDATE properties SET thumbnail_url=$1,updated_at=NOW() WHERE id=$2',[stored.url,locked.rows[0].property_id]);
   });
   results.push({external_id:id,status:'attached',url:stored.url});
  }
  return {processed:results.length,results};
 }
 async publishSamples(body:any,user:any) {
  this.admin(user);
  if(body?.confirm!=='PUBLISH_840_AI_SAMPLES') throw new BadRequestException('Explicit publish confirmation required');
  return this.db.transaction(async c=>{
   await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',['listoqasa-stage3-publish']);
   const q=await c.query(`SELECT COUNT(*)::int AS total,
     COUNT(*) FILTER(WHERE p.status NOT IN ('draft','published'))::int AS invalid,
     COUNT(*) FILTER(WHERE si.media_id IS NULL OR p.thumbnail_url IS NULL)::int AS missing
     FROM listoqasa_sample_imports i JOIN properties p ON p.id=i.property_id
     LEFT JOIN listoqasa_sample_images si ON si.external_id=i.external_id AND si.image_index=0
     WHERE p.team_id=$1`,[user.teamId]);
   if(q.rows[0].total!==840 || q.rows[0].missing!==0 || q.rows[0].invalid!==0) throw new ConflictException('Require exactly 840 valid properties with covers before publishing');
   const updated=await c.query(`UPDATE properties p SET status='published',published_at=COALESCE(p.published_at,NOW()),updated_at=NOW()
     FROM listoqasa_sample_imports i WHERE i.property_id=p.id AND p.team_id=$1 AND p.status='draft' RETURNING p.id`,[user.teamId]);
   return {total:840,publishedNow:updated.rowCount ?? 0,alreadyPublished:840-(updated.rowCount ?? 0)};
  });
 }

}
