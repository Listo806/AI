import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, Bell, CalendarDays, ChevronLeft, ChevronRight,
  CircleCheckBig, CircleDollarSign, Clock3, Download, Filter,
  MoreHorizontal, RefreshCw, Search, Send, X,
  BadgeDollarSign, CreditCard, TrendingUp, UserRoundX,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import billingCalendarApi from "../../api/billingCalendarApi";
import "./AdminBillingCalendar.css";

const STATUS_META = {
  scheduled: { labelKey: "scheduled", color: "#2563eb" },
  paid: { labelKey: "paid", color: "#10b981" },
  failed: { labelKey: "failed", color: "#ef4444" },
  past_due: { labelKey: "pastDue", color: "#f97316" },
  canceled: { labelKey: "canceled", color: "#64748b" },
  rescheduled: { labelKey: "rescheduled", color: "#7c3aed" },
};

const money=(v,c="USD",locale)=>new Intl.NumberFormat(locale,{style:"currency",currency:c,maximumFractionDigits:2}).format(Number(v||0));
const ymd=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const dayTitle=(d,locale)=>new Intl.DateTimeFormat(locale,{weekday:"long",month:"long",day:"numeric",year:"numeric"}).format(d);

function monthDays(month){
  const first=new Date(month.getFullYear(),month.getMonth(),1);
  const last=new Date(month.getFullYear(),month.getMonth()+1,0);
  const start=new Date(first); start.setDate(first.getDate()-first.getDay());
  const end=new Date(last); end.setDate(last.getDate()+(6-last.getDay()));
  const rows=[]; for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1))rows.push(new Date(d));
  return rows;
}

function StatusPill({status,t}){
  const m=STATUS_META[status]||STATUS_META.scheduled;
  return <span className={`abc-status ${status}`}><i style={{background:m.color}}/>{t(`adminBillingCalendar.status.${m.labelKey}`)}</span>;
}

function StatCard({tone,label,value,amount,active,onClick}){
  return <button className={`abc-day-stat ${tone} ${active?"active":""}`} onClick={onClick}>
    <strong>{value}</strong><span>{label}</span><b>{amount}</b>
  </button>;
}

export default function AdminBillingCalendar(){
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage || i18n.language || undefined;
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
    <div className="abc-title"><h1>{t("adminBillingCalendar.title")}</h1><p>{t("adminBillingCalendar.subtitle")}</p></div>
    {error&&<div className="abc-error">{error}</div>}

    <section className="abc-kpis">
      <div className="abc-kpi abc-kpi-purple">
        <div className="abc-kpi-copy"><span>{t("adminBillingCalendar.kpis.monthlyRevenue")}</span><strong>{money(overview.monthlyRevenue,"USD",locale)}</strong><small>{t("adminBillingCalendar.kpis.currentMonth")}</small></div>
        <i className="abc-kpi-icon"><BadgeDollarSign/></i>
      </div>
      <div className="abc-kpi abc-kpi-green">
        <div className="abc-kpi-copy"><span>{t("adminBillingCalendar.kpis.activeSubscriptions")}</span><strong>{Number(overview.activeSubscriptions||0).toLocaleString(locale)}</strong><small>{t("adminBillingCalendar.kpis.activeInPaddle")}</small></div>
        <i className="abc-kpi-icon"><CreditCard/></i>
      </div>
      <div className="abc-kpi abc-kpi-blue">
        <div className="abc-kpi-copy"><span>{t("adminBillingCalendar.kpis.mrrForecast")}</span><strong>{money(overview.mrrForecast,"USD",locale)}</strong><small>{t("adminBillingCalendar.kpis.upcomingRenewals")}</small></div>
        <i className="abc-kpi-icon"><TrendingUp/></i>
      </div>
      <div className="abc-kpi abc-kpi-orange">
        <div className="abc-kpi-copy"><span>{t("adminBillingCalendar.kpis.failedPayments")}</span><strong>{Number(overview.failedPayments||0).toLocaleString(locale)}</strong><small>{t("adminBillingCalendar.kpis.needsAttention")}</small></div>
        <i className="abc-kpi-icon"><AlertTriangle/></i>
      </div>
      <div className="abc-kpi abc-kpi-violet">
        <div className="abc-kpi-copy"><span>{t("adminBillingCalendar.kpis.churnRate")}</span><strong>{Number(overview.churnRate||0).toFixed(2)}%</strong><small>{t("adminBillingCalendar.kpis.currentMonth")}</small></div>
        <i className="abc-kpi-icon"><UserRoundX/></i>
      </div>
    </section>

    <section className="abc-main">
      <article className="abc-calendar">
        <header><h2>{t("adminBillingCalendar.title")}</h2><div className="abc-view">
          {["month","week","list"].map(x=><button key={x} className={view===x?"active":""} onClick={()=>setView(x)}>{t(`adminBillingCalendar.views.${x}`)}</button>)}
          <button><Filter/></button>
        </div></header>

        <div className="abc-toolbar">
          <button onClick={()=>selectDate(new Date())}>{t("common.today")}</button>
          <button onClick={()=>setMonth(d=>new Date(d.getFullYear(),d.getMonth()-1,1))}><ChevronLeft/></button>
          <button onClick={()=>setMonth(d=>new Date(d.getFullYear(),d.getMonth()+1,1))}><ChevronRight/></button>
          <strong>{new Intl.DateTimeFormat(locale,{month:"long",year:"numeric"}).format(month)}</strong>
        </div>

        <div className="abc-legend">
          {Object.entries(STATUS_META).map(([k,m])=><span key={k}><i style={{background:m.color}}/>{t(`adminBillingCalendar.status.${m.labelKey}`)}</span>)}
        </div>

        <div className="abc-week">{["sun","mon","tue","wed","thu","fri","sat"].map(x=><b key={x}>{t(`adminBillingCalendar.weekdays.${x}`)}</b>)}</div>
        <div className="abc-grid">
          {days.map(d=>{
            const key=ymd(d),info=calendar[key],outside=d.getMonth()!==month.getMonth(),active=key===ymd(selectedDate);
            return <button key={key} className={`abc-date ${outside?"outside":""} ${active?"active":""}`} onClick={()=>selectDate(d)}>
              <div><span>{d.getDate()}</span>{info?.customerCount!=null&&<em>{info.customerCount}</em>}</div>
              {info&&<><strong>{money(info.expectedAmount,info.currency||"USD",locale)}</strong>
                <p>{(info.statuses||[]).map(x=><i key={x} style={{background:STATUS_META[x]?.color}}/>)}</p></>}
            </button>
          })}
        </div>
      </article>

      <aside className="abc-day-panel">
        <header className="abc-day-head"><h2>{dayTitle(selectedDate,locale)}</h2><button onClick={()=>setStatus("all")}><X/>{t("common.close")}</button></header>
        <div className="abc-day-stats">
          <StatCard tone="scheduled" label={t("adminBillingCalendar.status.scheduled")} value={s.scheduled?.count||0} amount={money(s.scheduled?.amount,"USD",locale)} active={status==="scheduled"} onClick={()=>toggleStatus("scheduled")}/>
          <StatCard tone="paid" label={t("adminBillingCalendar.status.paid")} value={s.paid?.count||0} amount={money(s.paid?.amount,"USD",locale)} active={status==="paid"} onClick={()=>toggleStatus("paid")}/>
          <StatCard tone="failed" label={t("adminBillingCalendar.status.failed")} value={s.failed?.count||0} amount={money(s.failed?.amount,"USD",locale)} active={status==="failed"} onClick={()=>toggleStatus("failed")}/>
          <StatCard tone="pastdue" label={t("adminBillingCalendar.status.pastDue")} value={s.past_due?.count||0} amount={money(s.past_due?.amount,"USD",locale)} active={status==="past_due"} onClick={()=>toggleStatus("past_due")}/>
        </div>

        <div className="abc-search"><div><Search/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t("adminBillingCalendar.searchCustomers")}/></div><button><Filter/>{t("adminBillingCalendar.filters")}</button></div>

        <table className="abc-table"><thead><tr><th></th><th>{t("adminBillingCalendar.table.customer")}</th><th>{t("adminBillingCalendar.table.plan")}</th><th>{t("adminBillingCalendar.table.billingTime")}</th><th>{t("common.status")}</th><th>{t("common.actions")}</th></tr></thead>
          <tbody>{(day.customers||[]).map(r=>{
            const id=r.subscriptionId||r.id;
            return <tr key={id}>
              <td><input type="checkbox" checked={selectedIds.includes(id)} onChange={()=>toggleId(id)}/></td>
              <td><div className="abc-customer"><span>{r.initials||(r.customerName||"?").slice(0,2).toUpperCase()}</span><div><b>{r.customerName}</b><small>{r.customerId}</small></div></div></td>
              <td><b>{r.planName}</b><small>{r.planPriceLabel}</small>{r.dueTodayDifferent&&<small className="abc-exception">Due today: {money(r.dueToday,r.currency||"USD")}</small>}</td>
              <td>{r.billingTime}</td><td><StatusPill status={r.status} t={t}/></td>
              <td className="abc-actions"><button onClick={()=>setOpenMenu(openMenu===id?null:id)}><MoreHorizontal/></button>
                {openMenu===id&&<div className="abc-menu">
                  <button onClick={()=>billingCalendarApi.openCustomer(r.customerId)}>{t("adminBillingCalendar.actions.viewCustomer")}</button>
                  <button onClick={()=>billingCalendarApi.openReschedule(r)}>{t("adminBillingCalendar.actions.rescheduleBilling")}</button>
                  <button onClick={()=>billingCalendarApi.openChangePlan(r.customerId)}>{t("adminBillingCalendar.actions.changePlan")}</button>
                  <button onClick={()=>billingCalendarApi.pauseSubscription(id)}>{t("adminBillingCalendar.actions.pauseSubscription")}</button>
                  <button onClick={()=>billingCalendarApi.cancelSubscription(id)}>{t("adminBillingCalendar.actions.cancelSubscription")}</button>
                  <button onClick={()=>billingCalendarApi.sendReminder(id)}>{t("adminBillingCalendar.actions.sendReminder")}</button>
                  {r.refundEligible&&<button onClick={()=>billingCalendarApi.openRefund(r)}>{t("adminBillingCalendar.actions.refund")}</button>}
                  {r.retryEligible&&<button onClick={()=>billingCalendarApi.retryPayment(id)}>{t("adminBillingCalendar.actions.retryPayment")}</button>}
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
      <article className="abc-card"><header><h3>{t("adminBillingCalendar.sections.upcomingBillingDays")}</h3><button>{t("adminBillingCalendar.viewAll")} →</button></header>
        {(upcoming||[]).map(x=><button key={x.date} className="abc-row abc-upcoming" onClick={()=>selectDate(new Date(`${x.date}T12:00:00`))}><span>{x.label||x.date}</span><small>{x.customerCount} customers</small><b>{money(x.expectedAmount,x.currency||"USD")}</b></button>)}
      </article>

      <article className="abc-card"><header><h3>{t("adminBillingCalendar.sections.recentActivity")}</h3><button>{t("adminBillingCalendar.viewAll")} →</button></header>
        {(activity||[]).map((x,i)=><button key={x.id||i} className="abc-row abc-activity"><i><CircleCheckBig/></i><span><b>{x.title}</b><small>{x.customerName}</small></span><time>{x.timeAgo}</time><strong>{x.amountLabel}</strong></button>)}
      </article>

      <article className="abc-card"><header><h3>{t("adminBillingCalendar.sections.billingExceptions")}</h3><button>{t("adminBillingCalendar.viewAll")} →</button></header>
        {[
          [t("adminBillingCalendar.exceptions.failedPayments"),exceptions.failedPayments,AlertTriangle],[t("adminBillingCalendar.exceptions.pastDue"),exceptions.pastDue,Clock3],
          [t("adminBillingCalendar.exceptions.rescheduled"),exceptions.rescheduled,CalendarDays],[t("adminBillingCalendar.exceptions.needsReview"),exceptions.needsReview,Bell],["Refund Pending",exceptions.refundPending,RefreshCw]
        ].map(([label,count,Icon])=><button key={label} className="abc-row abc-ex-row"><i><Icon/></i><span>{label}</span><b>{Number(count||0).toLocaleString()}</b></button>)}
      </article>

      <article className="abc-card abc-bulk"><header><h3>{t("adminBillingCalendar.sections.bulkActions")} <span>({selectedIds.length} selected)</span></h3></header>
        <div className="abc-bulk-buttons">
          <button disabled={!selectedIds.length}><CalendarDays/>{t("adminBillingCalendar.actions.reschedule")}</button>
          <button disabled={!selectedIds.length}><Send/>{t("adminBillingCalendar.actions.sendReminder")}</button>
          <button disabled={!selectedIds.length}><RefreshCw/>{t("adminBillingCalendar.actions.retryFailed")}</button>
          <button disabled={!selectedIds.length}><Download/>{t("adminBillingCalendar.actions.exportList")}</button>
        </div>
        <div className="abc-quick"><h4>{t("adminBillingCalendar.quickReschedule")}</h4><div><span>{t("adminBillingCalendar.moveSelectedTo")}</span><input type="date" value={quickDate} onChange={e=>setQuickDate(e.target.value)}/><input type="time" value={quickTime} onChange={e=>setQuickTime(e.target.value)}/><button disabled={!selectedIds.length||!quickDate} onClick={bulkReschedule}>{t("adminBillingCalendar.actions.reschedule")}</button></div>
          <small>{t("adminBillingCalendar.paddleConfirmation")}</small>
        </div>
      </article>
    </section>

    <footer className="abc-footer"><div><CircleDollarSign/>{t("adminBillingCalendar.syncedWithPaddle")}</div><div><span/>{t("adminBillingCalendar.paddleStatus")} · {t("adminBillingCalendar.lastSync")}: {overview.lastSyncLabel||"—"}<button onClick={loadMonth}><RefreshCw/></button></div></footer>
  </div>
}
