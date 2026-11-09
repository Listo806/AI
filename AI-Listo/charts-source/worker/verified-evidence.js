// Server-owned candle evidence. Browser-provided indicator and MTF values are untrusted.
const number=n=>Number.isFinite(n)?n:null;
function sma(values,period){return values.length<period?null:number(values.slice(-period).reduce((a,b)=>a+b,0)/period);}
function ema(values,period){if(values.length<period)return null;let v=values.slice(0,period).reduce((a,b)=>a+b,0)/period;for(const x of values.slice(period))v+=(x-v)*2/(period+1);return number(v);}
function rsi(values,period=14){if(values.length<=period)return null;let gain=0,loss=0;for(let i=1;i<=period;i++){const d=values[i]-values[i-1];gain+=Math.max(d,0);loss+=Math.max(-d,0);}gain/=period;loss/=period;for(let i=period+1;i<values.length;i++){const d=values[i]-values[i-1];gain=(gain*(period-1)+Math.max(d,0))/period;loss=(loss*(period-1)+Math.max(-d,0))/period;}return loss===0?(gain===0?50:100):number(100-100/(1+gain/loss));}
function atr(bars,period=14){if(bars.length<period+1)return null;const ranges=bars.map((b,i)=>i?Math.max(b.high-b.low,Math.abs(b.high-bars[i-1].close),Math.abs(b.low-bars[i-1].close)):b.high-b.low);let v=ranges.slice(0,period).reduce((a,b)=>a+b,0)/period;for(const x of ranges.slice(period))v=(v*(period-1)+x)/period;return number(v);}
function stochastic(bars,period=14){if(bars.length<period)return null;const last=bars.slice(-period),high=Math.max(...last.map(b=>b.high)),low=Math.min(...last.map(b=>b.low));return high===low?50:number(100*(bars.at(-1).close-low)/(high-low));}
function macd(values){if(values.length<35)return null;return number(ema(values,12)-ema(values,26));}
function bollinger(values,period=20,multiplier=2){const basis=sma(values,period);if(basis===null)return null;const sd=Math.sqrt(values.slice(-period).reduce((a,v)=>a+(v-basis)**2,0)/period);return {basis,upper:basis+multiplier*sd,lower:basis-multiplier*sd};}
function sessionVwap(bars){if(!bars.length)return null;const day=new Date(bars.at(-1).time).toISOString().slice(0,10);let weighted=0,total=0;for(const b of bars){if(new Date(b.time).toISOString().slice(0,10)!==day)continue;if(!Number.isFinite(b.volume)||b.volume<0)return null;weighted+=(b.high+b.low+b.close)/3*b.volume;total+=b.volume;}return total?number(weighted/total):null;}
function validateProviderBars(data,now,duration){
 if(data.provider!=='biquote'||!Number.isFinite(data.fetchedAt)||data.fetchedAt>now+5000||now-data.fetchedAt>120000||!Array.isArray(data.values)||data.values.length>10000)throw Error('Unverified or stale feed');
 const bars=[];let last=-Infinity;
 for(const b of data.values){const time=Date.parse(b.date),{open,high,low,close}=b,volume=b.volume;
  if(![time,open,high,low,close].every(Number.isFinite)||time<=last||time>now+duration||low<=0||low>Math.min(open,close)||high<Math.max(open,close)||high<low||(volume!==null&&volume!==undefined&&(!Number.isFinite(volume)||volume<0)))throw Error('Invalid provider candle');
  last=time;bars.push({time,open,high,low,close,volume:volume??null,isOpen:!!b.isOpen});
 }
 return bars;
}
async function verifiedChartEvidence(snapshot){
 const duration=Heisenberg.durations[snapshot.frame];if(!Number.isFinite(duration))throw Error('Unsupported timeframe');
 const response=await candleResponse(new URL('https://charts.internal/api/candles?'+new URLSearchParams({symbol:snapshot.symbol,interval:snapshot.frame})));
 if(!response.ok)throw Error('Approved feed unavailable');const data=await response.json();
 if(data.symbol!==snapshot.symbol||data.interval!==snapshot.frame)throw Error('Feed market mismatch');
 const now=Date.now(),bars=validateProviderBars(data,now,duration);
 const closed=bars.filter(b=>!b.isOpen&&b.time+duration<=snapshot.capturedAt);
 if(closed.length<35||now-closed.at(-1).time>Math.max(duration*3,15*60000))throw Error('Insufficient or stale completed candles');
 const candles=closed.slice(-600),closes=closed.map(b=>b.close),recent=closed.slice(-20),bb=bollinger(closes),donchian=closed.slice(-20);
 // Use the exact Heisenberg engine already bundled into the Worker, never client MTF claims.
 const engineBars=closed.map(b=>({...b,date:new Date(b.time).toISOString(),endTime:b.time+duration}));
 const frameEntries={};
 for(const tf of ['1min','5min','15min','30min','1h','4h']){
  if(tf===snapshot.frame){frameEntries[tf]={bars:engineBars};continue;}
  try{
   const r=await candleResponse(new URL('https://charts.internal/api/candles?'+new URLSearchParams({symbol:snapshot.symbol,interval:tf})));
   if(!r.ok)continue;
   const payload=await r.json();
   if(payload.symbol!==snapshot.symbol||payload.interval!==tf)continue;
   const verified=validateProviderBars(payload,now,Heisenberg.durations[tf]);
   const completed=verified.filter(b=>!b.isOpen&&b.time+Heisenberg.durations[tf]<=snapshot.capturedAt);
   if(completed.length<35)continue;
   frameEntries[tf]={bars:completed.map(b=>({...b,date:new Date(b.time).toISOString(),endTime:b.time+Heisenberg.durations[tf]}))};
  }catch{ /* MTF evidence is unavailable, never inferred */ }
 }
 const settings=snapshot.settings||{trama:{length:99,source:'close'},rsi:{length:14,source:'close'},bb:{length:20,mult:2,ma:'SMA',source:'close'},vwap:{anchor:'auto',sessionTimezone:'America/New_York',sessionStart:'17:00',length:14,source:'hlc3',mode:'stdev'},engine:{}};
 const heisenberg=typeof Heisenberg.compute==='function'?Heisenberg.compute(engineBars,frameEntries,snapshot.frame,settings.engine,snapshot.capturedAt):null;
 const mtf=Object.fromEntries(Object.keys(snapshot.mtf).map(tf=>[tf,heisenberg?.table?.[tf]||'Unavailable']));
 const barValues=closed.map(b=>({...b,date:new Date(b.time).toISOString()}));
 const configuredTrama=typeof Indicators!=='undefined'?Indicators.trama(barValues,settings.trama.length,settings.trama.source):[];
 const configuredVwap=typeof Indicators!=='undefined'?Indicators.autoVwap(barValues,settings.vwap,snapshot.frame):{middle:[]};
 const configuredBB=typeof Indicators!=='undefined'?Indicators.bollingerAdvanced(barValues,settings.bb.length,settings.bb.mult,settings.bb.ma,settings.bb.source):{middle:[]};
 const rsiInput=barValues.map(b=>settings.rsi.source==='hl2'?(b.high+b.low)/2:settings.rsi.source==='hlc3'?(b.high+b.low+b.close)/3:settings.rsi.source==='ohlc4'?(b.open+b.high+b.low+b.close)/4:b[settings.rsi.source]);
 const indicators=[{name:'TRAMA',value:number(configuredTrama.at(-1))},{name:'RSI',value:rsi(rsiInput,settings.rsi.length)},{name:'SMA',value:sma(closes,20)},{name:'Moving Average',value:sma(closes,20)},{name:'EMA',value:ema(closes,20)},{name:'VWAP AA',value:number(configuredVwap.middle.at(-1))},{name:'Bollinger basis',value:number(configuredBB.middle.at(-1))},{name:'Volume',value:closed.at(-1).volume},{name:'MACD',value:macd(closes)},{name:'ATR',value:atr(closed)},{name:'Stochastic',value:stochastic(closed)},{name:'Donchian Channels',value:number((Math.max(...donchian.map(b=>b.high))+Math.min(...donchian.map(b=>b.low)))/2)}];
 return {candles,levels:{recentHigh:Math.max(...recent.map(b=>b.high)),recentLow:Math.min(...recent.map(b=>b.low))},indicators,mtf,provenance:'server_fetched_biquote_closed_candles',marketData:{provider:data.provider,fetchedAt:data.fetchedAt,volumeType:data.volumeType,barCount:closed.length},warnings:['Server-calculated indicator settings are validated. Alternate-timeframe Bollinger Bands are not yet supported.','Heisenberg readings are computed server-side with default settings; public chart still contains the engine and requires migration before production approval.']};
}
