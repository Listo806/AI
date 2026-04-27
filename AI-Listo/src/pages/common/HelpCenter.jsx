import React, { useState } from "react";
import {
  Search,
  ArrowRight,
  LayoutDashboard,
  Users,
  MessageCircle,
  Workflow,
  Home,
  Brain,
  Zap,
  Plug,
  UserPlus,
  CreditCard,
  Mail,
  Bot,
  ChevronLeft,
  UploadCloud,
} from "lucide-react";
import "./Common.css";

const helpTopics = [
  {
    id: "dashboard",
    title: "Dashboard & Analytics",
    icon: LayoutDashboard,
    description: "Understand your metrics, funnels, revenue, and performance.",
    tags: ["Metrics", "Revenue", "Reports"],
    steps: [
      "Open the Dashboard from the sidebar.",
      "Review leads and revenue.",
      "Check funnel and analytics.",
    ],
  },
  {
    id: "leads",
    title: "Leads & Contacts",
    icon: Users,
    description: "Manage leads and customer data.",
    tags: ["Leads", "CRM"],
    steps: [
      "Open Leads section.",
      "View lead details.",
      "Update lead status.",
    ],
  },
];

export default function HelpCenterPage() {
  const [query, setQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState(null);

  const filteredTopics = helpTopics.filter((topic) =>
    `${topic.title} ${topic.description} ${topic.tags.join(" ")}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  const TopicIcon = selectedTopic?.icon;

  return (
    <main className="help-page">

      {/* HERO */}
      <section className="help-hero">
        <div className="container center">
          <p className="label">Cortexa Help Center</p>
          <h1>Get help with every part of your CRM.</h1>
          <p className="sub">
            Step-by-step guidance for everything.
          </p>

          <div className="search-box">
            <Search size={18} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search help topics..."
            />
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="help-content">
        <div className="container">

          {!selectedTopic ? (
            <>
              <div className="help-header">
                <div>
                  <h2>What do you need help with?</h2>
                  <p>Select a topic below</p>
                </div>

                <a className="btn" href="/contact">
                  Contact Support <ArrowRight size={16} />
                </a>
              </div>

              <div className="grid">
                {filteredTopics.map((topic) => {
                  const Icon = topic.icon;

                  return (
                    <button
                      key={topic.id}
                      className="card"
                      onClick={() => setSelectedTopic(topic)}
                    >
                      <div className="icon">
                        <Icon size={22} />
                      </div>

                      <h3>{topic.title}</h3>
                      <p>{topic.description}</p>

                      <div className="tags">
                        {topic.tags.map((tag) => (
                          <span key={tag}>{tag}</span>
                        ))}
                      </div>

                      <div className="view">
                        View instructions <ArrowRight size={14} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="detail">

              <button
                className="back"
                onClick={() => setSelectedTopic(null)}
              >
                <ChevronLeft size={16} /> Back
              </button>

              <div className="detail-box">

                <div className="big-icon">
                  {TopicIcon && <TopicIcon size={28} />}
                </div>

                <h2>{selectedTopic.title}</h2>
                <p>{selectedTopic.description}</p>

                <div className="steps">
                  {selectedTopic.steps.map((step, i) => (
                    <div className="step" key={i}>
                      <div className="num">{i + 1}</div>
                      <p>{step}</p>
                    </div>
                  ))}
                </div>

                <div className="actions">
                  <a href="/contact" className="ai-box">
                    <Bot size={18} />
                    Ask AI Support
                  </a>

                  <a href="mailto:support@cortexa.ai" className="mail-box">
                    <Mail size={18} />
                    Email Support
                  </a>
                </div>

              </div>

            </div>
          )}

        </div>
      </section>

    </main>
  );
}