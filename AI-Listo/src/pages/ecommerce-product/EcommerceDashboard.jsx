import React, { useMemo, useState } from "react";
import {
  Search, Bell, ChevronDown, TrendingUp, TrendingDown, AlertTriangle,
  UserRound, ChevronLeft, ChevronRight, Filter, X, MoreHorizontal,
  CheckCircle2, RefreshCw, CalendarClock, Send, Download, Info,
  RotateCw, CircleDollarSign, WalletCards
} from "lucide-react";
import "./ecommerce-dashboard.css";

const METRICS = [
  ["Monthly Revenue", "$842,540.00", "18.2%", "up", CircleDollarSign, "purple"],
  ["Active Subscriptions", "12,483", "12.4%", "up", WalletCards, "green"],
  ["MRR Forecast (30 Days)", "$1,204,540.00", "18.6%", "up", TrendingUp, "blue"],
  ["Failed Payments", "284", "12.0%", "down", AlertTriangle, "orange"],
  ["Churn Rate", "2.48%", "8.2%", "up", UserRound, "violet"],
];

const BILLING_DAYS = [
  [1,200,"$59,800"],[2,130,"$89,700"],[3,150,"$44,850"],[4,120,"$35,880"],[5,250,"$74,750"],[6,180,"$53,820"],[7,210,"$62,790"],
  [8,160,"$47,840"],[9,220,"$65,780"],[10,140,"$41,860"],[11,100,"$29,900"],[12,230,"$68,770"],[13,190,"$56,810"],[14,170,"$50,830"],
  [15,200,"$59,800"],[16,130,"$38,870"],[17,110,"$32,890"],[18,90,"$26,910"],[19,160,"$47,840"],[20,150,"$44,850"],[21,180,"$53,820"],
  [22,210,"$62,790"],[23,120,"$35,880"],[24,100,"$29,900"],[25,80,"$23,920"],[26,140,"$41,860"],[27,160,"$47,840"],[28,150,"$44,850"],
  [29,180,"$69,820"],[30,110,"$32,890"],[31,90,"$26,910"]
];

const CUSTOMERS = [
  ["AC","Alpha Consulting","Business","$297/mo","9:00 AM","Scheduled","cus_8f3e2d91"],
  ["BE","Bright Real Estate","Scale","$397/mo","9:15 AM","Scheduled","cus_9a7bcc22"],
  ["TS","Tech Solutions LLC","Solo","$127/mo","9:30 AM","Scheduled","cus_a1a7de833"],
  ["MG","Marketing Group","Business","$297/mo","9:45 AM","Past Due","cus_f23abc64"],
  ["IN","Innovate Inc.","Business","$297/mo","10:00 AM","Failed","cus_1ab23c45"],
  ["DV","Design Vision","Scale","$397/mo","10:15 AM","Scheduled","cus_7c8da0e01"],
  ["NM","New Wave Agency","Solo","$127/mo","10:30 AM","Scheduled","cus_4d5e6f78"],
];

function MetricCard({ item }) {
  const [label, value, change, direction, Icon, tone] = item;
  return <article className="ecbd-metric">
    <div><span>{label}</span><strong>{value}</strong><small className={direction}>{direction === "down" ? <TrendingDown/> : <TrendingUp/>}{change} <i>vs last month</i></small></div>
    <b className={`ecbd-metric-icon ${tone}`}><Icon/></b>
  </article>;
}

function StatusDots(){ return <span className="ecbd-dots"><i/><i/><i/><i/><i/></span>; }

function BillingCalendar(){
  const [view,setView] = useState("Month");
  return <section className="ecbd-card ecbd-calendar-card">
    <header className="ecbd-card-head"><h2>Billing Calendar</h2><div className="ecbd-view-toggle">{["Month","Week","List"].map(v=><button key={v} className={view===v?"active":""} onClick={()=>setView(v)}>{v}</button>)}<button aria-label="Filter"><Filter/></button></div></header>
    <div className="ecbd-calendar-nav"><button>Today</button><button><ChevronLeft/></button><button><ChevronRight/></button><strong>May 2026 <ChevronDown/></strong></div>
    <div className="ecbd-legend"><span>Scheduled</span><span>Paid</span><span>Failed</span><span>Past Due</span><span>Canceled</span><span>Rescheduled</span></div>
    <div className="ecbd-weekdays">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(x=><b key={x}>{x}</b>)}</div>
    <div className="ecbd-month-grid">
      {[26,27,28,29,30].map(x=><button className="outside" key={`prev-${x}`}>{x}</button>)}
      {BILLING_DAYS.map(([day,count,amount])=><button key={day} className={day===1?"selected":""}><div><b>{day}</b><i>{count}</i></div><strong>{amount}</strong><StatusDots/></button>)}
      {[1,2,3,4,5,6].map(x=><button className="outside" key={`next-${x}`}>{x}</button>)}
    </div>
  </section>;
}

function SelectedDay(){
  const [filter,setFilter] = useState("All");
  const rows = useMemo(()=>CUSTOMERS.filter(r=>filter==="All" || r[5]===filter),[filter]);
  return <section className="ecbd-card ecbd-day-card">
    <header className="ecbd-card-head"><h2>Friday, May 1, 2026</h2><button className="ecbd-close"><X/>Close</button></header>
    <div className="ecbd-day-stats">{[["Scheduled","200","$59,800"],["Paid","180","$53,400"],["Failed","12","$2,800"],["Past Due","8","$2,800"]].map(([status,n,total])=><button key={status} className={filter===status?"active":""} onClick={()=>setFilter(filter===status?"All":status)}><strong>{n}</strong><span>{status}</span><b>{total}</b></button>)}</div>
    <div className="ecbd-search-row"><label><Search/><input placeholder="Search customers..."/></label><button><Filter/>Filters</button></div>
    <div className="ecbd-customer-table">
      <div className="ecbd-tr ecbd-th"><span>Customer</span><span>Plan</span><span>Billing Time</span><span>Status</span><span>Actions</span></div>
      {rows.map((r,i)=><div className="ecbd-tr" key={r[6]}><span className="ecbd-customer"><i>{r[0]}</i><b>{r[1]}<small>ID: {r[6]}</small></b></span><span><b>{r[2]}</b><small>{r[3]}</small></span><span>{r[4]}</span><span><em className={r[5].replaceAll(" ","").toLowerCase()}>{r[5]}</em></span><span><button className="ecbd-more"><MoreHorizontal/></button></span></div>)}
    </div>
    <footer className="ecbd-pagination"><span>Showing 1–7 of 200 customers</span><div><button><ChevronLeft/></button><button className="active">1</button><button>2</button><button>3</button><i>...</i><button>29</button><button><ChevronRight/></button></div></footer>
  </section>;
}

function BottomPanels(){ return <div className="ecbd-bottom-grid">
  <section className="ecbd-card ecbd-mini"><header><h3>Upcoming Billing Days</h3><a>View all →</a></header>{[["May 3, 2026","150 customers","$44,850"],["May 5, 2026","250 customers","$74,750"],["May 7, 2026","210 customers","$62,790"],["May 8, 2026","160 customers","$47,840"],["May 9, 2026","220 customers","$65,780"]].map(x=><p key={x[0]}><b>{x[0]}</b><span>{x[1]}</span><strong>{x[2]}</strong></p>)}</section>
  <section className="ecbd-card ecbd-mini"><header><h3>Recent Activity</h3><a>View all →</a></header>{[["Payment successful","Alpha Consulting","2 min ago","$297.00"],["Subscription renewed","Bright Real Estate","15 min ago","$397.00"],["Payment failed","Innovate Inc. •••• 4242","1 hour ago","$297.00"],["Billing date updated","Tech Solutions LLC","2 hours ago","May 1→May 3"]].map(x=><p className="activity" key={x[0]}><CheckCircle2/><b>{x[0]}<small>{x[1]}</small></b><span>{x[2]}</span><strong>{x[3]}</strong></p>)}</section>
  <section className="ecbd-card ecbd-mini ecbd-exceptions"><header><h3>Billing Exceptions</h3><button>Recovery Rules</button><a>View all →</a></header>{[["Failed Payments","12 customers"],["Past Due","8 customers"],["Rescheduled","5 customers"],["Needs Review","7 customers"],["Refund Pending","3 customers"],["Retry Scheduled","9 customers"]].map(x=><p key={x[0]}><b>{x[0]}</b><span>{x[1]}</span></p>)}</section>
  <section className="ecbd-card ecbd-bulk"><h3>Bulk Actions <small>(0 selected)</small></h3><div className="ecbd-actions"><button><CalendarClock/>Reschedule</button><button><Send/>Send Reminder</button><button><RefreshCw/>Retry Failed</button><button><Download/>Export List</button></div><hr/><h3>Quick Reschedule</h3><div className="ecbd-quick"><span>Move selected to</span><button>May 3, 2026</button><button className="purple">Reschedule</button></div><p><Info/>Billing dates are controlled by Cortexa. Payment results sync with Nuvei/Datafast.</p></section>
</div>; }

export default function EcommerceDashboard(){
  return <div className="ecbd-page">
    <header className="ecbd-topbar"><div><h1>Dashboard Billing Calendar</h1><p>Monitor upcoming subscription charges, payments, failures, and billing activity.</p></div><div className="ecbd-user-tools"><label><Search/><input placeholder="Search customers, invoices..."/><kbd>⌘K</kbd></label><button className="ecbd-bell"><Bell/><i>7</i></button><span className="ecbd-avatar">H</span><b>Heisenberg<small>Super Admin</small></b><ChevronDown/></div></header>
    <div className="ecbd-content"><div className="ecbd-metrics">{METRICS.map((m,i)=><MetricCard key={i} item={m}/>)}</div><div className="ecbd-main-grid"><BillingCalendar/><SelectedDay/></div><BottomPanels/><div className="ecbd-statusbar"><span><Info/>Cortexa manages billing schedules. Payment results are securely synchronized with Nuvei/Datafast.</span><span><b>Nuvei/Datafast Status:</b><i/>Callback Pending <em/>Last sync: 1 min ago <button><RotateCw/></button></span></div></div>
  </div>;
}
