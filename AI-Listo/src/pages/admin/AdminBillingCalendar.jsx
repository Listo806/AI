import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, Bell, CalendarDays, ChevronLeft, ChevronRight,
  CircleCheckBig, CircleDollarSign, Clock3, Download, Filter,
  MoreHorizontal, RefreshCw, Search, Send, X,
} from "lucide-react";
import billingCalendarApi from "../../api/billingCalendarApi";
import "./AdminBillingCalendar.css";

const STATUS_META = {
  scheduled: { label: "Scheduled", color: "#2563eb" },
  paid: { label: "Paid", color: "#10b981" },
  failed: { label: "Failed", color: "#ef4444" },
  past_due: { label: "Past Due", color: "#f97316" },
  canceled: { label: "Canceled", color: "#64748b" },
  rescheduled: { label: "Rescheduled", color: "#7c3aed" },
};

const money=(v,c="USD")=>new Intl.NumberFormat(undefined,{style:"currency",currency:c,maximumFractionDigits:2}).format(Number(v||0));
const ymd=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const dayTitle=d=>new Intl.DateTimeFormat(undefined,{weekday:"long",month:"long",day:"numeric",year:"numeric"}).format(d);

function monthDays(month){
  const first=new Date(month.getFullYear(),month.getMonth(),1);
  const last=new Date(month.getFullYear(),month.getMonth()+1,0);
  const start=new Date(first); start.setDate(first.getDate()-first.getDay());
  const end=new Date(last); end.setDate(last.getDate()+(6-last.getDay()));
  const rows=[]; for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1))rows.push(new Date(d));
  return rows;
}

function StatusPill({status}){
  const m=STATUS_META[status]||STATUS_META.scheduled;
  return <span className={`abc-status ${status}`}><i style={{background:m.color}}/>{m.label}</span>;
}

function StatCard({tone,label,value,amount,active,onClick}){
  return <button className={`abc-day-stat ${tone} ${active?"active":""}`} onClick={onClick}>
    <strong>{value}</strong><span>{label}</span><b>{amount}</b>
  </button>;
}

export default function AdminBillingCalendar(){
  const [month,setMonth]=useState(()=>new Date());
  const [selectedDate,setSelectedDate]=useState(()=>new Date());
  const [view,setView]=useState("month");
  const [calendar,setCalendar]=useState({});
  const [overview,setOverview]=useState({});
  const [day,setDay]=useState({summary:{},customers:[],total:0,page:1,totalPages:1});
  const [upcoming,setUpcoming]=useState([]);
  const [activity,setActivity]=useState([]);
  const [exceptions,setExceptions]=useState({});
  const [status,setStatus]=useState("all");
  const [search,setSearch]=useState("");
  const [selectedIds,setSelectedIds]=useState([]);
  const [openMenu,setOpenMenu]=useState(null);
  const [quickDate,setQuickDate]=useState("");
  const [quickTime,setQuickTime]=useState("");
  const [error,setError]=useState("");
  const days=useMemo(()=>monthDays(month),[month]);

  const loadMonth=useCallback(async()=>{
    try{
      setError("");
      const mk=`${month.getFullYear()}-${String(month.getMonth()+1).padStart(2,"0")}`;
      const [m,o,u,a,e]=await Promise.all([
        billingCalendarApi.month(mk),
        billingCalendarApi.overview(mk),
        billingCalendarApi.upcoming({limit:5}),
        billingCalendarApi.activity({limit:5}),
        billingCalendarApi.exceptions()
      ]);
      const map={}; (m?.days||[]).forEach(x=>map[x.date]=x);
      setCalendar(map); setOverview(o||{});
      setUpcoming(u?.data||u||[]); setActivity(a?.data||a||[]); setExceptions(e||{});
    }catch(e){setError(e?.message||"Unable to load billing calendar.");}
  },[month]);

  const loadDay=useCallback(async(page=1)=>{
    const r=await billingCalendarApi.day(ymd(selectedDate),{
      page,limit:7,status:status==="all"?undefined:status,search:search||undefined
    });
    setDay(r||{summary:{},customers:[],total:0,page:1,totalPages:1});
  },[selectedDate,status,search]);

  useEffect(()=>{loadMonth()},[loadMonth]);
  useEffect(()=>{loadDay(1);setSelectedIds([])},[loadDay]);

  const selectDate=(d)=>{
    setSelectedDate(d);
    if(d.getMonth()!==month.getMonth()||d.getFullYear()!==month.getFullYear())
      setMonth(new Date(d.getFullYear(),d.getMonth(),1));
  };
  const toggleId=id=>setSelectedIds(v=>v.includes(id)?v.filter(x=>x!==id):[...v,id]);
  const toggleStatus=s=>setStatus(v=>v===s?"all":s);

  const bulkReschedule=async()=>{
    if(!selectedIds.length||!quickDate)return;
    if(!window.confirm(`Reschedule ${selectedIds.length} subscription(s) to ${quickDate}${quickTime?` at ${quickTime}`:""}?`))return;
    await billingCalendarApi.bulkReschedule({subscriptionIds:selectedIds,date:quickDate,time:quickTime||undefined});
    await Promise.all([loadMonth(),loadDay(day.page)]); setSelectedIds([]);
  };

  const s=day.summary||{};

  return <div className="abc-page">
    <div className="abc-title"><h1>Billing Calendar</h1><p>Manage Paddle billing schedules, subscriptions, and payment activity.</p></div>
    {error&&<div className="abc-error">{error}</div>}

    <section className="abc-kpis">
      <div><span>Monthly Revenue</span><strong>{money(overview.monthlyRevenue)}</strong><small>Current month</small></div>
      <div><span>Active Subscriptions</span><strong>{Number(overview.activeSubscriptions||0).toLocaleString()}</strong><small>Active in Paddle</small></div>
      <div><span>MRR Forecast (30 Days)</span><strong>{money(overview.mrrForecast)}</strong><small>Upcoming renewals</small></div>
      <div><span>Failed Payments</span><strong>{Number(overview.failedPayments||0).toLocaleString()}</strong><small>Needs attention</small></div>
      <div><span>Churn Rate</span><strong>{Number(overview.churnRate||0).toFixed(2)}%</strong><small>Current month</small></div>
    </section>

    <section className="abc-main">
      <article className="abc-calendar">
        <header><h2>Billing Calendar</h2><div className="abc-view">
          {["month","week","list"].map(x=><button key={x} className={view===x?"active":""} onClick={()=>setView(x)}>{x[0].toUpperCase()+x.slice(1)}</button>)}
          <button><Filter/></button>
        </div></header>

        <div className="abc-toolbar">
          <button onClick={()=>selectDate(new Date())}>Today</button>
          <button onClick={()=>setMonth(d=>new Date(d.getFullYear(),d.getMonth()-1,1))}><ChevronLeft/></button>
          <button onClick={()=>setMonth(d=>new Date(d.getFullYear(),d.getMonth()+1,1))}><ChevronRight/></button>
          <strong>{new Intl.DateTimeFormat(undefined,{month:"long",year:"numeric"}).format(month)}</strong>
        </div>

        <div className="abc-legend">
          {Object.entries(STATUS_META).map(([k,m])=><span key={k}><i style={{background:m.color}}/>{m.label}</span>)}
        </div>

        <div className="abc-week">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(x=><b key={x}>{x}</b>)}</div>
        <div className="abc-grid">
          {days.map(d=>{
            const key=ymd(d),info=calendar[key],outside=d.getMonth()!==month.getMonth(),active=key===ymd(selectedDate);
            return <button key={key} className={`abc-date ${outside?"outside":""} ${active?"active":""}`} onClick={()=>selectDate(d)}>
              <div><span>{d.getDate()}</span>{info?.customerCount!=null&&<em>{info.customerCount}</em>}</div>
              {info&&<><strong>{money(info.expectedAmount,info.currency||"USD")}</strong>
                <p>{(info.statuses||[]).map(x=><i key={x} style={{background:STATUS_META[x]?.color}}/>)}</p></>}
            </button>
          })}
        </div>
      </article>

      <aside className="abc-day-panel">
        <header className="abc-day-head"><h2>{dayTitle(selectedDate)}</h2><button onClick={()=>setStatus("all")}><X/>Close</button></header>
        <div className="abc-day-stats">
          <StatCard tone="scheduled" label="Scheduled" value={s.scheduled?.count||0} amount={money(s.scheduled?.amount)} active={status==="scheduled"} onClick={()=>toggleStatus("scheduled")}/>
          <StatCard tone="paid" label="Paid" value={s.paid?.count||0} amount={money(s.paid?.amount)} active={status==="paid"} onClick={()=>toggleStatus("paid")}/>
          <StatCard tone="failed" label="Failed" value={s.failed?.count||0} amount={money(s.failed?.amount)} active={status==="failed"} onClick={()=>toggleStatus("failed")}/>
          <StatCard tone="pastdue" label="Past Due" value={s.past_due?.count||0} amount={money(s.past_due?.amount)} active={status==="past_due"} onClick={()=>toggleStatus("past_due")}/>
        </div>

        <div className="abc-search"><div><Search/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search customers..."/></div><button><Filter/>Filters</button></div>

        <table className="abc-table"><thead><tr><th></th><th>Customer</th><th>Plan</th><th>Billing Time</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{(day.customers||[]).map(r=>{
            const id=r.subscriptionId||r.id;
            return <tr key={id}>
              <td><input type="checkbox" checked={selectedIds.includes(id)} onChange={()=>toggleId(id)}/></td>
              <td><div className="abc-customer"><span>{r.initials||(r.customerName||"?").slice(0,2).toUpperCase()}</span><div><b>{r.customerName}</b><small>{r.customerId}</small></div></div></td>
              <td><b>{r.planName}</b><small>{r.planPriceLabel}</small>{r.dueTodayDifferent&&<small className="abc-exception">Due today: {money(r.dueToday,r.currency||"USD")}</small>}</td>
              <td>{r.billingTime}</td><td><StatusPill status={r.status}/></td>
              <td className="abc-actions"><button onClick={()=>setOpenMenu(openMenu===id?null:id)}><MoreHorizontal/></button>
                {openMenu===id&&<div className="abc-menu">
                  <button onClick={()=>billingCalendarApi.openCustomer(r.customerId)}>View Customer</button>
                  <button onClick={()=>billingCalendarApi.openReschedule(r)}>Reschedule Billing</button>
                  <button onClick={()=>billingCalendarApi.openChangePlan(r.customerId)}>Change Plan</button>
                  <button onClick={()=>billingCalendarApi.pauseSubscription(id)}>Pause Subscription</button>
                  <button onClick={()=>billingCalendarApi.cancelSubscription(id)}>Cancel Subscription</button>
                  <button onClick={()=>billingCalendarApi.sendReminder(id)}>Send Reminder</button>
                  {r.refundEligible&&<button onClick={()=>billingCalendarApi.openRefund(r)}>Refund / Partial Refund</button>}
                  {r.retryEligible&&<button onClick={()=>billingCalendarApi.retryPayment(id)}>Retry Payment</button>}
                </div>}
              </td>
            </tr>
          })}</tbody>
        </table>

        <footer className="abc-pagination"><span>Showing {day.total?((day.page-1)*7)+1:0}–{Math.min(day.page*7,day.total||0)} of {day.total||0} customers</span>
          <div><button disabled={day.page<=1} onClick={()=>loadDay(day.page-1)}><ChevronLeft/></button><b>{day.page||1}</b><button disabled={day.page>=day.totalPages} onClick={()=>loadDay(day.page+1)}><ChevronRight/></button></div>
        </footer>
      </aside>
    </section>

    <section className="abc-bottom">
      <article className="abc-card"><header><h3>Upcoming Billing Days</h3><button>View all →</button></header>
        {(upcoming||[]).map(x=><button key={x.date} className="abc-row abc-upcoming" onClick={()=>selectDate(new Date(`${x.date}T12:00:00`))}><span>{x.label||x.date}</span><small>{x.customerCount} customers</small><b>{money(x.expectedAmount,x.currency||"USD")}</b></button>)}
      </article>

      <article className="abc-card"><header><h3>Recent Activity</h3><button>View all →</button></header>
        {(activity||[]).map((x,i)=><button key={x.id||i} className="abc-row abc-activity"><i><CircleCheckBig/></i><span><b>{x.title}</b><small>{x.customerName}</small></span><time>{x.timeAgo}</time><strong>{x.amountLabel}</strong></button>)}
      </article>

      <article className="abc-card"><header><h3>Billing Exceptions</h3><button>View all →</button></header>
        {[
          ["Failed Payments",exceptions.failedPayments,AlertTriangle],["Past Due",exceptions.pastDue,Clock3],
          ["Rescheduled",exceptions.rescheduled,CalendarDays],["Needs Review",exceptions.needsReview,Bell],["Refund Pending",exceptions.refundPending,RefreshCw]
        ].map(([label,count,Icon])=><button key={label} className="abc-row abc-ex-row"><i><Icon/></i><span>{label}</span><b>{Number(count||0).toLocaleString()}</b></button>)}
      </article>

      <article className="abc-card abc-bulk"><header><h3>Bulk Actions <span>({selectedIds.length} selected)</span></h3></header>
        <div className="abc-bulk-buttons">
          <button disabled={!selectedIds.length}><CalendarDays/>Reschedule</button>
          <button disabled={!selectedIds.length}><Send/>Send Reminder</button>
          <button disabled={!selectedIds.length}><RefreshCw/>Retry Failed</button>
          <button disabled={!selectedIds.length}><Download/>Export List</button>
        </div>
        <div className="abc-quick"><h4>Quick Reschedule</h4><div><span>Move selected to</span><input type="date" value={quickDate} onChange={e=>setQuickDate(e.target.value)}/><input type="time" value={quickTime} onChange={e=>setQuickTime(e.target.value)}/><button disabled={!selectedIds.length||!quickDate} onClick={bulkReschedule}>Reschedule</button></div>
          <small>Paddle confirms first; Cortexa updates only after confirmation.</small>
        </div>
      </article>
    </section>

    <footer className="abc-footer"><div><CircleDollarSign/>All billing schedule data is synchronized with Paddle.</div><div><span/>Paddle Status: Operational · Last sync: {overview.lastSyncLabel||"—"}<button onClick={loadMonth}><RefreshCw/></button></div></footer>
  </div>
}
