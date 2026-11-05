/** Generate conservative public SEO assets. Run: node scripts/generate-organic-seo.mjs
 * Optional PUBLISHED_LISTINGS_JSON=/absolute/path.json: array of {url, published, indexable, canonical, updatedAt}.
 * Do not include unverified inventory. Homepage descriptions were approved by the client.
 */
import fs from 'node:fs';
import path from 'node:path';
const ORIGIN='https://listoqasa.com';
const out=path.resolve('public');
const categorySlugs=['propiedades-en-venta','propiedades-en-alquiler','casas-en-venta','casas-en-alquiler','departamentos-en-venta','departamentos-en-alquiler','terrenos-en-venta','propiedades-comerciales','oficinas-en-venta','oficinas-en-alquiler','alquileres-vacacionales'];
const staticPaths=['/','/en','/es-ec',...categorySlugs.map(x=>'/es-ec/'+x),'/es-ec/publicar-propiedad','/es-ec/propietarios','/es-ec/agentes','/owners','/agents','/find-agent','/ai-crm','/commercial-owners','/developers','/vacation-rentals','/about','/contact','/privacy','/terms'];
const xmlEscape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const urls=new Map(staticPaths.map(p=>[ORIGIN+p,{url:ORIGIN+p}]));
const source=process.env.PUBLISHED_LISTINGS_JSON;
if(source){
 const listings=JSON.parse(fs.readFileSync(source,'utf8'));
 if(!Array.isArray(listings))throw Error('PUBLISHED_LISTINGS_JSON must contain an array');
 for(const item of listings){
  if(item.published!==true||item.indexable!==true||!item.url)continue;
  const u=new URL(item.url,ORIGIN); const canonical=new URL(item.canonical||u.href,ORIGIN);
  if(u.origin!==ORIGIN||canonical.href!==u.href||u.search||u.hash||!/^\/(property|vacation-rentals\/property)\/[A-Za-z0-9_-]+\/?$/.test(u.pathname))continue;
  const lastmod=item.updatedAt && !Number.isNaN(Date.parse(item.updatedAt))?new Date(item.updatedAt).toISOString().slice(0,10):undefined;
  urls.set(u.href,{url:u.href,lastmod});
 }
}
const sitemap='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+[...urls.values()].map(({url,lastmod})=>'  <url><loc>'+xmlEscape(url)+'</loc>'+(lastmod?'<lastmod>'+lastmod+'</lastmod>':'')+'</url>').join('\n')+'\n</urlset>\n';
const robots=`User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /dashboard/\nDisallow: /my-listings\nDisallow: /my-trips\nDisallow: /saved-stays\nDisallow: /marketplace/checkout\nDisallow: /marketplace/login\nDisallow: /marketplace/payment-pending\nDisallow: /marketplace/purchase-confirmation\nDisallow: /es-ec/marketplace/checkout\nDisallow: /create-listing\nSitemap: ${ORIGIN}/sitemap.xml\n`;
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'sitemap.xml'),sitemap);fs.writeFileSync(path.join(out,'robots.txt'),robots);
console.log('Generated',urls.size,'candidate URLs. Verify each canonical and HTTP 200 before deployment.');
