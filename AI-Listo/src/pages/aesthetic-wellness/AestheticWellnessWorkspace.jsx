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
import { useTranslation } from "react-i18next";
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

function money(value, language = "en") {
  const localeMap = {
    en: "en-US",
    es: "es-ES",
    pt: "pt-BR",
  };

  const locale = localeMap[language] || "en-US";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatResponseTime(seconds, t) {
  const total = Number(seconds || 0);
  if (!total) return "—";

  if (total < 60) {
    return t("aestheticWellness.time.secondsShort", {
      count: Math.round(total),
    });
  }

  const mins = Math.floor(total / 60);
  const secs = Math.round(total % 60);

  if (!secs) {
    return t("aestheticWellness.time.minutesShort", {
      count: mins,
    });
  }

  return `${t("aestheticWellness.time.minutesShort", {
    count: mins,
  })} ${t("aestheticWellness.time.secondsShort", {
    count: secs,
  })}`;
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
  const { t, i18n } = useTranslation();

  const language = (
    i18n.resolvedLanguage ||
    i18n.language ||
    "en"
  )
    .split("-")[0]
    .toLowerCase();
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
      setError(e?.message || t("aestheticWellness.errors.loadDashboard"));
    } finally {
      setLoading(false);
    }
  }, [range, locationId, providerId, t]);

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

  const translateStatus = (status, fallback) => {
    const key = String(status || "").toLowerCase();

    const statusKeys = {
      pending: "pending",
      confirmed: "confirmed",
      completed: "completed",
      canceled: "canceled",
      cancelled: "canceled",
      scheduled: "scheduled",
      no_show: "noShow",
      "no-show": "noShow",
    };

    const translatedKey = statusKeys[key];

    return translatedKey
      ? t(`aestheticWellness.status.${translatedKey}`)
      : fallback || status || "—";
  };

  const translatePipelineStage = (stage) => {
    const keyMap = {
      "new-inquiry": "newInquiry",
      "ai-qualified": "aiQualified",
      "consultation-booked": "consultationBooked",
      confirmed: "confirmed",
      "treatment-completed": "treatmentCompleted",
      "follow-up": "followUp",
    };

    const key = keyMap[stage?.id];

    return key
      ? t(`aestheticWellness.pipeline.${key}`)
      : stage?.name || "";
  };

  const translateFollowUp = (item) => {
    const keyMap = {
      "post-treatment": "postTreatment",
      "missed-consultations": "missedConsultations",
      "unanswered-inquiries": "unansweredInquiries",
      "rebooking-reminders": "rebookingReminders",
    };

    const key = keyMap[item?.id];

    return key
      ? t(`aestheticWellness.followUp.${key}`)
      : item?.label || "";
  };

  const translateDueLabel = (label = "") => {
    if (!label) return "";

    if (label === "Due today") {
      return t("aestheticWellness.rebooking.dueToday");
    }

    const overdue = label.match(/^(\d+) day(?:s)? overdue$/i);
    if (overdue) {
      return t("aestheticWellness.rebooking.daysOverdue", {
        count: Number(overdue[1]),
      });
    }

    const dueIn = label.match(/^Due in (\d+) day(?:s)?$/i);
    if (dueIn) {
      return t("aestheticWellness.rebooking.dueInDays", {
        count: Number(dueIn[1]),
      });
    }

    return label;
  };

  const exportCsv = () => {
    const rows = [
      [t("aestheticWellness.csv.metric"), t("aestheticWellness.csv.value")],
      [t("aestheticWellness.metrics.newInquiries"), dashboard.metrics?.newInquiries?.value ?? 0],
      [t("aestheticWellness.metrics.consultationsBooked"), dashboard.metrics?.consultationsBooked?.value ?? 0],
      [t("aestheticWellness.metrics.todaysAppointments"), dashboard.metrics?.todaysAppointments?.value ?? 0],
      [t("aestheticWellness.metrics.showRate"), `${dashboard.metrics?.showRate?.value ?? 0}%`],
      [t("aestheticWellness.metrics.revenueToday"), dashboard.metrics?.revenueToday?.value ?? 0],
      [t("aestheticWellness.metrics.rebookingDue"), dashboard.metrics?.rebookingDue?.value ?? 0],
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

  if (loading && !dashboard) return <div className="aw-page aw-loading">{t("aestheticWellness.loading")}</div>;

  return (
    <div className="aw-page">
      <header className="aw-page-header">
        <div className="aw-title-wrap">
          <div className="aw-title-icon"><Sparkles size={34} strokeWidth={1.8} /></div>
          <div>
            <h1>{t("aestheticWellness.title")}</h1>
            <p>{t("aestheticWellness.subtitle")}</p>
          </div>
        </div>

        <div className="aw-header-actions">
          <button type="button" className="aw-top-control aw-date-control" onClick={() => setRange((v) => v === "today" ? "7d" : "today")}>
            <CalendarDays size={15} /><span>{range === "today" ? t("aestheticWellness.today") : t("aestheticWellness.last7Days")}</span><ChevronDown size={14} />
          </button>

          <div className="aw-filter-wrap" ref={filterRef}>
            <button type="button" className="aw-top-control" onClick={() => setFiltersOpen((v) => !v)}><Filter size={15} /><span>{t("aestheticWellness.filters.title")}</span></button>
            {filtersOpen && (
              <div className="aw-filter-popover">
                <label>{t("aestheticWellness.filters.location")}<select value={locationId} onChange={(e) => { setLocationId(e.target.value); setProviderId(""); }}><option value="">{t("aestheticWellness.filters.allLocations")}</option>{locations.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
                <label>{t("aestheticWellness.filters.provider")}<select value={providerId} onChange={(e) => setProviderId(e.target.value)}><option value="">{t("aestheticWellness.filters.allProviders")}</option>{providers.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
                <button type="button" onClick={() => { setLocationId(""); setProviderId(""); setFiltersOpen(false); }}>{t("aestheticWellness.filters.clear")}</button>
              </div>
            )}
          </div>

          <button type="button" className="aw-top-control" onClick={exportCsv}><Download size={15} /><span>{t("aestheticWellness.export")}</span></button>
        </div>
      </header>

      {error && <div className="aw-error"><span>{error}</span><button onClick={load}>{t("aestheticWellness.retry")}</button></div>}

      {!dashboard.setup?.completed && (
        <section className="aw-setup-warning">
          <div><Sparkles size={20} /><div><strong>{t("aestheticWellness.setup.title")}</strong><p>{t("aestheticWellness.setup.description")}</p></div></div>
          <div className="aw-setup-warning-actions">
            <button className="aw-secondary-btn" onClick={() => goSetup(dashboard.setup?.firstIncompleteStep || 1)}>{t("aestheticWellness.setup.finish")}</button>
            <button className="aw-primary-btn" onClick={() => goSetup()}>{t("aestheticWellness.setup.complete")}</button>
          </div>
        </section>
      )}

      <section className="aw-agent-card">
        <div className="aw-agent-main">
          <div className="aw-agent-avatar"><Bot size={34} strokeWidth={1.8} /></div>
          <div className="aw-agent-copy">
            <span className="aw-overline">{t("aestheticWellness.aiReceptionist.overline")}</span>
            <div className="aw-agent-title">
              <h2>{dashboard.aiReceptionist.live ? t("aestheticWellness.aiReceptionist.activeTitle") : t("aestheticWellness.aiReceptionist.inactiveTitle")}</h2>
              <span className={`aw-live-pill ${dashboard.aiReceptionist.live ? "live" : "inactive"}`}><i />{dashboard.aiReceptionist.live ? t("aestheticWellness.aiReceptionist.live") : t("aestheticWellness.aiReceptionist.setupRequired")}</span>
            </div>
            <p>{t("aestheticWellness.aiReceptionist.description")}</p>
          </div>
        </div>
        <div className="aw-agent-stat"><div><MessageCircle size={24} strokeWidth={1.8} /><strong>{dashboard.aiReceptionist.conversationsToday || 0}</strong></div><span>{t("aestheticWellness.aiReceptionist.conversationsToday")}</span></div>
        <div className="aw-agent-stat"><div><CalendarPlus size={24} strokeWidth={1.8} /><strong>{dashboard.aiReceptionist.consultationsBooked || 0}</strong></div><span>{t("aestheticWellness.aiReceptionist.consultationsBooked")}</span></div>
        <div className="aw-agent-stat"><div><Zap size={24} strokeWidth={1.8} /><strong>{formatResponseTime(dashboard.aiReceptionist.avgResponseSeconds, t)}</strong></div><span>{t("aestheticWellness.aiReceptionist.avgResponse")}</span></div>
        <div className="aw-agent-actions"><button className="aw-primary-btn" onClick={viewConversations}>{t("aestheticWellness.aiReceptionist.viewConversations")}</button><button className="aw-secondary-btn" onClick={manageAgent}>{t("aestheticWellness.aiReceptionist.manageAgent")}</button></div>
      </section>

      <section className="aw-stats-grid">
        <StatCard icon={UsersRound} title={t("aestheticWellness.metrics.newInquiries")} value={dashboard.metrics?.newInquiries?.value ?? 0} trend={dashboard.metrics?.newInquiries?.trendPercent} comparison={t("aestheticWellness.comparison.vsYesterday")} />
        <StatCard icon={CalendarPlus} title={t("aestheticWellness.metrics.consultationsBooked")} value={dashboard.metrics?.consultationsBooked?.value ?? 0} trend={dashboard.metrics?.consultationsBooked?.trendPercent} comparison={t("aestheticWellness.comparison.vsYesterday")} />
        <StatCard icon={CalendarDays} title={t("aestheticWellness.metrics.todaysAppointments")} value={dashboard.metrics?.todaysAppointments?.value ?? 0} trend={dashboard.metrics?.todaysAppointments?.trendPercent} comparison={t("aestheticWellness.comparison.vsYesterday")} />
        <StatCard icon={Percent} title={t("aestheticWellness.metrics.showRate")} value={`${dashboard.metrics?.showRate?.value ?? 0}%`} trend={dashboard.metrics?.showRate?.trendPercent} comparison={t("aestheticWellness.comparison.vsLastWeek")} />
        <StatCard icon={CircleDollarSign} title={t("aestheticWellness.metrics.revenueToday")} value={money(dashboard.metrics?.revenueToday?.value, language)} trend={dashboard.metrics?.revenueToday?.trendPercent} comparison={t("aestheticWellness.comparison.vsYesterday")} />
        <StatCard icon={RefreshCw} title={t("aestheticWellness.metrics.rebookingDue")} value={dashboard.metrics?.rebookingDue?.value ?? 0} trend={dashboard.metrics?.rebookingDue?.trendPercent} comparison={t("aestheticWellness.comparison.vsYesterday")} />
      </section>

      <section className="aw-dashboard-main">
        <article className="aw-panel aw-schedule">
          <SectionHeader icon={CalendarDays} title={t("aestheticWellness.schedule.title")} action={t("aestheticWellness.actions.viewAll")} onAction={viewCalendar} />
          <div className="aw-schedule-list">
            {dashboard.schedule.length ? dashboard.schedule.map((item) => <div className="aw-schedule-row" key={item.id}><strong>{item.timeLabel}</strong><b>{item.clientName}</b><span>{item.serviceName}</span><span>{item.providerName}</span><em className={`aw-status ${item.status || ""}`}>{translateStatus(item.status, item.statusLabel)}</em></div>) : <div className="aw-empty">{t("aestheticWellness.schedule.empty")}</div>}
          </div>
          <div className="aw-schedule-actions"><button className="aw-secondary-btn" onClick={viewCalendar}><CalendarDays size={15} /> {t("aestheticWellness.schedule.viewCalendar")}</button><button className="aw-primary-btn" onClick={addAppointment}><CalendarPlus size={15} /> {t("aestheticWellness.schedule.addAppointment")}</button></div>
        </article>

        <div className="aw-center-column">
          <article className="aw-panel">
            <SectionHeader icon={Filter} title={t("aestheticWellness.pipeline.title")} action={t("aestheticWellness.pipeline.viewPipeline")} onAction={viewPipeline} />
            <div className="aw-pipeline">{dashboard.pipeline.length ? dashboard.pipeline.map((stage) => <div className="aw-pipeline-stage" key={stage.id}><span>{translatePipelineStage(stage)}</span><strong>{stage.count || 0}</strong></div>) : <div className="aw-empty">{t("aestheticWellness.pipeline.empty")}</div>}</div>
          </article>
          <div className="aw-small-panel-grid">
            <article className="aw-panel"><SectionHeader icon={RefreshCw} title={t("aestheticWellness.rebooking.title")} action={t("aestheticWellness.actions.viewAll")} /><div>{dashboard.rebookingClients.length ? dashboard.rebookingClients.slice(0, 3).map((client) => <div className="aw-rebook-row" key={client.id}><div><strong>{client.clientName}</strong><span>{client.treatmentName}</span></div><span className={`aw-due ${client.overdue ? "danger" : ""}`}>{translateDueLabel(client.dueLabel)}</span><button onClick={viewConversations}>{t("aestheticWellness.rebooking.sendReminder")}</button></div>) : <div className="aw-empty">{t("aestheticWellness.rebooking.empty")}</div>}</div></article>
            <article className="aw-panel"><SectionHeader icon={ListChecks} title={t("aestheticWellness.followUp.title")} action={t("aestheticWellness.actions.viewAll")} />{dashboard.followUpQueue.map((item) => <div className="aw-followup-row" key={item.id}><strong>{item.count || 0}</strong><span>{translateFollowUp(item)}</span></div>)}<button className="aw-primary-btn aw-full-btn" onClick={() => navigate(`/dashboard/leads?workspace_id=${WORKSPACE_ID}&follow_up=due`)}>{t("aestheticWellness.followUp.review")}</button></article>
          </div>
        </div>

        <article className="aw-panel aw-treatment-panel">
          <SectionHeader icon={TrendingUp} title={t("aestheticWellness.treatmentInterest.title")} right={<span className="aw-section-range">{t("aestheticWellness.last30Days")}</span>} />
          <div className="aw-treatment-list">{dashboard.treatmentInterest.length ? dashboard.treatmentInterest.slice(0, 5).map((item) => <div className="aw-treatment-row" key={item.name}><span>{item.name}</span><div className="aw-treatment-track"><i style={{ width: `${Math.min(Number(item.percent || 0), 100)}%` }} /></div><strong>{item.percent || 0}%</strong></div>) : <div className="aw-empty">{t("aestheticWellness.treatmentInterest.empty")}</div>}</div>
        </article>
      </section>

      <section className="aw-bottom-grid">
        <article className="aw-panel"><SectionHeader icon={UsersRound} title={t("aestheticWellness.providerPerformance.title")} right={<button className="aw-link-button" onClick={manageProviders}>{t("aestheticWellness.providerPerformance.manageProviders")}</button>} /><div className="aw-provider-table"><div className="aw-provider-head"><span>{t("aestheticWellness.providerPerformance.provider")}</span><span>{t("aestheticWellness.providerPerformance.appointments")}</span><span>{t("aestheticWellness.providerPerformance.revenue")}</span><span>{t("aestheticWellness.providerPerformance.showRate")}</span></div>{dashboard.providers.length ? dashboard.providers.slice(0, 5).map((p) => <div className="aw-provider-row" key={p.id}><strong>{p.name}</strong><span>{p.appointments || 0}</span><span>{money(p.revenue, language)}</span><strong>{p.showRate || 0}%</strong></div>) : <div className="aw-empty">{t("aestheticWellness.providerPerformance.empty")}</div>}</div></article>
        <article className="aw-panel"><SectionHeader icon={TrendingUp} title={t("aestheticWellness.revenueOverview.title")} right={<span className="aw-section-range">{t("aestheticWellness.last7Days")}</span>} /><div className="aw-revenue-summary"><strong>{money(dashboard.revenueOverview.total, language)}</strong><span>{Number(dashboard.revenueOverview.changePercent || 0) >= 0 ? "↑" : "↓"} {Math.abs(Number(dashboard.revenueOverview.changePercent || 0))}%</span></div><div className="aw-revenue-chart">{dashboard.revenueOverview.points.map((point, i) => <div className="aw-chart-point" key={`${point.label}-${i}`} style={{ "--value": Number(point.percent || 0) / 100 }}><i /><span>{point.label}</span></div>)}</div></article>
        <article className="aw-panel"><SectionHeader icon={Bot} title={t("aestheticWellness.aiActivity.title")} action={t("aestheticWellness.actions.viewAll")} onAction={viewConversations} /><div className="aw-ai-activity-list">{dashboard.aiActivity.length ? dashboard.aiActivity.slice(0, 5).map((a) => <div className="aw-ai-activity-row" key={a.id}><i /><span>{a.timeLabel}</span><strong>{a.title}</strong></div>) : <div className="aw-empty">{t("aestheticWellness.aiActivity.empty")}</div>}</div><div className="aw-ai-safety-note">{t("aestheticWellness.aiActivity.safetyNote")}</div></article>
      </section>
    </div>
  );
}
