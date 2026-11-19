import { cp, mkdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const source = path.join(root, 'charts-source', 'web');
const target = path.join(root, 'public', 'charts', 'app');
const release = '20261119-release29';
const required = ['index.html', 'drawing-tools.js', 'drawing-tools.css', 'app.js', 'market-tools.js'];
for (const name of required) {
  const file = path.join(source, name);
  try { if (!(await stat(file)).isFile()) throw new Error('not a file'); }
  catch { throw new Error(`Charts build stopped: missing ${file}`); }
}
const html = await readFile(path.join(source, 'index.html'), 'utf8');
for (const token of [release, 'drawing-tools.js', 'drawing-tools.css', 'drawingToolsButton', 'chartDayCaptionLayer']) {
  if (!html.includes(token)) throw new Error(`Charts build stopped: source index.html missing ${token}`);
}
const app = await readFile(path.join(source, 'app.js'), 'utf8');
for (const token of ['Day High · UTC', 'Day Low · UTC', 'chartDayCaptionLayer']) {
  if (!app.includes(token)) throw new Error(`Charts build stopped: app.js missing ${token}`);
}
await mkdir(target, { recursive: true });
await cp(source, target, { recursive: true, force: true });
const copied = await readFile(path.join(target, 'index.html'), 'utf8');
if (!copied.includes(release)) throw new Error('Charts build stopped: copied HTML is not current release');
console.log(`Charts ${release}: synced source to public/charts/app/`);
