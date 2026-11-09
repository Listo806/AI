import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const context=vm.createContext({module:{exports:{}},Date,Set,Map,Heisenberg:{durations:{'1min':60000}}});
for(const file of ['indicators.js','chart-studies.js','metatrader-studies.js'])vm.runInContext(fs.readFileSync('web/'+file,'utf8'),context);const S=context.module.exports;
const bars=Array.from({length:130},(_,i)=>({time:Date.UTC(2020,0,1)+i*60000,open:100+i*.1+Math.sin(i)*.2,close:100+i*.1+Math.cos(i)*.4,high:102+i*.1+Math.sin(i)*.2,low:98+i*.1+Math.sin(i)*.2,volume:20+i%7}));
const flat=bars.map(b=>({...b,open:100,close:100,high:102,low:98,volume:10}));
assert.equal(S.catalog.length,22);assert.equal(new Set(S.catalog.map(d=>d[0])).size,22);
for(const [key,,period,,,lower]of S.catalog){const params={length:period,...S.defaults[key]},result=S.compute(key,bars,params);assert.ok(result.lines.length,key);assert.equal(S.lower.has(key),lower,key);for(const l of result.lines){assert.ok(l.values.length>=bars.length,key);assert.ok(l.values.every(v=>v===null||Number.isFinite(v)),key);}
 if(key!=='fractals'&&key!=='ichimoku'){const shorter=S.compute(key,bars.slice(0,100),params);shorter.lines.forEach((l,i)=>assert.deepEqual(Array.from(l.values.slice(0,100)),Array.from(result.lines[i].values.slice(0,100)),key+' causality'));}
}
const last=(k,data=flat,p={length:14,...S.defaults[k]})=>S.compute(k,data,p).lines[0].values.at(-1);
assert.equal(last('stddev'),0);assert.equal(last('cci'),0);assert.equal(last('momentum'),100);assert.equal(last('demarker'),.5);assert.equal(last('wpr'),-50);assert.equal(last('mfi'),50);assert.equal(last('ad'),0);assert.equal(last('obv'),10);assert.equal(last('force'),0);assert.equal(last('rvi'),0);assert.equal(last('ao',flat,{length:5,slow:34}),0);assert.equal(last('ac',flat,{length:5,fast:5,slow:34}),0);assert.equal(last('osma'),0);assert.equal(last('bwmfi'),.4);
const env=S.compute('envelopes',flat,{length:14,deviation:1,method:'SMA'});assert.equal(env.lines[0].values.at(-1),101);assert.equal(env.lines[1].values.at(-1),99);
const gap=bars.map(b=>({...b,volume:null}));for(const key of ['ad','mfi','obv','force','bwmfi'])assert.ok(S.compute(key,gap,{length:14,...S.defaults[key]}).lines.every(l=>l.values.every(v=>v===null)),key+' missing volume');
const zero=flat.map(b=>({...b,high:100,low:100,volume:0}));for(const [key,,period]of S.catalog){const r=S.compute(key,zero,{length:period,...S.defaults[key]});assert.ok(r.lines.every(l=>l.values.every(v=>v===null||Number.isFinite(v))),key+' zero-range');}
const f=[1,2,5,2,1].map((v,i)=>({...bars[i],high:v+10,low:5-v}));const short=S.compute('fractals',f.slice(0,4)),full=S.compute('fractals',f);assert.equal(short.lines[0].values[2],null);assert.equal(full.lines[0].values[2],15);assert.equal(full.lines[1].values[2],0);
const ichi=S.compute('ichimoku',flat,{length:9,kijun:26,spanB:52});assert.equal(ichi.lines[2].values[50],null);assert.equal(ichi.lines[2].values[51],100);assert.equal(ichi.lines[3].values[77],100);assert.equal(ichi.lines[4].values[0],100);
console.log('22 studies: known flat/zero fixtures, missing volume, causal prefixes, confirmed fractals and Ichimoku displacement passed.');
