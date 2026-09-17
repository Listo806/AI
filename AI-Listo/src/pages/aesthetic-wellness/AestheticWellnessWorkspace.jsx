import {
  ArrowUp,
  Bot,
  CalendarDays,
  CalendarPlus,
  ChevronDown,
  CircleDollarSign,
  Download,
  Filter,
  ListChecks,
  MessageCircle,
  Percent,
  RefreshCw,
  Sparkles,
  TrendingUp,
  UsersRound,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import aestheticWellnessApi from "../../api/aestheticWellnessApi";
import "./aestheticWellnessWorkspace.css";

const WORKSPACE_ID = "aesthetic-wellness";

const EMPTY = {
  setup: { completed: false, firstIncompleteStep: 1 },
  aiReceptionist: { live: false, conversationsToday: 0, consultationsBooked: 0, avgResponseSeconds: 0 },
  metrics: {},
  schedule: [],
  pipeline: [],
  treatmentInterest: [],
  rebookingClients: [],
  followUpQueue: [],
  providers: [],
  revenueOverview: { total: 0, changePercent: 0, points: [] },
  aiActivity: [],
};

const unwrap = (res) => res?.data ?? res ?? null;

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatResponseTime(seconds) {
  const total = Number(seconds || 0);
  if (!total) return "—";
  if (total < 60) return `${Math.round(total)}s`;
  const mins = Math.floor(total / 60);
  const secs = Math.round(total % 60);
  return secs ? `${mins}m ${secs}s` : `${mins}m`;
}

function MetricTrend({ value, comparison }) {
  if (value === undefined || value === null) return null;
  const n = Number(value || 0);
  return (
    <div className={`aw-metric-trend ${n >= 0 ? "aw-trend-positive" : "aw-trend-negative"}`}>
      <ArrowUp size={10} className={n < 0 ? "aw-trend-down" : ""} />
      <strong>{Math.abs(n)}%</strong>
      <span>{comparison}</span>
    </div>
  );
}

function StatCard({ icon: Icon, title, value, trend, comparison }) {
  return (
    <article className="aw-stat-card">
      <div className="aw-stat-icon"><Icon size={22} strokeWidth={1.8} /></div>
      <div className="aw-stat-main"><span>{title}</span><strong>{value ?? "—"}</strong></div>
      <MetricTrend value={trend} comparison={comparison} />
    </article>
  );
}

function SectionHeader({ icon: Icon, title, action, onAction, right }) {
  return (
    <div className="aw-section-header">
      <div className="aw-section-title">{Icon && <Icon size={18} strokeWidth={1.8} />}<h2>{title}</h2></div>
      {right}
      {action && <button type="button" className="aw-link-button" onClick={onAction}>{action}</button>}
    </div>
  );
}

export default function AestheticWellnessWorkspace() {
  const navigate = useNavigate();
  const filterRef = useRef(null);
  const [dashboard, setDashboard] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [range, setRange] = useState("today");
  const [locationId, setLocationId] = useState("");
  const [providerId, setProviderId] = useState("");
  const [locations, setLocations] = useState([]);
  const [providers, setProviders] = useState([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const setupBase = useMemo(() => {
    const q = new URLSearchParams({ workspace_id: WORKSPACE_ID, return_to: "/dashboard/aesthetic-wellness" });
    return q;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = unwrap(await aestheticWellnessApi.getDashboard({ range, location_id: locationId, provider_id: providerId })) || {};
      setDashboard({
        ...EMPTY,
        ...data,
        setup: { ...EMPTY.setup, ...(data.setup || {}) },
        aiReceptionist: { ...EMPTY.aiReceptionist, ...(data.aiReceptionist || {}) },
        metrics: data.metrics || {},
        revenueOverview: { ...EMPTY.revenueOverview, ...(data.revenueOverview || {}) },
      });
      setError("");
    } catch (e) {
      setError(e?.message || "Unable to load Aesthetic & Wellness dashboard.");
    } finally {
      setLoading(false);
    }
  }, [range, locationId, providerId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    aestheticWellnessApi.getLocations().then((r) => setLocations(unwrap(r)?.items || [])).catch(() => setLocations([]));
  }, []);

  useEffect(() => {
    aestheticWellnessApi.getProviders(locationId).then((r) => setProviders(unwrap(r)?.items || [])).catch(() => setProviders([]));
  }, [locationId]);

  useEffect(() => {
    const close = (e) => { if (filterRef.current && !filterRef.current.contains(e.target)) setFiltersOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const goSetup = (step) => {
    const q = new URLSearchParams(setupBase);
    if (step) q.set("step", String(step));
    navigate(`/dashboard/ai-cortexa-setup?${q.toString()}`);
  };

  const manageAgent = () => navigate(`/dashboard/ai-cortexa-setup/training?${setupBase.toString()}`);
  const manageProviders = () => {
    const q = new URLSearchParams(setupBase); q.set("section", "providers");
    navigate(`/dashboard/ai-cortexa-setup/conversion-flow?${q.toString()}`);
  };
  const configureBooking = () => {
    const q = new URLSearchParams(setupBase); q.set("section", "services-availability");
    navigate(`/dashboard/ai-cortexa-setup/conversion-flow?${q.toString()}`);
  };
  const viewCalendar = () => navigate(`/dashboard/calendar?workspace_id=${WORKSPACE_ID}`);
  const addAppointment = () => navigate(`/dashboard/calendar?workspace_id=${WORKSPACE_ID}&action=new`);
  const viewConversations = () => navigate(`/dashboard/whatsapp?workspace_id=${WORKSPACE_ID}`);
  const viewPipeline = () => navigate(`/dashboard/pipeline?workspace_id=${WORKSPACE_ID}`);
  const viewClients = (status) => navigate(`/dashboard/aesthetic-wellness/clients${status ? `?status=${status}` : ""}`);

  const exportCsv = () => {
    const rows = [
      ["Metric", "Value"],
      ["New Inquiries", dashboard.metrics?.newInquiries?.value ?? 0],
      ["Consultations Booked", dashboard.metrics?.consultationsBooked?.value ?? 0],
      ["Today's Appointments", dashboard.metrics?.todaysAppointments?.value ?? 0],
      ["Show Rate", `${dashboard.metrics?.showRate?.value ?? 0}%`],
      ["Revenue Today", dashboard.metrics?.revenueToday?.value ?? 0],
      ["Rebooking Due", dashboard.metrics?.rebookingDue?.value ?? 0],
    ];
    const csv = rows.map((r) => r.map((x) => `"${String(x).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aesthetic-wellness-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading && !dashboard) return <div className="aw-page aw-loading">Loading clinic workspace…</div>;

  return (
    <div className="aw-page">
      <header className="aw-page-header">
        <div className="aw-title-wrap">
          <div className="aw-title-icon"><Sparkles size={34} strokeWidth={1.8} /></div>
          <div>
            <h1>Aesthetic &amp; Wellness Workspace</h1>
            <p>Manage inquiries, consultations, appointments, treatments, follow-ups, and returning clients.</p>
          </div>
        </div>

        <div className="aw-header-actions">
          <button
            type="button"
            className="aw-top-control aw-clients-control"
            onClick={() => navigate("/dashboard/aesthetic-wellness/clients")}
          >
            <UsersRound size={15} />
            <span>Clients</span>
          </button>

          <button type="button" className="aw-top-control aw-date-control" onClick={() => setRange((v) => v === "today" ? "7d" : "today")}>
            <CalendarDays size={15} /><span>{range === "today" ? "Today" : "Last 7 Days"}</span><ChevronDown size={14} />
          </button>

          <div className="aw-filter-wrap" ref={filterRef}>
            <button type="button" className="aw-top-control" onClick={() => setFiltersOpen((v) => !v)}><Filter size={15} /><span>Filters</span></button>
            {filtersOpen && (
              <div className="aw-filter-popover">
                <label>Location<select value={locationId} onChange={(e) => { setLocationId(e.target.value); setProviderId(""); }}><option value="">All locations</option>{locations.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
                <label>Provider<select value={providerId} onChange={(e) => setProviderId(e.target.value)}><option value="">All providers</option>{providers.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
                <button type="button" onClick={() => { setLocationId(""); setProviderId(""); setFiltersOpen(false); }}>Clear filters</button>
              </div>
            )}
          </div>

          <button type="button" className="aw-top-control" onClick={exportCsv}><Download size={15} /><span>Export</span></button>
        </div>
      </header>

      {error && <div className="aw-error"><span>{error}</span><button onClick={load}>Retry</button></div>}

      {!dashboard.setup?.completed && (
        <section className="aw-setup-warning">
          <div><Sparkles size={20} /><div><strong>Complete Clinic Setup</strong><p>Add treatments, providers, booking rules, qualification questions, safety rules, FAQs, automations, and test your AI receptionist.</p></div></div>
          <div className="aw-setup-warning-actions">
            <button className="aw-secondary-btn" onClick={() => goSetup(dashboard.setup?.firstIncompleteStep || 1)}>Finish Setup</button>
            <button className="aw-primary-btn" onClick={() => goSetup()}>Complete Clinic Setup</button>
          </div>
        </section>
      )}

      <section className="aw-agent-card">
        <div className="aw-agent-main">
          <div className="aw-agent-avatar"><Bot size={34} strokeWidth={1.8} /></div>
          <div className="aw-agent-copy">
            <span className="aw-overline">AI RECEPTIONIST</span>
            <div className="aw-agent-title">
              <h2>Your clinic&apos;s AI agent is {dashboard.aiReceptionist.live ? "active" : "not live yet"}</h2>
              <span className={`aw-live-pill ${dashboard.aiReceptionist.live ? "live" : "inactive"}`}><i />{dashboard.aiReceptionist.live ? "Live" : "Setup Required"}</span>
            </div>
            <p>Answering inquiries, qualifying treatment interest, and booking consultations.</p>
          </div>
        </div>
        <div className="aw-agent-stat"><div><MessageCircle size={24} strokeWidth={1.8} /><strong>{dashboard.aiReceptionist.conversationsToday || 0}</strong></div><span>Conversations Today</span></div>
        <div className="aw-agent-stat"><div><CalendarPlus size={24} strokeWidth={1.8} /><strong>{dashboard.aiReceptionist.consultationsBooked || 0}</strong></div><span>Consultations Booked</span></div>
        <div className="aw-agent-stat"><div><Zap size={24} strokeWidth={1.8} /><strong>{formatResponseTime(dashboard.aiReceptionist.avgResponseSeconds)}</strong></div><span>Avg. Response</span></div>
        <div className="aw-agent-actions"><button className="aw-primary-btn" onClick={viewConversations}>View Conversations</button><button className="aw-secondary-btn" onClick={manageAgent}>Manage AI Agent</button></div>
      </section>

      <section className="aw-stats-grid">
        <StatCard icon={UsersRound} title="New Inquiries" value={dashboard.metrics?.newInquiries?.value ?? 0} trend={dashboard.metrics?.newInquiries?.trendPercent} comparison="vs. yesterday" />
        <StatCard icon={CalendarPlus} title="Consultations Booked" value={dashboard.metrics?.consultationsBooked?.value ?? 0} trend={dashboard.metrics?.consultationsBooked?.trendPercent} comparison="vs. yesterday" />
        <StatCard icon={CalendarDays} title="Today's Appointments" value={dashboard.metrics?.todaysAppointments?.value ?? 0} trend={dashboard.metrics?.todaysAppointments?.trendPercent} comparison="vs. yesterday" />
        <StatCard icon={Percent} title="Show Rate" value={`${dashboard.metrics?.showRate?.value ?? 0}%`} trend={dashboard.metrics?.showRate?.trendPercent} comparison="vs. last week" />
        <StatCard icon={CircleDollarSign} title="Revenue Today" value={money(dashboard.metrics?.revenueToday?.value)} trend={dashboard.metrics?.revenueToday?.trendPercent} comparison="vs. yesterday" />
        <StatCard icon={RefreshCw} title="Rebooking Due" value={dashboard.metrics?.rebookingDue?.value ?? 0} trend={dashboard.metrics?.rebookingDue?.trendPercent} comparison="vs. yesterday" />
      </section>

      <section className="aw-dashboard-main">
        <article className="aw-panel aw-schedule">
          <SectionHeader icon={CalendarDays} title="Today's Schedule" action="View All" onAction={viewCalendar} />
          <div className="aw-schedule-list">
            {dashboard.schedule.length ? dashboard.schedule.map((item) => <div className="aw-schedule-row" key={item.id}><strong>{item.timeLabel}</strong><b>{item.clientName}</b><span>{item.serviceName}</span><span>{item.providerName}</span><em className={`aw-status ${item.status || ""}`}>{item.statusLabel || item.status}</em></div>) : <div className="aw-empty">No appointments scheduled today.</div>}
          </div>
          <div className="aw-schedule-actions"><button className="aw-secondary-btn" onClick={viewCalendar}><CalendarDays size={15} /> View Calendar</button><button className="aw-primary-btn" onClick={addAppointment}><CalendarPlus size={15} /> Add Appointment</button></div>
        </article>

        <div className="aw-center-column">
          <article className="aw-panel">
            <SectionHeader icon={Filter} title="Clinic Pipeline" action="View Pipeline" onAction={viewPipeline} />
            <div className="aw-pipeline">{dashboard.pipeline.length ? dashboard.pipeline.map((stage) => <div className="aw-pipeline-stage" key={stage.id}><span>{stage.name}</span><strong>{stage.count || 0}</strong></div>) : <div className="aw-empty">No clinic pipeline activity.</div>}</div>
          </article>
          <div className="aw-small-panel-grid">
            <article className="aw-panel"><SectionHeader icon={RefreshCw} title="Clients Ready to Rebook" action="View All" onAction={() => viewClients("ready_to_rebook")} /><div>{dashboard.rebookingClients.length ? dashboard.rebookingClients.slice(0, 3).map((client) => <div className="aw-rebook-row" key={client.id}><div><strong>{client.clientName}</strong><span>{client.treatmentName}</span></div><span className={`aw-due ${client.overdue ? "danger" : ""}`}>{client.dueLabel}</span><button onClick={viewConversations}>Send Reminder</button></div>) : <div className="aw-empty">No clients due to rebook.</div>}</div></article>
            <article className="aw-panel"><SectionHeader icon={ListChecks} title="Follow-Up Queue" action="View All" onAction={() => viewClients("follow_up")} />{dashboard.followUpQueue.map((item) => <div className="aw-followup-row" key={item.id}><strong>{item.count || 0}</strong><span>{item.label}</span></div>)}<button className="aw-primary-btn aw-full-btn" onClick={() => navigate(`/dashboard/leads?workspace_id=${WORKSPACE_ID}&follow_up=due`)}>Review Follow-Ups</button></article>
          </div>
        </div>

        <article className="aw-panel aw-treatment-panel">
          <SectionHeader icon={TrendingUp} title="Treatment Interest" right={<span className="aw-section-range">Last 30 Days</span>} />
          <div className="aw-treatment-list">{dashboard.treatmentInterest.length ? dashboard.treatmentInterest.slice(0, 5).map((item) => <div className="aw-treatment-row" key={item.name}><span>{item.name}</span><div className="aw-treatment-track"><i style={{ width: `${Math.min(Number(item.percent || 0), 100)}%` }} /></div><strong>{item.percent || 0}%</strong></div>) : <div className="aw-empty">No treatment interest yet.</div>}</div>
        </article>
      </section>

      <section className="aw-bottom-grid">
        <article className="aw-panel"><SectionHeader icon={UsersRound} title="Provider Performance" right={<button className="aw-link-button" onClick={manageProviders}>Manage Providers</button>} /><div className="aw-provider-table"><div className="aw-provider-head"><span>Provider</span><span>Appointments</span><span>Revenue</span><span>Show Rate</span></div>{dashboard.providers.length ? dashboard.providers.slice(0, 5).map((p) => <div className="aw-provider-row" key={p.id}><strong>{p.name}</strong><span>{p.appointments || 0}</span><span>{money(p.revenue)}</span><strong>{p.showRate || 0}%</strong></div>) : <div className="aw-empty">No provider performance yet.</div>}</div></article>
        <article className="aw-panel"><SectionHeader icon={TrendingUp} title="Revenue Overview" right={<span className="aw-section-range">Last 7 Days</span>} /><div className="aw-revenue-summary"><strong>{money(dashboard.revenueOverview.total)}</strong><span>{Number(dashboard.revenueOverview.changePercent || 0) >= 0 ? "↑" : "↓"} {Math.abs(Number(dashboard.revenueOverview.changePercent || 0))}%</span></div><div className="aw-revenue-chart">{dashboard.revenueOverview.points.map((point, i) => <div className="aw-chart-point" key={`${point.label}-${i}`} style={{ "--value": Number(point.percent || 0) / 100 }}><i /><span>{point.label}</span></div>)}</div></article>
        <article className="aw-panel"><SectionHeader icon={Bot} title="AI Agent Activity" action="View All" onAction={viewConversations} /><div className="aw-ai-activity-list">{dashboard.aiActivity.length ? dashboard.aiActivity.slice(0, 5).map((a) => <div className="aw-ai-activity-row" key={a.id}><i /><span>{a.timeLabel}</span><strong>{a.title}</strong></div>) : <div className="aw-empty">No AI activity yet.</div>}</div><div className="aw-ai-safety-note">Medical questions always transfer to clinic staff.</div></article>
      </section>
    </div>
  );
}
