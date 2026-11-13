import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../web/app.js',import.meta.url),'utf8');
const span=(next,base,count,original)=>original/Math.exp(Math.min(Math.log(6),Math.max(0,(base-next)/count)*2));
test('reverse vertical expansion direction',()=>{
 assert.ok(span(99,100,170,20)<20);
 assert.ok(span(50,100,170,20)<span(99,100,170,20));
 assert.equal(span(100,100,170,20),20);
 assert.equal(span(120,100,170,20),20);
});
test('horizontal scrolling and other controls remain unchanged',()=>{
 assert.match(source,/view\.offset\+\(wheelUnits>0\?step:-step\)/);
 assert.match(source,/const progress=Math\.max\(0,\(wheelFlowerBase\.offset-next\)\/view\.count\)/);
 assert.match(source,/window\.ChartZoom\.change\('in'\)/);
 assert.match(source,/window\.ChartZoom\.change\('out'\)/);
 assert.match(source,/canvas\.onpointerdown=event=>/);
});
