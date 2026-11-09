import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../worker/verified-evidence.js',import.meta.url),'utf8');
const now=Date.now();const minute=60000;const base=Math.floor((now-6500000)/minute)*minute;
const values=Array.from({length:110},(_,i)=>({date:new Date(base+i*minute).toISOString(),open:100+i*.1,high:101+i*.1,low:99+i*.1,close:100+i*.1,volume:100,isOpen:false}));
const context={Response,URL,URLSearchParams,Date,Number,Math,Error,Heisenberg:{durations:{'1min':minute}},candleResponse:async()=>Response.json({provider:'biquote',symbol:'EUR/USD',interval:'1min',fetchedAt:Date.now(),volumeType:'tick',values})};
vm.createContext(context);vm.runInContext(source+'\nthis.verify=verifiedChartEvidence',context);
const evidence=await context.verify({symbol:'EUR/USD',frame:'1min',capturedAt:now,mtf:{'1min':'Bullish'}});
assert.equal(evidence.provenance,'server_fetched_biquote_closed_candles');
assert.ok(evidence.candles.length>=30);
assert.equal(evidence.mtf['1min'],'Unavailable');
assert.ok(evidence.indicators.some(i=>i.name==='RSI'&&Number.isFinite(i.value)));
assert.ok(!evidence.indicators.some(i=>i.name==='Heisenberg Confluence'));
console.log('Server-owned candle evidence, indicators and unverified MTF exclusion passed.');

const original=context.candleResponse;
for(const bad of [
 values.map((b,i)=>i===5?{...b,high:0}:b),
 values.map((b,i)=>i===5?{...b,date:values[4].date}:b),
 values.map((b,i)=>i===5?{...b,volume:-1}:b),
]){context.candleResponse=async()=>Response.json({provider:'biquote',symbol:'EUR/USD',interval:'1min',fetchedAt:Date.now(),values:bad});await assert.rejects(()=>context.verify({symbol:'EUR/USD',frame:'1min',capturedAt:Date.now(),mtf:{}}));}
context.candleResponse=original;
console.log('Rejected malformed OHLC, duplicated timestamps and negative volume.');
