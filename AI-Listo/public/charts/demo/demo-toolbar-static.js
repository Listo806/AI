(()=>{
 'use strict';
 const rail=document.getElementById('demoStaticToolbar');if(!rail)return;
 const get=id=>document.getElementById(id),nativeClick=id=>get(id)?.click();
 const nativeFrame=frame=>document.querySelector(`article>.toolbar>.timeframes button[data-frame="${frame}"]`)?.click();
 const modal=(title,render)=>{
  let dialog=get('demoStaticDialog');if(!dialog){dialog=document.createElement('dialog');dialog.id='demoStaticDialog';dialog.className='demo-static-dialog';document.body.append(dialog);}
  dialog.replaceChildren();const head=document.createElement('header');const label=document.createElement('strong');label.textContent=title;const close=document.createElement('button');close.textContent='Close';close.onclick=()=>dialog.close();head.append(label,close);dialog.append(head);render(dialog);dialog.showModal();
 };
 const addButton=(host,label,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=fn;host.append(b);};
 const getCanvas=()=>get('priceChart')||document.querySelector('.canvas-wrap canvas');
 function drawing(type){
  const canvas=getCanvas(),parent=canvas?.parentElement;if(!parent)return;
  let layer=get('demoStaticDrawing');if(!layer){layer=document.createElement('canvas');layer.id='demoStaticDrawing';layer.className='demo-static-drawing';parent.style.position='relative';parent.append(layer);}
  const rect=parent.getBoundingClientRect(),ratio=window.devicePixelRatio||1;
  layer.width=Math.max(1,Math.round(rect.width*ratio));layer.height=Math.max(1,Math.round(rect.height*ratio));layer.style.width=rect.width+'px';layer.style.height=rect.height+'px';const ctx=layer.getContext('2d');ctx.setTransform(ratio,0,0,ratio,0,0);
  if(type==='Clear drawings'){ctx.clearRect(0,0,rect.width,rect.height);layer.style.pointerEvents='none';return;}
  layer.style.pointerEvents='auto';let start=null,snapshot=null;
  const point=e=>({x:e.clientX-layer.getBoundingClientRect().left,y:e.clientY-layer.getBoundingClientRect().top});
  const paint=end=>{if(!start)return;ctx.putImageData(snapshot,0,0);ctx.strokeStyle='#f8dc59';ctx.lineWidth=2;ctx.beginPath();if(type==='Rectangle')ctx.strokeRect(start.x,start.y,end.x-start.x,end.y-start.y);else{ctx.moveTo(start.x,start.y);ctx.lineTo(end.x,type==='Horizontal line'?start.y:end.y);ctx.stroke();}};
  layer.onpointerdown=e=>{start=point(e);snapshot=ctx.getImageData(0,0,layer.width,layer.height);layer.setPointerCapture(e.pointerId);};layer.onpointermove=e=>paint(point(e));layer.onpointerup=e=>{paint(point(e));start=null;layer.style.pointerEvents='none';};
 }
 const actions={
  zoomOut:()=>nativeClick('zoomOut'),zoomIn:()=>nativeClick('zoomIn'),
  market:()=>modal('Market Watch · simulated',d=>{const box=document.createElement('div');box.className='tools';document.querySelectorAll('#markets button').forEach(b=>addButton(box,b.textContent.trim(),()=>{b.click();d.close();}));d.append(box);}),
  draw:()=>modal('Drawing Tools',d=>{const box=document.createElement('div');box.className='tools';['Trend line','Horizontal line','Rectangle','Clear drawings'].forEach(type=>addButton(box,type,()=>{drawing(type);d.close();}));d.append(box);}),
  indicators:()=>nativeClick('settings'),
  calendar:()=>modal('Economic Calendar · simulated',d=>{const p=document.createElement('p');p.textContent='Simulated economic events only. 08:30 UTC · USD inflation; 10:00 UTC · EUR manufacturing; 14:00 UTC · GBP central bank. No live calendar API.';d.append(p);}),
  charts:()=>{const btn=get('viewChartsButton');if(btn)btn.click();else modal('Charts layouts',d=>{const p=document.createElement('p');p.textContent='Charts layout control is unavailable in this demo build.';d.append(p);});},
  fullscreen:()=>{const btn=get('chartFullscreenButton');if(btn)btn.click();else{const shell=document.querySelector('.chart-shell')||document.querySelector('article');if(document.fullscreenElement)document.exitFullscreen?.();else shell?.requestFullscreen?.();}},
  terminal:()=>modal('Terminal · offline demo',d=>{const p=document.createElement('p');p.textContent='Demo terminal: simulated market data only. Broker connections, orders and account balances are disabled.';d.append(p);}),
  candles:()=>nativeClick('candlesStyle'),line:()=>nativeClick('lineStyle'),reset:()=>nativeClick('reset'),
  ai:()=>modal('Cortexa AI · demo',d=>{const p=document.createElement('p');p.textContent='Cortexa AI is unavailable in this public offline demo. No customer data or prompts are sent to an API.';d.append(p);})
 };
 rail.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.demoFrame){nativeFrame(b.dataset.demoFrame);rail.querySelectorAll('[data-demo-frame]').forEach(x=>x.classList.toggle('is-active',x===b));}else if(b.dataset.demoRange){nativeFrame('1day');const steps={D1:0,W1:2,M1:4,Q1:6,Y1:8,Y5:11,Y10:14};for(let i=0;i<(steps[b.dataset.demoRange]||0);i++)nativeClick('zoomOut');}else if(b.dataset.demoAction){actions[b.dataset.demoAction]?.();}});
 rail.querySelector('[data-demo-frame="1min"]')?.classList.add('is-active');
 const fit=()=>{rail.style.zoom='1';const total=rail.scrollWidth,available=rail.clientWidth;const ratio=available/Math.max(1,total);if(window.innerWidth>1100&&ratio<1)rail.style.zoom=String(Math.max(.55,ratio));};
 // Fit after font/layout settle, with horizontal scroll fallback for narrower screens.
 window.addEventListener('resize',fit,{passive:true});requestAnimationFrame(()=>requestAnimationFrame(fit));document.fonts?.ready?.then(fit);
})();