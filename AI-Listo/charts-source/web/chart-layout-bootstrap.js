'use strict';
// Each embedded chart keeps its settings separate. The host retains all existing preferences.
window.ChartEmbed=null;
if(window.parent!==window){
 const params=new URLSearchParams(location.search),id=params.get('pane');
 if(params.get('embed')==='chart'&&/^\d{1,2}$/.test(id||'')){
  try{if(parent.location.origin===location.origin&&parent.ChartGridHost)window.ChartEmbed={id,symbol:params.get('symbol')||'USD/JPY',frame:params.get('frame')||'1min',style:params.get('style')==='line'?'line':'candles'};}catch{}
 }
}
const ChartStorage={getItem(key){try{return localStorage.getItem((ChartEmbed&&key!=='market-history-biquote-v1'?'chart-pane-'+ChartEmbed.id+':':'')+key);}catch{return null;}},setItem(key,value){try{localStorage.setItem((ChartEmbed&&key!=='market-history-biquote-v1'?'chart-pane-'+ChartEmbed.id+':':'')+key,value);}catch{}},removeItem(key){try{localStorage.removeItem((ChartEmbed&&key!=='market-history-biquote-v1'?'chart-pane-'+ChartEmbed.id+':':'')+key);}catch{}}};
if(ChartEmbed)document.documentElement.classList.add('chart-embedded');
else{
 const nativeFetch=window.fetch.bind(window),requests=new Map(),listeners=new Map(),latest=new Map();let reconnect;
 window.ChartGridHost={
  async request(url,options={}){
   const key=String(url),now=Date.now(),prior=requests.get(key);
   if(prior&&prior.until>now)return prior.promise;
   const promise=nativeFetch(url,{...options,signal:AbortSignal.timeout(25000)}).then(async response=>({body:await response.text(),status:response.status,statusText:response.statusText,headers:[...response.headers]}));
   requests.set(key,{promise,until:now+15000});
   try{const result=await promise;if(result.status>=400)requests.delete(key);return result;}catch(error){requests.delete(key);throw error;}
   finally{if(requests.size>200)for(const [k,v]of requests)if(v.until<Date.now())requests.delete(k);}
  },
  symbols(){return [...listeners.values()].map(item=>item.symbol());},
  subscribe(id,symbol,callback){listeners.set(id,{symbol,callback});const tick=latest.get(symbol().replace('/',''));if(tick)queueMicrotask(()=>callback(tick));clearTimeout(reconnect);reconnect=setTimeout(()=>{if(typeof LiveStream!=='undefined')LiveStream.reload();},250);return()=>listeners.delete(id);},
  remove(id){listeners.delete(String(id));},
  emitTick(tick){if(!tick)return;latest.set(tick.symbol,tick);for(const item of listeners.values())if(item.symbol().replace('/','')===tick.symbol)try{item.callback(tick);}catch{}},
  fresh(symbol){const tick=latest.get(symbol.replace('/',''));return !!tick&&Date.now()-Date.parse(tick.timestamp)<10000;},
  active(){return [...latest.values()].some(tick=>Date.now()-Date.parse(tick.timestamp)<10000);}
 };
 const sharedFetch=(input,options={})=>{
  const url=new URL(typeof input==='string'||input instanceof URL?input:input.url,location.href);
  if((options.method||'GET')==='GET'&&(url.hostname==='biquote.io'||(url.origin===location.origin&&['/api/candles','/api/quotes'].includes(url.pathname))))return ChartGridHost.request(url.href,options).then(result=>new Response(result.body,{status:result.status,statusText:result.statusText,headers:result.headers}));
  return nativeFetch(input,options);
 };
 window.fetch=sharedFetch;
}
if(ChartEmbed){
 const nativeFetch=window.fetch.bind(window);
 window.fetch=(input,options={})=>{
  const url=new URL(typeof input==='string'||input instanceof URL?input:input.url,location.href);
  if((options.method||'GET')==='GET'&&(url.hostname==='biquote.io'||(url.origin===location.origin&&['/api/candles','/api/quotes'].includes(url.pathname))))return parent.ChartGridHost.request(url.href,options).then(result=>new Response(result.body,{status:result.status,statusText:result.statusText,headers:result.headers}));
  return nativeFetch(input,options);
 };
}
