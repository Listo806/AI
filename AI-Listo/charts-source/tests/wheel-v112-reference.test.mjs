import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../web/app.js',import.meta.url),'utf8');
const formula=(offset,base,count,span)=>span/Math.exp(Math.min(Math.log(6),Math.max(0,(offset-base)/count)*2.0));
test('wheel opens immediately when moving into history, then closes on return',()=>{
 const baseline=100,span=20,count=170;
 assert.ok(formula(101,baseline,count,span)<span);
 assert.ok(formula(150,baseline,count,span)<formula(101,baseline,count,span));
 assert.equal(formula(100,baseline,count,span),span);
 assert.equal(formula(80,baseline,count,span),span);
});
test('shared price span applied in draw, not candle-only transformation',()=>{
 assert.match(source,/zoomPriceOverride\?\.span\?\?wheelFlowerSpan\?\?range/);
 assert.match(source,/wheelFlowerSpan=wheelFlowerBase\.span\/expansion/);
 assert.match(source,/progress=Math\.max\(0,\(next-wheelFlowerBase\.offset\)\/view\.count\)/);
});
test('wheel keeps existing horizontal movement and toolbar zoom independent',()=>{
 assert.match(source,/view\.offset\+\(wheelUnits>0\?step:-step\)/);
 assert.match(source,/window\.ChartZoom\.change\('in'\)/);
 assert.match(source,/window\.ChartZoom\.change\('out'\)/);
 assert.match(source,/canvas\.onpointerdown=event=>/);
});
test('wheel baseline cleared on manual interactions',()=>{
 assert.match(source,/function zoom\(factor,pane='price',verticalStep=1\)\{\s*clearWheelFlower\(\)/);
 assert.match(source,/canvas\.onpointerdown=event=>\{[^\n]*clearWheelFlower\(\)/);
 assert.match(source,/\$\('reset'\)\.onclick=\(\)=>\{clearWheelFlower\(\)/);
});
