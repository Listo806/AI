import React, {useEffect, useMemo, useState} from "react";
import {
  Search, Bell, ChevronDown, Plus, Plug, HeartPulse, RefreshCw, AlertTriangle,
  CheckCircle2, Grid2X2, List, CreditCard, ShieldCheck, Phone, Mail, Package,
  ShieldAlert, UserRound, Megaphone, FileSpreadsheet, Folder, Code2, Fingerprint,
  ChevronRight, ExternalLink, MoreVertical, XCircle, CircleAlert, HelpCircle
} from "lucide-react";
import "./ecommerce-integrations.css";

const categoryMeta=[
 ["payment","Payment Gateways","Accept payments and manage merchant accounts.",CreditCard],
 ["chargebacks","Chargeback & Disputes","Protect revenue and manage disputes & chargebacks.",ShieldCheck],
 ["telephony","Call Centers & Telephony","Connect voice, SMS and call center solutions.",Phone],
 ["messaging","Email & Messaging","Transactional email, campaigns and message delivery.",Mail],
 ["fulfillment","Fulfillment & Shipping","Fulfill orders and manage shipping & logistics.",Package],
 ["fraud","Fraud & Risk Management","Fraud detection, KYC and risk scoring services.",ShieldAlert],
 ["crm","CRM & Customer Data","Sync customer data and CRM platforms.",UserRound],
 ["marketing","Marketing & Automation","Marketing tools and automation platforms.",Megaphone],
 ["accounting","Accounting & Tax","Accounting, tax and financial reporting integrations.",FileSpreadsheet],
 ["storage","Storage & File Management","Store, sync and manage important files.",Folder],
 ["api","Webhooks & Custom API","Custom webhooks and API connections.",Code2],
 ["identity","Identity & Verification","Identity verification and compliance solutions.",Fingerprint]
];

const emptySummary={connected:null,total:null,healthy:null,healthyPercent:null,syncs30d:null,syncGrowth:null,failed30d:null,failedChange:null,lastSync:null};
const emptyHealth={healthy:0,warning:0,error:0,notConnected:0,total:0};

function useIntegrationData(){
 const [state,setState]=useState({loading:true,error:"",summary:emptySummary,health:emptyHealth,categories:[],events:[],recent:[],popular:[]});
 useEffect(()=>{
  let live=true;
  (async()=>{
   try{
    const token=localStorage.getItem("cortexa_ecommerce_access_token");
    const res=await fetch("/api/e-commerce/integrations/dashboard",{headers:token?{Authorization:`Bearer ${token}`}:{}}); 
    if(!res.ok) throw new Error("Integration data is not available yet.");
    const data=await res.json();
    if(live)setState({loading:false,error:"",summary:{...emptySummary,...(data.summary||{})},health:{...emptyHealth,...(data.health||{})},categories:data.categories||[],events:data.events||[],recent:data.recent||[],popular:data.popular||[]});
   }catch(e){if(live)setState(s=>({...s,loading:false,error:e.message||"Unable to load integrations."}))}
  })();
  return()=>{live=false};
 },[]);
 return state;
}

const value=v=>v===null||v===undefined?"—":v;
function Topbar(){
 return <header className="eci-topbar">
  <div><h1>Integrations</h1><p>Connect and manage your critical business services and API integrations.</p></div>
  <div className="eci-account"><label><Search size={16}/><input placeholder="Search integrations..."/><kbd>⌘K</kbd></label><button className="eci-bell"><Bell size={19}/><i>7</i></button><span>H</span><b>Heisenberg<small>Super Admin</small></b><ChevronDown size={15}/></div>
 </header>
}
function Summary({s,onFilter}){
 const cards=[
  ["Connected Integrations",value(s.connected),s.total!=null?`of ${s.total} total`:"Current account",Plug,"purple","connected"],
  ["Healthy Connections",value(s.healthy),s.healthyPercent!=null?`${s.healthyPercent}% healthy`:"Current status",HeartPulse,"green","healthy"],
  ["Syncs (30d)",value(s.syncs30d),s.syncGrowth!=null?`${s.syncGrowth}% vs last 30 days`:"Last 30 days",RefreshCw,"green","all"],
  ["Failed Syncs (30d)",value(s.failed30d),s.failedChange!=null?`${s.failedChange}% vs last 30 days`:"Last 30 days",AlertTriangle,"orange","attention"],
  ["Last Sync",s.lastSync||"—","All systems status",CheckCircle2,"plain","all"]
 ];
 return <div className="eci-summary">{cards.map(([a,b,c,Icon,t,f])=><button key={a} onClick={()=>onFilter(f)}><div><span>{a}</span><strong>{b}</strong><small>{c}</small></div><i className={t}><Icon size={21}/></i></button>)}</div>
}
function Health({h}){
 const total=h.total||h.healthy+h.warning+h.error+h.notConnected||1;
 const pct=n=>`${(n/total)*100}%`;
 const donut={background:`conic-gradient(#22b85a 0 ${pct(h.healthy)},#ff9b18 ${pct(h.healthy)} ${pct(h.healthy+h.warning)},#f12636 ${pct(h.healthy+h.warning)} ${pct(h.healthy+h.warning+h.error)},#aab4c5 ${pct(h.healthy+h.warning+h.error)} 100%)`};
 return <section className="eci-side-card eci-health"><h3>Integration Health</h3><div className="eci-health-body"><div className="eci-donut" style={donut}><div><b>{h.total||0}</b><span>Total</span></div></div><ul><li><i className="green"/>{h.healthy} Healthy</li><li><i className="orange"/>{h.warning} Warning</li><li><i className="red"/>{h.error} Error</li><li><i className="gray"/>{h.notConnected} Not Connected</li></ul></div><button>View Health Details</button></section>
}
function RightRail({data}){
 return <aside className="eci-right"><Health h={data.health}/>
  <section className="eci-side-card eci-events"><header><h3>Recent Integration Events</h3><a>View all</a></header>{data.events.length?data.events.slice(0,5).map((e,i)=><button key={e.id||i}><i className={e.status||"success"}>{e.status==="error"?<XCircle/>:e.status==="warning"?<AlertTriangle/>:<CheckCircle2/>}</i><span>{e.provider&&<b>{e.provider}</b>}{e.event}</span><small>{e.time||e.createdAt||""}</small></button>):<p className="eci-empty">No recent integration events.</p>}</section>
  <section className="eci-side-card eci-help"><h3>Need Help?</h3><p>Explore our integration guides or contact our support team.</p>{["Integration Guides","API Documentation","Contact Support"].map(x=><a key={x}>{x}<ExternalLink size={13}/></a>)}</section>
  <section className="eci-side-card eci-popular"><h3>Popular Integrations</h3>{data.popular.length?<div>{data.popular.slice(0,5).map((p,i)=><button key={p.id||i}><span>{(p.name||"?").slice(0,1)}</span><small>{p.name}</small></button>)}</div>:<p className="eci-empty">No popular integrations available.</p>}</section>
 </aside>
}
function CategoryCard({meta,record,onOpen}){
 const [key,name,desc,Icon]=meta;
 return <button className="eci-category" onClick={()=>onOpen(key)}><div className="eci-cat-head"><i><Icon size={24}/></i><span><b>{name}</b><small>{desc}</small></span></div><footer><span>{value(record?.total)} integrations</span><em>{value(record?.connected)} connected</em><ChevronRight size={18}/></footer></button>
}
function Recent({items}){
 return <section className="eci-recent"><header><h3>Recently Connected Integrations</h3><a>View all</a></header>{items.length?<div>{items.slice(0,5).map((x,i)=><article key={x.id||i}><span className="eci-provider-logo">{(x.name||"?").slice(0,1)}</span><div><b>{x.name}</b><em>{x.status||"Connected"}</em><small>{x.lastSync||x.connectedAt||""}</small></div><button><MoreVertical size={17}/></button></article>)}</div>:<p className="eci-empty">No integrations connected yet.</p>}</section>
}
export default function EcommerceIntegrations(){
 const data=useIntegrationData();
 const [query,setQuery]=useState("");
 const [filter,setFilter]=useState("all");
 const [category,setCategory]=useState("all");
 const [view,setView]=useState("grid");
 const [showDirectory,setShowDirectory]=useState(false);
 const records=useMemo(()=>Object.fromEntries((data.categories||[]).map(x=>[x.key||x.slug,x])),[data.categories]);
 const matchesTopFilter=(record,key)=>{
  if(filter==="all") return true;
  if(filter==="connected") return Number(record?.connected||0)>0 || record?.status==="connected";
  if(filter==="attention") return Boolean(record?.needsAttention) || Number(record?.warning||0)>0 || Number(record?.error||0)>0 || ["warning","error","failed","attention"].includes(String(record?.status||"").toLowerCase());
  if(filter==="popular") return Boolean(record?.popular) || (data.popular||[]).some(x=>(x.categoryKey||x.category||x.key)===key);
  if(filter==="recent") return Boolean(record?.recentlyAdded) || Boolean(record?.isNew) || (data.recent||[]).some(x=>(x.categoryKey||x.category||x.key)===key);
  return true;
 };
 const visible=categoryMeta.filter(([key,name,desc])=>{
  const record=records[key];
  return (category==="all"||category===key)
   && (`${name} ${desc}`.toLowerCase().includes(query.toLowerCase()))
   && matchesTopFilter(record,key);
 });
 return <div className="eci-page">
  <Topbar/>
  <div className="eci-content">
   <div className="eci-head-actions"><div/><button onClick={()=>setShowDirectory(true)}><Plus size={17}/>Add Integration</button></div>
   <div className="eci-layout">
    <main className="eci-main">
     <Summary s={data.summary} onFilter={setFilter}/>
     
     <section className="eci-directory">
      <div className="eci-filters"><div>{[["all","All Categories"],["connected","Connected"],["attention","Needs Attention"],["popular","Popular"],["recent","Recently Added"]].map(([k,n])=><button className={filter===k?"active":""} onClick={()=>setFilter(k)} key={k}>{n}</button>)}</div><div><select value={category} onChange={e=>setCategory(e.target.value)}><option value="all">All Integrations</option>{categoryMeta.map(x=><option value={x[0]} key={x[0]}>{x[1]}</option>)}</select><button className={view==="grid"?"active":""} onClick={()=>setView("grid")}><Grid2X2 size={17}/></button><button className={view==="list"?"active":""} onClick={()=>setView("list")}><List size={17}/></button></div></div>
      <label className="eci-mobile-search"><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search integrations..."/></label>
      <div className={`eci-categories ${view}`}>{visible.map(m=><CategoryCard key={m[0]} meta={m} record={records[m[0]]} onOpen={setCategory}/>)}</div>
      {!visible.length&&<div className="eci-filter-empty"><CircleAlert size={17}/><b>No integrations match this filter.</b><span>Try another status or category.</span></div>}
      <Recent items={data.recent}/>
     </section>
    </main>
    <RightRail data={data}/>
   </div>
  </div>
  {showDirectory&&<div className="eci-modal" onMouseDown={()=>setShowDirectory(false)}><section onMouseDown={e=>e.stopPropagation()}><header><div><h2>Add Integration</h2><p>Select a category to review available providers and connection requirements.</p></div><button onClick={()=>setShowDirectory(false)}><XCircle size={20}/></button></header><div className="eci-modal-grid">{categoryMeta.map(m=><CategoryCard key={m[0]} meta={m} record={records[m[0]]} onOpen={k=>{setCategory(k);setShowDirectory(false)}}/>)}</div></section></div>}
 </div>
}