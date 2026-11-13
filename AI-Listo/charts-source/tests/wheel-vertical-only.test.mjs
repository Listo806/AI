import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../web/app.js',import.meta.url),'utf8');
const wheel=source.split('canvas.onwheel=event=>')[1].split('canvas.ondblclick=')[0];
test('wheel still scrolls horizontally with the original direction and step',()=>{
 assert.match(wheel,/const step=Math.max\(1,Math.round\(view.count\*\.08\)\)/);
 assert.match(wheel,/view.offset\+\(wheelUnits>0\?step:-step\)/);
 assert.match(wheel,/view.offset=next;setPaneView\(pane,view\)/);
});
test('vertical bloom is restricted to the price-pane wheel event',()=>{
 assert.match(wheel,/if\(pane==='price' && Number.isFinite\(event.deltaY\) && event.deltaY!==0\)/);
 assert.match(wheel,/scale.factor=Math.max\(1,Math.min\(2.5,scale.factor\*Math.exp\(direction\*magnitude\)\)\)/);
 assert.match(wheel,/const direction=event.deltaY>0\?1:-1/);
});
test('no zoom invocation or pointer handlers in wheel',()=>{
 assert.doesNotMatch(wheel,/ChartZoom\.change|zoom\(|onpointermove|onpointerdown/);
});
test('Reset, drag, price-axis and +/- zoom remain present',()=>{
 for(const token of ["$('reset').onclick=",'canvas.onpointerdown=','canvas.onpointermove=',"if(inAxis(event))", "$('zoomIn').onclick=", "$('zoomOut').onclick="])assert.ok(source.includes(token),token);
});
test('normal height floor and expansion ceiling are finite',()=>{
 let factor=1;for(let i=0;i<30;i++)factor=Math.max(1,Math.min(2.5,factor*Math.exp(.04)));
 assert.ok(factor>1&&factor<=2.5);for(let i=0;i<200;i++)factor=Math.max(1,Math.min(2.5,factor*Math.exp(-.04)));
 assert.equal(factor,1);
});
