import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const BASE=(import.meta.env.VITE_API_BASE_URL||import.meta.env.VITE_API_URL||'https://backend.cortexaaicrm.com/api').replace(/\/+$/,'');
const copy={
 en:{title:'Vacation sample importer (admin)',desc:'Upload 57 cropped JPG covers and the original 57-record JSON. Existing records are skipped; bookings remain disabled.',json:'Choose source JSON',images:'Choose 57 JPG covers',preview:'Validate files',upload:'Upload covers and import',status:'Check import status',login:'Sign in as an administrator first.',done:'Completed',warn:'Do not close this tab while uploading. Resume safely by selecting the same files again.'},
 es:{title:'Importador de ejemplos vacacionales (admin)',desc:'Sube las 57 portadas JPG recortadas y el JSON original. Se omiten los registros existentes; reservas desactivadas.',json:'Seleccionar JSON',images:'Seleccionar 57 portadas JPG',preview:'Validar archivos',upload:'Subir portadas e importar',status:'Verificar estado',login:'Inicia sesión como administrador.',done:'Completado',warn:'No cierres esta pestaña durante la carga. Puedes reanudar seleccionando los mismos archivos.'},
 pt:{title:'Importador de amostras de temporada (admin)',desc:'Envie as 57 capas JPG recortadas e o JSON original. Registros existentes são ignorados; reservas desativadas.',json:'Selecionar JSON',images:'Selecionar 57 capas JPG',preview:'Validar arquivos',upload:'Enviar capas e importar',status:'Verificar status',login:'Entre como administrador.',done:'Concluído',warn:'Não feche esta aba durante o envio. Você pode retomar selecionando os mesmos arquivos.'}
};
const token=()=>localStorage.getItem('listo_access_token');
async function api(path,options={}) {const res=await fetch(`${BASE}/${path}`,{...options,headers:{...(options.body instanceof FormData?{}:{'Content-Type':'application/json'}),Authorization:`Bearer ${token()||''}`,...options.headers}});if(!res.ok){const detail=await res.text();throw Error(`${res.status}: ${detail.slice(0,350)}`)}return res.json()}
const fileId=name=>name.replace(/\.(jpe?g|png)$/i,'');
export default function VacationSampleAdmin(){
 const {i18n}=useTranslation();const t=copy[(i18n.language||'en').slice(0,2)]||copy.en;
 const [jsonFile,setJson]=useState(null),[files,setFiles]=useState([]),[ready,setReady]=useState(null),[log,setLog]=useState([]),[busy,setBusy]=useState(false),[status,setStatus]=useState(null);
 const push=s=>setLog(a=>[...a,String(s)]);
 const prepare=async()=>{if(!jsonFile)throw Error('Select the original JSON');const obj=JSON.parse(await jsonFile.text());const records=obj.properties;if(!Array.isArray(records)||records.length!==57||new Set(records.map(x=>x.external_id)).size!==57)throw Error('JSON must contain exactly 57 unique records');const map=new Map(files.map(x=>[fileId(x.name),x]));if(map.size!==57||records.some(r=>!map.has(r.external_id)))throw Error('57 JPG filenames must exactly match the 57 external IDs');if(records.some(r=>r.is_sample!==true||r.booking_enabled!==false||r.availability_verified!==false))throw Error('Sample safety flags invalid');return {records,map}};
 const check=async()=>{try{const r=await prepare();setReady(r);push('57/57 source IDs matched to JPG covers');}catch(e){setReady(null);push('ERROR '+e.message)}};
 const loadStatus=async()=>{try{const s=await api('vacation-rentals/samples/admin/status');setStatus(s);push(`Database: ${s.total}/57; published ${s.published}`)}catch(e){push('ERROR '+e.message)}};
 const run=async()=>{if(!token()){push(t.login);return}setBusy(true);try{
  const data=await prepare();const current=await api('vacation-rentals/samples/admin/status');const existing=new Map(current.items.map(x=>[x.external_id,x]));let done=0;
  for(const rec of data.records){
   if(existing.has(rec.external_id)){done++;push(`${done}/57 ${rec.external_id}: already imported`);continue}
   const file=data.map.get(rec.external_id);const fd=new FormData();fd.append('file',file);fd.append('folder',`listoqasa/vacation-covers/${rec.external_id}`);
   const uploaded=await api('integrations/storage/upload',{method:'POST',body:fd});
   if(!uploaded.url)throw Error('Storage API did not return URL');
   await new Promise((resolve,reject)=>{const img=new Image();img.onload=resolve;img.onerror=()=>reject(Error(`S3 cover not publicly readable: ${rec.external_id}`));img.src=uploaded.url;});
   const record={...rec,cover_url:uploaded.url};
   await api('vacation-rentals/samples/admin/preview',{method:'POST',body:JSON.stringify({records:[record]})});
   const saved=await api('vacation-rentals/samples/admin/commit',{method:'POST',body:JSON.stringify({records:[record]})});
   done++;push(`${done}/57 ${rec.external_id}: ${saved.created?'published':'already exists'}`);
  }
  push(t.done);await loadStatus();
 }catch(e){push('STOPPED: '+e.message)}finally{setBusy(false)}};
 return <main style={{maxWidth:960,margin:'40px auto',padding:24,fontFamily:'system-ui',lineHeight:1.5}}><h1>{t.title}</h1><p>{t.desc}</p><p>{t.warn}</p><p><label>{t.json} <input type="file" accept=".json,application/json" onChange={e=>{setJson(e.target.files[0]||null);setReady(null)}}/></label></p><p><label>{t.images} <input type="file" accept="image/jpeg" multiple onChange={e=>{setFiles(Array.from(e.target.files));setReady(null)}}/></label> {files.length}/57</p><p><button onClick={check} disabled={busy}>{t.preview}</button> <button onClick={run} disabled={busy||!ready}>{busy?'…':t.upload}</button> <button onClick={loadStatus} disabled={busy}>{t.status}</button></p>{status&&<p>{status.total}/57 imported · {status.published} published</p>}<pre style={{whiteSpace:'pre-wrap',background:'#f4f5f7',padding:16,maxHeight:420,overflow:'auto'}}>{log.join('\n')}</pre></main>;
}
