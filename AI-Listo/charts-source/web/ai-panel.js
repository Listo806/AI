'use strict';
(()=>{
const $a=s=>document.querySelector(s),e=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const button=e('button','market-tool ai-launch','✦ Cortexa AI');button.id='cortexaAI';button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls','cortexaPanel');$('reset').after(button);
const panel=e('section','ai-panel');panel.id='cortexaPanel';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Cortexa AI market analysis');
const head=e('div','ai-head'),brand=e('div','ai-brand');brand.append(e('span','ai-orb','✦'));const title=e('div');title.append(e('h2','','Cortexa AI'),e('small','','YOUR CHART, EXPLAINED'));brand.append(title);const close=e('button','ai-close','×');close.setAttribute('aria-label','Close Cortexa AI');head.append(brand,close);
const context=e('div','ai-context'),symbol=e('strong'),frameLabel=e('span'),hint=e('p','ai-intro');context.append(e('span','context-dot'),symbol,frameLabel);

const choices=e('div','ai-choices'),setup=e('button','selected','Current setup'),outlook=e('button','','Intraday outlook');choices.append(setup,outlook);
const content=e('div','ai-content'),action=e('button','ai-analyze'),footer=e('div','ai-footer'),note=e('div','ai-preview-note','CORTEXA AI · Analysis available when the secure service is configured.');
footer.append(action,e('small','','Analysis is a snapshot. Live prices keep moving.'));
panel.append(head,note,context,hint,choices,content,footer);document.body.append(panel);
let mode='setup',lastContext='',reportKey='',busy=false,request=0,activeController=null;
const tf=()=>({'1min':'1 minute','5min':'5 minutes','15min':'15 minutes','30min':'30 minutes','1h':'1 hour','4h':'4 hours','1day':'Daily'}[frame]||frame);
function signature(){return JSON.stringify({market:markets[selected].symbol,frame,indicators:['bbOn','vwapOn','tramaOn','engineOn','rsiOn','maOn'].map(id=>$(id).checked),vwap:VwapAA.settings,trama:TramaSettings.settings,bb:BBSettings.settings,rsi:OscSettings.rsi,ma:OscSettings.ma,engine:EngineSettings.inputs});}
function reset(){activeController?.abort();activeController=null;request++;busy=false;reportKey='';content.replaceChildren();action.disabled=false;action.textContent='Analyze '+markets[selected].name;hint.textContent='Understand the current conditions, your indicator readings, and the scenarios worth watching.';empty();}
function empty(){content.replaceChildren();const card=e('div','ai-welcome');card.append(e('div','welcome-glyph','⌁'),e('h3','','A clearer view of '+markets[selected].name),e('p','','One overview of price action, your active indicators, and multi-timeframe alignment.'));const items=e('div','ai-preview-list');for(const [mark,text] of [['01','Understand current conditions'],['02','See where indicators agree or conflict'],['03','Explore conditional scenarios']]){const row=e('div');row.append(e('span','',mark),e('span','',text));items.append(row);}card.append(items);content.append(card);}
function sync(){const key=markets[selected].symbol+'|'+frame;symbol.textContent=markets[selected].name;frameLabel.textContent=tf();if(key!==lastContext){lastContext=key;reset();}else if(reportKey&&reportKey!==signature()){reportKey='';hint.textContent='Your indicator settings changed. Update the analysis to use the new setup.';action.textContent='Update analysis';content.classList.add('ai-outdated');}}
function open(){panel.hidden=false;button.setAttribute('aria-expanded','true');sync();action.focus();}
function hide(){activeController?.abort();activeController=null;request++;busy=false;action.disabled=false;panel.hidden=true;button.setAttribute('aria-expanded','false');button.focus();}
button.onclick=()=>panel.hidden?open():hide();close.onclick=hide;
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden)hide();});
for(const [b,m] of [[setup,'setup'],[outlook,'outlook']])b.onclick=()=>{mode=m;setup.classList.toggle('selected',mode==='setup');outlook.classList.toggle('selected',mode==='outlook');reset();};
function section(label,title,text,reason){const card=e('section','ai-card');card.append(e('small','ai-card-label',label),e('h3','',title),e('p','',text));if(reason){const d=e('details'),s=e('summary','','Show reasoning');d.append(s,e('p','ai-reason',reason));card.append(d);}content.append(card);return card;}
function lastFinite(values){return [...values].reverse().find(Number.isFinite);}
function display(v){return Number.isFinite(v)?format(v):'Not available';}
function build(){
 const data=bars(),market=markets[selected],last=data.at(-1);if(data.length<30){section('DATA CHECK','More history needed','There are not enough candles to produce this overview. Let the chart load, then try again.');return;}
 const quote=liveQuotes.get(market.symbol),price=quote?.price??last.close,closed=data.slice(0,-1),previous=closed.at(-1),engine=computeEngine();
 const rsiSeries=OscSettings.series(data).rsi,rsi=lastFinite(rsiSeries),trama=lastFinite(TramaSettings.series(data)),vwap=lastFinite(VwapAA.plots(data,frame)[0].values),bb=BBSettings.plots(data,frame,cache.get(market.symbol+'|'+BBSettings.settings.timeframe)?.bars),basis=lastFinite(bb[0].values);
 const signalValues=[[$('vwapOn').checked,vwap],[$('tramaOn').checked,trama],[$('bbOn').checked,basis]].filter(([on,value])=>on&&Number.isFinite(value));const above=signalValues.filter(([,value])=>price>value).length,below=signalValues.filter(([,value])=>price<value).length;
 const bias=above>below?'upward':below>above?'downward':'mixed',aligned=Object.entries(engine.table||{}),bull=aligned.filter(([,s])=>s==='Bullish').length,bear=aligned.filter(([,s])=>s==='Bearish').length;
 const available=data.slice(-Math.min(21,data.length),-1),support=Math.min(...available.map(b=>b.low)),resistance=Math.max(...available.map(b=>b.high));
 const timestamp=e('div','ai-timestamp');timestamp.append(e('span','','◷ '+new Date().toLocaleTimeString('en-GB',{hour12:false})+' local · Analysis snapshot'),e('span','','Current candle may still be forming'));if(quote)timestamp.append(e('span','','Latest quote: '+new Date(quote.timestamp).toLocaleTimeString('en-GB',{hour12:false})+' local'));content.append(timestamp);
 const stale=quote&&Date.now()-quote.timestamp>120000;if(stale){const warning=e('div','ai-warning','The latest quote is over two minutes old. This overview may not reflect current conditions.');content.append(warning);}
 if(mode==='outlook'){
  const higher=aligned.filter(([tf])=>['1h','4h'].includes(tf));if(higher.some(([,v])=>v==='Unavailable')||higher.length<2){section('INTRADAY CONTEXT','Broader history is incomplete','Higher-timeframe readings are still loading. The report below covers the current chart; a full-day outlook is not established.');}
  else section('INTRADAY CONTEXT','Higher timeframes set the context',higher.map(([f,v])=>f+': '+v).join(' · ')+'. These readings provide context, not a forecast of the day’s closing price.','This preview uses the existing 1-hour and 4-hour confluence outputs. No economic news, full session analysis, or statistical forecasting service is connected.');
 }
 section('01 / MARKET OVERVIEW',bias==='mixed'?'A mixed technical picture':bias==='upward'?'An upward technical bias':'A downward technical bias',bias==='mixed'?'The active price-based averages do not establish a consistent directional reading. It is worth separating the immediate move from broader timeframe conditions.':'Price is '+(bias==='upward'?'above more of':'below more of')+' the active reference lines. That describes its current position; momentum and timeframe alignment may still disagree.',`${above} active reference lines are below price; ${below} are above price. These related averages use overlapping price data and are not independent confirmation. Current price: ${display(price)}. Last completed close: ${display(previous?.close)}.`);
 const indicatorCard=section('02 / YOUR INDICATORS','Readings behind the picture','Only enabled indicators are included in these readings.');const table=e('div','ai-readings');
 const row=(name,value,state)=>{const r=e('div','ai-reading');r.append(e('strong','',name),e('span','',value),e('small','',state));table.append(r);};
 if($('vwapOn').checked)row('VWAP AA',display(vwap),!Number.isFinite(vwap)?'Insufficient weighted history':price>=vwap?'Price above weighted average':'Price below weighted average');
 if($('tramaOn').checked)row('TRAMA',display(trama),price>=trama?'Price above adaptive line':'Price below adaptive line');
 if($('bbOn').checked)row('Bollinger basis',display(basis),price>=basis?'Price above basis':'Price below basis');
 if($('rsiOn').checked)row('RSI',Number.isFinite(rsi)?rsi.toFixed(1):'Unavailable',rsi>OscSettings.rsi.upper?'Above upper guide':rsi<OscSettings.rsi.lower?'Below lower guide':rsi>=50?'Above midpoint':'Below midpoint');
 if($('maOn').checked)row('RSI moving average',display(lastFinite(OscSettings.series(data).ma)),'Smoothing of RSI, not price');
 if(!table.children.length)table.append(e('p','','No supported indicators are currently enabled.'));indicatorCard.append(table);indicatorCard.append(e('small','ai-caveat','This layout preview covers the core indicators. Full indicator-library coverage belongs in the connected analyst.'));
 if($('engineOn').checked){const mtf=section('03 / HEISENBERG MTF',bull&&bear?'Timeframes are not fully aligned':bull?'Bullish readings across available timeframes':bear?'Bearish readings across available timeframes':'Confluence is incomplete',`${bull} bullish · ${bear} bearish · ${aligned.length-bull-bear} neutral or unavailable. Read this as context across timeframes, not a guarantee of the next move.`);const cells=e('div','ai-mtf');for(const [f,state] of aligned){const c=e('div',state==='Bullish'?'bull':state==='Bearish'?'bear':'neutral');c.append(e('small','',f.replace('min','m')),e('strong','',state==='Unavailable'?'No data':state));cells.append(c);}mtf.append(cells);}
 section('04 / PRICE STRUCTURE','Recent range boundaries',`Recent completed candles span ${display(support)} to ${display(resistance)}. These are observed range edges, not validated support and resistance zones.`,`Calculated from the high and low of the latest ${available.length} completed candles. Confirmed swing-structure detection is not implemented in this design preview.`);
 const scenarios=section('05 / POSSIBLE SCENARIOS','Watch the conditions, not a prediction','Use these as conditional observations. Their relative likelihood has not been measured.');
 for(const [title,text] of [['Upside continuation',`A completed close above ${display(resistance)} would put price beyond the recent range high. A return inside the range would weaken that breakout interpretation.`],['Downside extension',`A completed close below ${display(support)} would put price beyond the recent range low. Reclaiming that level would weaken the breakdown interpretation.`],['Range persists',`If neither boundary holds a break, price can continue rotating inside the recent range while indicator readings remain mixed.`]]){const block=e('div','ai-scenario');block.append(e('strong','',title),e('p','',text));scenarios.append(block);}
 section('06 / WHAT CHANGES THE VIEW','Reassess as the evidence changes','A change in price position relative to active averages, RSI momentum, or higher-timeframe alignment can change this interpretation. Update the snapshot after meaningful movement or a completed candle.');
 content.append(e('div','ai-data-note',`${data.length} chart candles · ${entry()?.volumeType==='tick'?'Tick activity weights':'Volume source varies'} · No news feed connected.\nPreview explanations use fixed rules, not an AI model. They do not establish trade profitability.`));
}
function snapshot(){
 const data=bars(),engine=computeEngine(),indicators=[];const add=(id,name,value)=>{if($(id).checked)indicators.push({name,value:Number.isFinite(value)?value:null});};
 add('vwapOn','VWAP AA',lastFinite(VwapAA.plots(data,frame)[0].values));add('tramaOn','TRAMA',lastFinite(TramaSettings.series(data)));add('bbOn','Bollinger basis',lastFinite(BBSettings.plots(data,frame,cache.get(markets[selected].symbol+'|'+BBSettings.settings.timeframe)?.bars)[0].values));const osc=OscSettings.series(data);add('rsiOn','RSI',lastFinite(osc.rsi));add('maOn','Moving Average',lastFinite(osc.ma));
 return {version:1,requestId:crypto.randomUUID(),symbol:markets[selected].symbol,frame,mode,capturedAt:Date.now(),candles:data.slice(-600).map(b=>({time:b.time,open:b.open,high:b.high,low:b.low,close:b.close,volume:b.volume})),indicators,mtf:engine.table,settings:{bb:{length:BBSettings.settings.length,mult:BBSettings.settings.mult,ma:BBSettings.settings.ma,source:BBSettings.settings.source,timeframe:BBSettings.settings.timeframe},rsi:{length:OscSettings.rsi.length,source:OscSettings.rsi.source},trama:{length:TramaSettings.settings.length,source:TramaSettings.settings.source},vwap:{anchor:VwapAA.settings.anchor,sessionTimezone:VwapAA.settings.sessionTimezone,sessionStart:VwapAA.settings.sessionStart,length:VwapAA.settings.length,source:VwapAA.settings.source,mode:VwapAA.settings.mode},engine:EngineSettings.inputs}};
}
async function connected(id,key){
 const controller=new AbortController();activeController=controller;const timeout=setTimeout(()=>controller.abort(),30000);
 try{const response=await fetch('/charts/app/api/analysis',{method:'POST',headers:{'content-type':'application/json'},credentials:'same-origin',body:JSON.stringify(snapshot()),signal:controller.signal});const report=await response.json();if(id!==request||key!==signature())return;
 content.replaceChildren();if(!response.ok)throw Error(report.error?.message||'Analysis is unavailable.');
 if(report.symbol!==markets[selected].symbol||report.frame!==frame||!Array.isArray(report.sections))throw Error('Analysis context did not match this chart.');
 note.textContent='CONNECTED SERVICE · '+new Date(report.generatedAt).toLocaleTimeString();
 for(const item of report.sections){const card=section(item.id.toUpperCase(),item.title,item.summary,item.reasoning);for(const ref of item.levelRefs||[]){const value=report.levels?.[ref];if(Number.isFinite(value))card.append(e('small','ai-caveat',ref+': '+display(value)));}for(const eventId of item.eventRefs||[]){const event=report.calendar?.events?.find(event=>event.id===eventId);if(event){const when=Number.isFinite(event.ts)?new Date(event.ts*1000).toLocaleString(undefined,{timeZone:'UTC'})+' UTC':'Time unavailable';card.append(e('small','ai-caveat',[event.title,when,event.currency,event.actual?'Actual: '+event.actual:'Result not available'].filter(Boolean).join(' · ')));}}}
 for(const warning of report.warnings||[])content.append(e('p','ai-data-note',warning));reportKey=key;
 }catch(error){if(id===request){content.replaceChildren();section('SERVICE CONNECTION','AI is not connected yet',error.message);note.textContent='CORTEXA AI · Service unavailable. Please retry.';}}
 finally{clearTimeout(timeout);if(activeController===controller)activeController=null;if(id===request){busy=false;action.disabled=false;action.textContent='Update analysis';}}
}
action.onclick=()=>{
 if(busy)return;busy=true;const id=++request,key=signature();action.disabled=true;action.textContent='Reading your chart…';content.classList.remove('ai-outdated');content.replaceChildren(e('div','ai-loading','✦  Gathering chart readings…'));
 connected(id,key);
};
setInterval(()=>{if(!panel.hidden)sync();},350);
// Open the first-use preview so its proposed placement and content are immediately visible.
// The live chart opens without an unsolicited analysis panel.
})();
