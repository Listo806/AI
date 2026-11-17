/* Offline demo toolbar: all controls remain in one horizontal row.
   Horizontal scrolling on narrow screens preserves every button. */
(()=>{
 'use strict';
 const create=(tag,cls,label)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(label!==undefined)el.textContent=label;return el;};
 const button=(label,title,fn)=>{const b=create('button','demo-tool',label);b.type='button';b.title=title||label;b.addEventListener('click',fn);return b;};
 const click=id=>document.getElementById(id)?.click();
 const showDialog=id=>{const dialog=document.getElementById(id);if(dialog?.showModal)dialog.showModal();};
 const popup=(heading,content)=>{
  let d=document.getElementById('demoToolbarDialog');if(!d){d=create('dialog','demo-toolbar-dialog');d.id='demoToolbarDialog';document.body.append(d);}
  d.replaceChildren();const header=create('div','demo-dialog-header');header.append(create('strong','',heading),button('×','Close',()=>d.close()));d.append(header,content);d.showModal();
 };
 const notice=text=>{let n=document.getElementById('demoToolNotice');if(!n){n=create('div','demo-tool-notice');n.id='demoToolNotice';document.body.append(n);}n.textContent=text;n.hidden=false;clearTimeout(n._timer);n._timer=setTimeout(()=>n.hidden=true,3000);};
 const addRange=(parent,label,count)=>parent.append(button(label,'Show approximately '+label+' of simulated history',()=>{
  const select=document.querySelector('.timeframes [data-frame="1day"]');select?.click();
  // Use the chart's native zoom controls instead of changing the data source.
  for(let i=0;i<Math.min(count,15);i++)click('zoomOut');
 }));
 function install(){
  const toolbar=document.querySelector('article > .toolbar'),frames=toolbar?.querySelector('.timeframes');if(!toolbar||!frames||toolbar.dataset.demoReady)return;
  toolbar.dataset.demoReady='true';
  // Preserve the original timeframe nodes and handlers.
  const rail=create('div','demo-chart-rail');rail.setAttribute('role','toolbar');rail.setAttribute('aria-label','Chart tools');
  const symbol=create('span','demo-chart-symbol','USD/JPY');symbol.id='demoChartSymbol';rail.append(symbol);
  frames.classList.add('demo-chart-timeframes');rail.append(frames);
  const ranges=create('div','demo-chart-ranges');
  [['D1',0],['W1',2],['M1',4],['Q1',6],['Y1',8],['Y5',11],['Y10',14]].forEach(([name,n])=>addRange(ranges,name,n));
  rail.append(ranges);
  const zoom=create('div','demo-chart-zoom');zoom.append(button('⊖','Zoom out',()=>click('zoomOut')),button('⊕','Zoom in',()=>click('zoomIn')));rail.append(zoom);
  const actions=create('div','demo-chart-action-group');rail.append(actions);
  actions.append(button('☷ Market','Market Watch',()=>{
   const picker=document.querySelector('.market-tools-market-button,.market-tools button,.market-picker-button,#marketPickerButton');
   if(picker)picker.click();else{const box=create('div');const input=create('input');input.placeholder='Search simulated markets';input.className='demo-market-search';box.append(input);const list=create('div','demo-market-list');box.append(list);const draw=()=>{list.replaceChildren();const names=[...document.querySelectorAll('#markets button')];for(const b of names.filter(b=>b.textContent.toLowerCase().includes(input.value.toLowerCase())).slice(0,35)){list.append(button(b.textContent,'Select market',()=>{b.click();document.getElementById('demoToolbarDialog')?.close();}));}};input.oninput=draw;draw();popup('Market Watch · simulated prices',box);}
  }));
  actions.append(button('✎ Drawing Tools','Draw directly over the chart',()=>{
   const panel=create('div','demo-draw-controls');
   ['Trend line','Horizontal line','Rectangle','Clear drawings'].forEach(name=>panel.append(button(name,name,()=>{setDrawing(name);document.getElementById('demoToolbarDialog')?.close();notice(name==='Clear drawings'?'Drawings cleared':'Click and drag on the chart to draw '+name.toLowerCase());})));
   popup('Drawing Tools',panel);
  }));
  actions.append(button('⌁ Indicators','Indicator settings',()=>click('settings')));
  actions.append(button('▦ Calendar','Simulated economic calendar',()=>{
   const body=create('div','demo-calendar');body.append(create('p','','Demo calendar: simulated events only; no external economic calendar API is used.'));
   const tbl=create('table');tbl.innerHTML='<thead><tr><th>Time (UTC)</th><th>Currency</th><th>Event</th><th>Impact</th></tr></thead><tbody><tr><td>08:30</td><td>USD</td><td>Demo inflation release</td><td>High</td></tr><tr><td>10:00</td><td>EUR</td><td>Demo manufacturing report</td><td>Medium</td></tr><tr><td>14:00</td><td>GBP</td><td>Demo central bank statement</td><td>High</td></tr></tbody>';body.append(tbl);popup('Economic Calendar · simulated',body);
  }));
  // chart-layout.js adds these native buttons to .actions later; move them after initialization.
  const chartsSlot=create('span','demo-chart-native');chartsSlot.id='demoChartsSlot';actions.append(chartsSlot);
  actions.append(button('▤ Terminal','Offline demo terminal',()=>{
   const body=create('div');body.append(create('p','','Simulated workspace only. No orders, account balances, broker connections or real trades are available.'));popup('Trading Terminal · demo only',body);
  }));
  const style=create('div','demo-chart-style');style.append(button('Candles','Candlestick chart',()=>click('candlesStyle')),button('Line','Line chart',()=>click('lineStyle')));actions.append(style);
  actions.append(button('Reset','Reset chart viewport',()=>click('reset')));
  actions.append(button('✦ Cortexa AI','AI demo information',()=>{const p=create('p');p.textContent='Cortexa AI is not connected in this public demo. No prompts or account data are sent to the server.';popup('Cortexa AI · demo',p);}));
  toolbar.prepend(rail);
  const oldNav=toolbar.querySelector('#markets');if(oldNav)oldNav.classList.add('demo-hidden-original-market');
  const oldMtf=toolbar.querySelector('.mtf-table');if(oldMtf)oldMtf.classList.add('demo-hidden-original-mtf');
  const relocate=()=>{
   const target=document.getElementById('demoChartsSlot'),native=document.getElementById('viewChartsButton'),fullscreen=document.getElementById('chartFullscreenButton');
   if(native&&native.parentElement!==target)target.append(native);
   if(fullscreen&&fullscreen.parentElement!==target)target.append(fullscreen);
   const name=document.querySelector('#markets button.active')?.textContent?.trim();if(name)symbol.textContent=name;
  };
  new MutationObserver(relocate).observe(document.querySelector('article'),{childList:true,subtree:true});relocate();
  document.getElementById('markets')?.addEventListener('click',()=>setTimeout(relocate,0));
  // Preserve all controls in one line. Scrolling is horizontal when needed.
  rail.addEventListener('wheel',e=>{if(Math.abs(e.deltaY)>Math.abs(e.deltaX)&&rail.scrollWidth>rail.clientWidth){e.preventDefault();rail.scrollLeft+=e.deltaY;}},{passive:false});
  function setDrawing(tool){
   const canvas=document.getElementById('priceChart');const wrap=canvas?.parentElement;if(!wrap)return;
   let layer=document.getElementById('demoDrawingLayer');
   if(!layer){layer=create('canvas','demo-drawing-layer');layer.id='demoDrawingLayer';wrap.append(layer);const resize=()=>{const rect=wrap.getBoundingClientRect(),ratio=devicePixelRatio||1;layer.width=Math.round(rect.width*ratio);layer.height=Math.round(rect.height*ratio);layer.style.width=rect.width+'px';layer.style.height=rect.height+'px';layer.getContext('2d').setTransform(ratio,0,0,ratio,0,0);};resize();window.addEventListener('resize',resize);}
   if(tool==='Clear drawings'){layer.getContext('2d').clearRect(0,0,layer.width,layer.height);layer.style.pointerEvents='none';return;}
   layer.style.pointerEvents='auto';let start=null,snapshot=null;
   const point=e=>{const rect=layer.getBoundingClientRect();return{x:e.clientX-rect.left,y:e.clientY-rect.top};};
   const paint=end=>{const ctx=layer.getContext('2d');if(snapshot)ctx.putImageData(snapshot,0,0);ctx.strokeStyle='#f4dc54';ctx.lineWidth=2;ctx.beginPath();if(tool==='Rectangle')ctx.strokeRect(start.x,start.y,end.x-start.x,end.y-start.y);else{ctx.moveTo(start.x,start.y);ctx.lineTo(tool==='Horizontal line'?{x:end.x,y:start.y}.x:end.x,tool==='Horizontal line'?start.y:end.y);ctx.stroke();}};
   layer.onpointerdown=e=>{start=point(e);snapshot=layer.getContext('2d').getImageData(0,0,layer.width,layer.height);layer.setPointerCapture(e.pointerId);};
   layer.onpointermove=e=>{if(start)paint(point(e));};
   layer.onpointerup=e=>{if(start){paint(point(e));start=null;}layer.style.pointerEvents='none';};
  }
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
