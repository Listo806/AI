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
  ChevronsRight,
  ChevronsLeft
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CortexaAISetup from "./CortexaAISetup";
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
  const { t } = useTranslation();
  const location = useLocation();
  const isSetupRoute = location.pathname === "/dashboard/ai-cortexa-setup";
  const { user } = useAuth();
  const [activePage, setActivePage] = useState("chat");
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
  const isAgentReadOnly = !setupData?.isSetupComplete;
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
          t("aiCenter.cortexaAI.errorLoadSetup", "Unable to load AI Agent setup."),
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
          t("aiCenter.cortexaAI.errorLoadProperties", "Unable to load properties."),
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
          t("aiCenter.cortexaAI.errorSaveProperties", "Unable to save property catalog."),
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
        error?.message || t("aiCenter.cortexaAI.errorLoadAppointmentRules", "Unable to load appointment rules."),
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
        error?.message || t("aiCenter.cortexaAI.errorSaveAppointmentRules", "Unable to save appointment rules."),
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
          t("aiCenter.cortexaAI.errorLoadBehavior", "Unable to load AI behavior."),
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
          t("aiCenter.cortexaAI.errorSaveBehavior", "Unable to save AI behavior."),
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
          t("aiCenter.cortexaAI.errorLoadAutomations", "Unable to load automations."),
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
          t("aiCenter.cortexaAI.errorSaveAutomations", "Unable to save automations."),
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
          t("aiCenter.cortexaAI.errorLoadTestStatus", "Unable to load AI test status."),
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
          t("aiCenter.cortexaAI.errorStartTest", "Unable to start a new test."),
      );

      throw error;
    } finally {
      setTestAgentLoading(false);
    }
  };

  const openAgentTest = async () => {
    setTestAgentOpen(true);
    // Start each test run from a clean simulator conversation.
    try {
      await aiAgentSetupService.resetAgentSim();
    } catch (err) {
      // Non-fatal: a stale simulator state just continues the prior chat.
    }
    await loadAgentTest();
  };

  const runAgentTest = async (message) => {
    setTestAgentSending(true);
    setTestAgentError("");

    try {
      const response = await aiAgentSetupService.simulateAgent(message);

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
          t("aiCenter.cortexaAI.errorRunTest", "Unable to test AI Agent."),
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
          t("aiCenter.cortexaAI.errorLaunch", "Unable to launch AI Agent."),
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
          t("aiCenter.cortexaAI.errorLoadChat", "Unable to load this AI chat."),
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
            t("aiCenter.cortexaAI.errorLoadChatHistory", "Unable to load AI chat history."),
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
          t("aiCenter.cortexaAI.errorCreateChat", "Unable to create a new chat."),
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
            t("aiCenter.cortexaAI.errorLoadKnowledge", "Unable to load AI knowledge."),
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
          t("aiCenter.cortexaAI.errorLoadKnowledgeItem", "Unable to load knowledge item."),
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
          t("aiCenter.cortexaAI.errorSaveKnowledgeItem", "Unable to save knowledge item."),
      );
      throw error;
    } finally {
      setKnowledgeSaving(false);
    }
  };

  const deleteKnowledgeItem = async (item) => {
    const confirmed = window.confirm(
      t("aiCenter.cortexaAI.confirmDeleteKnowledge", 'Delete "{{title}}"?', {
        title: item.title,
      }),
    );

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
          t("aiCenter.cortexaAI.errorDeleteKnowledgeItem", "Unable to delete knowledge item."),
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
            .join("\n") || t("aiCenter.cortexaAI.errorNoKnowledgeImported", "No knowledge items were imported."),
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
          t("aiCenter.cortexaAI.errorImportKnowledge", "Unable to import knowledge."),
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
            t("aiCenter.cortexaAI.errorLoadActivity", "Unable to load AI activity."),
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
        throw new Error(
          t("aiCenter.cortexaAI.errorNoActivityToExport", "No activity data available to export."),
        );
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
          t("aiCenter.cortexaAI.errorExportActivity", "Unable to export AI activity."),
      );
    } finally {
      setActivityExporting(false);
    }
  };

  useEffect(() => {
    loadSetup();
  }, [loadSetup]);

  useEffect(() => {
    if (isSetupRoute) {
      return;
    }

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

          if (!cancelled) {
            setControlsData(data);
          }
        }
      } catch (error) {
        console.error(`LOAD ${activePage.toUpperCase()} FAILED:`, error);

        if (!cancelled) {
          setPageError(
            error?.response?.data?.message ||
              error?.message ||
              t("aiCenter.cortexaAI.errorLoadAgentData", "Unable to load AI Agent data."),
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingPage(false);
        }
      }
    };

    loadPage();

    return () => {
      cancelled = true;
    };
  }, [
    isSetupRoute,
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
            t("aiCenter.cortexaAI.errorAiRequestFailed", "AI request failed."),
          error: true,
        },
      ]);

      setChatError(
        error?.response?.data?.message ||
          error?.message ||
          t("aiCenter.cortexaAI.errorSendMessage", "Unable to send your message."),
      );
      const errorCode =
        error?.code || error?.details?.code || error?.response?.data?.code;

      if (errorCode === "AI_CAPABILITY_DISABLED") {
        const capability =
          error?.details?.capability || error?.response?.data?.capability;

        setChatError(
          t("aiCenter.cortexaAI.errorCapabilityDisabled", "This AI capability is disabled: {{capability}}. Enable it in Controls to continue.", {
            capability: capability || t("aiCenter.cortexaAI.requestedAction", "requested action"),
          }),
        );

        return;
      }

      if (errorCode === "AI_AGENT_PAUSED") {
        setChatError(
          t("aiCenter.cortexaAI.errorAgentPaused", "The AI Agent is paused. Resume it in Controls before sending messages."),
        );

        return;
      }

      if (errorCode === "AI_AGENT_OUTSIDE_WORKING_HOURS") {
        setChatError(
          t("aiCenter.cortexaAI.errorOutsideWorkingHours", "The AI Agent is currently outside its working hours."),
        );

        return;
      }

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
          t("aiCenter.cortexaAI.errorLoadActivityDetails", "Unable to load activity details."),
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
      key: "chat",
      title: t("aiCenter.cortexaAI.menuChatTitle", "AI Chat"),
      desc: t("aiCenter.cortexaAI.menuChatDesc", "Chat with your AI Agent"),
      icon: MessageSquare,
    },
    {
      key: "knowledge",
      title: t("aiCenter.cortexaAI.menuKnowledgeTitle", "Knowledge"),
      desc: t("aiCenter.cortexaAI.menuKnowledgeDesc", "Manage AI knowledge"),
      icon: BookOpen,
    },
    {
      key: "activity",
      title: t("aiCenter.cortexaAI.menuActivityTitle", "Activity"),
      desc: t("aiCenter.cortexaAI.menuActivityDesc", "See what your AI is doing"),
      icon: Sparkles,
    },
    {
      key: "controls",
      title: t("aiCenter.cortexaAI.menuControlsTitle", "Controls"),
      desc: t("aiCenter.cortexaAI.menuControlsDesc", "Behavior & preferences"),
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
          t("aiCenter.cortexaAI.errorLoadBusinessProfile", "Unable to load Business Profile."),
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
          t("aiCenter.cortexaAI.errorSaveBusinessProfile", "Unable to save Business Profile."),
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
        {t("aiCenter.cortexaAI.loadingAgent", "Loading AI Agent...")}
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
      {isSetupRoute ? (
        <CortexaAISetup
          setupData={setupData}
          openStep={openStep}
          setOpenStep={setOpenStep}
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
      ) : (
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
                  ? t("aiCenter.cortexaAI.expandSidebarAria", "Expand AI Agent sidebar")
                  : t("aiCenter.cortexaAI.collapseSidebarAria", "Collapse AI Agent sidebar")
              }
              title={
                agentSidebarCollapsed
                  ? t("aiCenter.cortexaAI.expandSidebar", "Expand sidebar")
                  : t("aiCenter.cortexaAI.collapseSidebar", "Collapse sidebar")
              }
            >
              {agentSidebarCollapsed ? (
                <ChevronsRight size={18} />
              ) : (
                <ChevronsLeft size={18} />
              )}
              
            </button>
            {/*<div className="cx-agent-brand">
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
          </div>*/}

            <nav className="cx-agent-menu">
              {agentMenus.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    type="button"
                    key={item.key}
                    title={agentSidebarCollapsed ? item.title : undefined}
                    className={activePage === item.key ? "active" : ""}
                    onClick={() => {
                      setActivePage(item.key);
                    }}
                  >
                    <Icon size={18} />
                    {!agentSidebarCollapsed && (
                      <div className="cx-agent-menu-copy">
                        <strong>{item.title}</strong>
                        <small>{item.desc}</small>
                      </div>
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
                    ? t("aiCenter.cortexaAI.agentOnline", "AI Agent Online")
                    : t("aiCenter.cortexaAI.setupInProgress", "Setup in progress")
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
                <h3>{t("aiCenter.cortexaAI.agentStatusTitle", "AI Agent Status")}</h3>

                <p className={setupData?.isSetupComplete ? "online" : "setup"}>
                  <i />

                  {setupData?.agentStatus === "paused"
                    ? t("aiCenter.cortexaAI.statusPaused", "Paused")
                    : setupData?.isSetupComplete
                      ? t("aiCenter.cortexaAI.statusOnline", "Online")
                      : t("aiCenter.cortexaAI.setupInProgress", "Setup in progress")}
                </p>

                <p>
                  {setupData?.isSetupComplete
                    ? t("aiCenter.cortexaAI.agentActiveReady", "Your AI Agent is active and ready to help.")
                    : t("aiCenter.cortexaAI.setupStepsCompleted", "{{completed}} of {{total}} setup steps completed.", {
                        completed: Number(setupData?.completedSteps || 0),
                        total: Number(setupData?.totalSteps || 8),
                      })}
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
                    ? t("aiCenter.cortexaAI.viewActivity", "View Activity")
                    : t("aiCenter.cortexaAI.continueSetup", "Continue Setup")}
                </button>
              </div>
            )}
          </aside>

          <section className="cx-agent-content">
            {pageError && <div className="cx-ai-error-banner">{pageError}</div>}
            {isAgentReadOnly && activePage !== "setup" && (
              <div className="cx-agent-readonly-notice">
                <div>
                  <ShieldCheck size={18} />
                  <div>
                    <strong>{t("aiCenter.cortexaAI.previewMode", "Preview mode")}</strong>
                    <p>
                      {t("aiCenter.cortexaAI.previewModeDesc", "Complete AI Agent setup to enable actions and save changes.")}
                    </p>
                  </div>
                </div>
                <button type="button" onClick={() => setActivePage("setup")}>
                  {t("aiCenter.cortexaAI.continueSetup", "Continue Setup")}
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
            {loadingPage && activePage !== "chat" && (
              <div className="cx-ai-inline-loading">
                <RefreshCw className="cx-ai-loading-spinner" size={18} />
                {t("aiCenter.cortexaAI.loadingData", "Loading data...")}
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

            {activePage === "chat" && (
              <AgentReadOnlyBoundary readOnly={isAgentReadOnly}>
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
                  readOnly={isAgentReadOnly}
                />
              </AgentReadOnlyBoundary>
            )}

            {activePage === "knowledge" && (
              <AgentReadOnlyBoundary readOnly={isAgentReadOnly}>
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
                  readOnly={isAgentReadOnly}
                />
              </AgentReadOnlyBoundary>
            )}

            {activePage === "activity" && (
              <AgentReadOnlyBoundary readOnly={isAgentReadOnly}>
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
                      title: t("aiCenter.cortexaAI.activityByType", "Activity by Type"),
                      items: Array.isArray(activityData?.activityByType)
                        ? activityData.activityByType
                        : [],
                    });
                  }}
                  onViewTopActions={() => {
                    setActivitySummaryModal({
                      type: "top_actions",
                      title: t("aiCenter.cortexaAI.topActions", "Top Actions"),
                      items: Array.isArray(activityData?.topActions)
                        ? activityData.topActions
                        : [],
                    });
                  }}
                  onViewRecentRuns={() => {
                    setActivitySummaryModal({
                      type: "recent_runs",
                      title: t("aiCenter.cortexaAI.recentAiRuns", "Recent AI Runs"),
                      items: Array.isArray(activityData?.recentRuns)
                        ? activityData.recentRuns
                        : Array.isArray(activityData?.recentAiRuns)
                          ? activityData.recentAiRuns
                          : [],
                    });
                  }}
                  readOnly={isAgentReadOnly}
                />
              </AgentReadOnlyBoundary>
            )}

            {activePage === "controls" && (
              <AgentReadOnlyBoundary readOnly={isAgentReadOnly}>
                <ControlsLayout
                  controlTab={controlTab}
                  setControlTab={setControlTab}
                  controlsData={controlsData}
                  onSave={saveControls}
                  onOpenAutomations={openAutomations}
                  onEditBehavior={openBehavior}
                  readOnly={isAgentReadOnly}
                />
              </AgentReadOnlyBoundary>
            )}
          </section>
        </div>
      )}
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
  const { t } = useTranslation();
  const setupSteps = useMemo(() => {
    const data = setupData || {};

    return [
      {
        id: 1,
        key: "whatsapp",
        title: t("aiCenter.cortexaAI.stepWhatsappTitle", "Connect WhatsApp"),
        desc: t("aiCenter.cortexaAI.stepWhatsappDesc", "Connect the WhatsApp number your AI Agent will use."),
        icon: MessageSquare,
        status: whatsappSetup?.connected
          ? t("aiCenter.cortexaAI.statusConnected", "Connected")
          : data?.whatsapp?.status || t("aiCenter.cortexaAI.statusNotConnected", "Not connected"),
        statusType:
          whatsappSetup?.connected || data?.whatsapp?.connected
            ? "success"
            : "danger",
        action:
          whatsappSetup?.connected || data?.whatsapp?.connected
            ? t("aiCenter.cortexaAI.statusConnected", "Connected")
            : t("aiCenter.cortexaAI.stepWhatsappTitle", "Connect WhatsApp"),
        accent: "green",
        complete: Boolean(
          whatsappSetup?.connected || data?.whatsapp?.connected,
        ),
      },
      {
        id: 2,
        key: "businessProfile",
        title: t("aiCenter.cortexaAI.stepBusinessTitle", "Business Profile"),
        desc: t("aiCenter.cortexaAI.stepBusinessDesc", "Tell your AI Agent about your business."),
        icon: Building2,
        status: data?.businessProfile?.status || t("aiCenter.cortexaAI.statusIncomplete", "Incomplete"),
        statusType: data?.businessProfile?.completed ? "success" : "warning",
        action: data?.businessProfile?.completed
          ? t("aiCenter.cortexaAI.actionEdit", "Edit")
          : t("aiCenter.cortexaAI.actionSetUp", "Set up"),
        accent: "blue",
        complete: Boolean(data?.businessProfile?.completed),
      },
      {
        id: 3,
        key: "properties",
        title: t("aiCenter.cortexaAI.stepPropertiesTitle", "Import Properties"),
        desc: t("aiCenter.cortexaAI.stepPropertiesDesc", "Add properties your AI can recommend."),
        icon: Home,
        status:
          data?.properties?.status ||
          t("aiCenter.cortexaAI.statusImported", "{{count}} imported", {
            count: Number(data?.properties?.imported || 0),
          }),
        statusType:
          Number(data?.properties?.imported || 0) > 0 ? "success" : "muted",
        action: t("aiCenter.cortexaAI.actionImport", "Import"),
        accent: "orange",
        complete: Number(data?.properties?.imported || 0) > 0,
      },
      {
        id: 4,
        key: "appointmentRules",
        title: t("aiCenter.cortexaAI.stepAppointmentTitle", "Appointment Rules"),
        desc: t("aiCenter.cortexaAI.stepAppointmentDesc", "Define when and how AI can book appointments."),
        icon: CalendarDays,
        status: data?.appointmentRules?.status || t("aiCenter.cortexaAI.statusNotConfigured", "Not configured"),
        statusType: data?.appointmentRules?.configured ? "success" : "muted",
        action: t("aiCenter.cortexaAI.actionConfigure", "Configure"),
        accent: "indigo",
        complete: Boolean(data?.appointmentRules?.configured),
      },
      {
        id: 5,
        key: "behavior",
        title: t("aiCenter.cortexaAI.stepBehaviorTitle", "AI Behavior"),
        desc: t("aiCenter.cortexaAI.stepBehaviorDesc", "Define how your AI should talk and what to ask."),
        icon: MessageSquare,
        status: data?.behavior?.status || t("aiCenter.cortexaAI.statusNotConfigured", "Not configured"),
        statusType: data?.behavior?.configured ? "success" : "muted",
        action: t("aiCenter.cortexaAI.actionConfigure", "Configure"),
        accent: "green",
        complete: Boolean(data?.behavior?.configured),
      },
      {
        id: 6,
        key: "automations",
        title: t("aiCenter.cortexaAI.stepAutomationsTitle", "Automations"),
        desc: t("aiCenter.cortexaAI.stepAutomationsDesc", "Choose what your AI Agent should do automatically."),
        icon: Zap,
        status: data?.automations?.status || t("aiCenter.cortexaAI.statusNotConfigured", "Not configured"),
        statusType: data?.automations?.configured ? "success" : "muted",
        action: data?.automations?.configured
          ? t("aiCenter.cortexaAI.actionEdit", "Edit")
          : t("aiCenter.cortexaAI.actionSetUp", "Set up"),
        accent: "purple",
        complete: Boolean(data?.automations?.configured),
      },
      {
        id: 7,
        key: "testAi",
        title: t("aiCenter.cortexaAI.stepTestTitle", "Test AI"),
        desc: t("aiCenter.cortexaAI.stepTestDesc", "Test your AI Agent in a safe environment."),
        icon: TestTube2,
        status: data?.testAi?.status || t("aiCenter.cortexaAI.statusNotTested", "Not tested"),
        statusType: data?.testAi?.tested ? "success" : "muted",
        action: t("aiCenter.cortexaAI.actionTest", "Test"),
        accent: "pink",
        complete: Boolean(data?.testAi?.tested),
      },
      {
        id: 8,
        key: "launch",
        title: t("aiCenter.cortexaAI.stepLaunchTitle", "Launch AI Agent"),
        desc: t("aiCenter.cortexaAI.stepLaunchDesc", "Review and launch your AI Agent."),
        icon: Rocket,
        status: data?.launch?.status || t("aiCenter.cortexaAI.statusLocked", "Locked"),
        statusType: data?.launch?.unlocked ? "success" : "locked",
        action: data?.launch?.unlocked
          ? t("aiCenter.cortexaAI.actionLaunch", "Launch")
          : t("aiCenter.cortexaAI.statusLocked", "Locked"),
        accent: "rose",
        complete: Boolean(data?.launch?.launched),
        locked: !data?.launch?.unlocked,
      },
    ];
  }, [setupData, whatsappSetup?.connected, t]);

  const completedSteps = Number(setupData?.completedSteps || 0);
  const totalSteps = Number(setupData?.totalSteps || 8);
  const progress = Number(setupData?.progress || 0);

  return (
    <div className="cx-ai-setup-page">
      <header className="cx-ai-setup-topbar heading_page">
        <div>
          <h1>
            <Bot size={24} /> {t("aiCenter.cortexaAI.setupWelcome", "Welcome! Let’s Get Your AI Agent Ready")}{" "}
          </h1>
          <p className="sub_head">
            {t("aiCenter.cortexaAI.setupWelcomeSub", "Complete these 8 quick steps. Most customers finish setup in under 5 minutes.")}
          </p>
        </div>
      </header>

      <main className="cx-ai-setup-layout">
        <section className="cx-ai-setup-main">
          <h2>{t("aiCenter.cortexaAI.yourSetupProgress", "Your setup progress")}</h2>

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
                            ? t("aiCenter.cortexaAI.launching", "Launching...")
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
                      pairingCode={whatsappSetup?.pairingCode}
                      connected={whatsappSetup?.connected}
                      phone={whatsappSetup?.phone}
                      loading={whatsappSetup?.loading}
                      connecting={whatsappSetup?.connecting}
                      disconnecting={whatsappSetup?.disconnecting}
                      socketConnected={whatsappSetup?.socketConnected}
                      error={whatsappSetup?.error}
                      onConnect={whatsappSetup?.connect}
                      onConnectWithCode={whatsappSetup?.connectWithCode}
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
            <h3>{t("aiCenter.cortexaAI.overallProgress", "Overall Progress")}</h3>
            <div className="cx-progress-row">
              <div
                className="cx-progress-circle"
                style={{ "--progress": `${progress * 3.6}deg` }}
              >
                <span>{progress}%</span>
              </div>
              <div>
                <strong>
                  {t("aiCenter.cortexaAI.stepsCompleted", "{{completed}} of {{total}} steps completed", {
                    completed: completedSteps,
                    total: totalSteps,
                  })}
                </strong>
                <p>
                  {progress === 100
                    ? t("aiCenter.cortexaAI.greatWork", "Great work!")
                    : t("aiCenter.cortexaAI.youreDoingGreat", "You’re doing great!")}
                </p>
                <p>
                  {progress === 100
                    ? t("aiCenter.cortexaAI.agentIsReady", "Your AI Agent is ready.")
                    : t("aiCenter.cortexaAI.finishSetup", "Let’s finish setting up your AI Agent.")}
                </p>
              </div>
            </div>
          </div>

          <div className="cx-side-card">
            <h3>{t("aiCenter.cortexaAI.aiSetupStatus", "AI Setup Status")}</h3>
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
              <Settings2 size={22} /> {t("aiCenter.cortexaAI.setupTips", "Setup Tips")}
            </h3>
            <div className="cx-tips-list">
              <p>
                <CheckCircle2 size={18} /> {t("aiCenter.cortexaAI.tipEditAnytime", "You can edit these settings anytime")}
              </p>
              <p>
                <CheckCircle2 size={18} /> {t("aiCenter.cortexaAI.tipProgressSaved", "Your progress is saved automatically")}
              </p>
              <p>
                <CheckCircle2 size={18} /> {t("aiCenter.cortexaAI.tipFinishFast", "Most customers finish in under 5 minutes")}
              </p>
              <p>
                <CheckCircle2 size={18} /> {t("aiCenter.cortexaAI.tipNeedHelp", "Need help? Contact our support team")}
              </p>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
function AgentReadOnlyBoundary({ readOnly, children }) {
  const blockWriteAction = (event) => {
    if (!readOnly) {
      return;
    }
    const writeElement = event.target.closest("[data-ai-write-action='true']");
    if (!writeElement) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div
      className={
        readOnly
          ? "cx-agent-readonly-boundary is-readonly"
          : "cx-agent-readonly-boundary"
      }
      onClickCapture={blockWriteAction}
      onSubmitCapture={blockWriteAction}
    >
      {children}
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
  const { t } = useTranslation();
  const chatShortcuts = [
    {
      key: "leads",
      label: t("aiCenter.cortexaAI.shortcutLeads", "Leads"),
      icon: Users,
      prompt: t("aiCenter.cortexaAI.shortcutLeadsPrompt", "Give me an overview of my active leads and which ones need attention."),
    },
    {
      key: "properties",
      label: t("aiCenter.cortexaAI.shortcutProperties", "Properties"),
      icon: Home,
      prompt: t("aiCenter.cortexaAI.shortcutPropertiesPrompt", "Give me an overview of available properties and recent buyer matches."),
    },
    {
      key: "appointments",
      label: t("aiCenter.cortexaAI.shortcutAppointments", "Appointments"),
      icon: CalendarDays,
      prompt: t("aiCenter.cortexaAI.shortcutAppointmentsPrompt", "Show me upcoming, confirmed, and overdue appointments."),
    },
    {
      key: "pipeline",
      label: t("aiCenter.cortexaAI.shortcutPipeline", "Pipeline"),
      icon: Sparkles,
      prompt: t("aiCenter.cortexaAI.shortcutPipelinePrompt", "Summarize my pipeline and highlight deals at risk."),
    },
  ];
  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) {
      return t("aiCenter.cortexaAI.goodMorning", "Good morning");
    }

    if (hour < 18) {
      return t("aiCenter.cortexaAI.goodAfternoon", "Good afternoon");
    }

    return t("aiCenter.cortexaAI.goodEvening", "Good evening");
  };

  const displayName =
    user?.name ||
    user?.fullName ||
    user?.firstName ||
    user?.email?.split("@")?.[0] ||
    t("aiCenter.cortexaAI.there", "there");

  const firstName =
    String(displayName).trim().split(/\s+/)[0] ||
    t("aiCenter.cortexaAI.there", "there");

  const fallbackPrompts = [
    {
      key: "leads_attention",
      icon: MessageSquare,
      title: t("aiCenter.cortexaAI.promptLeadsAttentionTitle", "What leads need attention today?"),
      prompt: t("aiCenter.cortexaAI.promptLeadsAttentionPrompt", "Show me hot, overdue, and uncontacted leads that need attention today."),
      desc: t("aiCenter.cortexaAI.promptLeadsAttentionDesc", "Review hot and overdue leads."),
      accent: "purple",
    },
    {
      key: "likely_buyers",
      icon: Zap,
      title: t("aiCenter.cortexaAI.promptLikelyBuyersTitle", "Which buyers are most likely to buy?"),
      prompt: t("aiCenter.cortexaAI.promptLikelyBuyersPrompt", "Show me the buyer leads most likely to convert, with reasons."),
      desc: t("aiCenter.cortexaAI.promptLikelyBuyersDesc", "Review your highest-intent buyers."),
      accent: "orange",
    },
    {
      key: "appointments_today",
      icon: CalendarDays,
      title: t("aiCenter.cortexaAI.promptAppointmentsTodayTitle", "What appointments are booked today?"),
      prompt: t("aiCenter.cortexaAI.promptAppointmentsTodayPrompt", "Show me today's booked and confirmed appointments."),
      desc: t("aiCenter.cortexaAI.promptAppointmentsTodayDesc", "Review today’s appointments."),
      accent: "blue",
    },
    {
      key: "follow_up",
      icon: MessageCircle,
      title: t("aiCenter.cortexaAI.promptFollowUpTitle", "Write a follow-up message"),
      prompt: t("aiCenter.cortexaAI.promptFollowUpPrompt", "Help me write a professional follow-up message for a lead who has not replied."),
      desc: t("aiCenter.cortexaAI.promptFollowUpDesc", "Create a lead follow-up message."),
      accent: "green",
    },
    {
      key: "property_match",
      icon: Home,
      title: t("aiCenter.cortexaAI.promptPropertyMatchTitle", "Find matching properties"),
      prompt: t("aiCenter.cortexaAI.promptPropertyMatchPrompt", "Show me recent property matches for active buyer leads."),
      desc: t("aiCenter.cortexaAI.promptPropertyMatchDesc", "Review matching properties."),
      accent: "green",
    },
    {
      key: "pipeline_summary",
      icon: FileText,
      title: t("aiCenter.cortexaAI.promptPipelineSummaryTitle", "Summarize my pipeline"),
      prompt: t("aiCenter.cortexaAI.promptPipelineSummaryPrompt", "Summarize my current pipeline, including risks, overdue deals, and next actions."),
      desc: t("aiCenter.cortexaAI.promptPipelineSummaryDesc", "Get a quick pipeline update."),
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

          title: item.title || item.prompt || t("aiCenter.cortexaAI.askAiAgent", "Ask AI Agent"),

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
          <h1>{t("aiCenter.cortexaAI.chatTitle", "AI Agent Chat")}</h1>
          <p>
            {t("aiCenter.cortexaAI.chatSubtitle", "Ask anything. Your AI Agent is here to help you close more deals.")}
          </p>
        </div>
        <button
          type="button"
          className="cx-primary-outline"
          onClick={onNewChat}
          disabled={creatingSession}
          data-ai-write-action="true"
        >
          {creatingSession ? (
            <RefreshCw size={18} className="cx-ai-loading-spinner" />
          ) : (
            <Plus size={18} />
          )}

          {creatingSession
            ? t("aiCenter.cortexaAI.creating", "Creating...")
            : t("aiCenter.cortexaAI.newChat", "New Chat")}
        </button>
      </div>

      <div className="cx-chat-layout has-history">
        <aside className="cx-chat-history">
          <div className="cx-chat-history-head">
            <div>
              <h3>{t("aiCenter.cortexaAI.chatHistory", "Chat History")}</h3>
              <p>{t("aiCenter.cortexaAI.recentConversations", "Your recent AI conversations")}</p>
            </div>

            <button
              type="button"
              onClick={onNewChat}
              disabled={creatingSession}
              title={t("aiCenter.cortexaAI.newChat", "New Chat")}
              data-ai-write-action="true"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="cx-chat-history-list">
            {sessionsLoading ? (
              <div className="cx-chat-history-empty">
                <RefreshCw size={17} className="cx-ai-loading-spinner" />
                {t("aiCenter.cortexaAI.loadingChats", "Loading chats...")}
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
                    <strong>{session.title || t("aiCenter.cortexaAI.newChat", "New Chat")}</strong>
                    <p>{session.lastMessage || t("aiCenter.cortexaAI.noMessagesYet", "No messages yet")}</p>
                  </div>
                  <span>{Number(session.messageCount || 0)}</span>
                </button>
              ))
            ) : (
              <div className="cx-chat-history-empty">
                <MessageSquare size={22} />
                <p>{t("aiCenter.cortexaAI.noChatsYet", "No chats yet")}</p>
                <button
                  type="button"
                  onClick={onNewChat}
                  data-ai-write-action="true"
                >
                  {t("aiCenter.cortexaAI.startNewChat", "Start a new chat")}
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
              {t("aiCenter.cortexaAI.greetingLine", "{{greeting}}, {{name}}! 👋", {
                greeting: getGreeting(),
                name: firstName,
              })}
            </h2>
            <p>
              {t("aiCenter.cortexaAI.heroSubtitle", "I’m your AI Agent. I can help you with leads, properties, appointments, follow-ups and more.")}
            </p>
            <div className="cx-chat-badges">
              <span>
                <Sparkles size={15} /> {t("aiCenter.cortexaAI.badgeSmart", "Smart")}
              </span>
              <span>
                <Zap size={15} /> {t("aiCenter.cortexaAI.badgeProactive", "Proactive")}
              </span>
              <span>
                <Heart size={15} /> {t("aiCenter.cortexaAI.badgeAlwaysWorking", "Always working for you")}
              </span>
            </div>
          </div>

          <h3 className="cx-section-label">{t("aiCenter.cortexaAI.tryAsking", "Try asking me something")}</h3>

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
                  data-ai-write-action="true"
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
                  t("aiCenter.cortexaAI.moreInsightsPrompt", "What other useful insights or actions can you help me with today?"),
                )
              }
            >
              <ChevronDown size={17} />
              {t("aiCenter.cortexaAI.more", "More")}
            </button>
          </div>

          {error && <div className="cx-ai-error-banner">{error}</div>}

          {sessionLoading ? (
            <div className="cx-chat-session-loading">
              <RefreshCw className="cx-ai-loading-spinner" size={18} />
              {t("aiCenter.cortexaAI.loadingConversation", "Loading conversation...")}
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
                  {t("aiCenter.cortexaAI.agentThinking", "AI Agent is thinking...")}
                </div>
              )}
            </div>
          ) : (
            <div className="cx-chat-empty-conversation">
              <Bot size={34} />
              <strong>{t("aiCenter.cortexaAI.startConversation", "Start a conversation")}</strong>
              <p>
                {t("aiCenter.cortexaAI.startConversationDesc", "Ask your AI Agent about leads, properties, pipeline, appointments, or follow-ups.")}
              </p>
            </div>
          )}

          <div className="cx-chat-input">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("aiCenter.cortexaAI.typeMessagePlaceholder", "Type your message here...")}
            />
            <Mic size={24} />
            <button
              onClick={() => onSend(message)}
              disabled={!message.trim() || sendingMessage}
              data-ai-write-action="true"
            >
              <Send size={22} />
            </button>
          </div>

          <p className="cx-ai-note">
            {t("aiCenter.cortexaAI.aiMistakesNote", "AI can make mistakes. Please verify important information.")}
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
  const { t } = useTranslation();
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
          <h1>{t("aiCenter.cortexaAI.knowledgeTitle", "AI Knowledge")}</h1>
          <p>{t("aiCenter.cortexaAI.knowledgeSubtitle", "Manage what your AI Agent knows about your business.")}</p>
        </div>
        <div className="cx-head-buttons">
          <button
            type="button"
            className="cx-primary-outline"
            onClick={onImport}
            data-ai-write-action="true"
          >
            <Upload size={17} />
            {t("aiCenter.cortexaAI.importKnowledge", "Import Knowledge")}
          </button>
          <button
            type="button"
            className="cx-primary-btn slim"
            onClick={() => onAdd()}
            data-ai-write-action="true"
          >
            <Plus size={17} />
            {t("aiCenter.cortexaAI.addKnowledge", "Add Knowledge")}
          </button>
        </div>
      </div>

      <div className="cx-stat-grid four">
        <StatCard
          icon={BookOpen}
          title={t("aiCenter.cortexaAI.statKnowledgeItems", "Knowledge Items")}
          value={knowledgeData?.stats?.knowledgeItems ?? 0}
          desc={t("aiCenter.cortexaAI.statTotalItems", "Total items")}
          accent="purple"
        />
        <StatCard
          icon={CircleCheck}
          title={t("aiCenter.cortexaAI.statActiveItems", "Active Items")}
          value={knowledgeData?.stats?.activeItems ?? 0}
          desc={t("aiCenter.cortexaAI.statCurrentlyInUse", "Currently in use")}
          accent="green"
        />
        <StatCard
          icon={Database}
          title={t("aiCenter.cortexaAI.statDataSources", "Data Sources")}
          value={knowledgeData?.stats?.dataSources ?? 0}
          desc={t("aiCenter.cortexaAI.statConnectedSources", "Connected sources")}
          accent="blue"
        />
        <StatCard
          icon={Sparkles}
          title={t("aiCenter.cortexaAI.statLastUpdated", "Last Updated")}
          value={knowledgeData?.stats?.lastUpdatedLabel || t("aiCenter.cortexaAI.never", "Never")}
          desc={knowledgeData?.stats?.lastUpdatedDate || t("aiCenter.cortexaAI.noUpdatesYet", "No updates yet")}
          accent="orange"
        />
      </div>

      <div className="cx-two-col">
        <main className="cx-white-card">
          <h2>{t("aiCenter.cortexaAI.knowledgeCategories", "Knowledge Categories")}</h2>
          <p>{t("aiCenter.cortexaAI.knowledgeCategoriesDesc", "Organize and manage what your AI knows.")}</p>

          <div className="cx-category-list">
            {(visibleCategories.length
              ? visibleCategories
              : [
                  {
                    key: "company_information",
                    title: t("aiCenter.cortexaAI.catCompanyInfoTitle", "Company Information"),
                    description: t("aiCenter.cortexaAI.catCompanyInfoDesc", "Your company details, mission, values and offices"),
                    items: 0,
                    status: "Empty",
                    accent: "purple",
                  },
                  {
                    key: "office_hours",
                    title: t("aiCenter.cortexaAI.catOfficeHoursTitle", "Office Hours & Availability"),
                    description: t("aiCenter.cortexaAI.catOfficeHoursDesc", "Business hours, holidays and availability rules"),
                    items: 0,
                    status: "Empty",
                    accent: "green",
                  },
                  {
                    key: "service_areas",
                    title: t("aiCenter.cortexaAI.catServiceAreasTitle", "Service Areas"),
                    description: t("aiCenter.cortexaAI.catServiceAreasDesc", "Areas, neighborhoods and coverage information"),
                    items: 0,
                    status: "Empty",
                    accent: "blue",
                  },
                  {
                    key: "property_knowledge",
                    title: t("aiCenter.cortexaAI.catPropertyKnowledgeTitle", "Property Knowledge"),
                    description: t("aiCenter.cortexaAI.catPropertyKnowledgeDesc", "Property types, features and market expertise"),
                    items: 0,
                    status: "Empty",
                    accent: "orange",
                  },
                  {
                    key: "sales_scripts",
                    title: t("aiCenter.cortexaAI.catSalesScriptsTitle", "Sales Scripts & Templates"),
                    description: t("aiCenter.cortexaAI.catSalesScriptsDesc", "Scripts, email templates and messaging guides"),
                    items: 0,
                    status: "Empty",
                    accent: "purple",
                  },
                  {
                    key: "financing_partners",
                    title: t("aiCenter.cortexaAI.catFinancingTitle", "Financing & Partners"),
                    description: t("aiCenter.cortexaAI.catFinancingDesc", "Lenders, partners and financing information"),
                    items: 0,
                    status: "Empty",
                    accent: "green",
                  },
                  {
                    key: "faqs",
                    title: t("aiCenter.cortexaAI.catFaqsTitle", "FAQs"),
                    description: t("aiCenter.cortexaAI.catFaqsDesc", "Frequently asked questions and answers"),
                    items: 0,
                    status: "Empty",
                    accent: "blue",
                  },
                  {
                    key: "policies_processes",
                    title: t("aiCenter.cortexaAI.catPoliciesTitle", "Policies & Processes"),
                    description: t("aiCenter.cortexaAI.catPoliciesDesc", "Business policies and internal processes"),
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

                  <span>{t("aiCenter.cortexaAI.itemsCount", "{{count}} items", { count: Number(item.items || 0) })}</span>

                  <em
                    className={String(item.status || "")
                      .toLowerCase()
                      .replace(/\s+/g, "-")}
                  >
                    {item.status || t("aiCenter.cortexaAI.statusEmpty", "Empty")}
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
              placeholder={t("aiCenter.cortexaAI.searchKnowledgePlaceholder", "Search knowledge...")}
            />

            <select
              value={filters?.category || "all"}
              onChange={(event) =>
                onFilterChange({
                  category: event.target.value,
                })
              }
            >
              <option value="all">{t("aiCenter.cortexaAI.allCategories", "All categories")}</option>

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
              <option value="all">{t("aiCenter.cortexaAI.allStatuses", "All statuses")}</option>
              <option value="active">{t("aiCenter.cortexaAI.statusActive", "Active")}</option>
              <option value="inactive">{t("aiCenter.cortexaAI.statusInactive", "Inactive")}</option>
              <option value="needs_review">{t("aiCenter.cortexaAI.statusNeedsReview", "Needs Review")}</option>
            </select>
          </div>

          {error && <div className="cx-ai-error-banner">{error}</div>}

          <div className="cx-knowledge-item-list">
            {loading ? (
              <div className="cx-knowledge-empty">
                <RefreshCw className="cx-ai-loading-spinner" size={20} />
                {t("aiCenter.cortexaAI.loadingKnowledge", "Loading knowledge...")}
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
                          ? t("aiCenter.cortexaAI.statusNeedsReview", "Needs Review")
                          : item.status === "active"
                            ? t("aiCenter.cortexaAI.statusActive", "Active")
                            : t("aiCenter.cortexaAI.statusInactive", "Inactive")}
                      </span>

                      <span>{t("aiCenter.cortexaAI.priorityLabel", "Priority {{priority}}", { priority: item.priority })}</span>
                    </div>
                  </div>

                  <div className="cx-knowledge-item-actions">
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      title={t("aiCenter.cortexaAI.actionEdit", "Edit")}
                    >
                      <PenLine size={16} />
                    </button>

                    <button
                      type="button"
                      className="danger"
                      disabled={deletingId === item.id}
                      onClick={() => onDelete(item)}
                      title={t("aiCenter.cortexaAI.actionDelete", "Delete")}
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

                <strong>{t("aiCenter.cortexaAI.noKnowledgeFound", "No knowledge items found")}</strong>

                <p>
                  {t("aiCenter.cortexaAI.noKnowledgeFoundDesc", "Add your first knowledge item so your AI Agent can use it.")}
                </p>

                <button
                  type="button"
                  className="cx-primary-btn slim"
                  data-ai-write-action="true"
                  onClick={() =>
                    onAdd(
                      filters?.category !== "all"
                        ? filters.category
                        : "company_information",
                    )
                  }
                >
                  <Plus size={16} />
                  {t("aiCenter.cortexaAI.addKnowledge", "Add Knowledge")}
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
                {t("aiCenter.cortexaAI.previous", "Previous")}
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
                {t("aiCenter.cortexaAI.next", "Next")}
              </button>
            </div>
          )}
          <button
            type="button"
            className="cx-show-more"
            onClick={onToggleInactiveCategories}
          >
            {showInactiveCategories
              ? t("aiCenter.cortexaAI.hideInactiveCategories", "Hide inactive categories")
              : t("aiCenter.cortexaAI.showInactiveCategories", "Show inactive categories")}

            {showInactiveCategories ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </button>
        </main>

        <aside className="cx-right-column">
          <div className="cx-white-card cx-knowledge-health-card">
            <h2>{t("aiCenter.cortexaAI.knowledgeHealth", "Knowledge Health")}</h2>
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
                          aria-label={t("aiCenter.cortexaAI.knowledgeScoreAria", "Knowledge score {{score}}%", { score })}
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
                        {t("aiCenter.cortexaAI.knowledgeScore", "Knowledge Score")}
                        <HelpCircle size={13} />
                      </p>
                    </div>

                    <div className="cx-knowledge-health-list">
                      <div>
                        <CheckCircle2 size={16} />

                        <span>{t("aiCenter.cortexaAI.healthComplete", "Complete")}</span>

                        <strong>
                          {complete} / {total}
                        </strong>
                      </div>

                      <div>
                        <CheckCircle2 size={16} />

                        <span>{t("aiCenter.cortexaAI.healthUpToDate", "Up to date")}</span>

                        <strong>
                          {upToDate} / {total}
                        </strong>
                      </div>

                      <div>
                        <CheckCircle2 size={16} />

                        <span>{t("aiCenter.cortexaAI.healthWellStructured", "Well structured")}</span>

                        <strong>
                          {wellStructured} / {total}
                        </strong>
                      </div>

                      <div className="warning">
                        <Clock3 size={16} />

                        <span>{t("aiCenter.cortexaAI.healthNeedsReview", "Needs review")}</span>

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
            <h2>{t("aiCenter.cortexaAI.quickActions", "Quick Actions")}</h2>

            {[
              {
                key: "text",
                title: t("aiCenter.cortexaAI.qaTextTitle", "Add Text Knowledge"),
                description: t("aiCenter.cortexaAI.qaTextDesc", "Add text, notes or business information"),
                icon: FileText,
                accent: "purple",
              },
              {
                key: "document",
                title: t("aiCenter.cortexaAI.qaDocumentTitle", "Upload Document"),
                description: t("aiCenter.cortexaAI.qaDocumentDesc", "Import CSV or JSON knowledge files"),
                icon: Upload,
                accent: "blue",
              },
              {
                key: "website",
                title: t("aiCenter.cortexaAI.qaWebsiteTitle", "Add Website URL"),
                description: t("aiCenter.cortexaAI.qaWebsiteDesc", "Add content and reference a website"),
                icon: Search,
                accent: "indigo",
              },
              {
                key: "data_source",
                title: t("aiCenter.cortexaAI.qaDataSourceTitle", "Connect Data Source"),
                description: t("aiCenter.cortexaAI.qaDataSourceDesc", "Import knowledge from an external source"),
                icon: Database,
                accent: "purple",
              },
              {
                key: "qa",
                title: t("aiCenter.cortexaAI.qaQaTitle", "Create Custom Q&A"),
                description: t("aiCenter.cortexaAI.qaQaDesc", "Add a question and answer pair"),
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
  const { t } = useTranslation();
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
    item.title || t("aiCenter.cortexaAI.aiActivity", "AI Activity"),
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
    item.statusLabel || t("aiCenter.cortexaAI.statusCompleted", "Completed"),
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
          <h1>{t("aiCenter.cortexaAI.activityTitle", "Activity")}</h1>
          <p>{t("aiCenter.cortexaAI.activitySubtitle", "See everything your AI Agent has done across your business.")}</p>
        </div>
        <button
          type="button"
          className="cx-primary-outline"
          disabled={exporting}
          onClick={onExport}
          data-ai-write-action="true"
        >
          {exporting ? (
            <RefreshCw size={17} className="cx-ai-loading-spinner" />
          ) : (
            <Upload size={17} />
          )}

          {exporting
            ? t("aiCenter.cortexaAI.exporting", "Exporting...")
            : t("aiCenter.cortexaAI.exportActivity", "Export Activity")}
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
              <option value="all">{t("aiCenter.cortexaAI.allTypes", "All Types")}</option>
              <option value="messages">{t("aiCenter.cortexaAI.typeMessages", "Messages")}</option>
              <option value="appointments">{t("aiCenter.cortexaAI.typeAppointments", "Appointments")}</option>
              <option value="property_updates">{t("aiCenter.cortexaAI.typePropertyUpdates", "Property Updates")}</option>
              <option value="lead_updates">{t("aiCenter.cortexaAI.typeLeadUpdates", "Lead Updates")}</option>
              <option value="knowledge">{t("aiCenter.cortexaAI.typeKnowledge", "Knowledge")}</option>
              <option value="automations">{t("aiCenter.cortexaAI.typeAutomations", "Automations")}</option>
              <option value="alerts">{t("aiCenter.cortexaAI.typeAlerts", "Alerts")}</option>
              <option value="data_updates">{t("aiCenter.cortexaAI.typeDataUpdates", "Data Updates")}</option>
            </select>

            <select
              value={filters?.status || "all"}
              onChange={(event) =>
                onFilterChange({
                  status: event.target.value,
                })
              }
            >
              <option value="all">{t("aiCenter.cortexaAI.allStatusesCap", "All Statuses")}</option>
              <option value="success">{t("aiCenter.cortexaAI.statusCompleted", "Completed")}</option>
              <option value="failed">{t("aiCenter.cortexaAI.statusFailed", "Failed")}</option>
              <option value="escalated">{t("aiCenter.cortexaAI.statusEscalated", "Escalated")}</option>
              <option value="pending">{t("aiCenter.cortexaAI.statusPending", "Pending")}</option>
            </select>

            <label className="cx-activity-search">
              <Search size={17} />
              <input
                value={filters?.search || ""}
                placeholder={t("aiCenter.cortexaAI.searchActivityPlaceholder", "Search activity...")}
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
              {t("aiCenter.cortexaAI.refresh", "Refresh")}
            </button>
          </div>

          <div className="cx-white-card cx-timeline-card">
            <h4>{t("aiCenter.cortexaAI.recentAiActivity", "Recent AI Activity")}</h4>
            {error && <div className="cx-ai-error-banner">{error}</div>}
            {loading && items.length === 0 ? (
              <div className="cx-activity-empty">
                <RefreshCw className="cx-ai-loading-spinner" size={20} />
                {t("aiCenter.cortexaAI.loadingActivity", "Loading activity...")}
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
                      {item.timeLabel || formatRelativeTime(item.createdAt, t)}
                    </time>
                    <div className="cx-line-dot" />
                    <div className={`cx-small-icon ${item.accent || "purple"}`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <strong>{item.title || t("aiCenter.cortexaAI.aiActivity", "AI Activity")}</strong>
                      <p>
                        {item.description ||
                          item.summary ||
                          t("aiCenter.cortexaAI.activityRecorded", "AI Agent activity recorded.")}
                      </p>
                    </div>
                    <span
                      className={`cx-activity-status cx-status-pill ${status}`}
                    >
                      {item.statusLabel ||
                        (status === "success" ? t("aiCenter.cortexaAI.statusCompleted", "Completed") : status)}
                    </span>
                    <ChevronRight size={17} />
                  </div>
                );
              })
            ) : (
              <div className="cx-activity-empty">
                <Activity size={28} />
                <strong>{t("aiCenter.cortexaAI.noActivityFound", "No activity found")}</strong>
                <p>{t("aiCenter.cortexaAI.noActivityFoundDesc", "Try changing the filters or search.")}</p>
              </div>
            )}
            {totalPages > 1 && (
              <div className="cx-activity-pagination cx-pagination">
                <div className="cx-activity-pagination-info">
                  {t("aiCenter.cortexaAI.paginationInfo", "Showing {{start}}–{{end}} of {{total}} activities", {
                    start: startItem,
                    end: endItem,
                    total: totalItems,
                  })}
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
            <h2>{t("aiCenter.cortexaAI.activityOverview", "Activity Overview")}</h2>
            <div className="cx-overview-grid">
              <StatMini
                icon={Activity}
                title={t("aiCenter.cortexaAI.totalActivities", "Total Activities")}
                value={overview.total ?? activityData?.total ?? 0}
                desc={overview.trendLabel || t("aiCenter.cortexaAI.currentPeriod", "Current period")}
              />
              <StatMini
                icon={CircleCheck}
                title={t("aiCenter.cortexaAI.statusCompleted", "Completed")}
                value={overview.completed ?? 0}
                desc={overview.completedPercentLabel || "0%"}
              />
              <StatMini
                icon={TriangleAlert}
                title={t("aiCenter.cortexaAI.statusEscalated", "Escalated")}
                value={overview.escalated ?? 0}
                desc={overview.escalatedPercentLabel || "0%"}
              />
              <StatMini
                icon={CircleX}
                title={t("aiCenter.cortexaAI.statusFailed", "Failed")}
                value={overview.failed ?? 0}
                desc={overview.failedPercentLabel || "0%"}
              />
            </div>
          </div>

          <div className="cx-white-card">
            <h2>
              {t("aiCenter.cortexaAI.activityByType", "Activity by Type")}
              <button type="button" onClick={onViewActivityTypes}>
                {t("aiCenter.cortexaAI.viewAll", "View all")}
              </button>
            </h2>
            {activityTypesData.slice(0, 6).map((item, index) => {
              const Icon = item.icon || getActivityTypeIcon(item.label);

              return (
                <div
                  className="cx-bar-row has-icon"
                  key={`${item.label}-${index}`}
                  onClick={() =>
                    onFilterChange({
                      type: item.key || "all",
                      page: 1,
                    })
                  }
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
              {t("aiCenter.cortexaAI.topActions", "Top Actions")}
              <button type="button" onClick={onViewTopActions}>
                {t("aiCenter.cortexaAI.viewAll", "View all")}
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
              {t("aiCenter.cortexaAI.recentAiRuns", "Recent AI Runs")}
              <button
                type="button"
                onClick={onViewRecentRuns}
                disabled={recentRunsData.length === 0}
              >
                {t("aiCenter.cortexaAI.viewAll", "View all")}
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
                        {item.title || item.actionLabel || t("aiCenter.cortexaAI.aiRun", "AI Run")}
                      </strong>

                      <p>
                        {item.timeLabel ||
                          formatRelativeTime(item.createdAt || item.created_at, t)}
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
                        (status === "success" ? t("aiCenter.cortexaAI.statusCompleted", "Completed") : status)}
                    </em>
                  </button>
                );
              })
            ) : (
              <div className="cx-mini-empty">
                <Sparkles size={22} />

                <p>{t("aiCenter.cortexaAI.noRecentRuns", "No recent AI runs.")}</p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function ActivityDetailDrawer({ open, loading, activity, onClose }) {
  const { t } = useTranslation();
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
    t("aiCenter.cortexaAI.aiActivity", "AI Activity");

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
      label: t("aiCenter.cortexaAI.detailActivityId", "Activity ID"),
      value: data.id,
    },
    {
      label: t("aiCenter.cortexaAI.detailAction", "Action"),
      value: data.action || metadata.action,
    },
    {
      label: t("aiCenter.cortexaAI.detailType", "Type"),
      value: data.type || data.iconKey || metadata.type || metadata.category,
    },
    {
      label: t("aiCenter.cortexaAI.detailChannel", "Channel"),
      value: data.channel || metadata.channel,
    },
    {
      label: t("aiCenter.cortexaAI.detailCreated", "Created"),
      value: createdAt ? new Date(createdAt).toLocaleString() : "",
    },
    {
      label: t("aiCenter.cortexaAI.detailExecutionTime", "Execution time"),
      value:
        data.executionTimeMs ?? metadata.executionTimeMs ?? metadata.durationMs,
      suffix: " ms",
    },
    {
      label: t("aiCenter.cortexaAI.detailTokens", "Tokens"),
      value: data.tokens ?? metadata.tokens ?? metadata.totalTokens,
    },
    {
      label: t("aiCenter.cortexaAI.detailConfidence", "Confidence"),
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
      label: t("aiCenter.cortexaAI.relatedLead", "Lead"),
      value: data.leadName || metadata.leadName || metadata.lead_name,
    },
    {
      label: t("aiCenter.cortexaAI.relatedContact", "Contact"),
      value: data.contactName || metadata.contactName || metadata.contact_name,
    },
    {
      label: t("aiCenter.cortexaAI.relatedProperty", "Property"),
      value:
        data.propertyTitle ||
        metadata.propertyTitle ||
        metadata.property_title ||
        metadata.propertyAddress,
    },
    {
      label: t("aiCenter.cortexaAI.relatedAppointment", "Appointment"),
      value:
        data.appointmentTitle ||
        metadata.appointmentTitle ||
        metadata.appointment_title,
    },
    {
      label: t("aiCenter.cortexaAI.relatedConversation", "Conversation"),
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
              <p>{t("aiCenter.cortexaAI.aiActivity", "AI Activity")}</p>
              <h2>{title}</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("aiCenter.cortexaAI.closeActivityDetails", "Close activity details")}
          >
            <X size={20} />
          </button>
        </header>

        {loading ? (
          <div className="cx-activity-drawer-loading">
            <RefreshCw className="cx-ai-loading-spinner" size={22} />
            {t("aiCenter.cortexaAI.loadingActivityDetails", "Loading activity details...")}
          </div>
        ) : (
          <div className="cx-activity-drawer-body">
            <div className="cx-activity-detail-status">
              <span className={`cx-activity-status ${status}`}>
                {data.statusLabel ||
                  (status === "success" ? t("aiCenter.cortexaAI.statusCompleted", "Completed") : status)}
              </span>

              {createdAt && <time>{new Date(createdAt).toLocaleString()}</time>}
            </div>

            {description && (
              <section className="cx-activity-detail-section">
                <h3>{t("aiCenter.cortexaAI.summary", "Summary")}</h3>

                <p>{description}</p>
              </section>
            )}

            {detailRows.length > 0 && (
              <section className="cx-activity-detail-section">
                <h3>{t("aiCenter.cortexaAI.executionDetails", "Execution Details")}</h3>

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
                  <h3>{t("aiCenter.cortexaAI.prompt", "Prompt")}</h3>

                  <button type="button" onClick={() => copyText(prompt)}>
                    <Copy size={15} />
                    {t("aiCenter.cortexaAI.copy", "Copy")}
                  </button>
                </div>

                <div className="cx-activity-text-box">{prompt}</div>
              </section>
            )}

            {response && (
              <section className="cx-activity-detail-section">
                <div className="cx-activity-detail-title-row">
                  <h3>{t("aiCenter.cortexaAI.aiResponse", "AI Response")}</h3>

                  <button type="button" onClick={() => copyText(response)}>
                    <Copy size={15} />
                    {t("aiCenter.cortexaAI.copy", "Copy")}
                  </button>
                </div>

                <div className="cx-activity-text-box response">{response}</div>
              </section>
            )}

            {relatedRows.length > 0 && (
              <section className="cx-activity-detail-section">
                <h3>{t("aiCenter.cortexaAI.relatedRecords", "Related Records")}</h3>

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
                <summary>{t("aiCenter.cortexaAI.rawMetadata", "Raw Metadata")}</summary>

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
  const { t } = useTranslation();
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
              <h2>{title || t("aiCenter.cortexaAI.activitySummary", "Activity Summary")}</h2>

              <p>
                {rows.length === 1
                  ? t("aiCenter.cortexaAI.itemCountSingular", "{{count}} item", { count: rows.length })
                  : t("aiCenter.cortexaAI.itemCountPlural", "{{count}} items", { count: rows.length })}
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
                    <strong>{item.title || item.label || t("aiCenter.cortexaAI.aiActivity", "AI Activity")}</strong>

                    <p>
                      {type === "activity_types"
                        ? t("aiCenter.cortexaAI.percentOfActivity", "{{percent}}% of activity", { percent: Number(item.percent || 0) })
                        : item.description ||
                          item.timeLabel ||
                          formatRelativeTime(
                            item.createdAt || item.created_at,
                            t,
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

              <strong>{t("aiCenter.cortexaAI.noDataAvailable", "No data available")}</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
function ControlsLayout({
  controlTab,
  setControlTab,
  controlsData,
  onSave,
  onOpenAutomations,
  onEditBehavior,
}) {
  const { t } = useTranslation();
  const tabs = [
    { id: "General", label: t("aiCenter.cortexaAI.tabGeneral", "General") },
    { id: "Lead Handling", label: t("aiCenter.cortexaAI.tabLeadHandling", "Lead Handling") },
    { id: "Communication", label: t("aiCenter.cortexaAI.tabCommunication", "Communication") },
    { id: "Escalation", label: t("aiCenter.cortexaAI.tabEscalation", "Escalation") },
    { id: "Privacy & Safety", label: t("aiCenter.cortexaAI.tabPrivacySafety", "Privacy & Safety") },
    { id: "Advanced", label: t("aiCenter.cortexaAI.tabAdvanced", "Advanced") },
  ];

  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [responseToneOpen, setResponseToneOpen] = useState(false);

  useEffect(() => {
    if (controlsData) {
      setDraft(controlsData);
    }
  }, [controlsData]);

  const current = draft || controlsData || {};

  const capabilities =
    current?.capabilities && typeof current.capabilities === "object"
      ? current.capabilities
      : {};

  const quickControls =
    current?.quickControls && typeof current.quickControls === "object"
      ? current.quickControls
      : {};

  const responseToneOptions = [
    {
      value: "professional",
      label: t("aiCenter.cortexaAI.toneProfessionalLabel", "Professional & Friendly"),
      description: t("aiCenter.cortexaAI.toneProfessionalDesc", "Clear, polished and approachable communication."),
    },
    {
      value: "friendly",
      label: t("aiCenter.cortexaAI.toneFriendlyLabel", "Warm & Conversational"),
      description: t("aiCenter.cortexaAI.toneFriendlyDesc", "Relaxed, helpful and personable communication."),
    },
    {
      value: "sales",
      label: t("aiCenter.cortexaAI.toneSalesLabel", "Sales Focused"),
      description: t("aiCenter.cortexaAI.toneSalesDesc", "Confident communication focused on conversion."),
    },
  ];

  const generalCapabilities = [
    {
      key: "autoReplyToLeads",
      title: t("aiCenter.cortexaAI.capAutoReplyTitle", "Auto Reply to Leads"),
      description: t("aiCenter.cortexaAI.capAutoReplyDesc", "Automatically respond to new leads via WhatsApp, SMS, and email"),
      icon: MessageCircle,
      accent: "green",
      defaultValue: true,
    },
    {
      key: "leadQualification",
      title: t("aiCenter.cortexaAI.capLeadQualificationTitle", "Lead Qualification"),
      description: t("aiCenter.cortexaAI.capLeadQualificationDesc", "Qualify leads and score their interest automatically"),
      icon: Users,
      accent: "purple",
      defaultValue: true,
    },
    {
      key: "appointmentBooking",
      title: t("aiCenter.cortexaAI.capAppointmentBookingTitle", "Appointment Booking"),
      description: t("aiCenter.cortexaAI.capAppointmentBookingDesc", "Book and manage appointments automatically"),
      icon: CalendarDays,
      accent: "orange",
      defaultValue: true,
    },
    {
      key: "propertyRecommendations",
      title: t("aiCenter.cortexaAI.capPropertyRecsTitle", "Property Recommendations"),
      description: t("aiCenter.cortexaAI.capPropertyRecsDesc", "Suggest properties based on buyer preferences"),
      icon: Home,
      accent: "blue",
      defaultValue: true,
    },
    {
      key: "followUpAutomation",
      title: t("aiCenter.cortexaAI.capFollowUpTitle", "Follow-up Automation"),
      description: t("aiCenter.cortexaAI.capFollowUpDesc", "Send follow-up messages and reminders"),
      icon: Send,
      accent: "blue",
      defaultValue: true,
    },
    {
      key: "leadScoring",
      title: t("aiCenter.cortexaAI.capLeadScoringTitle", "Lead Scoring"),
      description: t("aiCenter.cortexaAI.capLeadScoringDesc", "Score leads based on engagement and behavior"),
      icon: Star,
      accent: "red",
      defaultValue: true,
    },
    {
      key: "humanApprovalHighValue",
      title: t("aiCenter.cortexaAI.capHumanApprovalTitle", "Human Approval for High Value"),
      description: t("aiCenter.cortexaAI.capHumanApprovalDesc", "Require approval before sending high-value proposals"),
      icon: ShieldCheck,
      accent: "orange",
      defaultValue: true,
    },
    {
      key: "autoEscalationHotLeads",
      title: t("aiCenter.cortexaAI.capAutoEscalationTitle", "Auto Escalation for Hot Leads"),
      description: t("aiCenter.cortexaAI.capAutoEscalationDesc", "Automatically escalate hot leads to you or your team"),
      icon: TriangleAlert,
      accent: "red",
      defaultValue: true,
    },
    {
      key: "marketingCampaigns",
      title: t("aiCenter.cortexaAI.capMarketingTitle", "Marketing Campaigns"),
      description: t("aiCenter.cortexaAI.capMarketingDesc", "Create and send marketing campaigns"),
      icon: Bell,
      accent: "blue",
      defaultValue: false,
    },
    {
      key: "smartInsights",
      title: t("aiCenter.cortexaAI.capSmartInsightsTitle", "Smart Insights & Alerts"),
      description: t("aiCenter.cortexaAI.capSmartInsightsDesc", "Generate insights and important alerts"),
      icon: Bell,
      accent: "blue",
      defaultValue: true,
    },
  ];

  const leadHandlingSettings = [
    {
      key: "autoReplyToLeads",
      title: t("aiCenter.cortexaAI.lhAutoReplyTitle", "Auto Reply to New Leads"),
      description: t("aiCenter.cortexaAI.lhAutoReplyDesc", "Immediately respond when a new lead contacts your business"),
      icon: MessageCircle,
      accent: "green",
      defaultValue: true,
    },
    {
      key: "leadQualification",
      title: t("aiCenter.cortexaAI.lhLeadQualificationTitle", "Lead Qualification"),
      description: t("aiCenter.cortexaAI.lhLeadQualificationDesc", "Ask qualifying questions and identify lead intent"),
      icon: UserRoundCheck,
      accent: "purple",
      defaultValue: true,
    },
    {
      key: "leadScoring",
      title: t("aiCenter.cortexaAI.lhLeadScoringTitle", "Automatic Lead Scoring"),
      description: t("aiCenter.cortexaAI.lhLeadScoringDesc", "Update scores using engagement and buyer behavior"),
      icon: Star,
      accent: "orange",
      defaultValue: true,
    },
    {
      key: "propertyRecommendations",
      title: t("aiCenter.cortexaAI.lhPropertyRecsTitle", "Property Recommendations"),
      description: t("aiCenter.cortexaAI.lhPropertyRecsDesc", "Recommend relevant properties based on buyer criteria"),
      icon: Home,
      accent: "blue",
      defaultValue: true,
    },
    {
      key: "appointmentBooking",
      title: t("aiCenter.cortexaAI.lhAppointmentBookingTitle", "Appointment Booking"),
      description: t("aiCenter.cortexaAI.lhAppointmentBookingDesc", "Allow the AI Agent to book appointments automatically"),
      icon: CalendarDays,
      accent: "green",
      defaultValue: true,
    },
    {
      key: "followUpAutomation",
      title: t("aiCenter.cortexaAI.lhFollowUpTitle", "Automatic Follow-up"),
      description: t("aiCenter.cortexaAI.lhFollowUpDesc", "Send follow-ups when leads have not responded"),
      icon: Send,
      accent: "purple",
      defaultValue: true,
    },
  ];

  const communicationSettings = [
    {
      key: "useBusinessGreeting",
      title: t("aiCenter.cortexaAI.commGreetingTitle", "Use Business Greeting"),
      description: t("aiCenter.cortexaAI.commGreetingDesc", "Start conversations using the configured business greeting"),
      icon: MessageSquare,
      accent: "purple",
      defaultValue: true,
    },
    {
      key: "useConversationClosing",
      title: t("aiCenter.cortexaAI.commClosingTitle", "Use Conversation Closing"),
      description: t("aiCenter.cortexaAI.commClosingDesc", "End completed conversations with a professional closing"),
      icon: CheckCircle2,
      accent: "green",
      defaultValue: true,
    },
    {
      key: "allowEmoji",
      title: t("aiCenter.cortexaAI.commEmojiTitle", "Allow Emojis"),
      description: t("aiCenter.cortexaAI.commEmojiDesc", "Use appropriate emojis in friendly conversations"),
      icon: Heart,
      accent: "orange",
      defaultValue: true,
    },
    {
      key: "conciseResponses",
      title: t("aiCenter.cortexaAI.commConciseTitle", "Concise Responses"),
      description: t("aiCenter.cortexaAI.commConciseDesc", "Prefer shorter replies unless more detail is required"),
      icon: FileText,
      accent: "blue",
      defaultValue: true,
    },
    {
      key: "whatsappCommunication",
      title: t("aiCenter.cortexaAI.commWhatsappTitle", "WhatsApp Communication"),
      description: t("aiCenter.cortexaAI.commWhatsappDesc", "Allow responses through the connected WhatsApp account"),
      icon: MessageCircle,
      accent: "green",
      defaultValue: true,
    },
    {
      key: "emailCommunication",
      title: t("aiCenter.cortexaAI.commEmailTitle", "Email Communication"),
      description: t("aiCenter.cortexaAI.commEmailDesc", "Allow AI-assisted emails and follow-up messages"),
      icon: Mail,
      accent: "purple",
      defaultValue: false,
    },
  ];

  const escalationSettings = [
    {
      key: "autoEscalationHotLeads",
      title: t("aiCenter.cortexaAI.escHotLeadsTitle", "Escalate Hot Leads"),
      description: t("aiCenter.cortexaAI.escHotLeadsDesc", "Notify the team when a lead reaches the hot-lead threshold"),
      icon: Zap,
      accent: "orange",
      defaultValue: true,
    },
    {
      key: "humanApprovalHighValue",
      title: t("aiCenter.cortexaAI.escHumanApprovalTitle", "Human Approval for High-value Actions"),
      description: t("aiCenter.cortexaAI.escHumanApprovalDesc", "Require approval before sensitive or high-value actions"),
      icon: ShieldCheck,
      accent: "purple",
      defaultValue: true,
    },
    {
      key: "escalateNegativeSentiment",
      title: t("aiCenter.cortexaAI.escNegativeSentimentTitle", "Escalate Negative Sentiment"),
      description: t("aiCenter.cortexaAI.escNegativeSentimentDesc", "Hand off angry or dissatisfied customers to a human"),
      icon: TriangleAlert,
      accent: "red",
      defaultValue: true,
    },
    {
      key: "escalatePricingRequests",
      title: t("aiCenter.cortexaAI.escPricingTitle", "Escalate Pricing Exceptions"),
      description: t("aiCenter.cortexaAI.escPricingDesc", "Require review for discounts and pricing exceptions"),
      icon: BriefcaseBusiness,
      accent: "blue",
      defaultValue: true,
    },
    {
      key: "escalateLegalRequests",
      title: t("aiCenter.cortexaAI.escLegalTitle", "Escalate Legal Requests"),
      description: t("aiCenter.cortexaAI.escLegalDesc", "Require human review for legal or compliance questions"),
      icon: ShieldCheck,
      accent: "orange",
      defaultValue: true,
    },
    {
      key: "notifyTeamOnEscalation",
      title: t("aiCenter.cortexaAI.escNotifyTeamTitle", "Notify Team Immediately"),
      description: t("aiCenter.cortexaAI.escNotifyTeamDesc", "Send an alert whenever a conversation is escalated"),
      icon: Bell,
      accent: "green",
      defaultValue: true,
    },
  ];

  const privacySettings = [
    {
      key: "piiProtection",
      title: t("aiCenter.cortexaAI.privPiiTitle", "PII Protection"),
      description: t("aiCenter.cortexaAI.privPiiDesc", "Protect phone numbers, emails and personal information"),
      icon: ShieldCheck,
      accent: "purple",
      defaultValue: true,
    },
    {
      key: "hideSensitiveData",
      title: t("aiCenter.cortexaAI.privHideDataTitle", "Hide Sensitive CRM Data"),
      description: t("aiCenter.cortexaAI.privHideDataDesc", "Avoid exposing private CRM information in responses"),
      icon: Lock,
      accent: "blue",
      defaultValue: true,
    },
    {
      key: "blockFinancialAdvice",
      title: t("aiCenter.cortexaAI.privBlockFinancialTitle", "Block Financial Advice"),
      description: t("aiCenter.cortexaAI.privBlockFinancialDesc", "Prevent AI from presenting financial guidance as professional advice"),
      icon: TriangleAlert,
      accent: "orange",
      defaultValue: true,
    },
    {
      key: "blockLegalAdvice",
      title: t("aiCenter.cortexaAI.privBlockLegalTitle", "Block Legal Advice"),
      description: t("aiCenter.cortexaAI.privBlockLegalDesc", "Prevent AI from presenting legal guidance as professional advice"),
      icon: ShieldCheck,
      accent: "red",
      defaultValue: true,
    },
    {
      key: "requireApprovalSensitiveActions",
      title: t("aiCenter.cortexaAI.privApprovalTitle", "Approval for Sensitive Actions"),
      description: t("aiCenter.cortexaAI.privApprovalDesc", "Require human approval before risky CRM changes"),
      icon: UserRoundCheck,
      accent: "green",
      defaultValue: true,
    },
    {
      key: "storeConversationLogs",
      title: t("aiCenter.cortexaAI.privStoreLogsTitle", "Store Conversation Logs"),
      description: t("aiCenter.cortexaAI.privStoreLogsDesc", "Keep AI conversation logs for audits and quality review"),
      icon: Database,
      accent: "purple",
      defaultValue: true,
    },
  ];

  const advancedSettings = [
    {
      key: "smartInsights",
      title: t("aiCenter.cortexaAI.advInsightsTitle", "Smart Insights & Alerts"),
      description: t("aiCenter.cortexaAI.advInsightsDesc", "Generate proactive CRM insights and recommendations"),
      icon: Sparkles,
      accent: "purple",
      defaultValue: true,
    },
    {
      key: "knowledgeGrounding",
      title: t("aiCenter.cortexaAI.advGroundingTitle", "Knowledge Grounding"),
      description: t("aiCenter.cortexaAI.advGroundingDesc", "Prioritize verified Knowledge items when responding"),
      icon: BookOpen,
      accent: "blue",
      defaultValue: true,
    },
    {
      key: "conversationMemory",
      title: t("aiCenter.cortexaAI.advMemoryTitle", "Conversation Memory"),
      description: t("aiCenter.cortexaAI.advMemoryDesc", "Use previous messages from the same conversation as context"),
      icon: Database,
      accent: "green",
      defaultValue: true,
    },
    {
      key: "automaticRetry",
      title: t("aiCenter.cortexaAI.advRetryTitle", "Automatic Retry"),
      description: t("aiCenter.cortexaAI.advRetryDesc", "Retry failed AI requests when the error is temporary"),
      icon: RefreshCw,
      accent: "orange",
      defaultValue: true,
    },
    {
      key: "activityLogging",
      title: t("aiCenter.cortexaAI.advLoggingTitle", "Detailed Activity Logging"),
      description: t("aiCenter.cortexaAI.advLoggingDesc", "Record AI activity for auditing and debugging"),
      icon: Activity,
      accent: "purple",
      defaultValue: true,
    },
    {
      key: "marketingCampaigns",
      title: t("aiCenter.cortexaAI.advMarketingTitle", "Marketing Campaigns"),
      description: t("aiCenter.cortexaAI.advMarketingDesc", "Allow AI to prepare marketing campaign content"),
      icon: Sparkles,
      accent: "green",
      defaultValue: false,
    },
  ];

  const setCapabilityValue = (key, value) => {
    setDraft((previous) => {
      const base = previous || controlsData || {};

      return {
        ...base,
        capabilities: {
          ...(base.capabilities || {}),
          [key]: value,
        },
      };
    });
  };

  const toggleCapability = (key, fallback = false) => {
    const enabled = capabilities[key] ?? fallback;

    setCapabilityValue(key, !Boolean(enabled));
  };

  const toggleQuickControl = (key, fallback = false) => {
    const enabled = quickControls[key] ?? fallback;

    setDraft((previous) => {
      const base = previous || controlsData || {};

      return {
        ...base,
        quickControls: {
          ...(base.quickControls || {}),
          [key]: !Boolean(enabled),
        },
      };
    });
  };

  const selectResponseTone = (value) => {
    const option = responseToneOptions.find((item) => item.value === value);

    setDraft((previous) => ({
      ...(previous || controlsData || {}),
      responseTone: value,
      responseToneLabel: option?.label || value,
    }));

    setResponseToneOpen(false);
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setSaveError("");
    try {
      const saved = await onSave({
        responseTone: current?.responseTone || "professional",
        capabilities: current?.capabilities || {},
        quickControls: current?.quickControls || {},
      });

      setDraft(saved);
    } catch (error) {
      console.error("SAVE AI CONTROLS FAILED:", error);
      setSaveError(
        error?.response?.data?.message ||
          error?.message ||
          t("aiCenter.cortexaAI.errorSaveControls", "Unable to save AI controls."),
      );
    } finally {
      setSaving(false);
    }
  };

  const responseTone =
    responseToneOptions.find(
      (item) => item.value === (current?.responseTone || "professional"),
    ) || responseToneOptions[0];

  const automationRules = Array.isArray(current?.automationRules)
    ? current.automationRules
    : Array.isArray(current?.automations)
      ? current.automations
      : [];

  const visibleAutomationRules = automationRules.slice(0, 4);

  const renderSettingsCard = ({ title, description, items }) => (
    <div className="cx-white-card">
      <div className="cx-control-section-head">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>

      <div className="cx-capability-list">
        {items.map((item) => {
          const Icon = item.icon;

          const enabled = capabilities[item.key] ?? item.defaultValue;

          return (
            <div className="cx-capability-row" key={item.key}>
              <div className={`cx-small-icon ${item.accent}`}>
                <Icon size={21} />
              </div>

              <div>
                <strong>{item.title}</strong>

                <p>{item.description}</p>
              </div>

              <button
                type="button"
                className={`cx-switch ${enabled ? "on" : ""}`}
                onClick={() => toggleCapability(item.key, item.defaultValue)}
                aria-pressed={enabled}
              >
                <i />
              </button>

              <ChevronRight size={18} />
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="cx-ai-page">
      <div className="cx-ai-page-head">
        <div>
          <h1>{t("aiCenter.cortexaAI.controlsTitle", "Controls")}</h1>

          <p>
            {t("aiCenter.cortexaAI.controlsSubtitle", "Manage your AI Agent’s behavior, preferences and automation settings.")}
          </p>
        </div>

        <button
          type="button"
          className="cx-primary-btn slim"
          onClick={handleSave}
          disabled={saving}
          data-ai-write-action="true"
        >
          {saving ? (
            <RefreshCw size={16} className="cx-ai-loading-spinner" />
          ) : (
            <Save size={16} />
          )}

          {saving
            ? t("aiCenter.cortexaAI.saving", "Saving...")
            : t("aiCenter.cortexaAI.saveChanges", "Save Changes")}
        </button>
      </div>

      <div className="cx-control-tabs">
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab.id}
            className={controlTab === tab.id ? "active" : ""}
            onClick={() => setControlTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {saveError && <div className="cx-ai-error-banner">{saveError}</div>}

      <div className="cx-two-col">
        <main>
          {controlTab === "General" && (
            <>
              {renderSettingsCard({
                title: t("aiCenter.cortexaAI.agentCapabilitiesTitle", "AI Agent Capabilities"),
                description: t("aiCenter.cortexaAI.agentCapabilitiesDesc", "Enable or disable features your AI Agent can perform."),
                items: generalCapabilities,
              })}

              <div className="cx-white-card cx-behavior-summary">
                <div className="cx-control-card-head">
                  <div>
                    <h2>{t("aiCenter.cortexaAI.behaviorSummaryTitle", "AI Behavior Summary")}</h2>

                    <p>
                      {t("aiCenter.cortexaAI.behaviorSummaryDesc", "Your AI Agent is set to be proactive, helpful, and always put your leads first.")}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="cx-primary-outline"
                    onClick={onEditBehavior}
                    data-ai-write-action="true"
                  >
                    <PenLine size={16} />
                    {t("aiCenter.cortexaAI.editBehavior", "Edit Behavior")}
                  </button>
                </div>

                <div className="cx-behavior-tags">
                  {[
                    { id: "proactive", label: t("aiCenter.cortexaAI.tagProactive", "Proactive") },
                    { id: "helpful", label: t("aiCenter.cortexaAI.tagHelpful", "Helpful") },
                    { id: "fastResponse", label: t("aiCenter.cortexaAI.tagFastResponse", "Fast Response") },
                    { id: "humanLike", label: t("aiCenter.cortexaAI.tagHumanLike", "Human-like") },
                    { id: "leadFocused", label: t("aiCenter.cortexaAI.tagLeadFocused", "Lead-focused") },
                  ].map((tag) => (
                    <span key={tag.id}>
                      <Check size={14} />
                      {tag.label}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          {controlTab === "Lead Handling" &&
            renderSettingsCard({
              title: t("aiCenter.cortexaAI.tabLeadHandling", "Lead Handling"),
              description: t("aiCenter.cortexaAI.leadHandlingDesc", "Control how your AI Agent qualifies, scores and follows up with leads."),
              items: leadHandlingSettings,
            })}

          {controlTab === "Communication" &&
            renderSettingsCard({
              title: t("aiCenter.cortexaAI.tabCommunication", "Communication"),
              description: t("aiCenter.cortexaAI.communicationDesc", "Configure how your AI Agent communicates across channels."),
              items: communicationSettings,
            })}

          {controlTab === "Escalation" &&
            renderSettingsCard({
              title: t("aiCenter.cortexaAI.tabEscalation", "Escalation"),
              description: t("aiCenter.cortexaAI.escalationDesc", "Define when your AI Agent should hand conversations to your team."),
              items: escalationSettings,
            })}

          {controlTab === "Privacy & Safety" &&
            renderSettingsCard({
              title: t("aiCenter.cortexaAI.tabPrivacySafety", "Privacy & Safety"),
              description: t("aiCenter.cortexaAI.privacyDesc", "Protect sensitive data and restrict risky AI actions."),
              items: privacySettings,
            })}

          {controlTab === "Advanced" &&
            renderSettingsCard({
              title: t("aiCenter.cortexaAI.tabAdvanced", "Advanced"),
              description: t("aiCenter.cortexaAI.advancedDesc", "Configure advanced performance and diagnostic behavior."),
              items: advancedSettings,
            })}
        </main>

        <aside className="cx-right-column control">
          <div className="cx-white-card">
            <h2>
              {t("aiCenter.cortexaAI.agentStatusTitle", "AI Agent Status")}
              <em className={current?.agentStatus === "paused" ? "paused" : ""}>
                {current?.agentStatus === "paused"
                  ? t("aiCenter.cortexaAI.statusPaused", "Paused")
                  : t("aiCenter.cortexaAI.statusActive", "Active")}
              </em>
            </h2>

            <div className="cx-overview-grid">
              <StatMini
                title={t("aiCenter.cortexaAI.metricResponsesToday", "Responses Today")}
                value={current?.metrics?.responsesToday ?? 0}
                desc={t("aiCenter.cortexaAI.today", "Today")}
              />

              <StatMini
                title={t("aiCenter.cortexaAI.metricAppointmentsBooked", "Appointments Booked")}
                value={current?.metrics?.appointmentsBooked ?? 0}
                desc={t("aiCenter.cortexaAI.today", "Today")}
              />

              <StatMini
                title={t("aiCenter.cortexaAI.metricLeadsHandled", "Leads Handled")}
                value={current?.metrics?.leadsHandled ?? 0}
                desc={t("aiCenter.cortexaAI.today", "Today")}
              />

              <StatMini
                title={t("aiCenter.cortexaAI.metricAvgResponseTime", "Avg. Response Time")}
                value={current?.metrics?.avgResponseTime || "—"}
                desc={t("aiCenter.cortexaAI.currentAverage", "Current average")}
              />
            </div>
          </div>

          <div className="cx-white-card cx-response-tone-card">
            <h2>{t("aiCenter.cortexaAI.responseTone", "Response Tone")}</h2>

            <p>{t("aiCenter.cortexaAI.responseToneDesc", "How your AI Agent communicates")}</p>

            <div className="cx-response-tone-select">
              <button
                type="button"
                className={`cx-select-btn ${responseToneOpen ? "open" : ""}`}
                onClick={() => setResponseToneOpen((value) => !value)}
              >
                <span>
                  <strong>{responseTone.label}</strong>

                  <small>{responseTone.description}</small>
                </span>

                {responseToneOpen ? (
                  <ChevronUp size={18} />
                ) : (
                  <ChevronDown size={18} />
                )}
              </button>

              {responseToneOpen && (
                <div className="cx-response-tone-menu">
                  {responseToneOptions.map((option) => {
                    const selected = option.value === responseTone.value;

                    return (
                      <button
                        type="button"
                        key={option.value}
                        className={selected ? "selected" : ""}
                        onClick={() => selectResponseTone(option.value)}
                      >
                        <div>
                          <strong>{option.label}</strong>

                          <p>{option.description}</p>
                        </div>

                        {selected && <Check size={17} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="cx-white-card">
            <h2>{t("aiCenter.cortexaAI.quickControls", "Quick Controls")}</h2>

            {[
              {
                key: "pauseAiAgent",
                title: t("aiCenter.cortexaAI.qcPauseTitle", "Pause AI Agent"),
                description: t("aiCenter.cortexaAI.qcPauseDesc", "Temporarily pause all AI actions"),
                icon: PauseCircle,
                accent: "red",
                defaultValue: false,
              },
              {
                key: "doNotDisturb",
                title: t("aiCenter.cortexaAI.qcDndTitle", "Do Not Disturb"),
                description: t("aiCenter.cortexaAI.qcDndDesc", "Silence notifications after hours"),
                icon: Moon,
                accent: "blue",
                defaultValue: true,
              },
              {
                key: "workingHoursOnly",
                title: t("aiCenter.cortexaAI.qcWorkingHoursTitle", "Working Hours Only"),
                description: t("aiCenter.cortexaAI.qcWorkingHoursDesc", "9:00 AM - 6:00 PM (Mon - Fri)"),
                icon: Timer,
                accent: "green",
                defaultValue: true,
              },
              {
                key: "weekendsActive",
                title: t("aiCenter.cortexaAI.qcWeekendsTitle", "Weekends Active"),
                description: t("aiCenter.cortexaAI.qcWeekendsDesc", "Allow AI to work on weekends"),
                icon: CalendarDays,
                accent: "orange",
                defaultValue: false,
              },
            ].map((item) => {
              const Icon = item.icon;

              const enabled = quickControls[item.key] ?? item.defaultValue;

              return (
                <div className="cx-quick-control" key={item.key}>
                  <div className={`cx-quick-control-icon ${item.accent}`}>
                    <Icon size={18} />
                  </div>

                  <div className="cx-quick-control-content">
                    <strong>{item.title}</strong>

                    <p>{item.description}</p>
                  </div>

                  <button
                    type="button"
                    className={`cx-switch ${enabled ? "on" : ""}`}
                    onClick={() =>
                      toggleQuickControl(item.key, item.defaultValue)
                    }
                    aria-pressed={enabled}
                    data-ai-write-action="true"
                  >
                    <i />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="cx-white-card">
            <h2>
              {t("aiCenter.cortexaAI.automationRules", "Automation Rules")}
              <button
                type="button"
                onClick={onOpenAutomations}
                data-ai-write-action="true"
              >
                {t("aiCenter.cortexaAI.manageRules", "Manage Rules")}
              </button>
            </h2>

            {visibleAutomationRules.length > 0 ? (
              visibleAutomationRules.map((rule, index) => {
                const enabled = rule.enabled !== false && rule.active !== false;

                return (
                  <div
                    className="cx-rule-row"
                    key={rule.id || rule.key || `${rule.title}-${index}`}
                  >
                    {enabled ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <CircleX size={16} />
                    )}

                    <span>
                      {rule.title ||
                        rule.label ||
                        rule.name ||
                        t("aiCenter.cortexaAI.automationRuleFallback", "Automation rule")}
                    </span>

                    <em className={enabled ? "enabled" : "disabled"}>
                      {enabled
                        ? t("aiCenter.cortexaAI.enabled", "Enabled")
                        : t("aiCenter.cortexaAI.disabled", "Disabled")}
                    </em>
                  </div>
                );
              })
            ) : (
              <div className="cx-mini-empty">
                <Zap size={22} />

                <p>{t("aiCenter.cortexaAI.noAutomationRules", "No automation rules configured.")}</p>
              </div>
            )}

            <button
              type="button"
              className="cx-show-more"
              onClick={onOpenAutomations}
              data-ai-write-action="true"
            >
              {t("aiCenter.cortexaAI.viewAllRules", "View All Rules")}
              <ChevronRight size={16} />
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
function ControlTabCard({ title, description, children }) {
  return (
    <div className="cx-controls-tab-content">
      <div className="cx-white-card">
        <div className="cx-control-section-head">
          <div>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
        </div>
        <div className="cx-control-settings-list">{children}</div>
      </div>
    </div>
  );
}

function GlanceCard({ data = {} }) {
  const { t } = useTranslation();
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
        {t("aiCenter.cortexaAI.agentAtGlance", "AI Agent at a glance")}
        <em className={status === "paused" ? "paused" : ""}>
          <i />

          {status === "paused"
            ? t("aiCenter.cortexaAI.statusPaused", "Paused")
            : t("aiCenter.cortexaAI.statusLive", "Live")}
        </em>
      </h2>

      <div className="cx-glance-grid">
        <StatMini
          icon={MessageSquare}
          title={t("aiCenter.cortexaAI.glanceConversations", "Conversations")}
          value={conversations}
          desc={t("aiCenter.cortexaAI.today", "Today")}
        />

        <StatMini
          icon={Users}
          title={t("aiCenter.cortexaAI.glanceLeadsContacted", "Leads Contacted")}
          value={leadsContacted}
          desc={t("aiCenter.cortexaAI.today", "Today")}
        />

        <StatMini
          icon={CalendarDays}
          title={t("aiCenter.cortexaAI.metricAppointmentsBooked", "Appointments Booked")}
          value={appointmentsBooked}
          desc={t("aiCenter.cortexaAI.today", "Today")}
        />

        <StatMini
          icon={Home}
          title={t("aiCenter.cortexaAI.glancePropertiesShared", "Properties Shared")}
          value={propertiesShared}
          desc={t("aiCenter.cortexaAI.today", "Today")}
        />
      </div>
    </div>
  );
}

const formatRelativeTime = (value, t) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  const tr = typeof t === "function" ? t : (key, def) => def;
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) {
    return tr("aiCenter.cortexaAI.timeJustNow", "Just now");
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return tr("aiCenter.cortexaAI.timeMinutesAgo", "{{count}}m ago", { count: minutes });
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return tr("aiCenter.cortexaAI.timeHoursAgo", "{{count}}h ago", { count: hours });
  }
  const days = Math.floor(hours / 24);
  return tr("aiCenter.cortexaAI.timeDaysAgo", "{{count}}d ago", { count: days });
};

function PriorityTasks({ tasks = [], onViewAll }) {
  const { t } = useTranslation();
  const rows = Array.isArray(tasks) ? tasks : [];

  return (
    <div className="cx-white-card">
      <h2>
        {t("aiCenter.cortexaAI.priorityTasks", "Priority Tasks")}
        {rows.length > 0 && (
          <button type="button" onClick={onViewAll}>
            {t("aiCenter.cortexaAI.viewAll", "View all")}
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
                <strong>{task.title || t("aiCenter.cortexaAI.priorityTaskFallback", "Priority task")}</strong>
                <p>
                  {task.typeLabel || task.type || t("aiCenter.cortexaAI.taskFallback", "Task")}
                  {task.createdAt || task.dueAt ? (
                    <>
                      {" · "}
                      {formatRelativeTime(task.createdAt || task.dueAt, t)}
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
          <p>{t("aiCenter.cortexaAI.noPriorityTasks", "No priority tasks right now.")}</p>
        </div>
      )}
    </div>
  );
}

function RecentActivityMini({ items = [], onViewAll }) {
  const { t } = useTranslation();
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
        {t("aiCenter.cortexaAI.recentActivity", "Recent Activity")}
        {rows.length > 0 && (
          <button type="button" onClick={onViewAll}>
            {t("aiCenter.cortexaAI.viewAll", "View all")}
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
                <strong>{item.title || item.label || t("aiCenter.cortexaAI.aiActivityLower", "AI activity")}</strong>
                <p>{item.timeLabel || formatRelativeTime(item.createdAt, t)}</p>
              </div>
            </div>
          );
        })
      ) : (
        <div className="cx-mini-empty">
          <Activity size={22} />
          <p>{t("aiCenter.cortexaAI.noRecentActivity", "No recent AI activity.")}</p>
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
