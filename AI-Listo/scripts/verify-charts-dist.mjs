import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const dir = path.join(root, 'dist', 'charts', 'app');
const release = '20261119-release29';
const required = ['index.html', 'drawing-tools.js', 'drawing-tools.css', 'app.js', 'market-tools.js'];
for (const name of required) {
  const file = path.join(dir, name);
  try { if (!(await stat(file)).isFile()) throw new Error('not a file'); }
  catch { throw new Error(`Charts release verification FAILED: ${file} is missing`); }
}
const html = await readFile(path.join(dir, 'index.html'), 'utf8');
for (const token of [release, 'drawing-tools.js', 'drawing-tools.css', 'drawingToolsButton', 'chartDayCaptionLayer']) {
  if (!html.includes(token)) throw new Error(`Charts release verification FAILED: deployed index.html missing ${token}`);
}
const js = await readFile(path.join(dir, 'app.js'), 'utf8');
for (const token of ['Day High · UTC', 'Day Low · UTC', 'chartDayCaptionLayer']) {
  if (!js.includes(token)) throw new Error(`Charts release verification FAILED: deployed app.js missing ${token}`);
}
console.log(`Charts ${release}: verified dist/charts/app HTML, drawing tools, and UTC day captions.`);
