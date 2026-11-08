import {execFileSync} from 'node:child_process';
import {copyFileSync} from 'node:fs';
const cwd = new URL('../charts-source/', import.meta.url).pathname;
execFileSync(process.execPath,['scripts/prepare-worker.mjs'],{cwd,stdio:'inherit'});
copyFileSync(new URL('../charts-source/worker/index.js',import.meta.url),new URL('../netlify/functions/charts-worker.mjs',import.meta.url));
console.log('Charts worker bundled into private Netlify Function');
