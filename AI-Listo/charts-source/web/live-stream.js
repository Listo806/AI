'use strict';
// Public SignalR JSON stream. Heartbeats alone do not establish a healthy price feed.
const LiveStream=(()=>{
 if(window.ChartEmbed){let off=null;return {start(){off?.();off=parent.ChartGridHost.subscribe(ChartEmbed.id,()=>markets[selected].symbol,tick=>onMarketTick(tick));},reload(){this.start();},fresh(symbol){return parent.ChartGridHost.fresh(symbol);},get active(){return parent.ChartGridHost.active();}};}
 const rs='\x1e';let symbols=[];
 let ws=null,timer=null,ping=null,delay=1000,generation=0,connecting=false,stopped=false;
 const ticks=new Map(),tickTimes=new Map();
 function closeCurrent(){generation++;clearInterval(ping);ping=null;connecting=false;const old=ws;ws=null;if(old){old.onclose=null;old.close();}}
 function retry(){closeCurrent();if(stopped)return;clearTimeout(timer);timer=setTimeout(connect,delay);delay=Math.min(delay*2,30000);}
 async function connect(){
  if(stopped||connecting||ws?.readyState===1)return;
  symbols=[...new Set([...markets.map(m=>m.symbol),...(window.ChartGridHost?.symbols()||[])])].map(s=>s.replace('/',''));connecting=true;const id=++generation;let authTimer;
  try{
   const r=await fetch('https://biquote.io/hubs/tick/negotiate?negotiateVersion=1',{method:'POST',credentials:'omit',signal:AbortSignal.timeout(15000)});
   if(id!==generation||stopped)return;
   if(!r.ok)throw Error('Negotiation failed');const n=await r.json();
   if(id!==generation||stopped)return;
   if(!n.connectionToken)throw Error('No connection token');
   const socket=new WebSocket('wss://biquote.io/hubs/tick?id='+encodeURIComponent(n.connectionToken));ws=socket;
   let buffer='',ready=false,lastMessage=Date.now(),lastTick=Date.now();ticks.clear();
   authTimer=setTimeout(()=>{if(id===generation)retry();},15000);
   socket.onopen=()=>{if(id===generation)socket.send(JSON.stringify({protocol:'json',version:1})+rs);};
   socket.onmessage=e=>{
    if(id!==generation)return;lastMessage=Date.now();buffer+=e.data;
    if(buffer.length>1000000){retry();return;}
    const parts=buffer.split(rs);buffer=parts.pop();
    for(const p of parts){
     if(!p)continue;let msg;try{msg=JSON.parse(p);}catch{continue;}
     if(!ready&&!msg.type){
      if(msg.error){retry();return;}ready=true;
      socket.send(JSON.stringify({type:1,invocationId:'subscribe',target:'Subscribe',arguments:[symbols]})+rs);
      ping=setInterval(()=>{
       if(id!==generation)return;
       if(Date.now()-lastMessage>30000||Date.now()-lastTick>20000){retry();return;}
       if(socket.readyState===1)socket.send(JSON.stringify({type:6})+rs);
      },5000);
     }
     if(msg.type===1&&msg.target==='ReceiveTick'){
      const tick=msg.arguments?.[0];
      if(tick&&symbols.includes(tick.symbol)&&Number(tick.bid)>0&&Number(tick.ask)>=Number(tick.bid)&&Number.isFinite(Date.parse(tick.timestamp))){const time=Date.parse(tick.timestamp);if(time>(tickTimes.get(tick.symbol)||0)){lastTick=Date.now();ticks.set(tick.symbol,lastTick);tickTimes.set(tick.symbol,time);}onMarketTick(tick);}
     }
     if(msg.type===3&&msg.invocationId==='subscribe'){
      if(msg.error){retry();return;}clearTimeout(authTimer);delay=1000;connecting=false;onStreamReady();
     }
     if(msg.type===7){retry();return;}
    }
   };
   socket.onclose=()=>{clearTimeout(authTimer);if(id===generation)retry();};
   socket.onerror=()=>{if(id===generation)retry();};
  }catch{clearTimeout(authTimer);if(id===generation)retry();}
 }
 function pause(){stopped=true;clearTimeout(timer);closeCurrent();ticks.clear();}
 function resume(){stopped=false;connect();}
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)resume();});
 window.addEventListener('pagehide',pause);window.addEventListener('pageshow',resume);window.addEventListener('online',()=>{closeCurrent();resume();});
 return {start:resume,reload(){closeCurrent();resume();},fresh(symbol){return ws?.readyState===1&&Date.now()-(ticks.get(symbol.replace('/',''))||0)<10000;},get active(){return ws?.readyState===1&&Date.now()-Math.max(0,...ticks.values())<10000;}};
})();
