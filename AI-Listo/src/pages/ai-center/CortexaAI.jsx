import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  BookOpen,
  Bot,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleCheck,
  Clock3,
  Copy,
  Database,
  FileText,
  HelpCircle,
  Home,
  Lock,
  Mail,
  MessageCircle,
  MessageSquare,
  Mic,
  Plus,
  RefreshCw,
  Rocket,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  TestTube2,
  Upload,
  UserRoundCheck,
  Users,
  Zap,
  Heart,
  Activity,
  TriangleAlert,
  CircleX,
  Save,
  PenLine,
  Check,
  PauseCircle,
  Moon,
  Timer,
  MoreHorizontal,
  Trash2,
  X,
} from "lucide-react";

import apiClient from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";
import WhatsAppConnectCard from "./components/WhatsAppConnectCard";
import { useWhatsAppSetup } from "./hooks/useWhatsAppSetup";
import "./CortexaAI.css";
import BusinessProfileModal from "./components/BusinessProfileModal";
import aiAgentSetupService from "./services/aiAgentSetup.service";
import PropertyImportModal from "./components/PropertyImportModal";
import AppointmentRulesModal from "./components/AppointmentRulesModal";
import AIBehaviorModal from "./components/AIBehaviorModal";
import AutomationModal from "./components/AutomationModal";
import TestAgentModal from "./components/TestAgentModal";
import KnowledgeItemModal from "./components/KnowledgeItemModal";
import KnowledgeImportModal from "./components/KnowledgeImportModal";
import KnowledgeInsightsModal from "./components/KnowledgeInsightsModal";

export default function CortexaAI() {
  const { user } = useAuth();
  const [activePage, setActivePage] = useState("setup");
  const [openStep, setOpenStep] = useState(1);
  const [message, setMessage] = useState("");
  const [controlTab, setControlTab] = useState("General");

  const [setupData, setSetupData] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [knowledgeData, setKnowledgeData] = useState(null);
  const [controlsData, setControlsData] = useState(null);

  const [loadingSetup, setLoadingSetup] = useState(true);
  const [loadingPage, setLoadingPage] = useState(false);
  const [pageError, setPageError] = useState("");

  const [messages, setMessages] = useState([]);
  const [chatSessions, setChatSessions] = useState([]);
  const [activeChatSessionId, setActiveChatSessionId] = useState(null);
  const [chatSessionsLoading, setChatSessionsLoading] = useState(false);
  const [chatSessionLoading, setChatSessionLoading] = useState(false);
  const [creatingChatSession, setCreatingChatSession] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [chatError, setChatError] = useState("");

  const [businessProfileOpen, setBusinessProfileOpen] = useState(false);
  const [businessProfile, setBusinessProfile] = useState(null);
  const [businessProfileLoading, setBusinessProfileLoading] = useState(false);
  const [businessProfileSaving, setBusinessProfileSaving] = useState(false);
  const [businessProfileError, setBusinessProfileError] = useState("");

  const [propertyImportOpen, setPropertyImportOpen] = useState(false);
  const [propertyCatalog, setPropertyCatalog] = useState(null);
  const [propertyCatalogLoading, setPropertyCatalogLoading] = useState(false);
  const [propertyCatalogSaving, setPropertyCatalogSaving] = useState(false);
  const [propertyCatalogError, setPropertyCatalogError] = useState("");
  const [propertyCatalogSearch, setPropertyCatalogSearch] = useState("");

  const [appointmentRulesOpen, setAppointmentRulesOpen] = useState(false);
  const [appointmentRulesLoading, setAppointmentRulesLoading] = useState(false);
  const [appointmentRulesSaving, setAppointmentRulesSaving] = useState(false);
  const [appointmentRulesError, setAppointmentRulesError] = useState("");
  const [appointmentRules, setAppointmentRules] = useState(null);

  const [behaviorOpen, setBehaviorOpen] = useState(false);
  const [behavior, setBehavior] = useState(null);
  const [behaviorLoading, setBehaviorLoading] = useState(false);
  const [behaviorSaving, setBehaviorSaving] = useState(false);
  const [behaviorError, setBehaviorError] = useState("");

  const [automationsOpen, setAutomationsOpen] = useState(false);
  const [automations, setAutomations] = useState(null);
  const [automationsLoading, setAutomationsLoading] = useState(false);
  const [automationsSaving, setAutomationsSaving] = useState(false);
  const [automationsError, setAutomationsError] = useState("");

  const [testAgentOpen, setTestAgentOpen] = useState(false);
  const [testAgentStatus, setTestAgentStatus] = useState(null);
  const [testAgentLoading, setTestAgentLoading] = useState(false);
  const [testAgentSending, setTestAgentSending] = useState(false);
  const [testAgentError, setTestAgentError] = useState("");
  const [testAgentSessionId, setTestAgentSessionId] = useState(null);

  const [knowledgeModalOpen, setKnowledgeModalOpen] = useState(false);
  const [knowledgeEditingItem, setKnowledgeEditingItem] = useState(null);
  const [knowledgeSaving, setKnowledgeSaving] = useState(false);
  const [knowledgeDeletingId, setKnowledgeDeletingId] = useState(null);
  const [knowledgeError, setKnowledgeError] = useState("");
  const [knowledgeFilters, setKnowledgeFilters] = useState({
    page: 1,
    limit: 20,
    category: "all",
    status: "all",
    search: "",
  });

  const [knowledgeImportOpen, setKnowledgeImportOpen] = useState(false);
  const [knowledgeImportSaving, setKnowledgeImportSaving] = useState(false);
  const [knowledgeImportError, setKnowledgeImportError] = useState("");
  const [agentSidebarCollapsed, setAgentSidebarCollapsed] = useState(() => {
    return localStorage.getItem("cx-agent-sidebar-collapsed") === "true";
  });

  const [knowledgeInsightsOpen, setKnowledgeInsightsOpen] = useState(false);
  const [showInactiveCategories, setShowInactiveCategories] = useState(false);

  const toggleAgentSidebar = () => {
    setAgentSidebarCollapsed((current) => {
      const next = !current;
      localStorage.setItem("cx-agent-sidebar-collapsed", String(next));
      return next;
    });
  };
  const loadSetup = React.useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoadingSetup(true);
    }
    setPageError("");
    try {
      const data = await request("/ai-center/agent/setup");
      setSetupData(data);
      if (data?.appointmentRules) {
        setAppointmentRules(data.appointmentRules);
      }
      return data;
    } catch (error) {
      console.error("LOAD AI SETUP FAILED:", error);
      setPageError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load AI Agent setup.",
      );

      return null;
    } finally {
      if (!silent) {
        setLoadingSetup(false);
      }
    }
  }, []);

  const whatsappSetup = useWhatsAppSetup({
    onConnected: loadSetup,
  });

  const request = async (path, options = {}) => {
    return apiClient.request(path, options);
  };

  const loadPropertyCatalog = async ({
    page = 1,
    search = propertyCatalogSearch,
  } = {}) => {
    setPropertyCatalogLoading(true);
    setPropertyCatalogError("");

    try {
      const data = await aiAgentSetupService.getPropertyCatalog({
        page,
        limit: 12,
        search,
      });

      setPropertyCatalog(data);
      setPropertyCatalogSearch(search);
    } catch (error) {
      console.error("LOAD PROPERTY CATALOG FAILED:", error);

      setPropertyCatalogError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load properties.",
      );
    } finally {
      setPropertyCatalogLoading(false);
    }
  };

  const openPropertyImport = async () => {
    setPropertyImportOpen(true);

    await loadPropertyCatalog({
      page: 1,
      search: "",
    });
  };

  const savePropertyCatalog = async (propertyIds) => {
    setPropertyCatalogSaving(true);
    setPropertyCatalogError("");

    try {
      await aiAgentSetupService.savePropertyCatalog(propertyIds);
      setPropertyImportOpen(false);
      await loadSetup({
        silent: true,
      });
      setOpenStep(4);
    } catch (error) {
      console.error("SAVE PROPERTY CATALOG FAILED:", error);

      setPropertyCatalogError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to save property catalog.",
      );

      throw error;
    } finally {
      setPropertyCatalogSaving(false);
    }
  };

  const loadAppointmentRules = useCallback(async () => {
    try {
      setAppointmentRulesLoading(true);
      setAppointmentRulesError("");
      const data = await aiAgentSetupService.getAppointmentRules();
      setAppointmentRules(data);
    } catch (error) {
      console.error(error);

      setAppointmentRulesError(
        error?.message || "Unable to load appointment rules.",
      );
    } finally {
      setAppointmentRulesLoading(false);
    }
  }, []);

  const openAppointmentRules = async () => {
    setAppointmentRulesOpen(true);
    await loadAppointmentRules();
  };

  const saveAppointmentRules = async (payload) => {
    try {
      setAppointmentRulesSaving(true);
      setAppointmentRulesError("");
      const data = await aiAgentSetupService.saveAppointmentRules(payload);
      setAppointmentRules(data);
      setAppointmentRulesOpen(false);
      await loadSetup({
        silent: true,
      });
    } catch (error) {
      console.error(error);
      setAppointmentRulesError(
        error?.message || "Unable to save appointment rules.",
      );
    } finally {
      setAppointmentRulesSaving(false);
    }
  };

  const loadBehavior = useCallback(async () => {
    setBehaviorLoading(true);
    setBehaviorError("");

    try {
      const data = await aiAgentSetupService.getBehavior();

      setBehavior(data);
    } catch (error) {
      console.error("LOAD AI BEHAVIOR FAILED:", error);

      setBehaviorError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load AI behavior.",
      );
    } finally {
      setBehaviorLoading(false);
    }
  }, []);

  const openBehavior = async () => {
    setBehaviorOpen(true);
    await loadBehavior();
  };

  const saveBehavior = async (payload) => {
    setBehaviorSaving(true);
    setBehaviorError("");

    try {
      const saved = await aiAgentSetupService.saveBehavior(payload);
      setBehavior(saved);
      setBehaviorOpen(false);
      await loadSetup({
        silent: true,
      });
      setOpenStep(6);
    } catch (error) {
      console.error("SAVE AI BEHAVIOR FAILED:", error);

      setBehaviorError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to save AI behavior.",
      );

      throw error;
    } finally {
      setBehaviorSaving(false);
    }
  };

  const loadAutomations = useCallback(async () => {
    setAutomationsLoading(true);
    setAutomationsError("");

    try {
      const data = await aiAgentSetupService.getAutomations();

      setAutomations(data);
    } catch (error) {
      console.error("LOAD AUTOMATIONS FAILED:", error);

      setAutomationsError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load automations.",
      );
    } finally {
      setAutomationsLoading(false);
    }
  }, []);

  const openAutomations = async () => {
    setAutomationsOpen(true);
    await loadAutomations();
  };

  const saveAutomations = async (payload) => {
    setAutomationsSaving(true);
    setAutomationsError("");

    try {
      const saved = await aiAgentSetupService.saveAutomations(payload);
      setAutomations(saved);
      setAutomationsOpen(false);
      await loadSetup({
        silent: true,
      });
      setOpenStep(7);
    } catch (error) {
      console.error("SAVE AUTOMATIONS FAILED:", error);

      setAutomationsError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to save automations.",
      );

      throw error;
    } finally {
      setAutomationsSaving(false);
    }
  };

  const loadAgentTest = useCallback(async () => {
    setTestAgentLoading(true);
    setTestAgentError("");

    try {
      const data = await aiAgentSetupService.getAgentTest();
      setTestAgentStatus(data);
      setTestAgentSessionId(data?.latestSession?.id || null);
      return data;
    } catch (error) {
      console.error("LOAD AI TEST STATUS FAILED:", error);

      setTestAgentError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load AI test status.",
      );

      return null;
    } finally {
      setTestAgentLoading(false);
    }
  }, []);

  const createNewAgentTest = async () => {
    setTestAgentLoading(true);
    setTestAgentError("");

    try {
      const session = await aiAgentSetupService.createAgentTestSession();
      setTestAgentSessionId(session.id);
      setTestAgentStatus((current) => ({
        ...(current || {}),
        latestSession: session,
      }));

      return session;
    } catch (error) {
      console.error("CREATE AI TEST SESSION FAILED:", error);

      setTestAgentError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to start a new test.",
      );

      throw error;
    } finally {
      setTestAgentLoading(false);
    }
  };

  const openAgentTest = async () => {
    setTestAgentOpen(true);
    await loadAgentTest();
  };

  const runAgentTest = async (message) => {
    setTestAgentSending(true);
    setTestAgentError("");

    try {
      const response = await aiAgentSetupService.runAgentTest(
        message,
        testAgentSessionId,
      );

      setTestAgentSessionId(response.sessionId);

      setTestAgentStatus((current) => {
        const currentMessages = current?.latestSession?.messages || [];

        return {
          ...(current || {}),
          tested: true,
          total: Math.max(
            Number(current?.total || 0),
            response.sessionId &&
              current?.latestSession?.id !== response.sessionId
              ? Number(current?.total || 0) + 1
              : Number(current?.total || 0),
          ),

          latestSession: {
            id: response.sessionId,
            status: "active",
            messages: [
              ...currentMessages,
              response.userMessage,
              response.assistantMessage,
            ],
          },
        };
      });

      await loadSetup({
        silent: true,
      });
      setOpenStep(8);
      return response;
    } catch (error) {
      console.error("RUN AI TEST FAILED:", error);
      setTestAgentError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to test AI Agent.",
      );

      throw error;
    } finally {
      setTestAgentSending(false);
    }
  };

  const [launchingAgent, setLaunchingAgent] = useState(false);
  const [launchError, setLaunchError] = useState("");
  const launchAgent = async () => {
    if (launchingAgent || !setupData?.launch?.unlocked) {
      return;
    }

    setLaunchingAgent(true);
    setLaunchError("");

    try {
      const updated = await aiAgentSetupService.updateSetup({
        launched: true,
      });
      setSetupData(updated);
      await loadSetup({
        silent: true,
      });
    } catch (error) {
      console.error("LAUNCH AI AGENT FAILED:", error);

      setLaunchError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to launch AI Agent.",
      );
    } finally {
      setLaunchingAgent(false);
    }
  };

  const normalizeChatMessages = (items = []) => {
    return (Array.isArray(items) ? items : []).map((item) => ({
      id: item.id,
      role: item.role,
      content: item.content || "",
      metadata: item.metadata || {},
      createdAt: item.createdAt || null,
      error: Boolean(item?.metadata?.error),
    }));
  };

  const loadChatSession = useCallback(async (sessionId) => {
    if (!sessionId) {
      setActiveChatSessionId(null);
      setMessages([]);
      return null;
    }
    setChatSessionLoading(true);
    setChatError("");
    try {
      const session = await aiAgentSetupService.getChatSession(sessionId);
      setActiveChatSessionId(session.id);
      setMessages(normalizeChatMessages(session.messages));
      return session;
    } catch (error) {
      console.error("LOAD CHAT SESSION FAILED:", error);
      setChatError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load this AI chat.",
      );

      return null;
    } finally {
      setChatSessionLoading(false);
    }
  }, []);

  const loadChatSessions = useCallback(
    async ({ openLatest = true, silent = false } = {}) => {
      if (!silent) {
        setChatSessionsLoading(true);
      }
      setChatError("");

      try {
        const response = await aiAgentSetupService.getChatSessions(20);
        const items = Array.isArray(response?.items) ? response.items : [];
        setChatSessions(items);
        if (openLatest && items.length > 0) {
          const currentExists =
            activeChatSessionId &&
            items.some((item) => item.id === activeChatSessionId);
          const targetId = currentExists ? activeChatSessionId : items[0].id;
          await loadChatSession(targetId);
        }

        if (openLatest && items.length === 0) {
          setActiveChatSessionId(null);
          setMessages([]);
        }

        return items;
      } catch (error) {
        console.error("LOAD CHAT SESSIONS FAILED:", error);

        setChatError(
          error?.response?.data?.message ||
            error?.message ||
            "Unable to load AI chat history.",
        );

        return [];
      } finally {
        if (!silent) {
          setChatSessionsLoading(false);
        }
      }
    },
    [activeChatSessionId, loadChatSession],
  );

  const createNewChat = async () => {
    if (creatingChatSession) return;
    setCreatingChatSession(true);
    setChatError("");

    try {
      const session = await aiAgentSetupService.createChatSession();
      setActiveChatSessionId(session.id);
      setMessages([]);
      setMessage("");
      setChatSessions((current) => [
        {
          id: session.id,
          title: session.title || "New Chat",
          status: session.status || "active",
          lastMessage: "",
          messageCount: 0,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
        },
        ...current.filter((item) => item.id !== session.id),
      ]);

      return session;
    } catch (error) {
      console.error("CREATE CHAT SESSION FAILED:", error);
      setChatError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to create a new chat.",
      );

      return null;
    } finally {
      setCreatingChatSession(false);
    }
  };

  const loadKnowledge = useCallback(
    async (nextFilters = knowledgeFilters, { silent = false } = {}) => {
      if (!silent) {
        setLoadingPage(true);
      }
      setKnowledgeError("");
      try {
        const data = await aiAgentSetupService.getKnowledge(nextFilters);
        setKnowledgeData(data);
        setKnowledgeFilters(nextFilters);
        return data;
      } catch (error) {
        console.error("LOAD KNOWLEDGE FAILED:", error);
        setKnowledgeError(
          error?.response?.data?.message ||
            error?.message ||
            "Unable to load AI knowledge.",
        );

        return null;
      } finally {
        if (!silent) {
          setLoadingPage(false);
        }
      }
    },
    [knowledgeFilters],
  );

  const openCreateKnowledge = (
    category = "company_information",
    overrides = {},
  ) => {
    setKnowledgeEditingItem({
      category,
      sourceType: "text",
      status: "active",
      priority: 0,
      title: "",
      content: "",
      sourceUrl: "",
      metadata: {},
      ...overrides,
    });

    setKnowledgeError("");
    setKnowledgeModalOpen(true);
  };

  const openEditKnowledge = async (item) => {
    setKnowledgeError("");
    try {
      const fullItem = await aiAgentSetupService.getKnowledgeItem(item.id);

      setKnowledgeEditingItem(fullItem);
      setKnowledgeModalOpen(true);
    } catch (error) {
      console.error("LOAD KNOWLEDGE ITEM FAILED:", error);
      setKnowledgeError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load knowledge item.",
      );
    }
  };

  const saveKnowledgeItem = async (payload) => {
    setKnowledgeSaving(true);
    setKnowledgeError("");
    try {
      if (knowledgeEditingItem?.id) {
        await aiAgentSetupService.updateKnowledgeItem(
          knowledgeEditingItem.id,
          payload,
        );
      } else {
        await aiAgentSetupService.createKnowledgeItem(payload);
      }
      setKnowledgeModalOpen(false);
      setKnowledgeEditingItem(null);
      await loadKnowledge(
        {
          ...knowledgeFilters,
          page: 1,
        },
        {
          silent: true,
        },
      );
    } catch (error) {
      console.error("SAVE KNOWLEDGE ITEM FAILED:", error);

      setKnowledgeError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to save knowledge item.",
      );
      throw error;
    } finally {
      setKnowledgeSaving(false);
    }
  };

  const deleteKnowledgeItem = async (item) => {
    const confirmed = window.confirm(`Delete "${item.title}"?`);

    if (!confirmed) {
      return;
    }
    setKnowledgeDeletingId(item.id);
    setKnowledgeError("");
    try {
      await aiAgentSetupService.deleteKnowledgeItem(item.id);
      const currentItems = knowledgeData?.items || [];
      const nextPage =
        currentItems.length === 1 && knowledgeFilters.page > 1
          ? knowledgeFilters.page - 1
          : knowledgeFilters.page;

      await loadKnowledge(
        {
          ...knowledgeFilters,
          page: nextPage,
        },
        {
          silent: true,
        },
      );
    } catch (error) {
      console.error("DELETE KNOWLEDGE ITEM FAILED:", error);
      setKnowledgeError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to delete knowledge item.",
      );
    } finally {
      setKnowledgeDeletingId(null);
    }
  };

  const importKnowledgeItems = async (items) => {
    setKnowledgeImportSaving(true);
    setKnowledgeImportError("");
    try {
      const result = await aiAgentSetupService.importKnowledge(items);
      if (Number(result?.imported || 0) === 0) {
        setKnowledgeImportError(
          result?.rejectedItems
            ?.map((item) => `${item.title}: ${item.reason}`)
            .join("\n") || "No knowledge items were imported.",
        );
        return;
      }
      setKnowledgeImportOpen(false);
      await loadKnowledge(
        {
          ...knowledgeFilters,
          page: 1,
        },
        {
          silent: true,
        },
      );
    } catch (error) {
      console.error("IMPORT KNOWLEDGE FAILED:", error);
      setKnowledgeImportError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to import knowledge.",
      );

      throw error;
    } finally {
      setKnowledgeImportSaving(false);
    }
  };

  const [activityData, setActivityData] = useState(null);
  const [activityFilters, setActivityFilters] = useState({
    page: 1,
    limit: 20,
    type: "all",
    status: "all",
    search: "",
  });

  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState("");
  const [activityDrawer, setActivityDrawer] = useState(null);
  const [activityDetailLoading, setActivityDetailLoading] = useState(false);
  const [activityExporting, setActivityExporting] = useState(false);
  const [activitySummaryModal, setActivitySummaryModal] = useState(null);
  const loadActivity = useCallback(
    async (nextFilters, { silent = false } = {}) => {
      const resolvedFilters = {
        page: 1,
        limit: 20,
        type: "all",
        status: "all",
        search: "",
        ...(nextFilters || {}),
      };
      if (!silent) {
        setActivityLoading(true);
      }
      setActivityError("");
      try {
        const data = await aiAgentSetupService.getActivityFeed(resolvedFilters);
        setActivityData(data);
        setActivityFilters(resolvedFilters);
        return data;
      } catch (error) {
        console.error("LOAD ACTIVITY FAILED:", error);
        setActivityError(
          error?.response?.data?.message ||
            error?.message ||
            "Unable to load AI activity.",
        );
        return null;
      } finally {
        if (!silent) {
          setActivityLoading(false);
        }
      }
    },
    [],
  );

  const exportActivityCsv = async () => {
    if (activityExporting) {
      return;
    }
    setActivityExporting(true);
    setActivityError("");

    try {
      const response = await aiAgentSetupService.exportActivityCsv({
        type: activityFilters.type,
        status: activityFilters.status,
        search: activityFilters.search,
      });
      const csv = String(response?.csv || "");

      if (!csv) {
        throw new Error("No activity data available to export.");
      }

      const blob = new Blob(["\uFEFF", csv], {
        type: response?.mimeType || "text/csv;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download =
        response?.filename || `ai-agent-activity-${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("EXPORT ACTIVITY CSV FAILED:", error);
      setActivityError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to export AI activity.",
      );
    } finally {
      setActivityExporting(false);
    }
  };

  useEffect(() => {
    loadSetup();
  }, [loadSetup]);

  useEffect(() => {
    if (!setupData?.isSetupComplete || activePage === "setup") return;

    let cancelled = false;

    const loadPage = async () => {
      setLoadingPage(true);
      setPageError("");

      try {
        let data = null;

        if (activePage === "chat") {
          const [dashboardResponse] = await Promise.all([
            request("/ai-center/agent/dashboard"),
            loadChatSessions({
              openLatest: true,
            }),
          ]);
          if (!cancelled) {
            setDashboardData(dashboardResponse);
          }
        }

        if (activePage === "knowledge") {
          data = await aiAgentSetupService.getKnowledge(knowledgeFilters);
          if (!cancelled) {
            setKnowledgeData(data);
          }
        }

        if (activePage === "activity") {
          await loadActivity({
            page: 1,
            limit: activityFilters.limit,
            type: activityFilters.type,
            status: activityFilters.status,
            search: activityFilters.search,
          });
        }

        if (activePage === "controls") {
          data = await request("/ai-center/agent/controls");
          if (!cancelled) setControlsData(data);
        }
      } catch (error) {
        console.error(`LOAD ${activePage.toUpperCase()} FAILED:`, error);
        if (!cancelled) {
          setPageError(
            error?.response?.data?.message ||
              error?.message ||
              "Unable to load AI Agent data.",
          );
        }
      } finally {
        if (!cancelled) setLoadingPage(false);
      }
    };

    loadPage();

    return () => {
      cancelled = true;
    };
  }, [
    activePage,
    setupData?.isSetupComplete,
    loadChatSessions,
    knowledgeFilters,
    loadActivity,
  ]);

  const sendChatMessage = async (text) => {
    const cleanMessage = String(text || "").trim();
    if (!cleanMessage || sendingMessage) {
      return;
    }
    const temporaryUserMessage = {
      id: `temporary-user-${Date.now()}`,
      role: "user",
      content: cleanMessage,
      createdAt: new Date().toISOString(),
      temporary: true,
    };
    setMessages((current) => [...current, temporaryUserMessage]);
    setMessage("");
    setSendingMessage(true);
    setChatError("");
    try {
      const response = await aiAgentSetupService.sendChatMessage({
        message: cleanMessage,
        sessionId: activeChatSessionId || undefined,
        attachments: [],
      });
      setActiveChatSessionId(response.sessionId);
      setMessages((current) => [
        ...current.filter((item) => item.id !== temporaryUserMessage.id),
        {
          ...response.userMessage,
          role: "user",
        },
        {
          ...response.assistantMessage,
          role: "assistant",
        },
      ]);
      setChatSessions((current) => {
        const existing = current.find((item) => item.id === response.sessionId);
        const title =
          existing?.title && existing.title !== "New Chat"
            ? existing.title
            : cleanMessage.length > 60
              ? `${cleanMessage.slice(0, 60)}...`
              : cleanMessage;
        const nextSession = {
          id: response.sessionId,
          title,
          status: "active",
          lastMessage:
            response.assistantMessage?.content || response.answer || "",
          messageCount: Number(existing?.messageCount || 0) + 2,
          updatedAt: new Date().toISOString(),
        };

        return [
          nextSession,
          ...current.filter((item) => item.id !== response.sessionId),
        ];
      });
      const refreshed = await request("/ai-center/agent/dashboard");
      setDashboardData(refreshed);
      return response;
    } catch (error) {
      console.error("AI CHAT FAILED:", error);
      setMessages((current) => [
        ...current.filter((item) => item.id !== temporaryUserMessage.id),

        {
          ...temporaryUserMessage,
          temporary: false,
        },

        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content:
            error?.response?.data?.message ||
            error?.message ||
            "AI request failed.",
          error: true,
        },
      ]);

      setChatError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to send your message.",
      );

      throw error;
    } finally {
      setSendingMessage(false);
    }
  };

  const openActivity = async (item) => {
    if (!item?.id) {
      return;
    }
    setActivityDetailLoading(true);
    setActivityError("");
    try {
      const detail = await aiAgentSetupService.getActivityDetail(item.id);
      setActivityDrawer(detail);
    } catch (error) {
      console.error("LOAD ACTIVITY DETAIL FAILED:", error);
      setActivityError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load activity details.",
      );
    } finally {
      setActivityDetailLoading(false);
    }
  };

  const saveControls = async (nextControls) => {
    const response = await request("/ai-center/agent/controls", {
      method: "PUT",
      body: JSON.stringify(nextControls),
    });
    setControlsData(response);
    return response;
  };

  const agentMenus = [
    {
      key: "setup",
      title: "Setup",
      desc: "Configure your AI Agent",
      icon: Settings2,
    },
    {
      key: "chat",
      title: "AI Chat",
      desc: "Chat with your AI Agent",
      icon: MessageSquare,
    },
    {
      key: "knowledge",
      title: "Knowledge",
      desc: "Manage AI knowledge",
      icon: BookOpen,
    },
    {
      key: "activity",
      title: "Activity",
      desc: "See what your AI is doing",
      icon: Sparkles,
    },
    {
      key: "controls",
      title: "Controls",
      desc: "Behavior & preferences",
      icon: SlidersHorizontal,
    },
  ];
  const openBusinessProfile = async () => {
    setBusinessProfileOpen(true);
    setBusinessProfileLoading(true);
    setBusinessProfileError("");

    try {
      const data = await aiAgentSetupService.getBusinessProfile();

      setBusinessProfile(data);
    } catch (error) {
      console.error("LOAD BUSINESS PROFILE FAILED:", error);

      setBusinessProfileError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load Business Profile.",
      );
    } finally {
      setBusinessProfileLoading(false);
    }
  };

  const saveBusinessProfile = async (payload) => {
    setBusinessProfileSaving(true);
    setBusinessProfileError("");

    try {
      const saved = await aiAgentSetupService.saveBusinessProfile(payload);

      setBusinessProfile(saved);
      setBusinessProfileOpen(false);
      await loadSetup({
        silent: true,
      });
      setOpenStep(3);
    } catch (error) {
      console.error("SAVE BUSINESS PROFILE FAILED:", error);

      setBusinessProfileError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to save Business Profile.",
      );

      throw error;
    } finally {
      setBusinessProfileSaving(false);
    }
  };

  if (loadingSetup) {
    return (
      <div className="cx-ai-loading-state">
        <RefreshCw className="cx-ai-loading-spinner" size={22} />
        Loading AI Agent...
      </div>
    );
  }

  const businessProfileModal = (
    <BusinessProfileModal
      open={businessProfileOpen}
      profile={businessProfile}
      loading={businessProfileLoading}
      saving={businessProfileSaving}
      error={businessProfileError}
      onClose={() => {
        if (!businessProfileSaving) {
          setBusinessProfileOpen(false);
        }
      }}
      onSave={saveBusinessProfile}
    />
  );
  return (
    <>
      <div
        className={`cx-ai-shell ${
          agentSidebarCollapsed ? "agent-sidebar-collapsed" : ""
        }`}
      >
        <aside
          className={`cx-agent-sidebar ${
            agentSidebarCollapsed ? "collapsed" : ""
          }`}
        >
          <button
            type="button"
            className="cx-agent-sidebar-toggle-inside"
            onClick={toggleAgentSidebar}
            aria-label={
              agentSidebarCollapsed
                ? "Expand AI Agent sidebar"
                : "Collapse AI Agent sidebar"
            }
            title={
              agentSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
            }
          >
            <ChevronRight
              size={18}
              className={agentSidebarCollapsed ? "" : "is-expanded"}
            />
          </button>
          <div className="cx-agent-brand">
            <div className="cx-agent-bot">
              <Bot size={24} />
            </div>

            {!agentSidebarCollapsed && (
              <div>
                <h2>AI Agent</h2>

                <span>
                  <i />

                  {setupData?.agentStatus === "paused"
                    ? "Paused"
                    : setupData?.isSetupComplete
                      ? "Active"
                      : "Setup"}
                </span>
              </div>
            )}
          </div>

          <nav className="cx-agent-menu">
            {agentMenus.map((item) => {
              const Icon = item.icon;

              const locked =
                !setupData?.isSetupComplete && item.key !== "setup";

              return (
                <button
                  key={item.key}
                  title={agentSidebarCollapsed ? item.title : undefined}
                  className={`${
                    activePage === item.key ? "active" : ""
                  } ${locked ? "locked" : ""}`}
                  disabled={locked}
                  onClick={() => {
                    if (locked) return;
                    setActivePage(item.key);
                  }}
                >
                  <Icon size={18} />
                  {!agentSidebarCollapsed && (
                    <>
                      <div className="cx-agent-status-card">
                        <div>
                          <strong>{item.title}</strong>
                          <small>
                            {locked ? "Complete setup first" : item.desc}
                          </small>
                        </div>
                      </div>
                      {locked && (
                        <Lock className="cx-agent-menu-lock" size={14} />
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </nav>

          {agentSidebarCollapsed ? (
            <button
              type="button"
              className="cx-agent-status-collapsed"
              title={
                setupData?.isSetupComplete
                  ? "AI Agent Online"
                  : "Setup in progress"
              }
              onClick={() => {
                setActivePage(
                  setupData?.isSetupComplete ? "activity" : "setup",
                );
              }}
            >
              <span
                className={`cx-agent-status-dot ${
                  setupData?.agentStatus === "paused"
                    ? "paused"
                    : setupData?.isSetupComplete
                      ? "online"
                      : "setup"
                }`}
              />

              {setupData?.agentStatus === "paused" ? (
                <PauseCircle size={20} />
              ) : setupData?.isSetupComplete ? (
                <Activity size={20} />
              ) : (
                <Settings2 size={20} />
              )}
            </button>
          ) : (
            <div className="cx-agent-status-card">
              <h3>AI Agent Status</h3>

              <p className={setupData?.isSetupComplete ? "online" : "setup"}>
                <i />

                {setupData?.agentStatus === "paused"
                  ? "Paused"
                  : setupData?.isSetupComplete
                    ? "Online"
                    : "Setup in progress"}
              </p>

              <p>
                {setupData?.isSetupComplete
                  ? "Your AI Agent is active and ready to help."
                  : `${Number(setupData?.completedSteps || 0)} of ${Number(
                      setupData?.totalSteps || 8,
                    )} setup steps completed.`}
              </p>

              <button
                type="button"
                onClick={() => {
                  setActivePage(
                    setupData?.isSetupComplete ? "activity" : "setup",
                  );
                }}
              >
                {setupData?.isSetupComplete
                  ? "View Activity"
                  : "Continue Setup"}
              </button>
            </div>
          )}
        </aside>

        <section className="cx-agent-content">
          {pageError && <div className="cx-ai-error-banner">{pageError}</div>}

          {loadingPage && activePage !== "chat" && (
            <div className="cx-ai-inline-loading">
              <RefreshCw className="cx-ai-loading-spinner" size={18} />
              Loading data...
            </div>
          )}

          {activePage === "setup" && (
            <SetupLayout
              setupData={setupData}
              openStep={openStep}
              setOpenStep={setOpenStep}
              onRefresh={loadSetup}
              whatsappSetup={whatsappSetup}
              onBusinessProfile={openBusinessProfile}
              onPropertyImport={openPropertyImport}
              onAppointmentRules={openAppointmentRules}
              onBehavior={openBehavior}
              onAutomations={openAutomations}
              onTestAgent={openAgentTest}
              onLaunch={launchAgent}
              launchingAgent={launchingAgent}
              launchError={launchError}
            />
          )}

          {setupData?.isSetupComplete && activePage === "chat" && (
            <ChatLayout
              user={user}
              message={message}
              setMessage={setMessage}
              dashboardData={dashboardData}
              messages={messages}
              sessions={chatSessions}
              activeSessionId={activeChatSessionId}
              sessionsLoading={chatSessionsLoading}
              sessionLoading={chatSessionLoading}
              creatingSession={creatingChatSession}
              sendingMessage={sendingMessage}
              error={chatError}
              onSend={sendChatMessage}
              onNewChat={createNewChat}
              onSelectSession={loadChatSession}
              onOpenActivity={(filters = {}) => {
                setActivePage("activity");

                setTimeout(() => {
                  loadActivity({
                    ...activityFilters,
                    page: 1,
                    ...filters,
                  });
                }, 0);
              }}
            />
          )}

          {setupData?.isSetupComplete && activePage === "knowledge" && (
            <KnowledgeLayout
              knowledgeData={knowledgeData}
              filters={knowledgeFilters}
              loading={loadingPage}
              error={knowledgeError}
              deletingId={knowledgeDeletingId}
              showInactiveCategories={showInactiveCategories}
              onToggleInactiveCategories={() =>
                setShowInactiveCategories((current) => !current)
              }
              onViewInsights={() => setKnowledgeInsightsOpen(true)}
              onAdd={openCreateKnowledge}
              onEdit={openEditKnowledge}
              onDelete={deleteKnowledgeItem}
              onImport={() => {
                setKnowledgeImportError("");
                setKnowledgeImportOpen(true);
              }}
              onFilterChange={(patch) => {
                const nextFilters = {
                  ...knowledgeFilters,
                  ...patch,
                };

                if (
                  patch.category !== undefined ||
                  patch.status !== undefined ||
                  patch.search !== undefined
                ) {
                  nextFilters.page = 1;
                }

                loadKnowledge(nextFilters);
              }}
              onQuickAction={(type) => {
                const category =
                  knowledgeFilters.category !== "all"
                    ? knowledgeFilters.category
                    : "company_information";

                if (type === "text") {
                  openCreateKnowledge(category, {
                    sourceType: "text",
                  });
                  return;
                }

                if (type === "qa") {
                  openCreateKnowledge("faqs", {
                    sourceType: "qa",
                    metadata: {
                      format: "question_answer",
                    },
                  });
                  return;
                }

                if (type === "website") {
                  openCreateKnowledge(category, {
                    sourceType: "website",
                  });
                  return;
                }

                if (type === "document") {
                  setKnowledgeImportError("");
                  setKnowledgeImportOpen(true);
                  return;
                }

                if (type === "data_source") {
                  setKnowledgeImportError("");
                  setKnowledgeImportOpen(true);
                }
              }}
            />
          )}

          {setupData?.isSetupComplete && activePage === "activity" && (
            <ActivityLayout
              activityData={activityData}
              loading={activityLoading}
              error={activityError}
              filters={activityFilters}
              exporting={activityExporting}
              onExport={exportActivityCsv}
              onFilterChange={(patch) => {
                const nextFilters = {
                  ...activityFilters,
                  ...patch,
                };
                if (
                  patch.type !== undefined ||
                  patch.status !== undefined ||
                  patch.search !== undefined
                ) {
                  nextFilters.page = 1;
                }
                loadActivity(nextFilters);
              }}
              onPageChange={(page) => {
                loadActivity({
                  ...activityFilters,
                  page,
                });
              }}
              onRefresh={() =>
                loadActivity(
                  {
                    ...activityFilters,
                    page: 1,
                  },
                  {
                    silent: false,
                  },
                )
              }
              onOpen={openActivity}
              onViewActivityTypes={() => {
                setActivitySummaryModal({
                  type: "activity_types",
                  title: "Activity by Type",
                  items: Array.isArray(activityData?.activityByType)
                    ? activityData.activityByType
                    : [],
                });
              }}
              onViewTopActions={() => {
                setActivitySummaryModal({
                  type: "top_actions",
                  title: "Top Actions",
                  items: Array.isArray(activityData?.topActions)
                    ? activityData.topActions
                    : [],
                });
              }}
              onViewRecentRuns={() => {
                setActivitySummaryModal({
                  type: "recent_runs",
                  title: "Recent AI Runs",
                  items: Array.isArray(activityData?.recentRuns)
                    ? activityData.recentRuns
                    : Array.isArray(activityData?.recentAiRuns)
                      ? activityData.recentAiRuns
                      : [],
                });
              }}
            />
          )}

          {setupData?.isSetupComplete && activePage === "controls" && (
            <ControlsLayout
              controlTab={controlTab}
              setControlTab={setControlTab}
              controlsData={controlsData}
              onSave={saveControls}
            />
          )}
        </section>
      </div>

      <BusinessProfileModal
        open={businessProfileOpen}
        profile={businessProfile}
        saving={businessProfileSaving || businessProfileLoading}
        error={businessProfileError}
        onClose={() => {
          if (!businessProfileSaving) {
            setBusinessProfileOpen(false);
          }
        }}
        onSave={saveBusinessProfile}
      />

      <PropertyImportModal
        open={propertyImportOpen}
        loading={propertyCatalogLoading}
        saving={propertyCatalogSaving}
        error={propertyCatalogError}
        catalog={propertyCatalog}
        onClose={() => {
          if (!propertyCatalogSaving) {
            setPropertyImportOpen(false);
          }
        }}
        onSearch={(search) => {
          loadPropertyCatalog({
            page: 1,
            search,
          });
        }}
        onPageChange={(page) => {
          loadPropertyCatalog({
            page,
            search: propertyCatalogSearch,
          });
        }}
        onSave={savePropertyCatalog}
      />

      <AppointmentRulesModal
        open={appointmentRulesOpen}
        rules={appointmentRules}
        loading={appointmentRulesLoading}
        saving={appointmentRulesSaving}
        error={appointmentRulesError}
        onClose={() => {
          if (!appointmentRulesSaving) {
            setAppointmentRulesOpen(false);
          }
        }}
        onSave={saveAppointmentRules}
      />

      <AIBehaviorModal
        open={behaviorOpen}
        behavior={behavior}
        loading={behaviorLoading}
        saving={behaviorSaving}
        error={behaviorError}
        onClose={() => {
          if (!behaviorSaving) {
            setBehaviorOpen(false);
          }
        }}
        onSave={saveBehavior}
      />

      <AutomationModal
        open={automationsOpen}
        automations={automations}
        loading={automationsLoading}
        saving={automationsSaving}
        error={automationsError}
        onClose={() => {
          if (!automationsSaving) {
            setAutomationsOpen(false);
          }
        }}
        onSave={saveAutomations}
      />

      <TestAgentModal
        open={testAgentOpen}
        status={testAgentStatus}
        loading={testAgentLoading}
        sending={testAgentSending}
        error={testAgentError}
        onClose={() => {
          if (!testAgentSending) {
            setTestAgentOpen(false);
          }
        }}
        onRefresh={loadAgentTest}
        onNewSession={createNewAgentTest}
        onSend={runAgentTest}
      />

      <KnowledgeItemModal
        open={knowledgeModalOpen}
        item={knowledgeEditingItem}
        saving={knowledgeSaving}
        error={knowledgeError}
        onClose={() => {
          if (!knowledgeSaving) {
            setKnowledgeModalOpen(false);
            setKnowledgeEditingItem(null);
            setKnowledgeError("");
          }
        }}
        onSave={saveKnowledgeItem}
      />

      <KnowledgeImportModal
        open={knowledgeImportOpen}
        saving={knowledgeImportSaving}
        error={knowledgeImportError}
        defaultCategory={
          knowledgeFilters.category !== "all"
            ? knowledgeFilters.category
            : "company_information"
        }
        onClose={() => {
          if (!knowledgeImportSaving) {
            setKnowledgeImportOpen(false);
            setKnowledgeImportError("");
          }
        }}
        onImport={importKnowledgeItems}
      />

      <KnowledgeInsightsModal
        open={knowledgeInsightsOpen}
        data={knowledgeData}
        onClose={() => setKnowledgeInsightsOpen(false)}
      />

      <ActivityDetailDrawer
        open={Boolean(activityDrawer) || activityDetailLoading}
        loading={activityDetailLoading}
        activity={activityDrawer}
        onClose={() => {
          if (!activityDetailLoading) {
            setActivityDrawer(null);
          }
        }}
      />

      <ActivitySummaryModal
        open={Boolean(activitySummaryModal)}
        title={activitySummaryModal?.title}
        type={activitySummaryModal?.type}
        items={activitySummaryModal?.items || []}
        onClose={() => setActivitySummaryModal(null)}
        onOpenActivity={(item) => {
          setActivitySummaryModal(null);

          if (item?.id) {
            openActivity(item);
          }
        }}
      />
    </>
  );
}

function SetupLayout({
  setupData,
  openStep,
  setOpenStep,
  onRefresh,
  whatsappSetup,
  onBusinessProfile,
  onPropertyImport,
  onAppointmentRules,
  onBehavior,
  onAutomations,
  onTestAgent,
  onLaunch,
  launchingAgent,
  launchError,
}) {
  const setupSteps = useMemo(() => {
    const data = setupData || {};

    return [
      {
        id: 1,
        key: "whatsapp",
        title: "Connect WhatsApp",
        desc: "Connect the WhatsApp number your AI Agent will use.",
        icon: MessageSquare,
        status: whatsappSetup?.connected
          ? "Connected"
          : data?.whatsapp?.status || "Not connected",
        statusType:
          whatsappSetup?.connected || data?.whatsapp?.connected
            ? "success"
            : "danger",
        action:
          whatsappSetup?.connected || data?.whatsapp?.connected
            ? "Connected"
            : "Connect WhatsApp",
        accent: "green",
        complete: Boolean(
          whatsappSetup?.connected || data?.whatsapp?.connected,
        ),
      },
      {
        id: 2,
        key: "businessProfile",
        title: "Business Profile",
        desc: "Tell your AI Agent about your business.",
        icon: Building2,
        status: data?.businessProfile?.status || "Incomplete",
        statusType: data?.businessProfile?.completed ? "success" : "warning",
        action: data?.businessProfile?.completed ? "Edit" : "Set up",
        accent: "blue",
        complete: Boolean(data?.businessProfile?.completed),
      },
      {
        id: 3,
        key: "properties",
        title: "Import Properties",
        desc: "Add properties your AI can recommend.",
        icon: Home,
        status:
          data?.properties?.status ||
          `${Number(data?.properties?.imported || 0)} imported`,
        statusType:
          Number(data?.properties?.imported || 0) > 0 ? "success" : "muted",
        action: "Import",
        accent: "orange",
        complete: Number(data?.properties?.imported || 0) > 0,
      },
      {
        id: 4,
        key: "appointmentRules",
        title: "Appointment Rules",
        desc: "Define when and how AI can book appointments.",
        icon: CalendarDays,
        status: data?.appointmentRules?.status || "Not configured",
        statusType: data?.appointmentRules?.configured ? "success" : "muted",
        action: "Configure",
        accent: "indigo",
        complete: Boolean(data?.appointmentRules?.configured),
      },
      {
        id: 5,
        key: "behavior",
        title: "AI Behavior",
        desc: "Define how your AI should talk and what to ask.",
        icon: MessageSquare,
        status: data?.behavior?.status || "Not configured",
        statusType: data?.behavior?.configured ? "success" : "muted",
        action: "Configure",
        accent: "green",
        complete: Boolean(data?.behavior?.configured),
      },
      {
        id: 6,
        key: "automations",
        title: "Automations",
        desc: "Choose what your AI Agent should do automatically.",
        icon: Zap,
        status: data?.automations?.status || "Not configured",
        statusType: data?.automations?.configured ? "success" : "muted",
        action: data?.automations?.configured ? "Edit" : "Set up",
        accent: "purple",
        complete: Boolean(data?.automations?.configured),
      },
      {
        id: 7,
        key: "testAi",
        title: "Test AI",
        desc: "Test your AI Agent in a safe environment.",
        icon: TestTube2,
        status: data?.testAi?.status || "Not tested",
        statusType: data?.testAi?.tested ? "success" : "muted",
        action: "Test",
        accent: "pink",
        complete: Boolean(data?.testAi?.tested),
      },
      {
        id: 8,
        key: "launch",
        title: "Launch AI Agent",
        desc: "Review and launch your AI Agent.",
        icon: Rocket,
        status: data?.launch?.status || "Locked",
        statusType: data?.launch?.unlocked ? "success" : "locked",
        action: data?.launch?.unlocked ? "Launch" : "Locked",
        accent: "rose",
        complete: Boolean(data?.launch?.launched),
        locked: !data?.launch?.unlocked,
      },
    ];
  }, [setupData, whatsappSetup?.connected]);

  const completedSteps = Number(setupData?.completedSteps || 0);
  const totalSteps = Number(setupData?.totalSteps || 8);
  const progress = Number(setupData?.progress || 0);

  return (
    <div className="cx-ai-setup-page">
      <header className="cx-ai-setup-topbar heading_page">
        <div>
          <h1>Welcome! Let’s Get Your AI Agent Ready 👋</h1>
          <p className="sub_head">
            Complete these 8 quick steps. Most customers finish setup in under 5
            minutes.
          </p>
        </div>
      </header>

      <main className="cx-ai-setup-layout">
        <section className="cx-ai-setup-main">
          <h2>Your setup progress</h2>

          <div className="cx-setup-list">
            {setupSteps.map((step) => {
              const Icon = step.icon;
              const isOpen = openStep === step.id;

              return (
                <article
                  key={step.id}
                  className={`cx-setup-step ${isOpen ? "is-open" : ""}`}
                >
                  <div className="cx-setup-step-head">
                    <div className="cx-setup-step-left">
                      <div
                        className={`cx-step-number ${isOpen ? "active" : ""}`}
                      >
                        {step.id}
                      </div>
                      <div className={`cx-step-icon ${step.accent}`}>
                        <Icon size={24} />
                      </div>
                      <div>
                        <h3>{step.title}</h3>
                        <p>{step.desc}</p>
                      </div>
                    </div>

                    <div className="cx-setup-step-right">
                      <span className={`cx-status-pill ${step.statusType}`}>
                        {step.status}
                      </span>
                      {step.id !== 1 && (
                        <button
                          type="button"
                          className={`cx-step-action ${
                            step.locked ? "disabled" : ""
                          }`}
                          disabled={
                            step.locked ||
                            (step.key === "launch" && launchingAgent)
                          }
                          onClick={() => {
                            if (step.key === "businessProfile") {
                              onBusinessProfile?.();
                              return;
                            }
                            if (step.key === "properties") {
                              onPropertyImport?.();
                              return;
                            }
                            if (step.key === "appointmentRules") {
                              onAppointmentRules?.();
                              return;
                            }
                            if (step.key === "behavior") {
                              onBehavior?.();
                              return;
                            }
                            if (step.key === "automations") {
                              onAutomations?.();
                              return;
                            }
                            if (step.key === "testAi") {
                              onTestAgent?.();
                              return;
                            }
                            if (step.key === "launch") {
                              onLaunch?.();
                              return;
                            }
                            setOpenStep(step.id);
                          }}
                        >
                          {step.key === "launch" && launchingAgent
                            ? "Launching..."
                            : step.action}
                        </button>
                      )}
                      <button
                        className="cx-step-toggle"
                        onClick={() => setOpenStep(isOpen ? null : step.id)}
                      >
                        {isOpen ? (
                          <ChevronUp size={20} />
                        ) : (
                          <ChevronDown size={20} />
                        )}
                      </button>
                    </div>
                  </div>

                  {isOpen && step.id === 1 && (
                    <WhatsAppConnectCard
                      qr={whatsappSetup?.qr}
                      connected={whatsappSetup?.connected}
                      phone={whatsappSetup?.phone}
                      loading={whatsappSetup?.loading}
                      connecting={whatsappSetup?.connecting}
                      disconnecting={whatsappSetup?.disconnecting}
                      socketConnected={whatsappSetup?.socketConnected}
                      error={whatsappSetup?.error}
                      onConnect={whatsappSetup?.connect}
                      onDisconnect={whatsappSetup?.disconnect}
                      onRefreshQr={whatsappSetup?.refreshQr}
                    />
                  )}
                </article>
              );
            })}
            {launchError && (
              <div className="cx-ai-error-banner">{launchError}</div>
            )}
          </div>
        </section>

        <aside className="cx-ai-setup-sidebar">
          <div className="cx-side-card cx-progress-card">
            <h3>Overall Progress</h3>
            <div className="cx-progress-row">
              <div
                className="cx-progress-circle"
                style={{ "--progress": `${progress * 3.6}deg` }}
              >
                <span>{progress}%</span>
              </div>
              <div>
                <strong>
                  {completedSteps} of {totalSteps} steps completed
                </strong>
                <p>
                  {progress === 100 ? "Great work!" : "You’re doing great!"}
                </p>
                <p>
                  {progress === 100
                    ? "Your AI Agent is ready."
                    : "Let’s finish setting up your AI Agent."}
                </p>
              </div>
            </div>
          </div>

          <div className="cx-side-card">
            <h3>AI Setup Status</h3>
            {setupSteps.map((row) => {
              const Icon = row.icon;
              return (
                <div className="cx-status-row" key={row.id}>
                  <div className="cx-status-name">
                    <Icon className={row.accent} size={22} />
                    <span>{row.title}</span>
                  </div>
                  <div
                    className={`cx-status-value ${
                      row.complete
                        ? "success"
                        : row.locked
                          ? "locked"
                          : "pending"
                    }`}
                  >
                    {row.complete ? (
                      <CircleCheck size={15} />
                    ) : row.locked ? (
                      <Lock size={15} />
                    ) : (
                      <Clock3 size={15} />
                    )}
                    {row.status}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="cx-side-card">
            <h3 className="cx-tips-title">
              <Settings2 size={22} /> Setup Tips
            </h3>
            <div className="cx-tips-list">
              <p>
                <CheckCircle2 size={18} /> You can edit these settings anytime
              </p>
              <p>
                <CheckCircle2 size={18} /> Your progress is saved automatically
              </p>
              <p>
                <CheckCircle2 size={18} /> Most customers finish in under 5
                minutes
              </p>
              <p>
                <CheckCircle2 size={18} /> Need help? Contact our support team
              </p>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

function ChatLayout({
  user,
  message,
  setMessage,
  dashboardData,
  messages,

  sessions,
  activeSessionId,

  sessionsLoading,
  sessionLoading,
  creatingSession,

  sendingMessage,
  error,

  onSend,
  onNewChat,
  onSelectSession,
  onOpenActivity,
}) {
  const chatShortcuts = [
    {
      key: "leads",
      label: "Leads",
      icon: Users,
      prompt:
        "Give me an overview of my active leads and which ones need attention.",
    },
    {
      key: "properties",
      label: "Properties",
      icon: Home,
      prompt:
        "Give me an overview of available properties and recent buyer matches.",
    },
    {
      key: "appointments",
      label: "Appointments",
      icon: CalendarDays,
      prompt: "Show me upcoming, confirmed, and overdue appointments.",
    },
    {
      key: "pipeline",
      label: "Pipeline",
      icon: Sparkles,
      prompt: "Summarize my pipeline and highlight deals at risk.",
    },
  ];
  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) {
      return "Good morning";
    }

    if (hour < 18) {
      return "Good afternoon";
    }

    return "Good evening";
  };

  const displayName =
    user?.name ||
    user?.fullName ||
    user?.firstName ||
    user?.email?.split("@")?.[0] ||
    "there";

  const firstName = String(displayName).trim().split(/\s+/)[0] || "there";

  const fallbackPrompts = [
    {
      key: "leads_attention",
      icon: MessageSquare,
      title: "What leads need attention today?",
      prompt:
        "Show me hot, overdue, and uncontacted leads that need attention today.",
      desc: "Review hot and overdue leads.",
      accent: "purple",
    },
    {
      key: "likely_buyers",
      icon: Zap,
      title: "Which buyers are most likely to buy?",
      prompt: "Show me the buyer leads most likely to convert, with reasons.",
      desc: "Review your highest-intent buyers.",
      accent: "orange",
    },
    {
      key: "appointments_today",
      icon: CalendarDays,
      title: "What appointments are booked today?",
      prompt: "Show me today's booked and confirmed appointments.",
      desc: "Review today’s appointments.",
      accent: "blue",
    },
    {
      key: "follow_up",
      icon: MessageCircle,
      title: "Write a follow-up message",
      prompt:
        "Help me write a professional follow-up message for a lead who has not replied.",
      desc: "Create a lead follow-up message.",
      accent: "green",
    },
    {
      key: "property_match",
      icon: Home,
      title: "Find matching properties",
      prompt: "Show me recent property matches for active buyer leads.",
      desc: "Review matching properties.",
      accent: "green",
    },
    {
      key: "pipeline_summary",
      icon: FileText,
      title: "Summarize my pipeline",
      prompt:
        "Summarize my current pipeline, including risks, overdue deals, and next actions.",
      desc: "Get a quick pipeline update.",
      accent: "purple",
    },
  ];

  const apiPrompts = Array.isArray(dashboardData?.suggestedPrompts)
    ? dashboardData.suggestedPrompts
    : [];

  const prompts =
    apiPrompts.length > 0
      ? apiPrompts.map((item, index) => ({
          key: item.key || `prompt-${index}`,

          title: item.title || item.prompt || "Ask AI Agent",

          prompt: item.prompt || item.title || "",

          desc: item.description || item.desc || "",

          accent:
            item.accent || ["purple", "orange", "blue", "green"][index % 4],

          icon:
            item.type === "appointment"
              ? CalendarDays
              : item.type === "property"
                ? Home
                : item.type === "pipeline"
                  ? Sparkles
                  : item.type === "lead"
                    ? Users
                    : MessageSquare,
        }))
      : fallbackPrompts;

  return (
    <div className="cx-ai-page cx-chat-page">
      <div className="cx-ai-page-head">
        <div>
          <h1>AI Agent Chat</h1>
          <p>
            Ask anything. Your AI Agent is here to help you close more deals.
          </p>
        </div>
        <button
          type="button"
          className="cx-primary-outline"
          onClick={onNewChat}
          disabled={creatingSession}
        >
          {creatingSession ? (
            <RefreshCw size={18} className="cx-ai-loading-spinner" />
          ) : (
            <Plus size={18} />
          )}

          {creatingSession ? "Creating..." : "New Chat"}
        </button>
      </div>

      <div className="cx-chat-layout has-history">
        <aside className="cx-chat-history">
          <div className="cx-chat-history-head">
            <div>
              <h3>Chat History</h3>
              <p>Your recent AI conversations</p>
            </div>

            <button
              type="button"
              onClick={onNewChat}
              disabled={creatingSession}
              title="New Chat"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="cx-chat-history-list">
            {sessionsLoading ? (
              <div className="cx-chat-history-empty">
                <RefreshCw size={17} className="cx-ai-loading-spinner" />
                Loading chats...
              </div>
            ) : sessions?.length ? (
              sessions.map((session) => (
                <button
                  type="button"
                  key={session.id}
                  className={activeSessionId === session.id ? "active" : ""}
                  onClick={() => onSelectSession(session.id)}
                >
                  <MessageSquare size={17} />

                  <div>
                    <strong>{session.title || "New Chat"}</strong>

                    <p>{session.lastMessage || "No messages yet"}</p>
                  </div>

                  <span>{Number(session.messageCount || 0)}</span>
                </button>
              ))
            ) : (
              <div className="cx-chat-history-empty">
                <MessageSquare size={22} />

                <p>No chats yet</p>

                <button type="button" onClick={onNewChat}>
                  Start a new chat
                </button>
              </div>
            )}
          </div>
        </aside>

        <main className="cx-chat-main-card">
          <div className="cx-chat-hero">
            <div className="cx-hero-bot">
              <Bot size={44} />
            </div>
            <h2>
              {getGreeting()}, {firstName}! 👋
            </h2>
            <p>
              I’m your AI Agent. I can help you with leads, properties,
              appointments, follow-ups and more.
            </p>
            <div className="cx-chat-badges">
              <span>
                <Sparkles size={15} /> Smart
              </span>
              <span>
                <Zap size={15} /> Proactive
              </span>
              <span>
                <Heart size={15} /> Always working for you
              </span>
            </div>
          </div>

          <h3 className="cx-section-label">Try asking me something</h3>

          <div className="cx-prompt-grid">
            {prompts.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  type="button"
                  key={item.key || item.title}
                  className="cx-prompt-card"
                  disabled={sendingMessage}
                  onClick={() => onSend(item.prompt || item.title)}
                >
                  <div className="cx-promt-card-wrap">
                    <div className={`cx-small-icon ${item.accent}`}>
                      <Icon size={16} />
                    </div>
                    <strong>{item.title}</strong>
                  </div>
                  <p>{item.desc}</p>
                </button>
              );
            })}
          </div>

          <div className="cx-chat-filter-pills">
            {chatShortcuts.map((shortcut) => {
              const Icon = shortcut.icon;

              return (
                <button
                  type="button"
                  key={shortcut.key}
                  disabled={sendingMessage}
                  onClick={() => onSend(shortcut.prompt)}
                >
                  <Icon size={17} />
                  {shortcut.label}
                </button>
              );
            })}

            <button
              type="button"
              disabled={sendingMessage}
              onClick={() =>
                onSend(
                  "What other useful insights or actions can you help me with today?",
                )
              }
            >
              <ChevronDown size={17} />
              More
            </button>
          </div>

          {error && <div className="cx-ai-error-banner">{error}</div>}

          {sessionLoading ? (
            <div className="cx-chat-session-loading">
              <RefreshCw className="cx-ai-loading-spinner" size={18} />
              Loading conversation...
            </div>
          ) : messages?.length > 0 ? (
            <div className="cx-chat-message-list">
              {messages.map((item) => (
                <div
                  key={item.id}
                  className={`cx-chat-message ${item.role} ${
                    item.error ? "error" : ""
                  }`}
                >
                  {item.content}
                </div>
              ))}

              {sendingMessage && (
                <div className="cx-chat-message assistant">
                  AI Agent is thinking...
                </div>
              )}
            </div>
          ) : (
            <div className="cx-chat-empty-conversation">
              <Bot size={34} />
              <strong>Start a conversation</strong>
              <p>
                Ask your AI Agent about leads, properties, pipeline,
                appointments, or follow-ups.
              </p>
            </div>
          )}

          <div className="cx-chat-input">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
            />
            <Mic size={24} />
            <button
              onClick={() => onSend(message)}
              disabled={!message.trim() || sendingMessage}
            >
              <Send size={22} />
            </button>
          </div>

          <p className="cx-ai-note">
            AI can make mistakes. Please verify important information.
          </p>
        </main>

        <aside className="cx-right-column">
          <GlanceCard data={dashboardData?.glance} />
          <PriorityTasks
            tasks={dashboardData?.priorityTasks}
            onViewAll={() =>
              onOpenActivity?.({
                page: 1,
                type: "task",
                status: "pending",
              })
            }
          />

          <RecentActivityMini
            items={dashboardData?.recentActivity}
            onViewAll={() =>
              onOpenActivity?.({
                type: "all",
                page: 1,
              })
            }
          />
        </aside>
      </div>
    </div>
  );
}

function KnowledgeLayout({
  knowledgeData,
  filters,
  loading,
  error,
  deletingId,
  showInactiveCategories,
  onToggleInactiveCategories,
  onViewInsights,
  onAdd,
  onImport,
  onEdit,
  onDelete,
  onFilterChange,
  onQuickAction,
}) {
  const allCategories = Array.isArray(knowledgeData?.categories)
    ? knowledgeData.categories
    : [];

  const visibleCategories = showInactiveCategories
    ? allCategories
    : allCategories.filter(
        (item) => String(item.status || "").toLowerCase() !== "inactive",
      );
  return (
    <div className="cx-ai-page">
      <div className="cx-ai-page-head">
        <div>
          <h1>AI Knowledge</h1>
          <p>Manage what your AI Agent knows about your business.</p>
        </div>
        <div className="cx-head-buttons">
          <button
            type="button"
            className="cx-primary-outline"
            onClick={onImport}
          >
            <Upload size={17} />
            Import Knowledge
          </button>
          <button
            type="button"
            className="cx-primary-btn slim"
            onClick={() => onAdd()}
          >
            <Plus size={17} />
            Add Knowledge
          </button>
        </div>
      </div>

      <div className="cx-stat-grid four">
        <StatCard
          icon={BookOpen}
          title="Knowledge Items"
          value={knowledgeData?.stats?.knowledgeItems ?? 0}
          desc="Total items"
          accent="purple"
        />
        <StatCard
          icon={CircleCheck}
          title="Active Items"
          value={knowledgeData?.stats?.activeItems ?? 0}
          desc="Currently in use"
          accent="green"
        />
        <StatCard
          icon={Database}
          title="Data Sources"
          value={knowledgeData?.stats?.dataSources ?? 0}
          desc="Connected sources"
          accent="blue"
        />
        <StatCard
          icon={Sparkles}
          title="Last Updated"
          value={knowledgeData?.stats?.lastUpdatedLabel || "Never"}
          desc={knowledgeData?.stats?.lastUpdatedDate || "No updates yet"}
          accent="orange"
        />
      </div>

      <div className="cx-two-col">
        <main className="cx-white-card">
          <h2>Knowledge Categories</h2>
          <p>Organize and manage what your AI knows.</p>

          <div className="cx-category-list">
            {(visibleCategories.length
              ? visibleCategories
              : [
                  {
                    key: "company_information",
                    title: "Company Information",
                    description:
                      "Your company details, mission, values and offices",
                    items: 0,
                    status: "Empty",
                    accent: "purple",
                  },
                  {
                    key: "office_hours",
                    title: "Office Hours & Availability",
                    description:
                      "Business hours, holidays and availability rules",
                    items: 0,
                    status: "Empty",
                    accent: "green",
                  },
                  {
                    key: "service_areas",
                    title: "Service Areas",
                    description:
                      "Areas, neighborhoods and coverage information",
                    items: 0,
                    status: "Empty",
                    accent: "blue",
                  },
                  {
                    key: "property_knowledge",
                    title: "Property Knowledge",
                    description:
                      "Property types, features and market expertise",
                    items: 0,
                    status: "Empty",
                    accent: "orange",
                  },
                  {
                    key: "sales_scripts",
                    title: "Sales Scripts & Templates",
                    description:
                      "Scripts, email templates and messaging guides",
                    items: 0,
                    status: "Empty",
                    accent: "purple",
                  },
                  {
                    key: "financing_partners",
                    title: "Financing & Partners",
                    description: "Lenders, partners and financing information",
                    items: 0,
                    status: "Empty",
                    accent: "green",
                  },
                  {
                    key: "faqs",
                    title: "FAQs",
                    description: "Frequently asked questions and answers",
                    items: 0,
                    status: "Empty",
                    accent: "blue",
                  },
                  {
                    key: "policies_processes",
                    title: "Policies & Processes",
                    description: "Business policies and internal processes",
                    items: 0,
                    status: "Empty",
                    accent: "purple",
                  },
                ]
            ).map((item) => {
              const Icon =
                item.key === "company_information"
                  ? Building2
                  : item.key === "office_hours"
                    ? Clock3
                    : item.key === "service_areas"
                      ? Home
                      : item.key === "property_knowledge"
                        ? Home
                        : item.key === "sales_scripts"
                          ? MessageCircle
                          : item.key === "financing_partners"
                            ? Database
                            : item.key === "faqs"
                              ? HelpCircle
                              : FileText;

              return (
                <div
                  type="button"
                  className={`cx-category-row ${
                    filters?.category === item.key ? "active" : ""
                  }`}
                  key={item.key}
                  onClick={() =>
                    onFilterChange({
                      category: item.key,
                    })
                  }
                >
                  <div className={`cx-small-icon ${item.accent || "purple"}`}>
                    <Icon size={22} />
                  </div>

                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                  </div>

                  <span>{Number(item.items || 0)} items</span>

                  <em
                    className={String(item.status || "")
                      .toLowerCase()
                      .replace(/\s+/g, "-")}
                  >
                    {item.status || "Empty"}
                  </em>

                  <ChevronRight size={18} />
                </div>
              );
            })}
          </div>

          <div className="cx-knowledge-toolbar">
            <input
              className="cx-knowledge-search"
              value={filters?.search || ""}
              onChange={(event) =>
                onFilterChange({
                  search: event.target.value,
                })
              }
              placeholder="Search knowledge..."
            />

            <select
              value={filters?.category || "all"}
              onChange={(event) =>
                onFilterChange({
                  category: event.target.value,
                })
              }
            >
              <option value="all">All categories</option>

              {(knowledgeData?.categories || []).map((category) => (
                <option key={category.key} value={category.key}>
                  {category.title}
                </option>
              ))}
            </select>

            <select
              value={filters?.status || "all"}
              onChange={(event) =>
                onFilterChange({
                  status: event.target.value,
                })
              }
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="needs_review">Needs Review</option>
            </select>
          </div>

          {error && <div className="cx-ai-error-banner">{error}</div>}

          <div className="cx-knowledge-item-list">
            {loading ? (
              <div className="cx-knowledge-empty">
                <RefreshCw className="cx-ai-loading-spinner" size={20} />
                Loading knowledge...
              </div>
            ) : knowledgeData?.items?.length ? (
              knowledgeData.items.map((item) => (
                <div className="cx-knowledge-item-row" key={item.id}>
                  <div className="cx-knowledge-item-icon">
                    <BookOpen size={19} />
                  </div>

                  <div className="cx-knowledge-item-copy">
                    <strong>{item.title}</strong>

                    <p>{item.preview}</p>

                    <div className="cx-knowledge-item-meta">
                      <span>{item.categoryTitle}</span>

                      <span>{item.sourceType}</span>

                      <span className={item.status}>
                        {item.status === "needs_review"
                          ? "Needs Review"
                          : item.status === "active"
                            ? "Active"
                            : "Inactive"}
                      </span>

                      <span>Priority {item.priority}</span>
                    </div>
                  </div>

                  <div className="cx-knowledge-item-actions">
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      title="Edit"
                    >
                      <PenLine size={16} />
                    </button>

                    <button
                      type="button"
                      className="danger"
                      disabled={deletingId === item.id}
                      onClick={() => onDelete(item)}
                      title="Delete"
                    >
                      {deletingId === item.id ? (
                        <RefreshCw
                          className="cx-ai-loading-spinner"
                          size={16}
                        />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="cx-knowledge-empty">
                <BookOpen size={28} />

                <strong>No knowledge items found</strong>

                <p>
                  Add your first knowledge item so your AI Agent can use it.
                </p>

                <button
                  type="button"
                  className="cx-primary-btn slim"
                  onClick={() =>
                    onAdd(
                      filters?.category !== "all"
                        ? filters.category
                        : "company_information",
                    )
                  }
                >
                  <Plus size={16} />
                  Add Knowledge
                </button>
              </div>
            )}
          </div>
          {Number(knowledgeData?.totalPages || 1) > 1 && (
            <div className="cx-knowledge-pagination">
              <button
                type="button"
                disabled={Number(knowledgeData?.page || 1) <= 1}
                onClick={() =>
                  onFilterChange({
                    page: Number(knowledgeData.page) - 1,
                  })
                }
              >
                Previous
              </button>

              <button type="button" disabled>
                {knowledgeData.page} / {knowledgeData.totalPages}
              </button>

              <button
                type="button"
                disabled={
                  Number(knowledgeData?.page || 1) >=
                  Number(knowledgeData?.totalPages || 1)
                }
                onClick={() =>
                  onFilterChange({
                    page: Number(knowledgeData.page) + 1,
                  })
                }
              >
                Next
              </button>
            </div>
          )}
          <button
            type="button"
            className="cx-show-more"
            onClick={onToggleInactiveCategories}
          >
            {showInactiveCategories
              ? "Hide inactive categories"
              : "Show inactive categories"}

            {showInactiveCategories ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </button>
        </main>

        <aside className="cx-right-column">
          <div className="cx-white-card cx-knowledge-health-card">
            <h2>Knowledge Health</h2>
            {(() => {
              const score = Math.max(
                0,
                Math.min(100, Number(knowledgeData?.health?.score || 0)),
              );
              const total = Number(knowledgeData?.health?.total || 0);
              const complete = Number(knowledgeData?.health?.complete || 0);
              const upToDate = Number(knowledgeData?.health?.upToDate || 0);
              const wellStructured = Number(
                knowledgeData?.health?.wellStructured || 0,
              );
              const needsReview = Number(
                knowledgeData?.health?.needsReview || 0,
              );
              const radius = 48;
              const circumference = 2 * Math.PI * radius;
              const progressOffset =
                circumference - (score / 100) * circumference;

              return (
                <>
                  <div className="cx-knowledge-health-content">
                    <div className="cx-knowledge-score-wrap">
                      <div className="cx-knowledge-score-ring">
                        <svg
                          viewBox="0 0 120 120"
                          aria-label={`Knowledge score ${score}%`}
                        >
                          <circle
                            className="cx-knowledge-score-track"
                            cx="60"
                            cy="60"
                            r={radius}
                          />

                          <circle
                            className="cx-knowledge-score-progress"
                            cx="60"
                            cy="60"
                            r={radius}
                            strokeDasharray={circumference}
                            strokeDashoffset={progressOffset}
                          />
                        </svg>

                        <strong>{score}%</strong>
                      </div>

                      <p className="cx-knowledge-score-label">
                        Knowledge Score
                        <HelpCircle size={13} />
                      </p>
                    </div>

                    <div className="cx-knowledge-health-list">
                      <div>
                        <CheckCircle2 size={16} />

                        <span>Complete</span>

                        <strong>
                          {complete} / {total}
                        </strong>
                      </div>

                      <div>
                        <CheckCircle2 size={16} />

                        <span>Up to date</span>

                        <strong>
                          {upToDate} / {total}
                        </strong>
                      </div>

                      <div>
                        <CheckCircle2 size={16} />

                        <span>Well structured</span>

                        <strong>
                          {wellStructured} / {total}
                        </strong>
                      </div>

                      <div className="warning">
                        <Clock3 size={16} />

                        <span>Needs review</span>

                        <strong>
                          {needsReview} / {total}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/*<button
                    type="button"
                    className="cx-full-btn"
                    onClick={onViewInsights}
                  >
                    View Knowledge Insights
                    <Activity size={16} />
                  </button>*/}
                </>
              );
            })()}
          </div>

          <div className="cx-white-card">
            <h2>Quick Actions</h2>

            {[
              {
                key: "text",
                title: "Add Text Knowledge",
                description: "Add text, notes or business information",
                icon: FileText,
                accent: "purple",
              },
              {
                key: "document",
                title: "Upload Document",
                description: "Import CSV or JSON knowledge files",
                icon: Upload,
                accent: "blue",
              },
              {
                key: "website",
                title: "Add Website URL",
                description: "Add content and reference a website",
                icon: Search,
                accent: "indigo",
              },
              {
                key: "data_source",
                title: "Connect Data Source",
                description: "Import knowledge from an external source",
                icon: Database,
                accent: "purple",
              },
              {
                key: "qa",
                title: "Create Custom Q&A",
                description: "Add a question and answer pair",
                icon: MessageCircle,
                accent: "violet",
              },
            ].map((action) => {
              const Icon = action.icon;

              return (
                <button
                  type="button"
                  className="cx-quick-row"
                  key={action.key}
                  onClick={() => onQuickAction?.(action.key)}
                >
                  <span className={`cx-quick-action-icon ${action.accent}`}>
                    <Icon size={18} />
                  </span>

                  <div>
                    <strong>{action.title}</strong>
                    <p>{action.description}</p>
                  </div>

                  <ChevronRight size={17} />
                </button>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}

function ActivityLayout({
  activityData,
  loading,
  error,
  filters,
  exporting,
  onExport,
  onFilterChange,
  onPageChange,
  onRefresh,
  onOpen,
  onViewActivityTypes,
  onViewTopActions,
  onViewRecentRuns,
}) {
  const items = Array.isArray(activityData?.items) ? activityData.items : [];
  const activityByType = Array.isArray(activityData?.activityByType)
    ? activityData.activityByType
    : [];
  const topActions = Array.isArray(activityData?.topActions)
    ? activityData.topActions
    : [];
  const currentPage = Number(activityData?.page || filters?.page || 1);
  const totalPages = Number(activityData?.totalPages || 1);
  const totalItems = Number(activityData?.total || 0);
  const limit = Number(activityData?.limit || filters?.limit || 20);
  const startItem = totalItems > 0 ? (currentPage - 1) * limit + 1 : 0;
  const endItem = Math.min(currentPage * limit, totalItems);
  const getVisiblePages = () => {
    if (totalPages <= 7) {
      return Array.from(
        {
          length: totalPages,
        },
        (_, index) => index + 1,
      );
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "ellipsis-right", totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [
        1,
        "ellipsis-left",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      1,
      "ellipsis-left",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "ellipsis-right",
      totalPages,
    ];
  };

  const visiblePages = getVisiblePages();
  const apiRows = (activityData?.items || []).map((item) => [
    item.timeLabel || "",
    item.title || "AI Activity",
    item.description || "",
    item.iconKey === "appointment"
      ? CalendarDays
      : item.iconKey === "property"
        ? Home
        : item.iconKey === "alert"
          ? TriangleAlert
          : item.iconKey === "data"
            ? Database
            : MessageCircle,
    item.statusLabel || "Completed",
    item.leadName || "",
  ]);

  const displayRows = apiRows.length ? apiRows : items;
  const overview = activityData?.overview || {};
  const activityTypesData = activityByType;
  const topActionsData = topActions;

  const recentRunsData = Array.isArray(activityData?.recentRuns)
    ? activityData.recentRuns
    : Array.isArray(activityData?.recentAiRuns)
      ? activityData.recentAiRuns
      : [];
  const getRecentRunIcon = (item = {}) => {
    const value = String(
      item.type || item.action || item.title || "",
    ).toLowerCase();

    if (value.includes("property")) {
      return Home;
    }

    if (value.includes("appointment")) {
      return CalendarDays;
    }

    if (value.includes("lead")) {
      return UserRoundCheck;
    }

    if (value.includes("knowledge")) {
      return BookOpen;
    }

    if (
      value.includes("message") ||
      value.includes("reply") ||
      value.includes("follow")
    ) {
      return Send;
    }

    return Sparkles;
  };
  const getActivityTypeIcon = (label = "") => {
    const normalized = String(label).trim().toLowerCase();

    if (normalized.includes("appointment")) {
      return CalendarDays;
    }

    if (normalized.includes("lead")) {
      return UserRoundCheck;
    }

    if (normalized.includes("property")) {
      return Home;
    }

    if (normalized.includes("data")) {
      return Database;
    }

    if (normalized.includes("alert")) {
      return TriangleAlert;
    }

    if (normalized.includes("message")) {
      return MessageCircle;
    }

    return MoreHorizontal;
  };

  const getTopActionIcon = (title = "") => {
    const normalized = String(title).trim().toLowerCase();

    if (
      normalized.includes("qualification") ||
      normalized.includes("qualified")
    ) {
      return UserRoundCheck;
    }

    if (normalized.includes("appointment") || normalized.includes("book")) {
      return CalendarDays;
    }

    if (normalized.includes("property")) {
      return Home;
    }

    if (
      normalized.includes("follow-up") ||
      normalized.includes("follow up") ||
      normalized.includes("sent")
    ) {
      return Send;
    }

    if (
      normalized.includes("reply") ||
      normalized.includes("message") ||
      normalized.includes("chat")
    ) {
      return MessageCircle;
    }

    if (normalized.includes("score")) {
      return Star;
    }

    return Sparkles;
  };
  return (
    <div className="cx-ai-page">
      <div className="cx-ai-page-head">
        <div>
          <h1>Activity</h1>
          <p>See everything your AI Agent has done across your business.</p>
        </div>
        <button
          type="button"
          className="cx-primary-outline"
          disabled={exporting}
          onClick={onExport}
        >
          {exporting ? (
            <RefreshCw size={17} className="cx-ai-loading-spinner" />
          ) : (
            <Upload size={17} />
          )}

          {exporting ? "Exporting..." : "Export Activity"}
        </button>
      </div>

      <div className="cx-activity-layout">
        <main>
          <div className="cx-activity-filters">
            <select
              value={filters?.type || "all"}
              onChange={(event) =>
                onFilterChange({
                  type: event.target.value,
                })
              }
            >
              <option value="all">All Types</option>
              <option value="conversation">Conversations</option>
              <option value="knowledge">Knowledge</option>
              <option value="appointment">Appointments</option>
              <option value="automation">Automations</option>
              <option value="lead">Lead Updates</option>
              <option value="property">Property Updates</option>
              <option value="alert">Alerts</option>
            </select>

            <select
              value={filters?.status || "all"}
              onChange={(event) =>
                onFilterChange({
                  status: event.target.value,
                })
              }
            >
              <option value="all">All Statuses</option>
              <option value="success">Completed</option>
              <option value="failed">Failed</option>
              <option value="escalated">Escalated</option>
              <option value="pending">Pending</option>
            </select>

            <label className="cx-activity-search">
              <Search size={17} />
              <input
                value={filters?.search || ""}
                placeholder="Search activity..."
                onChange={(event) =>
                  onFilterChange({
                    search: event.target.value,
                  })
                }
              />
            </label>

            <button type="button" onClick={onRefresh} disabled={loading}>
              <RefreshCw
                size={17}
                className={loading ? "cx-ai-loading-spinner" : ""}
              />
              Refresh
            </button>
          </div>

          <div className="cx-white-card cx-timeline-card">
            <h4>Recent AI Activity</h4>
            {error && <div className="cx-ai-error-banner">{error}</div>}
            {loading && items.length === 0 ? (
              <div className="cx-activity-empty">
                <RefreshCw className="cx-ai-loading-spinner" size={20} />
                Loading activity...
              </div>
            ) : items.length > 0 ? (
              items.map((item, index) => {
                const iconKey = String(
                  item?.iconKey || item?.type || item?.action || "",
                ).toLowerCase();
                const Icon = iconKey.includes("appointment")
                  ? CalendarDays
                  : iconKey.includes("property")
                    ? Home
                    : iconKey.includes("knowledge")
                      ? BookOpen
                      : iconKey.includes("alert")
                        ? TriangleAlert
                        : iconKey.includes("lead")
                          ? UserRoundCheck
                          : iconKey.includes("data")
                            ? Database
                            : iconKey.includes("message") ||
                                iconKey.includes("conversation")
                              ? MessageCircle
                              : Sparkles;

                const status = String(
                  item?.status || item?.outcome || "success",
                ).toLowerCase();

                return (
                  <div
                    type="button"
                    className="cx-activity-row"
                    key={item.id || `${item.title}-${item.createdAt}-${index}`}
                    onClick={() => onOpen?.(item)}
                  >
                    <time>
                      {item.timeLabel || formatRelativeTime(item.createdAt)}
                    </time>
                    <div className="cx-line-dot" />
                    <div className={`cx-small-icon ${item.accent || "purple"}`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <strong>{item.title || "AI Activity"}</strong>
                      <p>
                        {item.description ||
                          item.summary ||
                          "AI Agent activity recorded."}
                      </p>
                    </div>
                    <span
                      className={`cx-activity-status cx-status-pill ${status}`}
                    >
                      {item.statusLabel ||
                        (status === "success" ? "Completed" : status)}
                    </span>
                    <ChevronRight size={17} />
                  </div>
                );
              })
            ) : (
              <div className="cx-activity-empty">
                <Activity size={28} />
                <strong>No activity found</strong>
                <p>Try changing the filters or search.</p>
              </div>
            )}
            {totalPages > 1 && (
              <div className="cx-activity-pagination cx-pagination">
                <div className="cx-activity-pagination-info">
                  Showing {startItem}–{endItem} of {totalItems} activities
                </div>

                <div className="cx-activity-pagination-controls">
                  <button
                    type="button"
                    disabled={loading || currentPage <= 1}
                    onClick={() => onPageChange(currentPage - 1)}
                  >
                    ‹
                  </button>

                  {visiblePages.map((page, index) => {
                    if (typeof page !== "number") {
                      return (
                        <span
                          key={`${page}-${index}`}
                          className="cx-pagination-ellipsis"
                        >
                          ...
                        </span>
                      );
                    }

                    return (
                      <button
                        type="button"
                        key={page}
                        className={page === currentPage ? "active" : ""}
                        disabled={loading}
                        onClick={() => onPageChange(page)}
                      >
                        {page}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    disabled={loading || currentPage >= totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                  >
                    ›
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>

        <aside className="cx-right-column">
          <div className="cx-white-card">
            <h2>Activity Overview</h2>
            <div className="cx-overview-grid">
              <StatMini
                icon={Activity}
                title="Total Activities"
                value={overview.total ?? activityData?.total ?? 0}
                desc={overview.trendLabel || "Current period"}
              />
              <StatMini
                icon={CircleCheck}
                title="Completed"
                value={overview.completed ?? 0}
                desc={overview.completedPercentLabel || "0%"}
              />
              <StatMini
                icon={TriangleAlert}
                title="Escalated"
                value={overview.escalated ?? 0}
                desc={overview.escalatedPercentLabel || "0%"}
              />
              <StatMini
                icon={CircleX}
                title="Failed"
                value={overview.failed ?? 0}
                desc={overview.failedPercentLabel || "0%"}
              />
            </div>
          </div>

          <div className="cx-white-card">
            <h2>
              Activity by Type
              <button type="button" onClick={onViewActivityTypes}>
                View all
              </button>
            </h2>
            {activityTypesData.slice(0, 6).map((item, index) => {
              const Icon = item.icon || getActivityTypeIcon(item.label);

              return (
                <div
                  className="cx-bar-row has-icon"
                  key={`${item.label}-${index}`}
                >
                  <div className={`cx-bar-icon ${item.accent || "purple"}`}>
                    <Icon size={14} />
                  </div>

                  <span>{item.label}</span>

                  <div className="cx-bar-track">
                    <i
                      className={item.accent || "purple"}
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(0, Number(item.percent || 0)),
                        )}%`,
                      }}
                    />
                  </div>

                  <strong>{item.value ?? item.total ?? 0}</strong>
                </div>
              );
            })}
          </div>

          <div className="cx-white-card">
            <h2>
              Top Actions
              <button type="button" onClick={onViewTopActions}>
                View all
              </button>
            </h2>

            <div className="cx-top-actions-list">
              {topActionsData.slice(0, 5).map((item, index) => {
                const Icon = item.icon || getTopActionIcon(item.title);

                return (
                  <div
                    className="cx-top-action-row"
                    key={`${item.title}-${index}`}
                  >
                    <div className={`cx-bar-icon ${item.accent || "purple"}`}>
                      <Icon size={15} />
                    </div>

                    <span>{item.title}</span>

                    <strong>{Number(item.total || item.count || 0)}</strong>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="cx-white-card">
            <h2>
              Recent AI Runs
              <button
                type="button"
                onClick={onViewRecentRuns}
                disabled={recentRunsData.length === 0}
              >
                View all
              </button>
            </h2>

            {recentRunsData.length > 0 ? (
              recentRunsData.slice(0, 4).map((item, index) => {
                const Icon = getRecentRunIcon(item);

                const status = String(
                  item.status || item.outcome || "success",
                ).toLowerCase();

                return (
                  <button
                    type="button"
                    className="cx-run-row"
                    key={item.id || `${item.title}-${index}`}
                    onClick={() => item.id && onOpen?.(item)}
                  >
                    <Icon size={18} />

                    <div>
                      <strong>
                        {item.title || item.actionLabel || "AI Run"}
                      </strong>

                      <p>
                        {item.timeLabel ||
                          formatRelativeTime(item.createdAt || item.created_at)}
                      </p>
                    </div>

                    <em
                      className={
                        status === "failed" || status === "error"
                          ? "danger"
                          : status === "escalated"
                            ? "warning"
                            : ""
                      }
                    >
                      {item.statusLabel ||
                        (status === "success" ? "Completed" : status)}
                    </em>
                  </button>
                );
              })
            ) : (
              <div className="cx-mini-empty">
                <Sparkles size={22} />

                <p>No recent AI runs.</p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function ActivityDetailDrawer({ open, loading, activity, onClose }) {
  if (!open) {
    return null;
  }

  const data = activity || {};
  const metadata =
    data?.metadata && typeof data.metadata === "object" ? data.metadata : {};
  const status = String(data.status || data.outcome || "success").toLowerCase();
  const title =
    data.title ||
    metadata.title ||
    data.actionLabel ||
    data.action ||
    "AI Activity";

  const description =
    data.description ||
    data.summary ||
    metadata.description ||
    metadata.summary ||
    "";

  const prompt =
    data.prompt ||
    metadata.prompt ||
    metadata.userMessage ||
    metadata.user_message ||
    "";

  const response =
    data.response ||
    data.aiResponse ||
    metadata.response ||
    metadata.aiResponse ||
    metadata.answer ||
    "";

  const createdAt =
    data.createdAt || data.created_at || metadata.createdAt || null;
  const copyText = async (value) => {
    const text = String(value || "");
    if (!text) {
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error("COPY ACTIVITY TEXT FAILED:", error);
    }
  };

  const detailRows = [
    {
      label: "Activity ID",
      value: data.id,
    },
    {
      label: "Action",
      value: data.action || metadata.action,
    },
    {
      label: "Type",
      value: data.type || data.iconKey || metadata.type || metadata.category,
    },
    {
      label: "Channel",
      value: data.channel || metadata.channel,
    },
    {
      label: "Created",
      value: createdAt ? new Date(createdAt).toLocaleString() : "",
    },
    {
      label: "Execution time",
      value:
        data.executionTimeMs ?? metadata.executionTimeMs ?? metadata.durationMs,
      suffix: " ms",
    },
    {
      label: "Tokens",
      value: data.tokens ?? metadata.tokens ?? metadata.totalTokens,
    },
    {
      label: "Confidence",
      value: data.confidence ?? metadata.confidence ?? metadata.confidenceScore,
      suffix:
        Number(
          data.confidence ?? metadata.confidence ?? metadata.confidenceScore,
        ) <= 1
          ? "%"
          : "",
      transform: (value) => {
        const number = Number(value);

        if (Number.isNaN(number)) {
          return value;
        }

        return number <= 1 ? Math.round(number * 100) : number;
      },
    },
  ].filter(
    (row) => row.value !== undefined && row.value !== null && row.value !== "",
  );

  const relatedRows = [
    {
      label: "Lead",
      value: data.leadName || metadata.leadName || metadata.lead_name,
    },
    {
      label: "Contact",
      value: data.contactName || metadata.contactName || metadata.contact_name,
    },
    {
      label: "Property",
      value:
        data.propertyTitle ||
        metadata.propertyTitle ||
        metadata.property_title ||
        metadata.propertyAddress,
    },
    {
      label: "Appointment",
      value:
        data.appointmentTitle ||
        metadata.appointmentTitle ||
        metadata.appointment_title,
    },
    {
      label: "Conversation",
      value:
        data.conversationId || metadata.conversationId || metadata.sessionId,
    },
  ].filter(
    (row) => row.value !== undefined && row.value !== null && row.value !== "",
  );

  return (
    <div className="cx-activity-drawer-backdrop" onMouseDown={onClose}>
      <aside
        className="cx-activity-detail-drawer"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="cx-activity-drawer-head">
          <div>
            <span>
              <Activity size={21} />
            </span>
            <div>
              <p>AI Activity</p>
              <h2>{title}</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close activity details"
          >
            <X size={20} />
          </button>
        </header>

        {loading ? (
          <div className="cx-activity-drawer-loading">
            <RefreshCw className="cx-ai-loading-spinner" size={22} />
            Loading activity details...
          </div>
        ) : (
          <div className="cx-activity-drawer-body">
            <div className="cx-activity-detail-status">
              <span className={`cx-activity-status ${status}`}>
                {data.statusLabel ||
                  (status === "success" ? "Completed" : status)}
              </span>

              {createdAt && <time>{new Date(createdAt).toLocaleString()}</time>}
            </div>

            {description && (
              <section className="cx-activity-detail-section">
                <h3>Summary</h3>

                <p>{description}</p>
              </section>
            )}

            {detailRows.length > 0 && (
              <section className="cx-activity-detail-section">
                <h3>Execution Details</h3>

                <div className="cx-activity-detail-grid">
                  {detailRows.map((row) => {
                    const value = row.transform
                      ? row.transform(row.value)
                      : row.value;

                    return (
                      <div key={row.label}>
                        <span>{row.label}</span>

                        <strong>
                          {value}
                          {row.suffix || ""}
                        </strong>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {prompt && (
              <section className="cx-activity-detail-section">
                <div className="cx-activity-detail-title-row">
                  <h3>Prompt</h3>

                  <button type="button" onClick={() => copyText(prompt)}>
                    <Copy size={15} />
                    Copy
                  </button>
                </div>

                <div className="cx-activity-text-box">{prompt}</div>
              </section>
            )}

            {response && (
              <section className="cx-activity-detail-section">
                <div className="cx-activity-detail-title-row">
                  <h3>AI Response</h3>

                  <button type="button" onClick={() => copyText(response)}>
                    <Copy size={15} />
                    Copy
                  </button>
                </div>

                <div className="cx-activity-text-box response">{response}</div>
              </section>
            )}

            {relatedRows.length > 0 && (
              <section className="cx-activity-detail-section">
                <h3>Related Records</h3>

                <div className="cx-activity-related-list">
                  {relatedRows.map((row) => (
                    <div key={row.label}>
                      <span>{row.label}</span>

                      <strong>{row.value}</strong>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {Object.keys(metadata).length > 0 && (
              <details className="cx-activity-metadata">
                <summary>Raw Metadata</summary>

                <pre>{JSON.stringify(metadata, null, 2)}</pre>
              </details>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
function ActivitySummaryModal({
  open,
  title,
  type,
  items,
  onClose,
  onOpenActivity,
}) {
  if (!open) {
    return null;
  }

  const rows = Array.isArray(items) ? items : [];

  const getIcon = (item = {}) => {
    const value = String(
      item.label || item.title || item.type || item.action || "",
    ).toLowerCase();

    if (value.includes("appointment")) {
      return CalendarDays;
    }

    if (value.includes("property")) {
      return Home;
    }

    if (value.includes("lead")) {
      return UserRoundCheck;
    }

    if (value.includes("knowledge")) {
      return BookOpen;
    }

    if (value.includes("message") || value.includes("reply")) {
      return MessageCircle;
    }

    if (value.includes("alert")) {
      return TriangleAlert;
    }

    return Sparkles;
  };

  return (
    <div className="cx-activity-summary-backdrop" onMouseDown={onClose}>
      <div
        className="cx-activity-summary-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <span>
              <Activity size={21} />
            </span>

            <div>
              <h2>{title || "Activity Summary"}</h2>

              <p>
                {rows.length} item
                {rows.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <button type="button" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <div className="cx-activity-summary-list">
          {rows.length > 0 ? (
            rows.map((item, index) => {
              const Icon = getIcon(item);

              const clickable = Boolean(item?.id);

              return (
                <button
                  type="button"
                  key={item.id || `${item.label || item.title}-${index}`}
                  className={clickable ? "" : "not-clickable"}
                  onClick={() => {
                    if (clickable) {
                      onOpenActivity?.(item);
                    }
                  }}
                >
                  <div className={`cx-bar-icon ${item.accent || "purple"}`}>
                    <Icon size={16} />
                  </div>

                  <div>
                    <strong>{item.title || item.label || "AI Activity"}</strong>

                    <p>
                      {type === "activity_types"
                        ? `${Number(item.percent || 0)}% of activity`
                        : item.description ||
                          item.timeLabel ||
                          formatRelativeTime(
                            item.createdAt || item.created_at,
                          ) ||
                          ""}
                    </p>
                  </div>

                  <span>{item.value ?? item.total ?? item.count ?? ""}</span>

                  {clickable && <ChevronRight size={17} />}
                </button>
              );
            })
          ) : (
            <div className="cx-activity-summary-empty">
              <Activity size={28} />

              <strong>No data available</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
function ControlsLayout({ controlTab, setControlTab, controlsData, onSave }) {
  const tabs = [
    "General",
    "Lead Handling",
    "Communication",
    "Escalation",
    "Privacy & Safety",
    "Advanced",
  ];
  const capabilities = [
    [
      "Auto Reply to Leads",
      "Automatically respond to new leads via WhatsApp, SMS, and email",
      MessageCircle,
      true,
    ],
    [
      "Lead Qualification",
      "Qualify leads and score their interest automatically",
      Users,
      true,
    ],
    [
      "Appointment Booking",
      "Book and manage appointments automatically",
      CalendarDays,
      true,
    ],
    [
      "Property Recommendations",
      "Suggest properties based on buyer preferences",
      Home,
      true,
    ],
    [
      "Follow-up Automation",
      "Send follow-up messages and reminders",
      Send,
      true,
    ],
    [
      "Lead Scoring",
      "Score leads based on engagement and behavior",
      Star,
      true,
    ],
    [
      "Human Approval for High Value",
      "Require approval before sending high-value proposals",
      ShieldCheck,
      true,
    ],
    [
      "Auto Escalation for Hot Leads",
      "Automatically escalate hot leads to you or your team",
      Bell,
      true,
    ],
    [
      "Marketing Campaigns",
      "Create and send marketing campaigns",
      Sparkles,
      false,
    ],
    [
      "Smart Insights & Alerts",
      "Generate insights and important alerts",
      Bell,
      true,
    ],
  ];

  const capabilityState = controlsData?.capabilities || {};
  const quickControlState = controlsData?.quickControls || {};
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (controlsData) setDraft(controlsData);
  }, [controlsData]);

  const current = draft || controlsData || {};

  const toggleCapability = (key) => {
    setDraft((previous) => ({
      ...(previous || controlsData || {}),
      capabilities: {
        ...((previous || controlsData || {}).capabilities || {}),
        [key]: !Boolean(
          ((previous || controlsData || {}).capabilities || {})[key],
        ),
      },
    }));
  };

  const toggleQuickControl = (key) => {
    setDraft((previous) => ({
      ...(previous || controlsData || {}),
      quickControls: {
        ...((previous || controlsData || {}).quickControls || {}),
        [key]: !Boolean(
          ((previous || controlsData || {}).quickControls || {})[key],
        ),
      },
    }));
  };

  const handleSave = async () => {
    if (!current || saving) return;

    setSaving(true);
    try {
      const saved = await onSave({
        responseTone: current.responseTone,
        capabilities: current.capabilities,
        quickControls: current.quickControls,
      });
      setDraft(saved);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cx-ai-page">
      <div className="cx-ai-page-head">
        <div>
          <h1>Controls</h1>
          <p>
            Manage your AI Agent’s behavior, preferences, and automation
            settings.
          </p>
        </div>
        <button
          className="cx-primary-btn slim"
          onClick={handleSave}
          disabled={saving}
        >
          <Save size={16} /> {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="cx-control-tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={controlTab === tab ? "active" : ""}
            onClick={() => setControlTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="cx-two-col">
        <main>
          <div className="cx-white-card">
            <h2>AI Agent Capabilities</h2>
            <p>Enable or disable features your AI Agent can perform.</p>

            <div className="cx-capability-list">
              {capabilities.map(([title, desc, Icon, enabled], index) => {
                const capabilityKeys = [
                  "autoReplyToLeads",
                  "leadQualification",
                  "appointmentBooking",
                  "propertyRecommendations",
                  "followUpAutomation",
                  "leadScoring",
                  "humanApprovalHighValue",
                  "autoEscalationHotLeads",
                  "marketingCampaigns",
                  "smartInsights",
                ];
                const key = capabilityKeys[index];
                const isEnabled = current?.capabilities?.[key] ?? enabled;

                return (
                  <div className="cx-capability-row" key={title}>
                    <div
                      className={`cx-small-icon ${index % 4 === 0 ? "green" : index % 4 === 1 ? "purple" : index % 4 === 2 ? "orange" : "blue"}`}
                    >
                      <Icon size={21} />
                    </div>
                    <div>
                      <strong>{title}</strong>
                      <p>{desc}</p>
                    </div>
                    <button
                      className={`cx-switch ${isEnabled ? "on" : ""}`}
                      onClick={() => toggleCapability(key)}
                    >
                      <i />
                    </button>
                    <ChevronRight size={18} />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="cx-white-card cx-behavior-summary">
            <div className="flex">
              <div>
                <h2>AI Behavior Summary</h2>
                <p>
                  Your AI Agent is set to be proactive, helpful, and always put
                  your leads first.
                </p>
              </div>
              <button className="cx-primary-outline">
                <PenLine size={16} /> Edit Behavior
              </button>
            </div>
            <div>
              {[
                "Proactive",
                "Helpful",
                "Fast Response",
                "Human-like",
                "Lead-focused",
              ].map((x) => (
                <span key={x}>
                  <Check size={14} /> {x}
                </span>
              ))}
            </div>
          </div>
        </main>

        <aside className="cx-right-column control">
          <div className="cx-white-card">
            <h2>
              AI Agent Status <em>Active</em>
            </h2>
            <div className="cx-overview-grid">
              <StatMini
                title="Responses Today"
                value={current?.metrics?.responsesToday ?? 0}
                desc="Today"
              />

              <StatMini
                title="Appointments Booked"
                value={current?.metrics?.appointmentsBooked ?? 0}
                desc="Today"
              />

              <StatMini
                title="Leads Handled"
                value={current?.metrics?.leadsHandled ?? 0}
                desc="Today"
              />

              <StatMini
                title="Avg. Response Time"
                value={current?.metrics?.avgResponseTime || "—"}
                desc="Current average"
              />
            </div>
          </div>

          <div className="cx-white-card">
            <h2>Response Tone</h2>
            <p>How your AI Agent communicates</p>
            <button className="cx-select-btn">
              {current?.responseToneLabel || "Professional & Friendly"}{" "}
              <ChevronDown size={18} />
            </button>
          </div>

          <div className="cx-white-card">
            <h2>Quick Controls</h2>
            {[
              {
                key: "pauseAiAgent",
                title: "Pause AI Agent",
                desc: "Temporarily pause all AI actions",
                icon: PauseCircle,
                accent: "red",
              },
              {
                key: "doNotDisturb",
                title: "Do Not Disturb",
                desc: "Silence notifications after hours",
                icon: Moon,
                accent: "blue",
              },
              {
                key: "workingHoursOnly",
                title: "Working Hours Only",
                desc: "9:00 AM - 6:00 PM (Mon - Fri)",
                icon: Timer,
                accent: "green",
              },
              {
                key: "weekendsActive",
                title: "Weekends Active",
                desc: "Allow AI to work on weekends",
                icon: CalendarDays,
                accent: "orange",
              },
            ].map((item) => {
              const Icon = item.icon;
              const active = Boolean(current?.quickControls?.[item.key]);

              return (
                <div className="cx-quick-control" key={item.key}>
                  <div className={`cx-quick-control-icon ${item.accent}`}>
                    <Icon size={18} />
                  </div>
                  <div className="cx-quick-control-content">
                    <strong>{item.title}</strong>
                    <p>{item.desc}</p>
                  </div>
                  <button
                    className={`cx-switch ${active ? "on" : ""}`}
                    onClick={() => toggleQuickControl(item.key)}
                  >
                    <i />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="cx-white-card">
            <h2>Automation Rules</h2>
            {[
              "Auto reply within 5 minutes",
              "Escalate score 80+",
              "Book appointments automatically",
              "Follow up after 24 hours",
            ].map((x) => (
              <div className="cx-rule-row" key={x}>
                <CheckCircle2 size={16} /> <span>{x}</span>
                <em>Enabled</em>
              </div>
            ))}
            <button className="cx-show-more">
              View All Rules <ChevronRight size={16} />
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function GlanceCard({ data = {} }) {
  const conversations = Number(
    data?.conversations ?? data?.conversationsToday ?? 0,
  );

  const leadsContacted = Number(
    data?.leadsContacted ?? data?.leadsContactedToday ?? 0,
  );

  const appointmentsBooked = Number(
    data?.appointmentsBooked ?? data?.appointmentsToday ?? 0,
  );

  const propertiesShared = Number(
    data?.propertiesShared ?? data?.propertiesSharedToday ?? 0,
  );

  const status = data?.status || data?.agentStatus || "live";

  return (
    <div className="cx-white-card">
      <h2>
        AI Agent at a glance
        <em className={status === "paused" ? "paused" : ""}>
          <i />

          {status === "paused" ? "Paused" : "Live"}
        </em>
      </h2>

      <div className="cx-glance-grid">
        <StatMini
          icon={MessageSquare}
          title="Conversations"
          value={conversations}
          desc="Today"
        />

        <StatMini
          icon={Users}
          title="Leads Contacted"
          value={leadsContacted}
          desc="Today"
        />

        <StatMini
          icon={CalendarDays}
          title="Appointments Booked"
          value={appointmentsBooked}
          desc="Today"
        />

        <StatMini
          icon={Home}
          title="Properties Shared"
          value={propertiesShared}
          desc="Today"
        />
      </div>
    </div>
  );
}

const formatRelativeTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) {
    return "Just now";
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

function PriorityTasks({ tasks = [], onViewAll }) {
  const rows = Array.isArray(tasks) ? tasks : [];

  return (
    <div className="cx-white-card">
      <h2>
        Priority Tasks
        {rows.length > 0 && (
          <button type="button" onClick={onViewAll}>
            View all
          </button>
        )}
      </h2>

      {rows.length > 0 ? (
        rows.slice(0, 4).map((task) => {
          const priority = String(
            task.priority || task.priorityLabel || "medium",
          ).toLowerCase();

          const name =
            task.contactName || task.leadName || task.assigneeName || "";

          const initials = String(name || task.title || "AI")
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part[0])
            .join("")
            .toUpperCase();

          return (
            <div
              className="cx-task-row"
              key={task.id || `${task.title}-${task.createdAt}`}
            >
              {task.avatarUrl ? (
                <img src={task.avatarUrl} alt={name} />
              ) : (
                <span className="cx-task-avatar-fallback">{initials}</span>
              )}
              <div>
                <strong>{task.title || "Priority task"}</strong>
                <p>
                  {task.typeLabel || task.type || "Task"}
                  {task.createdAt || task.dueAt ? (
                    <>
                      {" · "}
                      {formatRelativeTime(task.createdAt || task.dueAt)}
                    </>
                  ) : null}
                </p>
              </div>

              <em className={priority}>
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </em>
            </div>
          );
        })
      ) : (
        <div className="cx-mini-empty">
          <CheckCircle2 size={22} />
          <p>No priority tasks right now.</p>
        </div>
      )}
    </div>
  );
}

function RecentActivityMini({ items = [], onViewAll }) {
  const rows = Array.isArray(items) ? items : [];
  const getActivityIcon = (item) => {
    const value = String(
      item.iconKey || item.type || item.action || "",
    ).toLowerCase();

    if (value.includes("appointment") || value.includes("book")) {
      return CalendarDays;
    }

    if (value.includes("property")) {
      return Home;
    }

    if (
      value.includes("whatsapp") ||
      value.includes("message") ||
      value.includes("reply")
    ) {
      return MessageCircle;
    }

    if (value.includes("lead")) {
      return Users;
    }

    if (value.includes("complete")) {
      return CheckCircle2;
    }

    return Sparkles;
  };

  return (
    <div className="cx-white-card">
      <h2>
        Recent Activity
        {rows.length > 0 && (
          <button type="button" onClick={onViewAll}>
            View all
          </button>
        )}
      </h2>

      {rows.length > 0 ? (
        rows.slice(0, 4).map((item) => {
          const Icon = getActivityIcon(item);

          return (
            <div
              className="cx-mini-activity"
              key={item.id || `${item.title}-${item.createdAt}`}
            >
              <div className={`cx-small-icon ${item.accent || "purple"}`}>
                <Icon size={17} />
              </div>
              <div>
                <strong>{item.title || item.label || "AI activity"}</strong>
                <p>{item.timeLabel || formatRelativeTime(item.createdAt)}</p>
              </div>
            </div>
          );
        })
      ) : (
        <div className="cx-mini-empty">
          <Activity size={22} />
          <p>No recent AI activity.</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, title, value, desc, accent }) {
  return (
    <div className="cx-stat-card">
      <div className={`cx-big-icon ${accent}`}>
        <Icon size={30} />
      </div>
      <div>
        <p>{title}</p>
        <strong>{value}</strong>
        <span>{desc}</span>
      </div>
    </div>
  );
}

function StatMini({ title, value, desc, icon: Icon }) {
  return (
    <div className="cx-stat-mini">
      <p>{title}</p>
      <div className="mini-wrap">
        <div>
          <strong>{value}</strong>
          <span>{desc}</span>
        </div>
        {Icon && <Icon size={20} />}
      </div>
    </div>
  );
}
