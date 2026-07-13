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

import "./TestAgentModal.css";

const QUICK_PROMPTS = [
  "Hi, I’m looking for a 3 bedroom home.",
  "Can you recommend properties under $500,000?",
  "I want to book a property showing tomorrow.",
  "What areas do you currently serve?",
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
          content:
            "Your AI Agent is ready for a safe test. Send a message to verify its behavior before launch.",
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
            "The AI Agent returned no response.",
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
            "The AI test failed.",
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
              <h2>Test AI Agent</h2>
              <p>Test your setup safely before launching.</p>
            </div>
          </div>

          <button type="button" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </header>

        <div className="cx-test-agent-status">
          <div>
            <span className={status?.tested ? "tested" : "not-tested"}>
              {status?.tested ? (
                <>
                  <Check size={15} />
                  Tested
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  Not tested yet
                </>
              )}
            </span>

            <p>
              {status?.total
                ? `${status.total} previous test runs`
                : "No previous test runs"}
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
                  content:
                    "A new safe test session is ready. Send your first message.",
                },
              ]);
              setMessage("");
            }}
          >
            <Plus size={16} />
            New Test
          </button>
          <button type="button" onClick={onRefresh} disabled={loading}>
            <RefreshCw size={16} className={loading ? "spin" : ""} />
            Refresh
          </button>
        </div>

        {error && <div className="cx-test-agent-error">{error}</div>}

        <div className="cx-test-agent-body">
          <aside className="cx-test-agent-prompts">
            <h3>Try a scenario</h3>

            {QUICK_PROMPTS.map((prompt) => (
              <button
                type="button"
                key={prompt}
                onClick={() => send(prompt)}
                disabled={sending}
              >
                <MessageSquare size={16} />
                <span>{prompt}</span>
              </button>
            ))}

            <div className="cx-test-agent-note">
              <Bot size={19} />
              <div>
                <strong>Safe test mode</strong>
                <p>This test does not send messages to real WhatsApp leads.</p>
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
                  <p className="thinking">AI Agent is thinking...</p>
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
                rows={3}
                placeholder="Type a test message..."
                maxLength={2000}
              />

              <button type="button" onClick={() => send()} disabled={!canSend}>
                <Send size={18} />
                Send Test
              </button>
            </div>

            <p className="cx-test-agent-disclaimer">
              Responses use your current business profile, properties,
              appointment rules, AI behavior, and automation settings.
            </p>
          </main>
        </div>

        <footer className="cx-test-agent-foot">
          <div>
            {status?.tested ? (
              <span className="complete">
                <Check size={16} />
                AI Agent test completed
              </span>
            ) : (
              <span>Send at least one successful test message.</span>
            )}
          </div>

          <button type="button" className="secondary" onClick={onClose}>
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}
