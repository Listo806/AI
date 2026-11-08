const candleCache=new Map(),candleRequests=new Map();
const candleFrames={'1min':{provider:'1m',ttl:60},'5min':{provider:'5m',ttl:120},'15min':{provider:'15m',ttl:300},'30min':{provider:'30m',ttl:300},'1h':{provider:'1h',ttl:600},'4h':{provider:'4h',ttl:1800},'1day':{provider:'1d',ttl:1800}};
const candleSymbols=["EUR/USD","GBP/USD","USD/JPY","USD/CHF","USD/CAD","AUD/USD","NZD/USD","GBP/JPY","EUR/JPY","AUD/JPY","CAD/JPY","CHF/JPY","NZD/JPY","EUR/GBP","EUR/AUD","EUR/CAD","EUR/CHF","GBP/AUD","GBP/CAD","AUD/NZD","XAU/USD","XAG/USD","XCU/USD","XPT/USD","XPD/USD","USOIL","UKOIL","XNG/USD","US500","USTEC","US30","DE30","UK100","JP225","AUS200","STOXX50","DXY"];
export async function candleResponse(url){
 const symbol=url.searchParams.get('symbol'),interval=url.searchParams.get('interval');if(!candleSymbols.includes(symbol)||!candleFrames[interval])return Response.json({error:'Unsupported market or interval'},{status:400});
 const key=symbol+'|'+interval,ttl=candleFrames[interval].ttl,previous=candleCache.get(key);if(previous&&Date.now()-previous.fetchedAt<ttl*1000)return Response.json(previous);
 if(!candleRequests.has(key))candleRequests.set(key,(async()=>{
  const upstream=new URL('https://biquote.io/api/'+symbol.replace('/','')+'/ohlc');upstream.search=new URLSearchParams({interval:candleFrames[interval].provider,limit:'1000'});
  const r=await fetch(upstream,{signal:AbortSignal.timeout(20000)});if(!r.ok){const e=Error('Candle history unavailable');e.status=r.status;throw e;}const json=await r.json();if(json.symbol!==symbol.replace('/','')||!Array.isArray(json.bars)||!json.bars.length)throw Error('Invalid candle history');
  const map=new Map();for(const b of json.bars){const time=Date.parse(b.openTime),open=Number(b.open),high=Number(b.high),low=Number(b.low),close=Number(b.close);const raw=b.tickVolume??(b.volume>0?b.volume:null),volume=raw===null?null:Number(raw);if(![time,open,high,low,close].every(Number.isFinite)||low<=0||high<Math.max(open,close)||low>Math.min(open,close)||(volume!==null&&(!Number.isFinite(volume)||volume<0)))throw Error('Invalid candle values');map.set(time,{date:new Date(time).toISOString(),open,high,low,close,volume,isOpen:!!b.isOpen});}
  // Merge only candles from the same provider to preserve session history as the window rolls.
  const cutoff=Date.now()-2*86400000;const retained=interval==='1min'?(previous?.values||[]).filter(b=>Date.parse(b.date)>=cutoff):[];const merged=new Map(retained.map(b=>[Date.parse(b.date),b]));for(const [t,b] of map)merged.set(t,b);const values=[...merged.values()].sort((a,b)=>Date.parse(a.date)-Date.parse(b.date));
  const body={symbol,interval,values,provider:'biquote',volumeType:'tick',source:'biquote · MT5 OHLC · tick-volume weighted',fetchedAt:Date.now(),refreshAfter:ttl};candleCache.set(key,body);return body;
 })());
 try{return Response.json(await candleRequests.get(key),{headers:{'cache-control':'no-store'}});}catch(error){return Response.json({error:error.status===429?'Live feed rate limit reached; retry shortly.':'Candle history is temporarily unavailable.'},{status:error.status===429?429:502,headers:{'retry-after':'60'}});}finally{candleRequests.delete(key);}
}
