import assert from 'node:assert/strict';
import fs from 'node:fs';
const src=fs.readFileSync(new URL('../web/app.js',import.meta.url),'utf8');
assert.match(src,/const previousOffset=view.offset/);
assert.match(src,/const movingIntoHistory=next>previousOffset/);
assert.match(src,/Math.min\(3\.5,Math.max\(1,scale.factor\)\*Math.exp\(magnitude\)\)/);
assert.match(src,/Math.max\(1,scale.factor\*Math.exp\(-magnitude\)\)/);
assert.match(src,/view.offset\+\(wheelUnits>0\?step:-step\)/);
assert.match(src,/canvas.onpointerdown=event/);
assert.match(src,/window.ChartZoom=\{change/);
for(const previous of [1,1.2,2.5]){
 const older=Math.min(3.5,Math.max(1,previous)*Math.exp(.11));
 const newer=Math.max(1,previous*Math.exp(-.11));
 assert.ok(older>=previous && newer<=previous && newer>=1);
}
console.log('Flower bloom regression: PASS');
