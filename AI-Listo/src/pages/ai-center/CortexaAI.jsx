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
} from "lucide-react";

import apiClient from "../../api/apiClient";
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

export default function CortexaAI() {
  const [activePage, setActivePage] = useState("setup");
  const [openStep, setOpenStep] = useState(1);
  const [message, setMessage] = useState("");
  const [controlTab, setControlTab] = useState("General");

  const [setupData, setSetupData] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [knowledgeData, setKnowledgeData] = useState(null);
  const [activityData, setActivityData] = useState(null);
  const [controlsData, setControlsData] = useState(null);

  const [loadingSetup, setLoadingSetup] = useState(true);
  const [loadingPage, setLoadingPage] = useState(false);
  const [pageError, setPageError] = useState("");

  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [sendingMessage, setSendingMessage] = useState(false);

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
  const loadSetup = React.useCallback(async () => {
    setLoadingSetup(true);
    setPageError("");

    try {
      const data = await request("/ai-center/agent/setup");
      setSetupData(data);

      if (data?.isSetupComplete) {
        setActivePage((current) => (current === "setup" ? "chat" : current));
      }
      if (data?.appointmentRules) {
        setAppointmentRules(data.appointmentRules);
      }
    } catch (error) {
      console.error("LOAD AI SETUP FAILED:", error);

      setPageError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load AI Agent setup.",
      );
    } finally {
      setLoadingSetup(false);
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

      await loadSetup();

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
      await loadSetup();
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

      await loadSetup();

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

      await loadSetup();

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

  const openAgentTest = async () => {
    setTestAgentOpen(true);
    await loadAgentTest();
  };

  const runAgentTest = async (message) => {
    setTestAgentSending(true);
    setTestAgentError("");

    try {
      const response = await aiAgentSetupService.runAgentTest(message);

      await loadAgentTest();
      await loadSetup();

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
          data = await request("/ai-center/agent/dashboard");
          if (!cancelled) setDashboardData(data);
        }

        if (activePage === "knowledge") {
          data = await request("/ai-center/agent/knowledge");
          if (!cancelled) setKnowledgeData(data);
        }

        if (activePage === "activity") {
          data = await request(
            "/ai-center/agent/activity-feed?page=1&limit=25&type=all&status=all",
          );
          if (!cancelled) setActivityData(data);
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
  }, [activePage, setupData?.isSetupComplete]);

  const sendChatMessage = async (text) => {
    const cleanMessage = String(text || "").trim();
    if (!cleanMessage || sendingMessage) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: cleanMessage,
    };

    setMessages((current) => [...current, userMessage]);
    setMessage("");
    setSendingMessage(true);

    try {
      const response = await request("/ai-center/agent", {
        method: "POST",
        body: JSON.stringify({
          message: cleanMessage,
          conversationId,
        }),
      });

      setConversationId(response?.conversationId || null);
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: response?.answer || "No response returned.",
        },
      ]);

      const refreshed = await request("/ai-center/agent/dashboard");
      setDashboardData(refreshed);
    } catch (error) {
      console.error("AI CHAT FAILED:", error);
      setMessages((current) => [
        ...current,
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
    } finally {
      setSendingMessage(false);
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
      title: "AI Knowledge",
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

      await loadSetup();

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

  if (!setupData?.isSetupComplete) {
    return (
      <>
        {pageError && <div className="cx-ai-error-banner">{pageError}</div>}

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
        />

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
          onClose={() => setAppointmentRulesOpen(false)}
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
          onSend={runAgentTest}
        />
      </>
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
    <div className="cx-ai-shell">
      <aside className="cx-agent-sidebar">
        <div className="cx-agent-brand">
          <div className="cx-agent-bot">
            <Bot size={24} />
          </div>
          <div>
            <h2>AI Agent</h2>
            <span>
              <i /> {setupData?.agentStatus === "paused" ? "Paused" : "Active"}
            </span>
          </div>
        </div>

        <nav className="cx-agent-menu">
          {agentMenus.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.key}
                className={activePage === item.key ? "active" : ""}
                onClick={() => setActivePage(item.key)}
              >
                <Icon size={18} />
                <div>
                  <strong>{item.title}</strong>
                  <small>{item.desc}</small>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="cx-agent-status-card">
          <h3>AI Agent Status</h3>
          <p className="online">
            <i /> {setupData?.agentStatus === "paused" ? "Paused" : "Online"}
          </p>
          <p>
            {setupData?.agentStatus === "paused"
              ? "Your AI Agent is temporarily paused."
              : "Your AI Agent is active and ready to help."}
          </p>
          <button onClick={() => setActivePage("activity")}>
            View Activity
          </button>
        </div>
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
            onUpdate={updateSetup}
            whatsappSetup={whatsappSetup}
            onBusinessProfile={openBusinessProfile}
            onPropertyImport={openPropertyImport}
            onAppointmentRules={openAppointmentRules}
            onBehavior={openBehavior}
            onAutomations={openAutomations}
            onTestAgent={openAgentTest}
          />
        )}

        {activePage === "chat" && (
          <ChatLayout
            message={message}
            setMessage={setMessage}
            dashboardData={dashboardData}
            messages={messages}
            sendingMessage={sendingMessage}
            onSend={sendChatMessage}
          />
        )}

        {activePage === "knowledge" && (
          <KnowledgeLayout knowledgeData={knowledgeData} />
        )}

        {activePage === "activity" && (
          <ActivityLayout
            activityData={activityData}
            onDataChange={setActivityData}
          />
        )}

        {activePage === "controls" && (
          <ControlsLayout
            controlTab={controlTab}
            setControlTab={setControlTab}
            controlsData={controlsData}
            onSave={saveControls}
          />
        )}
      </section>
    </div>
  );
}

function SetupLayout({
  setupData,
  openStep,
  setOpenStep,
  onRefresh,
  onUpdate,
  whatsappSetup,
  onBusinessProfile,
  onPropertyImport,
  onAppointmentRules,
  onBehavior,
  onAutomations,
  onTestAgent,
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
                          disabled={step.locked}
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
                            setOpenStep(step.id);
                          }}
                        >
                          {step.action}
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
  message,
  setMessage,
  dashboardData,
  messages,
  sendingMessage,
  onSend,
}) {
  const prompts = [
    {
      icon: MessageSquare,
      title: "What leads need attention today?",
      desc: "Show me hot and overdue leads.",
      accent: "purple",
    },
    {
      icon: Zap,
      title: "Which buyers are most likely to buy?",
      desc: "Show me my hottest buyer leads.",
      accent: "orange",
    },
    {
      icon: CalendarDays,
      title: "What appointments did you book today?",
      desc: "Show today’s confirmed appointments.",
      accent: "blue",
    },
    {
      icon: MessageCircle,
      title: "Write a follow-up for Maria Lopez",
      desc: "Create a WhatsApp follow-up message.",
      accent: "green",
    },
    {
      icon: Home,
      title: "Find properties for a 3 bedroom buyer",
      desc: "Show me the best matching properties.",
      accent: "green",
    },
    {
      icon: FileText,
      title: "Summarize my pipeline",
      desc: "Give me a quick update on my pipeline.",
      accent: "purple",
    },
  ];

  return (
    <div className="cx-ai-page cx-chat-page">
      <div className="cx-ai-page-head">
        <div>
          <h1>AI Agent Chat</h1>
          <p>
            Ask anything. Your AI Agent is here to help you close more deals.
          </p>
        </div>
        <button className="cx-primary-outline">
          <Plus size={18} /> New Chat
        </button>
      </div>

      <div className="cx-chat-layout">
        <main className="cx-chat-main-card">
          <div className="cx-chat-hero">
            <div className="cx-hero-bot">
              <Bot size={44} />
            </div>
            <h2>Good morning, John! 👋</h2>
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
                  key={item.title}
                  className="cx-prompt-card"
                  onClick={() => onSend(item.title)}
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
            <button>
              <Users size={17} /> Leads
            </button>
            <button>
              <Home size={17} /> Properties
            </button>
            <button>
              <CalendarDays size={17} /> Appointments
            </button>
            <button>
              <Sparkles size={17} /> Pipeline
            </button>
            <button>
              <ChevronDown size={17} /> More
            </button>
          </div>

          {messages?.length > 0 && (
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
                <div className="cx-chat-message assistant">Thinking...</div>
              )}
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
          <PriorityTasks tasks={dashboardData?.priorityTasks} />
          <RecentActivityMini items={dashboardData?.recentActivity} />
        </aside>
      </div>
    </div>
  );
}

function KnowledgeLayout({ knowledgeData }) {
  const categories = [
    [
      "Company Information",
      "Your company details, mission, values and offices",
      "6 items",
      Building2,
      "purple",
    ],
    [
      "Office Hours & Availability",
      "Business hours, holidays and availability rules",
      "4 items",
      Clock3,
      "green",
    ],
    [
      "Service Areas",
      "Areas, neighborhoods and coverage information",
      "5 items",
      Home,
      "blue",
    ],
    [
      "Property Knowledge",
      "Property types, features and market expertise",
      "7 items",
      Home,
      "orange",
    ],
    [
      "Sales Scripts & Templates",
      "Scripts, email templates and messaging guides",
      "6 items",
      MessageCircle,
      "purple",
    ],
    [
      "Financing & Partners",
      "Lenders, partners and financing information",
      "3 items",
      Database,
      "green",
    ],
    [
      "FAQs",
      "Frequently asked questions and answers",
      "4 items",
      HelpCircle,
      "blue",
    ],
    [
      "Policies & Processes",
      "Business policies and internal processes",
      "3 items",
      FileText,
      "purple",
    ],
  ];

  return (
    <div className="cx-ai-page">
      <div className="cx-ai-page-head">
        <div>
          <h1>AI Knowledge</h1>
          <p>Manage what your AI Agent knows about your business.</p>
        </div>
        <div className="cx-head-buttons">
          <button className="cx-primary-outline">
            <Upload size={17} /> Import Knowledge
          </button>
          <button className="cx-primary-btn slim">
            <Plus size={17} /> Add Knowledge
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
            {(knowledgeData?.categories?.length
              ? knowledgeData.categories.map((item) => [
                  item.title,
                  item.description,
                  `${item.items} items`,
                  item.key === "property_knowledge" ? Home : FileText,
                  item.accent || "purple",
                ])
              : categories
            ).map(([title, desc, count, Icon, accent]) => (
              <div className="cx-category-row" key={title}>
                <div className={`cx-small-icon ${accent}`}>
                  <Icon size={22} />
                </div>
                <div>
                  <strong>{title}</strong>
                  <p>{desc}</p>
                </div>
                <span>{count}</span>
                <em>Active</em>
                <ChevronRight size={18} />
              </div>
            ))}
          </div>

          <button className="cx-show-more">
            Show inactive categories <ChevronDown size={16} />
          </button>
        </main>

        <aside className="cx-right-column">
          <div className="cx-white-card">
            <h2>Knowledge Health</h2>
            <div className="cx-health-row">
              <div className="cx-big-score">
                {knowledgeData?.health?.score ?? 0}%
              </div>
              <div className="cx-health-list">
                <p>
                  <CheckCircle2 size={16} /> Complete <strong>28 / 32</strong>
                </p>
                <p>
                  <CheckCircle2 size={16} /> Up to date <strong>25 / 28</strong>
                </p>
                <p>
                  <CheckCircle2 size={16} /> Well structured{" "}
                  <strong>26 / 32</strong>
                </p>
                <p>
                  <Clock3 size={16} /> Needs review <strong>4 / 32</strong>
                </p>
              </div>
            </div>
            <button className="cx-full-btn">View Knowledge Insights</button>
          </div>

          <div className="cx-white-card">
            <h2>Quick Actions</h2>
            {[
              "Add Text Knowledge",
              "Upload Document",
              "Add Website URL",
              "Connect Data Source",
              "Create Custom Q&A",
            ].map((x) => (
              <div className="cx-quick-row" key={x}>
                <FileText size={18} />
                <div>
                  <strong>{x}</strong>
                  <p>Add text, notes or documents</p>
                </div>
                <ChevronRight size={17} />
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

function ActivityLayout({ activityData, onDataChange }) {
  const rows = [
    [
      "9:45 AM",
      "Qualified Lead",
      "AI qualified Maria Lopez as a hot lead (Score: 92%)",
      MessageCircle,
      "Completed",
    ],
    [
      "9:43 AM",
      "Booked Appointment",
      "AI booked a property showing for tomorrow at 11:00 AM",
      CalendarDays,
      "Completed",
    ],
    [
      "9:40 AM",
      "Recommended Properties",
      "AI recommended 4 properties to Maria Lopez",
      Home,
      "Completed",
    ],
    [
      "9:37 AM",
      "Sent Follow-up Message",
      "AI sent follow-up message via WhatsApp",
      Send,
      "Completed",
    ],
    [
      "9:21 AM",
      "Lead Scored",
      "AI updated lead score for Carlos Martinez (78%)",
      Star,
      "Completed",
    ],
    [
      "9:18 AM",
      "Email Sent",
      "AI sent property details via email",
      Mail,
      "Completed",
    ],
    [
      "9:12 AM",
      "Data Enriched",
      "AI enriched lead data from public sources",
      Database,
      "Completed",
    ],
    [
      "9:08 AM",
      "Hot Lead Alert",
      "AI escalated David Smith as hot lead",
      Bell,
      "Escalated",
    ],
  ];
  const activityTypes = [
    {
      label: "Messages",
      value: "62 (40%)",
      percent: 40,
      icon: MessageCircle,
      accent: "green",
    },
    {
      label: "Appointments",
      value: "28 (18%)",
      percent: 18,
      icon: CalendarDays,
      accent: "orange",
    },
    {
      label: "Lead Updates",
      value: "24 (15%)",
      percent: 15,
      icon: Home,
      accent: "purple",
    },
    {
      label: "Data Updates",
      value: "20 (13%)",
      percent: 13,
      icon: Database,
      accent: "blue",
    },
    {
      label: "Alerts",
      value: "12 (8%)",
      percent: 8,
      icon: TriangleAlert,
      accent: "red",
    },
    {
      label: "Others",
      value: "10 (6%)",
      percent: 6,
      icon: MoreHorizontal,
      accent: "gray",
    },
  ];
  const topActions = [
    {
      icon: UserRoundCheck,
      title: "Lead Qualification",
      total: 32,
      accent: "green",
    },
    {
      icon: MessageCircle,
      title: "Auto Replies",
      total: 28,
      accent: "green",
    },
    {
      icon: Home,
      title: "Property Recommendations",
      total: 24,
      accent: "purple",
    },
    {
      icon: CalendarDays,
      title: "Appointments Booked",
      total: 20,
      accent: "orange",
    },
    {
      icon: Send,
      title: "Follow-up Messages",
      total: 18,
      accent: "blue",
    },
  ];

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

  const displayRows = apiRows.length ? apiRows : rows;
  const overview = activityData?.overview || {};
  const activityTypesData = activityData?.activityByType?.length
    ? activityData.activityByType
    : activityTypes;
  const topActionsData = activityData?.topActions?.length
    ? activityData.topActions
    : topActions;

  return (
    <div className="cx-ai-page">
      <div className="cx-ai-page-head">
        <div>
          <h1>Activity</h1>
          <p>See everything your AI Agent has done across your business.</p>
        </div>
        <button className="cx-primary-outline">
          <Upload size={17} /> Export Activity
        </button>
      </div>

      <div className="cx-activity-layout">
        <main>
          <div className="cx-activity-filters">
            <button>
              <CalendarDays size={17} /> May 17 - May 23, 2024{" "}
              <ChevronDown size={16} />
            </button>
            <button>
              All Types <ChevronDown size={16} />
            </button>
            <button>
              All Status <ChevronDown size={16} />
            </button>
            <div>
              <Search size={17} /> Search activity...
            </div>
          </div>

          <div className="cx-white-card cx-timeline-card">
            <h4>Today - May 23, 2024</h4>

            {displayRows.map(
              ([time, title, desc, Icon, status, leadName], index) => (
                <div className="cx-activity-row" key={title}>
                  <time>{time}</time>
                  <div className="cx-line-dot" />
                  <div
                    className={`cx-small-icon ${index % 3 === 0 ? "green" : index % 3 === 1 ? "orange" : "blue"}`}
                  >
                    <Icon size={18} />
                  </div>
                  <div>
                    <strong>{title}</strong>
                    <p>{desc}</p>
                  </div>
                  <span>{leadName ? `Lead: ${leadName}` : "AI Agent"}</span>
                  <em className={status === "Escalated" ? "warning" : ""}>
                    {status}
                  </em>
                </div>
              ),
            )}

            <div className="cx-pagination">
              <span>Showing 1 to 25 of 156 activities</span>
              <div>
                <button>‹</button>
                <button className="active">1</button>
                <button>2</button>
                <button>3</button>
                <button>...</button>
                <button>7</button>
                <button>›</button>
              </div>
            </div>
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
              Activity by Type <button>View all</button>
            </h2>
            {activityTypesData.map((item) => {
              const Icon = item.icon;
              return (
                <div className="cx-bar-row has-icon" key={item.label}>
                  <div className={`cx-bar-icon ${item.accent}`}>
                    <Icon size={14} />
                  </div>
                  <span>{item.label}</span>
                  <div className="cx-bar-track">
                    <i
                      className={item.accent}
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                  <strong>{item.value}</strong>
                </div>
              );
            })}
          </div>

          <div className="cx-white-card">
            <h2>
              Top Actions
              <button>View all</button>
            </h2>

            <div className="cx-top-actions-list">
              {topActionsData.map((item) => {
                const Icon = item.icon;

                return (
                  <div className="cx-top-action-row" key={item.title}>
                    <div className={`cx-bar-icon ${item.accent}`}>
                      <Icon size={15} />
                    </div>
                    <span>{item.title}</span>
                    <strong>{item.total}</strong>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="cx-white-card">
            <h2>
              Recent AI Runs <button>View all</button>
            </h2>
            <div className="cx-run-row">
              <Send size={18} />
              <div>
                <strong>AI Follow-up Campaign</strong>
                <p>May 23, 2024 at 9:00 AM</p>
              </div>
              <em>Completed</em>
            </div>
            <div className="cx-run-row">
              <Home size={18} />
              <div>
                <strong>Property Matching</strong>
                <p>May 23, 2024 at 8:30 AM</p>
              </div>
              <em>Completed</em>
            </div>
          </div>
        </aside>
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
              <StatMini title="Responses Today" value="148" desc="↑ 24%" />
              <StatMini
                title="Appointments Booked"
                value={data?.appointmentsBooked ?? 0}
                desc="↑ 33%"
              />
              <StatMini title="Leads Handled" value="56" desc="↑ 18%" />
              <StatMini
                title="Avg. Response Time"
                value="1m 24s"
                desc="↓ 12%"
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
  return (
    <div className="cx-white-card">
      <h2>
        AI Agent at a glance{" "}
        <em>
          <i></i>Live
        </em>
      </h2>
      <div className="cx-glance-grid">
        <StatMini
          icon={MessageSquare}
          title="Conversations"
          value="124"
          desc="Today"
        />
        <StatMini
          icon={Users}
          title="Leads Contacted"
          value="56"
          desc="Today"
        />
        <StatMini
          icon={CalendarDays}
          title="Appointments Booked"
          value="8"
          desc="Today"
        />
        <StatMini
          icon={Home}
          title="Properties Shared"
          value="23"
          desc="Today"
        />
      </div>
    </div>
  );
}

function PriorityTasks({ tasks = [] }) {
  return (
    <div className="cx-white-card">
      <h2>
        Priority Tasks <button>View all</button>
      </h2>
      {[
        "Follow up with Maria Lopez",
        "Respond to David Smith",
        "Appointment with James Hall",
        "Send listings to Ana Torres",
      ].map((x, i) => (
        <div className="cx-task-row" key={x}>
          <img src={`https://i.pravatar.cc/60?img=${11 + i}`} alt="" />
          <div>
            <strong>{x}</strong>
            <p>
              {i === 1 ? "WhatsApp" : "Lead"} · {i + 1}m ago
            </p>
          </div>
          <em>{["High", "Medium", "High", "Low"][i]}</em>
        </div>
      ))}
    </div>
  );
}

function RecentActivityMini({ items = [] }) {
  return (
    <div className="cx-white-card">
      <h2>
        Recent Activity <button>View all</button>
      </h2>
      {[
        "Booked appointment with James Hall",
        "Sent 3 properties to Maria Lopez",
        "New lead message from David Smith",
        "Follow-up completed for Ana Torres",
      ].map((x, i) => (
        <div className="cx-mini-activity" key={x}>
          <div className={`cx-small-icon ${i % 2 ? "blue" : "green"}`}>
            <CheckCircle2 size={18} />
          </div>
          <div>
            <strong>{x}</strong>
            <p>Today at {["11:32 AM", "10:45 AM", "10:12 AM", "9:40 AM"][i]}</p>
          </div>
        </div>
      ))}
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
