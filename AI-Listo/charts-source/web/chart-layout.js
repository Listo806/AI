'use strict';
(()=>{
 const allowed=[1,2,4,8,16],frames=[['1min','M1'],['5min','M5'],['15min','M15'],['30min','M30'],['1h','H1'],['2h','H2'],['4h','H4'],['1day','D1'],['1week','W1'],['1month','MN1']];
 const make=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;};
 if(ChartEmbed){
  const originalRender=render;render=function(){originalRender();window.ChartPaneAPI?.notify();};
  const switches=['priceOn','bbOn','vwapOn','tramaOn','engineOn','rsiOn','maOn'];
  try{const saved=JSON.parse(ChartStorage.getItem('chart-panel-switches')||'null');if(saved)for(const id of switches)if(typeof saved[id]==='boolean')$(id).checked=saved[id];}catch{}
  let lastSwitches='';const paneDraw=draw;draw=function(){if(window.frameElement?.parentElement?.hidden)return;paneDraw();const value=JSON.stringify(Object.fromEntries(switches.map(id=>[id,$(id).checked])));if(value!==lastSwitches){ChartStorage.setItem('chart-panel-switches',value);lastSwitches=value;}};
  let header,symbolSelect,frameSelect;
  window.ChartPaneAPI={
   notify(){if(symbolSelect)symbolSelect.value=markets[selected].symbol;if(frameSelect)frameSelect.value=frame;parent.ChartLayouts?.update(ChartEmbed.id,{symbol:markets[selected].symbol,frame,style:chartStyle});},
   market(symbol){const index=markets.findIndex(m=>m.symbol===symbol);if(index<0)return;selectMarket(index);LiveStream.reload();this.notify();},
   timeframe(value){if(!frames.some(([tf])=>tf===value))return;selectFrame(value).then(()=>this.notify());},
   command(action){const target=action==='indicators'?document.querySelector('.market-tools button:last-child'):action==='calendar'?$('calendarButton'):action==='ai'?$('cortexaAI'):action==='candles'?$('candlesStyle'):action==='line'?$('lineStyle'):action==='reset'?$('reset'):null;target?.click();this.notify();},
   range(value){document.querySelector('[data-range="'+value+'"]')?.click();},
   activate(){parent.ChartLayouts?.activate(ChartEmbed.id);}
  };
  header=make('div','pane-local-header');symbolSelect=make('select','pane-symbol');symbolSelect.setAttribute('aria-label','Chart market');for(const m of MarketCatalog){const option=make('option','',m.name);option.value=m.symbol;symbolSelect.append(option);}symbolSelect.value=markets[selected].symbol;symbolSelect.onchange=()=>ChartPaneAPI.market(symbolSelect.value);
  frameSelect=make('select','pane-frame');frameSelect.setAttribute('aria-label','Chart timeframe');for(const [value,label]of frames){const option=make('option','',label);option.value=value;frameSelect.append(option);}frameSelect.value=frame;frameSelect.onchange=()=>ChartPaneAPI.timeframe(frameSelect.value);
  const indicators=make('button','pane-indicators','⌁');indicators.title='Indicators';indicators.setAttribute('aria-label','Chart indicators');indicators.onclick=()=>ChartPaneAPI.command('indicators');
  const maximize=make('button','pane-maximize','⛶');maximize.title='Maximize / restore chart';maximize.setAttribute('aria-label','Maximize or restore chart');maximize.onclick=()=>parent.ChartLayouts?.maximize(ChartEmbed.id);
  header.append(symbolSelect,frameSelect,indicators,maximize);document.querySelector('article').prepend(header);
  document.addEventListener('pointerdown',()=>ChartPaneAPI.activate(),true);document.addEventListener('focusin',()=>ChartPaneAPI.activate());
  ChartPaneAPI.notify();LiveStream.reload();draw();
  return;
 }
 const actions=document.querySelector('.actions'),button=make('button','view-charts-button','▦ Charts');button.id='viewChartsButton';button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls','chartLayoutPicker');actions.insertBefore(button,document.querySelector('.chart-styles'));
 // Native fullscreen expands the entire workspace without changing the chart layout.
 const fullscreenButton=make('button','view-charts-button','⛶');
 fullscreenButton.id='chartFullscreenButton';fullscreenButton.type='button';
 fullscreenButton.setAttribute('aria-pressed','false');button.after(fullscreenButton);
 fullscreenButton.hidden=!document.fullscreenEnabled;
 function syncFullscreen(){
  const active=Boolean(document.fullscreenElement);
  fullscreenButton.textContent=active?'⛶ Exit full screen':'⛶ Full screen';
  fullscreenButton.setAttribute('aria-label',active?'Exit full screen':'Full screen');
  fullscreenButton.setAttribute('aria-pressed',String(active));
  fullscreenButton.title=active?'Exit full screen (Esc)':'View workspace full screen';
  requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));
 }
 fullscreenButton.onclick=async()=>{
  try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}
  catch{fullscreenButton.title='Full screen is unavailable in this browser context';}
 };
 document.addEventListener('fullscreenchange',syncFullscreen);syncFullscreen();
 $('reset').textContent='Reset';
 const picker=make('div','chart-layout-picker');picker.id='chartLayoutPicker';picker.hidden=true;picker.setAttribute('role','group');picker.setAttribute('aria-label','Chart layout');picker.append(make('strong','','View Charts'));
 let layout=1,active='0',maximized=null;const panes=new Map(),states=new Map(),single=document.querySelector('.chart-shell'),grid=make('section','chart-grid');grid.hidden=true;grid.setAttribute('aria-label','Multiple charts');single.after(grid);document.body.append(picker);
 try{const saved=JSON.parse(ChartStorage.getItem('chart-layout-v1')||'null');if(saved){if(allowed.includes(saved.layout))layout=saved.layout;for(const item of saved.panes||[])if(/^\d{1,2}$/.test(String(item.id))&&MarketCatalog.some(m=>m.symbol===item.symbol)&&frames.some(([tf])=>tf===item.frame))states.set(String(item.id),item);}}catch{}
 const save=()=>{ChartStorage.setItem('chart-layout-v1',JSON.stringify({layout,panes:[...states.values()]}));};
 function close(){picker.hidden=true;button.setAttribute('aria-expanded','false');}
 button.onclick=()=>{const open=picker.hidden;picker.hidden=!open;button.setAttribute('aria-expanded',String(open));if(open){const rect=button.getBoundingClientRect();picker.style.top=rect.bottom+5+'px';picker.style.right=Math.max(8,innerWidth-rect.right)+'px';}};
 document.addEventListener('pointerdown',event=>{if(!picker.contains(event.target)&&!button.contains(event.target))close();});document.addEventListener('keydown',event=>{if(event.key==='Escape'){close();if(maximized!==null)maximize(maximized);}});
 const options=new Map();for(const n of allowed){const option=make('button','layout-choice'),icon=make('span','layout-mini-grid');icon.style.setProperty('--columns',n===1?1:n===2?2:n===4?2:4);for(let i=0;i<n;i++)icon.append(make('i'));option.append(icon,make('span','',n+' '+(n===1?'chart':'charts')));option.setAttribute('aria-label','View '+n+' '+(n===1?'chart':'charts'));option.onclick=()=>{setLayout(n);close();};picker.append(option);options.set(n,option);}
 const status=make('span','chart-grid-status');status.setAttribute('role','status');fullscreenButton.after(status);
 function syncToolbar(){window.ChartOneClick?.syncHost();if(layout===1)return;const state=states.get(active);if(!state)return;const label=$('chartTicker');if(label)label.textContent=state.symbol;document.querySelectorAll('[data-frame]').forEach(b=>b.classList.toggle('active',b.dataset.frame===state.frame));document.querySelectorAll('[data-range]').forEach(b=>b.classList.remove('active'));$('candlesStyle').setAttribute('aria-pressed',String(state.style!=='line'));$('lineStyle').setAttribute('aria-pressed',String(state.style==='line'));$('candlesStyle').classList.toggle('active',state.style!=='line');$('lineStyle').classList.toggle('active',state.style==='line');status.textContent='Chart '+(Number(active)+1)+(maximized!==null?' · maximized':'');}
 function activate(id){id=String(id);if(!panes.has(id))return;active=id;for(const [key,pane]of panes)pane.classList.toggle('active',key===active);syncToolbar();window.ChartSignals?.refresh();}
 function maximize(id){id=String(id);maximized=maximized===id?null:id;grid.classList.toggle('chart-grid-maximized',maximized!==null);for(const [key,pane]of panes)pane.hidden=maximized!==null&&key!==maximized;activate(id);status.textContent=maximized!==null?'Chart '+(Number(id)+1)+' · maximized':'Chart '+(Number(active)+1);}
 function setLayout(n){
  if(!allowed.includes(n))return;layout=n;maximized=null;grid.classList.remove('chart-grid-maximized');document.body.classList.toggle('multi-chart-mode',n>1);grid.hidden=n===1;single.hidden=n>1;button.textContent='▦ Charts'+(n>1?' · '+n:'');
  for(const [count,option]of options){option.classList.toggle('selected',count===n);option.setAttribute('aria-pressed',String(count===n));}
  for(const [id,pane]of panes){if(Number(id)>=n||n===1){ChartGridHost.remove(id);pane.remove();panes.delete(id);}else pane.hidden=false;}
  if(n>1){grid.style.setProperty('--grid-columns',n===2?2:n===4?2:4);grid.style.setProperty('--grid-rows',n===2?1:n===4?2:n===8?2:4);
   for(let i=0;i<n;i++){const id=String(i);if(panes.has(id))continue;let state=states.get(id);if(!state){state={id,symbol:markets[i%markets.length].symbol,frame};states.set(id,state);}const pane=make('div','chart-grid-pane'),iframe=make('iframe');pane.dataset.pane=id;iframe.title='Chart '+(i+1)+' · '+state.symbol;iframe.src=(window.CORTEXA_CHARTS_APP_PATH||location.pathname)+'?'+new URLSearchParams({embed:'chart',pane:id,symbol:state.symbol,frame:state.frame,style:state.style||'candles'});pane.append(iframe);panes.set(id,pane);grid.append(pane);}
   activate(panes.has(active)?active:'0');
  }else{status.textContent='';render();}
  save();
 }
 window.ChartLayouts={activate,maximize,get activeId(){return active;},get multiple(){return layout>1;},chartWindow(id=active){return panes.get(String(id))?.querySelector('iframe')?.contentWindow;},focusChart(id){id=String(id);if(maximized!==null&&maximized!==id)maximize(maximized);activate(id);},update(id,state){id=String(id);const previous=states.get(id);if(previous&&previous.symbol===state.symbol&&previous.frame===state.frame&&previous.style===state.style){if(active===id)syncToolbar();return;}states.set(id,{id,...state});const pane=panes.get(id);if(pane)pane.querySelector('iframe').title='Chart '+(Number(id)+1)+' · '+state.symbol;if(active===id)syncToolbar();save();}};
 const target=()=>panes.get(active)?.querySelector('iframe')?.contentWindow.ChartPaneAPI;
 const parentDraw=draw;draw=function(){if(layout>1){syncToolbar();return;}parentDraw();};
 const parentRender=render;render=function(){parentRender();syncToolbar();};
 const originalSelect=selectMarket;selectMarket=function(index){originalSelect(index);if(layout>1){target()?.market(markets[index].symbol);syncToolbar();}};
 actions.addEventListener('click',event=>{if(layout===1)return;const b=event.target.closest('button');if(!b||b===button||b.closest('#chartLayoutPicker'))return;let action=b===document.querySelector('.market-tools button:last-child')?'indicators':b.id==='calendarButton'?'calendar':b.id==='cortexaAI'?'ai':b.id==='candlesStyle'?'candles':b.id==='lineStyle'?'line':b.id==='reset'?'reset':null;if(action){event.preventDefault();event.stopImmediatePropagation();target()?.command(action);}},true);
 document.querySelector('.chart-navigation').addEventListener('click',event=>{if(layout===1)return;const b=event.target.closest('button');if(b?.dataset.frame){event.preventDefault();event.stopImmediatePropagation();target()?.timeframe(b.dataset.frame);}else if(b?.dataset.range){event.preventDefault();event.stopImmediatePropagation();target()?.range(b.dataset.range);}},true);
 window.addEventListener('resize',close);setLayout(layout);
})();
