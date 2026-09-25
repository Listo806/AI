import React,{useEffect,useMemo,useState} from "react";
import {
 Search,Download,Upload,Plus,UsersRound,UserRoundCheck,DollarSign,TrendingUp,
 Percent,Gift,ChevronRight,Zap,Rocket,Layers3,CalendarDays,Bookmark,Send,
 Languages,Globe2,SlidersHorizontal,ChevronDown,MoreHorizontal,RefreshCw,
 CircleAlert,CheckCircle2
} from "lucide-react";
import "./ecommerce-subscriptions.css";

const EMPTY={summary:{registered:0,active:0,mrr:0,arr:0,conversion:0,free:0},customers:[],analytics:{}};
const money=n=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(Number(n||0));

function useSubscriptions(){
 const [data,setData]=useState({...EMPTY,loading:true,error:""});
 const load=async()=>{
  setData(x=>({...x,loading:true}));
  try{
   const token=localStorage.getItem("cortexa_ecommerce_access_token");
   const r=await fetch("/api/e-commerce/subscriptions",{headers:token?{Authorization:`Bearer ${token}`}:{}}); 
   if(!r.ok) throw new Error("Subscriptions endpoint is not available yet.");
   const j=await r.json();
   setData({...EMPTY,...j,summary:{...EMPTY.summary,...(j.summary||{})},customers:j.customers||[],loading:false,error:""});
  }catch(e){setData({...EMPTY,loading:false,error:e.message||"Unable to load subscriptions."})}
 };
 useEffect(()=>{load()},[]);
 return [data,load];
}
function Stat({title,value,sub,Icon,tone}){
 return <article className={"ecs-stat "+tone}><div className="ecs-stat-icon"><Icon size={19}/></div><span>{title}</span><strong>{value}</strong><small>{sub}</small></article>
}
function DonutCard({title,subtitle,Icon,children,total=0}){
 return <article className="ecs-insight"><header><i><Icon size={19}/></i><div><h3>{title}</h3><p>{subtitle}</p></div><ChevronRight size={18}/></header><div className="ecs-insight-body"><div className="ecs-donut"><div><b>{total}</b><small>Total</small></div></div><div className="ecs-insight-list">{children}</div></div></article>
}
function Filters({query,setQuery,plan,setPlan,status,setStatus}){
 return <div className="ecs-filter-area">
  <div className="ecs-search-filters">
   <label className="ecs-search"><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search by name, email or company"/></label>
   <label><Layers3 size={15}/><select value={plan} onChange={e=>setPlan(e.target.value)}><option>All Plans</option><option>Free</option><option>Solo</option><option>Business</option><option>Scale</option></select></label>
   <label><CalendarDays size={15}/><select><option>All Cycles</option><option>Monthly</option><option>Annual</option></select></label>
   <label><Bookmark size={15}/><select value={status} onChange={e=>setStatus(e.target.value)}><option>All Statuses</option><option>Registered</option><option>Free</option><option>Trialing</option><option>Active Paid</option><option>Past Due</option><option>Canceled</option></select></label>
   <label><Send size={15}/><select><option>All Sources</option></select></label>
   <label><Languages size={15}/><select><option>All Languages</option></select></label>
   <label><Globe2 size={15}/><select><option>All Countries</option></select></label>
  </div>
  <div className="ecs-secondary-filter"><button><UsersRound size={15}/>Users & Seats<ChevronDown size={14}/></button></div>
  <div className="ecs-actions"><button><SlidersHorizontal size={15}/>More Filters</button><button className="link">Clear Filters</button><button>Bulk Actions (0 selected)<ChevronDown size={14}/></button><button>Change Plan</button><button>Update Payment</button><button>Add Seat / User</button><button disabled>Send Email</button><button>Export</button><button>More<ChevronDown size={14}/></button></div>
 </div>
}
export default function EcommerceSubscriptions(){
 const [data,reload]=useSubscriptions();
 const [tab,setTab]=useState("All Subscriptions");
 const [query,setQuery]=useState("");
 const [plan,setPlan]=useState("All Plans");
 const [status,setStatus]=useState("All Statuses");
 const s=data.summary;
 const rows=useMemo(()=>data.customers.filter(c=>{
  const q=query.toLowerCase();
  const okQ=!q||`${c.name||""} ${c.email||""} ${c.company||""}`.toLowerCase().includes(q);
  const okP=plan==="All Plans"||String(c.plan||"").toLowerCase()===plan.toLowerCase();
  const okS=status==="All Statuses"||String(c.status||"").toLowerCase()===status.toLowerCase();
  const okT=tab==="All Subscriptions"||String(c.status||"").toLowerCase()===tab.toLowerCase().replace(" (sign-ups)","");
  return okQ&&okP&&okS&&okT;
 }),[data.customers,query,plan,status,tab]);
 const tabs=["All Subscriptions","Registered (Sign-ups)","Free","Trialing","Active Paid","Past Due","Canceled"];
 const tabCount=t=>t==="All Subscriptions"?data.customers.length:data.customers.filter(c=>String(c.status||"").toLowerCase()===t.toLowerCase().replace(" (sign-ups)","")).length;
 return <div className="ecs-page">
  <header className="ecs-page-head"><div><h1>E-commerce Subscriptions Workspace</h1><p>All registered accounts, subscriptions, and plans — everything in one place.</p></div><div><button><Download size={16}/>Export CSV</button><button><Upload size={16}/>Import Customers</button><button className="primary"><Plus size={17}/>Add Customer</button></div></header>

  <section className="ecs-stats">
   <Stat title="Total Registered" value={s.registered} sub="+0 this week" Icon={UsersRound} tone="blue"/>
   <Stat title="Active Customers" value={s.active} sub={`${s.registered?Math.round(s.active/s.registered*100):0}% of total`} Icon={UserRoundCheck} tone="green"/>
   <Stat title="MRR (Monthly Recurring)" value={money(s.mrr)} sub="Monthly recurring" Icon={DollarSign} tone="purple"/>
   <Stat title="ARR (Annual Recurring)" value={money(s.arr)} sub="Annual recurring" Icon={TrendingUp} tone="orange"/>
   <Stat title="Conversion Rate" value={`${s.conversion||0}%`} sub="Registered → Paid" Icon={Percent} tone="teal"/>
   <Stat title="Free Accounts" value={s.free} sub={`${s.registered?Math.round(s.free/s.registered*100):0}% of total`} Icon={Gift} tone="yellow"/>
  </section>

  <section className="ecs-insights">
   <article className="ecs-insight ecs-plans"><header><div><h3>Customers by Plan</h3><p>Customers by their selected plan.</p></div><span><UsersRound size={14}/>{data.customers.length} Customers</span></header><div className="ecs-plan-rings">{["FREE","SOLO","BUSINESS","SCALE"].map(x=><div key={x}><i><b>{data.customers.filter(c=>String(c.plan||"").toUpperCase()===x).length}</b></i><strong>{x}</strong><small>0%</small></div>)}</div></article>
   <DonutCard title="Customer Status" subtitle="Where your customers stand" Icon={UsersRound} total={data.customers.length}>{[["Free","#ff7a00"],["Checkout Pending","#ffbe19"],["Registered / No Plan","#ff3c3c"],["Paid","#0dbb63"]].map(x=><p key={x[0]}><i style={{background:x[1]}}/><span>{x[0]}</span><b>0</b><small>0%</small></p>)}</DonutCard>
   <DonutCard title="Customer Activity" subtitle="Based on last 30 days" Icon={Zap} total={data.customers.length}>{[["Active Today","#08bb64"],["Active Last 7 Days","#1887ff"],["Inactive 7–30 Days","#ff9c13"],["Inactive 30+ Days","#f22e37"]].map(x=><p key={x[0]}><i style={{background:x[1]}}/><span>{x[0]}</span><b>0</b><small>0%</small></p>)}</DonutCard>
   <DonutCard title="Workspace Opportunity" subtitle="Your workspace upsell potential" Icon={Rocket} total={data.customers.length}>{[["No Workspace","#f32b34"],["Has Workspace","#0ab95f"],["Workspace Trial / Pending","#ffad13"],["Paid Workspace","#304bd9"]].map(x=><p key={x[0]}><i style={{background:x[1]}}/><span>{x[0]}</span><b>0</b><small>0%</small></p>)}</DonutCard>
  </section>

  <section className="ecs-table-card">
   <div className="ecs-tabs">{tabs.map(t=><button className={tab===t?"active":""} onClick={()=>setTab(t)} key={t}>{t}<i>{tabCount(t)}</i></button>)}</div>
   <Filters query={query} setQuery={setQuery} plan={plan} setPlan={setPlan} status={status} setStatus={setStatus}/>
   {data.error&&<div className="ecs-api-note"><CircleAlert size={15}/>{data.error} UI remains empty instead of using demo customer data.<button onClick={reload}><RefreshCw size={14}/>Retry</button></div>}
   <div className="ecs-table">
    <div className="ecs-tr ecs-th"><span>□ &nbsp; Customer</span><span>Plan & Pricing<small>Billing Cycle</small></span><span>Seats / Users</span><span>Next Billing</span><span>Payment Status</span><span>Source</span><span>Country</span><span>Registered<small>Date & Time</small></span><span>Last Active</span><span>LTV<small>Total Revenue</small></span><span>Actions</span></div>
    {rows.length?rows.map((c,i)=><div className="ecs-tr" key={c.id||i}><span><b>{c.name||c.email||"Customer"}</b><small>{c.email||""}</small></span><span><b>{c.plan||"—"}</b><small>{c.billingCycle||""}</small></span><span>{c.seats??"—"}</span><span>{c.nextBilling||"—"}</span><span>{c.paymentStatus||c.status||"—"}</span><span>{c.source||"—"}</span><span>{c.country||"—"}</span><span>{c.registeredAt||"—"}</span><span>{c.lastActive||"—"}</span><span>{money(c.ltv)}</span><span><button><MoreHorizontal size={16}/></button></span></div>):<div className="ecs-no-rows">No customers match these filters.</div>}
   </div>
   <footer className="ecs-pagination"><span>{rows.length?"":"No subscriptions"}</span><div><button>«</button><button className="active">1</button><button>»</button></div><label>Rows per page:<select><option>10</option><option>25</option><option>50</option></select></label></footer>
  </section>
 </div>
}