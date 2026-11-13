import assert from 'node:assert/strict';
import fs from 'node:fs';
const src=fs.readFileSync(new URL('../web/app.js',import.meta.url),'utf8');
const wheel=src.slice(src.indexOf('canvas.onwheel='),src.indexOf('canvas.ondblclick='));
assert.match(wheel,/view\.offset\+\(wheelUnits>0\?step:-step\)/);
assert.match(wheel,/const intoHistory=next>previousOffset/);
assert.match(wheel,/oldSpan\*Math\.exp\(-amount\)/);
assert.match(wheel,/Math\.min\(normalSpan,oldSpan\*Math\.exp\(amount\)\)/);
assert.match(wheel,/scale\.factor=Math\.max\(1,Math\.min\(12,/);
assert.ok(!wheel.includes('zoom('));
assert.match(src,/canvas\.onpointerdown=event/);
assert.match(src,/window\.ChartZoom=\{change/);
assert.match(src,/\$\('reset'\)\.onclick/);
function simulate(normalSpan,oldSpan,older){const amount=.1;const target=older?oldSpan*Math.exp(-amount):Math.min(normalSpan,oldSpan*Math.exp(amount));const factor=Math.max(1,Math.min(12,normalSpan/Math.max(normalSpan/12,target)));return normalSpan/factor;}
assert.ok(simulate(140,100,true)<100,'first backward tick must bloom despite higher volatility');
assert.ok(simulate(100,70,false)>70,'forward tick must close');
assert.equal(simulate(100,110,false),100,'forward never contracts below normal');
console.log('Immediate wheel bloom and preserved controls: PASS');
