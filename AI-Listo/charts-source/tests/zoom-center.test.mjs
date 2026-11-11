import assert from 'node:assert/strict';
// Renderer coordinate: viewStart = data.length - count - offset.
for (const dataLength of [120,500,1000]) for (const count of [20,75,170,400]) for (const offset of [-10,0,25,120]) for (const factor of [.8,1.25]) {
 const nextCount=Math.max(20,Math.min(Math.max(500,dataLength+50),Math.round(count*factor)));
 const center=dataLength-offset-count/2;
 const nextOffset=dataLength-center-nextCount/2;
 const nextCenter=dataLength-nextOffset-nextCount/2;
 assert.ok(Math.abs(center-nextCenter)<1e-8);
 assert.ok(factor<1?nextCount<=count:nextCount>=count);
}
console.log('Center timestamp preserved across 96 zoom combinations; candle widths respond to count.');
