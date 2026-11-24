'use strict';
(()=>{
 const make=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 const embedded=Boolean(window.ChartEmbed),wrap=document.querySelector('.canvas-wrap');if(!wrap)return;
 const panel=make('div','one-click-panel');panel.hidden=true;panel.id='oneClickPanel';panel.setAttribute('role','group');panel.setAttribute('aria-label','One Click Trading');
 const sell=make('button','one-click-side one-click-sell'),buy=make('button','one-click-side one-click-buy');
 for(const [b,label]of [[sell,'SELL'],[buy,'BUY']]){b.type='button';b.disabled=true;b.title='Trading account not connected';b.setAttribute('aria-label',label+' — trading account not connected');b.append(make('span','one-click-side-label',label),make('strong','one-click-price','—'));}
 const volume=make('div','one-click-volume'),down=make('button','','▾'),up=make('button','','▴'),input=make('input');input.type='number';input.min='0.00';input.max='100';input.step='0.01';input.value='0.10';input.setAttribute('aria-label','Order size');input.inputMode='decimal';
 down.type=up.type='button';down.setAttribute('aria-label','Decrease order size');up.setAttribute('aria-label','Increase order size');
 function normalize(value){const n=Number(value);return (Number.isFinite(n)&&n>=0?Math.min(100,Math.round(n*100)/100):.1).toFixed(2);}
 input.onchange=()=>{input.value=normalize(input.value);};
 let holdTimer=null,heldButton=null,holdStarted=0;
 function stopHold(){clearTimeout(holdTimer);holdTimer=null;heldButton=null;}
 function adjust(direction){input.value=normalize(Math.max(0,Math.min(100,Number(normalize(input.value))+direction*.01)));}
 function startHold(button,direction){stopHold();heldButton=button;holdStarted=performance.now();adjust(direction);const repeat=()=>{if(heldButton!==button)return;adjust(direction);holdTimer=setTimeout(repeat,performance.now()-holdStarted>1500?35:110);};holdTimer=setTimeout(repeat,350);}
 for(const [button,direction]of [[down,-1],[up,1]]){
  button.style.touchAction='none';
  button.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();startHold(button,direction);};
  button.onpointerleave=stopHold;button.onpointercancel=stopHold;button.onpointerup=stopHold;
  button.onclick=e=>{if(e.detail===0)adjust(direction);};
  button.onkeydown=e=>{if(!['ArrowUp','ArrowDown',' ','Enter'].includes(e.key))return;e.preventDefault();if(!e.repeat)startHold(button,e.key==='ArrowDown'?-1:e.key==='ArrowUp'?1:direction);};
  button.onkeyup=stopHold;button.onblur=stopHold;
 }
 window.addEventListener('pointerup',stopHold);window.addEventListener('blur',stopHold);document.addEventListener('visibilitychange',()=>{if(document.hidden)stopHold();});
 // Prices are informational while the trade buttons are disabled.
 function syncPrices(){
  const quote=window.CortexaOneClickQuote?.();
  for(const [button,value] of [[sell,quote?.bid],[buy,quote?.ask]]){
   const display=button.querySelector('.one-click-price');
   const formatted=Number.isFinite(value)?value.toFixed(quote?.digits??(value>=100?3:5)):'—';
   // On mobile, raise only the final fractional digit, as in the supplied PWA reference.
   if(document.documentElement.classList.contains('cx-mobile-chart') && formatted!=='—' && formatted.includes('.')){
    display.replaceChildren(document.createTextNode(formatted.slice(0,-1)),make('span','cx-quote-last-digit',formatted.slice(-1)));
   }else display.textContent=formatted;
  }
 }
 window.addEventListener('cortexa-one-click-quote',syncPrices);
 syncPrices();
 volume.append(down,input,up);panel.append(sell,volume,buy);
 // In the single workspace the chart canvas overlaps the header. Mount the
 // order controls at article level so the header cannot paint over them.
 const host=embedded?wrap:document.querySelector('article');
 host.append(panel);
 const localToggle=make('button','one-click-toggle');localToggle.type='button';localToggle.setAttribute('aria-controls',panel.id);const icon=make('span','one-click-icon','⇄'),words=make('span','one-click-words','One Click Trading');localToggle.append(icon,words);
 let opened=false;
 function updateToggle(button,on){button.setAttribute('aria-expanded',String(on));button.setAttribute('aria-pressed',String(on));button.setAttribute('aria-label',on?'Hide One Click Trading':'Show One Click Trading');button.title=on?'Hide One Click Trading':'Show One Click Trading';button.querySelector('.one-click-words').hidden=on;button.classList.toggle('active',on);}
 function positionPanel(){
  if(embedded||!opened)return;
  const article=document.querySelector('article');
  const strip=article?.querySelector('.one-click-control-strip');
  if(!article||!strip)return;
  const parentRect=article.getBoundingClientRect(),stripRect=strip.getBoundingClientRect();
  if(document.documentElement.classList.contains('cx-mobile-chart')){const chrome=document.querySelector('.cx-mobile-chrome');if(chrome&&panel.parentNode!==chrome){const tools=chrome.querySelector('.cx-mobile-tools');if(tools)tools.after(panel);else chrome.prepend(panel);}panel.style.top='';panel.style.left='';return;}if(panel.parentNode!==article)article.append(panel);panel.style.top=Math.max(0,stripRect.bottom-parentRect.top+3)+'px';
  panel.style.left=Math.max(0,stripRect.left-parentRect.left+8)+'px';
 }
 function setOpen(value){stopHold();opened=Boolean(value);panel.hidden=!opened;document.documentElement.classList.toggle('cx-mobile-trading-open',opened);wrap.classList.toggle('one-click-open',opened);updateToggle(localToggle,opened);const lightning=document.querySelector('.cx-mobile-lightning');if(lightning){lightning.setAttribute('aria-pressed',String(opened));lightning.setAttribute('aria-expanded',String(opened));}positionPanel();if(embedded)parent.ChartOneClick?.syncHost();}
 if(!embedded){window.addEventListener('resize',positionPanel,{passive:true});document.addEventListener('scroll',positionPanel,true);}
 window.OneClickPanel={toggle(){setOpen(!opened);},reposition:positionPanel,get opened(){return opened;}};
 panel.addEventListener('pointerdown',e=>e.stopPropagation());panel.addEventListener('wheel',e=>e.stopPropagation());
 if(embedded){
  const header=document.querySelector('.pane-local-header'),select=header?.querySelector('.pane-symbol');if(select){const block=make('div','one-click-pane-ticker');select.before(block);block.append(select,localToggle);header.classList.add('has-one-click');}
  localToggle.onclick=()=>{window.ChartPaneAPI?.activate();OneClickPanel.toggle();};
 }else{
  const ticker=document.getElementById('chartTicker'),strip=make('div','one-click-control-strip');strip.append(localToggle);document.getElementById('chartIndicatorControls').after(strip);
  const current=()=>window.ChartLayouts?.multiple?window.ChartLayouts.chartWindow()?.OneClickPanel:window.OneClickPanel;
  window.ChartOneClick={syncHost(){updateToggle(localToggle,Boolean(current()?.opened));}};
  localToggle.onclick=()=>{current()?.toggle();ChartOneClick.syncHost();};
 }
 updateToggle(localToggle,false);if(embedded)parent.ChartOneClick?.syncHost();
})();
