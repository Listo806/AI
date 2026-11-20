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
let mode='select',activeTool='Select',start=null,shapes=[],redoStack=[],preview=null,overlay=null,magnetMode='Off',stayOn=false,drawingsVisible=true,activeCategoryButton=null,clickPoints=[];
const storageKey=()=>`cortexa-drawings:${(document.querySelector('.market-heading')?.textContent||'default').split(/\s+/)[0]}`;
try{const saved=JSON.parse(localStorage.getItem(storageKey())||'[]');if(Array.isArray(saved))shapes=saved.filter(x=>x&&x.a&&x.b);}catch{}
function persist(){try{localStorage.setItem(storageKey(),JSON.stringify(shapes));}catch{}}
function norm(e){const r=overlay.getBoundingClientRect();return{x:Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))};}
function paintShape(ctx,s,w,h){
 const a={x:s.a.x*w,y:s.a.y*h},b={x:s.b.x*w,y:s.b.y*h},dx=b.x-a.x,dy=b.y-a.y;
 const pts=(s.points||[]).map(p=>({x:p.x*w,y:p.y*h}));
 const name=s.name||'',minx=Math.min(a.x,b.x),miny=Math.min(a.y,b.y),ww=Math.abs(dx),hh=Math.abs(dy);
 const line=(x1,y1,x2,y2)=>{ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);};
 const levels=(ratios)=>{for(const t of ratios){const y=b.y+(a.y-b.y)*t;ctx.beginPath();line(0,y,w,y);ctx.stroke();ctx.fillStyle='#53e3c4';ctx.font='10px system-ui';ctx.fillText((t*100).toFixed(1)+'%',Math.min(w-42,Math.max(4,b.x+5)),y-3);}};
 ctx.save();ctx.strokeStyle='#50e6c4';ctx.fillStyle='#50e6c4';ctx.lineWidth=name==='Highlighter'?5:1.65;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();
 if(pts.length>2 && ['Pitchfork','Schiff Pitchfork','Modified Schiff Pitchfork','Inside Pitchfork','Pitchfan'].includes(name)){const [p0,p1,p2]=pts;const mid={x:(p1.x+p2.x)/2,y:(p1.y+p2.y)/2};const vx=mid.x-p0.x,vy=mid.y-p0.y;for(const p of [p0,p1,p2])line(p.x,p.y,p.x+vx*3,p.y+vy*3);}
 else if(pts.length>2 && (name.includes('Channel')||name==='Parallel Channel')){const [p0,p1,p2]=pts;const ox=p2.x-p0.x,oy=p2.y-p0.y;line(p0.x,p0.y,p1.x,p1.y);line(p0.x+ox,p0.y+oy,p1.x+ox,p1.y+oy);line(p0.x+ox/2,p0.y+oy/2,p1.x+ox/2,p1.y+oy/2);}
 else if(pts.length>2 && (name.includes('Pattern')||name.includes('Combination')||name==='Polyline'||name==='Polygon'||name.startsWith('Impulse')||name.startsWith('Correction')||['ABCD','XABCD','Cypher','Three Drives'].includes(name))){ctx.moveTo(pts[0].x,pts[0].y);for(const p of pts.slice(1))ctx.lineTo(p.x,p.y);if(name==='Polygon')ctx.closePath();}
 else if(pts.length>1 && ['Brush','Highlighter','Freehand Forecast Path'].includes(name)){ctx.moveTo(pts[0].x,pts[0].y);for(const p of pts.slice(1))ctx.lineTo(p.x,p.y);}
 else if(name==='Sine Line'){const cycles=Math.max(1,Math.round(ww/170));for(let i=0;i<=100;i++){const x=a.x+dx*i/100,y=a.y+dy/2-Math.abs(dy)/2*Math.sin(2*Math.PI*cycles*i/100);if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}}
 else if(name==='Ellipse / Circle'||name==='Fib Circles'){ctx.ellipse((a.x+b.x)/2,(a.y+b.y)/2,Math.max(1,ww/2),Math.max(1,hh/2),0,0,Math.PI*2);}
 else if(name==='Fib Spiral'){for(let i=0;i<=120;i++){const t=i/120*4*Math.PI,r=i/120*Math.max(ww,hh)/2,x=a.x+dx/2+r*Math.cos(t),y=a.y+dy/2+r*Math.sin(t);if(!i)ctx.moveTo(x,y);else ctx.lineTo(x,y);}}
 else if(name==='Triangle'||name==='Triangle Pattern'||name==='Triangle ABCDE'||name==='Fib Wedge'){line(a.x,(a.y+b.y)/2,(a.x+b.x)/2,b.y);line((a.x+b.x)/2,b.y,b.x,a.y);line(b.x,a.y,a.x,(a.y+b.y)/2);}
 else if(name==='Rotated Rectangle'){ctx.translate((a.x+b.x)/2,(a.y+b.y)/2);ctx.rotate(-Math.PI/8);ctx.rect(-ww/2,-hh/2,ww,hh);}
 else if(name==='Rectangle'||name==='Date & Price Range'||name==='Gann Box'||name==='Gann Square'||name==='Fixed Gann Square'||s.kind==='rectangle'||s.kind==='grid'){ctx.rect(minx,miny,ww,hh);}
 else if(name==='Horizontal Ray'){line(a.x,a.y,dx>=0?w:0,a.y);}
 else if(name==='Extended Line'){const k=dy/(dx||0.001);line(0,a.y-a.x*k,w,a.y+(w-a.x)*k);}
 else if(name==='Cross Line'){line(0,a.y,w,a.y);line(a.x,0,a.x,h);}
 else if(name==='Vertical Line'||s.kind==='vertical'){line(a.x,0,a.x,h);}
 else if(name==='Horizontal Line'||s.kind==='horizontal'){line(0,a.y,w,a.y);}
 else if(name==='Ray'||s.kind==='ray'){const t=Math.max(Math.abs((w-a.x)/(dx||.001)),Math.abs((h-a.y)/(dy||.001)));line(a.x,a.y,a.x+dx*t,a.y+dy*t);}
 else if(name==='Arc'||name==='Resistance Arcs'){ctx.ellipse(a.x,a.y,Math.max(1,ww),Math.max(1,hh),0,-Math.PI/2,Math.PI/2);}
 else if(name==='Curve'||name==='Double Curve'||s.kind==='curve'){ctx.moveTo(a.x,a.y);ctx.bezierCurveTo(a.x+dx*.35,a.y-dy*.6,a.x+dx*.65,b.y+dy*.6,b.x,b.y);}
 else if(name==='Polyline'||name.includes('Pattern')||name==='ABCD'||name==='XABCD'||name==='Cypher'||name==='Three Drives'||name.includes('Combination')||name.startsWith('Impulse')||name.startsWith('Correction')){line(a.x,a.y,a.x+dx*.25,a.y+dy*.65);line(a.x+dx*.25,a.y+dy*.65,a.x+dx*.5,a.y+dy*.2);line(a.x+dx*.5,a.y+dy*.2,a.x+dx*.75,a.y+dy*.85);line(a.x+dx*.75,a.y+dy*.85,b.x,b.y);}
 else if(name==='Time Zones'||name==='Trend-Based Time'||name==='Cycle Lines'||name==='Time Cycles'){for(let i=0;i<9;i++){const t=name==='Time Zones'?[0,1,2,3,5,8,13,21,34][i]/34:i/8;line(a.x+dx*t,0,a.x+dx*t,h);}}
 else if(name.includes('Fan')||name.includes('Pitch')||name==='Speed Resistance Fan'){for(const f of [.25,.5,1,1.5,2])line(a.x,a.y,b.x,a.y+dy*f);}
 else if(name.includes('Channel')||name.includes('Parallel')){for(const offset of [-16,0,16])line(a.x,a.y+offset,b.x,b.y+offset);}
 else if(name==='Arrow Up'||name==='Arrow Down'||name==='Arrow Left'||name==='Arrow Right'||name==='Arrow Line'){line(a.x,a.y,b.x,b.y);const theta=Math.atan2(dy,dx);for(const delta of [-.5,.5])line(b.x,b.y,b.x-12*Math.cos(theta+delta),b.y-12*Math.sin(theta+delta));}
 else if(s.kind==='text'){ctx.font='13px system-ui';ctx.fillText(name==='Text'?'Text':name,a.x,a.y);ctx.restore();return;}
 else {line(a.x,a.y,b.x,b.y);}
 ctx.stroke();
 if(name==='Retracement'||name==='Trend-Based Extension'||name==='Fib Channel'||s.kind==='fib')levels([0,.236,.382,.5,.618,.786,1,1.618]);
 if(name==='Gann Box'||name==='Gann Square'||name==='Fixed Gann Square'){ctx.beginPath();for(let i=1;i<4;i++){line(minx+ww*i/4,miny,minx+ww*i/4,miny+hh);line(minx,miny+hh*i/4,minx+ww,miny+hh*i/4);}ctx.stroke();}
 if(name==='Position · target + stop'){const mid=a.y+dy*.5;ctx.fillStyle='rgba(35,180,119,.22)';ctx.fillRect(minx,Math.min(mid,a.y),ww,Math.abs(mid-a.y));ctx.fillStyle='rgba(245,65,94,.20)';ctx.fillRect(minx,Math.min(mid,b.y),ww,Math.abs(b.y-mid));ctx.strokeStyle='#50e6c4';ctx.strokeRect(minx,miny,ww,hh);ctx.beginPath();line(minx,mid,minx+ww,mid);ctx.stroke();}
 ctx.restore();
}
function draw(){if(!overlay)return;const c=overlay.getContext('2d'),r=overlay.getBoundingClientRect(),ratio=window.devicePixelRatio||1;c.setTransform(ratio,0,0,ratio,0,0);c.clearRect(0,0,r.width,r.height);if(!drawingsVisible)return;for(const shape of [...shapes,...(preview?[preview]:[])])paintShape(c,shape,r.width,r.height);}
function position(){if(!overlay)return;const r=wrap.getBoundingClientRect(),ratio=window.devicePixelRatio||1;overlay.width=Math.max(1,Math.round(r.width*ratio));overlay.height=Math.max(1,Math.round(r.height*ratio));draw();}
const multiCounts={'Pitchfork':3,'Schiff Pitchfork':3,'Modified Schiff Pitchfork':3,'Inside Pitchfork':3,'Pitchfan':3,'Parallel Channel':3,'Regression Channel':3,'Flat Top/Bottom Channel':3,'Disjoint Channel':3,'Head & Shoulders':5,'Inverse Head & Shoulders':5,'Triangle Pattern':3,'ABCD':4,'XABCD':5,'Cypher':5,'Three Drives':6,'Impulse 1–5':6,'Correction ABC':4,'Triangle ABCDE':5,'Double Combination WXY':4,'Triple Combination WXYXZ':6,'Polygon':5,'Polyline':5};
function finishShape(shape){shapes.push(shape);persist();redoStack=[];start=null;preview=null;clickPoints=[];if(!stayOn){mode='select';activeCategoryButton=null;}update();draw();}
function snap(p){if(magnetMode==='Off')return p;const r=overlay.getBoundingClientRect();let best=p,dist=magnetMode==='Strong'?24:12;for(const shape of shapes){for(const q of [shape.a,shape.b,...(shape.points||[])]){const d=Math.hypot((p.x-q.x)*r.width,(p.y-q.y)*r.height);if(d<dist){best=q;dist=d;}}}return best;}
function update(){bar.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(!!activeCategoryButton&&b.dataset.mode===activeCategoryButton)));if(overlay){overlay.style.pointerEvents=drawKinds.has(mode)?'auto':'none';overlay.style.cursor=drawKinds.has(mode)?'crosshair':'default';}}
function ensure(){if(overlay)return;overlay=document.createElement('canvas');overlay.className='charts-draw-overlay';overlay.setAttribute('aria-label','Chart drawing surface');wrap.append(overlay);
 overlay.addEventListener('pointerdown',e=>{if(!drawKinds.has(mode)||e.button!==0)return;e.preventDefault();const p=snap(norm(e));const count=multiCounts[activeTool];if(count){clickPoints.push(p);if(clickPoints.length>=count){finishShape({kind:mode,name:activeTool,a:clickPoints[0],b:p,points:[...clickPoints]});}else{preview={kind:mode,name:activeTool,a:clickPoints[0],b:p,points:[...clickPoints]};draw();}return;}start=p;preview={kind:mode,name:activeTool,a:p,b:p,points:[p]};overlay.setPointerCapture(e.pointerId);draw();});
 overlay.addEventListener('pointermove',e=>{const p=snap(norm(e));if(clickPoints.length){preview={kind:mode,name:activeTool,a:clickPoints[0],b:p,points:[...clickPoints,p]};draw();return;}if(!start)return;preview={kind:mode,name:activeTool,a:start,b:p,points:['Brush','Highlighter','Freehand Forecast Path'].includes(activeTool)?[...(preview?.points||[start]),p]:[start,p]};draw();});
 overlay.addEventListener('pointerup',e=>{if(!start)return;const p=snap(norm(e));finishShape({...preview,b:p});});
 overlay.addEventListener('pointercancel',()=>{start=null;preview=null;clickPoints=[];update();draw();});new ResizeObserver(position).observe(wrap);position();}
for(const [key,label] of definitions){const b=document.createElement('button');b.type='button';b.dataset.mode=key;b.title=label;b.setAttribute('aria-label',label);b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'+icons[key]+'</svg>';b.onclick=()=>{ensure();if(key==='undo'){if(shapes.length)redoStack.push(shapes.pop());persist();mode='select';draw();}else if(key==='redo'){if(redoStack.length)shapes.push(redoStack.pop());persist();mode='select';draw();}else if(drawKinds.has(key)||key==='select')mode=key;else mode='select';update();};bar.append(b);}
const magnet=document.createElement('select');magnet.className='charts-draw-magnet';magnet.setAttribute('aria-label','Magnet mode');for(const value of ['Off','Near','Strong']){const option=document.createElement('option');option.value=value;option.textContent='Magnet: '+value;magnet.append(option);}magnet.addEventListener('change',()=>magnetMode=magnet.value);bar.append(magnet);
for(const [key,label] of [['stay','Stay on'],['sync','Sync charts']]){const l=document.createElement('label');l.className='charts-draw-option';const c=document.createElement('input');c.type='checkbox';l.append(c,document.createTextNode(label));if(key==='stay')c.addEventListener('change',()=>stayOn=c.checked);bar.append(l);}
const eye=document.createElement('button');eye.type='button';eye.title='Show or hide drawings';eye.setAttribute('aria-label',eye.title);eye.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>';eye.onclick=()=>{ensure();drawingsVisible=!drawingsVisible;draw();};bar.append(eye);
const clear=document.createElement('button');clear.type='button';clear.className='charts-draw-clear';clear.textContent='Clear drawings';clear.onclick=()=>{confirmBar.hidden=false;};bar.append(clear);
const confirmBar=document.createElement('div');confirmBar.className='charts-draw-confirm';confirmBar.hidden=true;confirmBar.innerHTML='<span>Clear all drawings for this chart?</span><button type="button" class="confirm-clear">Clear all drawings</button><button type="button" class="cancel-clear">Cancel</button>';confirmBar.querySelector('.confirm-clear').onclick=()=>{shapes=[];redoStack=[];persist();mode='select';activeCategoryButton=null;clickPoints=[];confirmBar.hidden=true;update();draw();};confirmBar.querySelector('.cancel-clear').onclick=()=>confirmBar.hidden=true;
const shell=document.querySelector('.chart-shell');if(shell){const canvas=wrap;const after=canvas.nextElementSibling;if(after)after.before(bar);else canvas.after(bar);bar.before(confirmBar);}else {wrap.after(bar);bar.before(confirmBar);}
function closeTools(){bar.hidden=true;btn.setAttribute('aria-expanded','false');picker.hidden=true;mode='select';activeCategoryButton=null;clickPoints=[];start=null;preview=null;confirmBar.hidden=true;update();if(overlay)draw();}
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
 star:{title:'Favorites',items:[]},history:{title:'Recent',items:[]},zoom:{title:'All drawing tools',items:[]},sliders:{title:'My Drawings',items:[]}
};
// Individual reference-style glyphs for each drawing tool. All glyphs are
// lightweight SVG strokes; no icon font or external assets are required.
const toolGlyphs={
 'Extended Line':'<path d="M2 22L22 2"/>','Horizontal Ray':'<path d="M3 12h18"/><circle cx="3" cy="12" r="1"/>',
 'Cross Line':'<path d="M12 2v20M2 12h20"/>','Arrow Line':'<path d="M3 21L21 3M13 3h8v8"/>',
 'Info Line':'<path d="M4 20L20 4M7 14l3 3m1-8 3 3M15 4l5 5M4 15l5 5"/>',
 'Trend Angle':'<path d="M3 20h18M3 20L17 5M8 20a5 5 0 0 0-2-4"/>',
 'Regression Channel':'<path d="M2 19L18 3M6 22L22 6M2 15L15 2"/>',
 'Flat Top/Bottom Channel':'<path d="M2 15L17 2M6 20L21 7M3 20L18 7"/>',
 'Disjoint Channel':'<path d="M2 15L14 3M10 21L22 9M2 20L14 8"/>',
 'Pitchfork':'<path d="M3 20L19 4M7 21L21 7M3 14L14 3M8 14l4 4"/>',
 'Schiff Pitchfork':'<path d="M2 19L17 4M6 22L21 7M2 13L13 2M6 12l5 5"/>',
 'Modified Schiff Pitchfork':'<path d="M2 20L19 3M7 21L22 6M2 13L13 2M8 9l7 7"/>',
 'Inside Pitchfork':'<path d="M4 21L18 3M8 21L22 7M2 16L14 2M7 13l5 5"/>',
 'Pitchfan':'<path d="M3 21L20 3M3 21L22 9M3 21L13 2"/>',
 'Retracement':'<path d="M2 4h20M2 9h20M2 14h20M2 19h20"/>',
 'Trend-Based Extension':'<path d="M2 4h20M2 10h20M2 16h20M2 21h20"/>',
 'Fib Channel':'<path d="M2 20L19 3M5 22L22 5M2 13L13 2"/>',
 'Speed Resistance Fan':'<path d="M3 21L20 4M3 21L20 10M3 21L20 16M3 21h18"/>',
 'Time Zones':'<path d="M4 3v18M9 3v18M16 3v18M20 3v18"/>',
 'Trend-Based Time':'<path d="M4 3v18M10 3v18M14 3v18M21 3v18"/>',
 'Resistance Arcs':'<path d="M3 21A18 18 0 0 1 21 3M3 21A12 12 0 0 1 15 9"/>',
 'Fib Circles':'<circle cx="12" cy="12" r="9"/>',
 'Fib Spiral':'<path d="M12 12c0-3 5-3 5 1s-7 6-9 1 4-10 10-7 6 12-1 14"/>',
 'Fib Wedge':'<path d="M12 3L2 21h20z"/>',
 'Gann Fan':'<path d="M2 21L21 3M2 21L21 10M2 21L21 16"/>',
 'Gann Box':'<rect x="3" y="3" width="18" height="18"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>',
 'Gann Square':'<rect x="3" y="3" width="18" height="18"/><path d="M12 3v18M3 12h18M3 3l18 18"/>',
 'Fixed Gann Square':'<rect x="3" y="3" width="18" height="18"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18M3 3l18 18"/>',
 'Head & Shoulders':'<path d="M2 19l4-9 4 5 4-12 4 12 4-5"/>',
 'Inverse Head & Shoulders':'<path d="M2 5l4 9 4-5 4 12 4-12 4 5"/>',
 'Triangle Pattern':'<path d="M12 3L2 21h20z"/>',
 'ABCD':'<path d="M2 17L7 7l5 9 5-12 5 9"/>',
 'XABCD':'<path d="M2 14l4-8 5 12 5-10 6 9"/>',
 'Cypher':'<path d="M2 19l5-11 5 8 5-13 5 9"/>',
 'Three Drives':'<path d="M2 18l4-8 4 7 4-10 4 8 4-12"/>',
 'Impulse 1–5':'<path d="M2 20l4-9 4 5 4-12 4 9 4-5"/>',
 'Correction ABC':'<path d="M2 19l5-11 5 8 5-12 5 9"/>',
 'Triangle ABCDE':'<path d="M12 3L2 21h20z"/>',
 'Double Combination WXY':'<path d="M2 18l4-10 4 9 4-12 4 9 4-8"/>',
 'Triple Combination WXYXZ':'<path d="M2 19l4-9 4 7 4-12 4 10 4-9"/>',
 'Cycle Lines':'<path d="M3 3v18M8 3v18M12 4c-7 0-7 16 0 16s7-16 0-16M21 3v18"/>',
 'Time Cycles':'<path d="M3 3v18M8 3v18M12 4c-7 0-7 16 0 16s7-16 0-16M21 3v18"/>',
 'Sine Line':'<path d="M2 12c4-17 8 17 12 0s6-8 8 0"/>',
 'Rotated Rectangle':'<path d="M7 2l15 8-6 12L2 14z"/>',
 'Ellipse / Circle':'<circle cx="12" cy="12" r="9"/>',
 'Triangle':'<path d="M12 3L2 21h20z"/>',
 'Polygon':'<path d="M7 2l14 5-2 13-14 2L2 9z"/>',
 'Polyline':'<path d="M2 19l5-12 6 9 4-7 5 5"/>',
 'Double Curve':'<path d="M2 20Q6 4 14 8M4 22Q9 7 21 5"/>',
 'Arc':'<path d="M3 21A18 18 0 0 1 21 3"/>',
 'Highlighter':'<path d="M2 19Q6 7 11 12T22 3" stroke-width="3" opacity=".8"/>',
 'Freehand Forecast Path':'<path d="M2 19l5-9 5 7 5-13 5 9"/>',
 'Anchored Text':'<path d="M4 5h16M12 5v15M8 20h8M3 3l3 3"/>',
 'Note':'<path d="M4 3h16v18H4zM7 8h10M7 12h10M7 16h7"/>',
 'Anchored Note':'<path d="M4 3h16v18H4zM7 8h10M7 12h10M7 16h7M2 2l4 4"/>',
 'Callout':'<path d="M3 4h18v13H9l-5 4v-4H3z"/>',
 'Balloon':'<path d="M3 4h18v13H9l-5 4v-4H3z"/>',
 'Price Label':'<path d="M4 3h16v18H4zM7 8h10M7 12h10M7 16h7"/>',
 'Flag':'<path d="M5 2v20M5 3h15l-4 6 4 6H5"/>',
 'Arrow Up':'<path d="M12 22V3M4 11l8-8 8 8"/>',
 'Arrow Down':'<path d="M12 2v19M4 13l8 8 8-8"/>',
 'Arrow Left':'<path d="M22 12H3M11 4l-8 8 8 8"/>',
 'Arrow Right':'<path d="M2 12h19M13 4l8 8-8 8"/>',
 'Symbol / Icon':'<path d="M12 2l3 7 7 .5-5.5 5 1.5 7.5-6-4-6 4 1.5-7.5L2 9.5 9 9z"/>',
 'Position · target + stop':'<rect x="3" y="3" width="18" height="9"/><rect x="3" y="12" width="18" height="9"/><path d="M3 12h18"/>',
 'Price Range':'<path d="M12 3v18M7 7l5-5 5 5M7 17l5 5 5-5M3 12h18"/>',
 'Date Range / Candle Count':'<path d="M3 12h18M7 7l-5 5 5 5M17 7l5 5-5 5M12 3v18"/>',
 'Date & Price Range':'<rect x="3" y="5" width="18" height="14"/>',
 'Forecast':'<path d="M3 21L21 3M13 3h8v8"/>',
 'Projection':'<path d="M3 21L21 3M13 3h8v8"/>',
 'Bars Pattern':'<path d="M4 3v18M10 3v18M16 3v18M22 3v18M2 8h6M8 16h6M14 10h6"/>',
 'Ghost Feed':'<path d="M4 3v18M10 3v18M16 3v18M22 3v18M2 8h6M8 16h6M14 10h6"/>',
 'Anchored VWAP':'<path d="M2 19Q6 6 11 12T22 4M2 22Q6 9 11 15T22 7"/>'
};
const categoryGlyph={trend:'trend',parallel:'parallel',brush:'Pitchfork',horizontal:'Retracement',grid:'Gann Box',zigzag:'Head & Shoulders',polyline:'Impulse 1–5',vertical:'Cycle Lines',rectangle:'rectangle',curve:'Brush',text:'text',ruler:'ruler',ray:'Anchored VWAP',star:'star',history:'history'};
function glyphFor(name,kind){return toolGlyphs[name]||icons[kind]||icons.trend;}
const favoriteNames=new Set();const recentNames=[];
const picker=document.createElement('section');picker.className='charts-tools-picker';picker.hidden=true;picker.setAttribute('aria-label','Drawing tools');
picker.innerHTML='<div class="charts-tools-picker-head"><strong></strong><button type="button" aria-label="Close tool menu">×</button></div><input type="search" placeholder="Search all tools" aria-label="Search all tools"><div class="charts-tools-picker-list"></div><div class="charts-tools-picker-hint">Select a tool, then place it on the chart.</div>';
const pickerTitle=picker.querySelector('strong'),pickerSearch=picker.querySelector('input'),pickerList=picker.querySelector('.charts-tools-picker-list');let activeCategory=null;
function categoryItems(category){if(category==='zoom')return Object.entries(toolCategories).filter(([key])=>!['star','history','zoom','sliders'].includes(key)).flatMap(([,value])=>value.items);if(category==='sliders')return shapes.map((x,i)=>[`${i+1}. ${x.name||x.kind}`,x.kind]);if(category==='star')return Object.values(toolCategories).flatMap(x=>x.items).filter(x=>favoriteNames.has(x[0]));if(category==='history')return recentNames.map(name=>Object.values(toolCategories).flatMap(x=>x.items).find(x=>x[0]===name)).filter(Boolean);return toolCategories[category].items;}
function renderPicker(){pickerTitle.textContent=toolCategories[activeCategory].title;const query=pickerSearch.value.trim().toLowerCase();pickerList.replaceChildren();const items=categoryItems(activeCategory).filter(x=>x[0].toLowerCase().includes(query));if(!items.length){const empty=document.createElement('div');empty.className='charts-tools-picker-empty';empty.textContent='No matching tools';pickerList.append(empty);return;}
 for(const [name,kind] of items){const item=document.createElement('div');item.className='charts-tools-picker-item';const select=document.createElement('button');select.type='button';select.className='charts-tools-picker-select';const symbol=glyphFor(name,kind);
select.innerHTML='<svg class="charts-tools-item-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'+symbol+'</svg><span></span>';
select.querySelector('span').textContent=name;select.onclick=()=>{if(activeCategory==='sliders')return;ensure();mode=kind;activeTool=name;activeCategoryButton=activeCategory;clickPoints=[];update();picker.hidden=true;pickerSearch.value='';if(recentNames.includes(name))recentNames.splice(recentNames.indexOf(name),1);recentNames.unshift(name);if(recentNames.length>15)recentNames.pop();};const fav=document.createElement('button');fav.type='button';fav.className='charts-tools-picker-favorite';fav.textContent=favoriteNames.has(name)?'★':'☆';fav.title='Toggle favorite';fav.setAttribute('aria-label','Favorite '+name);fav.onclick=()=>{if(favoriteNames.has(name))favoriteNames.delete(name);else favoriteNames.add(name);renderPicker();};item.append(select,fav);pickerList.append(item);}
}
function openCategory(category,anchor){if(activeCategory===category&&!picker.hidden){picker.hidden=true;return;}activeCategory=category;pickerSearch.value='';picker.hidden=false;renderPicker();const rect=anchor.getBoundingClientRect();const left=Math.max(8,Math.min(window.innerWidth-308,rect.left));const top=rect.top>360?rect.top-12:rect.bottom+6;picker.style.left=left+'px';picker.style.top=Math.min(window.innerHeight-100,Math.max(8,top))+'px';if(rect.top>360)picker.style.transform='translateY(-100%)';else picker.style.transform='none';pickerSearch.focus();}
for(const b of bar.querySelectorAll('[data-mode]')){const category=b.dataset.mode;if(!toolCategories[category])continue;b.title=toolCategories[category].title;b.setAttribute('aria-label',toolCategories[category].title);const symbol=toolGlyphs[categoryGlyph[category]]||icons[categoryGlyph[category]]||icons[category];if(symbol)b.querySelector('svg').innerHTML=symbol;b.onclick=()=>openCategory(category,b);}
picker.querySelector('.charts-tools-picker-head button').onclick=()=>picker.hidden=true;pickerSearch.addEventListener('input',renderPicker);document.body.append(picker);
document.addEventListener('pointerdown',e=>{if(!picker.hidden&&!picker.contains(e.target)&&!bar.contains(e.target))picker.hidden=true;});
window.addEventListener('keydown',e=>{if(e.key==='Escape')picker.hidden=true;});


window.addEventListener('keydown',e=>{if(e.key==='Escape'&&mode!=='select'){mode='select';activeCategoryButton=null;clickPoints=[];start=null;preview=null;update();draw();}});
})();
