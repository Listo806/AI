import { cp, mkdir, readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

// Runs BEFORE vite build. Vite copies public/ to dist/ verbatim.
const root = process.cwd();
const source = path.join(root, 'charts-source', 'web');
const target = path.join(root, 'public', 'charts', 'app');
const required = ['index.html', 'drawing-tools.js', 'drawing-tools.css', 'app.js', 'market-tools.js'];
for (const name of required) {
  const file = path.join(source, name);
  try { if (!(await stat(file)).isFile()) throw new Error('not a file'); }
  catch { throw new Error(`Charts build stopped: missing ${file}`); }
}
const html = await readFile(path.join(source, 'index.html'), 'utf8');
if (!html.includes('drawing-tools.js') || !html.includes('drawing-tools.css')) {
  throw new Error('Charts build stopped: source index.html does not load Drawing Tools assets');
}
await mkdir(target, { recursive: true });
// Copy the actual chart engine and every relative asset, not only index.html.
await cp(source, target, { recursive: true, force: true });
for (const name of required) {
  if (!(await stat(path.join(target, name))).isFile()) throw new Error(`Missing deployed asset: ${name}`);
}
console.log('Charts assets synced to public/charts/app/; Vite will publish them at /charts/app/.');
