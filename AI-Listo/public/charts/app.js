const $=s=>document.querySelector(s);const $$=s=>[...document.querySelectorAll(s)];
const calendar={today:[['08:30','USD','Employment report','High'],['10:00','USD','Consumer sentiment','High'],['13:00','USD','Central bank speaker','Med']],tomorrow:[['All day','—','No sample releases scheduled','—']],week:[['Mon','EUR','Manufacturing PMI','Med'],['Wed','JPY','Bank of Japan announcement','High'],['Fri','USD','Employment report','High']]};
function renderEvents(day){$('#event-list').replaceChildren(...calendar[day].map(([time,currency,name,impact])=>{const row=document.createElement('div');row.className='event';const t=document.createElement('time');t.textContent=time;const body=document.createElement('div');const strong=document.createElement('strong');strong.textContent=name;const small=document.createElement('small');small.textContent=currency+' · Sample event';body.append(strong,small);const level=document.createElement('span');level.className='impact'+(impact==='Med'?' med':'');level.textContent=impact;row.append(t,body,level);return row}));}renderEvents('today');
$$('[data-day]').forEach(b=>b.onclick=()=>{$$('[data-day]').forEach(x=>x.classList.toggle('active',x===b));renderEvents(b.dataset.day)});
const panels={watch:'<small>YOUR MARKETS</small><h3>Market Watch</h3><p>Choose a market. Your four cards keep the workspace focused.</p><ul><li><button data-pick="USD/JPY">USD/JPY</button><span>Forex</span></li><li><button data-pick="GBP/JPY">GBP/JPY</button><span>Forex</span></li><li><button data-pick="Gold">Gold</button><span>Metals</span></li><li><button data-pick="Silver">Silver</button><span>Metals</span></li></ul>',indicators:'<small>BUILD YOUR VIEW</small><h3>Your indicator library.</h3><p>Fine-tune inputs and styles in the full workspace. Here is a selection of supported tools.</p><ul><li>Heisenberg Confluence <span>Core setup</span></li><li>VWAP AA <span>Anchored context</span></li><li>TRAMA <span>Adaptive average</span></li><li>Bollinger Bands <span>Volatility</span></li><li>RSI & Moving Average <span>Momentum</span></li><li>MACD · ATR · Stochastic <span>More tools</span></li></ul>',calendar:'<small>ILLUSTRATIVE SCHEDULE · UTC</small><h3>The week ahead.</h3><p>Your calendar opens without leaving the chart. Filter by currency and impact in the full workspace.</p><ul><li>Mon · EUR Manufacturing PMI <span>Medium</span></li><li>Wed · BOJ announcement <span>High</span></li><li>Fri · US employment report <span>High</span></li></ul><p style="margin-top:12px">These are sample events, not a live schedule.</p>',ai:'<small>SERVICE CONNECTION IN PROGRESS</small><h3>✦ Cortexa AI</h3><p>A focused explanation of your selected chart—not an open-ended chat.</p><ul><li>Read the current setup <span>Indicators</span></li><li>Explain timeframe alignment <span>Confluence</span></li><li>Connect upcoming events <span>Planned</span></li><li>Describe conditional scenarios <span>Context</span></li></ul><p style="margin-top:12px">The chart currently provides rule-based readings. Connected AI and calendar analysis await backend integration.</p>'};
function openPanel(name){$('#panel-content').innerHTML=panels[name];$('#tour-panel').hidden=false;$$('[data-pick]').forEach(b=>b.onclick=()=>{selectMarket(b.dataset.pick);$('#tour-panel').hidden=true});$('#tour-status').textContent='Product tour · '+({watch:'Market Watch',indicators:'Indicators',calendar:'Economic calendar',ai:'Cortexa AI'}[name]);}
$$('[data-panel]').forEach(b=>b.onclick=()=>openPanel(b.dataset.panel));$$('[data-open]').forEach(a=>a.onclick=()=>openPanel(a.dataset.open));$('#close-panel').onclick=()=>$('#tour-panel').hidden=true;
function selectMarket(name){$('#chart-symbol').textContent=name;$$('.quote').forEach(b=>b.classList.toggle('selected',b.dataset.symbol===name));$('#tour-status').textContent=name+' selected · chart illustration, not live prices';}
$$('.quote').forEach(b=>b.onclick=()=>selectMarket(b.dataset.symbol));$$('.periods button').forEach(b=>b.onclick=()=>{$$('.periods button').forEach(x=>x.classList.toggle('active',x===b));$('#chart-period').textContent=b.textContent;$('#tour-status').textContent=b.textContent+' selected · sample chart illustration';});
$('#reset').onclick=()=>{selectMarket('USD/JPY');$$('.periods button').forEach((b,i)=>b.classList.toggle('active',i===0));$('#chart-period').textContent='1m';$('#tour-panel').hidden=true;$('#tour-status').textContent='View reset · explore the controls above';};
function toggleFocus(force){const open=force??!$('.terminal').classList.contains('focused');$('.terminal').classList.toggle('focused',open);document.body.classList.toggle('focus-open',open);$('#focus').textContent=open?'↙ Exit focus':'↗ Focus mode';}$('#focus').onclick=()=>toggleFocus();document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('#tour-panel').hidden=true;toggleFocus(false)}});
$('#menu').onclick=()=>{const open=$('nav').classList.toggle('open');$('#menu').setAttribute('aria-expanded',String(open))};$$('nav a').forEach(a=>a.onclick=()=>{$('nav').classList.remove('open');$('#menu').setAttribute('aria-expanded','false')});

/* Lightweight, illustrative preview only. No market requests or changes to /charts/app. */
(()=>{
  const preview=document.querySelector('#explore');
  if(!preview)return;
  const chart=preview.querySelector('.chart-motion-layer');
  const rsi=preview.querySelector('.rsi-motion');
  const quotes=[...preview.querySelectorAll('.quote')];
  const signals=[...preview.querySelectorAll('.mtf span')];
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
  const base=[158.504,51.977,211.666,4071.378];
  const precision=[3,3,3,3];
  const initialChange=[0.149,-0.312,-1.758,5.822];
  let visible=false,raf=0,lastQuote=0,lastSignal=0,clock=0,previous=0;
  const resetMotion=()=>{chart.style.transform='';rsi.style.transform='';chart.style.willChange='auto';rsi.style.willChange='auto'};
  function updateQuotes(t){
    quotes.forEach((el,i)=>{
      const swing=Math.sin(t/6900+i*1.8)*([0.065,0.19,0.31,1.4][i]);
      const value=base[i]+swing;
      const change=initialChange[i]+Math.sin(t/5500+i*2.1)*([0.21,0.43,1.94,7.2][i]);
      const pct=change/base[i]*100;
      el.querySelector('strong').textContent=value.toLocaleString('en-US',{minimumFractionDigits:precision[i],maximumFractionDigits:precision[i]});
      const label=el.querySelector('em');
      label.textContent=(change>=0?'+':'')+change.toFixed(3)+' ('+(pct>=0?'+':'')+pct.toFixed(2)+'%)';
      label.classList.toggle('sample-up',change>=0);
      label.classList.toggle('sample-down',change<0);
    });
  }
  function updateSignals(t){
    signals.forEach((el,i)=>{
      const bearish=Math.sin(t/13500+i*1.25+0.6)<-0.14;
      el.classList.toggle('bear',bearish);
      const label=el.querySelector('b');
      if(label)label.textContent=bearish?'Bearish':'Bullish';
    });
  }
  function tick(now){
    if(!visible||reduce.matches||document.hidden){raf=0;return}
    if(!previous)previous=now;
    clock+=Math.min(64,now-previous);previous=now;
    // Paired transforms keep RSI aligned with the same chart time window.
    const x=Math.sin(clock/8400)*0.75;
    const y=Math.sin(clock/11500+0.7)*0.45;
    chart.style.transform=`translate3d(${x}%,${y}%,0)`;
    rsi.style.transform=`translate3d(${x}%,0,0)`;
    if(clock-lastQuote>=3500){updateQuotes(clock);lastQuote=clock}
    if(clock-lastSignal>=7200){updateSignals(clock);lastSignal=clock}
    raf=requestAnimationFrame(tick);
  }
  function sync(){
    const play=visible&&!reduce.matches&&!document.hidden;
    if(!play){if(raf)cancelAnimationFrame(raf);raf=0;previous=0;resetMotion();return}
    chart.style.willChange='transform';rsi.style.willChange='transform';
    if(!raf)raf=requestAnimationFrame(tick);
  }
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync()},{threshold:0.08});
  observer.observe(preview);
  reduce.addEventListener?.('change',sync);
  document.addEventListener('visibilitychange',sync);
})();
