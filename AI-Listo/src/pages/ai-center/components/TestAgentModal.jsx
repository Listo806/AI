import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  Check,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  TestTube2,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import "./TestAgentModal.css";

const QUICK_PROMPTS = [
  { id: "bedroom", text: "Hi, I’m looking for a 3 bedroom home." },
  { id: "budget", text: "Can you recommend properties under $500,000?" },
  { id: "booking", text: "I want to book a property showing tomorrow." },
  { id: "areas", text: "What areas do you currently serve?" },
];

export default function TestAgentModal({
  open,
  status,
  loading,
  sending,
  error,
  onClose,
  onSend,
  onRefresh,
  onNewSession,
}) {
  const { t } = useTranslation();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const listRef = useRef(null);
  const initializedSessionRef = useRef(null);

  useEffect(() => {
    if (!open) {
      initializedSessionRef.current = null;

      return;
    }
    const sessionId = status?.latestSession?.id || "empty";
    if (initializedSessionRef.current === sessionId) {
      return;
    }
    initializedSessionRef.current = sessionId;
    const storedMessages = Array.isArray(status?.latestSession?.messages)
      ? status.latestSession.messages
      : [];

    if (storedMessages.length > 0) {
      setMessages(
        storedMessages.map((item) => ({
          id: item.id,
          role: item.role,
          content: item.content,
          error: Boolean(item?.metadata?.error),
        })),
      );
    } else {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: t(
            "aiCenter.testAgentModal.welcomeMessage",
            "Your AI Agent is ready for a safe test. Send a message to verify its behavior before launch.",
          ),
        },
      ]);
    }

    setMessage("");
  }, [open, status?.latestSession?.id]);

  useEffect(() => {
    const element = listRef.current;
    if (!element) return;

    element.scrollTop = element.scrollHeight;
  }, [messages, sending]);

  const canSend = useMemo(
    () => Boolean(message.trim()) && !sending,
    [message, sending],
  );

  const send = async (text = message) => {
    const clean = String(text || "").trim();

    if (!clean || sending) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: clean,
    };

    setMessages((current) => [...current, userMessage]);

    setMessage("");

    try {
      const response = await onSend(clean);
      setMessages((current) => [
        ...current,
        {
          id: response?.assistantMessage?.id || `assistant-${Date.now()}`,
          role: "assistant",
          content:
            response?.assistantMessage?.content ||
            response?.answer ||
            t(
              "aiCenter.testAgentModal.noResponse",
              "The AI Agent returned no response.",
            ),
        },
      ]);
    } catch (requestError) {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          error: true,
          content:
            requestError?.response?.data?.message ||
            requestError?.message ||
            t("aiCenter.testAgentModal.testFailed", "The AI test failed."),
        },
      ]);
    }
  };

  if (!open) return null;

  return (
    <div className="cx-test-agent-backdrop" onMouseDown={onClose}>
      <div
        className="cx-test-agent-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="cx-test-agent-head">
          <div>
            <span className="cx-test-agent-icon">
              <TestTube2 size={22} />
            </span>

            <div>
              <h2>{t("aiCenter.testAgentModal.title", "Test AI Agent")}</h2>
              <p>
                {t(
                  "aiCenter.testAgentModal.subtitle",
                  "Test your setup safely before launching.",
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t("aiCenter.testAgentModal.close", "Close")}
          >
            <X size={20} />
          </button>
        </header>

        <div className="cx-test-agent-status">
          <div>
            <span className={status?.tested ? "tested" : "not-tested"}>
              {status?.tested ? (
                <>
                  <Check size={15} />
                  {t("aiCenter.testAgentModal.tested", "Tested")}
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  {t("aiCenter.testAgentModal.notTested", "Not tested yet")}
                </>
              )}
            </span>

            <p>
              {status?.total
                ? t(
                    "aiCenter.testAgentModal.previousTestRuns",
                    "{{total}} previous test runs",
                    { total: status.total },
                  )
                : t(
                    "aiCenter.testAgentModal.noPreviousTestRuns",
                    "No previous test runs",
                  )}
            </p>
          </div>
          <button
            type="button"
            className="cx-test-agent-new-btn"
            disabled={sending || loading}
            onClick={async () => {
              const session = await onNewSession?.();
              initializedSessionRef.current = session?.id || null;
              setMessages([
                {
                  id: "welcome",
                  role: "assistant",
                  content: t(
                    "aiCenter.testAgentModal.newSessionMessage",
                    "A new safe test session is ready. Send your first message.",
                  ),
                },
              ]);
              setMessage("");
            }}
          >
            <Plus size={16} />
            {t("aiCenter.testAgentModal.newTest", "New Test")}
          </button>
          <button type="button" onClick={onRefresh} disabled={loading}>
            <RefreshCw size={16} className={loading ? "spin" : ""} />
            {t("aiCenter.testAgentModal.refresh", "Refresh")}
          </button>
        </div>

        {error && <div className="cx-test-agent-error">{error}</div>}

        <div className="cx-test-agent-body">
          <aside className="cx-test-agent-prompts">
            <h3>{t("aiCenter.testAgentModal.tryScenario", "Try a scenario")}</h3>

            {QUICK_PROMPTS.map(({ id, text }) => {
              const prompt = t(
                `aiCenter.testAgentModal.quickPrompt.${id}`,
                text,
              );

              return (
                <button
                  type="button"
                  key={id}
                  onClick={() => send(prompt)}
                  disabled={sending}
                >
                  <MessageSquare size={16} />
                  <span>{prompt}</span>
                </button>
              );
            })}

            <div className="cx-test-agent-note">
              <Bot size={19} />
              <div>
                <strong>
                  {t("aiCenter.testAgentModal.safeTestMode", "Safe test mode")}
                </strong>
                <p>
                  {t(
                    "aiCenter.testAgentModal.safeTestNote",
                    "This test does not send messages to real WhatsApp leads.",
                  )}
                </p>
              </div>
            </div>
          </aside>

          <main className="cx-test-agent-chat">
            <div className="cx-test-agent-messages" ref={listRef}>
              {messages.map((item) => (
                <div
                  key={item.id}
                  className={`cx-test-agent-message ${item.role} ${
                    item.error ? "error" : ""
                  }`}
                >
                  <span>
                    {item.role === "assistant" ? (
                      <Bot size={16} />
                    ) : (
                      <MessageSquare size={16} />
                    )}
                  </span>

                  <p>{item.content}</p>
                </div>
              ))}

              {sending && (
                <div className="cx-test-agent-message assistant">
                  <span>
                    <Bot size={16} />
                  </span>
                  <p className="thinking">
                    {t(
                      "aiCenter.testAgentModal.thinking",
                      "AI Agent is thinking...",
                    )}
                  </p>
                </div>
              )}
            </div>

            <div className="cx-test-agent-input">
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    send();
                  }
                }}
                rows={2}
                placeholder={t(
                  "aiCenter.testAgentModal.messagePlaceholder",
                  "Type a test message...",
                )}
                maxLength={2000}
              />

              <button type="button" onClick={() => send()} disabled={!canSend}>
                <Send size={18} />
                {t("aiCenter.testAgentModal.sendTest", "Send Test")}
              </button>
            </div>

            <p className="cx-test-agent-disclaimer">
              {t(
                "aiCenter.testAgentModal.disclaimer",
                "This simulates a real lead chatting on WhatsApp. The AI qualifies using your settings, and if booking is enabled it will offer and book a viewing against your appointment rules. Nothing is sent to a real phone.",
              )}
            </p>
          </main>
        </div>

        <footer className="cx-test-agent-foot">
          <div>
            {status?.tested ? (
              <span className="complete">
                <Check size={16} />
                {t(
                  "aiCenter.testAgentModal.testCompleted",
                  "AI Agent test completed",
                )}
              </span>
            ) : (
              <span>
                {t(
                  "aiCenter.testAgentModal.sendAtLeastOne",
                  "Send at least one successful test message.",
                )}
              </span>
            )}
          </div>

          <button type="button" className="secondary" onClick={onClose}>
            {t("aiCenter.testAgentModal.close", "Close")}
          </button>
        </footer>
      </div>
    </div>
  );
}
