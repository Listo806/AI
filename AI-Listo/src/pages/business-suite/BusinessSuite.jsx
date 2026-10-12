import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Activity, BarChart3, Boxes, BriefcaseBusiness, Building2, ChevronDown,
  ChevronRight, CircleDollarSign, ClipboardCheck, Clock3, ContactRound,
  CreditCard, FileText, FolderKanban, Gauge, Home, ListChecks, Package,
  Plus, ReceiptText, Settings, SlidersHorizontal, Tags, UsersRound,
  WalletCards, X, Wrench, Workflow, Layers3, CalendarDays, Search, Download, Filter, Sparkles, Bot, Bell, UserRoundPlus, ChevronLeft, Upload
} from "lucide-react";
import businessSuiteApi from "../../api/businessSuiteApi";
import "./BusinessSuite.css";

const EMPTY = {
  kpis: { totalInvoices:0, paidAmount:0, outstandingAmount:0, outstandingInvoices:0, openTasks:0, overdueTasks:0, estimatesSent:0, estimatesAmount:0 },
  operations: { clients:0, tasks:0, followUps:0, documents:0, workItems:0 },
  billing: { estimates:0, invoices:0, payments:0, expenses:0 },
  catalog: { products:0, services:0, priceLists:0, categories:0 },
  recentActivity: [],
};

const money = (n, currency="USD") => new Intl.NumberFormat(undefined,{style:"currency",currency,maximumFractionDigits:2}).format(Number(n)||0);
const num = (n) => new Intl.NumberFormat().format(Number(n)||0);
const timeAgo = (value) => {
  const d = new Date(value); if (Number.isNaN(d.getTime())) return "";
  const sec=Math.max(1,Math.floor((Date.now()-d.getTime())/1000));
  if(sec<60)return `${sec}s ago`; const min=Math.floor(sec/60); if(min<60)return `${min}m ago`;
  const h=Math.floor(min/60); if(h<24)return `${h}h ago`; const day=Math.floor(h/24); return `${day}d ago`;
};

const GROUPS = {
  operations: [
    ["clients", "clients", UsersRound, "Clients", "Manage client details and history"],
    ["tasks", "task", ListChecks, "Tasks & To-Dos", "Manage tasks, assignments and follow-ups"],
    ["followUps", "followUp", Workflow, "Follow-Ups", "Upcoming and overdue follow-ups"],
    ["documents", "documents", FileText, "Documents", "Contracts, proposals and files"],
    ["workItems", "workItem", SlidersHorizontal, "Work Items", "Internal work items and notes"],
  ],
  billing: [
    ["estimates", "estimate", ReceiptText, "Estimates / Quotes", "Create and send quotes"],
    ["invoices", "invoice", FileText, "Invoices", "Create and manage invoices"],
    ["payments", "payment", CreditCard, "Payments", "Track payments and transactions"],
    ["expenses", "expense", CircleDollarSign, "Expenses", "Track business expenses"],
  ],
  catalog: [
    ["products", "product", Package, "Products", "Manage your products"],
    ["services", "service", Wrench, "Services", "Manage your services"],
    ["priceLists", "priceList", ListChecks, "Price Lists", "Manage pricing and discount rules"],
    ["categories", "category", Tags, "Categories", "Organize your catalog"],
  ],
};

const CUSTOMER_ITEMS = [
  ["allCustomers","customers",ContactRound,"All Customers","View and manage all your customers"],
  ["companies","company",Building2,"Companies","Manage businesses and organizations"],
  ["contacts","customers",ContactRound,"Contacts","Manage people and individual contacts"],
  ["customerGroups","customerGroup",UsersRound,"Customer Groups","Organize customers into groups"],
  ["segments","segment",Tags,"Segments","Create and manage customer segments"],
];

const NEW_OPTIONS = [
  ["task",ListChecks,"Task"],["estimate",ReceiptText,"Estimate / Quote"],["invoice",FileText,"Invoice"],
  ["expense",CircleDollarSign,"Expense"],["product",Package,"Product"],["service",Wrench,"Service"],
  ["followUp",Workflow,"Follow-Up"],["workItem",SlidersHorizontal,"Work Item"]
];

function Header({ mode, setMode, newOpen, setNewOpen, onNew }) {
  const { t } = useTranslation();
  return <>
    <section className="bsw-head">
      <div className="bsw-head-title">
        <div className="bsw-title-icon"><BriefcaseBusiness /></div>
        <div><h1>{t("businessSuite.title", "Business Suite")}</h1><p>{t("businessSuite.subtitle", "Manage your operations, billing and products all in one place.")}</p></div>
      </div>
      <div className="bsw-head-actions">
        <button className="bsw-btn bsw-settings-btn" onClick={()=>setMode("settings")}><Settings/> <span>{t("businessSuite.workspaceSettings","Workspace Settings")}</span></button>
        <div className="bsw-new-wrap">
          <button className="bsw-btn bsw-new-btn" onClick={()=>setNewOpen(v=>!v)}><Plus/> <span>{t("businessSuite.new","New")}</span> <ChevronDown/></button>
          {newOpen && <div className="bsw-new-menu">{NEW_OPTIONS.map(([type,Icon,label])=><button key={type} onClick={()=>onNew(type)}><Icon/>{label}</button>)}</div>}
        </div>
      </div>
    </section>
    <nav className="bsw-top-tabs">
      {[['overview',Gauge,'Overview'],['clients',UsersRound,'Clients'],['reports',BarChart3,'Reports'],['activity',Activity,'Activity']].map(([id,Icon,label])=><button key={id} className={mode===id?'active':''} onClick={()=>setMode(id)}><Icon/>{label}</button>)}
    </nav>
  </>;
}

function MetricCard({ icon:Icon, tone, label, value, rightTop, rightBottom }) {
  return <article className={`bsw-metric ${tone}`}><div className="bsw-metric-icon"><Icon/></div><div className="bsw-metric-main"><span>{label}</span><strong>{value}</strong></div><div className="bsw-metric-side"><b>{rightTop}</b><span>{rightBottom}</span></div></article>;
}

function Overview({ data, onOpen, clientCount }) {
  const operations = {...data.operations, clients: clientCount};
  return <>
    <section className="bsw-mobile-overview-title"><h2>Overview</h2><p>Key metrics at a glance.</p></section>
    <section className="bsw-kpis">
      <MetricCard icon={FileText} tone="purple" label="Total Invoices" value={num(data.kpis.totalInvoices)} rightTop={money(data.kpis.totalInvoices ? data.kpis.paidAmount+data.kpis.outstandingAmount : 0)} rightBottom="This month"/>
      <MetricCard icon={CreditCard} tone="green" label="Paid Amount" value={money(data.kpis.paidAmount)} rightTop="↑ Real data" rightBottom="Received"/>
      <MetricCard icon={Clock3} tone="orange" label="Outstanding" value={money(data.kpis.outstandingAmount)} rightTop={`${num(data.kpis.outstandingInvoices)} invoices`} rightBottom=""/>
      <MetricCard icon={ClipboardCheck} tone="purple" label="Open Tasks" value={num(data.kpis.openTasks)} rightTop={`${num(data.kpis.overdueTasks)} overdue`} rightBottom=""/>
      <MetricCard icon={ReceiptText} tone="green" label="Estimates Sent" value={num(data.kpis.estimatesSent)} rightTop={money(data.kpis.estimatesAmount)} rightBottom="This month"/>
    </section>
    <div className="bsw-desktop-sections">
      <Group title="Operations" subtitle="Tasks, documents and team work" tone="purple" icon={Workflow} values={operations} items={GROUPS.operations} onOpen={onOpen}/>
      <Group title="Billing" subtitle="Quotes, invoices and payments" tone="green" icon={BriefcaseBusiness} values={data.billing} items={GROUPS.billing} onOpen={onOpen}/>
      <Group title="Catalog" subtitle="Products, services and pricing" tone="orange" icon={Boxes} values={data.catalog} items={GROUPS.catalog} onOpen={onOpen}/>
    </div>

    {/* Tablet/mobile Overview keeps all three workspace blocks visible.
        This is intentionally separate from the desktop 3-column layout. */}
    <div className="bsw-mobile-overview-sections">
      <Group standalone title="Operations" subtitle="Tasks, documents and team work" tone="purple" icon={Workflow} values={operations} items={GROUPS.operations} onOpen={onOpen}/>
      <Group standalone title="Billing" subtitle="Quotes, invoices and payments" tone="green" icon={BriefcaseBusiness} values={data.billing} items={GROUPS.billing} onOpen={onOpen}/>
      <Group standalone title="Catalog" subtitle="Products, services and pricing" tone="orange" icon={Boxes} values={data.catalog} items={GROUPS.catalog} onOpen={onOpen}/>
    </div>

    <RecentActivity rows={data.recentActivity} onAll={()=>onOpen('activity')}/>
  </>;
}

function Group({title,subtitle,tone,icon:Icon,values,items,onOpen,standalone=false}) {
  return <section className={`bsw-group ${tone} ${standalone?'standalone':''}`}>
    <header><div className="bsw-group-icon"><Icon/></div><div><h2>{title}</h2><p>{subtitle}</p></div></header>
    <div className="bsw-group-list">{items.map(([key,type,ItemIcon,label,desc])=><button key={key} className="bsw-group-row" onClick={()=>onOpen(type)}><span className="bsw-row-icon"><ItemIcon/></span><span className="bsw-row-copy"><b>{label}</b><small>{desc}</small></span><span className="bsw-count">{num(values?.[key])}</span><ChevronRight className="svg-gray"/></button>)}</div>
    <button className="bsw-view-all" onClick={()=>onOpen(title.toLowerCase())}>View All {title}<ChevronRight/></button>
  </section>;
}

function RecentActivity({rows,onAll}) {
  return <section className="bsw-recent"><header><h3>Recent Activity</h3><button onClick={onAll}>View All</button></header><div>{(rows||[]).slice(0,4).map((r,i)=><article key={r.id||i}><span className="bsw-activity-dot"><Activity/></span><div><b>{r.title||r.action||'Activity'}</b><small>{r.details||r.entity_type||''}</small></div><time>{timeAgo(r.created_at)}</time></article>)}{!rows?.length&&<p className="bsw-empty-inline">No recent activity yet.</p>}</div></section>;
}

function ClientsPage({summary,onOpen}) {
  const {t}=useTranslation();
  const tr=(key,fallback)=>t(`businessSuite.clients.${key}`,fallback);
  const [query,setQuery]=useState("");
  const [status,setStatus]=useState("");
  const [rows,setRows]=useState([]);
  const [total,setTotal]=useState(0);
  const [page,setPage]=useState(1);
  const [limit,setLimit]=useState(25);
  const [busy,setBusy]=useState(true);
  const [error,setError]=useState("");
  const [selected,setSelected]=useState([]);
  const [dialog,setDialog]=useState(null);
  const [clientForm,setClientForm]=useState({name:"",email:"",phone:"",company:"",status:"active"});
  const [formError,setFormError]=useState("");
  const [submitting,setSubmitting]=useState(false);
  const [owner,setOwner]=useState("");
  const [tag,setTag]=useState("");
  const [activityFilter,setActivityFilter]=useState("");
  const [moreFilters,setMoreFilters]=useState(false);
  const [notice,setNotice]=useState("");
  const [fileInput,setFileInput]=useState(null);
  const [detail,setDetail]=useState(null);
  const load=useCallback(async()=>{
    setBusy(true);setError("");
    try {
      const response=await businessSuiteApi.customers({search:query,page,limit});
      const list=Array.isArray(response)?response:(response?.data?.items||response?.data?.rows||response?.data||response?.items||response?.rows||[]);
      setRows(Array.isArray(list)?list:[]);
      setTotal(Number(response?.total??response?.pagination?.total??response?.meta?.total??response?.data?.total??(Array.isArray(list)?list.length:0)));
    } catch(e) {setError(e?.message||tr("loadError","Unable to load clients"));setRows([]);setTotal(0)}
    finally {setBusy(false)}
  },[query,page,limit]);
  useEffect(()=>{load()},[load]);
  const metrics=[
    [UsersRound,"total","Total Clients",summary?.allCustomers,"All clients","purple"],
    [UserRoundPlus,"new","New Clients",summary?.newClients,"This month","green"],
    [UsersRound,"active","Active Clients",summary?.activeClients,"Active accounts","blue"],
    [FileText,"invoices","Open Invoices",summary?.openInvoices,"Awaiting payment","orange"],
    [Clock3,"balance","Outstanding Balance",summary?.outstandingBalance,"Unpaid invoices","red"],
    [Bell,"followups","Needs Follow-Up",summary?.needsFollowUp,"Pending follow-ups","purple"],
  ];
  const statusOptions=[...new Set(rows.map(r=>String(r.status||"").trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
  const filteredRows=rows.filter(r=>{
    const who=String(r.owner_name||r.owner||"").toLowerCase();
    const tags=Array.isArray(r.tags)?r.tags.join(" "):String(r.tags||"");
    const last=r.last_activity_at||r.last_activity;
    const days=last?(Date.now()-new Date(last).getTime())/86400000:Infinity;
    return (!status||String(r.status||"").toLowerCase()===status.toLowerCase())&&(!owner||who.includes(owner.toLowerCase()))&&(!tag||tags.toLowerCase().includes(tag.toLowerCase()))&&(!activityFilter||(activityFilter==="7"?days<=7:activityFilter==="30"?days<=30:!last));
  });
  const openAdd=()=>{setClientForm({name:"",email:"",phone:"",company:"",status:"active"});setFormError("");setDialog("add")};
  const saveClient=async e=>{e.preventDefault();setSubmitting(true);setFormError("");try{await businessSuiteApi.createCustomer(clientForm);setDialog(null);await load();}catch(err){setFormError(err?.message||"Unable to save client. Check workspace permissions and API support.")}finally{setSubmitting(false)}};
  const importCsv=async e=>{
    const file=e.target.files?.[0];e.target.value="";if(!file)return;
    const raw=await file.text();const lines=raw.replace(/^\uFEFF/,"").split(/\r?\n/).filter(Boolean);
    const parse=line=>{const result=[];let field="",quoted=false;for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'){if(quoted&&line[i+1]==='"'){field+='"';i++}else quoted=!quoted}else if(ch===","&&!quoted){result.push(field);field=""}else field+=ch}result.push(field);return result};
    const headers=parse(lines.shift()||"").map(x=>x.trim().toLowerCase());
    if(!headers.includes("name")&&!headers.includes("client")){setNotice("CSV needs a name or client column.");return}
    const entries=lines.map(line=>Object.fromEntries(parse(line).map((v,i)=>[headers[i],v.trim()]))).map(r=>({name:r.name||r.client,email:r.email||"",phone:r.phone||"",company:r.company||"",status:r.status||"active"})).filter(r=>r.name);
    if(!entries.length){setNotice("No valid client rows found in CSV.");return}
    setSubmitting(true);let saved=0;let failed=0;
    for(const entry of entries){try{await businessSuiteApi.createCustomer(entry);saved++}catch{failed++}}
    setSubmitting(false);setNotice(`${saved} clients imported${failed?`; ${failed} failed (check API permissions or required fields)`:""}.`);await load();
  };
  const exportCsv=()=>{
    const columns=["name","company","email","phone","status","owner","outstanding","last_activity","next_follow_up"];
    const csv=[columns.join(","),...filteredRows.map(r=>columns.map(k=>`"${String(r[k]??"").replace(/"/g,'""')}"`).join(","))].join("\\r\\n");
    const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
    const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="business-suite-clients.csv";a.click();URL.revokeObjectURL(url);
  };
  return <section className="bsw-clients">
    <div className="bsw-clients-heading"><div><h2>{tr("title","Clients")}</h2><p>{tr("subtitle","Manage client information, billing and activity in one place.")}</p></div><div className="bsw-clients-actions"><button onClick={()=>fileInput?.click()}><Upload/>{tr("import","Import")}</button><input type="file" accept=".csv,text/csv" style={{display:"none"}} ref={setFileInput} onChange={importCsv}/><button className="primary" onClick={openAdd}><Plus/>{tr("add","Add Client")}</button></div></div>
    <div className="bsw-client-metrics">{metrics.map(([Icon,key,label,value,caption,tone])=><article key={key}><span className={`bsw-client-metric-icon ${tone}`}><Icon/></span><div><span>{tr(key,label)}</span><strong>{value==null?"—":key==="balance"?money(value):num(value)}</strong><small>{tr(`${key}Caption`,caption)}</small></div></article>)}</div>
    <div className="bsw-client-toolbar"><label className="bsw-client-search"><Search/><input value={query} onChange={e=>{setQuery(e.target.value);setPage(1)}} placeholder={tr("search","Search name, company, email or phone...")}/></label><select aria-label="Status" value={status} onChange={e=>{setStatus(e.target.value);setPage(1)}}><option value="">{tr("status","Status")}</option>{statusOptions.map(value=><option key={value} value={value}>{value}</option>)}</select><select aria-label="Owner" value={owner} onChange={e=>setOwner(e.target.value)}><option value="">Owner</option>{[...new Set(rows.map(r=>r.owner_name||r.owner).filter(Boolean))].map(x=><option key={x}>{x}</option>)}</select><select aria-label="Tags" value={tag} onChange={e=>setTag(e.target.value)}><option value="">Tags</option>{[...new Set(rows.flatMap(r=>Array.isArray(r.tags)?r.tags:typeof r.tags==="string"?r.tags.split(","):[]).filter(Boolean))].map(x=><option key={x}>{x}</option>)}</select><select aria-label="Last Activity" value={activityFilter} onChange={e=>setActivityFilter(e.target.value)}><option value="">Last Activity</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="none">No activity</option></select><button onClick={()=>setMoreFilters(x=>!x)}><Filter/>{tr("filters","More Filters")}</button><button className="accent" onClick={()=>setDialog("insights")}><Sparkles/>{tr("insights","AI Insights")}</button><button className="accent" onClick={()=>setDialog("review")}><Bot/>{tr("review","Run AI Review")}</button></div>
    {moreFilters&&<div className="bsw-client-extra-filters"><button onClick={()=>{setQuery("");setStatus("");setOwner("");setTag("");setActivityFilter("");setPage(1)}}>Clear all filters</button><span>Filters apply to loaded workspace clients.</span></div>}
    {notice&&<div className="bsw-client-notice" role="status">{notice}<button onClick={()=>setNotice("")}><X/></button></div>}
    <div className="bsw-client-table-wrap"><div className="bsw-client-count">{num(status||owner||tag||activityFilter?filteredRows.length:total)} {tr("clients","clients")}</div><div className="bsw-client-scroll"><table><thead><tr><th><input type="checkbox" aria-label="Select all clients" checked={filteredRows.length>0&&selected.length===filteredRows.length} onChange={e=>setSelected(e.target.checked?filteredRows.map((r,i)=>r.id??i):[])}/></th>{["Client / Company","Email / Phone","Status","Owner","Outstanding","Last Activity","Next Follow-Up","Actions"].map(k=><th key={k}>{tr(k,k)}</th>)}</tr></thead><tbody>{filteredRows.map((r,i)=><tr key={r.id??i}><td><input type="checkbox" checked={selected.includes(r.id??i)} onChange={e=>setSelected(old=>e.target.checked?[...old,r.id??i]:old.filter(x=>x!==(r.id??i)))}/></td><td><b>{r.name||r.customer_name||r.company_name||"—"}</b><small>{r.company||""}</small></td><td>{r.email||"—"}<small>{r.phone||""}</small></td><td>{r.status||"—"}</td><td>{r.owner_name||r.owner||"—"}</td><td>{r.outstanding==null?"—":money(r.outstanding)}</td><td>{r.last_activity||r.last_activity_at||"—"}</td><td>{r.next_follow_up||"—"}</td><td><button onClick={()=>{setDetail(r);setDialog("view")}}>{tr("view","View")}</button></td></tr>)}</tbody></table></div>
    {!busy&&!error&&!filteredRows.length&&<div className="bsw-client-empty"><span><UsersRound/></span><b>{tr("empty","No clients yet")}</b><p>{tr("emptyDesc","Add or import your first client to get started.")}</p><button className="primary" onClick={openAdd}><Plus/>{tr("add","Add Client")}</button></div>}
    {busy&&<div className="bsw-client-empty">{tr("loading","Loading clients...")}</div>}
    {error&&<div className="bsw-client-empty" role="alert">{error}<button onClick={load}>{tr("retry","Retry")}</button></div>}
    <footer><span>{tr("showing","Showing")} {total?((page-1)*limit+1):0} {tr("to","to")} {Math.min(page*limit,total)} {tr("of","of")} {total} {tr("clients","clients")}</span><div><button disabled={page===1} onClick={()=>setPage(p=>p-1)}><ChevronLeft/></button><span>{page}</span><button disabled={page*limit>=total} onClick={()=>setPage(p=>p+1)}><ChevronRight/></button><select value={limit} onChange={e=>{setLimit(Number(e.target.value));setPage(1)}}><option value={25}>25 / page</option><option value={50}>50 / page</option><option value={100}>100 / page</option></select></div></footer></div>
    {dialog&&<div className="bsw-overlay bsw-client-overlay" onMouseDown={e=>e.target===e.currentTarget&&setDialog(null)}><section className="bsw-modal bsw-client-dialog" role="dialog" aria-modal="true"><header><h2>{dialog==="add"?"Add Client":dialog==="view"?"Client Details":dialog==="insights"?"Client Insights":"Client Review"}</h2><button type="button" onClick={()=>setDialog(null)} aria-label="Close"><X/></button></header>
      {dialog==="add"&&<form onSubmit={saveClient}>{[["name","Name *"],["company","Company"],["email","Email"],["phone","Phone"]].map(([k,l])=><label key={k}><span>{l}</span><input required={k==="name"} type={k==="email"?"email":"text"} value={clientForm[k]} onChange={e=>setClientForm(f=>({...f,[k]:e.target.value}))}/></label>)}<label><span>Status</span><select value={clientForm.status} onChange={e=>setClientForm(f=>({...f,status:e.target.value}))}>{statusOptions.map(value=><option key={value} value={value}>{value}</option>)}{!statusOptions.some(value=>value.toLowerCase()==="active")&&<option value="active">Active</option>}</select></label>{formError&&<p className="bsw-error">{formError}</p>}<button className="primary" disabled={submitting}>{submitting?"Saving...":"Save Client"}</button></form>}
      {dialog==="view"&&<div className="bsw-client-details">{[["Name",detail?.name||detail?.customer_name],["Company",detail?.company||detail?.company_name],["Email",detail?.email],["Phone",detail?.phone],["Status",detail?.status],["Owner",detail?.owner_name||detail?.owner],["Outstanding",detail?.outstanding==null?"—":money(detail.outstanding)],["Last Activity",detail?.last_activity_at||detail?.last_activity],["Next Follow-Up",detail?.next_follow_up]].map(([k,v])=><div key={k}><b>{k}</b><span>{v||"—"}</span></div>)}</div>}
      {(dialog==="insights"||dialog==="review")&&<div className="bsw-client-details"><p>Summary calculated from currently loaded workspace client records. This is not an AI-generated assessment.</p><div><b>Loaded clients</b><span>{rows.length}</span></div><div><b>Active</b><span>{rows.filter(r=>String(r.status).toLowerCase()==="active").length}</span></div><div><b>Without an assigned owner</b><span>{rows.filter(r=>!r.owner&&!r.owner_name).length}</span></div><div><b>Without recent activity</b><span>{rows.filter(r=>!r.last_activity&&!r.last_activity_at).length}</span></div><p>AI-specific analysis requires a supported backend endpoint.</p></div>}
    </section></div>}
  </section>;
}

function Customers({summary,onOpen}) {
  return <section className="bsw-mobile-module blue"><ModuleTitle icon={UsersRound} title="Customers" subtitle="Manage your customers and relationships"/>
    <div className="bsw-module-cards">{CUSTOMER_ITEMS.map(([key,type,Icon,label,desc])=><button key={key} onClick={()=>onOpen(type)}><span className="bsw-module-icon"><Icon/></span><span><b>{label}</b><small>{desc}</small></span><em>{num(summary[key])}</em><ChevronRight/></button>)}</div>
    <button className="bsw-module-view" onClick={()=>onOpen('customers')}>View All Customers <ChevronRight/></button>
  </section>;
}

function ModuleTitle({icon:Icon,title,subtitle}) { return <header className="bsw-module-title"><div><Icon/></div><h2>{title}</h2><p>{subtitle}</p></header>; }

function Reports({reports,data,customerSummary,onOpen}) {
  const revenue=(reports?.revenue||[]).reduce((s,r)=>s+Number(r.amount||0),0);
  const items=[
    [BarChart3,'Sales Overview','Track revenue, sales and performance over time',money(revenue)],
    [Gauge,'Invoices Report','View invoice status and payment summaries',num(data.kpis.totalInvoices)],
    [CircleDollarSign,'Payments Report','Monitor payments received and outstanding',num(data.billing.payments)],
    [UsersRound,'Customers Report','Analyze customer growth and activity',num(customerSummary.allCustomers)],
    [ClipboardCheck,'Tasks Report','Track task completion and team productivity',num(data.kpis.openTasks)],
    [Layers3,'Export Data','Export your data and generate custom reports','Export'],
  ];
  return <section className="bsw-responsive-module bsw-reports-module orange"><ModuleTitle icon={BarChart3} title="Reports" subtitle="Track performance and analytics"/><div className="bsw-module-cards">{items.map(([Icon,label,desc,value])=><button key={label} onClick={()=>onOpen('reports')}><span className="bsw-module-icon"><Icon/></span><span><b>{label}</b><small>{desc}</small></span><em>{value}</em><ChevronRight/></button>)}</div><button className="bsw-module-view">View All Reports <ChevronRight/></button></section>;
}

function ActivityView({rows}) {
  return <section className="bsw-responsive-module bsw-activity-module cyan"><ModuleTitle icon={Activity} title="Activity" subtitle="Stay updated with recent activities"/><div className="bsw-activity-cards">{(rows||[]).map((r,i)=><article key={r.id||i}><span className="bsw-module-icon"><Activity/></span><span><b>{r.title||r.action||'Activity'}</b><small>{r.details||r.entity_type||''}</small></span><time>{timeAgo(r.created_at)}</time><ChevronRight/></article>)}{!rows?.length&&<p className="bsw-empty-inline">No activity yet.</p>}</div><button className="bsw-module-view">View All Activity <ChevronRight/></button></section>;
}

function ResourcePanel({type,onClose,onChanged}) {
  const [loading,setLoading]=useState(true),[rows,setRows]=useState([]),[search,setSearch]=useState("");
  const load=useCallback(async()=>{setLoading(true);try{let res;if(type==='documents')res=await businessSuiteApi.documents({search,limit:50});else if(type==='customers')res=await businessSuiteApi.customers({search,limit:50});else res=await businessSuiteApi.list(type,{search,limit:50});setRows(Array.isArray(res)?res:(res?.data||[]));}finally{setLoading(false)}},[type,search]);
  useEffect(()=>{load()},[load]);
  return <div className="bsw-overlay" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><section className="bsw-drawer"><header><div><h2>{type.replace(/([A-Z])/g,' $1').replace(/^./,s=>s.toUpperCase())}</h2><p>Workspace-scoped Business Suite records</p></div><button onClick={onClose}><X/></button></header><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..."/><div className="bsw-record-list">{loading?<p>Loading...</p>:rows.map((r,i)=><article key={r.id||i}><div><b>{r.title||r.name||r.customer_name||r.invoice_number||r.estimate_number||r.original_name||'Record'}</b><small>{r.status||r.email||r.description||r.notes||''}</small></div>{r.total!=null&&<strong>{money(r.total,r.currency||'USD')}</strong>}</article>)}{!loading&&!rows.length&&<p>No records found.</p>}</div></section></div>;
}

function CreateModal({type,onClose,onCreated}) {
  const [form,setForm]=useState({}),[saving,setSaving]=useState(false),[error,setError]=useState("");
  const fields=useMemo(()=>{
    if(type==='task')return [['title','Title'],['description','Description'],['dueDate','Due date']];
    if(type==='expense')return [['description','Description'],['amount','Amount'],['expense_date','Expense date']];
    if(type==='product'||type==='service')return [['name','Name'],['description','Description'],['price','Price']];
    if(type==='estimate'||type==='invoice')return [['customerName','Customer name'],['notes','Notes']];
    return [['title','Title'],['description','Description']];
  },[type]);
  const submit=async e=>{e.preventDefault();setSaving(true);setError("");try{let payload={...form};if(type==='estimate'||type==='invoice')payload={...payload,items:[]};await businessSuiteApi.create(type,payload);onCreated();onClose();}catch(err){setError(err?.message||'Unable to create record')}finally{setSaving(false)}};
  return <div className="bsw-overlay"><form className="bsw-modal" onSubmit={submit}><header><h2>New {type}</h2><button type="button" onClick={onClose}><X/></button></header>{fields.map(([name,label])=><label key={name}><span>{label}</span><input type={name.toLowerCase().includes('date')?'date':name==='amount'||name==='price'?'number':'text'} value={form[name]||''} onChange={e=>setForm({...form,[name]:e.target.value})}/></label>)}{error&&<p className="bsw-error">{error}</p>}<button className="bsw-btn bsw-new-btn" disabled={saving}>{saving?'Saving...':'Create'}</button></form></div>;
}

function SettingsView({settings,onSaved}) {
  const [form,setForm]=useState(settings||{}),[saving,setSaving]=useState(false);
  useEffect(()=>setForm(settings||{}),[settings]);
  const save=async()=>{setSaving(true);try{await businessSuiteApi.updateSettings({currency:form.currency,invoicePrefix:form.invoice_prefix,estimatePrefix:form.estimate_prefix,paymentTermsDays:form.payment_terms_days,taxRate:form.tax_rate});await onSaved();}finally{setSaving(false)}};
  return <section className="bsw-settings-panel"><ModuleTitle icon={Settings} title="Workspace Settings" subtitle="Business Suite billing and workspace preferences"/><div className="bsw-settings-grid">{[['currency','Currency'],['invoice_prefix','Invoice Prefix'],['estimate_prefix','Estimate Prefix'],['payment_terms_days','Payment Terms (days)'],['tax_rate','Tax Rate']].map(([k,l])=><label key={k}><span>{l}</span><input value={form[k]??''} onChange={e=>setForm({...form,[k]:e.target.value})}/></label>)}</div><button className="bsw-btn bsw-new-btn" onClick={save}>{saving?'Saving...':'Save Settings'}</button></section>;
}

export default function BusinessSuite(){
  const [mode,setMode]=useState('overview'),[overview,setOverview]=useState(EMPTY),[reports,setReports]=useState({}),[activity,setActivity]=useState([]),[customerSummary,setCustomerSummary]=useState({allCustomers:0,companies:0,contacts:0,customerGroups:0,segments:0}),[settings,setSettings]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[newOpen,setNewOpen]=useState(false),[createType,setCreateType]=useState(null),[resourceType,setResourceType]=useState(null);
  const load=useCallback(async()=>{setLoading(true);setError('');try{const [o,a,c]=await Promise.all([businessSuiteApi.overview(),businessSuiteApi.activity({limit:30}),businessSuiteApi.customersSummary()]);setOverview(o||EMPTY);setActivity(Array.isArray(a)?a:(a?.data||[]));setCustomerSummary(c||{});}catch(e){setError(e?.message||'Unable to load Business Suite');}finally{setLoading(false)}},[]);
  useEffect(()=>{load()},[load]);
  useEffect(()=>{if(mode==='reports')businessSuiteApi.reports({months:12}).then(setReports).catch(()=>{});if(mode==='settings')businessSuiteApi.settings().then(setSettings).catch(()=>{});},[mode]);
  const open=(target)=>{if(target==='clients'){setMode('clients');return;}if(['activity','reports','settings','customers','operations','billing','catalog'].includes(target)){setMode(target);return;}setResourceType(target)};
  const onNew=(type)=>{setNewOpen(false);setCreateType(type)};
  return <div className="bsw-page"><Header mode={mode} setMode={setMode} newOpen={newOpen} setNewOpen={setNewOpen} onNew={onNew}/>{error&&<div className="bsw-error-banner">{error}</div>}{loading?<div className="bsw-loading">Loading Business Suite…</div>:<>
    {mode==='overview'&&<Overview data={overview} clientCount={customerSummary.allCustomers ?? 0} onOpen={open}/>} 
    {mode==='operations'&&<Group standalone title="Operations" subtitle="Tasks, documents and team work" tone="purple" icon={Workflow} values={{...overview.operations,clients:customerSummary.allCustomers ?? 0}} items={GROUPS.operations} onOpen={open}/>} 
    {mode==='billing'&&<Group standalone title="Billing" subtitle="Quotes, invoices and payments" tone="green" icon={BriefcaseBusiness} values={overview.billing} items={GROUPS.billing} onOpen={open}/>} 
    {mode==='catalog'&&<Group standalone title="Catalog" subtitle="Products, services and pricing" tone="orange" icon={Boxes} values={overview.catalog} items={GROUPS.catalog} onOpen={open}/>} 
    {mode==='clients'&&<ClientsPage summary={customerSummary} onOpen={open}/>} 
    {mode==='customers'&&<Customers summary={customerSummary} onOpen={open}/>} 
    {mode==='reports'&&<Reports reports={reports} data={overview} customerSummary={customerSummary} onOpen={open}/>} 
    {mode==='activity'&&<ActivityView rows={activity}/>} 
    {mode==='settings'&&<SettingsView settings={settings} onSaved={async()=>setSettings(await businessSuiteApi.settings())}/>} 
  </>}
  
  {createType&&<CreateModal type={createType} onClose={()=>setCreateType(null)} onCreated={load}/>} {resourceType&&<ResourcePanel type={resourceType} onClose={()=>setResourceType(null)} onChanged={load}/>}</div>;
}
