import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

// Validate the current Charts build without pinning it to an obsolete release tag.
const dir = path.join(process.cwd(), 'dist', 'charts', 'app');
const required = ['index.html', 'drawing-tools.js', 'drawing-tools.css', 'app.js', 'market-tools.js'];
for (const name of required) {
  const file = path.join(dir, name);
  if (!(await stat(file).catch(() => null))?.isFile()) {
    throw new Error(`Charts build verification FAILED: missing dist/charts/app/${name}`);
  }
}
const html = await readFile(path.join(dir, 'index.html'), 'utf8');
for (const token of ['drawing-tools.js', 'drawing-tools.css', 'drawingToolsButton', 'chartDayCaptionLayer']) {
  if (!html.includes(token)) {
    throw new Error(`Charts build verification FAILED: index.html missing ${token}`);
  }
}
const drawing = await readFile(path.join(dir, 'drawing-tools.js'), 'utf8');
if (!drawing.includes('drawingToolsButton')) {
  throw new Error('Charts build verification FAILED: drawing-tools.js missing button initialization');
}
const app = await readFile(path.join(dir, 'app.js'), 'utf8');
for (const token of ['Day High · UTC', 'Day Low · UTC', 'chartDayCaptionLayer']) {
  if (!app.includes(token)) {
    throw new Error(`Charts build verification FAILED: app.js missing ${token}`);
  }
}
console.log('[Charts postbuild] PASS: current Drawing Tools assets and existing Day High/Low code verified.');
