import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import "./generator.css";
import {
  Download,
  Sparkles,
  ChevronDown,
  Search,
  Eye,
  Activity,
  Globe,
  MapPin,
  Building2,
  Layers,
  CheckCircle2,
  Trash2,
  Filter,
  Grid,
  List,
  ExternalLink,
  Users,
  Bot,
  Flame,
  ArrowRight,
  TrendingUp,
  MoreVertical,
  Phone,
  Save,
  NotepadTextDashed,
  ToolCase,
  Loader2,
  AlertTriangle,
  PlugZap,
} from "lucide-react";
import leadgenApi from "../../api/leadgenApi";

const TERMINAL = ["completed", "ready", "failed", "cancelled"];

const COUNTRY_NAMES = {
  US: "United States",
  CA: "Canada",
  AU: "Australia",
  GB: "United Kingdom",
  ES: "Spain",
  MX: "Mexico",
  CO: "Colombia",
  BR: "Brazil",
  CL: "Chile",
  AR: "Argentina",
  EC: "Ecuador",
};

// Display order of the pipeline nodes and how each real status maps onto it.
const PIPELINE = [
  { key: "searching", label: "Searching", icon: Search },
  { key: "analyzing", label: "Analyzing", icon: Sparkles },
  { key: "dedup", label: "Removing duplicates", icon: Filter },
  { key: "scoring", label: "Scoring", icon: Sparkles },
  { key: "ready", label: "Ready", icon: CheckCircle2 },
];
const STATUS_TO_NODE = {
  created: 0,
  searching: 0,
  analyzing: 1,
  dedup: 2,
  enriching: 3,
  scoring: 3,
  qualifying: 4,
  ready: 4,
  completed: 4,
};

function initials(name) {
  if (!name) return "?";
  const parts = String(name).trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() || "").join("") || "?";
}

function bandClass(band) {
  if (band === "hot") return "hot";
  if (band === "warm") return "warm";
  return "cold";
}

export default function LeadGeneratorPage() {
  const { t } = useTranslation();
  const mounted = useRef(true);
  const pollTimer = useRef(null);

  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState(null);
  const [kpis, setKpis] = useState({
    leadsTotal: 0,
    leadsQualified: 0,
    leadsImported: 0,
    hot: 0,
    warm: 0,
    cold: 0,
    avgScore: null,
  });
  const [search, setSearch] = useState(null);
  const [searchId, setSearchId] = useState(null);
  const [leads, setLeads] = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);
  const [showSaved, setShowSaved] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [msg, setMsg] = useState(null);

  const [form, setForm] = useState({
    keywords: "",
    country: "all",
    city: "",
    industry: "",
    limit: "50",
    minScore: "0",
    aiInstructions: "",
    saveSearch: false,
    saveName: "",
  });
  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const stopPoll = () => {
    if (pollTimer.current) {
      clearTimeout(pollTimer.current);
      pollTimer.current = null;
    }
  };

  const refreshOverview = useCallback(() => {
    leadgenApi
      .getOverview()
      .then((o) => mounted.current && o?.kpis && setKpis(o.kpis))
      .catch(() => {});
  }, []);

  const loadLeads = useCallback(async (id) => {
    if (!id) return;
    setLeadsLoading(true);
    try {
      const r = await leadgenApi.listLeads(id, { limit: 100 });
      if (mounted.current) setLeads(r?.data || []);
    } catch {
      if (mounted.current) setLeads([]);
    } finally {
      if (mounted.current) setLeadsLoading(false);
    }
  }, []);

  const pollSearch = useCallback(
    (id) => {
      stopPoll();
      const tick = async () => {
        try {
          const s = await leadgenApi.getSearch(id);
          if (!mounted.current) return;
          setSearch(s);
          if (TERMINAL.includes(s.status)) {
            loadLeads(id);
            refreshOverview();
            return;
          }
        } catch {
          return; // stop polling on error
        }
        pollTimer.current = setTimeout(tick, 1200);
      };
      tick();
    },
    [loadLeads, refreshOverview],
  );

  const loadSaved = useCallback(() => {
    leadgenApi
      .listSavedSearches()
      .then((r) => mounted.current && setSavedSearches(r?.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    mounted.current = true;
    (async () => {
      try {
        const [ctx, ov, searches] = await Promise.all([
          leadgenApi.getContext().catch(() => null),
          leadgenApi.getOverview().catch(() => null),
          leadgenApi.listSearches({ limit: 1 }).catch(() => null),
        ]);
        if (!mounted.current) return;
        setContext(ctx);
        if (ov?.kpis) setKpis(ov.kpis);
        const latest = searches?.data?.[0];
        if (latest) {
          setSearch(latest);
          setSearchId(latest.id);
          loadLeads(latest.id);
          if (!TERMINAL.includes(latest.status)) pollSearch(latest.id);
        }
        loadSaved();
      } finally {
        if (mounted.current) setLoading(false);
      }
    })();
    return () => {
      mounted.current = false;
      stopPoll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generate = async () => {
    if (generating) return;
    setMsg(null);
    setGenerating(true);
    try {
      const body = {
        mode: "advanced",
        keywords: form.keywords || form.industry || form.city,
        industry: form.industry,
        location: form.city,
        countries: form.country === "all" ? [] : [form.country],
        limit: Number(form.limit) || 50,
      };
      const s = await leadgenApi.createSearch(body);
      if (!mounted.current) return;
      setSearch(s);
      setSearchId(s.id);
      setLeads([]);
      setSelectedLeads([]);
      if (form.saveSearch && form.saveName.trim()) {
        leadgenApi
          .createSavedSearch({ name: form.saveName.trim(), ...body })
          .then(loadSaved)
          .catch(() => {});
      }
      pollSearch(s.id);
    } catch (e) {
      setMsg(e?.message || "Could not start the search.");
    } finally {
      if (mounted.current) setGenerating(false);
    }
  };

  const importOne = async (leadId) => {
    try {
      const r = await leadgenApi.importLead(leadId);
      if (!mounted.current) return;
      setLeads((prev) =>
        prev.map((l) =>
          l.id === leadId ? { ...l, status: r?.duplicate ? "duplicate" : "imported" } : l,
        ),
      );
      refreshOverview();
      setMsg(r?.duplicate ? "Already in your CRM — skipped." : "Saved to CRM.");
    } catch (e) {
      setMsg(e?.message || "Could not save to CRM.");
    }
  };

  const importMany = async (ids) => {
    for (const id of ids) {
      // sequential so suppression/dedupe are honored one-by-one
      // eslint-disable-next-line no-await-in-loop
      await importOne(id);
    }
    setSelectedLeads([]);
  };

  const toggleLeadSelection = (id) => {
    setSelectedLeads((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const removeSavedSearch = async (id) => {
    try {
      await leadgenApi.deleteSavedSearch(id);
      loadSaved();
    } catch {
      /* noop */
    }
  };

  const applySaved = (s) => {
    const c = s.criteria || {};
    setForm((f) => ({
      ...f,
      keywords: c.keywords || "",
      industry: c.industry || "",
      city: c.location || "",
      country: Array.isArray(c.countries) && c.countries.length === 1 ? c.countries[0] : "all",
      limit: String(c.limit || 50),
    }));
    setShowSaved(false);
  };

  const exportCsv = () => {
    if (!leads.length) {
      setMsg("There are no leads to export yet.");
      return;
    }
    const headers = [
      "Business",
      "Contact",
      "Title",
      "Email",
      "Phone",
      "Website",
      "City",
      "Country",
      "AI Score",
      "Band",
      "Source",
      "Status",
    ];
    const cell = (v) => {
      const s = v == null ? "" : String(v);
      // Guard against CSV formula injection from provider-sourced text.
      const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
      return `"${safe.replace(/"/g, '""')}"`;
    };
    const rows = leads.map((l) =>
      [
        l.businessName,
        l.contactName,
        l.title,
        l.email,
        l.phone,
        l.website,
        l.city,
        l.country,
        l.aiScore,
        l.aiBand,
        l.sourceProvider || l.source,
        l.status,
      ]
        .map(cell)
        .join(","),
    );
    const csv = [headers.map(cell).join(","), ...rows].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leads.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ---- derived, all from real data ----
  const notConnected = context && context.canGenerate === false;
  const sources = context?.sources || [];
  const counts = search?.counts || {};
  const activeNode = search ? STATUS_TO_NODE[search.status] ?? -1 : -1;
  const isRunning = search && !TERMINAL.includes(search.status);

  const metrics = [
    { title: t("generator.metricGeneratedLeads"), value: kpis.leadsTotal || 0, type: "blue", icon: <Users size={20} /> },
    { title: t("generator.metricAiQualified"), value: kpis.leadsQualified || 0, type: "green", icon: <Bot size={20} /> },
    { title: t("generator.metricHotOpportunities"), value: kpis.hot || 0, type: "red", icon: <Flame size={20} /> },
    { title: "Warm", value: kpis.warm || 0, type: "purple", icon: <Layers size={20} /> },
    { title: "Cold", value: kpis.cold || 0, type: "orange", icon: <TrendingUp size={20} /> },
    { title: t("generator.metricMovedToCrm"), value: kpis.leadsImported || 0, type: "cyan", icon: <CheckCircle2 size={20} /> },
    { title: t("generator.metricAvgAiScore"), value: kpis.avgScore == null ? "—" : `${kpis.avgScore}%`, type: "star", icon: <Sparkles size={20} /> },
  ];

  const donut = useMemo(() => {
    const hot = kpis.hot || 0;
    const warm = kpis.warm || 0;
    const cold = kpis.cold || 0;
    const total = hot + warm + cold;
    const pct = (n) => (total ? (n / total) * 100 : 0);
    return { hot, warm, cold, total, hotPct: pct(hot), warmPct: pct(warm), coldPct: pct(cold) };
  }, [kpis]);

  const topCities = useMemo(() => {
    const map = new Map();
    for (const l of leads) {
      const c = l.city || l.country;
      if (!c) continue;
      map.set(c, (map.get(c) || 0) + 1);
    }
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  }, [leads]);

  const qualifiedIds = leads
    .filter((l) => l.status === "qualified" || l.aiBand === "hot" || l.aiBand === "warm")
    .map((l) => l.id);

  if (loading) {
    return (
      <div className="generator-page">
        <div className="heading_page">
          <Sparkles className="header-icon" size={20} />
          <h1>{t("generator.pageTitle")}</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#64748b", padding: "40px 0" }}>
          <Loader2 size={18} className="spin" /> Loading the Lead Generator…
        </div>
      </div>
    );
  }

  return (
    <div className="generator-page">
      <div className="heading_page">
        <Sparkles className="header-icon" size={20} />
        <h1>{t("generator.pageTitle")}</h1>
      </div>
      <p className="sub_head">{t("generator.subheading")}</p>

      {/* Honest provider-connection banner */}
      {notConnected && (
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
            background: "#fff8ec",
            border: "1px solid #f5d9a8",
            borderRadius: 12,
            padding: "14px 16px",
            margin: "6px 0 4px",
          }}
        >
          <PlugZap size={20} color="#b45309" style={{ flex: "none", marginTop: 2 }} />
          <div style={{ fontSize: 13.5, color: "#7c5307", lineHeight: 1.5 }}>
            <b style={{ color: "#7c2d12" }}>No data provider is connected yet.</b>{" "}
            {context?.providerNotice ||
              "Lead generation returns no results until a discovery provider is configured. No sample or placeholder leads are shown."}
          </div>
        </div>
      )}

      {msg && (
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            background: "#eef2ff",
            border: "1px solid #c7d2fe",
            borderRadius: 10,
            padding: "10px 14px",
            margin: "6px 0",
            fontSize: 13,
            color: "#3730a3",
          }}
        >
          <AlertTriangle size={15} /> {msg}
          <button
            onClick={() => setMsg(null)}
            style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#3730a3" }}
          >
            ✕
          </button>
        </div>
      )}

      <div className="page-header">
        <div className="header-actions" style={{ position: "relative" }}>
          <button className="btn-icon-text" onClick={exportCsv}>
            <Download size={15} /> {t("generator.export")}
          </button>
          <button className="btn-icon-text" onClick={() => setShowSaved((v) => !v)}>
            <Eye size={15} /> {t("generator.savedSearches")}
          </button>
          <button className="btn-icon-text" onClick={() => setMsg("Campaign drafts arrive with the outreach slice.")}>
            <Activity size={15} /> {t("generator.campaignDrafts")}
          </button>
          <button className="btn-primary" onClick={generate} disabled={generating || isRunning}>
            {generating || isRunning ? <Loader2 size={15} className="spin" /> : <Sparkles size={15} fill="white" />}{" "}
            {t("generator.generateNewLeads")}
          </button>

          {showSaved && (
            <div
              style={{
                position: "absolute",
                top: "110%",
                right: 0,
                zIndex: 20,
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                boxShadow: "0 8px 24px rgba(15,23,42,.12)",
                width: 300,
                padding: 8,
              }}
            >
              {savedSearches.length === 0 ? (
                <div style={{ padding: 12, fontSize: 13, color: "#64748b" }}>No saved searches yet.</div>
              ) : (
                savedSearches.map((s) => (
                  <div
                    key={s.id}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8 }}
                  >
                    <button
                      onClick={() => applySaved(s)}
                      style={{ flex: 1, textAlign: "left", background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#0f172a" }}
                    >
                      {s.name}
                    </button>
                    <button
                      onClick={() => removeSavedSearch(s.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626" }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* METRICS ROW (real KPIs) */}
      <div className="metrics-summary-grid">
        {metrics.map((m, idx) => (
          <div className={`metric-mini-card ${m.type}`} key={idx}>
            <div className={`metric-mini-icon ${m.type}`}>{m.icon}</div>
            <div className="metric-mini-info">
              <span>{m.title}</span>
              <div className="metric-num-wrapper">
                <h2>{m.value}</h2>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CONFIGURATION BLOCK (industry-neutral, controlled) */}
      <div className="config-section-container">
        <h3 className="section-block-title">{t("generator.configTitle")}</h3>
        <div className="inputs-form-grid">
          <div className="form-field-group">
            <label>What are you looking for?</label>
            <div className="input-select-wrapper">
              <input
                placeholder="e.g. dental clinics, law firms, real estate agencies"
                value={form.keywords}
                onChange={(e) => setField("keywords", e.target.value)}
              />
            </div>
          </div>

          <div className="form-field-group">
            <label>{t("generator.labelCountry")}</label>
            <div className="input-select-wrapper">
              <select value={form.country} onChange={(e) => setField("country", e.target.value)}>
                <option value="all">All launch markets</option>
                {(context?.launchCountries || Object.keys(COUNTRY_NAMES)).map((c) => (
                  <option key={c} value={c}>
                    {COUNTRY_NAMES[c] || c}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="select-chevron-icon" />
            </div>
          </div>

          <div className="form-field-group">
            <label>{t("generator.labelCity")}</label>
            <div className="input-select-wrapper">
              <input
                placeholder="Optional"
                value={form.city}
                onChange={(e) => setField("city", e.target.value)}
              />
            </div>
          </div>

          <div className="form-field-group">
            <label>{t("generator.labelIndustry")}</label>
            <div className="input-select-wrapper">
              <input
                placeholder="Optional"
                value={form.industry}
                onChange={(e) => setField("industry", e.target.value)}
              />
            </div>
          </div>

          <div className="form-field-group">
            <label>{t("generator.labelNumberOfLeads")}</label>
            <div className="input-select-wrapper">
              <select value={form.limit} onChange={(e) => setField("limit", e.target.value)}>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
              <ChevronDown size={14} className="select-chevron-icon" />
            </div>
          </div>

          <div className="form-field-group">
            <label>
              {t("generator.labelMinimumAiScore")} <span>{t("generator.optional")}</span>
            </label>
            <div className="input-select-wrapper">
              <select value={form.minScore} onChange={(e) => setField("minScore", e.target.value)}>
                <option value="0">Any</option>
                <option value="40">40%+</option>
                <option value="70">70%+</option>
                <option value="85">85%+</option>
              </select>
              <ChevronDown size={14} className="select-chevron-icon" />
            </div>
          </div>
        </div>

        <div className="config-action-bottom-row">
          <div className="right-action-cluster" style={{ marginLeft: 0 }}>
            <div className="toggle-control-label">
              <span>{t("generator.saveThisSearch")}</span>
              <div
                className={`switch-toggle-component ${form.saveSearch ? "active-green" : ""}`}
                onClick={() => setField("saveSearch", !form.saveSearch)}
              ></div>
            </div>
            {form.saveSearch && (
              <input
                placeholder="Name this search"
                value={form.saveName}
                onChange={(e) => setField("saveName", e.target.value)}
                style={{ padding: "6px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13 }}
              />
            )}
          </div>
          <button
            className="btn-primary"
            style={{ padding: "0 24px" }}
            onClick={generate}
            disabled={generating || isRunning}
          >
            {generating || isRunning ? <Loader2 size={14} className="spin" /> : <ToolCase size={14} />}{" "}
            {t("generator.generateNewLeads")}
          </button>
          <button
            className="btn-clear-form"
            onClick={() =>
              setForm({
                keywords: "",
                country: "all",
                city: "",
                industry: "",
                limit: "50",
                minScore: "0",
                aiInstructions: "",
                saveSearch: false,
                saveName: "",
              })
            }
          >
            {t("generator.clear")}
          </button>
        </div>
      </div>

      {/* LOWER GRID */}
      <div className="lower-split-dashboard-grid">
        <div className="right-analytics">
          <div className="process-management-row">
            {/* SOURCE FOCUS — real connectors */}
            <div className="inner-process-card">
              <h3 className="section-block-title green-theme">{t("generator.sourceFocusTitle")}</h3>
              <div className="sources-selection-flex-list">
                {sources.map((s) => (
                  <div className="source-checkbox-item-box" key={s.key} title={s.role}>
                    <CheckCircle2
                      size={18}
                      fill={s.connected ? "#16a34a" : "#cbd5e1"}
                      color="white"
                      className="source-box-check-indicator"
                    />
                    <div className="source-box-icon-center">
                      {s.kind === "discovery" ? (
                        <Building2 size={18} />
                      ) : s.kind === "enrichment" ? (
                        <Layers size={18} />
                      ) : s.kind === "verification" ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        <Globe size={18} />
                      )}
                    </div>
                    <span>{s.name}</span>
                    <span
                      style={{
                        fontSize: 10,
                        color: s.connected ? "#16a34a" : "#94a3b8",
                        fontWeight: 600,
                      }}
                    >
                      {s.connected ? "Connected" : "Not connected"}
                    </span>
                  </div>
                ))}
              </div>
              <p className="sources-disclaimer-notice-text">{t("generator.sourcesDisclaimer")}</p>
            </div>

            {/* SEARCH PROGRESS — real status */}
            <div className="inner-process-card">
              <h3 className="section-block-title">{t("generator.searchProgressTitle")}</h3>
              {!search ? (
                <div style={{ padding: "18px 4px", color: "#64748b", fontSize: 13 }}>
                  No search has run yet. Set your criteria above and generate leads.
                </div>
              ) : (
                <div className="pipeline-progress-steps-line">
                  <div className="pipeline-line-connector-back"></div>
                  {PIPELINE.map((node, i) => {
                    const failed = search.status === "failed" || search.status === "cancelled";
                    let stateClass = "pending-orange-state";
                    if (!failed) {
                      if (i < activeNode) stateClass = "done-state";
                      else if (i === activeNode) stateClass = isRunning ? "active-state" : "done-state";
                    }
                    const Icon = node.icon;
                    const isReadyNode = i === PIPELINE.length - 1;
                    return (
                      <div className="pipeline-single-node-step" key={node.key}>
                        <div className={`pipeline-node-circle-icon ${stateClass}`}>
                          {isReadyNode && TERMINAL.includes(search.status) && !failed ? (
                            leads.length
                          ) : (
                            <Icon size={15} />
                          )}
                        </div>
                        <span className="pipeline-step-caption-text">{node.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              {search?.statusDetail && (
                <p style={{ marginTop: 10, fontSize: 12, color: "#64748b" }}>{search.statusDetail}</p>
              )}
            </div>
          </div>
        </div>

        {/* LIVE SUMMARY — real counts */}
        <div className="right-analytics-sidebar-panel">
          <div className="sidebar-analytics-card">
            <h3 className="sidebar-card-headline-title">{t("generator.liveSummary")}</h3>
            <div className="analytics-color-legend-list">
              <div className="legend-row-item-align">
                <span className="legend-label-left-side">{t("generator.sourcesChecked")}</span>
                <span className="legend-count-value-number" style={{ color: "#16a34a" }}>
                  {(search?.sourcesUsed || []).length}
                </span>
              </div>
              <div className="legend-row-item-align">
                <span className="legend-label-left-side">{t("generator.resultsFound")}</span>
                <span className="legend-count-value-number" style={{ color: "#16a34a" }}>
                  {counts.found || 0}
                </span>
              </div>
              <div className="legend-row-item-align">
                <span className="legend-label-left-side">{t("generator.qualifiedLeads")}</span>
                <span className="legend-count-value-number" style={{ color: "#ea580c" }}>
                  {counts.qualified || 0}
                </span>
              </div>
              <div className="legend-row-item-align">
                <span className="legend-label-left-side">{t("generator.duplicatesRemoved")}</span>
                <span className="legend-count-value-number" style={{ color: "#dc2626" }}>
                  {counts.deduped || 0}
                </span>
              </div>
            </div>
            {search && (
              <div style={{ marginTop: 12, fontSize: 11, color: "#64748b", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: isRunning ? "#ea580c" : "#16a34a" }}>●</span>{" "}
                {isRunning ? "Running…" : `Status: ${search.status}`}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* LEADS TABLE + INSIGHTS */}
      <div className="lower-split-dashboard-grid lower-split-dashboard-grid-1">
        <div className="lower-split-dashboard-grid-1-left">
          <div className="results-table-container-card">
            <div className="table-top-controls-bar">
              <h3 className="table-main-headline-title">
                {t("generator.leadsFound", { count: leads.length })}{" "}
                <Sparkles size={16} color="#ea580c" fill="#ea580c" />
              </h3>
              <div className="table-right-utilities-cluster">
                <div className="layout-view-toggle-buttons-group">
                  <button className="btn-layout-grid-list-toggle active-blue-view">
                    <List size={14} />
                  </button>
                </div>
              </div>
            </div>

            {leadsLoading ? (
              <div style={{ padding: "40px 0", color: "#64748b", display: "flex", gap: 10, alignItems: "center", justifyContent: "center" }}>
                <Loader2 size={18} className="spin" /> Loading leads…
              </div>
            ) : leads.length === 0 ? (
              <div style={{ padding: "48px 20px", textAlign: "center", color: "#64748b" }}>
                <Search size={26} style={{ opacity: 0.4 }} />
                <p style={{ margin: "12px 0 4px", fontWeight: 600, color: "#334155" }}>No leads yet</p>
                <p style={{ fontSize: 13 }}>
                  {notConnected
                    ? "Connect a data provider to generate real leads. Nothing is shown until then — no sample data."
                    : "Run a search with your criteria above to generate leads."}
                </p>
              </div>
            ) : (
              <div className="clean-line-list-wrapper">
                {leads.map((lead) => {
                  const name = lead.contactName || lead.businessName || "Unnamed lead";
                  const imported = lead.status === "imported" || lead.status === "duplicate";
                  return (
                    <div
                      className={`lead-row-item-line ${selectedLeads.includes(lead.id) ? "row-selected-active" : ""}`}
                      key={lead.id}
                    >
                      <div className="lead-profil-wrap">
                        <div className="lead-profile-identity-block">
                          <div>
                            <input
                              type="checkbox"
                              className="row-selection-checkbox-input"
                              checked={selectedLeads.includes(lead.id)}
                              onChange={() => toggleLeadSelection(lead.id)}
                            />
                          </div>
                          <div
                            className="lead-photo-avatar-circle"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: "#e0e7ff",
                              color: "#4338ca",
                              fontWeight: 700,
                              fontSize: 13,
                            }}
                          >
                            {initials(name)}
                          </div>
                          <div className="lead-text-details-stack">
                            <h4>
                              {name}{" "}
                              {imported && (
                                <span className="badge-new-arrival" style={{ background: "#dcfce7", color: "#166534" }}>
                                  {lead.status === "duplicate" ? "In CRM" : "Saved"}
                                </span>
                              )}
                            </h4>
                            <p>{lead.email || "—"}</p>
                            <div className="lead-communications-link-row">
                              <Phone size={14} />
                              {lead.phone || "—"}
                            </div>
                          </div>
                        </div>

                        <div className="text-center">
                          {lead.title && <span className="agent-role-label-text">{lead.title}</span>}
                          {lead.aiBand && (
                            <div style={{ marginTop: "4px" }}>
                              <span className={`temperature-badge-pill ${bandClass(lead.aiBand)}`}>
                                {lead.aiBand}
                              </span>
                            </div>
                          )}
                          {lead.aiScore != null && (
                            <div className="ai-score-percentage-capsule">
                              <span>{t("generator.aiScore")}</span>
                              <div className="ai-score-ring-mini mid-green">{lead.aiScore}%</div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="lead-intent-interests-paragraph">
                        {lead.businessName && lead.contactName ? lead.businessName : ""}
                        {(lead.city || lead.country) && (
                          <span>
                            {[lead.city, lead.country].filter(Boolean).join(", ")}
                          </span>
                        )}
                      </div>

                      <div>
                        <div className="lead-origin-source-routing-block">
                          <span style={{ color: "#64748b", fontSize: "11px" }}>{t("generator.source")}</span>
                          <div>{lead.sourceProvider || lead.source || "—"}</div>
                          {lead.sourceUrl && (
                            <a
                              href={lead.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="source-external-link-anchor"
                            >
                              {lead.sourceUrl} <ExternalLink size={14} />
                            </a>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="table-row-actions-group">
                          <button
                            className="btn-save-row-lead"
                            onClick={() => importOne(lead.id)}
                            disabled={imported}
                          >
                            <Save size={12} />
                            {imported ? "Saved" : t("common.save")}
                          </button>
                          <button className="btn-row-more-options">
                            <MoreVertical size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {leads.length > 0 && (
              <div className="bulk-processing-footer-bar">
                <div className="bulk-selection-count-indicator-text">
                  {t("generator.selectedCount", { count: selectedLeads.length })}{" "}
                  <button onClick={() => setSelectedLeads([])}>{t("generator.clearSelection")}</button>
                </div>
                <div className="bulk-action-buttons-cluster">
                  <button
                    className="btn-footer-action-blue-submit"
                    onClick={() => importMany(selectedLeads)}
                    disabled={!selectedLeads.length}
                  >
                    <Save size={14} /> {t("generator.saveSelected", { count: selectedLeads.length })}
                  </button>
                  <button
                    className="btn-footer-action-green-submit"
                    onClick={() => importMany(qualifiedIds)}
                    disabled={!qualifiedIds.length}
                  >
                    <NotepadTextDashed size={14} /> {t("generator.saveAllQualified", { count: qualifiedIds.length })}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* INSIGHTS SIDEBAR — real distribution */}
        <div className="right-analytics-sidebar-panel lower-split-dashboard-grid-1-right">
          <div className="sidebar-analytics-card">
            <h3 className="sidebar-card-headline-title">{t("generator.aiScoreInsights")}</h3>
            <div className="ai-score-donut-chart-wrap">
              <div className="ai-score-donut-chart-graphic-box">
                <svg width="100" height="100" className="donut-svg-canvas-wrapper" viewBox="0 0 42 42">
                  {donut.total === 0 ? (
                    <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#e2e8f0" strokeWidth="4" />
                  ) : (
                    <>
                      <circle
                        cx="21"
                        cy="21"
                        r="15.91549430918954"
                        fill="transparent"
                        className="donut-segment hot-green-segment"
                        strokeDasharray={`${donut.hotPct} ${100 - donut.hotPct}`}
                        strokeDashoffset="0"
                      />
                      <circle
                        cx="21"
                        cy="21"
                        r="15.91549430918954"
                        fill="transparent"
                        className="donut-segment warm-orange-segment"
                        strokeDasharray={`${donut.warmPct} ${100 - donut.warmPct}`}
                        strokeDashoffset={`${-donut.hotPct}`}
                      />
                      <circle
                        cx="21"
                        cy="21"
                        r="15.91549430918954"
                        fill="transparent"
                        className="donut-segment cold-red-segment"
                        strokeDasharray={`${donut.coldPct} ${100 - donut.coldPct}`}
                        strokeDashoffset={`${-(donut.hotPct + donut.warmPct)}`}
                      />
                    </>
                  )}
                </svg>
                <div className="donut-center-absolute-labels-stack">
                  <h3>{kpis.leadsQualified || 0}</h3>
                  <p>{t("generator.qualifiedLeads")}</p>
                </div>
              </div>

              <div className="analytics-color-legend-list">
                <div className="legend-row-item-align">
                  <div className="legend-label-left-side">
                    <div className="legend-color-dot-indicator hot-red"></div>
                    <span>{t("generator.rangeHot")}</span>
                  </div>
                  <span className="legend-count-value-number">{donut.hot}</span>
                </div>
                <div className="legend-row-item-align">
                  <div className="legend-label-left-side">
                    <div className="legend-color-dot-indicator warm-orange"></div>
                    <span>{t("generator.rangeWarm")}</span>
                  </div>
                  <span className="legend-count-value-number">{donut.warm}</span>
                </div>
                <div className="legend-row-item-align">
                  <div className="legend-label-left-side">
                    <div className="legend-color-dot-indicator cold-blue"></div>
                    <span>{t("generator.rangeCold")}</span>
                  </div>
                  <span className="legend-count-value-number">{donut.cold}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="sidebar-analytics-card">
            <h3 className="sidebar-card-headline-title">{t("generator.topCitiesFound")}</h3>
            {topCities.length === 0 ? (
              <div style={{ fontSize: 13, color: "#94a3b8", padding: "8px 0" }}>No location data yet.</div>
            ) : (
              <div className="cities-distribution-ranking-list">
                {topCities.map((city, cIdx) => (
                  <div className="city-ranking-row-item" key={cIdx}>
                    <div className="city-name-left-group">
                      <span className="city-bullet-icon-svg">○</span>
                      {city.name}
                    </div>
                    <span className="city-leads-count-metric-num">{city.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
