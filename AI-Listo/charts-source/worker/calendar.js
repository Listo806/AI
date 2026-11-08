// Isolated economic calendar adapter. Existing market-data routes are independent.
let calendarCache=null,calendarFlight=null,calendarRetryAt=0;
async function calendarResponse(request){
 if(request.method!=='GET'&&request.method!=='HEAD')return new Response('Method not allowed',{status:405});
 const reply=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'private, no-store','x-content-type-options':'nosniff'}});
 if(request.method==='HEAD')return new Response(null,{status:200});
 if(calendarCache&&Date.now()-calendarCache.fetchedAt<900000)return reply(calendarCache);
 if(Date.now()<calendarRetryAt)return calendarCache?reply({...calendarCache,stale:true}):reply({error:'Calendar temporarily unavailable. Please retry shortly.'},503);
 if(!calendarFlight)calendarFlight=(async()=>{
  try{
   const r=await fetch('https://showmytrades.com/api/public/calendar/v1?impact=all&days=30',{headers:{accept:'application/json'},signal:AbortSignal.timeout(20000)});
   if(!r.ok)throw Error('Calendar provider unavailable');
   const raw=await r.text();if(raw.length>2000000)throw Error('Calendar response too large');
   const d=JSON.parse(raw);if(!Array.isArray(d.events)||!Number.isFinite(d.server_time))throw Error('Invalid calendar response');
   const currencies=['USD','EUR','GBP','JPY','AUD','NZD','CAD','CHF','CNY'];
   const events=d.events.slice(0,5000).filter(e=>e&&Number.isFinite(e.ts)&&currencies.includes(e.currency)&&typeof e.title==='string').map(e=>({id:String(e.id||e.currency+'-'+e.ts+'-'+e.title).slice(0,220),ts:e.ts,currency:e.currency,title:e.title.slice(0,220),impact:['high','medium','low','holiday'].includes(e.impact)?e.impact:'low',actual:typeof e.actual==='string'?e.actual.slice(0,100):'',forecast:typeof e.forecast==='string'?e.forecast.slice(0,100):'',previous:typeof e.previous==='string'?e.previous.slice(0,100):'',status:['scheduled','moved','tentative','cancelled'].includes(e.status)?e.status:'scheduled',moved_from:typeof e.moved_from==='string'?e.moved_from:'',period:typeof e.period==='string'?e.period:'',confidence:typeof e.confidence==='string'?e.confidence:''}));
   calendarCache={events,serverTime:d.server_time,generatedAt:typeof d.generated_at==='string'?d.generated_at:null,fetchedAt:Date.now(),stale:false,source:'ShowMyTrades',sourceUrl:'https://showmytrades.com/tools/economic-calendar',windowFrom:d.from||null,windowTo:d.to||null};return calendarCache;
  }catch{calendarRetryAt=Date.now()+60000;if(calendarCache)return {...calendarCache,stale:true};throw Error('Unavailable');}
 })().finally(()=>{calendarFlight=null;});
 try{return reply(await calendarFlight);}catch{return reply({error:'Calendar feed unavailable. Your chart is unaffected. Try again shortly.'},503);}
}
