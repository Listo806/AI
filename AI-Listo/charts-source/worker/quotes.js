const instruments=["EUR/USD","GBP/USD","USD/JPY","USD/CHF","USD/CAD","AUD/USD","NZD/USD","GBP/JPY","EUR/JPY","AUD/JPY","CAD/JPY","CHF/JPY","NZD/JPY","EUR/GBP","EUR/AUD","EUR/CAD","EUR/CHF","GBP/AUD","GBP/CAD","AUD/NZD","XAU/USD","XAG/USD","XCU/USD","XPT/USD","XPD/USD","USOIL","UKOIL","XNG/USD","US500","USTEC","US30","DE30","UK100","JP225","AUS200","STOXX50","DXY"];
const providerQuoteCache=new Map(),providerQuoteRequests=new Map();
export async function quoteResponse(requestUrl){
 const requested=requestUrl?.searchParams.getAll('symbol')||[];const chosen=requested.length?requested.filter(s=>instruments.includes(s)).slice(0,10):['USD/JPY','XAG/USD','GBP/JPY','XAU/USD'];const quoteKey=chosen.join('|');if(!chosen.length)return Response.json({error:'Unsupported markets'},{status:400});const providerQuotes=providerQuoteCache.get(quoteKey);
 if(providerQuotes&&providerQuotes.quoteKey===quoteKey&&Date.now()-providerQuotes.fetchedAt<5000)return Response.json(providerQuotes,{headers:{'cache-control':'no-store'}});
 if(!providerQuoteRequests.has(quoteKey))providerQuoteRequests.set(quoteKey,(async()=>{
  const url=new URL('https://biquote.io/api/latest');chosen.forEach(s=>url.searchParams.append('symbols',s.replace('/','')));
  const r=await fetch(url,{signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('Quotes unavailable');const raw=await r.json(),rows=Array.isArray(raw)?raw:raw.ticks||raw.data||Object.values(raw);
  if(!Array.isArray(rows))throw Error('Invalid quote response');const quotes=rows.flatMap(q=>{const symbol=instruments.find(s=>s.replace('/','')===q.symbol),bid=Number(q.bid),ask=Number(q.ask),timestamp=Date.parse(q.timestamp);return symbol&&bid>0&&ask>=bid&&Number.isFinite(timestamp)?[{symbol,price:(bid+ask)/2,bid,ask,timestamp,source:'biquote · MT5 midpoint · tick stream',stale:q.stale,marketState:q.marketState,dayDiffPercent:typeof q.dayDiffPercent==='number'&&Number.isFinite(q.dayDiffPercent)?q.dayDiffPercent:null}]:[];});
  const result={quoteKey,quotes,errors:chosen.filter(s=>!quotes.some(q=>q.symbol===s)).map(symbol=>({symbol,message:'Quote unavailable'})),fetchedAt:Date.now(),refreshAfter:15};if(providerQuoteCache.size>100)providerQuoteCache.delete(providerQuoteCache.keys().next().value);providerQuoteCache.set(quoteKey,result);return result;
 })());
 try{return Response.json(await providerQuoteRequests.get(quoteKey),{headers:{'cache-control':'no-store'}});}catch{return Response.json({error:'Live quote feed temporarily unavailable'},{status:502});}finally{providerQuoteRequests.delete(quoteKey);}
}
