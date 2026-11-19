import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
const root = process.cwd();
const dist = path.join(root, 'dist', 'charts', 'app');
const exists = async file => (await stat(file).catch(() => null))?.isFile() === true;
const fail = message => { throw new Error(`[Charts postbuild] ${message}`); };
for (const name of ['index.html', 'drawing-tools.js', 'drawing-tools.css', 'app.js', 'market-tools.js']) {
  if (!(await exists(path.join(dist, name)))) fail(`Missing dist/charts/app/${name}`);
}
const html = await readFile(path.join(dist, 'index.html'), 'utf8');
for (const name of ['drawing-tools.js', 'drawing-tools.css']) {
  if (!html.includes(name)) fail(`Published index.html does not reference ${name}`);
}
const drawing = await readFile(path.join(dist, 'drawing-tools.js'), 'utf8');
if (!drawing.includes('drawingToolsButton')) fail('Published drawing-tools.js lacks button implementation');
const scripts = await Promise.all(['app.js', 'market-tools.js'].map(name => readFile(path.join(dist, name), 'utf8')));
if (!scripts.some(s => s.includes('Day High')) || !scripts.some(s => s.includes('Day Low'))) fail('Published scripts lack Day High/Low labels');
console.log('[Charts postbuild] PASS: Drawing Tools assets, button implementation, and Day High/Low label code exist in dist/charts/app/.');
