import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../web/app.js',import.meta.url),'utf8');
const helper=source.slice(source.indexOf('function crosshairTimeLabel('),source.indexOf('function drawCrosshair('));
const context=vm.createContext({});vm.runInContext(helper,context);
const label=context.crosshairTimeLabel;
const data=Array.from({length:100},(_,i)=>({time:Date.UTC(2026,10,6,9,i)}));
const view={count:20,offset:0},width=1093;
assert.equal(label(data,view,15,width),'Nov 6, 2026 · 10:20 UTC');
assert.equal(label(data,view,540,width),'Nov 6, 2026 · 10:30 UTC');
assert.equal(label(data,{count:20,offset:40},15,width),'Nov 6, 2026 · 09:40 UTC');
assert.equal(label(data,{count:40,offset:0},540,width),'Nov 6, 2026 · 10:20 UTC');
assert.equal(label(data,{count:20,offset:-10},790,width),''); // empty future area
assert.equal(label(data,{count:200,offset:0},15,width),''); // before loaded history
assert.equal(label([],view,15,width),'');
assert.equal(label(data,view,14,width),'');
assert.equal(label([{time:NaN}],{count:1,offset:0},15,width),'');
assert.equal(label([{time:Date.UTC(2027,0,1,0,5)}],{count:1,offset:0},15,width),'Jan 1, 2027 · 00:05 UTC');
console.log('Crosshair timestamps: candle alignment, independent pane views, blank space and UTC boundaries passed.');
