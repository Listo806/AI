/** Produce a conservative IndexNow batch from the deployed public sitemap.
 * Run AFTER build: node scripts/indexnow-public-urls.mjs
 * Excludes all property detail URLs pending separate SEO review.
 */
import fs from 'node:fs';
const origin = "https://www.cortexaaicrm.com";
const xml = fs.readFileSync('public/sitemap.xml','utf8');
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1].replace(/&amp;/g,'&'));
const safe = [...new Set(urls.filter(value=>{
  let u;try{u=new URL(value)}catch{return false}
  return u.origin===origin && !u.search && !u.hash
    && !/(^|\/)(property|properties|checkout|admin|dashboard|account|login|sign-in|sign-up|my-listings|payment)(\/|$)/i.test(u.pathname);
}))];
if(!safe.length) throw Error('No public sitemap URLs found');
fs.writeFileSync('indexnow-urls.json',JSON.stringify(safe,null,2)+'\n');
console.log(`Prepared ${safe.length} public URLs; verify before submitting.`);
