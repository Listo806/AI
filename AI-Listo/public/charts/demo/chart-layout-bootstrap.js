'use strict';
// Each embedded chart keeps its settings separate. The host retains all existing preferences.
window.ChartEmbed=null;
if(window.parent!==window){
 const params=new URLSearchParams(location.search),id=params.get('pane');
 if(params.get('embed')==='chart'&&/^\d{1,2}$/.test(id||'')){
  try{if(parent.location.origin===location.origin&&parent.ChartGridHost)window.ChartEmbed={id,symbol:params.get('symbol')||'USD/JPY',frame:params.get('frame')||'1min',style:params.get('style')==='line'?'line':'candles'};}catch{}
 }
}
const ChartStorage={getItem(key){try{return localStorage.getItem((ChartEmbed&&key!=='market-history-biquote-v1'?'chart-pane-'+ChartEmbed.id+':':'')+key);}catch{return null;}},setItem(key,value){try{localStorage.setItem((ChartEmbed&&key!=='market-history-biquote-v1'?'chart-pane-'+ChartEmbed.id+':':'')+key,value);}catch{}},removeItem(key){try{localStorage.removeItem((ChartEmbed&&key!=='market-history-biquote-v1'?'chart-pane-'+ChartEmbed.id+':':'')+key);}catch{}}};
if(ChartEmbed)document.documentElement.classList.add('chart-embedded');
else{
 window.ChartGridHost={request:async()=>{throw Error('Demo: external requests disabled');},symbols:()=>[],subscribe:()=>()=>{},remove(){},emitTick(){},fresh:()=>false,active:()=>false};
}
if(ChartEmbed){
 window.fetch=()=>Promise.reject(Error('Demo: network disabled'));
}
