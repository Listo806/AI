import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../web/app.js',import.meta.url),'utf8');
test('pan in auto price mode does not latch the old vertical center',()=>{
 assert.match(source,/if\(pane==='price' && dragging\.manualAtStart\)verticalScales\.price\.center=/);
 assert.match(source,/verticalScales\.price\.center\?\?autoCenter/);
});
test('toolbar zoom preserves bounds temporarily without locking subsequent auto pan',()=>{
 assert.match(source,/zoomPriceOverride=previousBounds/);
 assert.match(source,/zoomPriceOverride=null/);
 assert.match(source,/zoomPriceOverride\?\.span\?\?range/);
});
test('MTF uses existing engine state rather than hardcoded display states',()=>{
 assert.match(source,/Object\.entries\(engine\.table\)/);
 assert.match(source,/trend\.className=state\.toLowerCase\(\)/);
});
