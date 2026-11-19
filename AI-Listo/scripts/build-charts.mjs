import { cp, mkdir, readFile, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const source = path.join(root, 'charts-source', 'web');
const target = path.join(root, 'public', 'charts', 'app');
const worker = path.join(root, 'charts-source', 'worker', 'index.js');
const required = ['index.html', 'app.js', 'market-tools.js', 'drawing-tools.js', 'drawing-tools.css'];
for (const name of required) {
  const file = path.join(source, name);
  try { if (!(await stat(file)).isFile()) throw new Error('not a file'); }
  catch { throw new Error(`Charts build stopped: missing ${file}`); }
}
const html = await readFile(path.join(source, 'index.html'), 'utf8');
for (const name of ['drawing-tools.js', 'drawing-tools.css']) {
  if (!html.includes(name)) throw new Error(`Charts build stopped: index.html does not reference ${name}`);
}
if (!html.includes('chartDayCaptionLayer')) throw new Error('Charts build stopped: missing Day High/Low layer');

await mkdir(target, { recursive: true });
await cp(source, target, { recursive: true, force: true });

// CRITICAL: /charts/app/* is force-rewritten to the authenticated Netlify Function.
// That Function serves files embedded in charts-source/worker/index.js, NOT dist/charts/app.
// Rebuild its embedded assets from the current charts-source/web on EVERY Netlify build.
execFileSync(process.execPath, [path.join(root, 'charts-source', 'scripts', 'prepare-worker.mjs')], {
  cwd: root, stdio: 'inherit', maxBuffer: 16 * 1024 * 1024,
});
const generated = await readFile(worker, 'utf8');
const start = generated.indexOf('const assets = ');
const end = generated.indexOf(';\nexport default', start);
if (start < 0 || end < 0) throw new Error('Charts build stopped: worker asset map missing');
const assets = JSON.parse(generated.slice(start + 'const assets = '.length, end));
for (const name of ['/', '/drawing-tools.js', '/drawing-tools.css', '/app.js']) {
  if (!assets[name]?.body) throw new Error(`Charts build stopped: worker missing ${name}`);
}
for (const name of ['drawing-tools.js', 'drawing-tools.css']) {
  if (!assets['/'].body.includes(name)) throw new Error(`Charts build stopped: worker HTML does not reference ${name}`);
}
if (!assets['/'].body.includes('chartDayCaptionLayer')) throw new Error('Charts build stopped: worker HTML missing Day High/Low layer');
if (assets['/app.js'].body !== await readFile(path.join(source, 'app.js'), 'utf8')) {
  throw new Error('Charts build stopped: worker app.js differs from current source');
}
console.log('Charts synced to public/charts/app AND regenerated private worker assets (Drawing Tools + Day High/Low verified).');
