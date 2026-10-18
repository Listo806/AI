// Usage: npm install sharp; node scripts/split-property-grid.mjs ./grids ./output
// Input: LQ-S2-QUITO-00001.png, one 3-column x 2-row grid per property.
// Output: six separate files and a manifest with local paths (upload to storage before API commit).
import sharp from 'sharp';
import { readdir, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
const [input,output] = process.argv.slice(2);
if(!input||!output) throw new Error('Provide input and output directories');
await mkdir(output,{recursive:true});
const manifest=[];
for(const name of (await readdir(input)).filter(x=>/^LQ-S2-[A-Z]+-\d{5}\.png$/i.test(x))){
 const external_id=path.basename(name,'.png');
 const img=sharp(path.join(input,name));const {width,height}=await img.metadata();
 if(!width||!height||width%3||height%2) throw new Error(`Grid dimensions not divisible by 3x2: ${name}`);
 const w=width/3,h=height/2;
 for(let i=0;i<6;i++){
  const filename=`${external_id}-${String(i+1).padStart(2,'0')}.png`;
  await sharp(path.join(input,name)).extract({left:(i%3)*w,top:Math.floor(i/3)*h,width:w,height:h}).png().toFile(path.join(output,filename));
  manifest.push({external_id,index:i,filename});
 }
}
await writeFile(path.join(output,'manifest.local.json'),JSON.stringify({images:manifest},null,2));
console.log(`Split ${manifest.length/6} grids into ${manifest.length} images. Upload each image and replace filename with HTTPS URL before image API preview/commit.`);
