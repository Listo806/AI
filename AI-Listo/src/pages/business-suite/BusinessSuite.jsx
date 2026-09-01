import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Activity, BarChart3, Boxes, BriefcaseBusiness, Building2, ChevronDown,
  ChevronRight, CircleDollarSign, ClipboardCheck, Clock3, ContactRound,
  CreditCard, FileText, FolderKanban, Gauge, Home, ListChecks, Package,
  Plus, ReceiptText, Settings, SlidersHorizontal, Tags, UsersRound,
  WalletCards, X, Wrench, Workflow, Layers3, CalendarDays
} from "lucide-react";
import businessSuiteApi from "../../api/businessSuiteApi";
import "./BusinessSuite.css";

const EMPTY = {
  kpis: { totalInvoices:0, paidAmount:0, outstandingAmount:0, outstandingInvoices:0, openTasks:0, overdueTasks:0, estimatesSent:0, estimatesAmount:0 },
  operations: { tasks:0, followUps:0, documents:0, workItems:0 },
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
      {[['overview',Gauge,'Overview'],['reports',BarChart3,'Reports'],['activity',Activity,'Activity']].map(([id,Icon,label])=><button key={id} className={mode===id?'active':''} onClick={()=>setMode(id)}><Icon/>{label}</button>)}
    </nav>
  </>;
}

function MetricCard({ icon:Icon, tone, label, value, rightTop, rightBottom }) {
  return <article className={`bsw-metric ${tone}`}><div className="bsw-metric-icon"><Icon/></div><div className="bsw-metric-main"><span>{label}</span><strong>{value}</strong></div><div className="bsw-metric-side"><b>{rightTop}</b><span>{rightBottom}</span></div></article>;
}

function Overview({ data, onOpen }) {
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
      <Group title="Operations" subtitle="Tasks, documents and team work" tone="purple" icon={Workflow} values={data.operations} items={GROUPS.operations} onOpen={onOpen}/>
      <Group title="Billing" subtitle="Quotes, invoices and payments" tone="green" icon={BriefcaseBusiness} values={data.billing} items={GROUPS.billing} onOpen={onOpen}/>
      <Group title="Catalog" subtitle="Products, services and pricing" tone="orange" icon={Boxes} values={data.catalog} items={GROUPS.catalog} onOpen={onOpen}/>
    </div>

    {/* Tablet/mobile Overview keeps all three workspace blocks visible.
        This is intentionally separate from the desktop 3-column layout. */}
    <div className="bsw-mobile-overview-sections">
      <Group standalone title="Operations" subtitle="Tasks, documents and team work" tone="purple" icon={Workflow} values={data.operations} items={GROUPS.operations} onOpen={onOpen}/>
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
  return <section className="bsw-mobile-module orange"><ModuleTitle icon={BarChart3} title="Reports" subtitle="Track performance and analytics"/><div className="bsw-module-cards">{items.map(([Icon,label,desc,value])=><button key={label} onClick={()=>onOpen('reports')}><span className="bsw-module-icon"><Icon/></span><span><b>{label}</b><small>{desc}</small></span><em>{value}</em><ChevronRight/></button>)}</div><button className="bsw-module-view">View All Reports <ChevronRight/></button></section>;
}

function ActivityView({rows}) {
  return <section className="bsw-mobile-module cyan"><ModuleTitle icon={Activity} title="Activity" subtitle="Stay updated with recent activities"/><div className="bsw-activity-cards">{(rows||[]).map((r,i)=><article key={r.id||i}><span className="bsw-module-icon"><Activity/></span><span><b>{r.title||r.action||'Activity'}</b><small>{r.details||r.entity_type||''}</small></span><time>{timeAgo(r.created_at)}</time><ChevronRight/></article>)}{!rows?.length&&<p className="bsw-empty-inline">No activity yet.</p>}</div><button className="bsw-module-view">View All Activity <ChevronRight/></button></section>;
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
  const open=(target)=>{if(['activity','reports','settings','customers','operations','billing','catalog'].includes(target)){setMode(target);return;}setResourceType(target)};
  const onNew=(type)=>{setNewOpen(false);setCreateType(type)};
  return <div className="bsw-page"><Header mode={mode} setMode={setMode} newOpen={newOpen} setNewOpen={setNewOpen} onNew={onNew}/>{error&&<div className="bsw-error-banner">{error}</div>}{loading?<div className="bsw-loading">Loading Business Suite…</div>:<>
    {mode==='overview'&&<Overview data={overview} onOpen={open}/>} 
    {mode==='operations'&&<Group standalone title="Operations" subtitle="Tasks, documents and team work" tone="purple" icon={Workflow} values={overview.operations} items={GROUPS.operations} onOpen={open}/>} 
    {mode==='billing'&&<Group standalone title="Billing" subtitle="Quotes, invoices and payments" tone="green" icon={BriefcaseBusiness} values={overview.billing} items={GROUPS.billing} onOpen={open}/>} 
    {mode==='catalog'&&<Group standalone title="Catalog" subtitle="Products, services and pricing" tone="orange" icon={Boxes} values={overview.catalog} items={GROUPS.catalog} onOpen={open}/>} 
    {mode==='customers'&&<Customers summary={customerSummary} onOpen={open}/>} 
    {mode==='reports'&&<Reports reports={reports} data={overview} customerSummary={customerSummary} onOpen={open}/>} 
    {mode==='activity'&&<ActivityView rows={activity}/>} 
    {mode==='settings'&&<SettingsView settings={settings} onSaved={async()=>setSettings(await businessSuiteApi.settings())}/>} 
  </>}
  
  {createType&&<CreateModal type={createType} onClose={()=>setCreateType(null)} onCreated={load}/>} {resourceType&&<ResourcePanel type={resourceType} onClose={()=>setResourceType(null)} onChanged={load}/>}</div>;
}
