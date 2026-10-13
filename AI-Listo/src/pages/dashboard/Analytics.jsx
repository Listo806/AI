import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  BarChart3, CalendarDays, CheckCircle2, Clock3, Download, Filter, MessageCircle,
  Phone, RefreshCw, Sparkles, Target, UserRoundPlus, Zap, Mail, MessageSquare,
  AlertCircle, XCircle, Settings2, ArrowRight, ChevronDown, ClipboardCheck, Users,
  ListChecks
} from "lucide-react";
import apiClient from "../../api/apiClient";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { getAnalyticsDashboard, getActivityMetrics, getCalendarStats } from "../../api/analyticsApi";
import { downloadCsv } from "../../utils/helpers";
import "./analytics.css";

const NA = "—";
const unwrap = (v) => v?.data && !Array.isArray(v.data) ? v.data : v;
const numeric = (v) => v === null || v === undefined || v === "" ? null : Number.isFinite(Number(v)) ? Number(v) : null;
const display = (v) => numeric(v) === null ? NA : Number(v).toLocaleString();
const days = (range) => range === "today" ? 1 : range === "7d" ? 7 : 30;
const within = (value, range) => {
  const stamp = new Date(value).getTime();
  return Number.isFinite(stamp) && stamp >= Date.now() - days(range) * 86400000 && stamp <= Date.now();
};
const listOf = (v) => Array.isArray(v) ? v : Array.isArray(v?.items) ? v.items : Array.isArray(v?.data) ? v.data : Array.isArray(v?.data?.items) ? v.data.items : null;

export default function CortexaAnalyticsDashboard() {
  const { t } = useTranslation();
  const tr = (key) => t(`analyticsV2.${key}`);
  const navigate = useNavigate();
  const [range, setRange] = useState("30d");
  const [tick, setTick] = useState(0);
  const [compare, setCompare] = useState(false);
  const [mode, setMode] = useState("daily");
  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [state, setState] = useState({loading:true, error:null, analytics:null, activity:null, calendar:null, contacts:null, ai:null});
  const refresh = () => setTick(v => v+1);
  useEffect(() => {
    let live = true;
    setState(s=>({...s,loading:true,error:null}));
    apiClient.request(`/analytics/overview-v2?days=${days(range)}`).then(response => {
      if (!live) return;
      setState({loading:false,error:null,overview:unwrap(response)});
    }).catch(() => {
      if (!live) return;
      setState({loading:false,error:tr("loadFailed"),overview:null});
    });
    return () => {live=false;};
  }, [range,tick]);
  const overview = state.overview;
  const a = overview?.metrics;
  const activitySeries = overview?.activity?.series ?? [];
  const contactValue = a?.newContacts;
  const conversationValue = a?.conversationsHandled;
  const appointments = a?.appointmentsBooked;
  const stats = [
    ["newContacts",contactValue,UserRoundPlus,"blue"],["conversationsHandled",conversationValue,MessageCircle,"purple"],
    ["appointmentsBooked",appointments,CalendarDays,"green"],["aiActionsCompleted",a?.aiActionsCompleted,Zap,"purple"],
    ["averageFirstResponse",a?.averageFirstResponse,Clock3,"orange"],["bookingRate",a?.bookingRate,Filter,"teal"],
    ["followupCompletion",a?.followupCompletion,ClipboardCheck,"blue"],["automationSuccess",a?.automationSuccess,Settings2,"pink"]
  ];
  const channels = [["calls",Phone,"blue"],["whatsapp",MessageCircle,"green"],["email",Mail,"blue"],["websiteChat",MessageSquare,"purple"]];
  const outcomes = [["booked",overview?.appointments?.booked,CheckCircle2,"green"],["completed",overview?.appointments?.completed,CheckCircle2,"blue"],
    ["canceled",overview?.appointments?.canceled,XCircle,"red"],["noShow",overview?.appointments?.noShow,Clock3,"orange"]];
  const followups = [["dueInPeriod",overview?.followups?.dueInPeriod,Clock3,"blue"],["completedOnTime",overview?.followups?.completedOnTime,CheckCircle2,"green"],
    ["completedLate",overview?.followups?.completedLate,Clock3,"orange"],["missed",overview?.followups?.missed,XCircle,"red"]];
  const automation = [["successful",overview?.aiAutomation?.successful,CheckCircle2,"green"],
    ["failed",overview?.aiAutomation?.failed,XCircle,"red"],["awaitingApproval",overview?.aiAutomation?.awaitingApproval,Clock3,"orange"]];
  async function analyzePeriod() {
    setInsightsLoading(true);
    try {
      const result = await apiClient.request(`/analytics/overview-v2/insights?days=${days(range)}`);
      setInsights(unwrap(result));
    } catch {
      setInsights({error:true});
    } finally {
      setInsightsLoading(false);
    }
  }
  function exportCsv() {
    downloadCsv("analytics-overview.csv",[
      [tr("metric"),tr("value")],...stats.map(([key,val])=>[tr(key),numeric(val)===null?"":val]),
      [],[tr("section"),tr("metric"),tr("value")],
      ...outcomes.map(([key,val])=>[tr("appointmentOutcomes"),tr(key),numeric(val)===null?"":val])
    ]);
  }
  const panelHeader = (icon,title,description,action,path) => (
    <div className="anv-panel-head"><div className="anv-heading-icon">{icon}</div>
      <div className="anv-panel-title"><h2>{tr(title)}</h2>{description && <p>{tr(description)}</p>}</div>
      {action && <button type="button" className="anv-link" onClick={()=>navigate(path)}>{tr(action)} <ArrowRight size={15}/></button>}
    </div>
  );
  const rows = (data) => data.map(([key,value,Icon,tone])=>(
    <div className="anv-metric-row" key={key}><span className={`anv-small-icon anv-${tone}`}><Icon size={17}/></span>
      <span>{tr(key)}</span><strong>{display(value)}</strong></div>
  ));
  return <main className="analytics-page analytics-overview-v2">
    <header className="anv-header">
      <div className="anv-title"><BarChart3 size={29}/><div><h1>{tr("title")}</h1><p>{tr("subtitle")}</p></div></div>
      <div className="anv-actions"><label className="anv-select"><CalendarDays size={17}/><select value={range} onChange={e=>setRange(e.target.value)}>
        <option value="today">{tr("today")}</option><option value="7d">{tr("last7Days")}</option><option value="30d">{tr("last30Days")}</option></select><ChevronDown size={14}/></label>
        <button type="button" onClick={()=>document.getElementById("anv-filter-range")?.focus()}><Filter size={17}/>{tr("filters")}</button>
        <button type="button" onClick={exportCsv}><Download size={17}/>{tr("export")}</button>
        <button type="button" className="anv-primary" onClick={refresh}><RefreshCw size={17}/>{tr("refresh")}</button>
        <label className="anv-compare">{tr("comparePrevious")} <input type="checkbox" checked={compare} onChange={e=>setCompare(e.target.checked)}/></label>
      </div>
    </header>
    {compare && <p className="anv-notice" role="status">{tr("comparisonUnavailable")}</p>}
    {state.loading && <p className="anv-notice" role="status">{tr("loading")}</p>}
    {state.error && <p className="anv-error" role="alert">{state.error} <button onClick={refresh}>{tr("retry")}</button></p>}
    <section className="anv-kpis">{stats.map(([key,value,Icon,tone])=><article className="anv-kpi" key={key}>
      <span className={`anv-kpi-icon anv-${tone}`}><Icon size={27}/></span>
      <div><h2>{tr(key)}</h2><strong>{display(value)}</strong><p>{numeric(value)===null ? tr("unavailable") : tr("selectedPeriod")}</p></div>
    </article>)}</section>
    <section className="anv-grid-main">
      <article className="anv-panel anv-activity">
        {panelHeader(<BarChart3/>, "activityOverTime","activityDescription","viewActivity","/dashboard/team/activity")}
        <div className="anv-activity-toolbar"><span><i className="anv-dot blue"/>{tr("conversations")}</span><span><i className="anv-dot green"/>{tr("appointments")}</span><span><i className="anv-dot purple"/>{tr("aiActions")}</span>
          <select id="anv-filter-range" value={mode} onChange={e=>setMode(e.target.value)}><option value="daily">{tr("daily")}</option><option value="weekly">{tr("weekly")}</option></select></div>
        {activitySeries.length > 0 ? <div style={{height:210,width:"100%"}}>
          <ResponsiveContainer width="100%" height="100%"><LineChart data={activitySeries} margin={{top:12,right:16,bottom:5,left:0}}>
            <CartesianGrid stroke="#edf2fa" strokeDasharray="3 3"/><XAxis dataKey="date" tick={{fontSize:10}}/><YAxis allowDecimals={false} tick={{fontSize:10}}/>
            <Tooltip/><Line type="monotone" dataKey="conversations" name={tr("conversations")} stroke="#2868f5" strokeWidth={2} dot={false}/><Line type="monotone" dataKey="appointments" name={tr("appointments")} stroke="#16b76b" strokeWidth={2} dot={false}/>
            <Line type="monotone" dataKey="ai_actions" name={tr("aiActions")} stroke="#9049ef" strokeWidth={2} dot={false}/>
          </LineChart></ResponsiveContainer></div> : <div className="anv-empty"><BarChart3 size={34}/><strong>{tr("noActivity")}</strong><p>{tr("activityEmptyDescription")}</p></div>}
      </article>
      <article className="anv-panel">{panelHeader(<Target/>,"communicationByChannel","channelDescription","viewConversations","/dashboard/conversations")}
        {rows(channels.map(([key,Icon,tone])=>[key,overview?.channels?.[key],Icon,tone]))}<p className="anv-footnote">{tr("channelsUnavailable")}</p></article>
    </section>
    <section className="anv-grid-thirds">
      <article className="anv-panel">{panelHeader(<CalendarDays/>,"appointmentOutcomes","appointmentsDescription","viewAppointments","/dashboard/calendar")}{rows(outcomes)}</article>
      <article className="anv-panel">{panelHeader(<ClipboardCheck/>,"followupPerformance","followupDescription","viewFollowups","/dashboard/leads")}{rows(followups)}</article>
      <article className="anv-panel">{panelHeader(<Zap/>,"aiAutomationResults","aiDescription","viewActionHistory","/dashboard/ai-cortexa")}{rows(automation)}<p className="anv-footnote">{tr("aiActionsNotAutomations")}</p></article>
    </section>
    <section className="anv-grid-bottom">
      <article className="anv-panel">{panelHeader(<Users/>,"teamPerformance","teamDescription","viewTeamReport","/dashboard/team")}
        <div className="anv-table-scroll"><table><thead><tr>{["teamMember","conversationsHandled","averageFirstResponse","tasksCompleted","followupCompletion"].map(k=><th key={k}>{tr(k)}</th>)}</tr></thead><tbody>{(overview?.teamPerformance ?? []).map(member=><tr key={member.id}><td>{member.name}</td><td>{display(member.conversationsHandled)}</td><td>{display(member.averageFirstResponse)}</td><td>{display(member.tasksCompleted)}</td><td>{numeric(member.followupCompletion)===null?NA:`${member.followupCompletion}%`}</td></tr>)}</tbody></table></div>
        {!overview?.teamPerformance?.length && <div className="anv-team-empty"><Users size={28}/><strong>{tr("teamDataUnavailable")}</strong><p>{tr("teamDataDescription")}</p></div>}</article>
      <article className="anv-panel anv-ai-insights">{panelHeader(<Sparkles/>,"aiPerformanceInsights","insightsDescription")}
        <div className="anv-insights-center"><ListChecks size={29}/>
          {insights?.metrics ? <><strong>{tr("analysisReady")}</strong><p>{tr("conversationsHandled")}: {display(insights.metrics.conversationsHandled)} · {tr("appointmentsBooked")}: {display(insights.metrics.appointmentsBooked)}</p></> :
          <><strong>{insights?.error ? tr("loadFailed") : tr("noAnalysis")}</strong><p>{tr("analysisDescription")}</p></>}</div>
        <button type="button" className="anv-primary anv-analyze" onClick={analyzePeriod} disabled={insightsLoading}>
          <Sparkles size={17}/>{insightsLoading ? tr("loading") : tr("analyzePeriod")}</button>
      </article>
    </section>
    <footer className="anv-footer">{tr("dataSourceNotice")}</footer>
  </main>;
}
