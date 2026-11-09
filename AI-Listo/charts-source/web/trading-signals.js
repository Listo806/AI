'use strict';
(()=>{
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 const id=window.ChartEmbed?ChartEmbed.id:'single',monitor=SignalMonitor.create();let snapshot=null,lastEnabled=null,prefs={alerts:false,sound:false},renderTimer;
 try{const saved=JSON.parse(ChartStorage.getItem('heisenberg-alert-preferences')||'null');if(saved)prefs={alerts:saved.alerts===true,sound:saved.sound===true};}catch{}
 try{const enabled=ChartStorage.getItem('heisenberg-signals-enabled');if(enabled!==null&&!$('engineOn').closest('.indicator-box')?.classList.contains('picker-removed'))$('engineOn').checked=enabled==='true';}catch{}
 function enabled(){return $('engineOn').checked&&!$('engineOn').closest('.indicator-box')?.classList.contains('picker-removed');}
 function capture(engine){
  const on=enabled(),data=bars(),now=Date.now(),duration=Heisenberg.durations[frame]||86400000;
  if(on!==lastEnabled){ChartStorage.setItem('heisenberg-signals-enabled',String(on));lastEnabled=on;}
  let latestClosed=0;for(const bar of data){const end=bar.endTime??bar.time+duration;if(end<=now)latestClosed=Math.max(latestClosed,end);}
  const signals=engine.signals.flatMap(signal=>{const bar=data[signal.index];if(!bar)return [];const closedAt=bar.endTime??bar.time+duration;if(closedAt>now)return [];return [{id:markets[selected].symbol+'|'+frame+'|'+bar.time+'|'+signal.side,symbol:markets[selected].symbol,frame,side:signal.side,time:bar.time,closedAt,price:bar.close}];}).sort((a,b)=>b.closedAt-a.closedAt).slice(0,40);
  const states=Object.values(engine.table),bullish=states.filter(v=>v==='Bullish').length,bearish=states.filter(v=>v==='Bearish').length,available=states.filter(v=>v!=='Unavailable').length;
  snapshot={chartId:id,enabled:on,symbol:markets[selected].symbol,frame,signals,latestClosed,now,duration,bullish,bearish,available,prefs:{...prefs},context:markets[selected].symbol+'|'+frame+'|'+JSON.stringify(EngineSettings.inputs),hasHistory:data.length>0,hasVolume:data.length>0&&data.every(b=>Number.isFinite(b.volume)),reference:!!entry()?.reference};
  const fresh=SignalMonitor.observe(monitor,snapshot);
  if(ChartEmbed){parent.ChartSignals?.receive(id,snapshot,fresh);}
  else{queueRender();if(prefs.alerts)for(const signal of fresh)notify(signal,prefs.sound,'single');}
 }
 function setPrefs(value){prefs={alerts:value.alerts===true,sound:value.sound===true};ChartStorage.setItem('heisenberg-alert-preferences',JSON.stringify(prefs));capture(computeEngine());}
 function enable(){
  const check=$('engineOn');check.closest('.indicator-box')?.classList.remove('picker-removed');check.checked=true;
  try{const saved=JSON.parse(ChartStorage.getItem('market-indicator-picker-v1')||'null');if(saved){saved.removed=(saved.removed||[]).filter(value=>value!=='engineOn');ChartStorage.setItem('market-indicator-picker-v1',JSON.stringify(saved));}}catch{}
  ChartStorage.setItem('heisenberg-signals-enabled','true');draw();capture(computeEngine());
 }
 function viewSignal(signal){if(signal.symbol!==markets[selected].symbol)return;const index=bars().findIndex(bar=>bar.time===signal.time);if(index<0)return;count=170;offset=bars().length-count-(index-Math.floor(count*.65));verticalScales.price={factor:1,center:null};hover=-1;crosshair=null;draw();}
 const priorUpdate=updateMTF;updateMTF=function(engine){priorUpdate(engine);capture(engine);};
 if(ChartEmbed){window.ChartSignals={enable,setPrefs,viewSignal,get snapshot(){return snapshot;}};capture(computeEngine());draw();return;}
 const records=new Map();
 function source(){if(window.ChartLayouts?.multiple){const pane=ChartLayouts.chartWindow();return pane?.ChartSignals||null;}return {enable,setPrefs,viewSignal,get snapshot(){return snapshot;}};}
 function current(){return source()?.snapshot||null;}
 const menu=$('chartAccountMenu'),open=el('button','','Trading Signals');open.id='tradingSignalsButton';open.type='button';open.setAttribute('aria-controls','tradingSignalsPanel');open.setAttribute('aria-expanded','false');
 const oldAlerts=[...menu.querySelectorAll('button')].find(b=>b.textContent.startsWith('Alerts'));if(oldAlerts)oldAlerts.replaceWith(open);else menu.insertBefore(open,menu.querySelector('button'));
 const panel=el('section','trading-signals-panel');panel.id='tradingSignalsPanel';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','false');panel.setAttribute('aria-label','Trading Signals');
 const head=el('div','signals-head'),heading=el('div'),title=el('h2','','Trading Signals'),subtitle=el('p','','Powered by Heisenberg Confluence MTF'),close=el('button','signals-close','×');close.setAttribute('aria-label','Close trading signals');heading.append(title,subtitle);head.append(heading,close);const body=el('div','signals-body');panel.append(head,body);document.body.append(panel);
 function dismiss(){panel.hidden=true;open.setAttribute('aria-expanded','false');}
 close.onclick=dismiss;open.onclick=()=>{closeChartAccount();panel.hidden=!panel.hidden;open.setAttribute('aria-expanded',String(!panel.hidden));if(!panel.hidden){renderPanel();close.focus();}};document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden){dismiss();$('chartAccountButton').focus();}});
 function queueRender(){if(panel.hidden||renderTimer)return;renderTimer=setTimeout(()=>{renderTimer=null;renderPanel();},250);}
 function frameName(tf){return chartTimeframeLabel(tf);}
 let lastRendered='';
 function renderPanel(){
  const state=current(),fingerprint=state?JSON.stringify({...state,now:0}):'loading';if(fingerprint===lastRendered)return;lastRendered=fingerprint;body.replaceChildren();if(!state){body.append(el('p','signals-muted','Select a chart. Signals will appear when its market data is ready.'));return;}
  body.append(el('div','signals-context',state.symbol+' · '+frameName(state.frame)+(ChartLayouts?.multiple?' · Chart '+(Number(ChartLayouts.activeId)+1):'')));
  const stateLine=el('div','signals-state '+(state.enabled?'is-on':'is-off'),state.enabled?'● Signals active':'○ Signals off');body.append(stateLine);
  if(!state.enabled){body.append(el('p','signals-muted','Enable Heisenberg Confluence MTF on this chart to activate trading signals.'));const enableButton=el('button','signals-enable','Enable Heisenberg Confluence MTF');enableButton.onclick=()=>{source()?.enable();renderPanel();};body.append(enableButton);}
  const alignment=el('div','signals-alignment');alignment.append(el('strong','','Current timeframe alignment'),el('p','',state.bullish+' / 6 bullish · '+state.bearish+' / 6 bearish'),el('small','',state.available+' / 6 timeframes available · Alignment is separate from a Buy or Sell signal.'));body.append(alignment);
  const settings=el('fieldset','signals-alert-settings'),legend=el('legend','','Alerts for this chart');settings.append(legend);
  for(const [key,label]of [['alerts','Notify me of new signals'],['sound','Play a sound']]){const row=el('label'),check=el('input');check.type='checkbox';check.checked=state.prefs[key];check.disabled=!state.enabled||(key==='sound'&&!state.prefs.alerts);check.setAttribute('aria-label',label);check.onchange=()=>{const next={...state.prefs,[key]:check.checked};if(next.alerts&&next.sound)unlockSound();source()?.setPrefs(next);renderPanel();};row.append(check,document.createTextNode(label));settings.append(row);}
  settings.append(el('small','','In-page notifications while this page is open. Only new completed-candle signals trigger alerts.'));body.append(settings);
  body.append(el('h3','','Recent signals'));
  if(!state.enabled){body.append(el('p','signals-muted','Turn on the indicator to view its signals.'));return;}
  if(state.reference||!state.hasVolume){body.append(el('p','signals-muted','Heisenberg needs candle history with volume. Signals are unavailable until that data is loaded.'));return;}
  if(!state.signals.length){body.append(el('p','signals-muted','No confirmed signals in the loaded history. Waiting for the next setup.'));return;}
  for(const signal of state.signals.slice(0,20)){
   const row=el('button','signal-history-row');row.type='button';row.setAttribute('aria-label','View '+signal.side+' signal for '+signal.symbol+' '+frameName(signal.frame)+' at '+new Date(signal.closedAt).toISOString());
   const side=el('span','signal-side '+signal.side.toLowerCase(),signal.side),detail=el('span','signal-detail'),date=new Date(signal.closedAt);detail.append(el('strong','',signal.symbol+' · '+frameName(signal.frame)),el('small','',date.toISOString().slice(0,16).replace('T',' ')+' UTC'),el('small','','Closed candle · '+signal.price.toFixed(signal.symbol.endsWith('JPY')?3:signal.price<10?5:3)));row.append(side,detail,el('span','signal-view','View chart ›'));row.onclick=()=>source()?.viewSignal(signal);body.append(row);
  }
 }
 let audioContext=null;function unlockSound(){try{audioContext=audioContext||new(window.AudioContext||window.webkitAudioContext)();audioContext.resume().catch(()=>{});}catch{}}
 function beep(){try{if(!audioContext||audioContext.state!=='running')return;const oscillator=audioContext.createOscillator(),gain=audioContext.createGain();oscillator.connect(gain);gain.connect(audioContext.destination);oscillator.frequency.value=640;gain.gain.setValueAtTime(.07,audioContext.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+.2);oscillator.start();oscillator.stop(audioContext.currentTime+.2);}catch{}}
 const toasts=el('div','signal-toasts');toasts.setAttribute('role','status');toasts.setAttribute('aria-live','polite');document.body.append(toasts);
 function notify(signal,sound,chartId){const toast=el('button','signal-toast '+signal.side.toLowerCase(),signal.side+' · '+signal.symbol+' · '+frameName(signal.frame)+' — new Heisenberg signal');toast.onclick=()=>{if(chartId!=='single')ChartLayouts.focusChart(chartId);source()?.viewSignal(signal);toast.remove();};toasts.append(toast);while(toasts.children.length>3)toasts.firstChild.remove();setTimeout(()=>toast.remove(),12000);if(sound)beep();}
 window.ChartSignals={receive(chartId,state,fresh=[]){records.set(String(chartId),state);queueRender();if(!ChartLayouts.multiple)return;if(state.prefs.alerts)for(const signal of fresh)notify(signal,state.prefs.sound,String(chartId));},enable,setPrefs,viewSignal,get snapshot(){return snapshot;},refresh:queueRender};
 // Only charts that are actually open are monitored; enabling seeds history without replaying old alerts.
 capture(computeEngine());draw();
 setInterval(()=>{if(!panel.hidden)renderPanel();},5000);
})();
