import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../web/chart-layout-bootstrap.js',import.meta.url),'utf8');
const store=new Map(),storage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
let requests=0;
const sandbox={localStorage:storage,URL,URLSearchParams,Response,AbortSignal,setTimeout,clearTimeout,queueMicrotask,Date,console};
sandbox.window=sandbox;sandbox.parent=sandbox;sandbox.location={href:'https://charts.test/',origin:'https://charts.test',search:''};sandbox.fetch=async()=>{requests++;return new Response('{"bars":[1]}',{headers:{'content-type':'application/json'}});};
vm.createContext(sandbox);vm.runInContext(source,sandbox);
const [a,b]=await Promise.all([sandbox.ChartGridHost.request('https://biquote.io/api/ohlc?same'),sandbox.ChartGridHost.request('https://biquote.io/api/ohlc?same')]);assert.equal(requests,1,'matching concurrent chart history requests share one network request');assert.equal(a.body,b.body);
let usd=0,eur=0;const off=sandbox.ChartGridHost.subscribe('0',()=> 'USD/JPY',()=>usd++);sandbox.ChartGridHost.subscribe('1',()=> 'EUR/USD',()=>eur++);sandbox.ChartGridHost.emitTick({symbol:'USDJPY',timestamp:new Date().toISOString()});assert.equal(usd,1);assert.equal(eur,0,'ticks only reach the matching symbol');off();sandbox.ChartGridHost.emitTick({symbol:'USDJPY'});assert.equal(usd,1,'removed charts unsubscribe');
function child(id){const c={...sandbox,ChartGridHost:undefined,parent:sandbox,location:{href:'https://charts.test/?embed=chart&pane='+id,origin:'https://charts.test',search:'?embed=chart&pane='+id},document:{documentElement:{classList:{add(){}}}}};c.window=c;vm.createContext(c);vm.runInContext(source,c);return c;}
const one=child(0),two=child(1);vm.runInContext("ChartStorage.setItem('indicator','ATR')",one);vm.runInContext("ChartStorage.setItem('indicator','RSI')",two);assert.equal(vm.runInContext("ChartStorage.getItem('indicator')",one),'ATR');assert.equal(vm.runInContext("ChartStorage.getItem('indicator')",two),'RSI');assert.equal(storage.getItem('indicator'),null,'panel changes do not overwrite the single chart');
console.log('Chart layout: shared history, routed ticks, unsubscribe, and independent settings passed.');
