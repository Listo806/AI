(()=>{
 'use strict';
 // Add only missing controls to the EXISTING chart engine action row.
 // Never create a second toolbar, duplicate timeframes or replace native buttons.
 const actions=document.querySelector('.market-heading .actions');
 if(!actions||actions.dataset.demoNativeEnhanced==='1')return;
 actions.dataset.demoNativeEnhanced='1';
 const get=id=>document.getElementById(id);
 const make=(label,kind)=>{const b=document.createElement('button');b.type='button';b.className='demo-native-extra';b.dataset.demoExtra=kind;b.textContent=label;return b;};
 const dialog=(title,build)=>{
  let d=get('demoNativeDialog');if(!d){d=document.createElement('dialog');d.id='demoNativeDialog';d.className='demo-native-dialog';document.body.append(d);}
  d.replaceChildren();const header=document.createElement('div');header.className='demo-native-dialog-head';const h=document.createElement('strong');h.textContent=title;const close=document.createElement('button');close.type='button';close.textContent='Close';close.addEventListener('click',()=>d.close());header.append(h,close);d.append(header);build(d);d.showModal();
 };
 const addChoice=(host,label,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',fn);host.append(b);};
 let drawingMode=null;
 function enableDrawing(type){
  const canvas=get('priceChart'),wrap=canvas?.parentElement;if(!wrap)return;
  let layer=get('demoNativeDrawLayer');if(!layer){layer=document.createElement('canvas');layer.id='demoNativeDrawLayer';wrap.style.position='relative';wrap.append(layer);}
  if(type==='Clear drawings'){layer.getContext('2d').clearRect(0,0,layer.width,layer.height);layer.style.pointerEvents='none';drawingMode=null;return;}
  const rect=wrap.getBoundingClientRect(),ratio=devicePixelRatio||1;
  layer.width=Math.round(rect.width*ratio);layer.height=Math.round(rect.height*ratio);layer.style.width=rect.width+'px';layer.style.height=rect.height+'px';
  const ctx=layer.getContext('2d');ctx.setTransform(ratio,0,0,ratio,0,0);layer.style.pointerEvents='auto';drawingMode=type;
  let start=null,original=null;
  const point=e=>{const r=layer.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};};
  layer.onpointerdown=e=>{start=point(e);original=ctx.getImageData(0,0,layer.width,layer.height);layer.setPointerCapture(e.pointerId);};
  layer.onpointermove=e=>{if(!start)return;const end=point(e);ctx.putImageData(original,0,0);ctx.beginPath();ctx.lineWidth=2;ctx.strokeStyle='#e8e86b';if(type==='Rectangle'){ctx.strokeRect(start.x,start.y,end.x-start.x,end.y-start.y);}else{ctx.moveTo(start.x,start.y);ctx.lineTo(end.x,type==='Horizontal line'?start.y:end.y);ctx.stroke();}};
  layer.onpointerup=e=>{layer.onpointermove(e);start=null;layer.style.pointerEvents='none';drawingMode=null;};
 }
 const draw=make('✎ Drawing Tools','draw');
 const calendar=make('▦ Calendar','calendar');
 const terminal=make('▤ Terminal','terminal');
 const ai=make('✦ Cortexa AI','ai');
 // Existing native buttons retain their original event handlers.
 const marketGroup=actions.querySelector('.market-tools');
 if(marketGroup)marketGroup.append(draw);else actions.prepend(draw);
 if(marketGroup)marketGroup.after(calendar);else draw.after(calendar);
 const fullscreen=get('chartFullscreenButton');
 if(fullscreen)fullscreen.after(terminal);else calendar.after(terminal);
 const reset=get('reset');if(reset)reset.after(ai);else actions.append(ai);
 draw.addEventListener('click',()=>dialog('Drawing Tools · offline demo',d=>{const group=document.createElement('div');group.className='demo-native-choices';['Trend line','Horizontal line','Rectangle','Clear drawings'].forEach(t=>addChoice(group,t,()=>{enableDrawing(t);d.close();}));d.append(group);}));
 calendar.addEventListener('click',()=>dialog('Economic Calendar · simulated',d=>{const p=document.createElement('p');p.textContent='Simulated economic events only. No live calendar service is connected.';d.append(p);}));
 terminal.addEventListener('click',()=>dialog('Terminal · offline demo',d=>{const p=document.createElement('p');p.textContent='Trading and broker connections are disabled in this public demo. All displayed prices are simulated.';d.append(p);}));
 ai.addEventListener('click',()=>dialog('Cortexa AI · offline demo',d=>{const p=document.createElement('p');p.textContent='Cortexa AI requires a paid workspace. No AI API or customer account is accessed in this demo.';d.append(p);}));
})();
