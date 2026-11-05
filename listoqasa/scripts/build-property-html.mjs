/** Build property-specific initial HTML only from an explicitly verified export.
 * Run after Vite build: PUBLISHED_LISTINGS_JSON=/path/to/verified.json node scripts/build-property-html.mjs
 * Each record: {id,title,description,published:true,indexable:true,verified:true,illustrative:false,canonical?,updatedAt?}
 * Unverified or illustrative properties are deliberately excluded.
 */
import fs from 'node:fs';
import path from 'node:path';
const origin='https://listoqasa.com';
const source=process.env.PUBLISHED_LISTINGS_JSON;
if(!source) {console.log('No verified listing export: property SEO generation skipped');process.exit(0)}
const root=path.resolve('dist');
const shell=fs.readFileSync(path.join(root,'index.html'),'utf8');
const records=JSON.parse(fs.readFileSync(source,'utf8'));
if(!Array.isArray(records))throw Error('Expected an array of listings');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let count=0;
for(const item of records){
 if(item.published!==true||item.indexable!==true||item.verified!==true||item.illustrative!==false)continue;
 if(!/^[a-zA-Z0-9_-]{8,100}$/.test(String(item.id||'')))continue;
 if(!item.title||!item.description)continue;
 const canonical=`${origin}/property/${item.id}`;
 if(item.canonical&&item.canonical!==canonical)continue;
 const title=String(item.title).trim().slice(0,160);
 const description=String(item.description).trim().slice(0,350);
 if(!title||!description)continue;
 let html=shell.replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi,'').replace(/<meta\s+[^>]*name=["'](?:description|robots)["'][^>]*>/gi,'').replace(/<link\s+[^>]*rel=["']canonical["'][^>]*>/gi,'');
 html=html.replace('</head>',`<title>${esc(title)} | ListoQasa</title>\n<meta name="description" content="${esc(description)}">\n<meta name="robots" content="index,follow">\n<link rel="canonical" href="${canonical}">\n<meta property="og:type" content="website">\n<meta property="og:title" content="${esc(title)} | ListoQasa">\n<meta property="og:description" content="${esc(description)}">\n<meta property="og:url" content="${canonical}">\n</head>`);
 html=html.replace(/<div\s+id=["']root["']\s*><\/div>/i,`<div id="root"><main><h1>${esc(title)}</h1><p>${esc(description)}</p></main></div>`);
 const dest=path.join(root,'property',String(item.id));fs.mkdirSync(dest,{recursive:true});fs.writeFileSync(path.join(dest,'index.html'),html);count++;
}
console.log(`Generated ${count} verified property HTML entrypoints`);
