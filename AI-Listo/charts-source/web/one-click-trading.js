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
 volume.append(down,input,up);panel.append(sell,buy,volume);wrap.append(panel);
 const localToggle=make('button','one-click-toggle');localToggle.type='button';localToggle.setAttribute('aria-controls',panel.id);const icon=make('span','one-click-icon','⇄'),words=make('span','one-click-words','One Click Trading');localToggle.append(icon,words);
 let opened=false;
 function updateToggle(button,on){button.setAttribute('aria-expanded',String(on));button.setAttribute('aria-pressed',String(on));button.setAttribute('aria-label',on?'Hide One Click Trading':'Show One Click Trading');button.title=on?'Hide One Click Trading':'Show One Click Trading';button.querySelector('.one-click-words').hidden=on;button.classList.toggle('active',on);}
 function setOpen(value){stopHold();opened=Boolean(value);panel.hidden=!opened;wrap.classList.toggle('one-click-open',opened);updateToggle(localToggle,opened);if(embedded)parent.ChartOneClick?.syncHost();}
 window.OneClickPanel={toggle(){setOpen(!opened);},get opened(){return opened;}};
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
