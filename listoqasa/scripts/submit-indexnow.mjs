/** IndexNow submission for published public URLs only.
 * INDEXNOW_KEY=... INDEXNOW_URLS_FILE=... node scripts/submit-indexnow.mjs
 * URL file: JSON array of absolute URLs. Submit after deployment, not at build time.
 */
import fs from 'node:fs';
const origin = process.env.INDEXNOW_ORIGIN || 'https://listoqasa.com';
const key = process.env.INDEXNOW_KEY;
const file = process.env.INDEXNOW_URLS_FILE || 'indexnow-urls.json';
if (!origin || !key || !file) throw Error('Set INDEXNOW_ORIGIN, INDEXNOW_KEY and INDEXNOW_URLS_FILE');
const site = new URL(origin);
if (site.protocol !== 'https:' || !/^[a-zA-Z0-9-]{8,128}$/.test(key)) throw Error('Invalid origin or key');
const urls = JSON.parse(fs.readFileSync(file, 'utf8'));
if (!Array.isArray(urls) || !urls.length || urls.length > 10000) throw Error('Expected 1–10000 URLs');
const clean = [...new Set(urls.map((value) => {
  const u = new URL(value);
  if (u.origin !== site.origin || u.search || u.hash || u.protocol !== 'https:') throw Error(`Not a canonical URL: ${value}`);
  if (/(^|\/)(admin|dashboard|checkout|sign-in|sign-up|login|account|my-listings|payment-pending)(\/|$)/i.test(u.pathname)) throw Error(`Private URL rejected: ${value}`);
  return u.href;
}))];
const keyLocation = `${site.origin}/${key}.txt`;
const check = await fetch(keyLocation);
if (!check.ok || (await check.text()).trim() !== key) throw Error(`Publish ${keyLocation} containing the key before submission`);
const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST', headers: {'content-type':'application/json; charset=utf-8'},
  body: JSON.stringify({host:site.host, key, keyLocation, urlList:clean}),
});
console.log(`IndexNow status ${response.status}; ${clean.length} URLs submitted`);
if (![200,202].includes(response.status)) { console.error((await response.text()).slice(0,1000)); process.exitCode = 1; }
