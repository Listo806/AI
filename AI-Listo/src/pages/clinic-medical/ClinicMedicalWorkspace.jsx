import React,{useEffect,useState} from "react";
import {useNavigate} from "react-router-dom";
import {Stethoscope,CalendarDays,MessageCircle,Users,Activity,DollarSign,RefreshCw,Bot,Filter,Download,Clock3,UserRound,Sparkles,TrendingUp} from "lucide-react";
import {clinicMedicalApi} from "../../api/clinicMedicalApi";
import "./ClinicMedical.css";

const fmtMoney=n=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(Number(n||0));
const fmtTime=v=>v?new Date(v).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"}):"—";
export default function ClinicMedicalWorkspace(){
 const nav=useNavigate(),[d,setD]=useState(null),[err,setErr]=useState("");
 useEffect(()=>{clinicMedicalApi.dashboard().then(r=>setD(r?.data??r)).catch(e=>setErr(e?.response?.data?.message||"Could not load clinic dashboard"));},[]);
 const metrics=d?.metrics||{};
 const cards=[
  ["New Patients",metrics.newPatients,metrics.newPatientsTrend,Users],
  ["Consultations Scheduled",metrics.consultationsScheduled,metrics.consultationsTrend,CalendarDays],
  ["Today's Appointments",metrics.todayAppointments,metrics.todayAppointmentsTrend,CalendarDays],
  ["Attendance Rate",`${metrics.attendanceRate??0}%`,metrics.attendanceTrend,Activity],
  ["Revenue Today",fmtMoney(metrics.revenueToday),metrics.revenueTrend,DollarSign],
  ["Follow-Up Due",metrics.followUpDue,metrics.followUpTrend,RefreshCw],
 ];
 return <div className="cm">
  <div className="cm-top"><div className="cm-heading"><Stethoscope/><div><h1>Clinic &amp; Medical Workspace</h1><p>Manage patients, consultations, appointments, clinical activity, and clinic operations.</p></div></div><div className="cm-actions"><button onClick={()=>nav("/dashboard/calendar?workspace_id=clinic-medical")}><CalendarDays/>Today</button><button><Filter/>Filters</button><button><Download/>Export</button></div></div>
  {err&&<div className="cm-error">{err}</div>}
  <section className="cm-ai"><div className="cm-ai-icon"><Bot/></div><div className="cm-ai-copy"><small>AI RECEPTIONIST</small><h2>Your clinic's AI agent is {d?.ai?.active?"active":"ready"} {d?.ai?.active&&<b>▶ Live</b>}</h2><p>Answering patient inquiries, qualifying visit reasons, and booking appointments.</p></div><div className="cm-ai-stat"><MessageCircle/><strong>{d?.ai?.conversationsToday??0}</strong><span>Conversations Today</span></div><div className="cm-ai-stat"><CalendarDays/><strong>{d?.ai?.consultationsBooked??0}</strong><span>Consultations Booked</span></div><div className="cm-ai-stat"><Sparkles/><strong>{d?.ai?.avgResponseSeconds?`${d.ai.avgResponseSeconds}s`:"—"}</strong><span>Avg Response</span></div><div className="cm-ai-buttons"><button className="primary" onClick={()=>nav("/dashboard/whatsapp?workspace_id=clinic-medical")}>View Conversations</button><button onClick={()=>nav("/dashboard/ai-cortexa?workspace_id=clinic-medical")}>Manage AI Agent</button></div></section>
  <div className="cm-kpis">{cards.map(([l,v,t,I])=><div className="cm-kpi" key={l}><I/><div><span>{l}</span><div><strong>{v??0}</strong><em className={Number(t)<0?"down":""}><TrendingUp/> {Number(t)>0?"+":""}{t??0}%</em></div><small>vs. previous period</small></div></div>)}</div>
  <div className="cm-main-grid">
   <section className="cm-panel schedule"><header><h3><CalendarDays/>Today's Clinical Schedule</h3><button onClick={()=>nav("/dashboard/calendar?workspace_id=clinic-medical")}>View All</button></header><div className="cm-table"><div className="tr th"><span>Time</span><span>Patient</span><span>Visit Reason</span><span>Provider</span><span>Status</span></div>{(d?.todaySchedule||[]).length?(d.todaySchedule.map(a=><div className="tr" key={a.id}><span>{fmtTime(a.startAt)}</span><button className="link" onClick={()=>a.patientId&&nav(`/dashboard/clinic-medical/patients/${a.patientId}`)}>{a.patientName||"Patient"}</button><span>{a.title}</span><span>{a.providerName||"Unassigned"}</span><span><i className={`status ${a.status}`}>{a.status}</i></span></div>)):<div className="cm-empty">No clinical appointments today.</div>}</div><footer><button onClick={()=>nav("/dashboard/calendar?workspace_id=clinic-medical")}><CalendarDays/>View Calendar</button><button className="primary" onClick={()=>nav("/dashboard/calendar?workspace_id=clinic-medical&action=new")} >⊕ Add Appointment</button></footer></section>
   <section className="cm-panel pipeline"><header><h3><Users/>Patient Pipeline</h3><button onClick={()=>nav("/dashboard/pipeline?workspace_id=clinic-medical")}>View Pipeline</button></header><div className="cm-stages">{Object.entries(d?.pipeline||{}).map(([k,v])=><div key={k}><span>{k.replaceAll("_"," ")}</span><strong>{v}</strong></div>)}</div><header className="sub"><h3><Clock3/>Patients Requiring Follow-Up</h3><button onClick={()=>nav("/dashboard/clinic-medical/patients?followUp=yes")}>View All</button></header><div className="cm-follow">{(d?.followUps||[]).length?d.followUps.slice(0,4).map(x=><div key={x.id}><button className="link" onClick={()=>nav(`/dashboard/clinic-medical/patients/${x.patientId}`)}>{x.patientName}</button><span>{x.reason}</span><b>{x.dueLabel}</b><button onClick={()=>nav(`/dashboard/whatsapp?workspace_id=clinic-medical&contact_id=${x.patientId}`)}>Send Reminder</button></div>):<div className="cm-empty small">No follow-ups due.</div>}</div></section>
   <section className="cm-panel reasons"><header><h3><Activity/>Visit Reasons</h3><span>Last 30 Days</span></header>{(d?.visitReasons||[]).map(x=><div className="reason" key={x.label}><label>{x.label}</label><i><b style={{width:`${x.percent}%`}}/></i><strong>{x.percent}%</strong></div>)}</section>
  </div>
  <div className="cm-bottom-grid">
   <section className="cm-panel"><header><h3><Users/>Provider Activity</h3><span>This Week</span></header><div className="provider-head"><span>Provider</span><span>Appointments</span><span>Patients Seen</span><span>Attendance</span></div>{(d?.providers||[]).map(x=><div className="provider-row" key={x.id}><b>{x.name}</b><span>{x.appointments}</span><span>{x.patientsSeen}</span><span>{x.attendance}%</span></div>)}</section>
   <section className="cm-panel"><header><h3><Activity/>Revenue Overview</h3><span>Last 7 Days</span></header><div className="revenue-total">{fmtMoney(d?.revenue?.total)} <em>↑ {d?.revenue?.trend??0}%</em></div><div className="sparkline">{(d?.revenue?.series||[0,0,0,0,0,0,0]).map((v,i)=><i key={i} style={{height:`${Math.max(5,(v/(d?.revenue?.max||1))*85)}%`}}/> )}</div></section>
   <section className="cm-panel"><header><h3><Sparkles/>AI Agent Activity</h3><button onClick={()=>nav("/dashboard/ai-cortexa?workspace_id=clinic-medical")}>View All</button></header><div className="activity-list">{(d?.aiActivity||[]).map(x=><div key={x.id}><time>{fmtTime(x.createdAt)}</time><span>{x.title}</span></div>)}</div><div className="cm-note">ⓘ Clinical inquiries are directed to your team as needed.</div></section>
  </div>
 </div>
}