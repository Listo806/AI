import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
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
  ArrowLeft,
  Bookmark,
  Rocket,
  Box,
  Mail,
  Camera,
  Map as MapIcon,
  BarChart3,
  Copy,
  Info,
  FileCheck2,
  CircleUserRound,
  ChevronRight,
  Target,
  MessageCircle,
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

  const [isMobileGenerator, setIsMobileGenerator] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 1024 : false,
  );
  const [mobileView, setMobileView] = useState("overview");

  useEffect(() => {
    const onResize = () => setIsMobileGenerator(window.innerWidth <= 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const [form, setForm] = useState({
    keywords: "",
    country: "all",
    city: "",
    industry: "",
    limit: "50",
    minScore: "0",
    aiInstructions: "",

    // Advanced-search presentation fields.
    // These stay local until the discovery backend supports the corresponding
    // criteria; existing real API payload below remains unchanged.
    companySize: "all",
    stateProvince: "all",
    postalCode: "",
    revenue: "all",
    technologies: "",
    jobTitle: "all",
    department: "all",
    seniority: "all",
    excludeKeywords: "",
    contactLinkedIn: true,
    contactWebsite: true,
    contactGoogle: true,
    contactCrunchbase: false,
    findEmails: true,

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
    if (generating) return false;

    setMsg(null);

    const keywords = String(form.keywords || "").trim();
    const industry = String(form.industry || "").trim();
    const city = String(form.city || "").trim();
    const area = String(form.postalCode || "").trim();

    if (!keywords && !industry && !city && !area) {
      setMsg(
        "Please enter a Product / Offer, Industry, City, or Area before generating leads."
      );
      return false;
    }

    setGenerating(true);

    try {
      const body = {
        mode: "advanced",

        keywords: keywords || industry || city || area,

        industry: industry || null,

        location: city || area || null,

        countries:
          form.country === "all" || !form.country ? [] : [form.country],

        companySize:
          form.companySize && form.companySize !== "all"
            ? form.companySize
            : null,

        titles: form.jobTitle && form.jobTitle !== "all" ? [form.jobTitle] : [],

        limit: Number(form.limit) || 50,
      };

      const s = await leadgenApi.createSearch(body);

      if (!mounted.current) return false;

      setSearch(s);
      setSearchId(s.id);
      setLeads([]);
      setSelectedLeads([]);

      if (form.saveSearch && form.saveName.trim()) {
        leadgenApi
          .createSavedSearch({
            name: form.saveName.trim(),
            ...body,
          })
          .then(loadSaved)
          .catch(() => {});
      }

      pollSearch(s.id);

      return true;
    } catch (e) {
      console.error("Lead Generator create search error:", e);

      setMsg(
        e?.response?.data?.message ||
        e?.message ||
        "Could not start the lead search."
      );

      return false;
    } finally {
      if (mounted.current) {
        setGenerating(false);
      }
    }
  };

  const importOne = async (leadId) => {
    try {
      const r = await leadgenApi.importLead(leadId);
      if (!mounted.current) return;
      setLeads((prev) =>
        prev.map((l) =>
          l.id === leadId
            ? { ...l, status: r?.duplicate ? "duplicate" : "imported" }
            : l,
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
      country:
        Array.isArray(c.countries) && c.countries.length === 1
          ? c.countries[0]
          : "all",
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
  const activeNode = search ? (STATUS_TO_NODE[search.status] ?? -1) : -1;
  const isRunning = search && !TERMINAL.includes(search.status);

  const metrics = [
    {
      title: t("generator.metricGeneratedLeads"),
      value: kpis.leadsTotal || 0,
      type: "blue",
      icon: <Users size={20} />,
    },
    {
      title: t("generator.metricAiQualified"),
      value: kpis.leadsQualified || 0,
      type: "green",
      icon: <Bot size={20} />,
    },
    {
      title: t("generator.metricHotOpportunities"),
      value: kpis.hot || 0,
      type: "red",
      icon: <Flame size={20} />,
    },
    {
      title: "Warm",
      value: kpis.warm || 0,
      type: "purple",
      icon: <Layers size={20} />,
    },
    {
      title: "Cold",
      value: kpis.cold || 0,
      type: "orange",
      icon: <TrendingUp size={20} />,
    },
    {
      title: t("generator.metricMovedToCrm"),
      value: kpis.leadsImported || 0,
      type: "cyan",
      icon: <CheckCircle2 size={20} />,
    },
    {
      title: t("generator.metricAvgAiScore"),
      value: kpis.avgScore == null ? "—" : `${kpis.avgScore}%`,
      type: "star",
      icon: <Sparkles size={20} />,
    },
  ];

  const donut = useMemo(() => {
    const hot = kpis.hot || 0;
    const warm = kpis.warm || 0;
    const cold = kpis.cold || 0;
    const total = hot + warm + cold;
    const pct = (n) => (total ? (n / total) * 100 : 0);
    return {
      hot,
      warm,
      cold,
      total,
      hotPct: pct(hot),
      warmPct: pct(warm),
      coldPct: pct(cold),
    };
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
    .filter(
      (l) =>
        l.status === "qualified" || l.aiBand === "hot" || l.aiBand === "warm",
    )
    .map((l) => l.id);

  const matchCounts = useMemo(
    () => ({
      high: leads.filter((l) => l.aiBand === "hot").length,
      medium: leads.filter((l) => l.aiBand === "warm").length,
      low: leads.filter((l) => !l.aiBand || l.aiBand === "cold").length,
    }),
    [leads],
  );

  const searchCriteria = search?.criteria || {};
  const currentLocation =
    form.city ||
    searchCriteria.location ||
    (form.country !== "all" ? COUNTRY_NAMES[form.country] || form.country : "");

  const generatedCount = counts.found || leads.length || 0;
  const qualifiedCount = counts.qualified || kpis.leadsQualified || 0;

  const enrichedCount = useMemo(
    () =>
      leads.filter(
        (lead) =>
          Boolean(lead?.email) ||
          Boolean(lead?.phone) ||
          Boolean(lead?.website),
      ).length,
    [leads],
  );

  const campaignReadyCount = qualifiedIds.length;

  const mobileMetrics = [
    {
      key: "generated",
      title: t("generator.mobile.generatedLeads"),
      value: kpis.leadsTotal || generatedCount || 0,
      type: "blue",
      icon: <Users size={26} />,
      meta: generatedCount
        ? `${generatedCount} ${t("generator.mobile.generatedLeads")}`
        : t("common.noData"),
    },
    {
      key: "qualified",
      title: t("generator.mobile.aiQualified"),
      value: kpis.leadsQualified || qualifiedCount || 0,
      type: "green",
      icon: <FileCheck2 size={26} />,
      meta:
        generatedCount > 0
          ? `${Math.round((qualifiedCount / generatedCount) * 100)}% ${t("generator.mobile.aiQualified")}`
          : t("common.noData"),
    },
    {
      key: "hot",
      title: t("generator.mobile.hotOpportunities"),
      value: kpis.hot || 0,
      type: "red",
      icon: <Flame size={26} />,
      meta:
        generatedCount > 0
          ? `${Math.round(((kpis.hot || 0) / generatedCount) * 100)}%`
          : t("common.noData"),
    },
    {
      key: "enriched",
      title: t("generator.mobile.enrichedLeads"),
      value: enrichedCount,
      type: "purple",
      icon: <Layers size={26} />,
      meta:
        leads.length > 0
          ? `${Math.round((enrichedCount / leads.length) * 100)}%`
          : t("common.noData"),
    },
    {
      key: "campaign",
      title: t("generator.mobile.campaignReady"),
      value: campaignReadyCount,
      type: "orange",
      icon: <TrendingUp size={26} />,
      meta:
        leads.length > 0
          ? `${Math.round((campaignReadyCount / leads.length) * 100)}%`
          : t("common.noData"),
    },
    {
      key: "crm",
      title: t("generator.mobile.movedToCrm"),
      value: kpis.leadsImported || 0,
      type: "cyan",
      icon: <CheckCircle2 size={26} />,
      meta: t("generator.mobile.movedToCrm"),
    },
    {
      key: "score",
      title: t("generator.mobile.avgAiScore"),
      value: kpis.avgScore == null ? "—" : `${kpis.avgScore}%`,
      type: "star",
      icon: <Sparkles size={26} />,
      meta: t("generator.mobile.avgAiScore"),
    },
  ];

  const mobileSourceRows = [
    {
      key: "public",
      title: t("generator.mobile.sourcePublicWebSearch"),
      description: t("generator.mobile.sourcePublicWebSearchDesc"),
      icon: <Globe size={24} />,
      tone: "blue",
    },
    {
      key: "business",
      title: t("generator.mobile.sourceBusinessPlaces"),
      description: t("generator.mobile.sourceBusinessPlacesDesc"),
      icon: <Building2 size={24} />,
      tone: "green",
    },
    {
      key: "industry",
      title: t("generator.mobile.sourceCompanyIndustry"),
      description: t("generator.mobile.sourceCompanyIndustryDesc"),
      icon: <Layers size={24} />,
      tone: "purple",
    },
    {
      key: "listings",
      title: t("generator.mobile.sourceApprovedListings"),
      description: t("generator.mobile.sourceApprovedListingsDesc"),
      icon: <Layers size={24} />,
      tone: "orange",
    },
    {
      key: "connected",
      title: t("generator.mobile.sourceConnectedData"),
      description: t("generator.mobile.sourceConnectedDataDesc"),
      icon: <Activity size={24} />,
      tone: "cyan",
    },
  ];

  const selectAllVisible = () => {
    setSelectedLeads((prev) =>
      prev.length === leads.length ? [] : leads.map((lead) => lead.id),
    );
  };

  useEffect(() => {
    if (!isMobileGenerator || !search) return;

    const status = String(search.status || "").toLowerCase();

    if (
      mobileView === "criteria" &&
      ["created", "searching", "analyzing", "dedup"].includes(status)
    ) {
      setMobileView("progress");
    }
  }, [isMobileGenerator, search?.status, mobileView]);

  const saveCurrentSearch = async () => {
    const fallbackName =
      form.saveName.trim() ||
      form.keywords.trim() ||
      form.industry.trim() ||
      `${t("generator.savedSearches")} ${new Date().toLocaleDateString()}`;

    try {
      await leadgenApi.createSavedSearch({
        name: fallbackName,
        mode: "advanced",
        keywords: form.keywords || form.industry || form.city,
        industry: form.industry,
        location: form.city,
        countries: form.country === "all" ? [] : [form.country],
        limit: Number(form.limit) || 50,
      });
      loadSaved();
      setMsg(t("generator.billingNote"));
    } catch (e) {
      setMsg(e?.message || t("generator.purchaseError"));
    }
  };

  const clearMobileSearchForm = () => {
    setForm((current) => ({
      ...current,
      keywords: "",
      country: "all",
      city: "",
      industry: "",
      limit: "50",
      minScore: "0",
      aiInstructions: "",
      companySize: "all",
      stateProvince: "all",
      postalCode: "",
      revenue: "all",
      technologies: "",
      jobTitle: "all",
      department: "all",
      seniority: "all",
      excludeKeywords: "",
      saveSearch: false,
      saveName: "",
    }));
  };

  const handleMobileGenerate = async () => {
    const started = await generate();
    if (!started) {
      return;
    }
    setMobileView("progress");
  };

  const mobileBack = () => {
    const order = [
      "overview",
      "criteria",
      "progress",
      "summary",
      "leads",
      "intelligence",
    ];
    const index = order.indexOf(mobileView);
    setMobileView(index > 0 ? order[index - 1] : "overview");
  };

  const mobileStepNumber = {
    criteria: 2,
    progress: 3,
    summary: 4,
    leads: 5,
    intelligence: 6,
  }[mobileView];

  if (loading) {
    return (
      <div className="generator-page generator-page-loading">
        <Loader2 size={20} className="spin" />
        <span>{t("common.loading")}</span>
      </div>
    );
  }

  return (
    <div className="generator-page">
      <section className="generator-mobile-shell">
        {mobileView === "overview" ? (
          <div className="generator-mobile-overview">
            <div className="generator-mobile-page-title">
              <h1>{t("generator.mobile.overviewTitle")}</h1>
              <p>{t("generator.mobile.overviewDescription")}</p>
            </div>

            <div className="generator-mobile-metric-stack">
              {mobileMetrics.map((metric) => (
                <article
                  key={metric.key}
                  className={`generator-mobile-metric tone-${metric.type}`}
                >
                  <span className="generator-mobile-metric-icon">
                    {metric.icon}
                  </span>

                  <div className="generator-mobile-metric-title">
                    <strong>{metric.title}</strong>
                  </div>

                  <div className="generator-mobile-metric-value">
                    <b>{metric.value}</b>
                    <small>{metric.meta}</small>
                  </div>
                </article>
              ))}
            </div>

            <div className="generator-mobile-overview-actions">
              <button
                type="button"
                className="generator-mobile-primary-action"
                onClick={() => setMobileView("criteria")}
              >
                <span>
                  <Rocket size={22} />
                </span>
                <strong>{t("generator.mobile.generateNewLeads")}</strong>
                <ChevronRight size={22} />
              </button>

              <button
                type="button"
                onClick={() => setShowSaved((value) => !value)}
              >
                <span>
                  <Bookmark size={21} />
                </span>
                <strong>{t("generator.savedSearches")}</strong>
                <ChevronRight size={21} />
              </button>

              <button
                type="button"
                onClick={() =>
                  setMsg(
                    search
                      ? String(search.status || "")
                      : t("generator.mobile.progressTitle"),
                  )
                }
              >
                <span>
                  <NotepadTextDashed size={21} />
                </span>
                <strong>{t("generator.mobile.campaignDrafts")}</strong>
                <ChevronRight size={21} />
              </button>

              <button type="button" onClick={exportCsv}>
                <span>
                  <Download size={21} />
                </span>
                <strong>{t("generator.export")}</strong>
                <ChevronRight size={21} />
              </button>
            </div>

            {showSaved && (
              <div className="generator-mobile-saved-list">
                {savedSearches.length === 0 ? (
                  <div>{t("common.noData")}</div>
                ) : (
                  savedSearches.slice(0, 6).map((saved) => (
                    <button
                      key={saved.id}
                      type="button"
                      onClick={() => applySaved(saved)}
                    >
                      <Bookmark size={17} />
                      <span>
                        <strong>{saved.name}</strong>
                        <small>
                          {saved.criteria?.keywords ||
                            saved.criteria?.industry ||
                            saved.criteria?.location ||
                            "—"}
                        </small>
                      </span>
                      <ChevronRight size={17} />
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        ) : (
          <div
            className={`generator-mobile-step generator-mobile-step-${mobileView}`}
          >
            <div className="generator-mobile-step-heading">
              <button
                type="button"
                className="generator-mobile-back"
                onClick={mobileBack}
              >
                <ArrowLeft size={25} />
              </button>

              <span className="generator-mobile-step-number">
                {mobileStepNumber}
              </span>

              <div>
                <h1>
                  {mobileView === "criteria"
                    ? t("generator.mobile.criteriaTitle")
                    : mobileView === "progress"
                      ? t("generator.mobile.progressTitle")
                      : mobileView === "summary"
                        ? t("generator.mobile.summaryTitle")
                        : mobileView === "leads"
                          ? t("generator.mobile.leadsTitle")
                          : t("generator.mobile.intelligenceTitle")}
                </h1>

                <p>
                  {mobileView === "criteria"
                    ? t("generator.mobile.criteriaDescription")
                    : mobileView === "progress"
                      ? t("generator.mobile.progressDescription")
                      : mobileView === "summary"
                        ? t("generator.mobile.summaryDescription")
                        : mobileView === "leads"
                          ? t("generator.mobile.leadsDescription")
                          : t("generator.mobile.intelligenceDescription")}
                </p>
              </div>
            </div>

            {mobileView === "criteria" && (
              <div className="generator-mobile-criteria">
                <label className="generator-mobile-field generator-mobile-field-full">
                  <span>{t("generator.mobile.productOffer")}</span>
                  <div>
                    <Box size={21} />
                    <input
                      value={form.keywords}
                      onChange={(e) => setField("keywords", e.target.value)}
                      placeholder={t("generator.mobile.productOffer")}
                    />
                  </div>
                </label>

                <div className="generator-mobile-two-col">
                  <label className="generator-mobile-field">
                    <span>{t("generator.mobile.country")}</span>
                    <div>
                      <Globe size={21} />
                      <select
                        value={form.country}
                        onChange={(e) => setField("country", e.target.value)}
                      >
                        <option value="all">{t("common.all")}</option>
                        {(
                          context?.launchCountries || Object.keys(COUNTRY_NAMES)
                        ).map((country) => (
                          <option key={country} value={country}>
                            {COUNTRY_NAMES[country] || country}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={18} />
                    </div>
                  </label>

                  <label className="generator-mobile-field">
                    <span>{t("generator.mobile.city")}</span>
                    <div>
                      <Building2 size={21} />
                      <input
                        value={form.city}
                        onChange={(e) => setField("city", e.target.value)}
                        placeholder={t("generator.mobile.city")}
                      />
                    </div>
                  </label>
                </div>

                <label className="generator-mobile-field generator-mobile-field-full">
                  <span>{t("generator.mobile.areaOptional")}</span>
                  <div>
                    <MapPin size={21} />
                    <input
                      value={form.postalCode}
                      onChange={(e) => setField("postalCode", e.target.value)}
                      placeholder={t("generator.mobile.areaOptional")}
                    />
                  </div>
                </label>

                <label className="generator-mobile-field generator-mobile-field-full">
                  <span>{t("generator.mobile.industry")}</span>
                  <div>
                    <ToolCase size={21} />
                    <select
                      value={form.industry}
                      onChange={(e) => setField("industry", e.target.value)}
                    >
                      <option value="">{t("common.all")}</option>
                      <option value="Marketing & Advertising">
                        Marketing & Advertising
                      </option>
                      <option value="Real Estate">Real Estate</option>
                      <option value="SaaS">SaaS</option>
                      <option value="Financial Services">
                        Financial Services
                      </option>
                    </select>
                    <ChevronDown size={18} />
                  </div>
                </label>

                <label className="generator-mobile-field generator-mobile-field-full">
                  <span>{t("generator.mobile.businessType")}</span>
                  <div>
                    <Users size={21} />
                    <select
                      value={form.department}
                      onChange={(e) => setField("department", e.target.value)}
                    >
                      <option value="all">{t("common.all")}</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Sales">Sales</option>
                      <option value="Operations">Operations</option>
                      <option value="Executive">Executive</option>
                    </select>
                    <ChevronDown size={18} />
                  </div>
                </label>

                <label className="generator-mobile-field generator-mobile-field-full">
                  <span>{t("generator.mobile.goal")}</span>
                  <div>
                    <Target size={21} />
                    <select
                      value={form.jobTitle}
                      onChange={(e) => setField("jobTitle", e.target.value)}
                    >
                      <option value="all">{t("common.all")}</option>
                      <option value="Founder">Founder</option>
                      <option value="Owner">Owner</option>
                      <option value="Marketing Director">
                        Marketing Director
                      </option>
                      <option value="Head of Sales">Head of Sales</option>
                    </select>
                    <ChevronDown size={18} />
                  </div>
                </label>

                <div className="generator-mobile-channel-block">
                  <span>{t("generator.mobile.contactChannels")}</span>

                  <div className="generator-mobile-channel-grid">
                    <label>
                      <input
                        type="checkbox"
                        checked={form.contactWebsite}
                        onChange={(e) =>
                          setField("contactWebsite", e.target.checked)
                        }
                      />
                      <MessageCircle size={18} />
                      <span>WhatsApp</span>
                    </label>

                    <label>
                      <input
                        type="checkbox"
                        checked={form.findEmails}
                        onChange={(e) =>
                          setField("findEmails", e.target.checked)
                        }
                      />
                      <Mail size={18} />
                      <span>Email</span>
                    </label>

                    <label>
                      <input
                        type="checkbox"
                        checked={form.contactGoogle}
                        onChange={(e) =>
                          setField("contactGoogle", e.target.checked)
                        }
                      />
                      <Phone size={18} />
                      <span>Phone</span>
                    </label>

                    <label>
                      <input
                        type="checkbox"
                        checked={form.contactLinkedIn}
                        onChange={(e) =>
                          setField("contactLinkedIn", e.target.checked)
                        }
                      />
                      <Camera size={18} />
                      <span>Instagram</span>
                    </label>
                  </div>
                </div>

                <div className="generator-mobile-two-col">
                  <label className="generator-mobile-field">
                    <span>{t("generator.mobile.numberOfLeads")}</span>
                    <div>
                      <Users size={21} />
                      <select
                        value={form.limit}
                        onChange={(e) => setField("limit", e.target.value)}
                      >
                        <option value="25">25</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                      </select>
                      <ChevronDown size={18} />
                    </div>
                  </label>

                  <label className="generator-mobile-field">
                    <span>{t("generator.mobile.minimumAiScore")}</span>
                    <div>
                      <Sparkles size={21} />
                      <select
                        value={form.minScore}
                        onChange={(e) => setField("minScore", e.target.value)}
                      >
                        <option value="0">0%</option>
                        <option value="40">40%</option>
                        <option value="70">70%</option>
                        <option value="90">90%</option>
                      </select>
                      <ChevronDown size={18} />
                    </div>
                  </label>
                </div>

                <label className="generator-mobile-field generator-mobile-field-full">
                  <span>{t("generator.mobile.aiInstructionsOptional")}</span>
                  <div className="generator-mobile-textarea-wrap">
                    <NotepadTextDashed size={21} />
                    <textarea
                      rows={3}
                      value={form.aiInstructions}
                      onChange={(e) =>
                        setField("aiInstructions", e.target.value)
                      }
                      placeholder={t(
                        "generator.mobile.aiInstructionsPlaceholder",
                      )}
                    />
                  </div>
                </label>

                <button
                  type="button"
                  className="generator-mobile-outline-row"
                  onClick={() =>
                    document
                      .querySelector(".generator-advanced-card")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  <ToolCase size={20} />
                  <span>{t("generator.mobile.advancedOptions")}</span>
                  <ChevronRight size={20} />
                </button>

                <label className="generator-mobile-save-toggle">
                  <span>
                    <strong>{t("generator.mobile.saveThisSearch")}</strong>
                    <small>{t("generator.mobile.saveSearchHint")}</small>
                  </span>

                  <input
                    type="checkbox"
                    checked={form.saveSearch}
                    onChange={(e) => setField("saveSearch", e.target.checked)}
                  />
                  <i />
                </label>

                <button
                  type="button"
                  className="generator-mobile-clear"
                  onClick={clearMobileSearchForm}
                >
                  {t("generator.mobile.clearSearch")}
                </button>

                <button
                  type="button"
                  className="generator-mobile-generate"
                  onClick={handleMobileGenerate}
                  disabled={generating}
                >
                  {generating ? (
                    <Loader2 size={20} className="spin" />
                  ) : (
                    <Rocket size={20} />
                  )}

                  {t("generator.mobile.generateNewLeads")}
                </button>
              </div>
            )}

            {mobileView === "progress" && (
              <div className="generator-mobile-progress-view">
                <h2>{t("generator.mobile.whereCortexaWillLook")}</h2>

                <div className="generator-mobile-source-stack">
                  {mobileSourceRows.map((source, index) => {
                    const connected = sources[index];
                    return (
                      <article
                        key={source.key}
                        className={`tone-${source.tone}`}
                      >
                        <span className="generator-mobile-source-icon">
                          {source.icon}
                        </span>

                        <div>
                          <strong>{connected?.name || source.title}</strong>
                          <small>
                            {connected?.description || source.description}
                          </small>
                        </div>

                        <div className="generator-mobile-source-count">
                          {connected ? <CheckCircle2 size={20} /> : null}
                          <b>{connected?.count ?? "—"}</b>
                          <small>
                            {connected
                              ? t("generator.mobile.sourcesChecked")
                              : t("generator.mobile.notCheckedYet")}
                          </small>
                        </div>
                      </article>
                    );
                  })}
                </div>

                <h2>{t("generator.mobile.searchProgressSection")}</h2>

                <div className="generator-mobile-progress-stack">
                  {PIPELINE.map((node, index) => {
                    const Icon = node.icon;
                    const completed = activeNode > index;
                    const active = activeNode === index;
                    const pending = activeNode < index;

                    return (
                      <article
                        key={node.key}
                        className={`${completed ? "completed" : ""} ${
                          active ? "active" : ""
                        } ${pending ? "pending" : ""}`}
                      >
                        <span className="generator-mobile-progress-icon">
                          <Icon size={22} />
                        </span>

                        <div>
                          <strong>
                            {index + 1}.{" "}
                            {node.key === "searching"
                              ? t("generator.mobile.progressSearchingTitle")
                              : node.key === "analyzing"
                                ? t("generator.mobile.progressAnalyzingTitle")
                                : node.key === "dedup"
                                  ? t("generator.mobile.progressDedupTitle")
                                  : node.key === "scoring"
                                    ? t("generator.mobile.progressScoringTitle")
                                    : t("generator.mobile.progressReadyTitle")}
                          </strong>
                          <small>
                            {node.key === "searching"
                              ? t("generator.mobile.progressSearchingDesc")
                              : node.key === "analyzing"
                                ? t("generator.mobile.progressAnalyzingDesc")
                                : node.key === "dedup"
                                  ? t("generator.mobile.progressDedupDesc")
                                  : node.key === "scoring"
                                    ? t("generator.mobile.progressScoringDesc")
                                    : t("generator.mobile.progressReadyDesc")}
                          </small>
                        </div>

                        <div className="generator-mobile-progress-status">
                          <span>
                            {completed
                              ? t("generator.mobile.completed")
                              : active
                                ? t("generator.mobile.inProgress")
                                : t("generator.mobile.pending")}
                          </span>
                        </div>
                      </article>
                    );
                  })}
                </div>

                <div className="generator-mobile-info-box">
                  <Info size={23} />
                  <span>{t("generator.mobile.progressNotice")}</span>
                </div>

                {searchId && (
                  <button
                    type="button"
                    className="generator-mobile-outline-row generator-mobile-view-summary"
                    onClick={() => setMobileView("summary")}
                  >
                    <BarChart3 size={19} />

                    <span>
                      {t("generator.mobile.viewLiveSummary")}
                    </span>

                    <ChevronRight size={19} />
                  </button>
                )}
              </div>
            )}

            {mobileView === "summary" && (
              <div className="generator-mobile-summary-view">
                <div className="generator-mobile-summary-stack">
                  {[
                    {
                      key: "sources",
                      title: t("generator.mobile.sourcesChecked"),
                      value: sources.length || "—",
                      desc: t("generator.mobile.sourcesCheckedDescription"),
                      tone: "blue",
                      icon: <Globe size={26} />,
                      side: <TrendingUp size={24} />,
                    },
                    {
                      key: "found",
                      title: t("generator.mobile.resultsFound"),
                      value: generatedCount,
                      desc: t("generator.mobile.resultsFoundDescription"),
                      tone: "green",
                      icon: <Search size={26} />,
                      side: <BarChart3 size={24} />,
                    },
                    {
                      key: "qualified",
                      title: t("generator.mobile.qualifiedLeads"),
                      value: qualifiedCount,
                      desc: t("generator.mobile.qualifiedLeadsDescription"),
                      tone: "purple",
                      icon: <CircleUserRound size={26} />,
                      side: <Users size={24} />,
                    },
                    {
                      key: "duplicates",
                      title: t("generator.mobile.duplicatesRemoved"),
                      value: counts.duplicates ?? counts.duplicate ?? 0,
                      desc: t("generator.mobile.duplicatesRemovedDescription"),
                      tone: "orange",
                      icon: <Copy size={26} />,
                      side: <NotepadTextDashed size={24} />,
                    },
                  ].map((item) => (
                    <article key={item.key} className={`tone-${item.tone}`}>
                      <span className="generator-mobile-summary-icon">
                        {item.icon}
                      </span>
                      <div>
                        <strong>{item.title}</strong>
                        <small>{item.desc}</small>
                      </div>
                      <b>{item.value}</b>
                      <span className="generator-mobile-summary-side">
                        {item.side}
                      </span>
                    </article>
                  ))}
                </div>

                <article className="generator-mobile-job-card">
                  <span>#</span>
                  <div>
                    <strong>{t("generator.mobile.searchJobId")}</strong>
                    <small>
                      {t("generator.mobile.searchJobIdDescription")}
                    </small>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (searchId && navigator?.clipboard) {
                        navigator.clipboard.writeText(String(searchId));
                      }
                    }}
                  >
                    <b>{searchId || "—"}</b>
                    <Copy size={18} />
                  </button>
                </article>

                <div className="generator-mobile-info-box">
                  <Info size={23} />
                  <span>
                    {isRunning
                      ? t("generator.mobile.searchInProgressDescription")
                      : t("generator.mobile.readyToReviewDescription")}
                  </span>
                </div>

                <button
                  type="button"
                  className="generator-mobile-back-summary"
                  onClick={() => setMobileView("progress")}
                >
                  <ArrowLeft size={21} />
                  {t("generator.mobile.backToPrevious")}
                </button>

                {!isRunning && leads.length > 0 && (
                  <button
                    type="button"
                    className="generator-mobile-generate"
                    onClick={() => setMobileView("leads")}
                    disabled={isRunning}
                  >
                    <Users size={20} />

                    {isRunning
                      ? t("generator.mobile.searchInProgress")
                      : t("generator.mobile.reviewLeads")}

                    <ChevronRight size={20} />
                  </button>
                )}
              </div>
            )}

            {mobileView === "leads" && (
              <div className="generator-mobile-leads-view">
                <div className="generator-mobile-leads-toolbar">
                  <h2>
                    <strong>{qualifiedCount}</strong>{" "}
                    {t("generator.mobile.qualifiedLeads")}
                  </h2>

                  <div>
                    <button type="button">
                      {t("generator.mobile.sortAiScoreHighLow")}{" "}
                      <ChevronDown size={15} />
                    </button>
                    <button type="button">
                      <Filter size={16} /> {t("generator.mobile.filters")}
                    </button>
                  </div>
                </div>

                <div className="generator-mobile-view-toggle">
                  <button className="active" type="button">
                    <Grid size={16} />
                    {t("generator.mobile.cardView")}
                  </button>
                  <button type="button">
                    <List size={16} />
                    {t("generator.mobile.listView")}
                  </button>
                </div>

                {leadsLoading ? (
                  <div className="generator-mobile-empty">
                    <Loader2 size={22} className="spin" />
                    {t("common.loading")}
                  </div>
                ) : leads.length === 0 ? (
                  <div className="generator-mobile-empty">
                    {t("common.noData")}
                  </div>
                ) : (
                  <div className="generator-mobile-lead-stack">
                    {leads.map((lead) => {
                      const business =
                        lead.businessName || lead.contactName || "—";
                      const score = Number(lead.aiScore || 0);
                      const imported = ["imported", "duplicate"].includes(
                        lead.status,
                      );

                      return (
                        <article
                          key={lead.id}
                          className={`generator-mobile-lead-card tone-${bandClass(lead.aiBand)}`}
                        >
                          <div className="generator-mobile-lead-top">
                            <input
                              type="checkbox"
                              checked={selectedLeads.includes(lead.id)}
                              onChange={() => toggleLeadSelection(lead.id)}
                            />

                            <div className="generator-mobile-lead-avatar">
                              {initials(business)}
                            </div>

                            <div className="generator-mobile-lead-identity">
                              <strong>{business}</strong>
                              <span>{lead.title || form.industry || "—"}</span>
                              {lead.phone && (
                                <a href={`tel:${lead.phone}`}>{lead.phone}</a>
                              )}
                              {lead.email && (
                                <a href={`mailto:${lead.email}`}>
                                  {lead.email}
                                </a>
                              )}
                            </div>

                            <button
                              type="button"
                              className={`generator-mobile-score ${bandClass(lead.aiBand)}`}
                              onClick={() => setMobileView("intelligence")}
                            >
                              <small>{t("generator.aiScore")}</small>
                              <strong>{score || "—"}%</strong>
                            </button>

                            <ChevronRight size={21} />
                          </div>

                          <div className="generator-mobile-lead-details">
                            <div>
                              <small>
                                {t("generator.mobile.interestedIn")}
                              </small>
                              <strong>
                                {lead.businessName || form.keywords || "—"}
                              </strong>

                              <small>{t("generator.mobile.budget")}</small>
                              <strong>
                                {form.revenue === "all" ? "—" : form.revenue}
                              </strong>

                              <small>{t("generator.mobile.source")}</small>
                              <strong>
                                {lead.sourceProvider || lead.source || "—"}
                              </strong>
                            </div>

                            <div>
                              <small>
                                {t("generator.mobile.contactChannels")}
                              </small>
                              <div className="generator-mobile-lead-channels">
                                {lead.phone && <Phone size={17} />}
                                {lead.email && <Mail size={17} />}
                                {lead.website && <Globe size={17} />}
                              </div>

                              <small>
                                {t("generator.mobile.suggestedAction")}
                              </small>
                              <strong>{lead.recommendedAction || "—"}</strong>
                            </div>
                          </div>

                          <div className="generator-mobile-lead-actions">
                            {lead.sourceUrl ? (
                              <a
                                href={lead.sourceUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <ExternalLink size={16} />
                                {t("generator.mobile.viewSource")}
                              </a>
                            ) : (
                              <button type="button" disabled>
                                <ExternalLink size={16} />
                                {t("generator.mobile.viewSource")}
                              </button>
                            )}

                            <button
                              type="button"
                              className="primary"
                              onClick={() => importOne(lead.id)}
                              disabled={imported}
                            >
                              <Users size={16} />
                              {imported
                                ? t("generator.mobile.savedToCrm")
                                : t("generator.mobile.saveToCrm")}
                            </button>

                            <button type="button">
                              {t("generator.mobile.more")}{" "}
                              <MoreVertical size={17} />
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}

                <div className="generator-mobile-selection-bar">
                  <span>
                    {t("generator.mobile.selectedCount", {
                      count: selectedLeads.length,
                    })}
                  </span>

                  <div>
                    <button
                      type="button"
                      onClick={() => setSelectedLeads([])}
                      disabled={!selectedLeads.length}
                    >
                      <Trash2 size={16} />
                      {t("generator.mobile.clearSelection")}
                    </button>

                    <button
                      type="button"
                      className="primary"
                      onClick={() => importMany(selectedLeads)}
                      disabled={!selectedLeads.length}
                    >
                      <Save size={16} />
                      {t("generator.mobile.saveSelected", {
                        count: selectedLeads.length,
                      })}
                    </button>

                    <button
                      type="button"
                      className="success"
                      onClick={() => importMany(qualifiedIds)}
                      disabled={!qualifiedIds.length}
                    >
                      <Sparkles size={16} />
                      {t("generator.mobile.qualifiedLeads")}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {mobileView === "intelligence" && (
              <div className="generator-mobile-intelligence">
                <section className="generator-mobile-intel-card">
                  <div className="generator-mobile-intel-head">
                    <h2>{t("generator.mobile.aiScoreInsights")}</h2>
                    <button type="button">
                      {t("generator.mobile.aboutAiScores")}
                    </button>
                  </div>

                  <div className="generator-mobile-donut-layout">
                    <div
                      className="generator-mobile-donut"
                      style={{
                        background: donut.total
                          ? `conic-gradient(
                              #22c55e 0 ${donut.hotPct}%,
                              #f59e0b ${donut.hotPct}% ${donut.hotPct + donut.warmPct}%,
                              #ef4444 ${donut.hotPct + donut.warmPct}% 100%
                            )`
                          : "conic-gradient(#334155 0 100%)",
                      }}
                    >
                      <div>
                        <strong>{donut.total}</strong>
                        <span>{t("generator.mobile.qualifiedLeads")}</span>
                      </div>
                    </div>

                    <div className="generator-mobile-score-legend">
                      <p>
                        <i className="hot" />
                        <span>{t("generator.mobile.hotRange")}</span>
                        <strong>{donut.hot}</strong>
                        <em>{donut.hotPct.toFixed(1)}%</em>
                      </p>
                      <p>
                        <i className="warm" />
                        <span>{t("generator.mobile.warmRange")}</span>
                        <strong>{donut.warm}</strong>
                        <em>{donut.warmPct.toFixed(1)}%</em>
                      </p>
                      <p>
                        <i className="cold" />
                        <span>{t("generator.mobile.coldRange")}</span>
                        <strong>{donut.cold}</strong>
                        <em>{donut.coldPct.toFixed(1)}%</em>
                      </p>
                    </div>
                  </div>

                  <div className="generator-mobile-intel-tip">
                    <Sparkles size={21} />
                    <span>{t("generator.mobile.hotLeadTip")}</span>
                  </div>
                </section>

                <section className="generator-mobile-intel-card">
                  <div className="generator-mobile-intel-head">
                    <h2>{t("generator.mobile.topLocationsFound")}</h2>
                    <button type="button">
                      {t("generator.mobile.viewAllLocations")}
                    </button>
                  </div>

                  <div className="generator-mobile-location-list">
                    {topCities.length === 0 ? (
                      <div className="generator-mobile-empty">
                        {t("common.noData")}
                      </div>
                    ) : (
                      topCities.map((city, index) => (
                        <div key={city.name} className={`city-${index}`}>
                          <span>
                            <MapPin size={19} />
                          </span>
                          <div>
                            <strong>{city.name}</strong>
                            <i
                              style={{
                                width: `${
                                  topCities[0]?.count
                                    ? Math.max(
                                        12,
                                        (city.count / topCities[0].count) * 100,
                                      )
                                    : 12
                                }%`,
                              }}
                            />
                          </div>
                          <b>{city.count}</b>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                <section className="generator-mobile-intel-card">
                  <h2>{t("generator.mobile.quickSummary")}</h2>

                  <div className="generator-mobile-quick-summary">
                    <div>
                      <span className="purple">
                        <Target size={21} />
                      </span>
                      <strong>{qualifiedCount}</strong>
                      <small>{t("generator.mobile.qualifiedLeads")}</small>
                    </div>
                    <div>
                      <span className="green">
                        <CheckCircle2 size={21} />
                      </span>
                      <strong>{kpis.leadsImported || 0}</strong>
                      <small>{t("generator.mobile.movedToCrm")}</small>
                    </div>
                    <div>
                      <span className="orange">
                        <TrendingUp size={21} />
                      </span>
                      <strong>{campaignReadyCount}</strong>
                      <small>{t("generator.mobile.campaignReady")}</small>
                    </div>
                    <div>
                      <span className="blue">
                        <Layers size={21} />
                      </span>
                      <strong>{enrichedCount}</strong>
                      <small>{t("generator.mobile.enrichedLeads")}</small>
                    </div>
                  </div>
                </section>

                <button
                  type="button"
                  className="generator-mobile-generate"
                  onClick={() => importMany(qualifiedIds)}
                  disabled={!qualifiedIds.length}
                >
                  <Users size={20} />
                  {t("generator.mobile.moveQualifiedToCrm")}
                  <ChevronRight size={21} />
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      <div className="generator-desktop-shell">
        <header className="generator-header">
          <div className="generator-title-wrap">
            <div className="generator-title-icon">
              <Sparkles size={20} />
            </div>
            <div>
              <h1>{t("generator.pageTitle")}</h1>
              <p>{t("generator.subheading")}</p>
            </div>
          </div>

          <div className="generator-header-actions">
            <button
              type="button"
              className="generator-btn generator-btn-ghost"
              onClick={() => setShowSaved((value) => !value)}
            >
              <Save size={15} />
              {t("generator.savedSearches")}
            </button>

            <button
              type="button"
              className="generator-btn generator-btn-ghost"
              onClick={() =>
                setMsg(
                  search
                    ? `${search.status}`
                    : t("generator.searchProgressTitle"),
                )
              }
            >
              <Activity size={15} />
              {t("generator.campaignDrafts")}
            </button>

            <button
              type="button"
              className="generator-btn generator-btn-ghost"
              onClick={exportCsv}
            >
              <Download size={15} />
              {t("generator.export")}
              <ChevronDown size={13} />
            </button>

            <button
              type="button"
              className="generator-btn generator-btn-primary"
              onClick={generate}
              disabled={generating || isRunning}
            >
              {generating || isRunning ? (
                <Loader2 size={15} className="spin" />
              ) : (
                <Sparkles size={15} />
              )}
              {t("generator.generateNewLeads")}
            </button>

            {showSaved && (
              <div className="generator-saved-popover">
                <div className="generator-popover-title">
                  {t("generator.savedSearches")}
                </div>

                {savedSearches.length === 0 ? (
                  <div className="generator-empty-small">
                    {t("common.noData")}
                  </div>
                ) : (
                  savedSearches.slice(0, 8).map((saved) => (
                    <div className="generator-saved-popover-row" key={saved.id}>
                      <button type="button" onClick={() => applySaved(saved)}>
                        <strong>{saved.name}</strong>
                        <span>
                          {saved.criteria?.keywords ||
                            saved.criteria?.industry ||
                            "—"}
                        </span>
                      </button>
                      <button
                        type="button"
                        className="generator-delete-saved"
                        onClick={() => removeSavedSearch(saved.id)}
                        aria-label={t("common.delete")}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </header>

        {notConnected && (
          <div className="generator-notice generator-notice-warning">
            <PlugZap size={19} />
            <div>
              <strong>{t("generator.sourceFocusTitle")}</strong>
              <span>
                {context?.providerNotice ||
                  "Lead generation requires a connected discovery provider. No sample or placeholder leads are shown."}
              </span>
            </div>
          </div>
        )}

        {msg && (
          <div className="generator-notice generator-notice-info">
            <AlertTriangle size={16} />
            <span>{msg}</span>
            <button type="button" onClick={() => setMsg(null)}>
              ×
            </button>
          </div>
        )}

        <div className="generator-workspace">
          <main className="generator-main-column">
            <section className="generator-card generator-search-card">
              <div className="generator-step-head">
                <h2>{t("generator.configTitle")}</h2>
                <p>{t("generator.labelAiSearchInstructions")}</p>
                <small>{t("generator.aiInstructionsPlaceholder")}</small>
              </div>

              <div className="generator-natural-search">
                <textarea
                  value={form.keywords}
                  onChange={(e) => setField("keywords", e.target.value)}
                  placeholder={t("generator.aiInstructionsPlaceholder")}
                  rows={2}
                />
                <Sparkles size={18} />
                <span>{Math.min(500, form.keywords.length)}/500</span>
              </div>

              <div className="generator-search-actions">
                <button
                  type="button"
                  className="generator-btn generator-btn-compact"
                  onClick={() => {
                    const el = document.querySelector(
                      ".generator-advanced-card",
                    );
                    el?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  <Filter size={14} />
                  {t("generator.advancedOptions")}
                  <ChevronDown size={13} />
                </button>

                <button
                  type="button"
                  className="generator-search-submit"
                  onClick={generate}
                  disabled={generating || isRunning}
                >
                  {generating || isRunning ? (
                    <Loader2 size={15} className="spin" />
                  ) : (
                    <Search size={15} />
                  )}
                  {t("generator.addOnTitle")}
                </button>
              </div>
            </section>

            <section className="generator-card generator-advanced-card">
              <div className="generator-section-title">
                <h2>{t("generator.searchProgressTitle")}</h2>
              </div>

              <div className="generator-advanced-grid generator-advanced-grid-reference">
                <label className="generator-field">
                  <span>{t("generator.labelIndustry")}</span>
                  <select
                    value={form.industry}
                    onChange={(e) => setField("industry", e.target.value)}
                  >
                    <option value="">{t("common.all")}</option>
                    <option value="Marketing & Advertising">
                      Marketing & Advertising
                    </option>
                    <option value="Real Estate">Real Estate</option>
                    <option value="SaaS">SaaS</option>
                    <option value="Financial Services">
                      Financial Services
                    </option>
                  </select>
                  <ChevronDown size={13} />
                </label>

                <label className="generator-field">
                  <span>{t("generator.benefitQualified")}</span>
                  <select
                    value={form.companySize}
                    onChange={(e) => setField("companySize", e.target.value)}
                  >
                    <option value="all">{t("common.all")}</option>
                    <option value="1-10">1 - 10</option>
                    <option value="5-50">5 - 50</option>
                    <option value="51-200">51 - 200</option>
                    <option value="201-500">201 - 500</option>
                    <option value="500+">500+</option>
                  </select>
                  <ChevronDown size={13} />
                </label>

                <label className="generator-field">
                  <span>{t("generator.labelCountry")}</span>
                  <select
                    value={form.country}
                    onChange={(e) => setField("country", e.target.value)}
                  >
                    <option value="all">{t("common.all")}</option>
                    {(
                      context?.launchCountries || Object.keys(COUNTRY_NAMES)
                    ).map((country) => (
                      <option key={country} value={country}>
                        {COUNTRY_NAMES[country] || country}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={13} />
                </label>

                <label className="generator-field">
                  <span>{t("generator.benefitLocation")}</span>
                  <select
                    value={form.stateProvince}
                    onChange={(e) => setField("stateProvince", e.target.value)}
                  >
                    <option value="all">{t("common.all")}</option>
                    <option value="Madrid">Madrid</option>
                    <option value="Catalonia">Catalonia</option>
                    <option value="Valencia">Valencia</option>
                    <option value="Andalusia">Andalusia</option>
                  </select>
                  <ChevronDown size={13} />
                </label>

                <label className="generator-field">
                  <span>{t("generator.labelCity")}</span>
                  <input
                    value={form.city}
                    onChange={(e) => setField("city", e.target.value)}
                    placeholder={t("common.all")}
                  />
                </label>

                <label className="generator-field">
                  <span>{t("generator.labelArea")}</span>
                  <input
                    value={form.postalCode}
                    onChange={(e) => setField("postalCode", e.target.value)}
                    placeholder={t("common.all")}
                  />
                </label>

                <label className="generator-field">
                  <span>{t("generator.budget")}</span>
                  <select
                    value={form.revenue}
                    onChange={(e) => setField("revenue", e.target.value)}
                  >
                    <option value="all">{t("common.all")}</option>
                    <option value="<1m">&lt; $1M</option>
                    <option value="1m-10m">$1M - $10M</option>
                    <option value="10m-50m">$10M - $50M</option>
                    <option value="50m+">$50M+</option>
                  </select>
                  <ChevronDown size={13} />
                </label>

                <label className="generator-field">
                  <span>{t("generator.interestedIn")}</span>
                  <input
                    value={form.technologies}
                    onChange={(e) => setField("technologies", e.target.value)}
                    placeholder="Google Ads"
                  />
                </label>

                <label className="generator-field">
                  <span>{t("generator.labelGoal")}</span>
                  <select
                    value={form.jobTitle}
                    onChange={(e) => setField("jobTitle", e.target.value)}
                  >
                    <option value="all">{t("common.all")}</option>
                    <option value="Founder">Founder</option>
                    <option value="Owner">Owner</option>
                    <option value="Marketing Director">
                      Marketing Director
                    </option>
                    <option value="Head of Sales">Head of Sales</option>
                  </select>
                  <ChevronDown size={13} />
                </label>

                <label className="generator-field">
                  <span>{t("generator.labelBusinessType")}</span>
                  <select
                    value={form.department}
                    onChange={(e) => setField("department", e.target.value)}
                  >
                    <option value="all">{t("common.all")}</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Sales">Sales</option>
                    <option value="Operations">Operations</option>
                    <option value="Executive">Executive</option>
                  </select>
                  <ChevronDown size={13} />
                </label>

                <label className="generator-field">
                  <span>{t("generator.optFindInvestmentAgencies")}</span>
                  <select
                    value={form.seniority}
                    onChange={(e) => setField("seniority", e.target.value)}
                  >
                    <option value="all">{t("common.all")}</option>
                    <option value="Owner">Owner</option>
                    <option value="C-Level">C-Level</option>
                    <option value="VP">VP</option>
                    <option value="Director">Director</option>
                    <option value="Manager">Manager</option>
                  </select>
                  <ChevronDown size={13} />
                </label>

                <label className="generator-field generator-field-keywords">
                  <span>{t("generator.labelProductOffer")}</span>
                  <input
                    value={form.keywords}
                    onChange={(e) => setField("keywords", e.target.value)}
                    placeholder="Digital Marketing, PPC, Ads"
                  />
                </label>

                <label className="generator-field generator-field-exclude">
                  <span>{t("generator.metricCampaignReady")}</span>
                  <input
                    value={form.excludeKeywords}
                    onChange={(e) =>
                      setField("excludeKeywords", e.target.value)
                    }
                    placeholder="Freelancer, Consultant"
                  />
                </label>
              </div>

              <div className="generator-contact-source-row">
                <span className="generator-contact-source-label">
                  {t("generator.labelContactChannels")}
                </span>

                <label>
                  <input
                    type="checkbox"
                    checked={form.contactLinkedIn}
                    onChange={(e) =>
                      setField("contactLinkedIn", e.target.checked)
                    }
                  />
                  <span>LinkedIn</span>
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={form.contactWebsite}
                    onChange={(e) =>
                      setField("contactWebsite", e.target.checked)
                    }
                  />
                  <span>Company Website</span>
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={form.contactGoogle}
                    onChange={(e) =>
                      setField("contactGoogle", e.target.checked)
                    }
                  />
                  <span>Google</span>
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={form.contactCrunchbase}
                    onChange={(e) =>
                      setField("contactCrunchbase", e.target.checked)
                    }
                  />
                  <span>Crunchbase</span>
                </label>

                <label className="generator-find-emails">
                  <input
                    type="checkbox"
                    checked={form.findEmails}
                    onChange={(e) => setField("findEmails", e.target.checked)}
                  />
                  <span>{t("generator.benefitFollowUp")}</span>
                </label>
              </div>
            </section>

            <section className="generator-card generator-results-card">
              <div className="generator-results-head">
                <div>
                  <div className="generator-section-title generator-section-title-inline">
                    <h2>{t("generator.leadsFound")}</h2>
                    {search &&
                      TERMINAL.includes(search.status) &&
                      search.status !== "failed" && (
                        <span className="generator-completed-badge">
                          {t("common.success")}
                        </span>
                      )}
                  </div>
                  <p>
                    <strong>{generatedCount}</strong>{" "}
                    {t("generator.metricGeneratedLeads")}
                    <span>•</span>
                    <strong>{selectedLeads.length}</strong>{" "}
                    {t("generator.selectedCount", {
                      count: selectedLeads.length,
                    })}
                  </p>
                </div>

                <div className="generator-results-tools">
                  <button
                    type="button"
                    className="generator-btn generator-btn-compact"
                    onClick={selectAllVisible}
                    disabled={!leads.length}
                  >
                    <CheckCircle2 size={14} />
                    {selectedLeads.length === leads.length && leads.length
                      ? t("generator.clearSelection")
                      : t("common.all")}
                  </button>
                  <button type="button" className="generator-icon-view active">
                    <List size={15} />
                  </button>
                  <button
                    type="button"
                    className="generator-btn generator-btn-compact"
                  >
                    <Filter size={14} />
                    {t("generator.filters")}
                  </button>
                </div>
              </div>

              {leadsLoading ? (
                <div className="generator-results-empty">
                  <Loader2 size={20} className="spin" />
                  <span>{t("common.loading")}</span>
                </div>
              ) : leads.length === 0 ? (
                <div className="generator-results-empty">
                  <Search size={25} />
                  <strong>{t("common.noData")}</strong>
                  <span>
                    {notConnected
                      ? context?.providerNotice ||
                        t("generator.sourcesDisclaimer")
                      : t("generator.aiInstructionsPlaceholder")}
                  </span>
                </div>
              ) : (
                <div className="generator-prospect-list">
                  {leads.map((lead) => {
                    const business =
                      lead.businessName || lead.contactName || "—";
                    const contact = lead.contactName || lead.title || "—";
                    const imported = ["imported", "duplicate"].includes(
                      lead.status,
                    );
                    const score = Number(lead.aiScore || 0);

                    return (
                      <article
                        className={`generator-prospect-row ${
                          selectedLeads.includes(lead.id) ? "is-selected" : ""
                        }`}
                        key={lead.id}
                      >
                        <input
                          type="checkbox"
                          checked={selectedLeads.includes(lead.id)}
                          onChange={() => toggleLeadSelection(lead.id)}
                          aria-label={business}
                        />

                        <div className="generator-company-avatar">
                          {initials(business)}
                        </div>

                        <div className="generator-company">
                          <div className="generator-company-title">
                            <strong>{business}</strong>
                            {imported && (
                              <span className="generator-verified">
                                <CheckCircle2 size={11} />
                                {lead.status === "duplicate"
                                  ? "CRM"
                                  : t("generator.metricMovedToCrm")}
                              </span>
                            )}
                          </div>
                          <span>
                            {[lead.city, lead.country]
                              .filter(Boolean)
                              .join(", ") || "—"}
                          </span>
                          <small>
                            {lead.sourceProvider || lead.source || "—"}
                          </small>
                        </div>

                        <div className="generator-company-description">
                          <strong>
                            {lead.title ||
                              form.industry ||
                              t("generator.labelIndustry")}
                          </strong>
                          <span>
                            {lead.businessName && lead.contactName
                              ? `${lead.contactName} · ${lead.businessName}`
                              : lead.contactName || lead.businessName || "—"}
                          </span>
                        </div>

                        <div className="generator-contact">
                          <strong>{contact}</strong>
                          <span>{lead.title || "—"}</span>
                          {lead.email && (
                            <a href={`mailto:${lead.email}`}>{lead.email}</a>
                          )}
                          {lead.phone && (
                            <a href={`tel:${lead.phone}`}>{lead.phone}</a>
                          )}
                        </div>

                        <div
                          className={`generator-match ${bandClass(lead.aiBand)}`}
                        >
                          <strong>{score || "—"}</strong>
                          <span>{t("generator.aiScore")}</span>
                        </div>

                        <div className="generator-row-actions">
                          <button
                            type="button"
                            className="generator-add-list"
                            onClick={() => importOne(lead.id)}
                            disabled={imported}
                          >
                            <Save size={13} />
                            {imported
                              ? t("generator.metricMovedToCrm")
                              : t("generator.saveSelected", { count: 1 })}
                          </button>

                          {lead.sourceUrl ? (
                            <a
                              className="generator-more-link"
                              href={lead.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {t("common.view")}
                              <ExternalLink size={12} />
                            </a>
                          ) : (
                            <button
                              type="button"
                              className="generator-more-link"
                              disabled
                            >
                              <MoreVertical size={14} />
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              <div className="generator-results-footer">
                <div>
                  <span>
                    {t("generator.selectedCount", {
                      count: selectedLeads.length,
                    })}
                  </span>
                  <button
                    type="button"
                    className="generator-btn generator-btn-ghost"
                    onClick={() => importMany(selectedLeads)}
                    disabled={!selectedLeads.length}
                  >
                    <Save size={14} />
                    {t("generator.saveSelected", {
                      count: selectedLeads.length,
                    })}
                  </button>

                  <button
                    type="button"
                    className="generator-btn generator-btn-ghost"
                    onClick={exportCsv}
                    disabled={!leads.length}
                  >
                    <Download size={14} />
                    {t("generator.export")}
                  </button>

                  <button
                    type="button"
                    className="generator-btn generator-btn-success"
                    onClick={saveCurrentSearch}
                  >
                    <Sparkles size={14} />
                    {t("generator.saveThisSearch")}
                  </button>
                </div>
              </div>
            </section>

            <section className="generator-next">
              <h2>{t("generator.sourcesDisclaimer")}</h2>

              <div className="generator-next-grid">
                <button type="button" onClick={saveCurrentSearch}>
                  <span>
                    <Save size={17} />
                  </span>
                  <strong>{t("generator.sourcePublicWebSearch")}</strong>
                  <small>{t("generator.progressSearching")}</small>
                </button>

                <button
                  type="button"
                  onClick={exportCsv}
                  disabled={!leads.length}
                >
                  <span>
                    <Download size={17} />
                  </span>
                  <strong>{t("generator.sourceBusinessPlaces")}</strong>
                  <small>{t("generator.progressAnalyzing")}</small>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    importMany(
                      selectedLeads.length ? selectedLeads : qualifiedIds,
                    )
                  }
                  disabled={!selectedLeads.length && !qualifiedIds.length}
                >
                  <span>
                    <Users size={17} />
                  </span>
                  <strong>{t("generator.sourceRealEstatePages")}</strong>
                  <small>{t("generator.progressRemovingDuplicates")}</small>
                </button>

                <button
                  type="button"
                  onClick={() => setMsg(t("generator.progressReady"))}
                >
                  <span>
                    <Filter size={17} />
                  </span>
                  <strong>{t("generator.sourceDeveloperWebsites")}</strong>
                  <small>{t("generator.progressScoring")}</small>
                </button>
              </div>
            </section>
          </main>

          <aside className="generator-side-column">
            <section className="generator-side-card generator-ai-powered">
              <span className="generator-eyebrow">
                {t("generator.liveSummary")}
              </span>
              <div className="generator-ai-count">
                <strong>{generatedCount}</strong>
                <span>{t("generator.metricGeneratedLeads")}</span>
              </div>

              <div className="generator-ai-progress">
                <span
                  style={{
                    width: `${Math.min(
                      100,
                      generatedCount
                        ? Math.round((qualifiedCount / generatedCount) * 100)
                        : 0,
                    )}%`,
                  }}
                />
              </div>

              <div className="generator-match-breakdown">
                <div>
                  <span>
                    <i className="high" />
                    {t("generator.metricHotOpportunities")}
                  </span>
                  <strong>{matchCounts.high}</strong>
                </div>
                <div>
                  <span>
                    <i className="medium" />
                    {t("generator.metricAiQualified")}
                  </span>
                  <strong>{matchCounts.medium}</strong>
                </div>
                <div>
                  <span>
                    <i className="low" />
                    {t("generator.metricEnrichedLeads")}
                  </span>
                  <strong>{matchCounts.low}</strong>
                </div>
              </div>

              <button
                type="button"
                className="generator-side-link"
                onClick={() =>
                  document
                    .querySelector(".generator-results-card")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
              >
                {t("generator.metricGeneratedLeadsSub")}
                <ArrowRight size={13} />
              </button>
            </section>

            <section className="generator-side-card">
              <h3>{t("generator.sourceFocusTitle")}</h3>

              <dl className="generator-summary-list">
                <div>
                  <dt>
                    <Building2 size={13} />
                    {t("generator.labelIndustry")}
                  </dt>
                  <dd>{form.industry || "—"}</dd>
                </div>
                <div>
                  <dt>
                    <MapPin size={13} />
                    {t("generator.labelCountry")}
                  </dt>
                  <dd>{currentLocation || "—"}</dd>
                </div>
                <div>
                  <dt>
                    <Users size={13} />
                    {t("generator.benefitQualified")}
                  </dt>
                  <dd>
                    {form.companySize === "all"
                      ? t("common.all")
                      : form.companySize}
                  </dd>
                </div>
                <div>
                  <dt>
                    <Sparkles size={13} />
                    {t("generator.interestedIn")}
                  </dt>
                  <dd>{form.technologies || "—"}</dd>
                </div>
                <div>
                  <dt>
                    <Search size={13} />
                    {t("generator.labelProductOffer")}
                  </dt>
                  <dd>{form.keywords || "—"}</dd>
                </div>
                <div>
                  <dt>
                    <Activity size={13} />
                    {t("common.date")}
                  </dt>
                  <dd>
                    {search?.createdAt
                      ? new Date(search.createdAt).toLocaleString()
                      : "—"}
                  </dd>
                </div>
              </dl>

              <button
                type="button"
                className="generator-side-link"
                onClick={() =>
                  document
                    .querySelector(".generator-advanced-card")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
              >
                {t("generator.metricAiQualifiedSub")}
                <ArrowRight size={13} />
              </button>
            </section>

            <section className="generator-side-card">
              <h3>{t("generator.aiScoreInsights")}</h3>

              <div className="generator-side-search-list">
                {search ? (
                  <button type="button">
                    <Activity size={13} />
                    <span>
                      <strong>
                        {form.keywords ||
                          form.industry ||
                          t("generator.pageTitle")}
                      </strong>
                      <small>
                        {generatedCount} {t("generator.metricGeneratedLeads")}
                      </small>
                    </span>
                    <em>{search.status}</em>
                  </button>
                ) : (
                  <div className="generator-empty-small">
                    {t("common.noData")}
                  </div>
                )}
              </div>

              <button
                type="button"
                className="generator-side-link"
                onClick={() =>
                  document
                    .querySelector(".generator-search-card")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
              >
                {t("generator.metricHotOpportunitiesSub")}
                <ArrowRight size={13} />
              </button>
            </section>

            <section className="generator-side-card">
              <h3>{t("generator.topCitiesFound")}</h3>

              <div className="generator-side-search-list">
                {savedSearches.length ? (
                  savedSearches.slice(0, 5).map((saved) => (
                    <button
                      type="button"
                      key={saved.id}
                      onClick={() => applySaved(saved)}
                    >
                      <Save size={13} />
                      <span>
                        <strong>{saved.name}</strong>
                        <small>
                          {saved.criteria?.keywords ||
                            saved.criteria?.industry ||
                            saved.criteria?.location ||
                            "—"}
                        </small>
                      </span>
                      <ArrowRight size={13} />
                    </button>
                  ))
                ) : (
                  <div className="generator-empty-small">
                    {t("common.noData")}
                  </div>
                )}
              </div>

              <button
                type="button"
                className="generator-side-link"
                onClick={() => setShowSaved(true)}
              >
                {t("generator.viewAllCities")}
                <ArrowRight size={13} />
              </button>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
