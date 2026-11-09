'use strict';
// Only newly closed candles can notify. Loading history or enabling the indicator seeds a baseline.
const SignalMonitor={
 create(){return {context:null,lastClosed:0,seen:new Set()};},
 observe(state,snapshot){
  if(!snapshot.enabled){state.context=null;state.lastClosed=0;state.seen.clear();return [];}
  const context=snapshot.context;
  if(state.context!==context){state.context=context;state.lastClosed=snapshot.latestClosed;state.seen=new Set(snapshot.signals.map(s=>s.id));return [];}
  const previous=state.lastClosed;state.lastClosed=Math.max(previous,snapshot.latestClosed);
  const fresh=[];
  for(const signal of snapshot.signals){if(state.seen.has(signal.id))continue;state.seen.add(signal.id);if(signal.closedAt>previous&&signal.closedAt<=snapshot.latestClosed&&snapshot.now-signal.closedAt<=Math.max(snapshot.duration*2,120000))fresh.push(signal);}
  if(state.seen.size>3000)state.seen=new Set(snapshot.signals.map(s=>s.id));
  return fresh;
 }
};
