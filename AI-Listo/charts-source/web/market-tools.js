'use strict';
// Market and indicator pickers; existing chart and live feed remain authoritative.
(()=>{
const groups={"Forex":[["EUR/USD","EUR/USD"],["GBP/USD","GBP/USD"],["USD/JPY","USD/JPY"],["USD/CHF","USD/CHF"],["USD/CAD","USD/CAD"],["AUD/USD","AUD/USD"],["NZD/USD","NZD/USD"],["GBP/JPY","GBP/JPY"],["EUR/JPY","EUR/JPY"],["AUD/JPY","AUD/JPY"],["CAD/JPY","CAD/JPY"],["CHF/JPY","CHF/JPY"],["NZD/JPY","NZD/JPY"],["EUR/GBP","EUR/GBP"],["EUR/AUD","EUR/AUD"],["EUR/CAD","EUR/CAD"],["EUR/CHF","EUR/CHF"],["GBP/AUD","GBP/AUD"],["GBP/CAD","GBP/CAD"],["AUD/NZD","AUD/NZD"]],"Metals":[["Gold","XAU/USD"],["Silver","XAG/USD"],["Copper","XCU/USD"],["Platinum","XPT/USD"],["Palladium","XPD/USD"]],"Energy":[["WTI Crude Oil","USOIL"],["Brent Crude Oil","UKOIL"],["Natural Gas","XNG/USD"]],"Indices":[["S&P 500","US500"],["Nasdaq 100","USTEC"],["Dow Jones 30","US30"],["Germany 30","DE30"],["UK 100","UK100"],["Japan 225","JP225"],["Australia 200","AUS200"],["Euro Stoxx 50","STOXX50"]],"Context":[["U.S. Dollar Index","DXY"]]};
const originals=[['Bollinger Bands','bbOn','Volatility bands'],['VWAP AA','vwapOn','Anchored average & deviation'],['TRAMA','tramaOn','Adaptive moving average'],['Heisenberg Confluence','engineOn','Confluence channels & signals'],['RSI','rsiOn','Momentum oscillator'],['RSI Moving Average','maOn','Lower panel · RSI smoothing']];
const extraDefs=[['ema','EMA','Exponential moving average',20,'#b695ff'],['sma','SMA','Simple moving average',50,'#ff9b60'],['volume','Volume','Tick activity · quote counts',20,'#49c9a1'],['macd','MACD','12 / 26 momentum · 9 signal',9,'#63aaff'],['atr','ATR','Average true range',14,'#ffbc66'],['stoch','Stochastic','14-period %K · 3-period %D',14,'#b99aff'],['donchian','Donchian Channels','Rolling high and low',20,'#66d3e2']];
extraDefs.push(['adx','ADX / DMI','Trend strength · +DI and −DI',14,'#d8a6ff'],['stochrsi','Stochastic RSI','RSI momentum · K and D',14,'#63aaff'],['supertrend','Supertrend','ATR trend overlay',10,'#49c98e'],['keltner','Keltner Channels','EMA and ATR channels',20,'#6bcde1'],['pivots','Pivot Points','Traditional prior-period levels',14,'#dfc36a'],['hma','Hull Moving Average','Hull weighted average',9,'#e7bc6b']);
extraDefs.push(...ChartStudies.catalog.map(([key,name,period,color])=>[key,name,'',period,color]));
const isLower=key=>['volume','macd','atr','stoch'].includes(key)||ChartStudies.lower.has(key);
const groupFor=key=>ChartStudies.catalog.find(d=>d[0]===key)?.[4]||({volume:'Volumes',macd:'Oscillators',atr:'Oscillators',stoch:'Oscillators',stochrsi:'Oscillators'}[key]||'Trend');
const displayName=(name,key)=>({sma:'Moving Average',ema:'Exponential Moving Average',adx:'Average Directional Movement Index',volume:'Volumes',atr:'Average True Range',stoch:'Stochastic Oscillator',rsiOn:'Relative Strength Index',maOn:'Moving Average · RSI',engineOn:'Heisenberg Confluence MTF'}[key]||name);
const categoryOpen=new Map();
let smoothingTarget='rsi';
const favoriteSymbols=new Set();
try{const saved=JSON.parse(ChartStorage.getItem('market-watch-favorites-v1')||'[]');if(Array.isArray(saved))for(const symbol of saved)if(Object.values(groups).some(items=>items.some(item=>item[1]===symbol)))favoriteSymbols.add(symbol);}catch{}
function favoriteButton(m){const saved=favoriteSymbols.has(m.symbol),button=el('button','indicator-row-action market-favorite'+(saved?' is-favorite':''),saved?'★':'☆');button.setAttribute('aria-label',(saved?'Remove ':'Save ')+m.name+(saved?' from Favorites':' to Favorites'));button.setAttribute('aria-pressed',String(saved));button.title=button.getAttribute('aria-label');button.onclick=()=>{if(favoriteSymbols.has(m.symbol))favoriteSymbols.delete(m.symbol);else favoriteSymbols.add(m.symbol);try{ChartStorage.setItem('market-watch-favorites-v1',JSON.stringify([...favoriteSymbols]));}catch{}renderRows();};return button;}
const extras=new Map();let mode='markets',category='Open Markets',search='',slot=selected,menu=null,marketOpenRequest=0;
const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
const controls=el('div','market-tools');const watchButton=el('button','market-tool','☷  Market Watch'),indButton=el('button','market-tool','⌁  Indicators');controls.append(watchButton,indButton);document.querySelector('.actions').prepend(controls);
const veil=el('div','picker-veil');veil.hidden=true;const drawer=el('section','market-picker');drawer.hidden=true;drawer.setAttribute('role','dialog');drawer.setAttribute('aria-modal','true');drawer.setAttribute('aria-label','Market Watch');document.body.append(veil,drawer);
const head=el('div','picker-head'),heading=el('div'),kicker=el('small','','YOUR WORKSPACE'),title=el('h2','','Market Watch'),close=el('button','picker-close','×');close.setAttribute('aria-label','Close picker');heading.append(kicker,title);head.append(heading,close);
const description=el('p','picker-description'),input=el('input','picker-search');input.type='search';input.setAttribute('aria-label','Search markets or indicators');
const slotBar=el('div','picker-slots'),tabs=el('div','picker-tabs'),list=el('div','picker-list'),foot=el('div','picker-foot');drawer.append(head,description,input,slotBar,tabs,list,foot);
function dismiss(){drawer.hidden=true;veil.hidden=true;closeMenu();(mode==='markets'?watchButton:indButton).focus();}
close.onclick=veil.onclick=dismiss;document.addEventListener('keydown',e=>{if(e.key==='Escape')dismiss();});
function show(which){mode=which;if(which==='markets')category='Open Markets';drawer.classList.add('indicator-dropdown');drawer.classList.toggle('market-watch-dropdown',which==='markets');drawer.setAttribute('aria-modal','false');{const rect=(which==='markets'?watchButton:indButton).getBoundingClientRect();drawer.style.top=Math.min(rect.bottom+5,window.innerHeight-220)+'px';drawer.style.right=Math.max(8,window.innerWidth-rect.right)+'px';}search='';input.value='';slot=selected;drawer.hidden=false;veil.hidden=true;title.textContent=which==='markets'?'Market Watch':'Indicators';drawer.setAttribute('aria-label',title.textContent);input.placeholder=which==='markets'?'Search symbol or market…':'Search indicators…';description.textContent=which==='markets'?'Open markets and save favorites with the star.':'Your setup, your choice. Add only what you need.';slotBar.hidden=true;tabs.hidden=which!=='markets';renderPicker();input.focus();}
watchButton.onclick=()=>{if(!drawer.hidden&&mode==='markets')dismiss();else show('markets');};indButton.onclick=()=>{if(!drawer.hidden&&mode==='indicators')dismiss();else show('indicators');};document.addEventListener('pointerdown',event=>{if(!drawer.hidden&&!drawer.contains(event.target)&&!indButton.contains(event.target)&&!watchButton.contains(event.target))dismiss();});input.oninput=()=>{search=input.value.toLowerCase();renderRows();};
function renderPicker(){slotBar.replaceChildren();tabs.replaceChildren();['Open Markets','Favorites',...Object.keys(groups)].forEach(name=>{const button=el('button',name===category?'selected':'',name);button.onclick=()=>{category=name;renderPicker();};tabs.append(button);});renderRows();}

function closeMenu(){menu?.remove();menu=null;}
function openMenu(row,m){closeMenu();menu=el('div','market-action');const b=el('button','','Open chart  ↗');const note=el('small','','Replace '+markets[slot].name+' · card '+(slot+1));b.onclick=()=>chooseMarket(m);menu.append(b,note);row.append(menu);}
const pendingMarkets=new Set();let marketMessage='';
async function chooseMarket(m){
 const index=markets.findIndex(x=>x.symbol===m.symbol);if(index>=0){selectMarket(index);renderRows();return;}
 if(pendingMarkets.has(m.symbol))return;
 if(markets.length+pendingMarkets.size>=10){foot.textContent='10 market cards maximum. Remove an open market to add another.';return;}
 marketMessage='';pendingMarkets.add(m.symbol);renderRows();
 try{const requestedFrame=frame,history=await fetchNativeHistory(m.symbol,requestedFrame);cache.set(m.symbol+'|'+requestedFrame,history);if(markets.some(x=>x.symbol===m.symbol)||markets.length>=10)return;markets.push({...m});saveOpenMarkets();renderMarketCards();nativeHistoryBlockedUntil=0;selectMarket(markets.length-1);LiveStream.reload();pollQuotes();}
 catch{marketMessage='History unavailable for '+m.name+'. Your open cards were kept.';}
 finally{pendingMarkets.delete(m.symbol);renderRows();}
}
document.addEventListener('openmarketschange',()=>{if(!drawer.hidden&&mode==='markets')renderRows();});

function indicatorCount(){return originals.slice(0,4).filter(([,id])=>!$(id).closest('.indicator-box').classList.contains('picker-removed')).length+[...extras.keys()].filter(key=>!isLower(key)).length;}
function atLimit(add){
 if(indicatorCount()<8){add();return;}
 dialog.replaceChildren();const h=el('h2','','Choose an indicator to replace'),p=el('p','muted','Eight price-chart indicators are already added. Replace one, or cancel.');dialog.append(h,p);
 for(const [name,id] of originals.slice(0,4)){if($(id).closest('.indicator-box').classList.contains('picker-removed'))continue;const b=el('button','replacement-option',name);b.onclick=()=>{const check=$(id);check.checked=false;check.closest('.indicator-box').classList.add('picker-removed');dialog.close();add();saveWorkspace();renderRows();};dialog.append(b);}
 for(const [key,e] of extras){if(isLower(key))continue;const b=el('button','replacement-option',e.name);b.onclick=()=>{removeExtra(key);dialog.close();add();saveWorkspace();renderRows();};dialog.append(b);}
 const cancel=el('button','replacement-cancel','Cancel');cancel.onclick=()=>dialog.close();dialog.append(cancel);dialog.showModal();
}
function saveWorkspace(){try{ChartStorage.setItem('market-indicator-picker-v1',JSON.stringify({removed:originals.filter(([,id])=>$(id).closest('.indicator-box').classList.contains('picker-removed')).map(([,id])=>id),extras:[...extras.values()].map(({key,period,color,width,show,options,collapsed,smoothing})=>({key,period,color,width,show,options,collapsed,smoothing}))}));}catch{}}
function restoreWorkspace(){try{const saved=JSON.parse(ChartStorage.getItem('market-indicator-picker-v1')||'null');if(!saved)return;for(const [,id] of originals){if(saved.removed?.includes(id)){$(id).checked=false;$(id).closest('.indicator-box').classList.add('picker-removed');}}for(const item of saved.extras||[]){if(indicatorCount()>=8&&!isLower(item.key))continue;if(extraDefs.some(d=>d[0]===item.key))addExtra(item.key,item);} }catch{}}

function renderRows(){
 closeMenu();list.replaceChildren();
 if(mode==='markets'){
  const catalog=Object.entries(groups).flatMap(([group,items])=>items.map(([name,symbol])=>({name,symbol,category:group==='Forex'?'FOREIGN EXCHANGE':group==='Metals'?'PRECIOUS METAL':group.toUpperCase(),group})));
  let rows=category==='Open Markets'?markets:category==='Favorites'?catalog.filter(m=>favoriteSymbols.has(m.symbol)):catalog.filter(m=>m.group===category);
  if(search)rows=rows.filter(m=>(m.name+' '+m.symbol).toLowerCase().includes(search));
  list.append(el('h3','picker-section',category.toUpperCase()));
  for(const m of rows){
   const openIndex=markets.findIndex(x=>x.symbol===m.symbol);
   if(openIndex>=0){
    const row=el('div','compact-indicator-row'),select=el('button','open-market-select',m.name),remove=el('button','indicator-row-action','×');select.title=m.symbol;select.onclick=()=>{selectMarket(markets.findIndex(x=>x.symbol===m.symbol));renderRows();};if(markets[selected].symbol===m.symbol)select.classList.add('selected');remove.setAttribute('aria-label','Remove '+m.name+' from open markets');remove.onclick=()=>removeOpenMarket(m.symbol);row.append(select,el('span','market-open-label','Open'),favoriteButton(m),remove);list.append(row);
   }else{
    const row=el('div','market-add-row'),button=el('button','indicator-add-row',m.name);button.setAttribute('aria-label','Add '+m.name+' to open markets');button.append(el('span','indicator-destination',pendingMarkets.has(m.symbol)?'Loading…':m.symbol));button.disabled=pendingMarkets.has(m.symbol);button.onclick=()=>chooseMarket(m);row.append(button,favoriteButton(m));list.append(row);
   }
  }
  if(!rows.length)list.append(el('p','indicator-empty',search?'No matching markets.':category==='Favorites'?'No favorites yet. Click ☆ beside a market to save it.':'No markets to show.'));
  foot.textContent=marketMessage||markets.length+' / 10 markets open · ☆ Favorite · × Close market';




 }else{
  const section=t=>list.append(el('h3','picker-section',t));
  const matching=name=>name.toLowerCase().includes(search);
  function rowAction(row,label,text,handler){const button=el('button','indicator-row-action',text);button.setAttribute('aria-label',label);button.title=label;button.onclick=handler;row.append(button);}
  const lowerOriginal=id=>['rsiOn','maOn'].includes(id);
  for(const lower of [false,true]){
   section(lower?'ON LOWER PANELS':'ON CHART');let installed=0;
   for(const [name,id,detail] of originals){const check=$(id),box=check.closest('.indicator-box'),label=displayName(name,id);if(lowerOriginal(id)!==lower||box.classList.contains('picker-removed')||!matching(label+' '+detail))continue;installed++;const row=el('div','compact-indicator-row');row.append(el('span','compact-indicator-name',label));rowAction(row,'Settings for '+label,'⚙',()=>box.querySelector('.aa-settings')?.click());rowAction(row,(check.checked?'Hide ':'Show ')+label,check.checked?'◉':'○',()=>{check.checked=!check.checked;saveWorkspace();draw();renderRows();});rowAction(row,'Remove '+label,'×',()=>{check.checked=false;box.classList.add('picker-removed');saveWorkspace();draw();renderRows();});list.append(row);}
   for(const [key,e] of extras){if(isLower(key)!==lower||!matching(e.name))continue;installed++;const row=el('div','compact-indicator-row');row.append(el('span','compact-indicator-name',displayName(e.name,key)));rowAction(row,'Settings for '+e.name,'⚙',()=>settings(e));rowAction(row,(e.show?'Hide ':'Show ')+e.name,e.show?'◉':'○',()=>{e.show=!e.show;e.box.style.opacity=e.show?1:.5;saveWorkspace();draw();renderRows();});rowAction(row,'Remove '+e.name,'×',()=>{removeExtra(key);renderRows();});list.append(row);
    if(e.smoothing){const smooth=el('div','compact-indicator-row');smooth.append(el('span','compact-indicator-name','Moving Average · '+e.name));rowAction(smooth,'Settings for Moving Average · '+e.name,'⚙',()=>smoothingSettings(e));rowAction(smooth,'Toggle Moving Average · '+e.name,e.smoothing.show?'◉':'○',()=>{e.smoothing.show=!e.smoothing.show;saveWorkspace();draw();renderRows();});rowAction(smooth,'Remove Moving Average · '+e.name,'×',()=>{e.smoothing=null;saveWorkspace();draw();renderRows();});list.append(smooth);}
   }
   if(!installed)list.append(el('p','indicator-empty',lower?'No lower-panel indicators added.':'No price-chart indicators added.'));
  }
  const ensureLower=()=>{if(oscPaneCollapsed){oscPaneCollapsed=false;syncOscPane();}};
  for(const lower of [false,true]){
   section(lower?'ADD TO LOWER PANEL':'ADD TO PRICE CHART');list.append(el('p','indicator-location-note',lower?'Adds directly below the main chart.':'Adds directly to the main chart.'));
   const groups=new Map();
   function group(name){if(groups.has(name))return groups.get(name);const details=el('details','indicator-category'),summary=el('summary','',name);details.open=Boolean(search)||categoryOpen.get((lower?'lower:':'price:')+name)!==false;details.ontoggle=()=>{if(!search)categoryOpen.set((lower?'lower:':'price:')+name,details.open);};details.append(summary);groups.set(name,details);list.append(details);return details;}
   function addRow(name,key,cat,handler){const row=el('button','indicator-add-row',name);row.setAttribute('aria-label','Add '+name+(lower?' to lower panel':' to price chart'));row.append(el('span','indicator-destination',lower?'Lower':'Price'));row.onclick=handler;group(cat).append(row);return row;}
   if(lower){
    const smoothGroup=group('SMOOTHING'),select=el('select','smoothing-target');select.setAttribute('aria-label','Moving Average target panel');const targets=[['rsi','RSI panel'],...[...extras].filter(([k])=>isLower(k)&&k!=='volume'&&k!=='atr').map(([k,e])=>[k,e.name+' panel'])];if(!targets.some(([k])=>k===smoothingTarget))smoothingTarget='rsi';for(const [value,name]of targets){const option=el('option','',name);option.value=value;select.append(option);}select.value=smoothingTarget;select.onchange=()=>{smoothingTarget=select.value;};smoothGroup.append(select);
    if(matching('Moving Average smoothing')){const row=el('button','indicator-add-row','Moving Average');row.setAttribute('aria-label','Add Moving Average to selected lower panel');row.onclick=()=>{if(smoothingTarget==='rsi'){for(const id of ['rsiOn','maOn']){$(id).closest('.indicator-box').classList.remove('picker-removed');$(id).checked=true;}ensureLower();}else{const target=extras.get(smoothingTarget);target.smoothing={period:9,method:'SMA',color:'#ed6375',show:true};target.show=true;target.collapsed=false;syncExtraPane(target);}saveWorkspace();draw();renderRows();};smoothGroup.append(row);}
   }
   for(const [name,id,detail]of originals){const check=$(id),box=check.closest('.indicator-box'),label=displayName(name,id);if(id==='maOn'||lowerOriginal(id)!==lower||!matching(label+' '+detail))continue;const addedRow=addRow(label,id,lower?'Oscillators':id==='bbOn'?'Trend':'Cortexa',()=>{const apply=()=>{box.classList.remove('picker-removed');check.checked=true;if(lower)ensureLower();saveWorkspace();draw();renderRows();};if(lower)apply();else atLimit(apply);});if(!box.classList.contains('picker-removed')){addedRow.disabled=true;addedRow.querySelector('.indicator-destination').textContent='Added';}}
   // Fixed group ordering matches the familiar MetaTrader categories.
   for(const cat of (lower?['Trend','Oscillators','Volumes','Bill Williams']:['Trend','Bill Williams']))for(const [key,name,detail]of extraDefs){if(groupFor(key)!==cat||isLower(key)!==lower||!matching(displayName(name,key)+' '+name+' '+detail))continue;const addedRow=addRow(displayName(name,key),key,cat,()=>{const add=()=>{addExtra(key);renderRows();};if(lower)add();else atLimit(add);});if(extras.has(key)){addedRow.disabled=true;addedRow.querySelector('.indicator-destination').textContent='Added';}}
   for(const name of ['SMOOTHING','Cortexa','Trend','Oscillators','Volumes','Bill Williams'])if(groups.has(name))list.append(groups.get(name));
  }
  foot.textContent='Click an indicator to add it · ⚙ Settings · ○ Visibility · × Remove';

 }
}
function removeExtra(key){const extra=extras.get(key);extra?.box.remove();extra?.pane?.remove();extra?.controls?.remove();extras.delete(key);saveWorkspace();draw();}
function bindLowerPane(extra){
 const canvas=extra.pane;let pan=null;
 canvas.title='Drag left or right to position this indicator. Double-click to match the price chart.';
 canvas.onpointerdown=event=>{if(event.button!==0)return;const view=extra.view||{count,offset};pan={pointerId:event.pointerId,x:event.clientX,count:view.count,offset:view.offset};canvas.setPointerCapture(event.pointerId);canvas.style.cursor='grabbing';event.preventDefault();};
 canvas.onpointermove=event=>{if(!pan||pan.pointerId!==event.pointerId)return;const width=Math.max(1,canvas.getBoundingClientRect().width-93);extra.view={count:pan.count,offset:Math.max(-pan.count+20,Math.min(Math.max(0,bars().length-20),pan.offset+Math.round((event.clientX-pan.x)/width*pan.count)))};draw();};
 const finish=event=>{if(!pan||pan.pointerId!==event.pointerId)return;pan=null;if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);canvas.style.cursor='grab';};
 canvas.onpointerup=finish;canvas.onpointercancel=finish;canvas.onlostpointercapture=()=>{pan=null;canvas.style.cursor='grab';};
 canvas.ondblclick=()=>{extra.view=null;draw();};
}
function syncExtraPane(extra){if(!extra.pane)return;extra.pane.hidden=extra.collapsed||!extra.show;extra.collapseButton.textContent=extra.collapsed?'▸':'▾';extra.collapseButton.setAttribute('aria-expanded',String(!extra.collapsed));extra.collapseButton.setAttribute('aria-label',(extra.collapsed?'Show ':'Hide ')+extra.name+' pane');}
function addExtra(key,saved=null){
 const def=extraDefs.find(d=>d[0]===key);const extra={key,name:def[1],period:def[3],color:def[4],width:2,show:true,options:ChartStudies.options(key,saved?.options)};extra.collapsed=saved?.collapsed===true;if(saved?.smoothing){const sm=saved.smoothing;extra.smoothing={period:Number.isInteger(sm.period)&&sm.period>=2&&sm.period<=200?sm.period:9,method:['SMA','EMA','RMA','WMA'].includes(sm.method)?sm.method:'SMA',color:/^#[0-9a-f]{6}$/i.test(sm.color)?sm.color:'#ed6375',show:sm.show!==false};}if(saved){if(Number.isInteger(saved.period)&&saved.period>=2&&saved.period<=200)extra.period=saved.period;if(/^#[0-9a-f]{6}$/i.test(saved.color))extra.color=saved.color;if([1,2,3,4].includes(saved.width))extra.width=saved.width;extra.show=saved.show!==false;}extras.set(key,extra);
 const box=el('div','indicator-box extra-indicator'),toggle=el('button','extra-toggle',extra.name),swatch=el('i');swatch.style.background=extra.color;toggle.prepend(swatch);const gear=el('button','aa-settings','⚙');gear.setAttribute('aria-label',extra.name+' settings');gear.onclick=()=>settings(extra);const remove=el('button','extra-remove','×');remove.title='Remove '+extra.name;remove.setAttribute('aria-label','Remove '+extra.name);remove.onclick=()=>removeExtra(key);toggle.onclick=()=>{extra.show=!extra.show;box.style.opacity=extra.show?1:.5;saveWorkspace();draw();};box.append(toggle,gear);const lower=isLower(key);if(key==='atr'){document.querySelector('.rsi-header').append(box);box.classList.add('atr-in-rsi');}else if(lower){const paneControls=el('div','extra-pane-controls'),collapse=el('button','lower-pane-toggle');collapse.type='button';extra.collapseButton=collapse;collapse.onclick=()=>{extra.collapsed=!extra.collapsed;syncExtraPane(extra);saveWorkspace();draw();};paneControls.append(collapse,box);document.querySelector('.chart-shell').append(paneControls);extra.controls=paneControls;}else if(key!=='atr')document.querySelector('#chartIndicatorList').append(box);extra.box=box;box.style.opacity=extra.show?1:.5;
 if(isLower(key)&&key!=='atr'){extra.pane=el('canvas','extra-pane');extra.pane.setAttribute('aria-label',extra.name+' chart');document.querySelector('.chart-shell').append(extra.pane);bindLowerPane(extra);syncExtraPane(extra);}
 if(key==='atr'){const shell=document.querySelector('.chart-shell');if(shell?.classList.contains('osc-pane-collapsed'))document.querySelector('#oscPaneToggle')?.click();}if(!saved)saveWorkspace();draw();if(key==='pivots')ensurePivotHistory();
}
const dialog=el('dialog','preview-settings');document.body.append(dialog);
function settings(extra){
 dialog.replaceChildren();const h=el('div','dialog-heading'),heading=el('h2','',extra.name),closeButton=el('button','','×');closeButton.type='button';closeButton.onclick=()=>dialog.close();h.append(heading,closeButton);
 const form=el('form'),fields=el('div','fields'),period=el('input'),color=el('input'),width=el('select'),options={};period.type='number';period.min=2;period.max=200;period.step=1;period.required=true;period.value=extra.period;color.type='color';color.value=extra.color;
 for(const n of [1,2,3,4]){const o=el('option','',n+' px');o.value=n;width.append(o);}width.value=extra.width;
 for(const [text,node] of [[extra.key==='adx'?'DI length':extra.key==='stochrsi'?'RSI length':extra.key==='supertrend'?'ATR length':extra.key==='keltner'?'EMA length':'Length',period],['Line color',color],['Line width',width]]){if(extra.key==='volume'&&node!==color||['pivots','fractals','ad','obv','bwmfi','psar'].includes(extra.key)&&node===period)continue;const l=el('label','field',extra.key==='volume'?'Up-bar color':text);l.append(node);fields.append(l);}
 for(const [name,label,min,max,step] of ChartStudies.fields[extra.key]||[]){const node=el(Array.isArray(min)?'select':'input');if(Array.isArray(min)){for(const value of min){const option=el('option','',value[0].toUpperCase()+value.slice(1));option.value=value;node.append(option);}}else{node.type='number';node.min=min;node.max=max;node.step=step;node.required=true;}node.value=extra.options[name];options[name]=node;const field=el('label','field',label);field.append(node);fields.append(field);}
 const apply=el('button','primary','Apply');apply.type='submit';form.append(el('h3','','Inputs & Style'),fields);
 const note=ChartStudies.notes[extra.key]||(extra.key==='macd'?'Fast EMA 12 · Slow EMA 26 · Length controls the signal EMA.':extra.key==='volume'?'Volume is tick activity, not total exchange trading volume.':'');if(note)form.append(el('p','muted',note));form.append(apply);
 form.onsubmit=event=>{event.preventDefault();if(!form.reportValidity())return;extra.period=Number(period.value);extra.color=color.value;extra.width=Number(width.value);for(const [name,node] of Object.entries(options))extra.options[name]=node.tagName==='SELECT'?node.value:Number(node.value);extra.box.querySelector('i').style.background=extra.color;extra.studyCache=null;dialog.close();saveWorkspace();draw();};dialog.append(h,form);dialog.showModal();
}
function smoothingSettings(extra){
 dialog.replaceChildren();const form=el('form'),title=el('h2','','Moving Average · '+extra.name),period=el('input'),method=el('select'),color=el('input');period.type='number';period.min=2;period.max=200;period.required=true;period.value=extra.smoothing.period;for(const name of ['SMA','EMA','RMA','WMA']){const o=el('option','',name);o.value=name;method.append(o);}method.value=extra.smoothing.method;color.type='color';color.value=extra.smoothing.color;form.append(title);for(const [label,node]of [['Length',period],['Method',method],['Color',color]]){const field=el('label','field',label);field.append(node);form.append(field);}const apply=el('button','primary','Apply');apply.type='submit';const cancel=el('button','','Cancel');cancel.type='button';cancel.onclick=()=>dialog.close();form.append(apply,cancel);form.onsubmit=e=>{e.preventDefault();if(!form.reportValidity())return;extra.smoothing={...extra.smoothing,period:Number(period.value),method:method.value,color:color.value};saveWorkspace();draw();dialog.close();};dialog.append(form);dialog.showModal();
}
let pivotLoading=false,pivotRetryAt=0;
async function ensurePivotHistory(){const symbol=markets[selected].symbol;if(pivotLoading||Date.now()<pivotRetryAt)return;const prior=cache.get(symbol+'|1day');if(prior&&!prior.reference&&Date.now()-prior.fetchedAt<300000)return;pivotLoading=true;try{const daily=await fetchNativeHistory(symbol,'1day');cache.set(symbol+'|1day',daily);draw();}catch{pivotRetryAt=Date.now()+60000;}finally{pivotLoading=false;}}

const originalDraw=draw;
draw=function(){originalDraw();drawExtras();};
// ATR shares the RSI canvas, but its values are mapped to a separate ATR-only scale.
// The oscillator 0–100 scale and the existing RSI/MA settings remain unchanged.
function drawAtrInRsi(data){
 const atr=extras.get('atr');if(!atr||!atr.show||!data.length)return;
 const canvas=$('rsiChart');if(!canvas||canvas.hidden||document.querySelector('.chart-shell')?.classList.contains('osc-pane-collapsed'))return;
 const tr=data.map((b,i)=>Math.max(b.high-b.low,i?Math.abs(b.high-data[i-1].close):0,i?Math.abs(b.low-data[i-1].close):0));
 const values=Indicators.movingAverage(tr,atr.period,'RMA');
 const view=typeof oscView!=='undefined'?oscView:{count,offset};
 const firstFloat=data.length-view.count-view.offset,first=Math.max(0,Math.floor(firstFloat)),last=Math.min(data.length,Math.ceil(firstFloat+view.count));
 const valid=values.slice(first,last).filter(Number.isFinite);if(!valid.length)return;
 const chart=canvasContext(canvas),c=chart.ctx,plotHeight=Math.max(1,chart.height-43),plotWidth=chart.width-79;
 const minimum=Math.min(...valid),maximum=Math.max(...valid),padding=Math.max((maximum-minimum)*.08,Math.abs(maximum)*.015,1e-9);
 const lo=Math.max(0,minimum-padding),hi=maximum+padding,span=Math.max(hi-lo,1e-9);
 const x=i=>15+(i-firstFloat+.5)*plotWidth/view.count,y=v=>15+(hi-v)/span*plotHeight;
 c.save();c.beginPath();c.rect(15,15,plotWidth,plotHeight);c.clip();c.strokeStyle=atr.color;c.lineWidth=atr.width;c.beginPath();let active=false;
 for(let i=first;i<last;i++){const v=values[i];if(!Number.isFinite(v)){active=false;continue;}if(active)c.lineTo(x(i),y(v));else c.moveTo(x(i),y(v));active=true;}c.stroke();c.restore();
 // ATR has its own numeric scale; the RSI 0–100 labels remain unchanged.
 // Draw ATR extrema in a compact right-side track, and place the latest value
 // at its actual ATR y-coordinate instead of the RSI scale.
 const fmt=v=>Number(v).toFixed(v>=10?2:v>=1?3:5);
 const axisX=chart.width-63;
 const axisYTop=17,axisYBottom=15+plotHeight;
 c.save();
 c.font='9px system-ui';c.textAlign='right';c.textBaseline='middle';
 c.fillStyle=atr.color;
 c.fillText('ATR',chart.width-7,8);
 c.globalAlpha=.78;
 c.fillText(fmt(hi),chart.width-7,axisYTop);
 c.fillText(fmt(lo),chart.width-7,axisYBottom);
 c.globalAlpha=1;
 const latest=valid.at(-1),latestY=Math.max(axisYTop+10,Math.min(axisYBottom-10,y(latest)));
 c.fillStyle='#101820';c.strokeStyle=atr.color;c.lineWidth=1;
 const label=fmt(latest),labelWidth=Math.min(62,c.measureText(label).width+7);
 c.fillRect(chart.width-labelWidth-3,latestY-7,labelWidth+1,14);
 c.strokeRect(chart.width-labelWidth-3,latestY-7,labelWidth+1,14);
 c.fillStyle=atr.color;c.fillText(label,chart.width-6,latestY);
 c.restore();
}
function drawExtras(){
 const data=bars();if(!data.length)return;drawAtrInRsi(data);const startFloat=data.length-count-offset,start=Math.max(0,Math.floor(startFloat)),end=Math.min(data.length,Math.ceil(startFloat+count)),canvas=$('priceChart'),rect=canvas.getBoundingClientRect(),ctx=canvas.getContext('2d'),w=rect.width,h=rect.height,step=(w-93)/count,x=i=>15+(i-startFloat+.5)*step;const low=currentPriceBounds.center-currentPriceBounds.span/2,high=low+currentPriceBounds.span,y=v=>15+(high-v)/(high-low)*(h-43),close=data.map(b=>b.close);
 const plot=(c,values,mapY,color,width=2,xx=x,from=start,to=end)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();let active=false;for(let i=from;i<to;i++){if(!Number.isFinite(values[i])){active=false;continue;}if(active)c.lineTo(xx(i),mapY(values[i]));else c.moveTo(xx(i),mapY(values[i]));active=true;}c.stroke();};
 for(const e of extras.values()){
  if(e.pane)e.pane.hidden=!e.show||e.collapsed;if(!e.show)continue;
  if(Object.hasOwn(ChartStudies.defaults,e.key)){
   const daily=cache.get(markets[selected].symbol+'|1day'),pivotSource=daily&&!daily.reference?daily.bars:null;
   if(e.key==='pivots')ensurePivotHistory();
   const last=data.at(-1),fingerprint=JSON.stringify([data.length,last?.time,last?.open,last?.high,last?.low,last?.close,last?.volume,e.period,e.options,pivotSource?.length,pivotSource?.at(-1)?.close]);
   if(!e.studyCache||e.studyCache.data!==data||e.studyCache.fingerprint!==fingerprint)e.studyCache={data,fingerprint,result:ChartStudies.compute(e.key,data,{length:e.period,...e.options},frame,pivotSource)};
   const study=e.studyCache.result;
   if(!e.pane){ctx.save();ctx.beginPath();ctx.rect(15,15,w-93,h-43);ctx.clip();const futureEnd=Math.ceil(startFloat+count);
    if(study.cloud){const [a,b]=study.cloud;for(let i=start+1;i<Math.min(futureEnd,a.length,b.length);i++){if(![a[i-1],b[i-1],a[i],b[i]].every(Number.isFinite))continue;ctx.fillStyle=a[i]>=b[i]?'#49c98e25':'#ef667925';ctx.beginPath();ctx.moveTo(x(i-1),y(a[i-1]));ctx.lineTo(x(i),y(a[i]));ctx.lineTo(x(i),y(b[i]));ctx.lineTo(x(i-1),y(b[i-1]));ctx.closePath();ctx.fill();}}
    for(const l of study.lines){ctx.strokeStyle=l.color||e.color;ctx.fillStyle=l.color||e.color;ctx.lineWidth=e.width;ctx.beginPath();let active=false;for(let i=start;i<Math.min(futureEnd,l.values.length);i++){const v=l.values[i];if(!Number.isFinite(v)){active=false;continue;}if(l.style==='dots'){ctx.moveTo(x(i)+2,y(v));ctx.arc(x(i),y(v),2,0,Math.PI*2);}else if(l.style?.startsWith('triangle')){const yy=y(v)+(l.style==='triangle-up'?-5:5),d=l.style==='triangle-up'?-1:1;ctx.moveTo(x(i),yy);ctx.lineTo(x(i)-3,yy+d*5);ctx.lineTo(x(i)+3,yy+d*5);ctx.closePath();}else{if(active&&!study.breaks?.[i])ctx.lineTo(x(i),y(v));else ctx.moveTo(x(i),y(v));active=true;}}if(l.style)ctx.fill();else ctx.stroke();}ctx.restore();e.box.title=study.lines.some(l=>l.values.slice(start,end).some(Number.isFinite))?e.name:study.message||'More history needed for '+e.name;}

  }
  if(e.key==='ema'||e.key==='sma'){ctx.save();ctx.beginPath();ctx.rect(15,15,w-93,h-43);ctx.clip();plot(ctx,Indicators.movingAverage(close,e.period,e.key.toUpperCase()),y,e.color,e.width);ctx.restore();}
  if(e.key==='donchian'){const highs=data.map((b,i)=>i<e.period-1?null:Math.max(...data.slice(i-e.period+1,i+1).map(x=>x.high))),lows=data.map((b,i)=>i<e.period-1?null:Math.min(...data.slice(i-e.period+1,i+1).map(x=>x.low)));ctx.save();ctx.beginPath();ctx.rect(15,15,w-93,h-43);ctx.clip();plot(ctx,highs,y,e.color,e.width);plot(ctx,lows,y,e.color,e.width);ctx.restore();}

  if(e.pane&&!e.collapsed){const view=e.view||paneView('price'),startFloat=data.length-view.count-view.offset,start=Math.max(0,Math.floor(startFloat)),end=Math.min(data.length,Math.ceil(startFloat+view.count)),chart=canvasContext(e.pane),c=chart.ctx,count=view.count,step=(chart.width-93)/count,x=i=>15+(i-startFloat+.5)*step;let lines=[];if(e.key==='volume'){const visible=data.slice(start,end),max=Math.max(1,...visible.map(b=>b.volume||0));c.fillStyle='#cbd7e7';c.font='bold 10px system-ui';c.fillText('Volume · tick activity',15,12);for(let i=start;i<end;i++){if(!Number.isFinite(data[i].volume))continue;const bh=data[i].volume/max*(chart.height-28);c.fillStyle=data[i].close>=data[i].open?e.color:'#ed6375';c.fillRect(x(i)-step*.34,chart.height-10-bh,Math.max(1,step*.68),bh);}continue;}if(e.key==='macd'){const fast=Indicators.movingAverage(close,12,'EMA'),slow=Indicators.movingAverage(close,26,'EMA'),macd=fast.map((v,i)=>v-slow[i]),signal=Indicators.movingAverage(macd,e.period,'EMA');lines=[macd,signal];}if(e.key==='atr'){const tr=data.map((b,i)=>Math.max(b.high-b.low,i?Math.abs(b.high-data[i-1].close):0,i?Math.abs(b.low-data[i-1].close):0));lines=[Indicators.movingAverage(tr,e.period,'RMA')];}if(ChartStudies.lower.has(e.key))lines=e.studyCache.result.lines.map(l=>l.values);if(e.key==='stoch'){const k=data.map((b,i)=>{if(i<e.period-1)return null;const v=data.slice(i-e.period+1,i+1),hi=Math.max(...v.map(x=>x.high)),lo=Math.min(...v.map(x=>x.low));return hi===lo?50:100*(b.close-lo)/(hi-lo);});lines=[k,Indicators.movingAverage(k,3,'SMA')];}const smoothing=e.smoothing?.show&&lines[0]?Indicators.movingAverage(lines[0],e.smoothing.period,e.smoothing.method):null;const values=[...lines,...(smoothing?[smoothing]:[])].flatMap(a=>a.slice(start,end).filter(Number.isFinite));if(e.key==='macd')for(let i=start;i<end;i++)values.push(lines[0][i]-lines[1][i]);const fixed=e.studyCache?.result.range||(['stoch','stochrsi','adx'].includes(e.key)?[0,100]:null);const min=fixed?fixed[0]:Math.min(0,...values),max=fixed?fixed[1]:Math.max(...values,0),span=max-min||1,mapY=v=>18+(max-v)/span*(chart.height-30),xx=i=>15+(i-startFloat+.5)*(chart.width-93)/count;c.font='bold 10px system-ui';c.fillStyle='#9cb0c6';c.fillText(e.name,15,12);c.strokeStyle='#29323e';c.beginPath();c.moveTo(15,chart.height-12);c.lineTo(chart.width-78,chart.height-12);c.stroke();if(e.key==='macd'){const baseline=mapY(0);for(let i=start;i<end;i++){const delta=lines[0][i]-lines[1][i];c.fillStyle=delta>=0?'#45be90':'#df6577';c.globalAlpha=.5;c.fillRect(xx(i)-step*.3,Math.min(baseline,mapY(delta)),Math.max(1,step*.6),Math.max(1,Math.abs(mapY(delta)-baseline)));}c.globalAlpha=1;}if(ChartStudies.lower.has(e.key)){const study=e.studyCache.result;c.save();c.setLineDash([4,4]);c.strokeStyle='#465367';for(const guide of study.guides||[]){const gy=mapY(guide);c.beginPath();c.moveTo(15,gy);c.lineTo(chart.width-78,gy);c.stroke();c.fillStyle='#879ab1';c.fillText(String(guide),chart.width-70,gy+3);}c.restore();}
lines.forEach((a,i)=>{const spec=ChartStudies.lower.has(e.key)?e.studyCache.result.lines[i]:null;if(spec?.style==='histogram'){const baseline=mapY(0);for(let j=start;j<end;j++){if(!Number.isFinite(a[j]))continue;c.fillStyle=spec.colors?.[j]||(j&&a[j]<a[j-1]?'#df6577':e.color);const py=mapY(a[j]);c.fillRect(xx(j)-step*.3,Math.min(baseline,py),Math.max(1,step*.6),Math.max(1,Math.abs(py-baseline)));}}else plot(c,a,mapY,spec?.color||(i?'#ed6375':e.color),e.width,xx,start,end);});if(smoothing)plot(c,smoothing,mapY,e.smoothing.color,e.width,xx,start,end);
c.fillStyle='#dce6ef';const reading=lines[0]?.at(-1);c.fillText(Number.isFinite(reading)?reading.toFixed(2):'—',chart.width-70,28);
if(ChartStudies.lower.has(e.key)){let legendX=15;for(const l of e.studyCache.result.lines){const v=l.values.at(-1),text=l.name+' '+(Number.isFinite(v)?v.toFixed(1):'—');c.fillStyle=l.color||e.color;c.fillText(text,legendX,chart.height-3);legendX+=c.measureText(text).width+15;}}
}
 }
 if(crosshair&&crosshair.pane==='price'&&!dragging)drawCrosshair({ctx,width:w,height:h},crosshair,low,high,3);
}
restoreWorkspace();draw();
})();
