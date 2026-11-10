// Economic calendar API for Netlify. Do not expose provider HTML to the frontend.
const PROVIDER='https://showmytrades.com/api/public/calendar/v1?impact=all&days=30';
let cache=null, pending=null, retryAt=0;
const json=(status,payload)=>({statusCode:status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'private, no-store','x-content-type-options':'nosniff'},body:JSON.stringify(payload)});
export async function handler(event){
 const method=(event.httpMethod||'GET').toUpperCase();
 if(method!=='GET')return json(405,{error:'METHOD_NOT_ALLOWED'});
 if(cache&&Date.now()-cache.fetchedAt<900000)return json(200,cache);
 if(Date.now()<retryAt)return json(503,{error:'CALENDAR_UNAVAILABLE'});
 if(!pending)pending=(async()=>{
  const r=await fetch(PROVIDER,{headers:{accept:'application/json'},redirect:'manual',signal:AbortSignal.timeout(20000)});
  const type=r.headers.get('content-type')||'';
  if(!r.ok||!type.toLowerCase().includes('application/json'))throw Error('Calendar provider HTTP '+r.status+' content-type '+type);
  const raw=await r.text();if(raw.length>2000000)throw Error('Calendar provider response too large');
  const d=JSON.parse(raw);
  if(!Array.isArray(d.events)||!Number.isFinite(d.server_time))throw Error('Invalid calendar provider schema');
  const currencies=new Set(['USD','EUR','GBP','JPY','AUD','NZD','CAD','CHF','CNY']);
  const events=d.events.slice(0,5000).filter(e=>e&&Number.isFinite(e.ts)&&currencies.has(e.currency)&&typeof e.title==='string').map(e=>({
   id:String(e.id||e.currency+'-'+e.ts+'-'+e.title).slice(0,220),ts:e.ts,currency:e.currency,title:e.title.slice(0,220),
   impact:['high','medium','low','holiday'].includes(e.impact)?e.impact:'low',
   actual:typeof e.actual==='string'?e.actual.slice(0,100):'',forecast:typeof e.forecast==='string'?e.forecast.slice(0,100):'',previous:typeof e.previous==='string'?e.previous.slice(0,100):'',
   status:['scheduled','moved','tentative','cancelled'].includes(e.status)?e.status:'scheduled',
   moved_from:typeof e.moved_from==='string'?e.moved_from:'',period:typeof e.period==='string'?e.period:'',confidence:typeof e.confidence==='string'?e.confidence:''
  }));
  return {events,serverTime:d.server_time,generatedAt:typeof d.generated_at==='string'?d.generated_at:null,fetchedAt:Date.now(),stale:false,source:'ShowMyTrades',sourceUrl:'https://showmytrades.com/tools/economic-calendar',windowFrom:d.from||null,windowTo:d.to||null};
 })().finally(()=>{pending=null;});
 try{cache=await pending;return json(200,cache);}catch(err){console.error('[Charts Calendar] provider failure:',err.message);retryAt=Date.now()+60000;return json(503,{error:'CALENDAR_UNAVAILABLE'});}
}
