'use strict';
/* Offline deterministic demonstration data. No credentials, accounts or network. */
window.CORTEXA_DEMO=true;
window.CortexaDemoData=(()=>{
 const durations={'1min':60000,'5min':300000,'15min':900000,'30min':1800000,'1h':3600000,'2h':7200000,'4h':14400000,'1day':86400000,'1week':604800000,'1month':2592000000};
 const seeds={'USD/JPY':159.52,'GBP/USD':1.271,'EUR/USD':1.088,'XAU/USD':3876,'XAG/USD':47.7,'BTC/USD':95000,'ETH/USD':3300,'SPX500':7537,'NAS100':27749,'US30':52335,'WTI':86.9,'NGAS':100};
 const hash=str=>{let h=2166136261;for(const c of str){h=Math.imul(h^c.charCodeAt(0),16777619);}return h>>>0;};
 const random=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 function candles(symbol,interval,count=600){
  const ms=durations[interval]||60000,now=Math.floor(Date.now()/ms)*ms;
  const seed=hash(symbol+'|'+interval+'|'+Math.floor(now/ms)),rng=random(seed);
  const initial=seeds[symbol]||(/^BTC|^ETH/.test(symbol)?80000:/JPY/.test(symbol)?155:/XAU/.test(symbol)?3800:/XAG/.test(symbol)?45:/USD|EUR|GBP/.test(symbol)?1.2:100);
  const scale=/JPY/.test(symbol)?.0008:/BTC|ETH/.test(symbol)?.005:/XAU|XAG/.test(symbol)?.002:.0015;
  let price=initial*(1+(rng()-.5)*.02);const rows=[];
  for(let i=0;i<count;i++){
   const open=price;const drift=Math.sin((i+seed%100)/36)*scale*.5+(rng()-.5)*scale*2;
   const close=Math.max(initial*.2,open*(1+drift));
   const spread=open*scale*(.25+rng()*.8);
   const high=Math.max(open,close)+spread*rng(),low=Math.max(.00001,Math.min(open,close)-spread*rng());
   const time=now-(count-1-i)*ms;
   rows.push({time,date:new Date(time).toISOString(),open,high,low,close,volume:Math.floor(200+rng()*1200)});
   price=close;
  }
  return rows;
 }
 function updateCards(){
  document.querySelectorAll('#markets .market-card').forEach((card,i)=>{
    const symbol=(window.MarketCatalog||[])[i]?.symbol||card.querySelector('.market-name')?.textContent||'USD/JPY';
    const bars=candles(symbol,'1min',8),price=bars.at(-1).close,previous=bars.at(-2).close;
    const priceEl=card.querySelector('.market-price'),detail=card.querySelector('.market-quote-status');
    if(priceEl)priceEl.textContent=price.toLocaleString('en-US',{maximumFractionDigits:price>1000?2:price>100?3:5});
    if(detail){const change=(price-previous)/previous*100;detail.textContent=`${change>=0?'+':''}${change.toFixed(2)}% · SIMULATED`;}
  });
 }
 document.addEventListener('DOMContentLoaded',()=>{setTimeout(updateCards,400);setInterval(updateCards,6000);});
 return {candles,durations};
})();
