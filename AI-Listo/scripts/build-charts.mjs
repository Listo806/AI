import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { existsSync, rmSync } from 'node:fs';

const projectRoot = new URL('../', import.meta.url);
const chartsRoot = new URL('charts-source/', projectRoot);
const generatedWorker = new URL('worker/index.js', chartsRoot);
const oldFunction = new URL('netlify/functions/charts-worker.mjs', projectRoot);

execFileSync(process.execPath, ['scripts/prepare-worker.mjs'], {
  cwd: fileURLToPath(chartsRoot),
  stdio: 'inherit',
});
if (!existsSync(fileURLToPath(generatedWorker))) throw new Error('Charts Worker generation failed');
// Remove the old generated entrypoint: Netlify otherwise tries to deploy it as
// a second Function and may package an incompatible handler.
if (existsSync(fileURLToPath(oldFunction))) rmSync(fileURLToPath(oldFunction));
console.log('Charts Worker generated as a private module for the single charts Netlify Function');
