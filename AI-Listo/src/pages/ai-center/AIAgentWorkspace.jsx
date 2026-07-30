import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useAuth } from "../../context/AuthContext";
import apiClient from "../../api/apiClient";
import aiAgentSetupService from "./services/aiAgentSetup.service";
import "./AIAgentWorkspace.css";

/* Suggested CRM commands shown on the empty state. These map to what the
   backend agent already answers over (leads / pipeline / properties / etc.). */
const SUGGESTED_COMMANDS = [
  "Which leads need follow-up today?",
  "Summarize my sales pipeline.",
  "Show me my hottest opportunities.",
  "Draft a WhatsApp follow-up for this lead.",
  "Which deals have been inactive for 7+ days?",
  "What appointments do I have today?",
  "Show me properties without recent activity.",
  "Create tasks for overdue leads.",
  "Give me today's CRM summary.",
  "Generate a weekly sales report.",
  "Help me build an automation workflow.",
  "Show me my team's performance.",
  "Which leads haven't replied?",
  "What tasks are overdue?",
  "Create a follow-up sequence for these leads.",
  "Summarize today's conversations.",
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

export default function AIAgentWorkspace() {
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
  const [historyOpen, setHistoryOpen] = useState(true);

  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const textareaRef = useRef(null);

  const firstName = useMemo(() => {
    const name = user?.name || user?.email || "";
    return String(name).trim().split(" ")[0] || "there";
  }, [user]);

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
      setError("Could not load this conversation.");
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

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
          "No response returned.";
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
        setError(e?.message || "Something went wrong. Please try again.");
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: "assistant",
            content:
              "I could not complete that request right now. Please try again in a moment.",
            error: true,
            createdAt: new Date().toISOString(),
          },
        ]);
      } finally {
        setSending(false);
      }
    },
    [input, attachments, sending, activeSessionId, loadSessions],
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
      setError("Voice input is not supported in this browser.");
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
  }, [listening]);

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = (input.trim() || attachments.length > 0) && !sending;
  const isEmpty = messages.length === 0 && !loadingMessages;

  return (
    <div className="aiw-root">
      <aside
        className={`aiw-history ${historyOpen ? "" : "aiw-history-collapsed"}`}
      >
        <div className="aiw-history-head">
          <span className="aiw-history-title">Conversations</span>
          <button
            type="button"
            className="aiw-newchat"
            onClick={startNewChat}
            title="Start a new conversation"
          >
            <IconPlus />
            <span>New</span>
          </button>
        </div>
        <div className="aiw-history-list">
          {loadingSessions && (
            <div className="aiw-history-empty">Loading...</div>
          )}
          {!loadingSessions && sessions.length === 0 && (
            <div className="aiw-history-empty">No conversations yet.</div>
          )}
          {sessions.map((s) => (
            <button
              type="button"
              key={s.id}
              className={`aiw-history-item ${
                s.id === activeSessionId ? "active" : ""
              }`}
              onClick={() => openSession(s.id)}
              title={s.title || "Conversation"}
            >
              {s.title || "New conversation"}
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
            title="Toggle conversation history"
          >
            <IconMenu />
          </button>
          <div className="aiw-topbar-titles">
            <div className="aiw-title">AI Agent</div>
            <div className="aiw-subtitle">
              Your AI copilot for the leads, pipeline, and properties in Cortexa.
            </div>
          </div>
        </header>

        <div className="aiw-scroll" ref={scrollRef}>
          {isEmpty ? (
            <div className="aiw-empty">
              <div className="aiw-empty-mark">
                <IconSpark />
              </div>
              <h1 className="aiw-empty-title">
                How can I help you today, {firstName}?
              </h1>
              <p className="aiw-empty-sub">
                Ask anything about your leads, pipeline, appointments, or
                properties.
              </p>
              <div className="aiw-suggestions">
                {SUGGESTED_COMMANDS.map((cmd) => (
                  <button
                    type="button"
                    key={cmd}
                    className="aiw-suggestion"
                    onClick={() => handleSend(cmd)}
                  >
                    {cmd}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="aiw-messages">
              {loadingMessages && (
                <div className="aiw-loading">Loading conversation...</div>
              )}
              {messages.map((m) => (
                <div key={m.id} className={`aiw-msg aiw-msg-${m.role}`}>
                  <div className="aiw-msg-avatar">
                    {m.role === "user" ? "You" : "AI"}
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
                  <div className="aiw-msg-avatar">AI</div>
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
                    title="Remove attachment"
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
              placeholder="Ask Cortexa AI anything..."
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
                title="Attach a file"
              >
                <IconPaperclip />
                <span>{uploading ? "Uploading..." : "Attach"}</span>
              </button>
              <button
                type="button"
                className={`aiw-tool-btn ${listening ? "aiw-listening" : ""}`}
                onClick={toggleVoice}
                title="Voice input"
              >
                <IconMic />
                <span>{listening ? "Listening..." : "Voice"}</span>
              </button>
              <button
                type="button"
                className="aiw-send"
                onClick={() => handleSend()}
                disabled={!canSend}
                title="Send"
              >
                <IconSend />
              </button>
            </div>
          </div>
          <div className="aiw-disclaimer">
            AI can make mistakes. Please verify important information.
          </div>
        </div>
      </div>
    </div>
  );
}
