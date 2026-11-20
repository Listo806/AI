/* Chart drawing toolbar. The chart data, indicators and day-level captions are untouched. */
(()=>{'use strict';
const actions=document.querySelector('.market-heading .actions');
const wrap=document.querySelector('.canvas-wrap');const price=document.getElementById('priceChart');
if(!actions||!wrap||!price)return;
let btn=document.getElementById('drawingToolsButton');
if(!btn){btn=document.createElement('button');btn.id='drawingToolsButton';btn.type='button';btn.className='market-tool';btn.textContent='✎ Drawing Tools';actions.prepend(btn);}
const group=actions.querySelector('.market-tools');if(group){const indicator=[...group.querySelectorAll('button')].find(b=>b.textContent.includes('Indicators'));if(indicator)indicator.before(btn);else group.append(btn);}
btn.textContent='✎ Tools';btn.hidden=false;btn.setAttribute('aria-expanded','false');btn.title='Tools';
const bar=document.createElement('div');bar.className='charts-draw-bar';bar.hidden=true;bar.setAttribute('aria-label','Drawing tools');bar.setAttribute('role','toolbar');
const icons={select:'<path d="M5 3l14 10-7 1-3 7z"/>',trend:'<path d="M4 20L20 4"/>',parallel:'<path d="M3 17L17 3M7 21L21 7"/>',brush:'<path d="M4 18c5-2 3-8 9-11l5-3M3 21c4 0 7-2 7-6"/>',horizontal:'<path d="M3 7h18M3 12h18M3 17h18"/>',grid:'<rect x="3" y="3" width="18" height="18"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>',zigzag:'<path d="M2 15l5-7 5 9 5-11 5 7"/>',polyline:'<path d="M3 19l5-12 6 9 7-13"/>',vertical:'<path d="M8 3v18M16 3v18"/>',rectangle:'<rect x="3" y="5" width="18" height="14"/>',curve:'<path d="M3 19c7 0 4-15 12-14s3 9 6 6"/>',text:'<path d="M4 5h16M12 5v15M8 20h8"/>',ruler:'<path d="M3 17L17 3l4 4L7 21zM11 9l3 3M8 12l3 3"/>',ray:'<path d="M3 19L21 5M15 5h6v6"/>',fib:'<rect x="3" y="4" width="18" height="16"/><path d="M3 9h18M3 13h18M3 17h18"/>',star:'<path d="M12 2l3 7 7 .5-5.5 5 1.5 7.5-6-4-6 4 1.5-7.5L2 9.5 9 9z"/>',history:'<path d="M3 7V3m0 4h4M3 7a9 9 0 1 1-1 8M12 7v5l4 2"/>',zoom:'<circle cx="10" cy="10" r="7"/><path d="M15 15l7 7"/>',sliders:'<path d="M5 3v18M12 3v18M19 3v18M2 8h6M9 15h6M16 10h6"/>',undo:'<path d="M9 5L3 11l6 6M3 11h11a6 6 0 0 1 0 12"/>',redo:'<path d="M15 5l6 6-6 6M21 11H10a6 6 0 0 0 0 12"/>',eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>'};
const definitions=[['select','Select'],['trend','Trend line'],['parallel','Parallel lines'],['brush','Brush'],['horizontal','Horizontal line'],['grid','Grid'],['zigzag','Polyline'],['polyline','Connected lines'],['vertical','Vertical line'],['rectangle','Rectangle'],['curve','Curve'],['text','Text'],['ruler','Measure'],['ray','Ray'],['fib','Fibonacci'],['star','Favorite'],['history','History'],['zoom','Zoom'],['sliders','Settings'],['undo','Undo'],['redo','Redo']];
const drawKinds=new Set(['trend','parallel','brush','horizontal','grid','zigzag','polyline','vertical','rectangle','curve','text','ruler','ray','fib']);
let mode='select',start=null,shapes=[],redoStack=[],preview=null,overlay=null;
function norm(e){const r=overlay.getBoundingClientRect();return{x:Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))};}
function paintShape(ctx,s,w,h){const a={x:s.a.x*w,y:s.a.y*h},b={x:s.b.x*w,y:s.b.y*h};ctx.beginPath();switch(s.kind){case 'horizontal':ctx.moveTo(0,a.y);ctx.lineTo(w,a.y);break;case 'vertical':ctx.moveTo(a.x,0);ctx.lineTo(a.x,h);break;case 'rectangle':case 'grid':case 'fib':ctx.rect(a.x,a.y,b.x-a.x,b.y-a.y);break;case 'ray':{const dx=b.x-a.x,dy=b.y-a.y,t=dx===0?1:(dx>0?w-a.x:-a.x)/dx;ctx.moveTo(a.x,a.y);ctx.lineTo(a.x+dx*t,a.y+dy*t);break;}case 'text':ctx.font='13px sans-serif';ctx.fillStyle='#d7c279';ctx.fillText('Text',a.x,a.y);return;case 'curve':ctx.moveTo(a.x,a.y);ctx.quadraticCurveTo(b.x,a.y,b.x,b.y);break;case 'zigzag':case 'polyline':ctx.moveTo(a.x,a.y);ctx.lineTo((a.x+b.x)/2,b.y);ctx.lineTo(b.x,b.y);break;case 'parallel':ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.moveTo(a.x+10,a.y+10);ctx.lineTo(b.x+10,b.y+10);break;default:ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);}ctx.stroke();if(s.kind==='fib'||s.kind==='grid'){for(let i=1;i<4;i++){const y=a.y+(b.y-a.y)*i/4;ctx.beginPath();ctx.moveTo(a.x,y);ctx.lineTo(b.x,y);ctx.stroke();}}}
function draw(){if(!overlay)return;const c=overlay.getContext('2d'),r=overlay.getBoundingClientRect(),ratio=window.devicePixelRatio||1;c.setTransform(ratio,0,0,ratio,0,0);c.clearRect(0,0,r.width,r.height);c.strokeStyle='#d7c279';c.lineWidth=1.5;c.setLineDash([]);for(const s of [...shapes,...(preview?[preview]:[])])paintShape(c,s,r.width,r.height);}
function position(){if(!overlay)return;const r=wrap.getBoundingClientRect(),ratio=window.devicePixelRatio||1;overlay.width=Math.max(1,Math.round(r.width*ratio));overlay.height=Math.max(1,Math.round(r.height*ratio));draw();}
function update(){bar.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));if(overlay){overlay.style.pointerEvents=drawKinds.has(mode)?'auto':'none';overlay.style.cursor=drawKinds.has(mode)?'crosshair':'default';}}
function ensure(){if(overlay)return;overlay=document.createElement('canvas');overlay.className='charts-draw-overlay';overlay.setAttribute('aria-label','Chart drawing surface');wrap.append(overlay);overlay.addEventListener('pointerdown',e=>{if(!drawKinds.has(mode)||e.button!==0)return;e.preventDefault();start=norm(e);preview={kind:mode,a:start,b:start};overlay.setPointerCapture(e.pointerId);draw();});overlay.addEventListener('pointermove',e=>{if(!start)return;preview={kind:mode,a:start,b:norm(e)};draw();});overlay.addEventListener('pointerup',e=>{if(!start)return;shapes.push({kind:mode,a:start,b:norm(e)});redoStack=[];start=null;preview=null;mode='select';update();draw();});overlay.addEventListener('pointercancel',()=>{start=null;preview=null;mode='select';update();draw();});new ResizeObserver(position).observe(wrap);position();}
for(const [key,label] of definitions){const b=document.createElement('button');b.type='button';b.dataset.mode=key;b.title=label;b.setAttribute('aria-label',label);b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'+icons[key]+'</svg>';b.onclick=()=>{ensure();if(key==='undo'){if(shapes.length)redoStack.push(shapes.pop());mode='select';draw();}else if(key==='redo'){if(redoStack.length)shapes.push(redoStack.pop());mode='select';draw();}else if(drawKinds.has(key)||key==='select')mode=key;else mode='select';update();};bar.append(b);}
const magnet=document.createElement('button');magnet.type='button';magnet.className='charts-draw-magnet';magnet.textContent='Magnet: Off  ⌄';magnet.onclick=()=>{const on=magnet.getAttribute('aria-pressed')!=='true';magnet.setAttribute('aria-pressed',String(on));magnet.textContent='Magnet: '+(on?'On':'Off')+'  ⌄';};bar.append(magnet);
for(const [key,label] of [['stay','Stay on'],['sync','Sync charts']]){const l=document.createElement('label');l.className='charts-draw-option';const c=document.createElement('input');c.type='checkbox';l.append(c,document.createTextNode(label));bar.append(l);}
const eye=document.createElement('button');eye.type='button';eye.title='Show or hide drawings';eye.setAttribute('aria-label',eye.title);eye.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>';eye.onclick=()=>{ensure();overlay.style.visibility=overlay.style.visibility==='hidden'?'visible':'hidden';};bar.append(eye);
const clear=document.createElement('button');clear.type='button';clear.className='charts-draw-clear';clear.textContent='Clear drawings';clear.onclick=()=>{shapes=[];redoStack=[];mode='select';update();draw();};bar.append(clear);
const shell=document.querySelector('.chart-shell');if(shell){const canvas=wrap;const after=canvas.nextElementSibling;if(after)after.before(bar);else canvas.after(bar);}else wrap.after(bar);
function closeTools(){bar.hidden=true;btn.setAttribute('aria-expanded','false');picker.hidden=true;mode='select';start=null;preview=null;update();if(overlay)draw();}
btn.addEventListener('click',()=>{const opening=bar.hidden;if(opening){bar.hidden=false;btn.setAttribute('aria-expanded','true');ensure();update();}else closeTools();});
function arrangeToolbar(){
 const all=[...actions.querySelectorAll('button')];
 const named=(re)=>all.find(b=>re.test((b.textContent||'').trim()) || re.test(b.getAttribute('aria-label')||''));
 const market=named(/^(?:▤\\s*)?Market(?: Watch)?$/i);
 const indicators=named(/Indicators/i);
 const calendar=named(/Calendar/i);
 if(!market||!indicators)return;
 // Move only the relevant buttons; keep the remaining controls untouched.
 if(market.parentElement!==actions)actions.append(market);
 if(btn.parentElement!==actions)actions.append(btn);
 if(indicators.parentElement!==actions)actions.append(indicators);
 if(calendar&&calendar.parentElement!==actions)actions.append(calendar);
 const anchor=calendar||indicators;
 actions.insertBefore(market,anchor);
 actions.insertBefore(btn,anchor);
 if(calendar)actions.insertBefore(indicators,calendar);
 else actions.insertBefore(btn,indicators);
}
arrangeToolbar();
let arranging=false;
const toolbarObserver=new MutationObserver(()=>{if(arranging)return;arranging=true;try{arrangeToolbar();}finally{arranging=false;}});
toolbarObserver.observe(actions,{childList:true,subtree:true});

// Category browser for the reference drawing toolbar. The drawing overlay above
// remains responsible for actual pointer interaction and undo/redo.
const toolCategories={
 trend:{title:'Lines',items:[['Trend Line','trend'],['Extended Line','trend'],['Ray','ray'],['Horizontal Line','horizontal'],['Horizontal Ray','horizontal'],['Vertical Line','vertical'],['Cross Line','grid'],['Arrow Line','ray'],['Info Line','ruler'],['Trend Angle','ruler']]},
 parallel:{title:'Channels',items:[['Parallel Channel','parallel'],['Regression Channel','parallel'],['Flat Top/Bottom Channel','parallel'],['Disjoint Channel','parallel']]},
 brush:{title:'Pitchforks',items:[['Pitchfork','parallel'],['Schiff Pitchfork','parallel'],['Modified Schiff Pitchfork','parallel'],['Inside Pitchfork','parallel'],['Pitchfan','parallel']]},
 horizontal:{title:'Fibonacci',items:[['Retracement','fib'],['Trend-Based Extension','fib'],['Fib Channel','fib'],['Speed Resistance Fan','fib'],['Time Zones','vertical'],['Trend-Based Time','fib'],['Resistance Arcs','curve'],['Fib Circles','curve'],['Fib Spiral','curve'],['Fib Wedge','fib']]},
 grid:{title:'Gann',items:[['Gann Fan','grid'],['Gann Box','grid'],['Gann Square','grid'],['Fixed Gann Square','grid']]},
 zigzag:{title:'Chart Patterns',items:[['Head & Shoulders','zigzag'],['Inverse Head & Shoulders','zigzag'],['Triangle Pattern','zigzag'],['ABCD','zigzag'],['XABCD','zigzag'],['Cypher','zigzag'],['Three Drives','zigzag']]},
 polyline:{title:'Elliott Waves',items:[['Impulse 1–5','polyline'],['Correction ABC','polyline'],['Triangle ABCDE','polyline'],['Double Combination WXY','polyline'],['Triple Combination WXYXZ','polyline']]},
 vertical:{title:'Cycles',items:[['Cycle Lines','vertical'],['Time Cycles','vertical'],['Sine Line','curve']]},
 rectangle:{title:'Shapes',items:[['Rectangle','rectangle'],['Rotated Rectangle','rectangle'],['Ellipse / Circle','curve'],['Triangle','zigzag'],['Polygon','polyline'],['Polyline','polyline'],['Curve','curve'],['Double Curve','curve'],['Arc','curve']]},
 curve:{title:'Freehand',items:[['Brush','brush'],['Highlighter','brush'],['Freehand Forecast Path','brush']]},
 text:{title:'Text & Markers',items:[['Text','text'],['Anchored Text','text'],['Note','text'],['Anchored Note','text'],['Callout','text'],['Balloon','text'],['Price Label','text'],['Flag','text'],['Arrow Up','ray'],['Arrow Down','ray'],['Arrow Left','ray'],['Arrow Right','ray'],['Symbol / Icon','text']]},
 ruler:{title:'Measurements & Positions',items:[['Position · target + stop','rectangle'],['Ruler','ruler'],['Price Range','ruler'],['Date Range / Candle Count','ruler'],['Date & Price Range','ruler'],['Forecast','ray'],['Projection','ray'],['Bars Pattern','zigzag'],['Ghost Feed','zigzag']]},
 ray:{title:'Anchored VWAP',items:[['Anchored VWAP','trend']]},
 star:{title:'Favorites',items:[]},history:{title:'Recent',items:[]}
};
const favoriteNames=new Set();const recentNames=[];
const picker=document.createElement('section');picker.className='charts-tools-picker';picker.hidden=true;picker.setAttribute('aria-label','Drawing tools');
picker.innerHTML='<div class="charts-tools-picker-head"><strong></strong><button type="button" aria-label="Close tool menu">×</button></div><input type="search" placeholder="Search all tools" aria-label="Search all tools"><div class="charts-tools-picker-list"></div><div class="charts-tools-picker-hint">Select a tool, then place it on the chart.</div>';
const pickerTitle=picker.querySelector('strong'),pickerSearch=picker.querySelector('input'),pickerList=picker.querySelector('.charts-tools-picker-list');let activeCategory=null;
function categoryItems(category){if(category==='star')return Object.values(toolCategories).flatMap(x=>x.items).filter(x=>favoriteNames.has(x[0]));if(category==='history')return recentNames.map(name=>Object.values(toolCategories).flatMap(x=>x.items).find(x=>x[0]===name)).filter(Boolean);return toolCategories[category].items;}
function renderPicker(){pickerTitle.textContent=toolCategories[activeCategory].title;const query=pickerSearch.value.trim().toLowerCase();pickerList.replaceChildren();const items=categoryItems(activeCategory).filter(x=>x[0].toLowerCase().includes(query));if(!items.length){const empty=document.createElement('div');empty.className='charts-tools-picker-empty';empty.textContent='No matching tools';pickerList.append(empty);return;}
 for(const [name,kind] of items){const item=document.createElement('div');item.className='charts-tools-picker-item';const select=document.createElement('button');select.type='button';select.className='charts-tools-picker-select';const symbol=icons[kind]||icons.trend;
select.innerHTML='<svg class="charts-tools-item-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'+symbol+'</svg><span></span>';
select.querySelector('span').textContent=name;select.onclick=()=>{ensure();mode=kind;update();picker.hidden=true;pickerSearch.value='';recentNames.unshift(name);if(recentNames.length>15)recentNames.pop();bar.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===activeCategory)));};const fav=document.createElement('button');fav.type='button';fav.className='charts-tools-picker-favorite';fav.textContent=favoriteNames.has(name)?'★':'☆';fav.title='Toggle favorite';fav.setAttribute('aria-label','Favorite '+name);fav.onclick=()=>{if(favoriteNames.has(name))favoriteNames.delete(name);else favoriteNames.add(name);renderPicker();};item.append(select,fav);pickerList.append(item);}
}
function openCategory(category,anchor){if(activeCategory===category&&!picker.hidden){picker.hidden=true;return;}activeCategory=category;pickerSearch.value='';picker.hidden=false;renderPicker();const rect=anchor.getBoundingClientRect();const left=Math.max(8,Math.min(window.innerWidth-320,rect.left));const top=rect.top>360?rect.top-12:rect.bottom+6;picker.style.left=left+'px';picker.style.top=Math.min(window.innerHeight-100,Math.max(8,top))+'px';if(rect.top>360)picker.style.transform='translateY(-100%)';else picker.style.transform='none';pickerSearch.focus();}
for(const b of bar.querySelectorAll('[data-mode]')){const category=b.dataset.mode;if(!toolCategories[category])continue;b.title=toolCategories[category].title;b.setAttribute('aria-label',toolCategories[category].title);b.onclick=()=>openCategory(category,b);}
picker.querySelector('.charts-tools-picker-head button').onclick=()=>picker.hidden=true;pickerSearch.addEventListener('input',renderPicker);document.body.append(picker);
document.addEventListener('pointerdown',e=>{if(!picker.hidden&&!picker.contains(e.target)&&!bar.contains(e.target))picker.hidden=true;});
window.addEventListener('keydown',e=>{if(e.key==='Escape')picker.hidden=true;});


window.addEventListener('keydown',e=>{if(e.key==='Escape'&&mode!=='select'){mode='select';start=null;preview=null;update();draw();}});
})();
