import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import apiClient from "../../api/apiClient";
import "./pipeline.css";
import {
  Search,
  SlidersHorizontal,
  Download,
  ChevronDown,
  Plus,
  Calendar,
  MessageCircle,
  Phone,
  Video,
  MoreVertical,
  Sparkles,
  Send,
  Users,
  Bot,
  Clock3,
  TrendingUp,
  Flame,
  ArrowRight,
  Brain,
  Settings2,
  Home,
  Smile,
  Paperclip,
  ImageIcon,
  Mic,
  ArrowUpRight,
  LayoutDashboard,
  Building2,
  Contact2,
  KanbanSquare,
  Megaphone,
  LineChartIcon,
  CheckSquare,
  HelpCircle,
  Settings,
  Bell,
  LogOut,
  AlertTriangle,
  FileText,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Layers,
  GitFork,
  AlertCircle,
  UserCheck,
} from "lucide-react";
import PipelineListModal from "./components/PipelineListModal";
import { ResponsiveContainer, LineChart, Line, YAxis } from "recharts";
export default function PipelinePage() {
  const { t } = useTranslation();
  const [pipelineStats, setPipelineStats] = useState([]);
  const [pipelineColumns, setPipelineColumns] = useState([]);
  const [pipelineLoading, setPipelineLoading] = useState(false);
  const [movingDealId, setMovingDealId] = useState(null);
  const [search, setSearch] = useState("");
  const [showCreateDealModal, setShowCreateDealModal] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [selectedDealEvents, setSelectedDealEvents] = useState([]);
  const [selectedDealLoading, setSelectedDealLoading] = useState(false);
  const [riskQueue, setRiskQueue] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [automationHealth, setAutomationHealth] = useState([]);
  const [forecastRange, setForecastRange] = useState(
    localStorage.getItem("pipeline_forecast_range") || "month",
  );
  const [showFilters, setShowFilters] = useState(false);
  const [scoringDealId, setScoringDealId] = useState(null);
  const [analyzingPipeline, setAnalyzingPipeline] = useState(false);
  const [pipelineInsight, setPipelineInsight] = useState(null);
  const [prioritizingDeals, setPrioritizingDeals] = useState(false);
  const [priorityInsight, setPriorityInsight] = useState(null);
  const [sendingSuggestions, setSendingSuggestions] = useState(false);
  const [showDealModal, setShowDealModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [savingDeal, setSavingDeal] = useState(false);
  const [deletingDeal, setDeletingDeal] = useState(false);

  const [draggingDeal, setDraggingDeal] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);
  const [dateRange, setDateRange] = useState("this_week");
  const [pipelineViewMode, setPipelineViewMode] = useState("ai");
  const [commandActionLoading, setCommandActionLoading] = useState(null);
  const [commandOutput, setCommandOutput] = useState(null);
  const [aiMetrics, setAiMetrics] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityModalEvents, setActivityModalEvents] = useState([]);
  const [activityModalOffset, setActivityModalOffset] = useState(0);
  const [activityModalHasMore, setActivityModalHasMore] = useState(false);
  const [activityModalLoading, setActivityModalLoading] = useState(false);

  const [riskModalOpen, setRiskModalOpen] = useState(false);
  const [riskModalLimit, setRiskModalLimit] = useState(5);
  const visibleRiskItems = riskQueue.slice(0, riskModalLimit);
  const riskHasMore = riskQueue.length > riskModalLimit;

  const [agents, setAgents] = useState([]);
  const [agentFilter, setAgentFilter] = useState(
    localStorage.getItem("pipeline_agent_filter") || "all",
  );
  const [pipelineFilters, setPipelineFilters] = useState({
    stage: "all",
    risk: "all",
    tag: "all",
    minValue: "",
  });

  const [createDealForm, setCreateDealForm] = useState({
    name: "",
    value: "",
    stage: "new",
    notes: "",
  });
  const statIcons = {
    users: <Users size={20} />,
    dollar: <DollarSign size={20} />,
    check: <CheckCircle2 size={20} />,
    flame: <Flame size={20} />,
    bot: <Bot size={20} />,
    alert: <AlertTriangle size={20} />,
  };

  const fetchPipelineDashboard = async () => {
    try {
      setPipelineLoading(true);

      const response = await apiClient.request(
        `/pipeline/dashboard?forecastRange=${forecastRange}&agentId=${agentFilter}`,
        {
          method: "GET",
        },
      );

      const data = response?.data || response || {};

      setPipelineStats(Array.isArray(data.stats) ? data.stats : []);
      setPipelineColumns(Array.isArray(data.columns) ? data.columns : []);
      setRiskQueue(Array.isArray(data.riskQueue) ? data.riskQueue : []);
      setForecast(data.forecast || null);
      setAiMetrics(data.aiMetrics || null);
      setAutomationHealth(
        Array.isArray(data.automationHealth) ? data.automationHealth : [],
      );
      const columns = Array.isArray(data.columns) ? data.columns : [];
      const firstDeal = columns.flatMap((col) => col.deals || [])[0] || null;

      if (!selectedDeal && firstDeal) {
        setSelectedDeal(firstDeal);
        fetchDealEvents(firstDeal.id);
      }
    } catch (err) {
      console.error("Fetch pipeline dashboard error:", err);
    } finally {
      setPipelineLoading(false);
    }
  };

  useEffect(() => {
    fetchPipelineAgents();
  }, []);

  useEffect(() => {
    localStorage.setItem("pipeline_forecast_range", forecastRange);
    localStorage.setItem("pipeline_agent_filter", agentFilter);

    const params = new URLSearchParams(window.location.search);
    params.set("forecast", forecastRange);
    params.set("agent", agentFilter);

    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}?${params.toString()}`,
    );

    fetchPipelineDashboard();
  }, [forecastRange, agentFilter]);

  const moveDealToNextStage = async (deal, currentStage) => {
    const stageOrder = [
      "new",
      "qualified",
      "proposal",
      "negotiation",
      "won",
      "lost",
    ];
    const index = stageOrder.indexOf(currentStage);
    const nextStage = stageOrder[index + 1];

    if (!deal?.id || !nextStage) return;

    try {
      setMovingDealId(deal.id);

      await apiClient.request(`/pipeline/deals/${deal.id}/move`, {
        method: "PATCH",
        body: JSON.stringify({
          stage: nextStage,
        }),
      });

      fetchPipelineDashboard();
    } catch (err) {
      console.error("Move deal error:", err);
    } finally {
      setMovingDealId(null);
    }
  };

  const visibleColumns = pipelineColumns
    .filter((column) => {
      return (
        pipelineFilters.stage === "all" || column.id === pipelineFilters.stage
      );
    })
    .map((column) => {
      const keyword = search.trim().toLowerCase();
      const isWithinDateRange = (deal) => {
        if (dateRange === "all") return true;

        const updatedAt = deal.updatedAt || deal.createdAt || deal.aiScoredAt;
        if (!updatedAt) return true;

        const date = new Date(updatedAt);
        const now = new Date();

        if (dateRange === "today") {
          return date.toDateString() === now.toDateString();
        }

        if (dateRange === "this_week") {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(now.getDate() - 7);
          return date >= sevenDaysAgo;
        }

        if (dateRange === "this_month") {
          return (
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear()
          );
        }

        if (dateRange === "this_quarter") {
          const currentQuarter = Math.floor(now.getMonth() / 3);
          const dealQuarter = Math.floor(date.getMonth() / 3);

          return (
            dealQuarter === currentQuarter &&
            date.getFullYear() === now.getFullYear()
          );
        }

        return true;
      };
      return {
        ...column,
        deals: (column.deals || []).filter((deal) => {
          const matchesSearch = !keyword
            ? true
            : [deal.name, deal.property, deal.amount, deal.tag, deal.stage]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(keyword));

          const matchesRisk =
            pipelineFilters.risk === "all" ||
            String(deal.risk || "").toLowerCase() === pipelineFilters.risk;

          const matchesTag =
            pipelineFilters.tag === "all" ||
            String(deal.tag || "").toLowerCase() === pipelineFilters.tag;

          const matchesValue =
            !pipelineFilters.minValue ||
            Number(deal.value || 0) >= Number(pipelineFilters.minValue || 0);
          const matchesDate = isWithinDateRange(deal);

          return (
            matchesSearch &&
            matchesRisk &&
            matchesTag &&
            matchesValue &&
            matchesDate
          );
        }),
      };
    });
  const createDeal = async (e) => {
    e.preventDefault();

    try {
      await apiClient.request("/pipeline/deals", {
        method: "POST",
        body: JSON.stringify({
          name: createDealForm.name,
          value: Number(createDealForm.value || 0),
          stage: createDealForm.stage,
          notes: createDealForm.notes,
        }),
      });

      setShowCreateDealModal(false);

      setCreateDealForm({
        name: "",
        value: "",
        stage: "new",
        notes: "",
      });

      fetchPipelineDashboard();
    } catch (err) {
      console.error("Create deal error:", err);
      showToast(
        err?.message || t("pipeline.createDealError"),
      );
    }
  };
  const fetchDealEvents = async (dealId) => {
    if (!dealId) return;

    try {
      setSelectedDealLoading(true);

      const response = await apiClient.request(
        `/pipeline/deals/${dealId}/events?limit=5&offset=0`,
        { method: "GET" },
      );

      const data = response?.data || response || {};
      setSelectedDealEvents(Array.isArray(data.events) ? data.events : []);
    } catch (err) {
      console.error("Fetch deal events error:", err);
      setSelectedDealEvents([]);
    } finally {
      setSelectedDealLoading(false);
    }
  };
  const selectDeal = (deal) => {
    setSelectedDeal(deal);
    fetchDealEvents(deal.id);
  };
  const reviewRiskDeal = (dealId) => {
    const allDeals = pipelineColumns.flatMap((col) => col.deals || []);
    const matchedDeal = allDeals.find(
      (deal) => String(deal.id) === String(dealId),
    );

    if (!matchedDeal) return;

    selectDeal(matchedDeal);

    setTimeout(() => {
      document
        .querySelector(".selected-deal-bottom-drilldown-inspector-panel")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
    }, 100);
  };
  const renderTrend = (trend, fallback = "→ 0%") => {
    if (!trend) return fallback;
    if (typeof trend === "string") return trend;
    return trend.text || fallback;
  };

  const getTrendClass = (trend, fallback = "text-slate") => {
    if (!trend || typeof trend === "string") return fallback;
    return trend.className || fallback;
  };
  const exportPipelineCsv = () => {
    const rows = visibleColumns.flatMap((column) =>
      (column.deals || []).map((deal) => ({
        stage: column.title,
        name: deal.name || "",
        contact: deal.property || "",
        amount: deal.amount || "",
        value: deal.value || 0,
        score: deal.score || "",
        tag: deal.tag || "",
        risk: deal.risk || "",
        nextAction: deal.action || "",
        updated: deal.time || "",
      })),
    );

    const headers = [
      t("pipeline.stage"),
      t("pipeline.dealName"),
      t("pipeline.csvContact"),
      t("pipeline.csvAmount"),
      t("pipeline.csvRawValue"),
      t("pipeline.aiScore"),
      t("pipeline.csvTag"),
      t("pipeline.risk"),
      t("pipeline.nextAction"),
      t("pipeline.csvUpdated"),
    ];

    const csv = [
      headers,
      ...rows.map((row) => [
        row.stage,
        row.name,
        row.contact,
        row.amount,
        row.value,
        row.score,
        row.tag,
        row.risk,
        row.nextAction,
        row.updated,
      ]),
    ]
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "pipeline-deals.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  const scoreDeal = async (deal) => {
    if (!deal?.id) return;

    try {
      setScoringDealId(deal.id);

      const response = await apiClient.request(
        `/pipeline/deals/${deal.id}/score`,
        {
          method: "POST",
        },
      );

      const result = response?.data || response;

      setSelectedDeal((prev) =>
        prev?.id === deal.id
          ? {
              ...prev,
              score: `${result.score || 0}%`,
              tag: result.tag || prev.tag,
              risk: result.risk || prev.risk,
              suggestedSteps: result.nextActions || prev.suggestedSteps,
              aiReason: result.reason || prev.aiReason,
            }
          : prev,
      );

      await fetchDealEvents(deal.id);
      await fetchPipelineDashboard();
    } catch (err) {
      console.error("Score deal error:", err);
    } finally {
      setScoringDealId(null);
    }
  };

  const analyzePipeline = async () => {
    try {
      setAnalyzingPipeline(true);

      const response = await apiClient.request("/pipeline/analyze", {
        method: "POST",
      });

      const data = response?.data || response;
      setPipelineInsight(data || null);
    } catch (err) {
      console.error("Analyze pipeline error:", err);
    } finally {
      setAnalyzingPipeline(false);
    }
  };
  const autoPrioritizeDeals = async () => {
    try {
      setPrioritizingDeals(true);

      const response = await apiClient.request("/pipeline/auto-prioritize", {
        method: "POST",
      });

      const data = response?.data || response;

      setPriorityInsight(data || null);
      await fetchPipelineDashboard();

      if (selectedDeal?.id) {
        await fetchDealEvents(selectedDeal.id);
      }
    } catch (err) {
      console.error("Auto prioritize error:", err);
    } finally {
      setPrioritizingDeals(false);
    }
  };
  const sendAiSuggestions = async () => {
    if (!selectedDeal?.id) return;

    try {
      setSendingSuggestions(true);

      await apiClient.request(
        `/pipeline/deals/${selectedDeal.id}/send-suggestions`,
        {
          method: "POST",
        },
      );

      await fetchDealEvents(selectedDeal.id);
    } catch (err) {
      console.error("Send AI suggestions error:", err);
    } finally {
      setSendingSuggestions(false);
    }
  };
  const exportPipelineReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      stats: pipelineStats,
      forecast,
      riskQueue,
      automationHealth,
      columns: pipelineColumns.map((col) => ({
        stage: col.title,
        count: col.count,
        amount: col.amount,
        insight: col.insight,
        deals: (col.deals || []).map((deal) => ({
          name: deal.name,
          amount: deal.amount,
          score: deal.score,
          tag: deal.tag,
          risk: deal.risk,
          nextAction: deal.action,
          updated: deal.time,
        })),
      })),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "pipeline-ai-report.json";
    link.click();

    URL.revokeObjectURL(url);
  };
  const openDealModal = (deal) => {
    setEditingDeal({
      id: deal.id,
      name: deal.name || "",
      value: deal.value || "",
      stage: deal.stage || "new",
      notes: deal.notes || "",
    });

    setShowDealModal(true);
  };
  const updateDeal = async (e) => {
    e.preventDefault();
    if (!editingDeal?.id) return;

    try {
      setSavingDeal(true);

      await apiClient.request(`/pipeline/deals/${editingDeal.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editingDeal.name,
          value: Number(editingDeal.value || 0),
          stage: editingDeal.stage,
          notes: editingDeal.notes,
        }),
      });

      setShowDealModal(false);
      setEditingDeal(null);
      await fetchPipelineDashboard();

      if (selectedDeal?.id === editingDeal.id) {
        await fetchDealEvents(editingDeal.id);
      }
    } catch (err) {
      console.error("Update deal error:", err);
    } finally {
      setSavingDeal(false);
    }
  };

  const deleteDeal = async () => {
    if (!editingDeal?.id) return;

    try {
      setDeletingDeal(true);

      await apiClient.request(`/pipeline/deals/${editingDeal.id}`, {
        method: "DELETE",
      });

      setShowDealModal(false);
      setEditingDeal(null);

      if (selectedDeal?.id === editingDeal.id) {
        setSelectedDeal(null);
        setSelectedDealEvents([]);
      }

      await fetchPipelineDashboard();
    } catch (err) {
      console.error("Delete deal error:", err);
    } finally {
      setDeletingDeal(false);
    }
  };
  const handleDropDeal = async (targetStage) => {
    if (!draggingDeal?.id || !targetStage) return;

    if (draggingDeal.stage === targetStage) {
      setDraggingDeal(null);
      setDragOverStage(null);
      return;
    }

    try {
      setMovingDealId(draggingDeal.id);

      await apiClient.request(`/pipeline/deals/${draggingDeal.id}/move`, {
        method: "PATCH",
        body: JSON.stringify({
          stage: targetStage,
        }),
      });

      await fetchPipelineDashboard();

      if (selectedDeal?.id === draggingDeal.id) {
        setSelectedDeal((prev) =>
          prev ? { ...prev, stage: targetStage } : prev,
        );
        await fetchDealEvents(draggingDeal.id);
      }
    } catch (err) {
      console.error("Drop deal error:", err);
    } finally {
      setMovingDealId(null);
      setDraggingDeal(null);
      setDragOverStage(null);
    }
  };

  const commandMoveDeal = async (stage) => {
    if (!selectedDeal?.id || !stage) return;

    try {
      setCommandActionLoading(`move-${stage}`);

      await apiClient.request(`/pipeline/deals/${selectedDeal.id}/move`, {
        method: "PATCH",
        body: JSON.stringify({ stage }),
      });

      setSelectedDeal((prev) => (prev ? { ...prev, stage } : prev));
      await fetchPipelineDashboard();
      await fetchDealEvents(selectedDeal.id);
    } catch (err) {
      console.error("Command move deal error:", err);
    } finally {
      setCommandActionLoading(null);
    }
  };

  const commandScoreDeal = async () => {
    if (!selectedDeal?.id) return;

    try {
      setCommandActionLoading("score");

      const response = await apiClient.request(
        `/pipeline/deals/${selectedDeal.id}/score`,
        { method: "POST" },
      );

      const result = response?.data || response;

      setSelectedDeal((prev) =>
        prev
          ? {
              ...prev,
              score: `${result.score || 0}%`,
              tag: result.tag || prev.tag,
              risk: result.risk || prev.risk,
              suggestedSteps: result.nextActions || prev.suggestedSteps,
              aiReason: result.reason || prev.aiReason,
            }
          : prev,
      );

      await fetchDealEvents(selectedDeal.id);
      await fetchPipelineDashboard();
    } catch (err) {
      console.error("Command score deal error:", err);
    } finally {
      setCommandActionLoading(null);
    }
  };

  const commandGenerateFollowUp = async () => {
    if (!selectedDeal?.id) return;

    try {
      setCommandActionLoading("followup");

      const response = await apiClient.request(
        `/pipeline/deals/${selectedDeal.id}/generate-followup`,
        { method: "POST" },
      );

      const data = response?.data || response;

      setCommandOutput(data || null);
      await fetchDealEvents(selectedDeal.id);
    } catch (err) {
      console.error("Command generate follow-up error:", err);
    } finally {
      setCommandActionLoading(null);
    }
  };

  const commandSendSuggestions = async () => {
    if (!selectedDeal?.id) return;

    try {
      setCommandActionLoading("suggestions");

      await apiClient.request(
        `/pipeline/deals/${selectedDeal.id}/send-suggestions`,
        { method: "POST" },
      );

      await fetchDealEvents(selectedDeal.id);
    } catch (err) {
      console.error("Command send suggestions error:", err);
    } finally {
      setCommandActionLoading(null);
    }
  };

  const scrollToSelectedDeal = () => {
    document
      .querySelector(".selected-deal-bottom-drilldown-inspector-panel")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
  };

  const openActivityModal = async () => {
    if (!selectedDeal?.id) return;

    setActivityModalOpen(true);
    setActivityModalEvents([]);
    setActivityModalOffset(0);
    await loadMoreActivity(true);
  };

  const loadMoreActivity = async (reset = false) => {
    if (!selectedDeal?.id) return;

    const nextOffset = reset ? 0 : activityModalOffset;

    try {
      setActivityModalLoading(true);

      const response = await apiClient.request(
        `/pipeline/deals/${selectedDeal.id}/events?limit=10&offset=${nextOffset}`,
        { method: "GET" },
      );

      const data = response?.data || response || {};
      const events = Array.isArray(data.events) ? data.events : [];

      setActivityModalEvents((prev) => (reset ? events : [...prev, ...events]));
      setActivityModalOffset(nextOffset + events.length);
      setActivityModalHasMore(Boolean(data.pagination?.hasMore));
    } catch (err) {
      console.error("Load activity error:", err);
    } finally {
      setActivityModalLoading(false);
    }
  };
  const fetchPipelineAgents = async () => {
    try {
      const response = await apiClient.request("/pipeline/agents", {
        method: "GET",
      });

      const data = response?.data || response || [];
      setAgents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch pipeline agents error:", err);
      setAgents([]);
    }
  };
  return (
    <div className="pipeline-container-layout pipeline-page">
      <div className="heading_page">
        <Users className="header-icon" size={20} />
        <h1>{t("pipeline.pageTitle")}</h1>
      </div>
      <p className="sub_head">{t("pipeline.subheading")}</p>
      <header className="pipeline-page-header">
        <div className="header-global-actions">
          <div className="header-search-input-wrapper">
            <Search size={16} className="search-icon-inside" />
            <input
              type="text"
              placeholder={t("pipeline.searchPlaceholder")}
              className="global-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            className={`secondary-btn filter-btn ${showFilters ? "active" : ""}`}
            onClick={() => setShowFilters((prev) => !prev)}
          >
            <SlidersHorizontal size={15} /> {t("pipeline.filters")}
          </button>
          <button
            className={`secondary-btn active-view-btn ${
              pipelineViewMode === "ai" ? "active" : ""
            }`}
            onClick={() =>
              setPipelineViewMode((prev) => (prev === "ai" ? "standard" : "ai"))
            }
          >
            <Sparkles size={15} />
            {pipelineViewMode === "ai"
              ? t("pipeline.aiPipelineView")
              : t("pipeline.standardView")}
          </button>
          <button className="secondary-btn" onClick={exportPipelineCsv}>
            <Download size={15} /> {t("pipeline.export")}
          </button>
          <button
            className="primary-btn"
            onClick={() => setShowCreateDealModal(true)}
          >
            <Plus size={16} /> {t("pipeline.addDeal")}
          </button>
        </div>
      </header>

      {/* CONTROLS & DRILLDOWN FILTER BAR */}
      {showFilters && (
        <section className="pipeline-horizontal-filters">
          {/* 1. Date Filter */}
          <div className="secondary-btn dropdown-filter">
            <div>
              <Calendar size={15} />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="today">{t("pipeline.today")}</option>
                <option value="this_week">{t("pipeline.thisWeek")}</option>
                <option value="this_month">{t("pipeline.thisMonth")}</option>
                <option value="this_quarter">
                  {t("pipeline.thisQuarter")}
                </option>
                <option value="all">{t("pipeline.allTime")}</option>
              </select>
            </div>
            <ChevronDown size={14} />
          </div>

          {/* 2. Sources Filter */}
          <div className="secondary-btn dropdown-filter">
            <div>
              <DollarSign size={15} />
              <input
                type="number"
                placeholder={t("pipeline.minValuePlaceholder")}
                value={pipelineFilters.minValue}
                onChange={(e) =>
                  setPipelineFilters((prev) => ({
                    ...prev,
                    minValue: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          {/* 3. Stages Filter */}
          <div className="secondary-btn dropdown-filter">
            <div>
              <GitFork size={15} />
              <select
                value={pipelineFilters.stage}
                onChange={(e) =>
                  setPipelineFilters((prev) => ({
                    ...prev,
                    stage: e.target.value,
                  }))
                }
              >
                <option value="all">{t("pipeline.allStages")}</option>
                <option value="new">{t("pipeline.new")}</option>
                <option value="qualified">{t("pipeline.qualified")}</option>
                <option value="proposal">{t("pipeline.proposal")}</option>
                <option value="negotiation">
                  {t("pipeline.negotiation")}
                </option>
                <option value="won">{t("pipeline.won")}</option>
                <option value="lost">{t("pipeline.lost")}</option>
              </select>
            </div>
            <ChevronDown size={14} />
          </div>

          {/* 4. Priorities Filter */}
          <div className="secondary-btn dropdown-filter">
            <div>
              <AlertCircle size={15} />
              <select
                value={pipelineFilters.risk}
                onChange={(e) =>
                  setPipelineFilters((prev) => ({
                    ...prev,
                    risk: e.target.value,
                  }))
                }
              >
                <option value="all">{t("pipeline.allPriorities")}</option>
                <option value="low">{t("pipeline.low")}</option>
                <option value="medium">{t("pipeline.medium")}</option>
                <option value="high">{t("pipeline.high")}</option>
              </select>
            </div>
            <ChevronDown size={14} />
          </div>

          {/* 5. AI Scores Filter */}
          <div className="secondary-btn dropdown-filter">
            <div>
              <Sparkles size={15} />
              <select
                value={pipelineFilters.tag}
                onChange={(e) =>
                  setPipelineFilters((prev) => ({
                    ...prev,
                    tag: e.target.value,
                  }))
                }
              >
                <option value="all">{t("pipeline.allAiScores")}</option>
                <option value="hot">{t("pipeline.hot")}</option>
                <option value="warm">{t("pipeline.warm")}</option>
                <option value="cool">{t("pipeline.cool")}</option>
                <option value="won">{t("pipeline.won")}</option>
                <option value="lost">{t("pipeline.lost")}</option>
              </select>
            </div>
            <ChevronDown size={14} />
          </div>

          {/* 6. Agents Filter */}
          <div className="secondary-btn dropdown-filter">
            <div>
              <UserCheck size={15} />
              <select
                value={agentFilter}
                onChange={(e) => setAgentFilter(e.target.value)}
              >
                <option value="all">{t("pipeline.allAgents")}</option>

                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} ({agent.totalDeals})
                  </option>
                ))}
              </select>
            </div>
            <ChevronDown size={14} />
          </div>
          <button
            className="secondary-btn filter-btn"
            onClick={() => {
              setSearch("");
              setAgentFilter("all");
              setPipelineFilters({
                stage: "all",
                risk: "all",
                tag: "all",
                minValue: "",
              });
            }}
          >
            {t("pipeline.resetFilters")}
          </button>
        </section>
      )}

      {/* SUMMARY STATS GRID */}
      <section className="pipeline-stats-cards-grid">
        {pipelineStats.map((card, idx) => (
          <div className="pipeline-stat-card-item" key={idx}>
            <div className={`stat-card-icon-box ${card.className}`}>
              {statIcons[card.iconKey]}
            </div>
            <div className="stat-card-content-wrapper">
              <span className="stat-card-label-title">{card.title}</span>
              <h2 className="stat-card-numeric-value">{card.value}</h2>
              <span className={`stat-card-trend-indicator ${card.changeClass}`}>
                {card.change}
              </span>
            </div>
          </div>
        ))}
      </section>

      {/* AI INSIGHTS NOTIFICATION BANNER */}
      {pipelineViewMode === "ai" && (
        <section className="ai-intelligence-insight-banner">
          <div className="ai-banner-left-info">
            <div className="ai-sparkle-avatar-glow">
              <Sparkles size={20} className="text-white" />
            </div>
            <div className="ai-banner-text-details">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="ai-banner-header-title">
                  {t("pipeline.aiPipelineIntelligence")}
                </h3>
                <span className="ai-intelligence-active-badge">
                  {t("pipeline.active")}
                </span>
              </div>
              <p className="ai-banner-description">
                {t("pipeline.aiBannerDescription")}
              </p>
              {pipelineInsight && (
                <div className="pipeline-ai-analysis-result">
                  <strong>{pipelineInsight.headline}</strong>
                  <p>{pipelineInsight.revenueAtRiskReason}</p>
                </div>
              )}
              {priorityInsight && (
                <div className="pipeline-ai-analysis-result">
                  <strong>{t("pipeline.aiPrioritizationComplete")}</strong>
                  <p>{priorityInsight.summary}</p>
                </div>
              )}
            </div>
          </div>

          <div className="ai-banner-metrics-container">
            {[
              aiMetrics?.confidence,
              aiMetrics?.revenueAtRisk,
              aiMetrics?.expectedClosings,
            ].map((metric, index) => (
              <div className="ai-metric-column-box" key={index}>
                <span className="ai-metric-box-label">
                  {metric?.label || t("pipeline.metricFallback")}
                </span>

                <div className="ai-metric-content-wrapper">
                  <div className="ai-metric-value-group">
                    <strong className="ai-metric-box-value">
                      {metric?.value || "0"}
                    </strong>

                    <span
                      className={metric?.badgeClass || "ai-metric-pill-blue"}
                    >
                      {metric?.badge || t("pipeline.pending")}
                    </span>
                  </div>

                  <div className="ai-mini-chart-inline">
                    <ResponsiveContainer width="100%" height={24}>
                      <LineChart data={metric?.chart || [{ v: 0 }, { v: 0 }]}>
                        <YAxis hide domain={["dataMin", "dataMax"]} />
                        <Line
                          type="monotone"
                          dataKey="v"
                          strokeWidth={1.5}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="ai-banner-action-buttons-group">
            <button
              className="ai-action-primary-trigger-btn"
              onClick={analyzePipeline}
              disabled={analyzingPipeline}
            >
              <Sparkles size={14} />
              {analyzingPipeline
                ? t("pipeline.analyzing")
                : t("pipeline.analyzePipeline")}
            </button>
            <button
              className="ai-action-secondary-trigger-btn"
              onClick={autoPrioritizeDeals}
              disabled={prioritizingDeals}
            >
              <Bot size={14} />
              {prioritizingDeals
                ? t("pipeline.prioritizing")
                : t("pipeline.autoPrioritizeDeals")}
            </button>
            <button
              className="ai-action-secondary-trigger-btn"
              onClick={exportPipelineReport}
            >
              <Download size={14} /> {t("pipeline.exportReport")}
            </button>
          </div>
        </section>
      )}

      {/* KANBAN BOARD SECTION */}
      <section className="pipeline-kanban-board-scrollable-container">
        {pipelineLoading ? (
          <div className="pipeline-loading-state">
            <RefreshCw size={18} className="spin" />
            {t("pipeline.loadingPipeline")}
          </div>
        ) : (
          visibleColumns.map((col) => (
            <div
              className={`kanban-stage-column-wrapper ${
                dragOverStage === col.id ? "drag-over" : ""
              }`}
              key={col.id}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverStage(col.id);
              }}
              onDragLeave={() => setDragOverStage(null)}
              onDrop={() => handleDropDeal(col.id)}
            >
              <div className="kanban-column-header-details">
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center gap-2">
                    <span className={`column-status-dot dot-${col.id}`}></span>
                    <h3 className="column-stage-title-text">{col.title}</h3>
                  </div>
                </div>
              </div>

              <div className="kanban-sub flex items-center gap-2 text-xs text-slate-500">
                <span className="column-deals-counter-badge">
                  {t("pipeline.dealsCount", { count: col.count })}
                </span>
                <span className="column-header-divider">•</span>
                <span className="column-aggregate-financial-sum">
                  {col.amount}
                </span>
              </div>

              <div className="kanban-column-ai-insight-strip">
                <span>
                  {t("pipeline.aiInsightLabel", { insight: col.insight })}
                </span>
              </div>

              <div className="kanban-cards-vertical-stack">
                {col.deals.map((deal, dIdx) => (
                  <div
                    className={`kanban-deal-card-item ${
                      selectedDeal?.id === deal.id ? "active" : ""
                    } ${draggingDeal?.id === deal.id ? "dragging" : ""}`}
                    key={deal.id}
                    draggable
                    onDragStart={() => setDraggingDeal(deal)}
                    onDragEnd={() => {
                      setDraggingDeal(null);
                      setDragOverStage(null);
                    }}
                    onClick={() => selectDeal(deal)}
                  >
                    <div className="deal-card-header-top-row">
                      <div
                        className={`deal-card-avatar-circle ${deal.avatarClass}`}
                      >
                        {deal.avatarInitials}
                      </div>

                      <div className="deal-card-lead-identity">
                        <div className="flex justify-between items-start w-full">
                          <h4 className="deal-card-client-name">{deal.name}</h4>

                          <span
                            className={`deal-card-temperature-tag tag-${deal.tag.toLowerCase()}`}
                          >
                            {deal.tag}
                          </span>
                        </div>
                        <span className="deal-card-property-title">
                          {deal.property}
                        </span>
                        <strong className="deal-card-financial-value">
                          {deal.amount}
                        </strong>
                      </div>
                      <button
                        className="deal-card-context-menu-trigger"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDealModal(deal);
                        }}
                      >
                        <MoreVertical size={14} />
                      </button>
                    </div>

                    <div className="deal-card-ai-score-metric-row">
                      <div className="flex justify-between items-center mb-1">
                        <span className="ai-score-label-text">
                          {t("pipeline.aiScore")}
                        </span>
                        <span className="ai-score-numeric-percentage">
                          {deal.score}
                        </span>
                      </div>
                      <div className="ai-score-horizontal-progress-bar-bg">
                        <div
                          className="ai-score-horizontal-progress-fill-active"
                          style={{ width: deal.score }}
                        ></div>
                      </div>
                    </div>

                    <div className="deal-card-recommended-next-action-box">
                      <div className="flex justify-between items-center">
                        <span className="next-action-label-title">
                          {t("pipeline.nextBestAction")}
                        </span>
                        <span className="next-action-timestamp-clock">
                          <Clock3 size={11} /> {deal.time}
                        </span>
                      </div>
                      <span className="next-action-description-text">
                        <Clock3 size={11} /> {deal.action}
                      </span>
                      {/*{deal.nextStep && (
                      <div className="deal-card-extended-next-step-strip">
                       <span className="extended-step-label">Next Step:</span>
                        <span className="extended-step-desc">
                          {deal.nextStep}
                        </span>
                      </div>
                    )}*/}
                    </div>

                    <div className="deal-card-bottom-interactive-action-triggers">
                      <button
                        className="deal-card-footer-action-trigger-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          scoreDeal(deal);
                        }}
                        disabled={scoringDealId === deal.id}
                      >
                        <Sparkles size={12} />
                        {scoringDealId === deal.id
                          ? t("pipeline.scoring")
                          : t("pipeline.score")}
                      </button>
                      <button
                        className="deal-card-footer-action-trigger-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveDealToNextStage(deal, col.id);
                        }}
                        disabled={movingDealId === deal.id || col.id === "lost"}
                      >
                        <ArrowUpRight size={12} />
                        {movingDealId === deal.id
                          ? t("pipeline.moving")
                          : t("pipeline.move")}
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  className="kanban-column-add-deal-inline-trigger-btn"
                  onClick={() => {
                    setCreateDealForm((prev) => ({
                      ...prev,
                      stage: col.id,
                    }));
                    setShowCreateDealModal(true);
                  }}
                >
                  <Plus size={14} /> {t("pipeline.addDeal")}
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      {/* SPLIT BOTTOM INTELLIGENCE GRID */}
      {pipelineViewMode === "ai" && (
        <section className="pipeline-bottom-split-intelligence-grid">
          {/* PANEL 1: AI DEAL RISK QUEUE */}
          <div className="bottom-intelligence-card-panel">
            <div className="intelligence-card-header-row">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="intelligence-header-icon" />
                <h3 className="intelligence-card-main-title">
                  {t("pipeline.aiDealRiskQueue")}
                </h3>
                <span className="intelligence-card-sub-header-counter">
                  {t("pipeline.atRiskDealsAttention", {
                    count: riskQueue.length,
                  })}
                </span>
              </div>
              <button
                className="intelligence-view-all-navigation-link"
                onClick={() => {
                  setRiskModalLimit(5);
                  setRiskModalOpen(true);
                }}
              >
                {t("pipeline.viewAll")} <ArrowRight size={14} />
              </button>
            </div>

            <div className="risk-queue-table-rows-wrapper">
              {riskQueue.length ? (
                riskQueue.map((row) => (
                  <div className="risk-queue-table-row-item" key={row.id}>
                    <span className="risk-table-cell-property-name">
                      {row.name}
                    </span>
                    <strong className="risk-table-cell-deal-value">
                      {row.value}
                    </strong>
                    <span className="risk-table-cell-risk-reason-desc">
                      {row.reason}
                    </span>
                    <span
                      className={`risk-table-cell-severity-badge status-${String(
                        row.status || "medium",
                      ).toLowerCase()}`}
                    >
                      {row.status}
                    </span>
                    <button
                      className="risk-table-cell-action-review-trigger-btn"
                      onClick={() => reviewRiskDeal(row.id)}
                    >
                      {t("pipeline.review")}
                    </button>
                  </div>
                ))
              ) : (
                <div className="risk-queue-table-row-item">
                  <span className="risk-table-cell-property-name">
                    {t("pipeline.noAtRiskDeals")}
                  </span>
                  <strong className="risk-table-cell-deal-value">$0</strong>
                  <span className="risk-table-cell-risk-reason-desc">
                    {t("pipeline.pipelineHealthy")}
                  </span>
                  <span className="risk-table-cell-severity-badge status-medium">
                    {t("pipeline.low")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* PANEL 2: REVENUE FORECAST */}
          <div className="bottom-intelligence-card-panel">
            <div className="intelligence-card-header-row">
              <div className="flex items-center gap-2">
                <LineChartIcon size={18} className="intelligence-header-icon" />
                <h3 className="intelligence-card-main-title">
                  {t("pipeline.revenueForecast")}
                </h3>
              </div>
              <div className="secondary-btn compact-dropdown-trigger">
                <select
                  value={forecastRange}
                  onChange={(e) => setForecastRange(e.target.value)}
                >
                  <option value="week">{t("pipeline.thisWeek")}</option>
                  <option value="month">{t("pipeline.thisMonth")}</option>
                  <option value="quarter">{t("pipeline.thisQuarter")}</option>
                  <option value="year">{t("pipeline.thisYear")}</option>
                </select>
              </div>
            </div>

            <div className="revenue-forecast-metrics-grid-quad">
              <div className="revenue-forecast-metric-quad-card">
                <span className="forecast-quad-card-label">
                  {t("pipeline.forecastedRevenue")}
                </span>
                <strong className="forecast-quad-card-large-numeric">
                  {forecast?.forecastedRevenue || "$0"}
                </strong>
                <span
                  className={`forecast-quad-card-trend-subtext ${getTrendClass(
                    forecast?.forecastedRevenueTrend,
                  )}`}
                >
                  {renderTrend(forecast?.forecastedRevenueTrend)}
                </span>
              </div>
              <div className="revenue-forecast-metric-quad-card">
                <span className="forecast-quad-card-label">
                  {t("pipeline.forecastedClosings")}
                </span>
                <strong className="forecast-quad-card-large-numeric">
                  {forecast?.forecastedClosings || 0}
                </strong>
                <span
                  className={`forecast-quad-card-trend-subtext ${getTrendClass(
                    forecast?.forecastedClosingsTrend,
                  )}`}
                >
                  {renderTrend(forecast?.forecastedClosingsTrend)}
                </span>
              </div>
              <div className="revenue-forecast-metric-quad-card">
                <span className="forecast-quad-card-label">
                  {t("pipeline.pipelineVelocity")}
                </span>
                <strong className="forecast-quad-card-large-numeric">
                  {forecast?.pipelineVelocity || "0x"}
                </strong>
                <span
                  className={`forecast-quad-card-trend-subtext ${getTrendClass(
                    forecast?.pipelineVelocityTrend,
                  )}`}
                >
                  {renderTrend(forecast?.pipelineVelocityTrend)}
                </span>
              </div>
              <div className="revenue-forecast-metric-quad-card">
                <span className="forecast-quad-card-label">
                  {t("pipeline.closeConfidence")}
                </span>
                <strong className="forecast-quad-card-large-numeric">
                  {forecast?.closeConfidence || "0%"}
                </strong>
                <span
                  className={`forecast-quad-card-trend-subtext ${getTrendClass(
                    forecast?.closeConfidenceTrend,
                  )}`}
                >
                  {renderTrend(
                    forecast?.closeConfidenceTrend,
                    t("pipeline.mediumConfidence"),
                  )}
                </span>
              </div>
            </div>

            <p className="revenue-forecast-footer-explanatory-text">
              {forecast?.description || t("pipeline.noForecastAvailable")}
            </p>
          </div>

          {/* PANEL 3: AUTOMATION HEALTH */}
          <div className="bottom-intelligence-card-panel">
            <div className="intelligence-card-header-row">
              <div className="flex items-center gap-2">
                <Settings size={18} className="intelligence-header-icon" />
                <h3 className="intelligence-card-main-title">
                  {t("pipeline.automationHealth")}
                </h3>
              </div>
              <span className="automation-global-status-indicator-pill">
                <span className="live-status-dot-green"></span>{" "}
                {t("pipeline.allSystemsOperational")}
              </span>
            </div>

            <div className="automation-health-list-rows-stack">
              {automationHealth.map((item, iIdx) => (
                <div className="automation-health-row-item" key={iIdx}>
                  <div className="flex items-center gap-2">
                    <CheckSquare
                      size={14}
                      className="automation-item-check-icon"
                    />
                    <span className="automation-health-item-title-text">
                      {item.title}
                    </span>
                  </div>
                  <span className="automation-health-item-status-active-badge">
                    {item.state}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SELECTED DEAL BOTTOM DRILLDOWN VIEW CARD */}
      <section className="selected-deal-bottom-drilldown-inspector-panel">
        <div className="inspector-panel-grid-layout">
          <div className="select-deal">
            <div className="inspector-left-identity-column">
              <span className="inspector-section-small-overhead-label">
                {t("pipeline.selectedDeal")}
              </span>
              <div className="flex items-start gap-3 mt-2">
                <div
                  className={`inspector-deal-avatar-circle ${selectedDeal?.avatarClass || "avatar-purple"}`}
                >
                  {selectedDeal?.avatarInitials || "D"}
                </div>
                <div className="inspector-deal-wrap">
                  <h4 className="inspector-deal-client-name">
                    {selectedDeal?.name || t("pipeline.selectADeal")}
                  </h4>

                  <span className="inspector-deal-property-title">
                    {selectedDeal?.property || t("pipeline.noDealSelected")}
                  </span>
                  <div className="flex items-center gap-2 mt-2">
                    <strong className="inspector-deal-financial-value">
                      {selectedDeal?.amount || "$0"}
                    </strong>
                    <span
                      className={`deal-card-temperature-tag tag-${String(selectedDeal?.tag || "warm").toLowerCase()}`}
                    >
                      {selectedDeal?.tag || t("pipeline.warm")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="inspector-center-metrics-column">
              <div className="inspector-metric-box-card">
                <span className="inspector-metric-card-label">
                  {t("pipeline.aiScore")}
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <strong className="inspector-metric-card-large-value">
                    {selectedDeal?.score || "0%"}
                  </strong>
                </div>
                <div className="inspector-metric-horizontal-progress-bar-bg">
                  <div
                    className="inspector-metric-horizontal-progress-fill"
                    style={{ width: selectedDeal?.score || "0%" }}
                  ></div>
                </div>
              </div>

              <div className="inspector-metric-box-card">
                <span className="inspector-metric-card-label">
                  {t("pipeline.risk")}
                </span>
                <strong className="inspector-metric-card-large-value text-red mt-1 tag-hot">
                  {selectedDeal?.risk || t("pipeline.low")}
                </strong>
              </div>

              <div className="inspector-metric-box-card">
                <span className="inspector-metric-card-label">
                  {t("pipeline.stage")}
                </span>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`column-status-dot dot-${selectedDeal?.stage || "new"}`}
                  ></span>
                  <strong className="inspector-metric-card-standard-text tag-purple">
                    {selectedDeal?.stage || "new"}
                  </strong>
                </div>
              </div>

              <div className="ofmobile inspector-metric-box-card">
                <span className="inspector-metric-card-label">
                {t("pipeline.nextAction")}
              </span>
                <div className="follow-up flex items-center gap-1 mt-2 text-slate-800 font-semibold">
                  <Calendar size={14} />{" "}
                  <span>{selectedDeal?.action || t("pipeline.noAction")}</span>
                </div>
                <span className="inspector-metric-card-sub-timestamp">
                  <Clock3 size={11} />{" "}
                  {selectedDeal?.time || t("pipeline.recentlyUpdated")}
                </span>
              </div>
            </div>
            <div className="mobile inspector-metric-box-card">
              <span className="inspector-metric-card-label">
                {t("pipeline.nextAction")}
              </span>
              <div className="follow-up-right">
                <span className="inspector-metric-card-sub-timestamp">
                  <Clock3 size={11} />{" "}
                  {selectedDeal?.time || t("pipeline.recentlyUpdated")}
                </span>
                <div className="follow-up flex items-center gap-1 mt-2 text-slate-800 font-semibold">
                  <Calendar size={14} />{" "}
                  <span>{selectedDeal?.action || t("pipeline.noAction")}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="inspector-deal-activity-log-column">
            <div className="flex justify-between items-center mb-2">
              <span className="inspector-section-small-overhead-label">
                {t("pipeline.dealActivity")}
              </span>
              <button
                className="intelligence-view-all-navigation-link text-xs"
                onClick={openActivityModal}
                disabled={!selectedDeal?.id}
              >
                {t("pipeline.viewAll")}
              </button>
            </div>
            <div className="inspector-activity-logs-mini-stack">
              {selectedDealLoading ? (
                <div className="inspector-activity-log-row-item">
                  <span className="activity-log-dot-indicator blue-dot"></span>
                  <span className="activity-log-description-text">
                    {t("pipeline.loadingActivity")}
                  </span>
                </div>
              ) : selectedDealEvents.length ? (
                selectedDealEvents.map((event) => (
                  <div
                    className="inspector-activity-log-row-item"
                    key={event.id}
                  >
                    <span className="activity-log-dot-indicator blue-dot"></span>
                    <span className="activity-log-description-text">
                      {event.metadata?.title || t("pipeline.dealActivityItem")}
                    </span>
                    <span className="activity-log-relative-timestamp">
                      {event.timeAgo || t("pipeline.recentlyUpdated")}
                    </span>
                  </div>
                ))
              ) : (
                <div className="inspector-activity-log-row-item">
                  <span className="activity-log-dot-indicator green-dot"></span>
                  <span className="activity-log-description-text">
                    {t("pipeline.noActivityYet")}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="inspector-ai-next-steps-actions-column">
            <span className="inspector-section-small-overhead-label">
              {t("pipeline.aiSuggestedNextSteps")}
            </span>
            {selectedDeal?.aiReason && (
              <p className="inspector-ai-reason-text">
                {selectedDeal.aiReason}
              </p>
            )}
            <div className="inspector-ai-action-steps-rows-stack mt-2">
              {(selectedDeal?.suggestedSteps || []).length ? (
                selectedDeal.suggestedSteps.map((step, index) => (
                  <div
                    className="inspector-ai-action-step-row-item"
                    key={index}
                  >
                    <span className="ai-step-title-text">{step.title}</span>
                    <span
                      className={`ai-step-impact-badge impact-${String(
                        step.impact || "medium",
                      ).toLowerCase()}`}
                    >
                      {step.impactLabel || t("pipeline.mediumImpact")}
                    </span>
                  </div>
                ))
              ) : (
                <div className="inspector-ai-action-step-row-item">
                  <span className="ai-step-title-text">
                    {t("pipeline.noAiSuggestions")}
                  </span>
                  <span className="ai-step-impact-badge impact-medium">
                    {t("pipeline.pending")}
                  </span>
                </div>
              )}
            </div>
            <button
              className="inspector-ai-action-primary-trigger-cta-btn"
              onClick={sendAiSuggestions}
              disabled={sendingSuggestions || !selectedDeal?.id}
            >
              {sendingSuggestions
                ? t("pipeline.sending")
                : t("pipeline.sendAiSuggestions")}
            </button>
          </div>
        </div>
      </section>

      {/* BOTTOM REVENUE COMMAND CENTER BAR */}
      <section className="revenue-command-center-sticky-bottom-bar">
        <div className="command-center-left">
          <div className="command-center-sparkle-avatar-box">
            <Sparkles size={20} className="text-white" />
          </div>

          <div className="command-center-wrap">
            <h3 className="command-center-main-title">
              {selectedDeal?.name || t("pipeline.revenueCommandCenter")}
            </h3>

            <p className="command-center-sub-description">
              {selectedDeal
                ? t("pipeline.commandCenterDealSummary", {
                    amount: selectedDeal.amount || "$0",
                    stage: selectedDeal.stage || "new",
                    score: selectedDeal.score || "0%",
                    risk: selectedDeal.risk || t("pipeline.low"),
                  })
                : t("pipeline.commandCenterPrompt")}
            </p>
          </div>
        </div>

        <div className="command-center-actions">
          <button
            className="command-center-action-btn primary"
            disabled={!selectedDeal?.id || commandActionLoading === "score"}
            onClick={commandScoreDeal}
          >
            <Sparkles size={15} />
            {commandActionLoading === "score"
              ? t("pipeline.scoring")
              : t("pipeline.reScoreAi")}
          </button>

          <button
            className="command-center-action-btn"
            disabled={!selectedDeal?.id || commandActionLoading === "followup"}
            onClick={commandGenerateFollowUp}
          >
            <MessageCircle size={15} />
            {commandActionLoading === "followup"
              ? t("pipeline.generating")
              : t("pipeline.generateFollowUp")}
          </button>

          <button
            className="command-center-action-btn"
            disabled={
              !selectedDeal?.id || commandActionLoading === "suggestions"
            }
            onClick={commandSendSuggestions}
          >
            <Send size={15} />
            {commandActionLoading === "suggestions"
              ? t("pipeline.sending")
              : t("pipeline.sendSuggestions")}
          </button>

          <div className="command-center-select-wrap">
            <select
              disabled={!selectedDeal?.id}
              value={selectedDeal?.stage || "new"}
              onChange={(e) => commandMoveDeal(e.target.value)}
            >
              <option value="new">{t("pipeline.moveNew")}</option>
              <option value="qualified">{t("pipeline.moveQualified")}</option>
              <option value="proposal">{t("pipeline.moveProposal")}</option>
              <option value="negotiation">
                {t("pipeline.moveNegotiation")}
              </option>
              <option value="won">{t("pipeline.closeAsWon")}</option>
              <option value="lost">{t("pipeline.closeAsLost")}</option>
            </select>
          </div>

          <button
            className="command-center-action-btn"
            disabled={!selectedDeal?.id}
            onClick={scrollToSelectedDeal}
          >
            <Clock3 size={15} />
            {t("pipeline.timeline")}
          </button>
        </div>
      </section>
      {showCreateDealModal && (
        <div className="pipeline-modal-overlay">
          <div className="pipeline-modal">
            <div className="pipeline-modal-header">
              <h3>{t("pipeline.createNewDeal")}</h3>

              <button
                type="button"
                className="pipeline-modal-close"
                onClick={() => setShowCreateDealModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={createDeal}>
              <div className="pipeline-modal-body">
                <div className="pipeline-form-grid">
                  <div className="pipeline-form-field full">
                    <label>{t("pipeline.dealName")}</label>
                    <input
                      required
                      value={createDealForm.name}
                      onChange={(e) =>
                        setCreateDealForm({
                          ...createDealForm,
                          name: e.target.value,
                        })
                      }
                      placeholder={t("pipeline.dealNameExample")}
                    />
                  </div>

                  <div className="pipeline-form-field">
                    <label>{t("pipeline.dealValue")}</label>
                    <input
                      type="number"
                      value={createDealForm.value}
                      onChange={(e) =>
                        setCreateDealForm({
                          ...createDealForm,
                          value: e.target.value,
                        })
                      }
                      placeholder="250000"
                    />
                  </div>

                  <div className="pipeline-form-field">
                    <label>{t("pipeline.stage")}</label>
                    <select
                      value={createDealForm.stage}
                      onChange={(e) =>
                        setCreateDealForm({
                          ...createDealForm,
                          stage: e.target.value,
                        })
                      }
                    >
                      <option value="new">{t("pipeline.new")}</option>
                      <option value="qualified">{t("pipeline.qualified")}</option>
                      <option value="proposal">{t("pipeline.proposal")}</option>
                      <option value="negotiation">
                  {t("pipeline.negotiation")}
                </option>
                      <option value="won">{t("pipeline.won")}</option>
                      <option value="lost">{t("pipeline.lost")}</option>
                    </select>
                  </div>

                  <div className="pipeline-form-field full">
                    <label>{t("pipeline.notes")}</label>
                    <textarea
                      rows="4"
                      value={createDealForm.notes}
                      onChange={(e) =>
                        setCreateDealForm({
                          ...createDealForm,
                          notes: e.target.value,
                        })
                      }
                      placeholder={t("pipeline.addDealNotes")}
                    />
                  </div>
                </div>
              </div>

              <div className="pipeline-modal-footer">
                <button
                  type="button"
                  className="pipeline-btn-cancel"
                  onClick={() => setShowCreateDealModal(false)}
                >
                  {t("pipeline.cancel")}
                </button>

                <button type="submit" className="pipeline-btn-save">
                  {t("pipeline.createDeal")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showDealModal && editingDeal && (
        <div className="pipeline-modal-overlay">
          <div className="pipeline-modal">
            <div className="pipeline-modal-header">
              <h3>{t("pipeline.editDeal")}</h3>

              <button
                type="button"
                className="pipeline-modal-close"
                onClick={() => setShowDealModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={updateDeal}>
              <div className="pipeline-modal-body">
                <div className="pipeline-form-grid">
                  <div className="pipeline-form-field full">
                    <label>{t("pipeline.dealName")}</label>
                    <input
                      required
                      value={editingDeal.name}
                      onChange={(e) =>
                        setEditingDeal({
                          ...editingDeal,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="pipeline-form-field">
                    <label>{t("pipeline.dealValue")}</label>
                    <input
                      type="number"
                      value={editingDeal.value}
                      onChange={(e) =>
                        setEditingDeal({
                          ...editingDeal,
                          value: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="pipeline-form-field">
                    <label>{t("pipeline.stage")}</label>
                    <select
                      value={editingDeal.stage}
                      onChange={(e) =>
                        setEditingDeal({
                          ...editingDeal,
                          stage: e.target.value,
                        })
                      }
                    >
                      <option value="new">{t("pipeline.new")}</option>
                      <option value="qualified">{t("pipeline.qualified")}</option>
                      <option value="proposal">{t("pipeline.proposal")}</option>
                      <option value="negotiation">
                  {t("pipeline.negotiation")}
                </option>
                      <option value="won">{t("pipeline.won")}</option>
                      <option value="lost">{t("pipeline.lost")}</option>
                    </select>
                  </div>

                  <div className="pipeline-form-field full">
                    <label>{t("pipeline.notes")}</label>
                    <textarea
                      rows="4"
                      value={editingDeal.notes}
                      onChange={(e) =>
                        setEditingDeal({
                          ...editingDeal,
                          notes: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="pipeline-modal-footer">
                <button
                  type="button"
                  className="pipeline-btn-danger"
                  onClick={deleteDeal}
                  disabled={deletingDeal}
                >
                  {deletingDeal ? t("pipeline.deleting") : t("pipeline.delete")}
                </button>

                <button
                  type="button"
                  className="pipeline-btn-cancel"
                  onClick={() => setShowDealModal(false)}
                >
                  {t("pipeline.cancel")}
                </button>

                <button
                  type="submit"
                  className="pipeline-btn-save"
                  disabled={savingDeal}
                >
                  {savingDeal ? t("pipeline.saving") : t("pipeline.saveChanges")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {commandOutput && (
        <div className="pipeline-modal-overlay">
          <div className="pipeline-modal command-output-modal">
            <div className="pipeline-modal-header">
              <h3>{t("pipeline.aiFollowUpGenerated")}</h3>

              <button
                type="button"
                className="pipeline-modal-close"
                onClick={() => setCommandOutput(null)}
              >
                ✕
              </button>
            </div>

            <div className="pipeline-modal-body">
              <div className="command-output-section">
                <label>{t("pipeline.emailSubject")}</label>
                <p>
                  {commandOutput.emailSubject ||
                    t("pipeline.noSubjectGenerated")}
                </p>
              </div>

              <div className="command-output-section">
                <label>{t("pipeline.emailBody")}</label>
                <p>{commandOutput.emailBody || t("pipeline.noEmailGenerated")}</p>
              </div>

              <div className="command-output-section">
                <label>{t("pipeline.whatsappMessage")}</label>
                <p>
                  {commandOutput.whatsappMessage ||
                    t("pipeline.noWhatsappMessage")}
                </p>
              </div>

              <div className="command-output-section">
                <label>{t("pipeline.callScript")}</label>
                <p>{commandOutput.callScript || t("pipeline.noCallScript")}</p>
              </div>

              <div className="command-output-section">
                <label>{t("pipeline.recommendedTask")}</label>
                <p>
                  {commandOutput.recommendedTask ||
                    t("pipeline.noTaskGenerated")}
                </p>
              </div>

              <div className="command-output-section">
                <label>{t("pipeline.aiReason")}</label>
                <p>{commandOutput.reason || t("pipeline.noReasonProvided")}</p>
              </div>
            </div>

            <div className="pipeline-modal-footer">
              <button
                type="button"
                className="pipeline-btn-cancel"
                onClick={() => setCommandOutput(null)}
              >
                {t("pipeline.close")}
              </button>
            </div>
          </div>
        </div>
      )}
      <PipelineListModal
        open={riskModalOpen}
        title={t("pipeline.aiDealRiskQueue")}
        subtitle={t("pipeline.atRiskDealsAttention", {
          count: riskQueue.length,
        })}
        items={visibleRiskItems}
        hasMore={riskHasMore}
        onClose={() => setRiskModalOpen(false)}
        onLoadMore={() => setRiskModalLimit((prev) => prev + 5)}
        emptyText={t("pipeline.noAtRiskDealsNow")}
        renderItem={(row) => (
          <div className="activity-modal-row" key={row.id}>
            <span className="activity-log-dot-indicator red-dot"></span>
            <div>
              <strong>{row.name}</strong>
              <p>
                {t("pipeline.riskRowSummary", {
                  value: row.value,
                  reason: row.reason,
                  status: row.status,
                })}
              </p>
            </div>
            <button
              className="risk-table-cell-action-review-trigger-btn"
              onClick={() => {
                setRiskModalOpen(false);
                reviewRiskDeal(row.id);
              }}
            >
              {t("pipeline.review")}
            </button>
          </div>
        )}
      />
      <PipelineListModal
        open={activityModalOpen}
        title={t("pipeline.dealActivity")}
        subtitle={selectedDeal?.name}
        items={activityModalEvents}
        hasMore={activityModalHasMore}
        loading={activityModalLoading}
        onClose={() => setActivityModalOpen(false)}
        onLoadMore={() => loadMoreActivity(false)}
        emptyText={t("pipeline.noActivityYet")}
        renderItem={(event) => (
          <div className="activity-modal-row" key={event.id}>
            <span className="activity-log-dot-indicator blue-dot"></span>
            <div>
              <strong>
                {event.metadata?.title || t("pipeline.dealActivityItem")}
              </strong>
              <p>{event.metadata?.sub || event.eventType}</p>
            </div>
            <span>{event.timeAgo || t("pipeline.recentlyUpdated")}</span>
          </div>
        )}
      />
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 30,
            right: 30,
            background: toast.type === "success" ? "#16a34a" : "#dc2626",
            color: "#fff",
            padding: "14px 18px",
            borderRadius: 14,
            fontWeight: 600,
            boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
            zIndex: 9999,
            minWidth: 280,
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
