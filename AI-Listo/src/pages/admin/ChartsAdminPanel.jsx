import React, {useEffect, useState} from 'react';
const API=(import.meta.env.VITE_API_URL || 'https://backend.cortexaaicrm.com/api').replace(/\/$/,'');
async function getCharts(path,options={}){
  const token=localStorage.getItem('listo_access_token')||localStorage.getItem('accessToken');
  if(!token)throw Error('Please sign in as administrator');
  const r=await fetch(`${API}/charts/admin/${path}`,{...options,headers:{Authorization:`Bearer ${token}`,...(options.body?{'Content-Type':'application/json'}:{}),...(options.headers||{})}});
  const result=await r.json().catch(()=>({}));if(!r.ok)throw Error(result.message||`Request failed (${r.status})`);return result;
}
export default function ChartsAdminPanel({mode='plans'}){
  const [data,setData]=useState([]),[month,setMonth]=useState(new Date().toISOString().slice(0,7));
  const [error,setError]=useState(''),[busy,setBusy]=useState(false),[refresh,setRefresh]=useState(0);
  const [reviewing,setReviewing]=useState(null);
  useEffect(()=>{let active=true;setBusy(true);setError('');
    getCharts(mode==='plans'?'plans':mode==='calendar'?`billing-calendar?month=${month}`:'orders?status=pending_review')
    .then(v=>{if(active)setData(Array.isArray(v)?v:(v.renewals||[]));})
    .catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setBusy(false);});
    return()=>{active=false};},[mode,month,refresh]);
  const review=async(id,approve)=>{if(!window.confirm(approve?'Confirm verified bank payment and activate Charts access?':'Reject this payment receipt?'))return;
    setReviewing(id);setError('');try{await getCharts(`orders/${id}/review`,{method:'POST',body:JSON.stringify({approve})});setRefresh(x=>x+1);}catch(e){setError(e.message);}finally{setReviewing(null);}};
  return <section style={{margin:'24px 0',padding:20,border:'1px solid #d9dfe8',borderRadius:12,background:'#fff',color:'#17212f'}}>
    <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap'}}><h2 style={{margin:0,fontSize:20}}>Cortexa Charts {mode==='plans'?'Plans':mode==='calendar'?'Billing Calendar':'Bank Transfers'}</h2><button type="button" onClick={()=>setRefresh(x=>x+1)}>Refresh</button></div>
    {mode==='calendar'&&<label>Month <input type="month" value={month} onChange={e=>setMonth(e.target.value)}/></label>}
    {error&&<p role="alert" style={{color:'#b42318'}}>{error}</p>}{busy&&<p>Loading Charts data…</p>}
    <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',marginTop:12}}><thead><tr>{(mode==='plans'?['Plan','Billing','Amount','Renewal']:mode==='calendar'?['Customer','Next renewal','Plan','Expected USD']:['Customer','Reference','Plan','USD','Action']).map(v=><th key={v} style={{textAlign:'left',padding:10,borderBottom:'1px solid #ddd'}}>{v}</th>)}</tr></thead>
    <tbody>{data.map((v,i)=><tr key={v.id||v.user_id||v.code||i}>{(mode==='plans'?[v.name,v.billing,`$${(v.amount_cents/100).toFixed(2)}`,v.renewal_amount_cents?`$${(v.renewal_amount_cents/100).toFixed(2)} / 12 months`:'Standard']:mode==='calendar'?[v.email,new Date(v.paid_until).toLocaleDateString(),v.plan,`$${(v.renewal_amount_cents/100).toFixed(2)}`]:[v.email,v.reference,v.offer_code?'Annual special':v.billing,`$${(v.amount_cents/100).toFixed(2)}`,<span><button disabled={reviewing===v.id} onClick={()=>review(v.id,true)}>Approve</button> <button disabled={reviewing===v.id} onClick={()=>review(v.id,false)}>Reject</button></span>]).map((value,j)=><td key={j} style={{padding:10,borderBottom:'1px solid #eee'}}>{value}</td>)}</tr>)}</tbody></table></div>
    {!busy&&!data.length&&!error&&<p>No Charts records for this view.</p>}
    {mode==='calendar'&&<p style={{fontSize:12}}>Bank transfer renewals are estimates, not automatic charges. Access extends only after payment approval.</p>}
  </section>;
}
