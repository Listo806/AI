'use strict';
const $ = id => document.getElementById(id);
const markets = [{name:'USD/JPY',symbol:'USD/JPY',category:'FOREIGN EXCHANGE'},{name:'Silver',symbol:'XAG/USD',category:'PRECIOUS METAL'},{name:'GBP/JPY',symbol:'GBP/JPY',category:'FOREIGN EXCHANGE'},{name:'Gold',symbol:'XAU/USD',category:'PRECIOUS METAL'}];
try{const slots=JSON.parse(localStorage.getItem('market-watch-slots-v1')||'null');if(Array.isArray(slots)&&slots.length===4&&new Set(slots).size===4&&slots.every(s=>MarketCatalog.some(m=>m.symbol===s)))slots.forEach((s,i)=>Object.assign(markets[i],MarketCatalog.find(m=>m.symbol===s)));}catch{}
const colors = ['#47d7ad','#99bfff','#ba91f3','#efc555'];
let selected = 0, frame = '1min', apiKey = '', count = 420, offset = -84, hover = -1, requestId = 0;
let chartStyle='candles';
const oscView={count:420,offset:-84};let hoverPane='price',crosshair=null;
const cache = new Map();
try{const saved=JSON.parse(localStorage.getItem('market-history-biquote-v1')||'[]');for(const [k,entry] of saved){const [symbol,tf]=k.split('|');if(markets.some(m=>m.symbol===symbol)&&Object.hasOwn(Heisenberg.durations,tf)&&entry?.bars?.length&&Number.isFinite(entry.fetchedAt))cache.set(k,{...entry,bars:normalize(entry.bars)});}}catch{}
function saveHistoryBackup(k,entry){try{const entries=JSON.parse(localStorage.getItem('market-history-biquote-v1')||'[]').filter(([key])=>key!==k);entries.push([k,entry]);localStorage.setItem('market-history-biquote-v1',JSON.stringify(entries.slice(-12)));}catch{}}

const liveQuotes = new Map();
const verticalScales={price:{factor:1,center:null},rsi:{factor:2,center:50}};
let nativeHistoryBlockedUntil=0;
const streamLastTicks=new Map();let streamDrawPending=false;let streamHasConnected=false;
let nativeLoadRunning=false;
let quoteRequestRunning = false;
let currentPriceBounds={center:0,span:1};
let config = {bbPeriod:20, bbMult:2, rsiPeriod:14, maPeriod:9, vwapAnchor:'session'};
try {const saved=JSON.parse(localStorage.getItem('custom-market-settings-v2')); if(saved && [saved.bbPeriod,saved.rsiPeriod,saved.maPeriod].every(n=>Number.isInteger(n)&&n>=2&&n<=200) && Number.isFinite(saved.bbMult)&&saved.bbMult>=.1&&saved.bbMult<=10 && ['month','session','history'].includes(saved.vwapAnchor)) config=saved;} catch {}

const engineConfig={...Heisenberg.defaults};
const engineInputs=[['tramaLength','TRAMA / EMA length',1,200,1],['snakeSmooth','Snake smoothing',1,100,1],['snakeWidthAtr','Snake width · ATR',.05,10,.05],['cooldownBars','Signal cooldown bars',0,500,1],['vwapDevMult','VWAP deviation',.1,10,.1],['rocLength','Momentum ROC length',1,200,1],['candlePowerMult','Candle expansion · ATR',.05,10,.05],['bullRsiThreshold','Bull RSI threshold',0,100,.5],['bearRsiThreshold','Bear RSI threshold',0,100,.5]];
try{const saved=JSON.parse(localStorage.getItem('heisenberg-settings'));if(saved){engineInputs.forEach(([key,,min,max,step])=>{const value=saved[key];if(Number.isFinite(value)&&value>=min&&value<=max&&(step!==1||Number.isInteger(value)))engineConfig[key]=value;});['useMTFFilter','useRsiRegimeFilter','showFullAlignment'].forEach(key=>{if(typeof saved[key]==='boolean')engineConfig[key]=saved[key];});}}catch{}
engineInputs.forEach(([key,label,min,max,step])=>{const wrapper=document.createElement('label');wrapper.className='field';wrapper.textContent=label;const input=document.createElement('input');input.id='engine-'+key;input.type='number';input.min=min;input.max=max;input.step=step;input.value=engineConfig[key];input.required=true;wrapper.append(input);$('engineFields').append(wrapper);});
[['useMTFFilter','Multi-timeframe filter'],['useRsiRegimeFilter','RSI regime filter'],['showFullAlignment','Full alignment markers']].forEach(([key,label])=>{const wrapper=document.createElement('label');wrapper.className='toggle';const input=document.createElement('input');input.id='engine-'+key;input.type='checkbox';input.checked=engineConfig[key];wrapper.append(input,document.createTextNode(label));$('engineToggles').append(wrapper);});
function readEngineSettings(){engineInputs.forEach(([key])=>engineConfig[key]=Number($('engine-'+key).value));['useMTFFilter','useRsiRegimeFilter','showFullAlignment'].forEach(key=>engineConfig[key]=$('engine-'+key).checked);try{localStorage.setItem('heisenberg-settings',JSON.stringify(engineConfig));}catch{}}
function computeEngine(){const entries=Object.fromEntries(Object.keys(Heisenberg.durations).map(tf=>[tf,cache.get(markets[selected].symbol+'|'+tf)]));return Heisenberg.compute(bars(),entries,frame,EngineSettings.inputs);}
function updateMTF(engine) {
  document.querySelector('.mtf-table').style.visibility=EngineSettings.style.tables?'visible':'hidden';
  const body = $('mtfRows');
  body.replaceChildren();
  const row = document.createElement('tr');
  Object.entries(engine.table).forEach(([timeframe, state]) => {
    const cell = document.createElement('td');
    const label = document.createElement('small');
    const value = document.createElement('span');
    label.textContent = timeframe.replace('min', 'm');
    value.textContent = state === 'Unavailable' ? 'No data' : state;
    cell.className = state.toLowerCase();
    cell.title = state === 'Unavailable'
      ? 'Needs candles and volume for this timeframe'
      : label.textContent + ' · ' + state;
    cell.append(label, value);
    row.append(cell);
  });
  body.append(row);
  $('tramaLabel').textContent=[TramaSettings.settings.inputs?TramaSettings.settings.length+' · '+TramaSettings.settings.source:'',TramaSettings.settings.values?(()=>{const v=TramaSettings.series(bars()).at(-1);return Number.isFinite(v)?v.toFixed(TramaSettings.settings.precision==='default'?3:Number(TramaSettings.settings.precision)):'';})():''].filter(Boolean).join(' · ');
  $('engineStatus').textContent = bars().length && !entry()?.reference && bars().every(bar => Number.isFinite(bar.volume))
    ? 'Heisenberg active · closed candles'
    : 'Heisenberg awaits OHLC + volume';
}
let mtfRequest=0;
async function loadMTF(){
  if(!apiKey)return;
  const id=++mtfRequest,symbol=markets[selected].symbol,secret=apiKey;
  for(const tf of ['1min','5min','15min','30min','1h','4h']){
    if(id!==mtfRequest||symbol!==markets[selected].symbol||secret!==apiKey)return;
    if(Date.now()-(cache.get(symbol+'|'+tf)?.fetchedAt||0)<60000)continue;
    try{
      const url=new URL('https://api.twelvedata.com/time_series');url.search=new URLSearchParams({symbol,interval:tf,outputsize:'500',timezone:'UTC',apikey:secret});
      const response=await fetch(url,{signal:AbortSignal.timeout(20000),referrerPolicy:'no-referrer'});const json=await response.json();if(!response.ok||json.status==='error')throw Error(json.message||'MTF feed unavailable');
      if(id!==mtfRequest||symbol!==markets[selected].symbol||secret!==apiKey)return;
      cache.set(symbol+'|'+tf,{bars:normalize(json.values),source:'Twelve Data · '+tf,fetchedAt:Date.now()});render();
    }catch(error){$('engineStatus').textContent='MTF incomplete · check data access';break;}
  }
}

const key = () => markets[selected].symbol+'|'+frame;
const entry = () => cache.get(key());
const bars = () => entry()?.bars || [];
markets.forEach((market,index)=>{const button=document.createElement('button');button.style.setProperty('--accent',colors[index]);const name=document.createElement('span');name.className='market-name';name.textContent=market.name;const price=document.createElement('strong');price.className='market-price';price.textContent='—';const detail=document.createElement('small');detail.className='market-quote-status';detail.textContent='Connecting quote';const light=document.createElement('i');light.className='price-light';button.append(name,price,detail,light);button.onclick=()=>{verticalScales.price={factor:1,center:null};$('chartNotice').hidden=true;selected=index;offset=-Math.round(count*.2);hover=-1;crosshair=null;requestId++;render();if(!entry())loadFeed();else if(apiKey)loadMTF();else loadNativeMTF();};$('markets').append(button);});
function render(){const market=markets[selected];document.documentElement.style.setProperty('--selected',colors[selected]);$('marketTitle').textContent=market.name;$('symbol').textContent=market.symbol+(entry()?.reference?' · Reference price line · ':chartStyle==='candles'?' · Candles · ':' · Price line · ')+({'1day':'Daily','4h':'4 hour','1h':'1 hour','30min':'30 minute','15min':'15 minute','5min':'5 minute','1min':'1 minute'}[frame]);$('category').textContent=market.category;const attribution=$('attribution');attribution.hidden=!(entry()?.reference&&market.category==='PRECIOUS METAL');attribution.href='https://standardbullion.com/market-data';attribution.textContent='Data by Standard Bullion';$('priceChart').setAttribute('aria-label',entry()?.reference?'Daily reference price line with Bollinger Bands':'Candlestick chart with Bollinger Bands and VWAP');document.querySelectorAll('nav button').forEach((button,i)=>{button.classList.toggle('active',i===selected);});document.querySelectorAll('[data-frame]').forEach(button=>button.classList.toggle('active',button.dataset.frame===frame));const data=bars(),last=data.at(-1),previous=data.at(-2);$('empty').hidden=!!data.length;const intraday=frame!=='1day';$('empty').querySelector('h3').textContent=intraday?'Intraday data needed':'Loading market history';$('empty').querySelector('p').textContent=intraday?'Waiting for Live feed candles. If its request/quota limit is reached, loading resumes after the provider allows requests.':'Daily reference history loads automatically. Use Refresh if the provider is temporarily unavailable.';$('lastPrice').textContent=last?format(last.close):'—';$('change').textContent=previous?((last.close-previous.close)>=0?'+':'')+((last.close/previous.close-1)*100).toFixed(2)+'% · vs previous observation':last?'Last candle '+last.date:'Connect a feed to see prices';$('dataStatus').textContent=entry()?entry().source+' · '+data.length+' candles · last '+last.date:'Awaiting market data';$('feedState').textContent=apiKey?'● Custom feed':entry()?'● Daily history connected':'◌ Loading daily history';$('bbLabel').textContent=config.bbPeriod+', '+config.bbMult;$('rsiLabel').textContent=config.rsiPeriod+' · Wilder';$('maLabel').textContent=config.maPeriod+' · SMA';$('anchorLabel').textContent=[VwapAA.settings.inputs?VwapAA.settings.anchor+' · '+VwapAA.settings.source+' · '+(VwapAA.settings.mode==='stdev'?'σ':'%')+' '+VwapAA.settings.multipliers.filter((_,i)=>VwapAA.settings.enabled[i]).join(', '):'',VwapAA.settings.values&&data.length?(()=>{const v=VwapAA.plots(data,frame)[0].values.at(-1);return Number.isFinite(v)?v.toFixed(VwapAA.settings.precision==='default'?3:Number(VwapAA.settings.precision)):'';})():''].filter(Boolean).join(' · ');$('vwapStatus').textContent=data.length?(data.every(b=>Number.isFinite(b.volume))?'VWAP uses supplied volume · '+$('anchorLabel').textContent:'VWAP unavailable where volume is missing'):'VWAP requires volume supplied by your feed.';updateLiveQuoteLabels();draw();setTimeout(()=>{ensureBBHistory();},0);}

function syncIndicatorButtons(){
  const canUseCandles=bars().length>0&&!entry()?.reference;
  $('candlesStyle').classList.toggle('active',canUseCandles&&chartStyle==='candles');
  $('lineStyle').classList.toggle('active',!canUseCandles||chartStyle==='line');
  $('candlesStyle').setAttribute('aria-pressed',String(canUseCandles&&chartStyle==='candles'));
  $('lineStyle').setAttribute('aria-pressed',String(!canUseCandles||chartStyle==='line'));
  $('candlesStyle').title=canUseCandles?'Green/red candlesticks with price wicks':'Candlesticks require open, high, low and close history. Current feed is a daily reference-price line.';
  document.querySelectorAll('.legend label, .rsi-header label').forEach(label=>{
    const input=label.querySelector('input');
    label.classList.toggle('indicator-enabled',input.checked);
  });
}

function format(value,symbol=markets[selected].symbol){const digits=symbol.includes('/')&&!symbol.startsWith('X')&&!symbol.endsWith('JPY')?5:3;return value.toLocaleString('en-US',{minimumFractionDigits:digits,maximumFractionDigits:digits});}
function normalize(rows){if(!Array.isArray(rows)||!rows.length)throw Error('The feed returned no candles for this pair.');const result=rows.map(row=>{const date=String(row.datetime??row.date??'').replace(' ','T');const time=Date.parse(date.match(/T/) && !/[Zz]|[+-]\d\d:\d\d$/.test(date)?date+'Z':date);const bar={date,time,open:Number(row.open),high:Number(row.high),low:Number(row.low),close:Number(row.close),volume:row.volume===undefined||row.volume===null||row.volume===''?null:Number(row.volume)};if(!Number.isFinite(time)||![bar.open,bar.high,bar.low,bar.close].every(n=>Number.isFinite(n)&&n>0)||bar.high<Math.max(bar.open,bar.close)||bar.low>Math.min(bar.open,bar.close)||bar.high<bar.low||(bar.volume!==null&&(!Number.isFinite(bar.volume)||bar.volume<0)))throw Error('Invalid candle. Check dates, OHLC prices, and volume.');return bar;}).sort((a,b)=>a.time-b.time);if(new Set(result.map(b=>b.time)).size!==result.length)throw Error('Duplicate candle dates. Import one candle per timestamp.');return result;}
async function loadFeed(){if(!apiKey){
  const symbol=markets[selected].symbol,targetFrame=frame;
  try{
    const native=await fetchNativeHistory(symbol,targetFrame);
    cache.set(symbol+'|'+targetFrame,native);replayRecentTick(symbol);
    if(symbol===markets[selected].symbol&&targetFrame===frame){$('chartNotice').hidden=true;render();loadNativeMTF();}
  }catch(error){
    if(symbol===markets[selected].symbol&&targetFrame===frame){if(frame==='1day')await loadPublic(selected);showFeedNotice(error.name==='TimeoutError'||error.name==='AbortError'?'Candle history is taking longer to load. Press Refresh to retry.':error.message);loadNativeMTF();}
  }
  return;
}const targetKey=key(),id=++requestId,symbol=markets[selected].symbol,interval=frame;$('dataStatus').textContent='Loading '+symbol+'…';$('feedError').textContent='';const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),20000);try{const url=new URL('https://api.twelvedata.com/time_series');url.search=new URLSearchParams({symbol,interval,outputsize:'500',timezone:'UTC',apikey:apiKey});const response=await fetch(url,{signal:controller.signal,referrerPolicy:'no-referrer'});const json=await response.json();if(id!==requestId)return;if(!response.ok||json.status==='error')throw Error(json.message||'Provider request failed. Check your key and plan access.');const data=normalize(json.values);cache.set(targetKey,{bars:data,source:'Twelve Data · loaded '+new Date().toISOString().slice(0,16).replace('T',' ')+' UTC',fetchedAt:Date.now()});offset=-Math.round(count*.2);$('dataDialog').close();render();if($('engineOn').checked)loadMTF();}catch(error){if(id!==requestId)return;const message=error.name==='AbortError'?'Provider request timed out. Try Refresh.':error.message.replaceAll(apiKey,'[key]');$('feedError').textContent=message;$('dataStatus').textContent='Feed error · '+message;}finally{clearTimeout(timer);}}
function canvasContext(canvas){const rect=canvas.getBoundingClientRect(),ratio=window.devicePixelRatio||1;canvas.width=Math.round(rect.width*ratio);canvas.height=Math.round(rect.height*ratio);const ctx=canvas.getContext('2d');ctx.scale(ratio,ratio);ctx.fillStyle='#101010';ctx.fillRect(0,0,rect.width,rect.height);return {ctx,width:rect.width,height:rect.height};}
function draw(){const engine=computeEngine();syncIndicatorButtons();updateMTF(engine);const data=bars(),viewStart=data.length-count-offset,start=Math.max(0,Math.floor(viewStart)),end=Math.min(data.length,Math.ceil(viewStart+count)),visible=data.slice(start,Math.max(start,end));const oscStartFloat=data.length-oscView.count-oscView.offset,oscStart=Math.max(0,Math.floor(oscStartFloat)),oscEnd=Math.min(data.length,Math.ceil(oscStartFloat+oscView.count));const close=data.map(b=>b.close),bbPlots=BBSettings.plots(data,frame,cache.get(markets[selected].symbol+'|'+BBSettings.settings.timeframe)?.bars),osc=OscSettings.series(data),rsi=osc.rsi,ma=osc.ma,aaPlots=VwapAA.plots(data,frame),vwap=aaPlots[0].values,tramaPlot=TramaSettings.series(data);const bbDigits=BBSettings.settings.precision==='default'?3:Number(BBSettings.settings.precision);$('bbOn').closest('label').title=[BBSettings.settings.inputs?BBSettings.settings.length+' · '+BBSettings.settings.ma+' · '+BBSettings.settings.source+' · '+BBSettings.settings.mult+'σ':'',BBSettings.settings.values?bbPlots.map((p,i)=>['Basis','Upper','Lower'][i]+': '+(Number.isFinite(p.values.at(-1))?p.values.at(-1).toFixed(bbDigits):'—')).join(' · '):''].filter(Boolean).join(' | ');const top=canvasContext($('priceChart')),bottom=canvasContext($('rsiChart'));const left=15,right=78;function grid(chart,minimum,maximum,steps){const {ctx,width,height}=chart;ctx.font='600 13px system-ui';for(let i=0;i<=steps;i++){const y=15+(height-43)*i/steps;ctx.strokeStyle='#202c39';ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(width-right,y);ctx.stroke();ctx.fillStyle='#f3f6ff';ctx.fillText(data.length?(maximum-(maximum-minimum)*i/steps).toFixed(markets[selected].category==='FOREIGN EXCHANGE'&&!markets[selected].symbol.endsWith('JPY')?5:maximum>100?2:3):'—',width-right+10,y+3);}for(let i=0;i<5;i++){const x=left+(width-right-left)*i/4;ctx.strokeStyle='#1c2834';ctx.beginPath();ctx.moveTo(x,15);ctx.lineTo(x,height-28);ctx.stroke();}}
let low=0,high=1;if(visible.length){let values=visible.flatMap(b=>[b.low,b.high]);if($('bbOn').checked)bbPlots.filter(p=>p.show).forEach(p=>values.push(...p.values.slice(start,end).filter(Number.isFinite)));if($('vwapOn').checked){aaPlots.filter(p=>p.show).forEach(p=>values.push(...p.values.slice(start,end).filter(Number.isFinite)));}if($('tramaOn').checked&&TramaSettings.settings.show)values.push(...tramaPlot.slice(start,end).filter(Number.isFinite));if($('engineOn').checked&&!entry()?.reference){EngineSettings.plots(engine).filter(p=>p.show).forEach(p=>values.push(...p.values.slice(start,end).filter(Number.isFinite)));}low=Math.min(...values);high=Math.max(...values);const pad=Math.max((high-low)*.08,high*.0001);low-=pad;high+=pad;}const autoCenter=(high+low)/2,range=(high-low)/verticalScales.price.factor;const priceCenter=verticalScales.price.center??autoCenter;currentPriceBounds={center:priceCenter,span:range};low=priceCenter-range/2;high=priceCenter+range/2;grid(top,low,high,5);const plotWidth=top.width-right-left,step=plotWidth/count,x=i=>left+(start-viewStart+i+.5)*step,y=value=>15+(high-value)/(high-low)*(top.height-43),ry=value=>15+(verticalScales.rsi.center+50/verticalScales.rsi.factor-value)/(100/verticalScales.rsi.factor)*(bottom.height-43);function line(chart,values,color,mapY,style){const isOsc=chart===bottom,sliceStart=isOsc?oscStart:start,sliceEnd=isOsc?oscEnd:end,plotX=isOsc?(i=>left+(oscStart-oscStartFloat+i+.5)*(bottom.width-right-left)/oscView.count):x;const {ctx}=chart;ctx.strokeStyle=color;ctx.lineWidth=color==='#ffe638'?3:color==='#ff263e'?2.5:(color==='#3293ff'||color==='#ff334c')?2:1.4;if(style){ctx.lineWidth=style.width;ctx.setLineDash(style.style==='dashed'?[7,5]:style.style==='dotted'?[2,4]:[]);}ctx.beginPath();let active=false;values.slice(sliceStart,sliceEnd).forEach((value,i)=>{if(!Number.isFinite(value)){active=false;return;}if(active)ctx.lineTo(plotX(i),mapY(value));else ctx.moveTo(plotX(i),mapY(value));active=true;});ctx.stroke();ctx.setLineDash([]);}
if($('bbOn').checked){const c=top.ctx,u=bbPlots[1],l=bbPlots[2];if(BBSettings.settings.background&&u.show&&l.show){c.save();c.fillStyle=BBSettings.settings.fill;c.globalAlpha=BBSettings.settings.opacity/100;let segment=[];const paint=()=>{if(!segment.length)return;c.beginPath();segment.forEach((v,i)=>i?c.lineTo(x(v.i),y(v.u)):c.moveTo(x(v.i),y(v.u)));segment.reverse().forEach(v=>c.lineTo(x(v.i),y(v.l)));c.closePath();c.fill();segment=[];};for(let i=start;i<end;i++){if(Number.isFinite(u.values[i])&&Number.isFinite(l.values[i]))segment.push({i:i-start,u:u.values[i],l:l.values[i]});else paint();}paint();c.restore();}bbPlots.filter(p=>p.show&&p.priceLine).forEach(p=>{const v=p.values.at(-1);if(!Number.isFinite(v))return;c.save();c.strokeStyle=p.color;c.lineWidth=1;c.setLineDash([4,4]);c.beginPath();c.moveTo(left,y(v));c.lineTo(top.width-right,y(v));c.stroke();c.restore();});}
if($('vwapOn').checked){const c=top.ctx;if(VwapAA.settings.background){for(let k=0;k<3;k++){const u=aaPlots[1+k*2],l=aaPlots[2+k*2];if(!u.show||!l.show)continue;c.save();c.fillStyle=VwapAA.settings.fill;c.globalAlpha=VwapAA.settings.opacity/100;let segment=[];const paint=()=>{if(!segment.length)return;c.beginPath();segment.forEach((v,i)=>i?c.lineTo(x(v.i),y(v.u)):c.moveTo(x(v.i),y(v.u)));segment.reverse().forEach(v=>c.lineTo(x(v.i),y(v.l)));c.closePath();c.fill();segment=[];};for(let i=start;i<end;i++){if(Number.isFinite(u.values[i])&&Number.isFinite(l.values[i]))segment.push({i:i-start,u:u.values[i],l:l.values[i]});else paint();}paint();c.restore();}}aaPlots.filter(p=>p.show&&p.priceLine).forEach(p=>{const v=p.values.at(-1);if(!Number.isFinite(v))return;c.save();c.strokeStyle=p.color;c.lineWidth=1;c.setLineDash([4,4]);c.beginPath();c.moveTo(left,y(v));c.lineTo(top.width-right,y(v));c.stroke();c.restore();});}
if($('bbOn').checked){bbPlots.filter(p=>p.show).forEach(p=>line(top,p.values,p.color,y,p));}if(!entry()?.reference&&chartStyle==='candles'&&$('priceOn').checked)visible.forEach((bar,i)=>{const ctx=top.ctx;ctx.strokeStyle=ctx.fillStyle=bar.close>=bar.open?'#64c3a5':'#e07982';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x(i),y(bar.high));ctx.lineTo(x(i),y(bar.low));ctx.stroke();ctx.fillRect(x(i)-Math.max(1,step*.6)/2,Math.min(y(bar.open),y(bar.close)),Math.max(1,step*.6),Math.max(1,Math.abs(y(bar.open)-y(bar.close))));});if((entry()?.reference||chartStyle==='line')&&$('priceOn').checked){line(top,close,'#d8e4ed',y);const ctx=top.ctx;if(visible.length){const last=visible.length-1;ctx.fillStyle='#d8e4ed';ctx.beginPath();ctx.arc(x(last),y(visible[last].close),3.5,0,Math.PI*2);ctx.fill();}}if($('vwapOn').checked){aaPlots.filter(p=>p.show).forEach(p=>line(top,p.values,p.color,y,p));}

if($('tramaOn').checked&&TramaSettings.settings.show){line(top,tramaPlot,TramaSettings.settings.color,y,TramaSettings.settings);}
if($('engineOn').checked&&!entry()?.reference){
 const ctx=top.ctx,style=EngineSettings.style,plots=EngineSettings.plots(engine);
 for(let i=1;i<visible.length;i++){
  const at=start+i,previous=at-1,state=engine.bias[at]==='Bullish'?'bull':engine.bias[at]==='Bearish'?'bear':'neutral';
  if(style.fill&&plots[0].show&&plots[1].show&&[engine.upper[at],engine.lower[at],engine.upper[previous],engine.lower[previous]].every(Number.isFinite)){ctx.save();ctx.globalAlpha=style.fillOpacity/100;ctx.fillStyle=style[state==='bull'?'fillBull':state==='bear'?'fillBear':'fillNeutral'];ctx.beginPath();ctx.moveTo(x(i-1),y(engine.upper[previous]));ctx.lineTo(x(i),y(engine.upper[at]));ctx.lineTo(x(i),y(engine.lower[at]));ctx.lineTo(x(i-1),y(engine.lower[previous]));ctx.closePath();ctx.fill();ctx.restore();}
  plots.filter(p=>p.show&&Number.isFinite(p.values[at])&&Number.isFinite(p.values[previous])).forEach(p=>{ctx.save();ctx.strokeStyle=p[state];ctx.globalAlpha=p.opacity/100;ctx.lineWidth=p.width;ctx.setLineDash(p.style==='dashed'?[7,5]:p.style==='dotted'?[2,4]:[]);ctx.beginPath();ctx.moveTo(x(i-1),y(p.values[previous]));ctx.lineTo(x(i),y(p.values[at]));ctx.stroke();ctx.restore();});
 }
 function marker(signal,text){if(signal.index<start||signal.index>=end)return;const i=signal.index-start,buy=signal.side==='BUY',side=buy?'bull':'bear',mtf=text==='MTF';if(mtf&&!style[side+'Marker'])return;if(!mtf&&!style.paneLabels)return;const bar=data[signal.index],below=mtf?style[side+'Position']==='below':buy,price=below?bar.low:bar.high,py=Math.max(20,Math.min(top.height-40,y(price)+(below?19:-19)));ctx.fillStyle=mtf?style[side+'Color']:buy?'#38af62':'#ee3e56';const shape=mtf?style[side+'Shape']:'label';if(shape==='label'){ctx.fillRect(x(i)-15,py-8,30,16);ctx.fillStyle='#fff';ctx.font='bold 8px system-ui';ctx.fillText(text,x(i)-12,py+3);}else if(shape==='triangle'){ctx.beginPath();ctx.moveTo(x(i),py+(below?-8:8));ctx.lineTo(x(i)-7,py+(below?7:-7));ctx.lineTo(x(i)+7,py+(below?7:-7));ctx.closePath();ctx.fill();}else{ctx.font='bold 20px system-ui';ctx.fillText(below?'↑':'↓',x(i)-7,py+6);}}
 engine.signals.forEach(signal=>marker(signal,signal.side));engine.alignment.forEach(signal=>marker(signal,'MTF'));
 const status=[style.inputs?Object.entries(EngineSettings.inputs).map(([k,v])=>k+'='+v).join(', '):'',style.values?plots.map((p,i)=>['Snake Upper','Snake Lower','Snake Center','VWAP Upper','VWAP Lower','BB Upper','BB Lower'][i]+': '+(Number.isFinite(p.values.at(-1))?p.values.at(-1).toFixed(style.precision==='default'?3:Number(style.precision)):'—')).join(' · '):''].filter(Boolean).join(' | ');$('engineOn').closest('label').title=status;
}
if(visible.length){const last=end-1;const tags=[[data[last].close,colors[selected]],...($('engineOn').checked&&EngineSettings.style.labels?EngineSettings.plots(engine).filter(p=>p.show).map(p=>[p.values[last],p[engine.bias[last]==='Bullish'?'bull':engine.bias[last]==='Bearish'?'bear':'neutral'],EngineSettings.style.precision]):[]),...($('bbOn').checked&&BBSettings.settings.labels?bbPlots.filter(p=>p.show).map(p=>[p.values[last],p.color,BBSettings.settings.precision]):[]),...($('tramaOn').checked&&TramaSettings.settings.show&&TramaSettings.settings.labels?[[tramaPlot[last],TramaSettings.settings.color]]:[]),...($('vwapOn').checked&&VwapAA.settings.labels?aaPlots.filter(p=>p.show).map(p=>[p.values[last],p.color]):[])];tags.forEach(([value,color,precision])=>{if(!Number.isFinite(value))return;const py=y(value);top.ctx.fillStyle='#17202b';top.ctx.fillRect(top.width-right+1,py-10,right-3,20);top.ctx.strokeStyle=color;top.ctx.lineWidth=1;top.ctx.strokeRect(top.width-right+1,py-10,right-3,20);top.ctx.fillStyle='#ffffff';top.ctx.font='bold 12px system-ui';top.ctx.fillText(value.toFixed(precision!==undefined?(precision==='default'?3:Number(precision)):color===TramaSettings.settings.color?(TramaSettings.settings.precision==='default'?3:Number(TramaSettings.settings.precision)):(VwapAA.settings.precision==='default'?3:Number(VwapAA.settings.precision))),top.width-right+5,py+4);});}

const ctx=bottom.ctx,rs=OscSettings.rsi,ms=OscSettings.ma;if(rs.background){ctx.save();ctx.fillStyle=rs.fill;ctx.globalAlpha=rs.opacity/100;ctx.fillRect(left,ry(rs.upper),bottom.width-right-left,ry(rs.lower)-ry(rs.upper));ctx.restore();}const levels=rs.levels?[...new Set([0,rs.lower,50,rs.upper,100])]:[0,50,100];levels.forEach(value=>{const major=value===rs.lower||value===rs.upper;ctx.strokeStyle=major?rs.levelColor:'#303144';ctx.lineWidth=major?1.4:.6;ctx.setLineDash(major?[7,4]:[3,4]);ctx.beginPath();ctx.moveTo(left,ry(value));ctx.lineTo(bottom.width-right,ry(value));ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=major?'#e4edff':'#8191a6';ctx.font=major?'bold 12px system-ui':'10px system-ui';ctx.fillText(value,bottom.width-right+10,ry(value)+3);});if($('rsiOn').checked&&rs.show)line(bottom,rsi,rs.color,ry,rs);if($('maOn').checked&&ms.show)line(bottom,ma,ms.color,ry,ms);[[rsi,rs,'rsiOn'],[ma,ms,'maOn']].forEach(([values,settings,id])=>{const v=values[oscEnd-1];if(!settings.labels||!settings.show||!$(id).checked||!Number.isFinite(v))return;const py=ry(v);ctx.fillStyle='#17202b';ctx.fillRect(bottom.width-right+1,py-9,right-3,18);ctx.strokeStyle=settings.color;ctx.strokeRect(bottom.width-right+1,py-9,right-3,18);ctx.fillStyle='#fff';ctx.font='bold 11px system-ui';ctx.fillText(v.toFixed(settings.precision==='default'?2:Number(settings.precision)),bottom.width-right+5,py+4);});
if(visible.length){for(let i=0;i<5;i++){const index=Math.min(visible.length-1,Math.round((visible.length-1)*i/4));top.ctx.fillStyle='#738ba2';top.ctx.font='10px system-ui';top.ctx.fillText(frame==='1day'?visible[index].date.slice(0,10):new Date(visible[index].time).toISOString().slice(11,16),Math.min(x(index),top.width-right-45),top.height-8);}}
if(crosshair&&!dragging){const chart=crosshair.pane==='rsi'?bottom:top;
 const minimum=crosshair.pane==='rsi'?verticalScales.rsi.center-50/verticalScales.rsi.factor:low;
 const maximum=crosshair.pane==='rsi'?verticalScales.rsi.center+50/verticalScales.rsi.factor:high;
 const timeLabel=crosshairTimeLabel(data,paneView(crosshair.pane),crosshair.x,chart.width);
 drawCrosshair(chart,crosshair,minimum,maximum,crosshair.pane==='rsi'?2:3,timeLabel);
}}
function crosshairTimeLabel(data,view,pointerX,width){
 // Match the candle bucket used by pointer hover, including each pane's own pan/zoom.
 const plotWidth=width-93;
 if(!data.length||plotWidth<=0||pointerX<15||pointerX>width-78)return '';
 const index=Math.floor(data.length-view.count-view.offset+(pointerX-15)/plotWidth*view.count);
 const time=data[index]?.time;
 if(!Number.isFinite(time))return '';
 const date=new Date(time);
 if(!Number.isFinite(date.getTime()))return '';
 // The chart's existing time axis is UTC; keep this label in that same timezone.
 return date.toLocaleDateString('en-US',{timeZone:'UTC',month:'short',day:'numeric',year:'numeric'})+' · '+date.toLocaleTimeString('en-GB',{timeZone:'UTC',hour:'2-digit',minute:'2-digit',hour12:false})+' UTC';
}
function drawCrosshair(chart,point,minimum,maximum,digits,timeLabel){
 const {ctx,width,height}=chart,left=15,right=width-78,top=15,bottom=height-28;
 if(point.x<left||point.x>right||point.y<top||point.y>bottom)return;
 ctx.save();ctx.strokeStyle='#ffffff';ctx.globalAlpha=.9;ctx.lineWidth=1.4;ctx.setLineDash([2,4]);
 ctx.beginPath();ctx.moveTo(point.x,top);ctx.lineTo(point.x,bottom);ctx.moveTo(left,point.y);ctx.lineTo(right,point.y);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;
 const value=maximum-(point.y-top)/(bottom-top)*(maximum-minimum),labelY=Math.max(top+10,Math.min(bottom-10,point.y));
 ctx.fillStyle='#263342';ctx.fillRect(right+1,labelY-10,76,20);ctx.strokeStyle='#ffffff';ctx.lineWidth=1;ctx.strokeRect(right+1,labelY-10,76,20);ctx.fillStyle='#ffffff';ctx.font='bold 12px system-ui';ctx.fillText(value.toFixed(digits),right+5,labelY+4);
 if(timeLabel){
  ctx.font='600 11px system-ui';
  const labelWidth=Math.min(right-left,ctx.measureText(timeLabel).width+18),labelHeight=22;
  const labelX=Math.max(left,Math.min(right-labelWidth,point.x-labelWidth/2)),labelTop=height-labelHeight-2;
  ctx.fillStyle='#263342';ctx.fillRect(labelX,labelTop,labelWidth,labelHeight);
  ctx.strokeStyle='#aebdce';ctx.strokeRect(labelX+.5,labelTop+.5,labelWidth-1,labelHeight-1);
  ctx.fillStyle='#ffffff';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(timeLabel,labelX+labelWidth/2,labelTop+labelHeight/2,labelWidth-10);
 }
 ctx.restore();
}
function paneView(pane){return pane==='rsi'?oscView:{count,offset};}
function setPaneView(pane,view){if(pane==='rsi')Object.assign(oscView,view);else{count=view.count;offset=view.offset;}}
function zoom(factor,pane='price',verticalStep=1){const previousBounds=pane==='price'&&verticalStep!==1?{...currentPriceBounds}:null;const view=paneView(pane),previousCount=view.count;view.count=Math.max(20,Math.min(500,Math.round(previousCount*factor)));if(view.count===previousCount)return;if(previousBounds){const latestPosition=1+(view.offset-.5)/previousCount;const shift=.15*(1-previousCount/view.count);view.offset=(latestPosition+shift-1)*view.count+.5;}else view.offset=Math.max(-view.count+20,view.offset);setPaneView(pane,view);if(pane==='price'){verticalScales.price.factor=1;verticalScales.price.center=null;}hover=-1;crosshair=null;draw();if(previousBounds?.span>0){const progress=Math.log(view.count/previousCount)/Math.log(factor),targetSpan=previousBounds.span/Math.pow(verticalStep,progress);verticalScales.price.factor=currentPriceBounds.span/targetSpan;verticalScales.price.center=previousBounds.center;draw();}}
$('panLeft').onclick=()=>{offset=Math.max(-count+20,offset-Math.round(count*.15));hover=-1;crosshair=null;draw();};$('panRight').onclick=()=>{offset=Math.min(Math.max(0,bars().length-20),offset+Math.round(count*.15));hover=-1;crosshair=null;draw();};
$('zoomIn').onclick=()=>zoom(.8);$('zoomOut').onclick=()=>zoom(1.25);$('reset').onclick=()=>{verticalScales.price={factor:1,center:null};count=frame==='1min'?420:120;offset=-Math.round(count*.2);hover=-1;crosshair=null;draw();};let dragging=null;
for(const canvas of [$('priceChart'),$('rsiChart')]){
 const pane=canvas.id==='priceChart'?'price':'rsi';
 const inAxis=event=>event.clientX-canvas.getBoundingClientRect().left>=canvas.getBoundingClientRect().width-78;
 canvas.onwheel=event=>{event.preventDefault();if(inAxis(event)){const scale=verticalScales[pane];scale.factor=Math.max(.2,Math.min(12,scale.factor*Math.exp(-event.deltaY*.002)));draw();}else zoom(event.deltaY>0?1.12:.88,pane,event.deltaY>0?1/1.035:1.035);};
 canvas.ondblclick=event=>{verticalScales[pane]={factor:pane==='rsi'?2:1,center:pane==='rsi'?50:null};if(!inAxis(event)){const n=frame==='1min'?420:120;setPaneView(pane,{count:n,offset:-Math.round(n*.2)});}hover=-1;crosshair=null;draw();};
 canvas.onpointerdown=event=>{const view=paneView(pane);dragging={kind:inAxis(event)?'scale':'pan',x:event.clientX,y:event.clientY,offset:view.offset,count:view.count,factor:verticalScales[pane].factor,center:pane==='price'?currentPriceBounds.center:verticalScales.rsi.center,span:pane==='price'?currentPriceBounds.span:100/verticalScales.rsi.factor,pane};canvas.setPointerCapture(event.pointerId);};
 canvas.onpointerup=canvas.onpointercancel=()=>dragging=null;
 canvas.onpointermove=event=>{const rect=canvas.getBoundingClientRect(),view=paneView(pane),viewStart=bars().length-view.count-view.offset,first=Math.max(0,Math.floor(viewStart)),last=Math.min(bars().length,Math.ceil(viewStart+view.count));hoverPane=pane;canvas.style.cursor=inAxis(event)?'ns-resize':dragging?'grabbing':'crosshair';if(dragging?.pane===pane){if(dragging.kind==='scale')verticalScales[pane].factor=Math.max(.2,Math.min(12,dragging.factor*Math.exp((dragging.y-event.clientY)/160)));else{view.offset=Math.max(-view.count+20,Math.min(Math.max(0,bars().length-20),dragging.offset+Math.round((event.clientX-dragging.x)/Math.max(1,rect.width-93)*dragging.count)));setPaneView(pane,view);verticalScales[pane].center=dragging.center+(event.clientY-dragging.y)/Math.max(1,rect.height-43)*dragging.span;}hover=-1;crosshair=null;}else{hover=inAxis(event)?-1:Math.floor(viewStart+(event.clientX-rect.left-15)/Math.max(1,rect.width-93)*view.count)-first;if(hover<0||hover>=last-first)hover=-1;crosshair=null;const px=event.clientX-rect.left,py=event.clientY-rect.top;if(px>=15&&px<=rect.width-78&&py>=15&&py<=rect.height-28)crosshair={pane,x:px,y:py};}draw();};
 canvas.onpointerleave=()=>{hover=-1;crosshair=null;if(!dragging)draw();};
}
document.querySelectorAll('[data-frame]').forEach(button=>button.onclick=()=>selectFrame(button.dataset.frame));['bbOn','vwapOn','rsiOn','maOn','tramaOn','engineOn','priceOn'].forEach(id=>$(id).onchange=draw);
$('candlesStyle').onclick=()=>{chartStyle='candles';if(entry()?.reference)showFeedNotice('Candlesticks need open, high, low and close history. This feed supplies a single daily reference price. Connect a candle feed through Indicators → Manage data feed.');draw();};$('lineStyle').onclick=()=>{chartStyle='line';$('chartNotice').hidden=true;draw();};
$('connect').onclick=$('emptyConnect').onclick=()=>$('dataDialog').showModal();$('loadFeed').onclick=()=>{const value=$('apiKey').value.trim();if(!value){$('feedError').textContent='Enter your Twelve Data key to connect.';return;}apiKey=value;$('apiKey').value='';loadFeed();};$('disconnect').onclick=()=>{apiKey='';requestId++;$('apiKey').value='';$('feedError').textContent='Custom feed disconnected. Automatic daily history is available.';render();};$('refresh').onclick=()=>{nativeHistoryBlockedUntil=0;loadFeed();};$('manageFeeds').onclick=()=>{$('settingsDialog').close();$('dataDialog').showModal();};
$('settings').onclick=()=>{Object.entries(config).forEach(([id,value])=>$(id).value=value);$('settingsDialog').showModal();};$('closeSettings').onclick=()=>$('settingsDialog').close();$('settingsForm').onsubmit=event=>{event.preventDefault();readEngineSettings();config={bbPeriod:Number($('bbPeriod').value),bbMult:Number($('bbMult').value),rsiPeriod:Number($('rsiPeriod').value),maPeriod:Number($('maPeriod').value),vwapAnchor:$('vwapAnchor').value};try{localStorage.setItem('custom-market-settings-v2',JSON.stringify(config));}catch{}$('settingsDialog').close();render();};
function parseCSV(text){const rows=[];let row=[],field='',quoted=false;for(let i=0;i<text.length;i++){const char=text[i];if(char==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}else if(char===','&&!quoted){row.push(field.trim());field='';}else if((char==='\n'||char==='\r')&&!quoted){if(char==='\r'&&text[i+1]==='\n')i++;row.push(field.trim());if(row.some(Boolean))rows.push(row);row=[];field='';}else field+=char;}if(quoted)throw Error('CSV has an unclosed quoted field.');row.push(field.trim());if(row.some(Boolean))rows.push(row);const headers=(rows.shift()||[]).map(v=>v.replace(/^\uFEFF/,'').toLowerCase());if(!['date','open','high','low','close'].every(h=>headers.includes(h)))throw Error('CSV needs date, open, high, low, close headers.');return rows.map(values=>Object.fromEntries(headers.map((h,i)=>[h,values[i]??''])));}
$('csv').onchange=async event=>{const file=event.target.files[0];if(!file)return;const targetKey=key();try{if(file.size>5*1024*1024)throw Error('Please import a CSV under 5 MB.');const imported=normalize(parseCSV(await file.text()));requestId++;cache.set(targetKey,{bars:imported,source:'Imported CSV'});offset=-Math.round(count*.2);hover=-1;crosshair=null;$('importError').textContent='';$('dataDialog').close();render();}catch(error){$('importError').textContent=error.message;}finally{event.target.value='';}};

async function loadPublic(index){
  if(frame!=='1day' && index===selected){$('dataStatus').textContent='Intraday candles need a custom feed. Choose Data sources or return to 1D.';return;}
  const market=markets[index],target=market.symbol+'|1day';
  if(index===selected)$('dataStatus').textContent='Loading '+market.symbol+' daily history…';
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
  try{
    let values,source;
    if(market.category==='PRECIOUS METAL'){
      const response=await fetch('https://standardbullion.com/api/v1/market/history?metal='+market.symbol.slice(0,3)+'&range=1y',{signal:controller.signal});
      if(!response.ok)throw Error('Metals history provider returned '+response.status);
      const json=await response.json();
      if(json.metal!==market.symbol.slice(0,3)||!Array.isArray(json.points))throw Error('Unexpected metals history response.');
      values=json.points.map(point=>({date:point.t,open:point.price,high:point.price,low:point.price,close:point.price}));source='Standard Bullion · daily dealer prices';
    }else{
      const since=new Date();since.setUTCFullYear(since.getUTCFullYear()-1);
      const response=await fetch('https://api.frankfurter.dev/v1/'+since.toISOString().slice(0,10)+'..?base='+market.symbol.slice(0,3)+'&symbols=JPY',{signal:controller.signal});
      if(!response.ok)throw Error('FX history provider returned '+response.status);
      const json=await response.json();if(json.base!==market.symbol.slice(0,3)||!json.rates)throw Error('Unexpected FX history response.');
      values=Object.entries(json.rates).map(([date,rates])=>({date,open:rates.JPY,high:rates.JPY,low:rates.JPY,close:rates.JPY}));source='Frankfurter · daily central-bank reference rates';
    }
    if(!cache.has(target)||cache.get(target).reference){cache.set(target,{bars:normalize(values),source,reference:true});}render();
  }catch(error){if(index===selected){$('dataStatus').textContent=(entry()?'Showing previous history · ':'')+'History unavailable · '+(error.name==='AbortError'?'Request timed out. Try Refresh.':error.message);$('feedState').textContent='○ Provider unavailable';}}
  finally{clearTimeout(timer);}
}
async function loadAllPublic(){await Promise.allSettled(markets.map((_,index)=>loadPublic(index)));}



function showFeedNotice(message){
  $('chartNotice').textContent=message;
  $('chartNotice').hidden=false;
}
const nativePending=new Map();
function fetchNativeHistory(symbol,interval){
  const k=symbol+'|'+interval;
  if(nativePending.has(k))return nativePending.get(k);
  const task=requestNativeHistory(symbol,interval).finally(()=>nativePending.delete(k));
  nativePending.set(k,task);return task;
}
async function requestNativeHistory(symbol,interval){
  if(Date.now()<nativeHistoryBlockedUntil)throw new Error('Live feed is temporarily paused after an access or quota error. Cached charts remain available.');
  const providerInterval={'1min':'1m','5min':'5m','15min':'15m','30min':'30m','1h':'1h','4h':'4h','1day':'1d'}[interval];
  let response,json;
  try{response=await fetch('https://biquote.io/api/'+symbol.replace('/','')+'/ohlc?'+new URLSearchParams({interval:providerInterval,limit:'1000'}),{signal:AbortSignal.timeout(25000),credentials:'omit'});json=await response.json();}
  catch{response=await fetch('/charts/app/api/candles?'+new URLSearchParams({symbol,interval}),{signal:AbortSignal.timeout(30000)});json=await response.json();}
  if(!response.ok){nativeHistoryBlockedUntil=Date.now()+Math.max(60,Number(response.headers.get('Retry-After'))||60)*1000;throw new Error(json.error||json.message||'Candle feed unavailable');}
  let values;
  if(json.symbol===symbol.replace('/','')&&Array.isArray(json.bars))values=json.bars.map(b=>({date:b.openTime,open:b.open,high:b.high,low:b.low,close:b.close,volume:b.tickVolume??(b.volume>0?b.volume:null)}));
  else if(json.symbol===symbol&&json.interval===interval&&Array.isArray(json.values))values=json.values;
  else throw new Error('Unexpected candle response');
  const prior=cache.get(symbol+'|'+interval);const latest=normalize(values);let historyBars=latest;
  if(interval==='1min'&&prior?.provider==='biquote'){const cutoff=Date.now()-2*86400000,map=new Map(prior.bars.filter(b=>b.time>=cutoff).map(b=>[b.time,b]));latest.forEach(b=>map.set(b.time,b));historyBars=[...map.values()].sort((a,b)=>a.time-b.time);}
  const history={bars:historyBars,source:'biquote · MT5 OHLC · tick-volume weighted',provider:'biquote',volumeType:'tick',fetchedAt:Date.now(),refreshAfter:interval==='1min'?60:interval==='5min'?120:300};saveHistoryBackup(symbol+'|'+interval,history);return history;
}
async function selectFrame(next){
  if(next===frame)return;
  const id=++requestId,symbol=markets[selected].symbol,button=document.querySelector('[data-frame="'+next+'"]');
  const existing=cache.get(symbol+'|'+next);
  if(existing){frame=next;count=next==='1min'?420:120;verticalScales.price={factor:1,center:null};offset=-Math.round(count*.2);hover=-1;crosshair=null;$('chartNotice').hidden=true;render();return;}
  button.classList.add('loading');button.setAttribute('aria-busy','true');
  try{
    const native=await fetchNativeHistory(symbol,next);
    if(id!==requestId||symbol!==markets[selected].symbol)return;
    cache.set(symbol+'|'+next,native);replayRecentTick(symbol);frame=next;count=next==='1min'?420:120;verticalScales.price={factor:1,center:null};offset=-Math.round(count*.2);hover=-1;crosshair=null;$('chartNotice').hidden=true;render();loadNativeMTF();
  }catch(error){
    if(id!==requestId)return;
    if(apiKey){frame=next;render();loadFeed();}
    else showFeedNotice(error.name==='TimeoutError'||error.name==='AbortError'?'One-minute history is taking longer to load. Press Refresh to retry.':error.message);
  }finally{button.classList.remove('loading');button.removeAttribute('aria-busy');}
}
function updateFramesFromMinutes(symbol) {
  const minuteEntry = cache.get(symbol+'|1min');
  if (!minuteEntry || minuteEntry.reference) return;
  for (const timeframe of ['5min','15min','30min','1h','4h']) {
    const existing = cache.get(symbol+'|'+timeframe);
    if (!existing || existing.reference) continue;
    const duration = Heisenberg.durations[timeframe];
    const groups = new Map();
    minuteEntry.bars.forEach(bar => {
      const start = Math.floor(bar.time/duration)*duration;
      if (!groups.has(start)) groups.set(start,[]);
      groups.get(start).push(bar);
    });
    const combined = new Map(existing.bars.map(bar => [bar.time,bar]));
    let replacements = 0;
    groups.forEach((group,start) => {
      const complete = start+duration<=Date.now();
      if (group[0].time!==start || (complete && group.length!==duration/60000)) return;
      if (group.some((bar,index)=>bar.time!==start+index*60000 || !Number.isFinite(bar.volume))) return;
      combined.set(start,{
        time:start,date:new Date(start).toISOString(),open:group[0].open,
        high:Math.max(...group.map(bar=>bar.high)),low:Math.min(...group.map(bar=>bar.low)),
        close:group.at(-1).close,volume:group.reduce((sum,bar)=>sum+bar.volume,0)
      });
      replacements++;
    });
    if (replacements) cache.set(symbol+'|'+timeframe,{
      ...existing,bars:[...combined.values()].sort((a,b)=>a.time-b.time).slice(-1000),
      fetchedAt:minuteEntry.fetchedAt,source:'Live feed · '+timeframe+' candles updated from M1'
    });
  }
}

async function loadNativeMTF(){
  if(nativeLoadRunning||apiKey||Date.now()<nativeHistoryBlockedUntil)return;
  nativeLoadRunning=true;
  const symbol=markets[selected].symbol;
  try{
    for(const tf of ['1min','5min','15min','30min','1h','4h']){
      if(symbol!==markets[selected].symbol)return;
      const existing=cache.get(symbol+'|'+tf);
      if(existing&&!existing.reference&&Date.now()-existing.fetchedAt<(existing.refreshAfter||60)*1000)continue;
      let native;
      try{native=await fetchNativeHistory(symbol,tf);}catch(error){$('engineStatus').textContent='Retrying missing timeframe on next refresh';continue;}
      if(symbol!==markets[selected].symbol)return;
      cache.set(symbol+'|'+tf,native);replayRecentTick(symbol);render();
    }
    render();
  }catch(error){$('engineStatus').textContent='Candle feed unavailable · check Live feed access';}
  finally{nativeLoadRunning=false;}
}

function updateTabTitle() {
  const market=markets[selected], quote=liveQuotes.get(market.symbol);
  const title=market.name+(Number.isFinite(quote?.price)?' '+format(quote.price):'');
  if(document.title!==title)document.title=title;
}
function updateLiveQuoteLabels() {
  updateTabTitle();
  const buttons = document.querySelectorAll('nav button');
  buttons.forEach((button, index) => {
    const quote = liveQuotes.get(markets[index].symbol);
    if (!quote) return;
    const stale = Date.now() - quote.timestamp > 120000 || Date.now() - quote.receivedAt > 90000;
    const price = button.querySelector('.market-price');
    const status = button.querySelector('.market-quote-status');
    price.textContent = format(quote.price,markets[index].symbol);
    button.classList.toggle('quote-stale', stale);
    button.classList.toggle('price-up', quote.direction > 0);
    button.classList.toggle('price-down', quote.direction < 0);
    const day=dayChange(quote.price,quote.dayDiffPercent);
    status.classList.toggle('day-up',!!day&&day.amount>0);status.classList.toggle('day-down',!!day&&day.amount<0);
    status.textContent=day?((day.amount>=0?'+':'−')+Math.abs(day.amount).toFixed(3)+' ('+(day.percent>=0?'+':'−')+Math.abs(day.percent).toFixed(2)+'%)'):'Day change —';
    status.title=(day?'Change from the feed’s daily opening price, in '+(markets[index].symbol.includes('/')?markets[index].symbol.slice(-3):'price units')+'. ':'Daily change unavailable. ')+(stale?'Stale quote. ':'')+'Quote at '+new Date(quote.timestamp).toISOString();
    button.title = quote.source + ' · ' + new Date(quote.timestamp).toISOString();
  });
  const quote = liveQuotes.get(markets[selected].symbol);
  if (quote) {
    $('lastPrice').textContent = format(quote.price);
    $('lastPrice').className = quote.direction > 0 ? 'quote-up' : quote.direction < 0 ? 'quote-down' : '';
    const stale = Date.now() - quote.timestamp > 120000 || Date.now() - quote.receivedAt > 90000;
    $('change').textContent = (stale ? 'Last quote · ' : 'Current quote · ') + new Date(quote.timestamp).toLocaleTimeString('en-GB', {timeZone:'UTC', hour12:false}) + ' UTC';
  }
}
async function pollQuotes() {
  if (quoteRequestRunning || (typeof LiveStream!=='undefined'&&LiveStream.fresh(markets[selected].symbol))) return;
  quoteRequestRunning = true;
  try {
    let response;
    try {
      const url=new URL('https://biquote.io/api/latest');markets.forEach(m=>url.searchParams.append('symbols',m.symbol.replace('/','')));
      const direct=await fetch(url,{signal:AbortSignal.timeout(8000),cache:'no-store',credentials:'omit'});
      if(!direct.ok)throw Error('Direct quote unavailable');const raw=await direct.json();
      const rows=Array.isArray(raw)?raw:raw.ticks||raw.data||Object.values(raw);
      const quotes=rows.flatMap(q=>{const market=markets.find(m=>m.symbol.replace('/','')===q.symbol),bid=Number(q.bid),ask=Number(q.ask),timestamp=Date.parse(q.timestamp);return market&&bid>0&&ask>=bid&&Number.isFinite(timestamp)?[{symbol:market.symbol,bid,ask,price:(bid+ask)/2,timestamp,source:'biquote · live midpoint backup',dayDiffPercent:q.dayDiffPercent}]:[];});
      if(!quotes.length)throw Error('No quotes');response={ok:true,json:async()=>({quotes})};
    }catch{response=await fetch('/charts/app/api/quotes?'+new URLSearchParams(markets.map(m=>['symbol',m.symbol])),{signal:AbortSignal.timeout(10000),cache:'no-store'});}
    if (!response.ok){if(response.status===429){nativeHistoryBlockedUntil=Date.now()+Math.max(60,Number(response.headers.get('Retry-After'))||60)*1000;showFeedNotice('Live feed request/quota limit reached. Live data is paused. Saved candles, if available, remain visible.');}throw new Error('Quote connection unavailable');}
    const result = await response.json();
    if (!Array.isArray(result.quotes)) throw new Error('Invalid quote response');
    result.quotes.forEach(quote => {
      if (!markets.some(market => market.symbol === quote.symbol) || !Number.isFinite(quote.price) || quote.price <= 0 || !Number.isFinite(quote.timestamp)) return;
      const previous = liveQuotes.get(quote.symbol);
      if (previous && quote.timestamp < previous.timestamp) return;
      const direction = previous ? Math.sign(quote.price - previous.price) : 0;
      liveQuotes.set(quote.symbol, {...quote, receivedAt:Date.now(), direction:direction || previous?.direction || 0});
      if(Number.isFinite(quote.bid)&&Number.isFinite(quote.ask))updateStreamCandles(quote.symbol,{bid:quote.bid,ask:quote.ask,timestamp:new Date(quote.timestamp).toISOString()});
      const button = document.querySelectorAll('nav button')[markets.findIndex(market => market.symbol === quote.symbol)];
      if (direction) {
        button.classList.remove('flash-up','flash-down');
        void button.offsetWidth;
        button.classList.add(direction > 0 ? 'flash-up' : 'flash-down');
      }
    });
    (result.errors || []).forEach(error => {
      const index = markets.findIndex(market => market.symbol === error.symbol);
      if (index < 0) return;
      const button = document.querySelectorAll('nav button')[index];
      if (!liveQuotes.has(error.symbol)) button.querySelector('.market-quote-status').textContent = 'Quote unavailable';
    });
    applyQuoteSnapshots();updateLiveQuoteLabels();if(!document.hidden)draw();
  } catch {
    document.querySelectorAll('nav button').forEach(button => {
      button.classList.add('quote-stale');
      button.querySelector('.market-quote-status').textContent = 'Reconnecting quotes…';
    });
  } finally {
    quoteRequestRunning = false;
  }
}

new ResizeObserver(draw).observe($('priceChart'));new ResizeObserver(draw).observe($('rsiChart'));setInterval(()=>{if(apiKey)loadFeed();},15*60*1000);render();loadFeed();pollQuotes();setInterval(pollQuotes,5000);setInterval(updateLiveQuoteLabels,1000);setInterval(()=>{if(!document.hidden&&!apiKey){loadNativeMTF();if(!['1min','5min','15min','30min','1h','4h'].includes(frame)){const current=entry();if(!current||Date.now()-current.fetchedAt>(current.refreshAfter||1800)*1000)loadFeed();}}},60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden){updateLiveQuoteLabels();draw();pollQuotes();}});

const aaSettingsButton=document.createElement('button');aaSettingsButton.type='button';aaSettingsButton.className='aa-settings';aaSettingsButton.textContent='⚙';aaSettingsButton.title='VWAP AA Inputs and Style';aaSettingsButton.setAttribute('aria-label','VWAP AA settings');aaSettingsButton.onclick=()=>VwapAA.open();const vwapToggle=$('vwapOn').closest('label'),vwapBox=document.createElement('div');vwapBox.className='indicator-box';vwapToggle.before(vwapBox);vwapBox.append(vwapToggle,aaSettingsButton);

const tramaGear=document.createElement('button');tramaGear.type='button';tramaGear.className='aa-settings';tramaGear.textContent='⚙';tramaGear.setAttribute('aria-label','TRAMA settings');tramaGear.title='TRAMA Inputs and Style';tramaGear.onclick=()=>TramaSettings.open();const tramaToggle=$('tramaOn').closest('label'),tramaBox=document.createElement('div');tramaBox.className='indicator-box';tramaToggle.before(tramaBox);tramaBox.append(tramaToggle,tramaGear);

const bbGear=document.createElement('button');bbGear.type='button';bbGear.className='aa-settings';bbGear.textContent='⚙';bbGear.setAttribute('aria-label','Bollinger Bands settings');bbGear.title='Bollinger Bands Inputs and Style';bbGear.onclick=()=>BBSettings.open();const bbToggle=$('bbOn').closest('label'),bbBox=document.createElement('div');bbBox.className='indicator-box';bbToggle.before(bbBox);bbBox.append(bbToggle,bbGear);
let bbHistoryLoading=false,bbHistoryRetryAt=0;
async function ensureBBHistory(){const tf=BBSettings.settings.timeframe,symbol=markets[selected].symbol;if(tf==='chart'||tf===frame||bbHistoryLoading||Date.now()<bbHistoryRetryAt)return;const existing=cache.get(symbol+'|'+tf);if(existing&&Date.now()-existing.fetchedAt<(existing.refreshAfter||60)*1000)return;bbHistoryLoading=true;try{const value=await fetchNativeHistory(symbol,tf);cache.set(symbol+'|'+tf,value);render();}catch(error){bbHistoryRetryAt=Date.now()+60000;showFeedNotice('Bollinger calculation timeframe: '+error.message);}finally{bbHistoryLoading=false;}}
setInterval(()=>{if(!document.hidden)ensureBBHistory();},60000);

function applyQuoteSnapshots(){
 for(const [symbol,quote] of liveQuotes){
  for(const [tf,duration] of Object.entries(Heisenberg.durations)){
   const history=cache.get(symbol+'|'+tf),last=history?.bars.at(-1);if(!last||quote.timestamp<last.time||quote.timestamp>=last.time+duration||quote.timestamp<=(last.quoteTime||0))continue;
   last.high=Math.max(last.high,quote.price);last.low=Math.min(last.low,quote.price);last.close=quote.price;last.quoteTime=quote.timestamp;
  }
 }
}

for(const [kind,id,name] of [['rsi','rsiOn','RSI'],['ma','maOn','Moving Average']]){const label=$(id).closest('label'),box=document.createElement('div'),gear=document.createElement('button');box.className='indicator-box';gear.type='button';gear.className='aa-settings';gear.textContent='⚙';gear.title=name+' Inputs and Style';gear.setAttribute('aria-label',name+' settings');gear.onclick=()=>OscSettings.open(kind);label.before(box);box.append(label,gear);}

const engineGear=document.createElement('button');engineGear.type='button';engineGear.className='aa-settings';engineGear.textContent='⚙';engineGear.setAttribute('aria-label','Heisenberg Confluence settings');engineGear.title='Heisenberg Confluence Inputs and Style';engineGear.onclick=()=>EngineSettings.open();const engineToggle=$('engineOn').closest('label'),engineBox=document.createElement('div');engineBox.className='indicator-box';engineToggle.before(engineBox);engineBox.append(engineToggle,engineGear);

// Collapse the whole oscillator pane while preserving a compact restore control.
const oscPaneToggle=document.createElement('button');oscPaneToggle.type='button';oscPaneToggle.id='oscPaneToggle';oscPaneToggle.setAttribute('aria-controls','rsiChart');document.querySelector('.rsi-header').prepend(oscPaneToggle);
let oscPaneCollapsed=false;try{oscPaneCollapsed=localStorage.getItem('market-osc-pane-collapsed')==='true';}catch{}
function syncOscPane(){document.querySelector('.chart-shell').classList.toggle('osc-pane-collapsed',oscPaneCollapsed);oscPaneToggle.textContent=oscPaneCollapsed?'▴':'▾';oscPaneToggle.title=oscPaneCollapsed?'Show RSI and Moving Average pane':'Hide RSI and Moving Average pane';oscPaneToggle.setAttribute('aria-label',oscPaneToggle.title);oscPaneToggle.setAttribute('aria-expanded',String(!oscPaneCollapsed));$('rsiChart').setAttribute('aria-hidden',String(oscPaneCollapsed));requestAnimationFrame(draw);}
oscPaneToggle.onclick=()=>{oscPaneCollapsed=!oscPaneCollapsed;hover=-1;crosshair=null;try{localStorage.setItem('market-osc-pane-collapsed',String(oscPaneCollapsed));}catch{}syncOscPane();};syncOscPane();

const headerToggle=document.createElement('button');headerToggle.type='button';headerToggle.id='chartHeaderToggle';document.querySelector('article').append(headerToggle);document.querySelector('.toolbar').id='chartTopControls';document.querySelector('.market-heading').id='chartIndicatorControls';headerToggle.setAttribute('aria-controls','chartTopControls chartIndicatorControls');
let headerCollapsed=false;
// Account shell only: connect this menu to the CRM session and billing portal during integration.
const accountShell=document.createElement('div');accountShell.id='chartAccount';
const accountButton=document.createElement('button');accountButton.type='button';accountButton.id='chartAccountButton';accountButton.title='Account';accountButton.setAttribute('aria-label','Account');accountButton.setAttribute('aria-expanded','false');accountButton.setAttribute('aria-controls','chartAccountMenu');
accountButton.innerHTML='<svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="10" cy="6.3" r="2.7"/><path d="M4.5 16c0-3.1 2.3-5 5.5-5s5.5 1.9 5.5 5"/></svg>';
const accountMenu=document.createElement('div');accountMenu.id='chartAccountMenu';accountMenu.hidden=true;accountMenu.setAttribute('aria-label','Account options');
const accountHeading=document.createElement('strong');accountHeading.textContent='Your account';
const signInButton=document.createElement('button');signInButton.type='button';signInButton.textContent='Sign in';
accountMenu.append(accountHeading,signInButton);
for(const label of ['Account','Manage subscription','Sign out']){const button=document.createElement('button');button.type='button';button.textContent=label;button.disabled=true;button.title='Available after account services are connected';accountMenu.append(button);}
const accountNote=document.createElement('small');accountNote.textContent='Account connection pending';accountMenu.append(accountNote);accountShell.append(accountButton,accountMenu);document.querySelector('article').append(accountShell);
const accountDialog=document.createElement('dialog');accountDialog.id='chartAccountDialog';
const accountTitle=document.createElement('h2');accountTitle.id='chartAccountTitle';accountTitle.textContent='Sign in to Cortexa Charts';accountDialog.setAttribute('aria-labelledby',accountTitle.id);
const accountMessage=document.createElement('p');accountMessage.textContent='Account access is not connected yet. Sign-in and subscription management will be available when the Cortexa account service is connected.';
const accountDismiss=document.createElement('button');accountDismiss.type='button';accountDismiss.textContent='Back to chart';accountDismiss.onclick=()=>accountDialog.close();accountDialog.append(accountTitle,accountMessage,accountDismiss);document.body.append(accountDialog);
function closeChartAccount(){accountMenu.hidden=true;accountButton.setAttribute('aria-expanded','false');}
accountButton.onclick=()=>{const open=accountMenu.hidden;accountMenu.hidden=!open;accountButton.setAttribute('aria-expanded',String(open));};
signInButton.onclick=()=>{closeChartAccount();accountDialog.showModal();};
document.addEventListener('pointerdown',event=>{if(!accountShell.contains(event.target))closeChartAccount();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!accountMenu.hidden){closeChartAccount();accountButton.focus();}});
accountShell.addEventListener('focusout',event=>{if(!accountShell.contains(event.relatedTarget))closeChartAccount();});

function syncChartHeader(){closeChartAccount();document.querySelector('article').classList.toggle('chart-header-collapsed',headerCollapsed);headerToggle.textContent=headerCollapsed?'▾':'▴';headerToggle.title=headerCollapsed?'Show chart header':'Hide chart header';headerToggle.setAttribute('aria-label',headerToggle.title);headerToggle.setAttribute('aria-expanded',String(!headerCollapsed));requestAnimationFrame(draw);}
headerToggle.onclick=()=>{headerCollapsed=!headerCollapsed;try{localStorage.setItem('market-header-collapsed',String(headerCollapsed));}catch{}syncChartHeader();};syncChartHeader();

function onStreamReady(){streamHasConnected=true;nativeHistoryBlockedUntil=0;loadFeed();}
function replayRecentTick(symbol){const tick=streamLastTicks.get(symbol);if(tick)updateStreamCandles(symbol,tick);}
function updateStreamCandles(symbol,tick){
 const time=Date.parse(tick.timestamp),price=(Number(tick.bid)+Number(tick.ask))/2,tickId=tick.timestamp+'|'+tick.bid+'|'+tick.ask;
 for(const [tf,duration] of Object.entries(Heisenberg.durations)){
  const history=cache.get(symbol+'|'+tf);if(!history||history.provider!=='biquote'||!history.bars.length)continue;
  const bucket=Math.floor(time/duration)*duration,last=history.bars.at(-1);if(bucket<last.time||time<(last.streamTime||0)||last.streamId===tickId)continue;
  if(bucket===last.time){last.high=Math.max(last.high,price);last.low=Math.min(last.low,price);last.close=price;if(time>history.fetchedAt&&Number.isFinite(last.volume))last.volume+=1;last.streamTime=time;last.streamId=tickId;}
  else{history.bars.push({date:new Date(bucket).toISOString(),time:bucket,open:price,high:price,low:price,close:price,volume:1,streamTime:time,streamId:tickId,partial:true});if(history.bars.length>2000)history.bars.shift();}
 }
}
function onMarketTick(tick){
 if(!tick)return;const market=markets.find(m=>m.symbol.replace('/','')===tick.symbol),bid=Number(tick.bid),ask=Number(tick.ask),time=Date.parse(tick.timestamp);if(!market||!(bid>0)||ask<bid||!Number.isFinite(time))return;
 const prior=streamLastTicks.get(market.symbol);if(prior&&(Date.parse(prior.timestamp)>time||(Date.parse(prior.timestamp)===time&&Number(prior.bid)===bid&&Number(prior.ask)===ask)))return;streamLastTicks.set(market.symbol,tick);
 const old=liveQuotes.get(market.symbol),price=(bid+ask)/2,direction=old?Math.sign(price-old.price):0;liveQuotes.set(market.symbol,{symbol:market.symbol,price,bid,ask,timestamp:time,receivedAt:Date.now(),direction:direction||old?.direction||0,dayDiffPercent:typeof tick.dayDiffPercent==='number'&&Number.isFinite(tick.dayDiffPercent)?tick.dayDiffPercent:null,source:'biquote · MT5 live midpoint stream'});updateStreamCandles(market.symbol,tick);
 const button=document.querySelectorAll('nav button')[markets.indexOf(market)];if(direction){button.classList.remove('flash-up','flash-down');void button.offsetWidth;button.classList.add(direction>0?'flash-up':'flash-down');}
 if(document.hidden){updateTabTitle();return;}
 if(!streamDrawPending){streamDrawPending=true;setTimeout(()=>{streamDrawPending=false;updateLiveQuoteLabels();if(!document.hidden)draw();},200);}
}

function dayChange(price,percent){if(!Number.isFinite(price)||price<=0||typeof percent!=='number'||!Number.isFinite(percent)||percent<=-100)return null;const openingPrice=price/(1+percent/100);return {amount:price-openingPrice,percent};}
