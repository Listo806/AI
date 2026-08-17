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
  "suggestPropertiesNoActivity",
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

const IconBell = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"
      fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconClose = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
    <path d="M6 6l12 12M18 6 6 18"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconChevronRight = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path d="m9 5 7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconStar = () => (
  <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
    <path d="m12 3 2.4 5.1 5.6.7-4.1 4 1 5.6-4.9-2.7-4.9 2.7 1-5.6-4.1-4 5.6-.7z"
      fill="currentColor" />
  </svg>
);

const IconPrompt = ({ type }) => {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  const shapes = {
    followup: (
      <>
        <circle cx="9" cy="8" r="3" {...common} />
        <path d="M4 19c.7-3.4 2.8-5 5-5s4.3 1.6 5 5M16 7h4M18 5v4" {...common} />
      </>
    ),
    pipeline: <path d="M5 19V9M10 19V5M15 19v-7M20 19V3" {...common} />,
    hot: <path d="M13 3c1 4-3 4-1 8 1.5-1 3-2 4-4 3 4 3 9-1 12-4 3-10 0-10-5 0-3 2-5 4-7 .2 2 1.8 3.2 4 4 0-3 2-5 2-8z" {...common} />,
    whatsapp: (
      <>
        <circle cx="12" cy="12" r="8" {...common} />
        <path d="m7 20 1.5-3M9 9c1 3 3 5 6 6" {...common} />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="8" {...common} />
        <path d="M12 7v5l3 2" {...common} />
      </>
    ),
    calendar: (
      <>
        <rect x="4" y="6" width="16" height="14" rx="2" {...common} />
        <path d="M8 3v5M16 3v5M4 10h16" {...common} />
      </>
    ),
    task: (
      <>
        <rect x="5" y="4" width="14" height="16" rx="2" {...common} />
        <path d="m8 12 2 2 5-5" {...common} />
      </>
    ),
    chart: (
      <>
        <path d="M5 20h14" {...common} />
        <path d="M7 17V9M12 17V5M17 17v-4" {...common} />
      </>
    ),
    gear: (
      <>
        <circle cx="12" cy="12" r="3" {...common} />
        <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" {...common} />
      </>
    ),
    team: (
      <>
        <circle cx="9" cy="9" r="3" {...common} />
        <circle cx="16" cy="10" r="2.5" {...common} />
        <path d="M3.5 19c.8-3.2 2.8-5 5.5-5s4.7 1.8 5.5 5M14 15c2.5 0 4.3 1.3 5 4" {...common} />
      </>
    ),
    message: (
      <>
        <rect x="4" y="5" width="16" height="12" rx="4" {...common} />
        <path d="m8 17-2 3M8 9h8M8 13h5" {...common} />
      </>
    ),
    summary: (
      <>
        <rect x="5" y="4" width="14" height="16" rx="2" {...common} />
        <path d="M8 8h8M8 12h8M8 16h5" {...common} />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      {shapes[type] || shapes.summary}
    </svg>
  );
};


const formatChatTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
};

const normalizeAssistantPayload = (data) => {
  return (
    data?.assistantMessage?.metadata ||
    data?.assistantMessage?.payload ||
    data?.metadata ||
    data?.payload ||
    data?.result ||
    null
  );
};

const PROMPT_META = {
  suggestLeadsFollowUpToday: { type: "followup", tone: "green" },
  suggestSummarizePipeline: { type: "pipeline", tone: "green" },
  suggestHottestOpportunities: { type: "hot", tone: "blue" },
  suggestDraftWhatsappFollowUp: { type: "whatsapp", tone: "cyan" },
  suggestInactiveDeals: { type: "clock", tone: "purple" },
  suggestAppointmentsToday: { type: "calendar", tone: "purple" },
  suggestPropertiesNoActivity: { type: "task", tone: "orange" },
  suggestCreateTasksOverdue: { type: "task", tone: "orange" },
  suggestCrmSummaryToday: { type: "chart", tone: "orange" },
  suggestWeeklySalesReport: { type: "chart", tone: "red" },
  suggestBuildAutomation: { type: "gear", tone: "cyan" },
  suggestTeamPerformance: { type: "team", tone: "blue" },
  suggestLeadsNoReply: { type: "message", tone: "purple" },
  suggestOverdueTasks: { type: "clock", tone: "orange" },
  suggestFollowUpSequence: { type: "message", tone: "green" },
  suggestSummarizeConversations: { type: "message", tone: "green" },
};

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
  const [historyOpen, setHistoryOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.innerWidth > 860;
  });
  const [mobileAllPrompts, setMobileAllPrompts] = useState(false);

  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    const handleResponsiveHistory = () => {
      if (window.innerWidth <= 860) {
        setHistoryOpen(false);
      }
    };

    handleResponsiveHistory();
    window.addEventListener("resize", handleResponsiveHistory);
    return () => window.removeEventListener("resize", handleResponsiveHistory);
  }, []);

  const firstName = useMemo(() => {
    const name = user?.name || user?.email || "";
    return String(name).trim().split(" ")[0] || t("aiCenter.defaultName");
  }, [user, t]);

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
          metadata: m.metadata || m.payload || m.data || null,
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
    async (overrideText) => {
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
            metadata: normalizeAssistantPayload(data),
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
    [input, attachments, sending, activeSessionId, loadSessions, t],
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

          <div className="aiw-history-head-actions">
            <button
              type="button"
              className="aiw-newchat"
              onClick={() => {
                startNewChat();
                if (typeof window !== "undefined" && window.innerWidth <= 860) {
                  setHistoryOpen(false);
                }
              }}
              title={t("aiCenter.newConversationTitle")}
            >
              <IconPlus />
              <span>{t("aiCenter.new")}</span>
            </button>

            <button
              type="button"
              className="aiw-history-close"
              onClick={() => setHistoryOpen(false)}
              aria-label="Close conversation history"
              title="Close"
            >
              <IconClose />
            </button>
          </div>
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
            className="aiw-icon-btn aiw-history-toggle"
            onClick={() => setHistoryOpen((o) => !o)}
            title={t("aiCenter.toggleHistoryTitle")}
          >
            <IconMenu />
          </button>

          <div className="aiw-topbar-titles">
            <div className="aiw-title">
              {t("aiCenter.aiAgent")}
              {!isEmpty && (
                <span className="aiw-title-chat-spark" aria-hidden="true">
                  <IconSpark />
                </span>
              )}
            </div>
            <div className="aiw-subtitle">{t("aiCenter.subtitle")}</div>
          </div>

        </header>

        <div className="aiw-scroll" ref={scrollRef}>
          {isEmpty ? (
            <div className="aiw-empty">
              <div className="aiw-empty-mark">
                <IconSpark />
              </div>

              <h1 className="aiw-empty-title">
                <span className="aiw-empty-title-desktop">
                  {t("aiCenter.greeting", { name: firstName })}
                </span>
                <span className="aiw-empty-title-mobile">
                  How can I help you today?
                </span>
              </h1>

              <p className="aiw-empty-sub">
                <span className="aiw-empty-sub-desktop">
                  {t("aiCenter.emptySubtitle")}
                </span>
                <span className="aiw-empty-sub-mobile">
                  Ask anything about your leads, pipeline,
                  <br />
                  appointments, tasks, or business.
                </span>
              </p>

              <div className="aiw-mobile-composer">
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
              </div>

              <div className="aiw-suggestions-head">
                <div className="aiw-suggestions-label">
                  <IconStar />
                  <span>SUGGESTED PROMPTS</span>
                </div>
                <button
                  type="button"
                  className="aiw-all-prompts-btn"
                  onClick={() => setMobileAllPrompts((v) => !v)}
                >
                  <span>{mobileAllPrompts ? "Suggested" : "All Prompts"}</span>
                  <IconChevronRight />
                </button>
              </div>

              <div className={`aiw-suggestions ${mobileAllPrompts ? "show-all" : ""}`}>
                {SUGGESTED_COMMANDS.map((key) => {
                  const cmd = t(`aiCenter.${key}`);
                  const meta = PROMPT_META[key] || {
                    type: "summary",
                    tone: "green",
                  };

                  return (
                    <button
                      type="button"
                      key={key}
                      className={`aiw-suggestion aiw-suggestion-${meta.tone}`}
                      onClick={() => handleSend(cmd)}
                    >
                      <span className="aiw-suggestion-icon">
                        <IconPrompt type={meta.type} />
                      </span>
                      <span className="aiw-suggestion-text">{cmd}</span>
                      <span className="aiw-suggestion-chevron">
                        <IconChevronRight />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="aiw-messages">
              {loadingMessages && (
                <div className="aiw-loading">
                  {t("aiCenter.loadingConversation")}
                </div>
              )}

              {messages.map((m) => {
                const structuredLeads = Array.isArray(m?.metadata?.leads)
                  ? m.metadata.leads
                  : Array.isArray(m?.metadata?.items)
                    ? m.metadata.items
                    : [];

                return (
                  <div key={m.id} className={`aiw-msg aiw-msg-${m.role}`}>
                    {m.role === "assistant" && (
                      <div className="aiw-msg-avatar aiw-assistant-spark-avatar">
                        <IconSpark />
                      </div>
                    )}

                    <div
                      className={`aiw-bubble ${
                        m.error ? "aiw-bubble-error" : ""
                      }`}
                    >
                      <div className="aiw-bubble-text">{m.content}</div>

                      {!!formatChatTime(m.createdAt) && (
                        <div className="aiw-msg-time">
                          {formatChatTime(m.createdAt)}
                          {m.role === "user" && (
                            <span className="aiw-msg-checks" aria-hidden="true">
                              ✓✓
                            </span>
                          )}
                        </div>
                      )}

                      {m.attachments?.length > 0 && (
                        <div className="aiw-msg-attachments">
                          {m.attachments.map((a, i) => (
                            <span key={i} className="aiw-attach-chip">
                              {a.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {m.role === "assistant" && structuredLeads.length > 0 && (
                        <div className="aiw-rich-result-card">
                          <div className="aiw-rich-result-head">
                            <span className="aiw-rich-result-icon">
                              <IconPrompt type="followup" />
                            </span>
                            <div>
                              <strong>
                                {structuredLeads.length} Leads Need Follow-Up
                              </strong>
                              <small>
                                Recommended actions to keep your pipeline moving.
                              </small>
                            </div>
                          </div>

                          <div className="aiw-rich-result-list">
                            {structuredLeads.slice(0, 5).map((lead, index) => {
                              const tone =
                                index === 0
                                  ? "red"
                                  : index === 1
                                    ? "orange"
                                    : "yellow";
                              const initials = String(
                                lead?.name || lead?.fullName || "Lead",
                              )
                                .split(" ")
                                .map((part) => part?.[0] || "")
                                .join("")
                                .slice(0, 2)
                                .toUpperCase();

                              return (
                                <div
                                  className={`aiw-followup-lead-card aiw-followup-${tone}`}
                                  key={lead?.id || `${m.id}-${index}`}
                                >
                                  <span className="aiw-followup-avatar">
                                    {initials}
                                  </span>

                                  <div className="aiw-followup-copy">
                                    <strong>
                                      {lead?.name ||
                                        lead?.fullName ||
                                        "Lead"}
                                    </strong>
                                    <span>
                                      {lead?.company ||
                                        lead?.companyName ||
                                        lead?.email ||
                                        "-"}
                                    </span>
                                    <small>
                                      {lead?.priority ||
                                        lead?.status ||
                                        ""}
                                    </small>
                                  </div>

                                  <div className="aiw-followup-last-contact">
                                    <span>Last contacted</span>
                                    <strong>
                                      {lead?.lastContactedAgo ||
                                        lead?.lastContacted ||
                                        lead?.last_contacted ||
                                        "-"}
                                    </strong>
                                  </div>

                                  {(lead?.phone || lead?.whatsapp) && (
                                    <button
                                      type="button"
                                      className="aiw-followup-action-btn"
                                      onClick={() => {
                                        const number =
                                          lead?.whatsapp || lead?.phone;
                                        if (number) {
                                          window.location.href = `https://wa.me/${String(
                                            number,
                                          ).replace(/\D/g, "")}`;
                                        }
                                      }}
                                    >
                                      WhatsApp
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {sending && (
                <div className="aiw-msg aiw-msg-assistant">
                  <div className="aiw-msg-avatar aiw-assistant-spark-avatar">
                    <IconSpark />
                  </div>
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

        <div className={`aiw-composer ${isEmpty ? "aiw-composer-empty" : ""}`}>
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
          <div className="aiw-disclaimer">{t("aiCenter.disclaimer")}</div>
        </div>
      </div>
    </div>
  );
}
