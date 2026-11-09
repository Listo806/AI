import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const ctx=vm.createContext({module:{exports:{}},Date,Set,Map});vm.runInContext(fs.readFileSync('web/indicators.js','utf8')+'\n'+fs.readFileSync('web/chart-studies.js','utf8'),ctx);const S=ctx.module.exports;
const bar=(close,i,span=1)=>({time:Date.UTC(2026,0,1)+i*3600000,date:new Date(Date.UTC(2026,0,1)+i*3600000).toISOString(),open:close,close,high:close+span,low:close-span,volume:10});
const flat=Array.from({length:100},(_,i)=>bar(100,i));const trend=Array.from({length:100},(_,i)=>bar(i+100,i));
const k=S.compute('keltner',flat,{length:20,atrLength:10,factor:2});assert.equal(k.lines[0].values.at(-1),100);assert.equal(k.lines[1].values.at(-1),104);assert.equal(k.lines[2].values.at(-1),96);assert.equal(k.lines[1].values[8],null);
const h=S.compute('hma',trend,{length:9});assert.ok(Math.abs(h.lines[0].values.at(-1)-199)<1e-9);assert.equal(h.lines[0].values[8],null);
const adx=S.compute('adx',trend,{length:14,smoothing:14});assert.equal(adx.lines[0].values[26],null);assert.equal(adx.lines[0].values[27],100);assert.equal(adx.lines[1].values.at(-1),50);assert.equal(adx.lines[2].values.at(-1),0);assert.equal(S.compute('adx',flat,{length:14,smoothing:14}).lines[0].values.at(-1),0);
const sr=S.compute('stochrsi',[1,2,1,2,1,2].map((v,i)=>bar(v,i,.1)),{length:2,stochLength:2,k:1,d:2});assert.equal(sr.lines[0].values.at(-1),100);assert.equal(sr.lines[1].values.at(-1),50);assert.ok(S.compute('stochrsi',flat,{length:14,stochLength:14,k:3,d:3}).lines[0].values.every(v=>v===null));
const st=S.compute('supertrend',[10,10,10,14,16,8].map((v,i)=>bar(v,i)),{length:3,factor:1});assert.equal(st.lines[1].values[2],12);assert.ok(Number.isFinite(st.lines[0].values[3]));assert.ok(Number.isFinite(st.lines[1].values[5]));
const prior={...bar(10,0),time:Date.UTC(2026,0,1),high:12,low:8},today={...bar(20,1),time:Date.UTC(2026,0,2),high:999,low:1};const p=S.compute('pivots',[today],{anchor:'day'},'1h',[prior,today]);assert.equal(p.lines[0].values[0],10);assert.equal(p.lines[1].values[0],12);assert.equal(p.lines[3].values[0],16);assert.equal(p.lines[6].values[0],4);
// Extending history must not revise earlier indicator values (no look-ahead).
for(const key of ['hma','keltner','supertrend','adx','stochrsi']){const params={length:9,...S.defaults[key]},short=S.compute(key,trend.slice(0,60),params),long=S.compute(key,trend,params);short.lines.forEach((l,i)=>assert.deepEqual(Array.from(l.values),Array.from(long.lines[i].values.slice(0,60)),key));}
assert.equal(S.options('supertrend',{factor:-1}).factor,3);assert.equal(S.options('stochrsi',{k:2.5}).k,3);
console.log('Six studies: reference fixtures, warm-up, flat markets, settings validation, pivot causality, and no-look-ahead checks passed.');
