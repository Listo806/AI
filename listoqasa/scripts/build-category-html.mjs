/** Emit route-specific initial HTML for Ecuador categories after Vite builds.
 * Source of truth: ECUADOR_CATEGORIES in Listings.jsx. No inventory counts are invented.
 * Do not add homepage descriptions here until the customer approves them.
 */
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('dist');
const shellPath=path.join(root,'index.html');
if(!fs.existsSync(shellPath)) throw Error('dist/index.html missing: run Vite build first');
const shell=fs.readFileSync(shellPath,'utf8');
const source=fs.readFileSync('src/pages/Listings/Listings.jsx','utf8');
const section=source.match(/const ECUADOR_CATEGORIES = \{([\s\S]*?)\n\};/);
if(!section) throw Error('Cannot locate category metadata');
const rows=[...section[1].matchAll(/'([a-z-]+)':\s*\{[^\n]*?title:\s*'([^']+)',\s*description:\s*'([^']+)'/g)].map(([,slug,title,description])=>({slug,title,description}));
if(rows.length!==10)throw Error(`Expected 10 Ecuador listing categories, found ${rows.length}`);
const uniqueSlugs=new Set(rows.map(row=>row.slug));
if(uniqueSlugs.size!==rows.length)throw Error("Duplicate Ecuador category slugs");
rows.push({slug:'alquileres-vacacionales',title:'Alquileres Vacacionales en Ecuador',description:'Explora alquileres vacacionales en Ecuador y consulta las opciones publicadas en ListoQasa.'});
const escape=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const strip=(html,pattern)=>html.replace(pattern,'');
for(const {slug,title,description} of rows){
 const url=`https://listoqasa.com/es-ec/${slug}`;
 let html=shell;
 html=strip(html,/<title\b[^>]*>[\s\S]*?<\/title>/gi);
 html=strip(html,/<meta\s+[^>]*name=["'](?:description|robots)["'][^>]*>/gi);
 html=strip(html,/<link\s+[^>]*rel=["']canonical["'][^>]*>/gi);
 html=html.replace(/<html\b[^>]*>/i,tag=> /\blang=/.test(tag)?tag.replace(/\blang=["'][^"']*["']/,'lang="es-EC"'):tag.replace('<html','<html lang="es-EC"'));
 const head=`<meta property="og:type" content="website">\n<meta property="og:title" content="${escape(title)} | ListoQasa">\n<meta property="og:description" content="${escape(description)}">\n<meta property="og:url" content="${url}">\n<title>${escape(title)} | ListoQasa</title>\n<meta name="description" content="${escape(description)}">\n<meta name="robots" content="index,follow">\n<link rel="canonical" href="${url}">`;
 html=html.replace('</head>',`${head}\n</head>`);
 // The browser-rendered React app replaces this fallback, while non-JS fetches
 // receive a meaningful heading and introduction rather than an empty shell.
 html=html.replace(/<div\s+id=["']root["']\s*><\/div>/i,`<div id="root"><main lang="es"><h1>${escape(title)}</h1><p>${escape(description)}</p></main></div>`);
 const dir=path.join(root,'es-ec',slug);fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'index.html'),html);
}
console.log(`Generated ${rows.length} category HTML entrypoints with server-visible SEO metadata`);
