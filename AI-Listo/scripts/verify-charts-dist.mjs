import {readFile,stat} from 'node:fs/promises';
const root=process.cwd();
for(const name of ['index.html','market-tools.js','drawing-tools.js','drawing-tools.css','app.js']){
 const p=`${root}/dist/charts/app/${name}`;
 try{if(!(await stat(p)).isFile())throw Error('not file');}catch{throw Error(`Charts deployment missing: ${p}`);}
}
const html=await readFile(`${root}/dist/charts/app/index.html`,'utf8');
const market=await readFile(`${root}/dist/charts/app/market-tools.js`,'utf8');
const drawing=await readFile(`${root}/dist/charts/app/drawing-tools.js`,'utf8');
const app=await readFile(`${root}/dist/charts/app/app.js`,'utf8');
if(!html.includes('20261119-toolbar22')||!market.includes('drawingToolsButton')||!drawing.includes('Drawing tools')||!app.includes('Day High · UTC'))throw Error('Stale chart assets: abort deploy');
console.log('Verified Charts toolbar and day-level assets in dist.');
