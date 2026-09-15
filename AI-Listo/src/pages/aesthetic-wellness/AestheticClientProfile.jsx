import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Activity, ArrowLeft, CalendarDays, CreditCard, Edit2, FileText, Image,
  Mail, MessageCircle, Package, Phone, RefreshCw, Settings, Sparkles, User, Wallet
} from "lucide-react";
import aestheticClientsApi from "../../api/aestheticClientsApi";
import "./AestheticClients.css";

const unwrap = r => r?.data ?? r;
const money = n => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(Number(n||0));
const dt = v => v ? new Date(v).toLocaleString("en-US",{month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit"}) : "—";
const initials = n => String(n||"?").split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase();
const TABS=["Overview","Appointments","Treatments","Before & After Photos","Packages & Memberships","Forms & Consents","Billing","Notes","Activity"];

export default function AestheticClientProfile(){
  const {clientId}=useParams(), navigate=useNavigate();
  const [data,setData]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState("");
  const [tab,setTab]=useState("Overview"),[edit,setEdit]=useState(false),[saving,setSaving]=useState(false);

  const load=useCallback(async()=>{setLoading(true);setError("");
    try{setData(unwrap(await aestheticClientsApi.get(clientId)));}
    catch(e){setError(e?.message||"Unable to load client profile.");}
    finally{setLoading(false);}
  },[clientId]);
  useEffect(()=>{load();},[load]);

  if(loading)return <div className="awc-page awc-state">Loading client profile…</div>;
  if(error&&!data)return <div className="awc-page awc-state"><h3>{error}</h3><button className="awc-btn" onClick={load}>Retry</button></div>;

  const c=data?.client||{}, summary=data?.summary||{}, appointments=data?.appointments||[],
    treatments=data?.treatments||[], activity=data?.activity||[], perms=data?.permissions||{};
  const next=appointments.filter(a=>new Date(a.startAt)>new Date()).sort((a,b)=>new Date(a.startAt)-new Date(b.startAt))[0];

  const message=()=>navigate(`/dashboard/whatsapp?workspace_id=aesthetic-wellness&contact_id=${clientId}`);
  const book=()=>navigate(`/dashboard/calendar?workspace_id=aesthetic-wellness&action=new&contact_id=${clientId}`);
  const billing=()=>navigate(`/dashboard/billing?workspace_id=aesthetic-wellness&contact_id=${clientId}`);

  const save=async e=>{e.preventDefault();setSaving(true);setError("");
    try{await aestheticClientsApi.update(clientId,Object.fromEntries(new FormData(e.currentTarget).entries()));setEdit(false);await load();}
    catch(e){setError(e?.message||"Unable to update client.");}finally{setSaving(false);}
  };

  return <div className="awc-page awp-page">
    <button className="awp-back" onClick={()=>navigate("/dashboard/aesthetic-wellness/clients")}><ArrowLeft/>Back to Clients</button>
    <div className="awp-head"><div className="awp-person"><span className="awp-avatar">{initials(c.name)}</span>
      <div><div className="awp-name"><h1>{c.name}</h1><span className={`awc-status ${c.status||"active"}`}>{c.statusLabel||"Active"}</span></div>
      <p><Phone/>{c.phone||"—"} <Mail/>{c.email||"—"} <User/>Assigned Provider: {c.providerName||"Unassigned"}</p></div></div>
      <div className="awp-actions"><button className="awc-btn" onClick={message}><MessageCircle/>Send Message</button>
        <button className="awc-btn primary" onClick={book}><CalendarDays/>Book Appointment</button>
        {perms.canEdit!==false&&<button className="awc-btn" onClick={()=>setEdit(true)}><Edit2/>Edit Client</button>}</div>
    </div>

    <div className="awp-tabs">{TABS.map(x=><button key={x} className={tab===x?"active":""} onClick={()=>setTab(x)}>{x}</button>)}</div>
    {error&&<div className="awc-error">{error}</div>}

    {tab==="Overview"&&<>
      <div className="awp-stats">
        <div><Wallet/><span>Total Spent<b>{money(summary.totalSpent)}</b></span></div>
        <div><CalendarDays/><span>Appointments<b>{summary.appointmentCount||0}</b></span></div>
        <div><CalendarDays/><span>Next Appointment<b>{next?new Date(next.startAt).toLocaleDateString():"—"}</b></span></div>
        <div><RefreshCw/><span>Rebooking<b>{summary.rebookingText||"Not due"}</b></span></div>
      </div>
      <div className="awp-overview-grid">
        <section className="awp-card"><div className="awp-card-title"><User/>Client Information<button onClick={()=>setEdit(true)}>Edit</button></div>
          <dl><dt>Date of Birth</dt><dd>{c.dateOfBirth?new Date(c.dateOfBirth).toLocaleDateString():"—"}</dd>
          <dt>Preferred Contact</dt><dd>{c.preferredContact||"—"}</dd><dt>Phone</dt><dd>{c.phone||"—"}</dd>
          <dt>Referral Source</dt><dd>{c.referralSource||"—"}</dd><dt>Email</dt><dd>{c.email||"—"}</dd>
          <dt>Client Since</dt><dd>{c.createdAt?new Date(c.createdAt).toLocaleDateString():"—"}</dd></dl>
        </section>
        <section className="awp-card"><div className="awp-card-title"><CalendarDays/>Upcoming Appointment<button onClick={book}>View All Appointments</button></div>
          {next?<div className="awp-upcoming"><b>{next.title||next.treatmentName||"Appointment"}</b><p>{dt(next.startAt)}</p>
          <p>{next.providerName||"Unassigned"}</p><span className="awc-status active">{next.status||"Confirmed"}</span></div>:<p className="muted">No upcoming appointment.</p>}
        </section>
      </div>
      <div className="awp-bottom-grid">
        <section className="awp-card"><div className="awp-card-title"><Sparkles/>Recent Treatments</div><DataTable rows={treatments.slice(0,5)}
          cols={[["Treatment","treatmentName"],["Provider","providerName"],["Date","completedAt",dt],["Amount","revenue",money]]}/></section>
        <section className="awp-card"><div className="awp-card-title"><Settings/>Client Preferences & Alerts<button onClick={()=>setEdit(true)}>Edit</button></div>
          <h4>Preferences</h4><div className="awp-tags">{(c.preferences||[]).map(x=><span key={x}>{x}</span>)}</div>
          <h4>Alerts</h4><div className="awp-tags alerts">{(c.alerts||[]).map(x=><span key={x}>{x}</span>)}</div>
          <hr/><h4>Internal Note</h4><p className="awp-note">{c.internalNotes||"No internal note."}</p></section>
        <section className="awp-card"><div className="awp-card-title"><Activity/>Recent Activity</div>
          {activity.slice(0,5).map((a,i)=><div className="awp-activity" key={a.id||i}><span/><div><b>{a.title||a.action}</b>
          <small>{dt(a.createdAt)}</small><p>{a.sub||""}</p></div></div>)}</section>
      </div>
    </>}

    {tab==="Appointments"&&<Tab title="Appointments"><DataTable rows={appointments} cols={[["Appointment","title"],["Date","startAt",dt],["Provider","providerName"],["Status","status"]]}/></Tab>}
    {tab==="Treatments"&&<Tab title="Treatments"><DataTable rows={treatments} cols={[["Treatment","treatmentName"],["Provider","providerName"],["Date","completedAt",dt],["Amount","revenue",money],["Status","status"]]}/></Tab>}
    {tab==="Before & After Photos"&&<Linked icon={Image} title="Before & After Photos" text="Client media remains connected to the existing CRM storage records."/>}
    {tab==="Packages & Memberships"&&<Linked icon={Package} title="Packages & Memberships" text="Packages and memberships connected to this client appear here."/>}
    {tab==="Forms & Consents"&&<Linked icon={FileText} title="Forms & Consents" text="Forms and consent records remain attached to this client and workspace."/>}
    {tab==="Billing"&&<Linked icon={CreditCard} title="Billing" text={`Recorded treatment spend: ${money(summary.totalSpent)}`} action="Open Billing" onAction={billing}/>}
    {tab==="Notes"&&<Linked icon={FileText} title="Internal Notes" text={c.internalNotes||"No internal notes yet."} action="Edit Notes" onAction={()=>setEdit(true)}/>}
    {tab==="Activity"&&<Tab title="Activity History">{activity.length?activity.map((a,i)=><div className="awp-activity" key={a.id||i}><span/><div><b>{a.title||a.action}</b><small>{dt(a.createdAt)}</small><p>{a.sub||""}</p></div></div>):<p className="muted">No activity recorded.</p>}</Tab>}

    {edit&&<div className="awc-overlay"><form className="awc-modal" onSubmit={save}><h2>Edit Client</h2>
      <div className="awc-form-grid"><label>Full name *<input name="name" defaultValue={c.name||""}/></label>
      <label>Email *<input name="email" type="email" defaultValue={c.email||""}/></label>
      <label>Phone<input name="phone" defaultValue={c.phone||""}/></label>
      <label>Date of birth<input name="dateOfBirth" type="date" defaultValue={c.dateOfBirth?.slice?.(0,10)||""}/></label>
      <label>Preferred contact<select name="preferredContact" defaultValue={c.preferredContact||"sms"}><option value="sms">Text (SMS)</option><option value="email">Email</option><option value="phone">Phone</option><option value="whatsapp">WhatsApp</option></select></label>
      <label>Referral source<input name="referralSource" defaultValue={c.referralSource||""}/></label>
      <label>Treatment interest<input name="treatmentInterest" defaultValue={c.treatmentInterest||""}/></label>
      <label>Assigned provider<select name="providerId" defaultValue={c.providerId||""}><option value="">Unassigned</option>{(data.providers||[]).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <label className="span2">Preferences<input name="preferences" defaultValue={(c.preferences||[]).join(", ")}/></label>
      <label className="span2">Alerts<input name="alerts" defaultValue={(c.alerts||[]).join(", ")}/></label>
      <label className="span2">Internal notes<textarea name="internalNotes" defaultValue={c.internalNotes||""}/></label></div>
      <div className="awc-modal-actions"><button type="button" className="awc-btn" onClick={()=>setEdit(false)}>Cancel</button>
      <button className="awc-btn primary" disabled={saving}>{saving?"Saving…":"Save Changes"}</button></div>
    </form></div>}
  </div>;
}

function DataTable({rows=[],cols=[]}){return rows.length?<table className="awp-mini"><thead><tr>{cols.map(c=><th key={c[0]}>{c[0]}</th>)}</tr></thead>
<tbody>{rows.map((r,i)=><tr key={r.id||i}>{cols.map(([h,k,f])=><td key={k}>{f?f(r[k]):r[k]||"—"}</td>)}</tr>)}</tbody></table>:<p className="muted">No records found.</p>}
function Tab({title,children}){return <section className="awp-card awp-tab-card"><div className="awp-card-title"><Sparkles/>{title}</div>{children}</section>}
function Linked({icon:Icon,title,text,action,onAction}){return <section className="awp-card awp-linked"><Icon/><h2>{title}</h2><p>{text}</p>{action&&<button className="awc-btn primary" onClick={onAction}>{action}</button>}</section>}
