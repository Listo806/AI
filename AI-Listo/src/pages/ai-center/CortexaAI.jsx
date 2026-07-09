import React, { useMemo, useState } from "react";
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

import "./CortexaAI.css";

export default function CortexaAI() {
  const [activePage, setActivePage] = useState("setup");
  const [openStep, setOpenStep] = useState(1);
  const [message, setMessage] = useState("");
  const [controlTab, setControlTab] = useState("General");

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
              <i /> Active
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
            <i /> Online
          </p>
          <p>Your AI Agent is active and ready to help.</p>
          <button onClick={() => setActivePage("activity")}>
            View Activity
          </button>
        </div>
      </aside>

      <section className="cx-agent-content">
        {activePage === "setup" && (
          <SetupLayout openStep={openStep} setOpenStep={setOpenStep} />
        )}

        {activePage === "chat" && (
          <ChatLayout message={message} setMessage={setMessage} />
        )}

        {activePage === "knowledge" && <KnowledgeLayout />}

        {activePage === "activity" && <ActivityLayout />}

        {activePage === "controls" && (
          <ControlsLayout
            controlTab={controlTab}
            setControlTab={setControlTab}
          />
        )}
      </section>
    </div>
  );
}

function SetupLayout({ openStep, setOpenStep }) {
  const setupSteps = useMemo(
    () => [
      {
        id: 1,
        title: "Connect WhatsApp",
        desc: "Connect the WhatsApp number your AI Agent will use.",
        icon: MessageSquare,
        status: "Connected",
        statusType: "success",
        action: "Connected",
        accent: "green",
      },
      {
        id: 2,
        title: "Business Profile",
        desc: "Tell your AI Agent about your business.",
        icon: Building2,
        status: "Complete",
        statusType: "success",
        action: "Edit",
        accent: "blue",
      },
      {
        id: 3,
        title: "Import Properties",
        desc: "Add properties your AI can recommend.",
        icon: Home,
        status: "23 imported",
        statusType: "success",
        action: "Import",
        accent: "orange",
      },
      {
        id: 4,
        title: "Appointment Rules",
        desc: "Define when and how AI can book appointments.",
        icon: CalendarDays,
        status: "Configured",
        statusType: "success",
        action: "Configure",
        accent: "indigo",
      },
      {
        id: 5,
        title: "AI Behavior",
        desc: "Define how your AI should talk and what to ask.",
        icon: MessageSquare,
        status: "Configured",
        statusType: "success",
        action: "Configure",
        accent: "green",
      },
      {
        id: 6,
        title: "Automations",
        desc: "Choose what your AI Agent should do automatically.",
        icon: Zap,
        status: "4 automations",
        statusType: "success",
        action: "Set up",
        accent: "purple",
      },
      {
        id: 7,
        title: "Test AI",
        desc: "Test your AI Agent in a safe environment.",
        icon: TestTube2,
        status: "Tested",
        statusType: "success",
        action: "Test",
        accent: "pink",
      },
      {
        id: 8,
        title: "Launch AI Agent",
        desc: "Review and launch your AI Agent.",
        icon: Rocket,
        status: "Ready",
        statusType: "success",
        action: "Launch",
        accent: "rose",
      },
    ],
    [],
  );

  const progress = 100;

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
                        <button className="cx-step-action">
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
                    <div className="cx-whatsapp-panel">
                      <div className="cx-pairing-col">
                        <h4>
                          Pairing Code <span>(Recommended)</span>
                        </h4>
                        <p>Enter this code in your WhatsApp mobile app.</p>

                        <div className="cx-pairing-code">
                          <strong>729 - KDF - 913</strong>
                          <button>
                            <Copy size={22} />
                          </button>
                        </div>

                        <ol className="cx-pairing-steps">
                          <li>Open WhatsApp on your phone</li>
                          <li>Go to Settings &gt; Linked Devices</li>
                          <li>Tap “Link a Device” and enter the code above</li>
                        </ol>

                        <div className="cx-expire-box">
                          <Clock3 size={18} />
                          Code expires in <strong>04:58</strong>
                        </div>
                      </div>

                      <div className="cx-qr-col">
                        <h4>QR Code</h4>
                        <p>Scan this QR code with your WhatsApp mobile app.</p>
                        <div className="cx-qr-box">
                          <div className="cx-qr-fake">
                            <MessageSquare size={42} />
                          </div>
                        </div>
                        <button className="cx-refresh-btn">
                          <RefreshCw size={18} />
                          Refresh QR
                        </button>
                      </div>

                      <div className="cx-panel-actions">
                        <button className="cx-secondary-btn">
                          Save for later
                        </button>
                        <button className="cx-primary-btn">
                          Connected WhatsApp
                        </button>
                      </div>
                    </div>
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
                <strong>8 of 8 steps completed</strong>
                <p>Great work!</p>
                <p>Your AI Agent is ready.</p>
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
                  <div className="cx-status-value success">
                    <CircleCheck size={15} /> Complete
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

function ChatLayout({ message, setMessage }) {
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
                <button key={item.title} className="cx-prompt-card">
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

          <div className="cx-chat-input">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
            />
            <Mic size={24} />
            <button>
              <Send size={22} />
            </button>
          </div>

          <p className="cx-ai-note">
            AI can make mistakes. Please verify important information.
          </p>
        </main>

        <aside className="cx-right-column">
          <GlanceCard />
          <PriorityTasks />
          <RecentActivityMini />
        </aside>
      </div>
    </div>
  );
}

function KnowledgeLayout() {
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
          value="32"
          desc="Total items"
          accent="purple"
        />
        <StatCard
          icon={CircleCheck}
          title="Active Items"
          value="28"
          desc="Currently in use"
          accent="green"
        />
        <StatCard
          icon={Database}
          title="Data Sources"
          value="8"
          desc="Connected sources"
          accent="blue"
        />
        <StatCard
          icon={Sparkles}
          title="Last Updated"
          value="2h ago"
          desc="May 23, 2024"
          accent="orange"
        />
      </div>

      <div className="cx-two-col">
        <main className="cx-white-card">
          <h2>Knowledge Categories</h2>
          <p>Organize and manage what your AI knows.</p>

          <div className="cx-category-list">
            {categories.map(([title, desc, count, Icon, accent]) => (
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
              <div className="cx-big-score">87%</div>
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

function ActivityLayout() {
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

            {rows.map(([time, title, desc, Icon, status], index) => (
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
                <span>Lead: Maria Lopez</span>
                <em className={status === "Escalated" ? "warning" : ""}>
                  {status}
                </em>
              </div>
            ))}

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
                value="156"
                desc="↑ 18% vs last 7 days"
              />
              <StatMini
                icon={CircleCheck}
                title="Completed"
                value="142"
                desc="91%"
              />
              <StatMini
                icon={TriangleAlert}
                title="Escalated"
                value="9"
                desc="6%"
              />
              <StatMini icon={CircleX} title="Failed" value="5" desc="3%" />
            </div>
          </div>

          <div className="cx-white-card">
            <h2>
              Activity by Type <button>View all</button>
            </h2>
            {activityTypes.map((item) => {
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
              {topActions.map((item) => {
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

function ControlsLayout({ controlTab, setControlTab }) {
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
        <button className="cx-primary-btn slim">
          <Save size={16} /> Save Changes
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
              {capabilities.map(([title, desc, Icon, enabled], index) => (
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
                  <button className={`cx-switch ${enabled ? "on" : ""}`}>
                    <i />
                  </button>
                  <ChevronRight size={18} />
                </div>
              ))}
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
              <StatMini title="Appointments Booked" value="8" desc="↑ 33%" />
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
              Professional & Friendly <ChevronDown size={18} />
            </button>
          </div>

          <div className="cx-white-card">
            <h2>Quick Controls</h2>

            {[
              {
                title: "Pause AI Agent",
                desc: "Temporarily pause all AI actions",
                active: false,
                icon: PauseCircle,
                accent: "red",
              },
              {
                title: "Do Not Disturb",
                desc: "Silence notifications after hours",
                active: true,
                icon: Moon,
                accent: "blue",
              },
              {
                title: "Working Hours Only",
                desc: "9:00 AM - 6:00 PM (Mon - Fri)",
                active: true,
                icon: Timer,
                accent: "green",
              },
              {
                title: "Weekends Active",
                desc: "Allow AI to work on weekends",
                active: false,
                icon: CalendarDays,
                accent: "orange",
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div className="cx-quick-control" key={item.title}>
                  <div className={`cx-quick-control-icon ${item.accent}`}>
                    <Icon size={18} />
                  </div>

                  <div className="cx-quick-control-content">
                    <strong>{item.title}</strong>
                    <p>{item.desc}</p>
                  </div>

                  <button className={`cx-switch ${item.active ? "on" : ""}`}>
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

function GlanceCard() {
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

function PriorityTasks() {
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

function RecentActivityMini() {
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
