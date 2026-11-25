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
 // Both buttons share the direction of the market midpoint, not their bid/ask spread.
 let previousMidpoint=null;
 let marketDirection=0;
 function syncPrices(){
  const quote=window.CortexaOneClickQuote?.();
  const bid=Number(quote?.bid),ask=Number(quote?.ask);
  if(Number.isFinite(bid)&&Number.isFinite(ask)&&bid>0&&ask>0){
   const midpoint=(bid+ask)/2;
   if(previousMidpoint!==null){
    const delta=midpoint-previousMidpoint;
    if(Math.abs(delta)>1e-10)marketDirection=delta>0?1:-1;
   }
   previousMidpoint=midpoint;
  }
  panel.classList.toggle('cx-market-up',marketDirection>0);
  panel.classList.toggle('cx-market-down',marketDirection<0);
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
 // Draft order details: intentionally never submit without a verified broker adapter.
 const orderDetails=make('section','cx-order-draft');orderDetails.hidden=true;
 const orderHeading=make('div','cx-order-draft-heading');
 const orderTitle=make('strong','','Order details');
 const orderClose=make('button','','×');orderClose.type='button';orderClose.setAttribute('aria-label','Close order details');
 orderHeading.append(orderTitle,orderClose);
 const orderSide=make('select','cx-order-side');orderSide.setAttribute('aria-label','Order direction');
 for(const name of ['BUY','SELL']){const option=make('option','',name);option.value=name;orderSide.append(option);}
 const orderType=make('select','cx-order-type');orderType.setAttribute('aria-label','Order type');
 for(const [value,name] of [['market','Market'],['buy-limit','Buy Limit'],['sell-limit','Sell Limit'],['buy-stop','Buy Stop'],['sell-stop','Sell Stop']]){const option=make('option','',name);option.value=value;orderType.append(option);}
 const entryLabel=make('label','cx-order-entry','Entry price');const entryInput=make('input');entryInput.type='number';entryInput.step='any';entryInput.inputMode='decimal';entryLabel.append(entryInput);
 const expand=make('button','cx-order-expand');expand.type='button';expand.setAttribute('aria-expanded','false');
 const expandLabel=make('span','','Add Stop Loss / Take Profit');const summary=make('small','');const arrow=make('span','','▾');expand.append(expandLabel,summary,arrow);
 const levels=make('div','cx-order-levels');levels.hidden=true;
 const levelInputs={};const levelErrors={};
 for(const [key,title] of [['sl','Stop Loss'],['tp','Take Profit']]){
  const field=make('div','cx-order-field');const label=make('label','',title);const controls=make('div','cx-order-price-controls');
  const decrease=make('button','','−'),increase=make('button','','+'),value=make('input');
  value.type='number';value.step='any';value.inputMode='decimal';value.placeholder='Optional';value.setAttribute('aria-label',title);
  for(const b of [decrease,increase])b.type='button';
  const change=delta=>{const q=window.CortexaOneClickQuote?.();const digits=Number.isInteger(q?.digits)?q.digits:5;const step=10**-digits;const base=Number(value.value)||Number(q?.bid)||0;value.value=(base+delta*step).toFixed(digits);validate();};
  decrease.onclick=()=>change(-1);increase.onclick=()=>change(1);
  controls.append(decrease,value,increase);label.append(controls);
  const error=make('small','cx-order-error');error.setAttribute('role','status');field.append(label,error);levels.append(field);
  levelInputs[key]=value;levelErrors[key]=error;value.addEventListener('input',validate);
 }
 const notice=make('p','cx-order-disconnected','Broker connection unavailable. Order details are local drafts only; no order can be submitted.');
 const submit=make('button','cx-order-submit','Place order');submit.type='button';submit.disabled=true;submit.title='Broker connection is not configured';
 orderDetails.append(orderHeading,orderSide,orderType,entryLabel,expand,levels,notice,submit);
 function validate(){
  const q=window.CortexaOneClickQuote?.();const side=orderSide.value;
  const market=side==='BUY'?Number(q?.ask):Number(q?.bid);
  const entry=orderType.value==='market'?market:Number(entryInput.value);
  const type=orderType.value;
  const entryError=orderDetails.querySelector('.cx-order-entry-error');
  let valid=Number.isFinite(entry)&&entry>0;
  if(type!=='market'&&Number.isFinite(market)&&market>0&&valid){
   const expectedBelow=type.endsWith('limit')?side==='BUY':side==='SELL';
   if(expectedBelow?entry>=market:entry<=market)valid=false;
  }
  entryError.textContent=valid?'':type==='market'?'Live quote unavailable.':'Enter a valid entry price on the correct side of market.';
  for(const [key,value] of Object.entries(levelInputs)){
   const raw=value.value.trim();let error='';
   if(raw){const price=Number(raw);if(!Number.isFinite(price)||price<=0)error='Enter a positive price.';
    else if(!valid)error='Set a valid entry price first.';
    else if(key==='sl'?(side==='BUY'?price>=entry:price<=entry):(side==='BUY'?price<=entry:price>=entry))error=key==='sl'?'Stop Loss must be on the loss side of entry.':'Take Profit must be on the profit side of entry.';
   }
   levelErrors[key].textContent=error;
  }
  const entries=Object.entries(levelInputs).filter(([,v])=>v.value.trim()).map(([k,v])=>k.toUpperCase()+': '+v.value.trim());
  summary.textContent=levels.hidden&&entries.length?entries.join(' · '):'';
  // A broker adapter must additionally validate tick size, stop distance and order permissions.
  submit.disabled=true;
 }
 const entryError=make('small','cx-order-error cx-order-entry-error');entryLabel.append(entryError);
 expand.onclick=()=>{levels.hidden=!levels.hidden;expand.setAttribute('aria-expanded',String(!levels.hidden));arrow.textContent=levels.hidden?'▾':'▴';validate();};
 orderSide.onchange=()=>{const side=orderSide.value;orderType.value=side==='BUY'?'buy-limit':'sell-limit';validate();};
 orderType.onchange=()=>{orderSide.value=orderType.value.startsWith('buy')?'BUY':orderType.value.startsWith('sell')?'SELL':orderSide.value;entryLabel.hidden=orderType.value==='market';validate();};
 entryInput.addEventListener('input',validate);entryLabel.hidden=true;
 orderClose.onclick=()=>{orderDetails.hidden=true;};
 const detailsToggle=make('button','cx-order-details-toggle','Order details');detailsToggle.type='button';detailsToggle.onclick=()=>{orderDetails.hidden=!orderDetails.hidden;if(!orderDetails.hidden){orderType.onchange();validate();}};
 panel.append(detailsToggle,orderDetails);
 window.CortexaOrderDraft={getValues:()=>({side:orderSide.value,type:orderType.value,volume:Number(input.value),entry:orderType.value==='market'?null:(entryInput.value.trim()?Number(entryInput.value):null),stopLoss:levelInputs.sl.value.trim()?Number(levelInputs.sl.value):null,takeProfit:levelInputs.tp.value.trim()?Number(levelInputs.tp.value):null}),validate};
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
