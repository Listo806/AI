import React, { useState } from "react";
import { Mail, MessageCircle, ArrowRight, Bot, UserRound, CheckCircle } from "lucide-react";
import "./Common.css";

export default function Contact() {
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "Hi, I’m Cortexa AI Support. Tell me what you need help with, and I’ll guide you or send your request to our support team.",
    },
  ]);

  const [input, setInput] = useState("");
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", text: input };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setIsSending(true);

    try {
      const res = await fetch("/api/support/ai-chat", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          message: userMessage.text,
          email,
          transcript: updatedMessages,
        }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text:
            data.reply ||
            "Thanks — I’ve logged your request. Our team can follow up if needed.",
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text:
            "I saved your message locally, but there was an issue reaching support.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const submitTranscript = async () => {
    if (!email.trim()) {
      alert("Please enter your email.");
      return;
    }

    setIsSending(true);

    try {
      await fetch("/api/support/transcript", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          email,
          transcript: messages,
          source: "contact-us-page",
        }),
      });

      setSubmitted(true);
    } catch {
      alert("Error sending request.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <main className="contact-page">

      <section className="contact-hero">
        <div className="sub_container center">
          <p className="contact-label">Contact Support</p>
          <h1>Need help? Talk to our AI first.</h1>
          <p className="contact-sub">
            Ask a question or describe your issue. AI will guide you instantly.
          </p>
        </div>
      </section>

      <section className="contact-main">
        <div className="sub_container grid">

          <div className="chat-box">

            <div className="chat-header">
              <div className="chat-header-left">
                <Bot />
                <div>
                  <h2>Cortexa AI Support</h2>
                  <p>Instant help</p>
                </div>
              </div>
              <span className="status">Online</span>
            </div>

            <div className="chat-email">
              <label>Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
              />
            </div>

            <div className="chat-messages">
              {messages.map((msg, i) => (
                <div key={i} className={`msg ${msg.role}`}>
                  {msg.role === "ai" && <Bot />}
                  <div className="bubble">{msg.text}</div>
                  {msg.role === "user" && <UserRound />}
                </div>
              ))}
              {isSending && <p className="thinking">Thinking...</p>}
            </div>

            <div className="chat-input">
              <div className="row">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type message..."
                />
                <button onClick={sendMessage}>Send</button>
              </div>

              <button
                className="submit-btn"
                onClick={submitTranscript}
                disabled={submitted}
              >
                {submitted ? "Sent" : "Send Transcript"}
              </button>
            </div>

          </div>

          <aside className="contact-side">

            <div className="card">
              <MessageCircle />
              <h3>What can AI help with?</h3>
              <ul>
                <li>Apps & integrations</li>
                <li>Leads & follow-ups</li>
                <li>Listings</li>
                <li>Billing</li>
              </ul>
            </div>

            <div className="card dark">
              <Mail />
              <h3>Email support</h3>
              <a href="mailto:support@cortexacrm.com">
                support@cortexacrm.com
              </a>
            </div>

          </aside>

        </div>
      </section>

    </main>
  );
}

