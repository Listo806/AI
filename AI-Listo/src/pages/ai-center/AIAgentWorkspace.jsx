import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useTranslation } from "react-i18next";

import { useAuth } from "../../context/AuthContext";
import apiClient from "../../api/apiClient";
import aiAgentSetupService from "./services/aiAgentSetup.service";
import "./AIAgentWorkspace.css";

/* Suggested CRM commands shown on the empty state. These map to what the
   backend agent already answers over (leads / pipeline / properties / etc.).
   Each entry is an i18n key suffix under the "aiCenter" namespace; the visible
   (translated) text is also what gets sent when a suggestion is clicked. */
const SUGGESTED_COMMANDS = [
  "suggestLeadsFollowUpToday",
  "suggestSummarizePipeline",
  "suggestHottestOpportunities",
  "suggestDraftWhatsappFollowUp",
  "suggestInactiveDeals",
  "suggestAppointmentsToday",
  "suggestCreateTasksOverdue",
  "suggestCrmSummaryToday",
  "suggestWeeklySalesReport",
  "suggestBuildAutomation",
  "suggestTeamPerformance",
  "suggestLeadsNoReply",
  "suggestOverdueTasks",
  "suggestFollowUpSequence",
  "suggestSummarizeConversations",
];

/* The service already unwraps { data } in most cases; stay tolerant either way. */
const unwrap = (res) => (res && res.data !== undefined ? res.data : res);

/* --- Minimal, monochrome SVG icons (no emoji, no decorative art) --- */
const IconMenu = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path d="M4 6h16M4 12h16M4 18h16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const IconPlus = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const IconPaperclip = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <path d="M21 12.5 12 21a5.5 5.5 0 0 1-7.8-7.8l8.5-8.5a3.5 3.5 0 0 1 5 5l-8.5 8.5a1.5 1.5 0 0 1-2.2-2.2l7.8-7.8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconMic = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <rect x="9" y="3" width="6" height="11" rx="3" fill="none" stroke="currentColor" strokeWidth="1.7" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);
const IconSend = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path d="M4 12l16-8-6 16-3-7-7-1z" fill="currentColor" />
  </svg>
);
const IconSpark = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" fill="currentColor" />
  </svg>
);

const IconChevronRight = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <path d="m9 5 7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconContext = ({ type }) => {
  const p = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  const icons = {
    leads: (
      <>
        <circle cx="9" cy="8" r="3" {...p} />
        <path d="M3.8 20c.7-3.6 2.6-5.4 5.2-5.4s4.5 1.8 5.2 5.4M16 9a2.5 2.5 0 1 1 0 5M16 15c2.4 0 4.1 1.4 4.7 4" {...p} />
      </>
    ),
    pipeline: <path d="M5 18v-4m0 0 4-4m-4 4 4 4m0-8 4-4m0 0 4 4m-4-4v12m0 0 4-4" {...p} />,
    contacts: (
      <>
        <rect x="5" y="4" width="14" height="16" rx="2" {...p} />
        <circle cx="12" cy="9" r="2.2" {...p} />
        <path d="M8.5 16c.6-2.2 1.9-3.3 3.5-3.3s2.9 1.1 3.5 3.3" {...p} />
      </>
    ),
    analytics: (
      <>
        <path d="M4 20h16" {...p} />
        <path d="M6 17V9M11 17V5M16 17v-6M20 17V3" {...p} />
      </>
    ),
    appointments: (
      <>
        <rect x="4" y="6" width="16" height="14" rx="2" {...p} />
        <path d="M8 3v5M16 3v5M4 10h16M8 14h8" {...p} />
      </>
    ),
    whatsapp: (
      <>
        <circle cx="12" cy="12" r="8" {...p} />
        <path d="m7 20 1.5-3M9 9c1 3 3 5 6 6" {...p} />
      </>
    ),
    tasks: (
      <>
        <rect x="5" y="4" width="14" height="16" rx="2" {...p} />
        <path d="m8 12 2 2 5-5" {...p} />
      </>
    ),
    revenue: (
      <>
        <circle cx="12" cy="12" r="8" {...p} />
        <path d="M14.5 8.5c-.6-.8-1.5-1.2-2.6-1.2-1.5 0-2.5.7-2.5 1.8 0 2.8 5.2 1.4 5.2 4.2 0 1.2-1.1 2-2.7 2-1.2 0-2.2-.4-2.9-1.3M12 5.5v13" {...p} />
      </>
    ),
    automations: <path d="m13 2-8 12h6l-1 8 9-13h-6z" {...p} />,
    more: (
      <>
        <circle cx="6" cy="12" r="1.4" fill="currentColor" />
        <circle cx="12" cy="12" r="1.4" fill="currentColor" />
        <circle cx="18" cy="12" r="1.4" fill="currentColor" />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
      {icons[type] || icons.more}
    </svg>
  );
};

const MOBILE_AI_CONTEXTS = [
  { id: "leads", label: "Leads", prompt: "Open my Leads context and show me what I should focus on today." },
  { id: "pipeline", label: "Pipeline", prompt: "Open my Pipeline context and summarize the deals I should focus on." },
  { id: "contacts", label: "Contacts", prompt: "Open my Contacts context and help me understand the customers who need attention." },
  { id: "analytics", label: "Analytics", prompt: "Open my Analytics context and give me a concise business performance summary." },
  { id: "appointments", label: "Appointments", prompt: "Open my Appointments context and show me my schedule and anything needing attention." },
  { id: "whatsapp", label: "WhatsApp", prompt: "Open my WhatsApp context and show me conversations that need attention." },
  { id: "tasks", label: "Tasks", prompt: "Open my Tasks context and tell me what I should do next." },
  { id: "revenue", label: "Revenue", prompt: "Open my Revenue context and summarize expected revenue and revenue at risk." },
  { id: "automations", label: "Automations", prompt: "Open my Automations context and show me what is running, failing, or worth improving." },
  { id: "more", label: "More", prompt: "Show me additional AI Agent capabilities available for my CRM." },
];

export default function AIAgentWorkspace() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [listening, setListening] = useState(false);
  const [selectedMobileContext, setSelectedMobileContext] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.innerWidth > 860;
  });

  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    const handleMobileResize = () => {
      if (window.innerWidth <= 860) setHistoryOpen(false);
    };
    handleMobileResize();
    window.addEventListener("resize", handleMobileResize);
    return () => window.removeEventListener("resize", handleMobileResize);
  }, []);

  const firstName = useMemo(() => {
    const name = user?.name || user?.email || "";
    return String(name).trim().split(" ")[0] || t("aiCenter.defaultName");
  }, [user, t]);

  const desktopContexts = useMemo(
    () => [
      { id: "leads", label: t("aiCenter.desktop.contextLeads"), prompt: t("aiCenter.desktop.contextPromptLeads") },
      { id: "pipeline", label: t("aiCenter.desktop.contextPipeline"), prompt: t("aiCenter.desktop.contextPromptPipeline") },
      { id: "contacts", label: t("aiCenter.desktop.contextContacts"), prompt: t("aiCenter.desktop.contextPromptContacts") },
      { id: "analytics", label: t("aiCenter.desktop.contextAnalytics"), prompt: t("aiCenter.desktop.contextPromptAnalytics") },
      { id: "appointments", label: t("aiCenter.desktop.contextAppointments"), prompt: t("aiCenter.desktop.contextPromptAppointments") },
      { id: "whatsapp", label: t("aiCenter.desktop.contextWhatsApp"), prompt: t("aiCenter.desktop.contextPromptWhatsApp") },
      { id: "tasks", label: t("aiCenter.desktop.contextTasks"), prompt: t("aiCenter.desktop.contextPromptTasks") },
      { id: "revenue", label: t("aiCenter.desktop.contextRevenue"), prompt: t("aiCenter.desktop.contextPromptRevenue") },
      { id: "automations", label: t("aiCenter.desktop.contextAutomations"), prompt: t("aiCenter.desktop.contextPromptAutomations") },
      { id: "more", label: t("aiCenter.desktop.contextMore"), prompt: t("aiCenter.desktop.contextPromptMore") },
    ],
    [t],
  );

  const desktopTryCards = useMemo(
    () => [
      { icon: "pipeline", title: t("aiCenter.desktop.tryPipelineTitle"), sub: t("aiCenter.desktop.tryPipelineSub"), prompt: t("aiCenter.suggestSummarizePipeline") },
      { icon: "revenue", title: t("aiCenter.desktop.tryRevenueTitle"), sub: t("aiCenter.desktop.tryRevenueSub"), prompt: t("aiCenter.suggestHottestOpportunities") },
      { icon: "appointments", title: t("aiCenter.desktop.tryAppointmentTitle"), sub: t("aiCenter.desktop.tryAppointmentSub"), prompt: t("aiCenter.suggestAppointmentsToday") },
      { icon: "tasks", title: t("aiCenter.desktop.tryFollowUpTitle"), sub: t("aiCenter.desktop.tryFollowUpSub"), prompt: t("aiCenter.suggestLeadsFollowUpToday") },
      { icon: "whatsapp", title: t("aiCenter.desktop.tryConversationsTitle"), sub: t("aiCenter.desktop.tryConversationsSub"), prompt: t("aiCenter.suggestSummarizeConversations") },
      { icon: "analytics", title: t("aiCenter.desktop.tryRiskTitle"), sub: t("aiCenter.desktop.tryRiskSub"), prompt: t("aiCenter.suggestInactiveDeals") },
    ],
    [t],
  );

  /* ---------------- Conversation history ---------------- */
  const loadSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const data = unwrap(await aiAgentSetupService.getChatSessions(30));
      const list = Array.isArray(data) ? data : data?.sessions || [];
      setSessions(list);
    } catch (_e) {
      /* history is non-critical; leave list as-is */
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const openSession = useCallback(async (sessionId) => {
    if (!sessionId) return;
    setActiveSessionId(sessionId);
    setLoadingMessages(true);
    setError("");
    try {
      const data = unwrap(await aiAgentSetupService.getChatSession(sessionId));
      const msgs = data?.messages || data?.chat?.messages || [];
      setMessages(
        msgs.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: m.createdAt || m.created_at,
        })),
      );
    } catch (_e) {
      setError(t("aiCenter.errorLoadConversation"));
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, [t]);

  const startNewChat = useCallback(() => {
    setActiveSessionId(null);
    setMessages([]);
    setError("");
    setInput("");
    setAttachments([]);
    textareaRef.current?.focus();
  }, []);

  /* Keep the conversation scrolled to the newest message. */
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, sending]);

  /* ---------------- Send ---------------- */
  const handleSend = useCallback(
    async (overrideText, options = {}) => {
      const text = String(overrideText ?? input).trim();
      if ((!text && attachments.length === 0) || sending) return;

      setError("");
      setSending(true);

      const userMsg = {
        id: `local-${Date.now()}`,
        role: "user",
        content: text,
        createdAt: new Date().toISOString(),
        attachments: attachments.map((a) => ({ name: a.name, type: a.type })),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");

      const sentAttachments = attachments.map(
        (a) => a.ref || { name: a.name, type: a.type, size: a.size },
      );
      setAttachments([]);

      try {
        const data = unwrap(
          await aiAgentSetupService.sendChatMessage({
            message: text,
            sessionId: activeSessionId || undefined,
            attachments: sentAttachments,
            activeContext:
              options.activeContext || selectedMobileContext || undefined,
          }),
        );

        const answer =
          data?.assistantMessage?.content ||
          data?.answer ||
          t("aiCenter.noResponseReturned");
        const nextSessionId =
          data?.sessionId || data?.conversationId || activeSessionId;

        if (nextSessionId && nextSessionId !== activeSessionId) {
          setActiveSessionId(nextSessionId);
        }

        setMessages((prev) => [
          ...prev,
          {
            id: data?.assistantMessage?.id || `assistant-${Date.now()}`,
            role: "assistant",
            content: answer,
            createdAt:
              data?.assistantMessage?.createdAt || new Date().toISOString(),
          },
        ]);

        loadSessions();
      } catch (e) {
        setError(e?.message || t("aiCenter.errorGeneric"));
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: "assistant",
            content: t("aiCenter.errorCouldNotComplete"),
            error: true,
            createdAt: new Date().toISOString(),
          },
        ]);
      } finally {
        setSending(false);
      }
    },
    [
      input,
      attachments,
      sending,
      activeSessionId,
      selectedMobileContext,
      loadSessions,
      t,
    ],
  );

  /* ---------------- File attachment ---------------- */
  const handleFilesSelected = useCallback(async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      files.forEach((f) => form.append("files", f));

      let uploaded = [];
      try {
        const data = unwrap(
          await apiClient.request("/ai-center/upload", {
            method: "POST",
            body: form,
          }),
        );
        uploaded =
          data?.files || data?.uploads || (Array.isArray(data) ? data : []);
      } catch (_e) {
        /* If upload fails, still attach metadata so the send is not blocked. */
        uploaded = [];
      }

      const chips = files.map((f, i) => ({
        name: f.name,
        size: f.size,
        type: f.type,
        ref: uploaded[i] || { name: f.name, type: f.type, size: f.size },
      }));
      setAttachments((prev) => [...prev, ...chips]);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, []);

  const removeAttachment = (idx) =>
    setAttachments((prev) => prev.filter((_, i) => i !== idx));

  /* ---------------- Voice input (browser Speech Recognition) ---------------- */
  const toggleVoice = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError(t("aiCenter.errorVoiceUnsupported"));
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [listening, t]);

  const handleMobileContext = useCallback(
    (context) => {
      setSelectedMobileContext(context.id);
      handleSend(context.prompt, { activeContext: context.id });
    },
    [handleSend],
  );

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = (input.trim() || attachments.length > 0) && !sending;
  const isEmpty = messages.length === 0 && !loadingMessages;

  return (
    <div className={`aiw-root ${isEmpty ? "aiw-root-empty" : "aiw-root-chat"}`}>
      {historyOpen && (
        <button
          type="button"
          className="aiw-history-backdrop"
          aria-label="Close conversation history"
          onClick={() => setHistoryOpen(false)}
        />
      )}
      <aside
        className={`aiw-history ${historyOpen ? "" : "aiw-history-collapsed"}`}
      >
        <div className="aiw-history-head">
          <span className="aiw-history-title">{t("aiCenter.conversations")}</span>
          <button
            type="button"
            className="aiw-newchat"
            onClick={startNewChat}
            title={t("aiCenter.newConversationTitle")}
          >
            <IconPlus />
            <span>{t("aiCenter.new")}</span>
          </button>
        </div>
        <div className="aiw-history-list">
          {loadingSessions && (
            <div className="aiw-history-empty">{t("aiCenter.loading")}</div>
          )}
          {!loadingSessions && sessions.length === 0 && (
            <div className="aiw-history-empty">
              {t("aiCenter.noConversationsYet")}
            </div>
          )}
          {sessions.map((s) => (
            <button
              type="button"
              key={s.id}
              className={`aiw-history-item ${
                s.id === activeSessionId ? "active" : ""
              }`}
              onClick={() => {
                openSession(s.id);
                if (typeof window !== "undefined" && window.innerWidth <= 860) {
                  setHistoryOpen(false);
                }
              }}
              title={s.title || t("aiCenter.conversationFallback")}
            >
              {s.title || t("aiCenter.newConversation")}
            </button>
          ))}
        </div>
      </aside>

      <div className="aiw-main">
        <header className="aiw-topbar">
          <button
            type="button"
            className="aiw-icon-btn"
            onClick={() => setHistoryOpen((o) => !o)}
            title={t("aiCenter.toggleHistoryTitle")}
          >
            <IconMenu />
          </button>
          <div className="aiw-topbar-titles">
            <div className="aiw-title">{t("aiCenter.aiAgent")}</div>
            <div className="aiw-subtitle">{t("aiCenter.subtitle")}</div>
          </div>

          <div className="aiw-mobile-brand" aria-label="Cortexa">
            <span className="aiw-mobile-brand-mark">
              <IconSpark />
            </span>
            <span className="aiw-mobile-brand-copy">
              <strong>CORTEXA</strong>
              <small>AGENTIC AI REVENUE OS</small>
            </span>
          </div>

          <div className="aiw-mobile-account">
            <span className="aiw-mobile-language">◎&nbsp; EN⌄</span>
            <span className="aiw-mobile-avatar">
              {String(user?.name || user?.email || "J").trim().charAt(0).toUpperCase()}
            </span>
          </div>
        </header>

        <div className="aiw-scroll" ref={scrollRef}>
          {isEmpty ? (
            <>
              <div className="aiw-empty aiw-empty-desktop aiw-desktop-home">
                <div className="aiw-desktop-brand-block">
                  <h1 className="aiw-desktop-brand-title">
                    {t("aiCenter.desktop.agentTitle")}
                  </h1>
                  <p className="aiw-desktop-brand-sub">
                    {t("aiCenter.desktop.agentSubtitle")}
                  </p>
                  <span className="aiw-desktop-brand-line" />
                </div>

                <div className="aiw-desktop-agent-mark">
                  <IconSpark />
                </div>

                <h2 className="aiw-desktop-question">
                  {t("aiCenter.desktop.question")}
                </h2>
                <p className="aiw-desktop-question-sub">
                  {t("aiCenter.desktop.questionSubtitle")}
                </p>

                <div className="aiw-desktop-contexts">
                  {desktopContexts.map((context) => (
                    <button
                      type="button"
                      key={context.id}
                      className="aiw-desktop-context-pill"
                      onClick={() => handleSend(context.prompt)}
                    >
                      <span className="aiw-desktop-context-icon">
                        <IconContext type={context.id} />
                      </span>
                      <span>{context.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="aiw-mobile-home">
                <div className="aiw-mobile-agent-badge">
                  <IconSpark />
                </div>

                <h1 className="aiw-mobile-agent-title">CORTEXA AI AGENT</h1>
                <p className="aiw-mobile-agent-subtitle">
                  Your business copilot. Connected to your data.
                  <br />
                  Built for results.
                </p>

                <span className="aiw-mobile-accent-line" />

                <h2 className="aiw-mobile-question">
                  What would you like to do today?
                </h2>
                <p className="aiw-mobile-question-sub">
                  Ask anything about your business. I can help you with
                  <br />
                  leads, pipeline, appointments, analytics, tasks, and more.
                </p>

                <div className="aiw-mobile-context-list">
                  {MOBILE_AI_CONTEXTS.map((context) => (
                    <button
                      type="button"
                      key={context.id}
                      className={`aiw-mobile-context-btn ${
                        selectedMobileContext === context.id ? "is-selected" : ""
                      }`}
                      onClick={() => handleMobileContext(context)}
                    >
                      <span className="aiw-mobile-context-icon">
                        <IconContext type={context.id} />
                      </span>
                      <span className="aiw-mobile-context-label">
                        {context.label}
                      </span>
                      <span className="aiw-mobile-context-chevron">
                        <IconChevronRight />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="aiw-messages">
              {loadingMessages && (
                <div className="aiw-loading">
                  {t("aiCenter.loadingConversation")}
                </div>
              )}
              {messages.map((m) => (
                <div key={m.id} className={`aiw-msg aiw-msg-${m.role}`}>
                  <div className="aiw-msg-avatar">
                    {m.role === "user" ? t("aiCenter.avatarYou") : <IconSpark />}
                  </div>
                  <div
                    className={`aiw-bubble ${
                      m.error ? "aiw-bubble-error" : ""
                    }`}
                  >
                    <div className="aiw-bubble-text">{m.content}</div>
                    {m.attachments?.length > 0 && (
                      <div className="aiw-msg-attachments">
                        {m.attachments.map((a, i) => (
                          <span key={i} className="aiw-attach-chip">
                            {a.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="aiw-msg aiw-msg-assistant">
                  <div className="aiw-msg-avatar"><IconSpark /></div>
                  <div className="aiw-bubble aiw-typing">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {error && <div className="aiw-error">{error}</div>}

        <div className="aiw-composer">
          {attachments.length > 0 && (
            <div className="aiw-composer-attachments">
              {attachments.map((a, i) => (
                <span key={i} className="aiw-attach-chip">
                  {a.name}
                  <button
                    type="button"
                    className="aiw-attach-remove"
                    onClick={() => removeAttachment(i)}
                    title={t("aiCenter.removeAttachmentTitle")}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="aiw-inputrow">
            <textarea
              ref={textareaRef}
              className="aiw-textarea"
              placeholder={t("aiCenter.composerPlaceholder")}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
            />
            <div className="aiw-actions">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFilesSelected}
                multiple
                style={{ display: "none" }}
              />
              <button
                type="button"
                className="aiw-tool-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                title={t("aiCenter.attachFileTitle")}
              >
                <IconPaperclip />
                <span>
                  {uploading ? t("aiCenter.uploading") : t("aiCenter.attach")}
                </span>
              </button>
              <button
                type="button"
                className={`aiw-tool-btn ${listening ? "aiw-listening" : ""}`}
                onClick={toggleVoice}
                title={t("aiCenter.voiceInputTitle")}
              >
                <IconMic />
                <span>
                  {listening ? t("aiCenter.listening") : t("aiCenter.voice")}
                </span>
              </button>
              <button
                type="button"
                className="aiw-send"
                onClick={() => handleSend()}
                disabled={!canSend}
                title={t("aiCenter.sendTitle")}
              >
                <IconSend />
              </button>
            </div>
          </div>
          <div className="aiw-disclaimer aiw-disclaimer-inline">{t("aiCenter.disclaimer")}</div>
          {isEmpty && (
            <div className="aiw-mobile-privacy">
              <span aria-hidden="true">♙</span>
              <span>I only use your data to give you answers.</span>
              <button type="button">Learn more</button>
            </div>
          )}
        </div>

        {isEmpty && (
          <div className="aiw-desktop-empty-after-composer">
            <div className="aiw-desktop-privacy">
              <span className="aiw-desktop-privacy-lock" aria-hidden="true">▢</span>
              <span>{t("aiCenter.desktop.privacyText")}</span>
              <button type="button">{t("aiCenter.desktop.learnMore")}</button>
            </div>

            <section className="aiw-desktop-try">
              <h3>{t("aiCenter.desktop.tryAsking")}</h3>
              <div className="aiw-desktop-try-grid">
                {desktopTryCards.map((card) => (
                  <button
                    type="button"
                    key={card.title}
                    className="aiw-desktop-try-card"
                    onClick={() => handleSend(card.prompt)}
                  >
                    <span className="aiw-desktop-try-icon">
                      <IconContext type={card.icon} />
                    </span>
                    <span className="aiw-desktop-try-copy">
                      <strong>{card.title}</strong>
                      <small>{card.sub}</small>
                    </span>
                    <span className="aiw-desktop-try-chevron">
                      <IconChevronRight />
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <div className="aiw-desktop-bottom-disclaimer">
              {t("aiCenter.disclaimer")}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}