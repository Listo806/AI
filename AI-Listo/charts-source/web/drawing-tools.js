/* Chart drawing tools: isolated overlay, no market data or chart API changes. */
(()=>{'use strict';
const actions=document.querySelector('.market-heading .actions');
const wrap=document.querySelector('.canvas-wrap');const price=document.getElementById('priceChart');
if(!actions||!wrap||!price)return;
let btn=document.getElementById('drawingToolsButton');
if(!btn){btn=document.createElement('button');btn.id='drawingToolsButton';btn.type='button';btn.className='market-tool';btn.textContent='✎ Drawing Tools';const controls=actions.querySelector('.market-tools');if(controls){const ind=[...controls.querySelectorAll('button')].find(b=>b.textContent.includes('Indicators'));if(ind)ind.before(btn);else controls.append(btn);}else actions.prepend(btn);}
const group=actions.querySelector('.market-tools');
const indicator=group&&[...group.querySelectorAll('button')].find(b=>b.textContent.includes('Indicators'));
if(indicator)indicator.before(btn);else if(group)group.append(btn);
btn.hidden=false;btn.style.display='inline-flex';btn.style.visibility='visible';
btn.setAttribute('aria-expanded','false');btn.title='Open drawing tools';
const bar=document.createElement('div');bar.className='charts-draw-bar';bar.hidden=true;bar.setAttribute('aria-label','Drawing tools');
const modes=[['select','Select'],['trend','Trend line'],['horizontal','Horizontal line'],['vertical','Vertical line'],['rectangle','Rectangle'],['ray','Ray'],['erase','Erase last'],['clear','Clear drawings']];
let mode='select',start=null,shapes=[],preview=null;let overlay=null;
function position(){const r=wrap.getBoundingClientRect();if(!overlay)return;const ratio=devicePixelRatio||1;overlay.width=Math.max(1,Math.round(r.width*ratio));overlay.height=Math.max(1,Math.round(r.height*ratio));draw();}
function norm(e){const r=overlay.getBoundingClientRect();return{x:Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))};}
function draw(){if(!overlay)return;const c=overlay.getContext('2d'),r=overlay.getBoundingClientRect(),ratio=devicePixelRatio||1;c.setTransform(ratio,0,0,ratio,0,0);c.clearRect(0,0,r.width,r.height);c.strokeStyle='#d7c279';c.lineWidth=1.5;c.setLineDash([]);
for(const s of [...shapes,...(preview?[preview]:[])]){const a={x:s.a.x*r.width,y:s.a.y*r.height},b={x:s.b.x*r.width,y:s.b.y*r.height};c.beginPath();if(s.kind==='rectangle')c.rect(a.x,a.y,b.x-a.x,b.y-a.y);else if(s.kind==='horizontal'){c.moveTo(0,a.y);c.lineTo(r.width,a.y);}else if(s.kind==='vertical'){c.moveTo(a.x,0);c.lineTo(a.x,r.height);}else if(s.kind==='ray'){c.moveTo(a.x,a.y);const dx=b.x-a.x,dy=b.y-a.y,scale=dx===0?1:(dx>0?r.width-a.x:-a.x)/dx;c.lineTo(a.x+dx*scale,a.y+dy*scale);}else{c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);}c.stroke();}
}
function ensure(){if(overlay)return;overlay=document.createElement('canvas');overlay.className='charts-draw-overlay';overlay.setAttribute('aria-label','Chart drawing surface');wrap.append(overlay);overlay.addEventListener('pointerdown',e=>{if(mode==='select'||e.button!==0)return;e.preventDefault();start=norm(e);preview={kind:mode,a:start,b:start};overlay.setPointerCapture(e.pointerId);draw();});overlay.addEventListener('pointermove',e=>{if(!start)return;preview={kind:mode,a:start,b:norm(e)};draw();});overlay.addEventListener('pointerup',e=>{if(!start)return;const end=norm(e);shapes.push({kind:mode,a:start,b:end});start=null;preview=null;mode='select';update();draw();});overlay.addEventListener('pointercancel',()=>{start=null;preview=null;mode='select';update();draw();});new ResizeObserver(position).observe(wrap);position();}
function update(){bar.querySelectorAll('button[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));if(overlay){overlay.style.pointerEvents=mode==='select'?'none':'auto';overlay.style.cursor=mode==='select'?'default':'crosshair';}}
for(const [key,label] of modes){const b=document.createElement('button');b.type='button';b.dataset.mode=key;b.textContent=label;b.title=label;b.onclick=()=>{ensure();if(key==='clear'){shapes=[];mode='select';draw();}else if(key==='erase'){shapes.pop();mode='select';draw();}else mode=key;update();};bar.append(b);}
const close=document.createElement('button');close.type='button';close.textContent='×';close.title='Close drawing tools';close.onclick=()=>{bar.hidden=true;btn.setAttribute('aria-expanded','false');mode='select';update();};bar.append(close);
const shell=document.querySelector('.chart-shell');shell?.before(bar);
btn.addEventListener('click',()=>{bar.hidden=!bar.hidden;btn.setAttribute('aria-expanded',String(!bar.hidden));if(!bar.hidden){ensure();update();}});
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&mode!=='select'){mode='select';start=null;preview=null;update();draw();}});
})();
