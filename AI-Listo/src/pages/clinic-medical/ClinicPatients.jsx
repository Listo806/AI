import React,{useEffect,useMemo,useState} from "react";
import {useNavigate,useSearchParams} from "react-router-dom";
import {Users,CalendarDays,Mail,ClipboardList,Search,Filter,Download,Plus,MoreVertical,X} from "lucide-react";
import {clinicMedicalApi} from "../../api/clinicMedicalApi";
import "./ClinicMedical.css";

const date=v=>v?new Date(v).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}):"—";
const emptyForm={name:"",email:"",phone:"",dateOfBirth:"",gender:"",emergencyContact:"",emergencyPhone:"",insuranceProvider:"",insuranceMemberId:"",assignedProviderId:""};
const csv=(name,rows)=>{const esc=v=>`"${String(v??"").replaceAll('"','""')}"`;const body=rows.map(r=>r.map(esc).join(",")).join("\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([body],{type:"text/csv;charset=utf-8"}));a.download=name;a.click();URL.revokeObjectURL(a.href)};

export default function ClinicPatients(){
 const nav=useNavigate(),[sp]=useSearchParams();
 const [rows,setRows]=useState([]),[stats,setStats]=useState({}),[meta,setMeta]=useState({page:1,pages:1,total:0});
 const [search,setSearch]=useState(""),[status,setStatus]=useState("all"),[sort,setSort]=useState("updated_desc"),[loading,setLoading]=useState(true);
 const [show,setShow]=useState(false),[filters,setFilters]=useState(false),[form,setForm]=useState(emptyForm),[providers,setProviders]=useState([]),[saving,setSaving]=useState(false),[error,setError]=useState("");
 const followUp=sp.get("followUp")||"";
 const action=sp.get("action")||"";
 const view=sp.get("view")||"";
 const selectingConsultation=action==="start-consultation";
 const profilesView=view==="profiles";
 const load=async(page=1)=>{
  setLoading(true);
  setError("");
  try{
   const statsRes=await clinicMedicalApi.patientStats();
   const y=statsRes?.data??statsRes??{};
   setStats(y);

   const shouldFilterFollowUp=
    followUp==="yes" && Number(y?.followUpRequired||0)>0;

   const patientsRes=await clinicMedicalApi.patients({
    page,
    limit:7,
    search,
    status:status==="all"?"":status,
    sort,
    followUp:shouldFilterFollowUp?"yes":"",
   });

   const x=patientsRes?.data??patientsRes??{};
   setRows(Array.isArray(x?.items)?x.items:[]);
   setMeta(x?.meta||{page:1,pages:1,total:0});
  }catch(e){
   setError(e?.response?.data?.message||e?.message||"Could not load patients");
  }finally{
   setLoading(false);
  }
 };
 useEffect(()=>{clinicMedicalApi.providers().then(r=>setProviders((r?.data??r)||[])).catch(()=>{})},[]);
 useEffect(()=>{const t=setTimeout(()=>load(1),250);return()=>clearTimeout(t)},[search,status,sort,followUp]);
 const openPatient=async patient=>{
  if(!selectingConsultation){nav(`/dashboard/clinic-medical/patients/${patient.id}`);return}
  setSaving(true);setError("");
  try{const r=await clinicMedicalApi.createConsultation({patientId:patient.id});const z=r?.data??r;if(!z?.id)throw new Error("Consultation was created without an id");nav(`/dashboard/clinic-medical/consultations/${z.id}`)}catch(e){setError(e?.response?.data?.message||e?.message||"Could not start consultation")}finally{setSaving(false)}
 };
 const create=async e=>{e.preventDefault();if(!form.name.trim())return;setSaving(true);setError("");try{await clinicMedicalApi.createPatient(form);setShow(false);setForm(emptyForm);await load(1)}catch(e){setError(e?.response?.data?.message||e?.message||"Could not add patient")}finally{setSaving(false)}};
 const exportRows=()=>csv(`clinic-patients-${new Date().toISOString().slice(0,10)}.csv`,[["Patient","MRN","Email","Phone","Provider","Last Appointment","Next Appointment","Follow-Up","Balance","Status"],...rows.map(p=>[p.name,p.medicalRecordNo,p.email,p.phone,p.providerName,p.lastAppointment,p.nextAppointment,p.followUpRequired?"Yes":"No",p.balance,p.patientStatus])]);
 const pageButtons=useMemo(()=>{const n=Math.max(1,Number(meta.pages||1)),p=Math.max(1,Number(meta.page||1));return [...new Set([1,p-1,p,p+1,n])].filter(v=>v>=1&&v<=n)},[meta]);
 return <div className="cm patients">
  <div className="cm-top"><div className="cm-heading patient-title"><Plus/><div><h1>{profilesView?"Patient Profiles":"Patients"}</h1><p>{selectingConsultation?"Select a patient to start a clinical consultation.":profilesView?"Open a patient profile to review clinical history, appointments, consultations, medications, orders, and activity.":"Manage patient records, appointments, providers, and follow-up."}</p></div></div><div className="cm-actions"><button onClick={exportRows} disabled={!rows.length}><Download/>Export Patients</button><button className="primary" onClick={()=>setShow(true)}><Plus/>Add Patient</button></div></div>
  {error&&<div className="cm-error">{error}</div>}
  {selectingConsultation&&<div className="cm-selection-banner"><ClipboardList/><div><b>Start Clinical Consultation</b><span>Choose the patient for this encounter. A new consultation record will be created only after you select a patient.</span></div><button onClick={()=>nav("/dashboard/clinic-medical/patients")}>Cancel</button></div>}
  <div className="patient-kpis">{[["Total Patients",stats.totalPatients,Users],["Appointments Today",stats.appointmentsToday,CalendarDays],["Follow-Up Required",stats.followUpRequired,Mail],["Active Care Plans",stats.activeCarePlans,ClipboardList]].map(([l,v,I])=><div key={l}><I/><span>{l}<strong>{v??0}</strong><small>Live clinic data</small></span></div>)}</div>
  <div className="patient-tools"><label><Search/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search patients by name, phone, email, or medical record number..."/></label><select value={status} onChange={e=>setStatus(e.target.value)}><option value="all">All Patients</option><option value="Active">Active</option><option value="Follow-Up">Follow-Up</option><option value="Inactive">Inactive</option></select><button className={filters?"active-filter":""} onClick={()=>setFilters(v=>!v)}><Filter/>Filters</button><select value={sort} onChange={e=>setSort(e.target.value)}><option value="updated_desc">Sort: Recent</option><option value="name_asc">Name A-Z</option><option value="next_asc">Next Appointment</option></select></div>
  {filters&&<div className="cm-filterbar"><label><input type="checkbox" checked={followUp==="yes"} readOnly/> Follow-up filter {followUp==="yes"?"is active":"is not active"}</label>{followUp==="yes"&&<button onClick={()=>nav("/dashboard/clinic-medical/patients")}>Clear Follow-Up Filter</button>}<button onClick={()=>{setSearch("");setStatus("all");setSort("updated_desc")}}>Reset Filters</button></div>}
  <div className="patients-table"><div className="ptr pth"><span>Patient ↕</span><span>Medical Record No. ↕</span><span>Assigned Provider ↕</span><span>Last Appointment ↕</span><span>Next Appointment ↕</span><span>Follow-Up ↕</span><span>Balance ↕</span><span>Status ↕</span><span/></div>{loading?<div className="cm-empty">Loading patients…</div>:rows.length?rows.map(p=><div className="ptr" key={p.id} onClick={()=>!saving&&openPatient(p)}><span className="patient-cell"><i>{p.initials}</i><b>{p.name}<small>{p.phone||"—"}<br/>{p.email||"—"}</small></b></span><span>{p.medicalRecordNo||"—"}</span><span>{p.providerName||"Unassigned"}</span><span>{date(p.lastAppointment)}</span><span>{date(p.nextAppointment)}<small>{p.nextAppointmentLabel}</small></span><span className={p.followUpRequired?"yes":"no"}>{p.followUpRequired?"Yes":"No"}</span><span>${Number(p.balance||0).toFixed(0)}</span><span><i className={`patient-status ${String(p.patientStatus||"Active").toLowerCase().replaceAll(" ","-")}`}>{p.patientStatus||"Active"}</i></span><span><MoreVertical/></span></div>):<div className="cm-empty">No patients found.</div>}
   <footer><span>Showing {rows.length} of {meta.total||0} patients</span><div><button disabled={Number(meta.page||1)<=1} onClick={()=>load(Number(meta.page||1)-1)}>‹</button>{pageButtons.map(n=><button key={n} className={n===Number(meta.page||1)?"page-active":""} onClick={()=>load(n)}>{n}</button>)}<button disabled={Number(meta.page||1)>=Number(meta.pages||1)} onClick={()=>load(Number(meta.page||1)+1)}>›</button></div></footer>
  </div>
  {show&&<div className="cm-modal-bg" onMouseDown={()=>!saving&&setShow(false)}><form className="cm-modal cm-patient-modal" onMouseDown={e=>e.stopPropagation()} onSubmit={create}><div className="cm-modal-title"><h2>Add Patient</h2><button type="button" onClick={()=>setShow(false)}><X/></button></div>
   <label>Full Name<input autoFocus required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label>Email<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label><label>Phone<input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label><label>Date of Birth<input type="date" value={form.dateOfBirth} onChange={e=>setForm({...form,dateOfBirth:e.target.value})}/></label>
   <label>Gender<select value={form.gender} onChange={e=>setForm({...form,gender:e.target.value})}><option value="">Select</option><option>Female</option><option>Male</option><option>Non-binary</option><option>Prefer not to say</option></select></label><label>Assigned Provider<select value={form.assignedProviderId} onChange={e=>setForm({...form,assignedProviderId:e.target.value})}><option value="">Unassigned</option>{providers.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
   <label>Emergency Contact<input value={form.emergencyContact} onChange={e=>setForm({...form,emergencyContact:e.target.value})}/></label><label>Emergency Phone<input value={form.emergencyPhone} onChange={e=>setForm({...form,emergencyPhone:e.target.value})}/></label><label>Insurance Provider<input value={form.insuranceProvider} onChange={e=>setForm({...form,insuranceProvider:e.target.value})}/></label><label>Insurance Member ID<input value={form.insuranceMemberId} onChange={e=>setForm({...form,insuranceMemberId:e.target.value})}/></label>
   <div className="cm-modal-actions"><button type="button" onClick={()=>setShow(false)}>Cancel</button><button className="primary" disabled={saving}>{saving?"Adding…":"Add Patient"}</button></div></form></div>}
 </div>
}