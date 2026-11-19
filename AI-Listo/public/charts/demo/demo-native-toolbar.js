(()=>{
'use strict';
const $=id=>document.getElementById(id), actions=document.querySelector('.market-heading .actions');
if(!actions||actions.dataset.demoFixed==='3')return;actions.dataset.demoFixed='3';
const make=(label,id)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.id=id;b.className='demo-native-extra';return b;};
const dialog=(title,content)=>{let d=$('demoActionDialog');if(!d){d=document.createElement('dialog');d.id='demoActionDialog';d.className='demo-native-dialog';document.body.append(d);}d.replaceChildren();const h=document.createElement('div');h.className='demo-native-dialog-head';const t=document.createElement('strong');t.textContent=title;const x=make('Close','');x.addEventListener('click',()=>d.close());h.append(t,x);d.append(h,content);d.showModal();};
const pane=(text)=>{const p=document.createElement('p');p.textContent=text;return p;};
const group=actions.querySelector('.market-tools');
const draw=actions.querySelector('[data-demo-extra="draw"]')||make('✎ Drawing Tools','demoDrawingTools');draw.dataset.demoExtra='draw';
const calendar=make('▦ Calendar','demoCalendar');
const terminal=make('▤ Terminal','demoTerminal');
const ai=make('✦ Cortexa AI','demoAI');
// Restore native buttons: do not replace them or their event listeners.
const charts=$('viewChartsButton'),full=$('chartFullscreenButton'),styles=actions.querySelector('.chart-styles'),reset=$('reset');
if(group)group.after(draw);else actions.prepend(draw);
draw.after(calendar);
if(charts)calendar.after(charts);
if(full)(charts||calendar).after(full);
if(full)full.after(terminal);else (charts||calendar).after(terminal);
if(styles)terminal.after(styles);
if(reset)reset.after(ai);else actions.append(ai);
// Keep all real native controls. Never remove them from the DOM.
const nativeMarket=group?.querySelector('button:first-child'),nativeIndicators=group?.querySelector('button:last-child');
if(nativeMarket)nativeMarket.textContent='☷ Market';
if(nativeIndicators)nativeIndicators.textContent='⌁ Indicators';
if(charts)charts.textContent='▦ Charts';
if(full)full.textContent='⛶ Full screen';
if(reset)reset.textContent='Reset';
// Offline drawing overlay. Pointer input is enabled only while drawing.
const chart=$('priceChart'),wrap=chart?.parentElement;let layer=null,mode='',start=null,drawings=[];
const norm=(e)=>{const r=layer.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height};};
function paint(preview){if(!layer)return;const r=layer.getBoundingClientRect(),dpr=devicePixelRatio||1,ctx=layer.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,r.width,r.height);ctx.strokeStyle='#d9bd6b';ctx.lineWidth=2;for(const s of preview?[...drawings,preview]:drawings){const a={x:s.a.x*r.width,y:s.a.y*r.height},b={x:s.b.x*r.width,y:s.b.y*r.height};ctx.beginPath();if(s.mode==='Rectangle')ctx.strokeRect(a.x,a.y,b.x-a.x,b.y-a.y);else{ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,s.mode==='Horizontal line'?a.y:b.y);ctx.stroke();}}}
function resize(){if(!layer)return;const r=wrap.getBoundingClientRect(),dpr=devicePixelRatio||1;layer.width=Math.round(r.width*dpr);layer.height=Math.round(r.height*dpr);layer.style.width=r.width+'px';layer.style.height=r.height+'px';paint();}
function ensureLayer(){if(layer||!wrap)return;layer=document.createElement('canvas');layer.id='demoNativeDrawLayer';wrap.style.position='relative';wrap.append(layer);layer.addEventListener('pointerdown',e=>{if(!mode)return;start=norm(e);layer.setPointerCapture(e.pointerId);e.preventDefault();});layer.addEventListener('pointermove',e=>{if(start)paint({mode,a:start,b:norm(e)});});layer.addEventListener('pointerup',e=>{if(!start)return;drawings.push({mode,a:start,b:norm(e)});start=null;mode='';layer.style.pointerEvents='none';draw.setAttribute('aria-pressed','false');paint();});layer.addEventListener('pointercancel',()=>{start=null;mode='';layer.style.pointerEvents='none';paint();});new ResizeObserver(resize).observe(wrap);resize();}
draw.addEventListener('click',()=>{const box=document.createElement('div');box.className='demo-native-choices';for(const option of ['Trend line','Horizontal line','Rectangle','Clear drawings']){const b=make(option,'');b.onclick=()=>{ensureLayer();if(option==='Clear drawings'){drawings=[];mode='';layer.style.pointerEvents='none';paint();}else{mode=option;layer.style.pointerEvents='auto';draw.setAttribute('aria-pressed','true');} $('demoActionDialog').close();};box.append(b);}dialog('Drawing Tools · simulated data',box);});
calendar.addEventListener('click',()=>{const box=document.createElement('div');box.append(pane('Economic Calendar · offline demo'),pane('Live economic events are intentionally unavailable. This demo makes no network requests.'));const now=document.createElement('p');now.textContent='Current UTC: '+new Date().toISOString().replace('T',' ').slice(0,16);box.append(now);dialog('Economic Calendar',box);});
let terminalPane=null;terminal.addEventListener('click',()=>{if(!terminalPane){terminalPane=document.createElement('section');terminalPane.id='demoOfflineTerminal';terminalPane.className='demo-offline-terminal';const h=document.createElement('div');h.className='demo-native-dialog-head';const title=document.createElement('strong');title.textContent='Terminal · simulated account';const x=make('×','');x.onclick=()=>{terminalPane.hidden=true;terminal.setAttribute('aria-pressed','false');};h.append(title,x);terminalPane.append(h,pane('No broker connected. Positions, orders and account balances are not available in this offline demo.'));document.querySelector('article').append(terminalPane);}terminalPane.hidden=!terminalPane.hidden;terminal.setAttribute('aria-pressed',String(!terminalPane.hidden));});
ai.addEventListener('click',()=>{const box=document.createElement('div');box.append(pane('Cortexa AI preview · offline mode'),pane('AI requests are disabled in this public demo to protect customer accounts and live APIs.'));const selected=document.querySelector('#markets button.active, #markets button[aria-pressed="true"]');if(selected)box.append(pane('Selected market: '+selected.textContent.trim()));dialog('Cortexa AI',box);});
})();