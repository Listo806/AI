import { cp, mkdir, readFile, rm, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const source = path.join(root, 'charts-source', 'web');
const target = path.join(root, 'public', 'charts', 'app');
const required = ['index.html', 'drawing-tools.js', 'drawing-tools.css', 'app.js', 'market-tools.js'];
const exists = async file => (await stat(file).catch(() => null))?.isFile() === true;
const fail = message => { throw new Error(`[Charts prebuild] ${message}`); };

for (const name of required) {
  if (!(await exists(path.join(source, name)))) fail(`Missing source: charts-source/web/${name}`);
}
const html = await readFile(path.join(source, 'index.html'), 'utf8');
for (const name of ['drawing-tools.js', 'drawing-tools.css']) {
  if (!html.includes(name)) fail(`charts-source/web/index.html does not reference ${name}`);
}
const drawing = await readFile(path.join(source, 'drawing-tools.js'), 'utf8');
if (!drawing.includes('drawingToolsButton') || !drawing.includes('Drawing Tools')) {
  fail('drawing-tools.js does not contain the Drawing Tools button implementation');
}
// The daily level labels are painted by chart JavaScript, not necessarily HTML elements.
const chartScripts = await Promise.all(['app.js', 'market-tools.js'].map(name => readFile(path.join(source, name), 'utf8')));
if (!chartScripts.some(code => /Day High/.test(code)) || !chartScripts.some(code => /Day Low/.test(code))) {
  fail('Source chart scripts do not contain both Day High and Day Low label logic');
}
// Remove stale assets from prior builds so the output reflects only the selected source.
await rm(target, { recursive: true, force: true });
await mkdir(path.dirname(target), { recursive: true });
await cp(source, target, { recursive: true });
for (const name of required) {
  if (!(await exists(path.join(target, name)))) fail(`Copy failed for ${name}`);
}
console.log('[Charts prebuild] Drawing Tools and Day High/Low source checks passed; copied charts-source/web to public/charts/app.');
