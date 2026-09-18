import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Activity, ArrowLeft, CalendarDays, ChevronRight, CircleAlert, Clock3, CreditCard,
  Edit2, FileText, History, Image, Mail, MessageCircle, Package, Phone, RefreshCw,
  Send, Settings, SlidersHorizontal, Sparkles, Sun, User, Wallet
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


  const shortDate = v => v ? new Date(v).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric"
  }) : "—";
  const birthAge = c.dateOfBirth
    ? Math.max(0, Math.floor((Date.now() - new Date(c.dateOfBirth).getTime()) / 31557600000))
    : null;
  const treatmentRows = treatments.slice(0, 5);
  const activityRows = activity.slice(0, 4);

  const mobileProfile = (
    <div className="awp-mobile">
      {/* SCREEN 1 — Client profile / summary */}
      <section className="awpm-screen awpm-profile">
        <button className="awpm-back" onClick={() => navigate("/dashboard/aesthetic-wellness/clients")}>
          <ArrowLeft /> Client Directory
        </button>

        <div className="awpm-person">
          <span className="awpm-avatar">{initials(c.name)}</span>
          <h1>{c.name}</h1>
          <span className={`awc-status ${c.status || "active"}`}>{c.statusLabel || "Active"}</span>
          <p>{c.phone || "—"}</p>
          <p>{c.email || "—"}</p>
          <p className="awpm-provider">Assigned Provider: {c.providerName || "Unassigned"}</p>
        </div>

        <div className="awpm-actions">
          <button className="awpm-action" onClick={message}>
            <MessageCircle /><strong>Send Message</strong><ChevronRight />
          </button>
          <button className="awpm-action primary" onClick={book}>
            <CalendarDays /><strong>Book Appointment</strong><ChevronRight />
          </button>
          {perms.canEdit !== false && <button className="awpm-action" onClick={() => setEdit(true)}>
            <Edit2 /><strong>Edit Client</strong><ChevronRight />
          </button>}
        </div>

        <h2 className="awpm-heading">Profile Summary</h2>
        <div className="awpm-detail-list">
          <button><Wallet /><b>Total Spent</b><span>{money(summary.totalSpent)}</span><ChevronRight /></button>
          <button><CalendarDays /><b>Appointments</b><span>{summary.appointmentCount || 0}</span><ChevronRight /></button>
          <button onClick={() => setTab("Appointments")}><CalendarDays /><b>Next Appointment</b><span>{next ? shortDate(next.startAt) : "—"}</span><ChevronRight /></button>
          <button><RefreshCw /><b>Rebooking</b><span className="orange">{summary.rebookingText || "Not due"}</span><ChevronRight /></button>
        </div>

        <h2 className="awpm-heading">Client Information</h2>
        <div className="awpm-detail-list">
          <button><CalendarDays /><b>Date of Birth</b><span>{c.dateOfBirth ? <>{shortDate(c.dateOfBirth)}{birthAge !== null && <small>{birthAge} years old</small>}</> : "—"}</span><ChevronRight /></button>
          <button><Phone /><b>Phone</b><span>{c.phone || "—"}</span><ChevronRight /></button>
          <button><Mail /><b>Email</b><span>{c.email || "—"}</span><ChevronRight /></button>
          <button><MessageCircle /><b>Preferred Contact</b><span>{c.preferredContact || "—"}</span><ChevronRight /></button>
          <button><User /><b>Referral Source</b><span>{c.referralSource || "—"}</span><ChevronRight /></button>
          <button><CalendarDays /><b>Client Since</b><span>{c.createdAt ? shortDate(c.createdAt) : "—"}</span><ChevronRight /></button>
        </div>

        <button className="awpm-action awpm-continue" onClick={() => {
          document.querySelector(".awpm-appointments")?.scrollIntoView({ behavior: "smooth" });
        }}>
          <CalendarDays /><strong>Continue to Appointments &amp; Treatments</strong><ChevronRight />
        </button>
      </section>

      {/* SCREEN 2 — Appointments & Treatments */}
      <section className="awpm-screen awpm-appointments">
        
        <div className="awpm-screen-title">
          <span className="awpm-avatar">{initials(c.name)}</span>
          <h1>Appointments &amp; Treatments</h1>
          <p>{c.name}</p>
        </div>

        <h2 className="awpm-heading">Upcoming Appointment</h2>
        {next ? <div className="awpm-upcoming">
          <span className="awpm-upcoming-icon"><CalendarDays /></span>
          <div>
            <b>{next.title || next.treatmentName || "Appointment"}</b>
            <p>{dt(next.startAt)}</p>
            <p>{next.providerName || "Unassigned"}</p>
          </div>
          <span className="awc-status active">{next.status || "Confirmed"}</span>
        </div> : <div className="awpm-empty">No upcoming appointment.</div>}

        <div className="awpm-actions">
          <button className="awpm-action" onClick={() => setTab("Appointments")}>
            <CalendarDays /><strong>View Appointment</strong><ChevronRight />
          </button>
          <button className="awpm-action" onClick={() => setTab("Appointments")}>
            <CalendarDays /><strong>View All Appointments</strong><ChevronRight />
          </button>
        </div>

        <h2 className="awpm-heading awpm-treatment-title">Recent Treatments</h2>
        <p className="awpm-count">{treatments.length} treatments</p>

        <div className="awpm-treatment-list">
          {treatmentRows.length ? treatmentRows.map((t, i) => (
            <button key={t.id || i}>
              <Sparkles />
              <span><b>{t.treatmentName || "Treatment"}</b><small>{t.providerName || "Unassigned"} &nbsp;·&nbsp; {shortDate(t.completedAt)}</small></span>
              <strong>{money(t.revenue)}</strong>
              <ChevronRight />
            </button>
          )) : <div className="awpm-empty">No treatments recorded.</div>}
        </div>

        <button className="awpm-action awpm-view-all" onClick={() => setTab("Treatments")}>
          <History /><strong>View All Treatments</strong><ChevronRight />
        </button>
        <button className="awpm-action primary awpm-continue" onClick={() => {
          document.querySelector(".awpm-preferences")?.scrollIntoView({ behavior: "smooth" });
        }}>
          <SlidersHorizontal /><strong>Continue to Preferences &amp; Activity</strong><ChevronRight />
        </button>
      </section>

      {/* SCREEN 3 — Preferences & Activity */}
      <section className="awpm-screen awpm-preferences">
        
        <div className="awpm-screen-title">
          <span className="awpm-avatar">{initials(c.name)}</span>
          <h1>Preferences &amp; Activity</h1>
          <p>{c.name}</p>
        </div>

        <section className="awpm-box">
          <div className="awpm-box-title">
            <Settings /><h2>Client Preferences &amp; Alerts</h2>
            {perms.canEdit !== false && <button onClick={() => setEdit(true)}>Edit</button>}
          </div>
          <div className="awpm-detail-list nested">
            <button><MessageCircle /><div><b>Preferred Contact</b><span>{c.preferredContact || "—"}</span></div><ChevronRight /></button>
            <button><Sun /><div><b>Appointment Preference</b><span>{(c.preferences || [])[0] || "—"}</span></div><ChevronRight /></button>
            <button><CircleAlert /><div><b>Client Alert</b><span>{(c.alerts || [])[0] || "—"}</span></div><ChevronRight /></button>
          </div>
        </section>

        <section className="awpm-box awpm-note-box">
          <div className="awpm-box-title"><FileText /><h2>Internal Note</h2></div>
          <p className="awpm-note">{c.internalNotes || "No internal note."}</p>
          <button className="awpm-action" onClick={() => setEdit(true)}>
            <Edit2 /><strong>Edit Internal Note</strong><ChevronRight />
          </button>
        </section>

        <section className="awpm-box">
          <div className="awpm-box-title"><Activity /><h2>Recent Activity</h2></div>
          <div className="awpm-activity-list">
            {activityRows.length ? activityRows.map((a, i) => (
              <button key={a.id || i}>
                <span className={`awpm-activity-icon i${i % 4}`}>
                  {i % 4 === 0 ? <CalendarDays /> : i % 4 === 1 ? <Send /> : i % 4 === 2 ? <CreditCard /> : <Clock3 />}
                </span>
                <span><b>{a.title || a.action}</b><small>{dt(a.createdAt)}</small><p>{a.sub || ""}</p></span>
                <ChevronRight />
              </button>
            )) : <div className="awpm-empty">No activity recorded.</div>}
          </div>

          <button className="awpm-action awpm-view-all" onClick={() => setTab("Activity")}>
            <History /><strong>View All Activity</strong><ChevronRight />
          </button>
          <button className="awpm-action awpm-back-clients" onClick={() => navigate("/dashboard/aesthetic-wellness/clients")}>
            <ArrowLeft /><strong>Back to Clients</strong><ChevronRight />
          </button>
        </section>
      </section>
    </div>
  );

  return <div className="awc-page awp-page">
    <div className="awp-desktop">
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

    </div>

    {mobileProfile}

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
