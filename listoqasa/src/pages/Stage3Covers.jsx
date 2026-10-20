import { useState } from 'react';
import apiClient from '../api/apiClient';

export default function Stage3Covers() {
 const [files,setFiles]=useState([]), [busy,setBusy]=useState(false),[log,setLog]=useState([]),[status,setStatus]=useState(null),[confirm,setConfirm]=useState('');
 const report=(message)=>setLog(old=>[...old,message]);
 const refresh=async()=>{try{setStatus(await apiClient.request('/integrations/property-feed/listoqasa-stage3/status'));}catch(e){report(e.message)}};
 const upload=async()=>{
  if(!files.length)return;setBusy(true);
  try {for(let i=0;i<files.length;i+=6){const chunk=files.slice(i,i+6),body=new FormData();chunk.forEach(file=>body.append('files',file));
   const result=await apiClient.request('/integrations/property-feed/listoqasa-stage3/covers/upload',{method:'POST',body});
   report(`${i+1}-${i+chunk.length}: ${JSON.stringify(result.results)}`);
  } await refresh();}catch(e){report(`STOPPED: ${e.message}`)}finally{setBusy(false)}
 };
 const publish=async()=>{setBusy(true);try{const result=await apiClient.request('/integrations/property-feed/listoqasa-stage3/publish',{method:'POST',body:JSON.stringify({confirm})});report(JSON.stringify(result));await refresh();}catch(e){report(e.message)}finally{setBusy(false)}};
 return <main style={{maxWidth:900,margin:'50px auto',padding:24,fontFamily:'sans-serif'}}>
 <h1>Listo Qasa — Stage 3 Covers</h1><p>Admin only. Extract the seven *_covers.zip archives, then select the individual JPG files (not the ZIPs). Filenames must be permanent external IDs. Each batch uploads up to six images. Already attached covers are skipped.</p>
 <input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={e=>setFiles([...e.target.files])}/>
 <p>{files.length} selected files</p><button disabled={busy||!files.length} onClick={upload}>Upload and attach selected covers</button>
 <p><button disabled={busy} onClick={refresh}>Check Stage 3 status</button></p>
 {status&&<pre>{JSON.stringify(status,null,2)}</pre>}
 <h2>Publish only after 840 covers verified</h2><p>Type PUBLISH_840_AI_SAMPLES to confirm public sample listing publication.</p>
 <input value={confirm} onChange={e=>setConfirm(e.target.value)} style={{width:330}}/>
 <button disabled={busy||confirm!=='PUBLISH_840_AI_SAMPLES'} onClick={publish}>Publish 840 illustrative listings</button>
 <h2>Progress / errors</h2><pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{log.join('\n')}</pre>
 </main>;
}
