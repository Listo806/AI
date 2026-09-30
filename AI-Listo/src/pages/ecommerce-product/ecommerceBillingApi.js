const token=()=>localStorage.getItem("cortexa_ecommerce_access_token")||localStorage.getItem("access_token")||localStorage.getItem("token");
async function req(path,options={}){const r=await fetch(`/api/ecommerce/customers-hub/billing-calendar${path}`,{...options,headers:{"Content-Type":"application/json",...(token()?{Authorization:`Bearer ${token()}`}:{}) ,...(options.headers||{})}});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j?.message||"Billing request failed");return j;}
export const ecommerceBillingApi={
 dashboard:(month)=>req(`/dashboard${month?`?month=${encodeURIComponent(month)}`:""}`),
 day:(date,p={})=>req(`/day/${date}?${new URLSearchParams(Object.entries(p).filter(([,v])=>v!==undefined&&v!==""))}`),
 reschedule:(id,body)=>req(`/subscriptions/${id}/reschedule`,{method:"POST",body:JSON.stringify(body)}),
 bulkReschedule:(body)=>req(`/bulk/reschedule`,{method:"POST",body:JSON.stringify(body)}),
 reminder:(id)=>req(`/subscriptions/${id}/reminder`,{method:"POST",body:"{}"}),
 retry:(id)=>req(`/subscriptions/${id}/retry`,{method:"POST",body:"{}"}),
};
