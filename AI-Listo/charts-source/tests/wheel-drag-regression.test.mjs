import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../web/app.js',import.meta.url),'utf8');
test('wheel moves time window rather than calling zoom',()=>{
 const block=source.split('canvas.onwheel=event=>')[1].split('canvas.ondblclick=')[0];
 assert.match(block,/view\.offset=next/);
 assert.match(block,/setPaneView\(pane,view\)/);
 assert.doesNotMatch(block,/ChartZoom\.change|zoom\(/);
});
test('price autoscale is based on visible candles',()=>{
 assert.match(source,/visible\.flatMap\(b=>\[b\.low,b\.high\]\)/);
 assert.match(source,/verticalScales\.price\.center\?\?autoCenter/);
});
test('pointer drag can adjust price vertically immediately',()=>{
 assert.match(source,/Math\.abs\(event\.clientY-dragging\.y\)>3/);
 assert.match(source,/verticalScales\.price\.center=dragging\.center/);
});
