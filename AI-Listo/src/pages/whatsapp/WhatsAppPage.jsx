import React from "react";
import { QRCodeCanvas } from "qrcode.react";
import { useWhatsAppDashboard } from "./hooks/useWhatsAppDashboard";
import "./WhatsApp.css";

import {
  Search,
  SlidersHorizontal,
  Download,
  ChevronDown,
  Plus,
  Calendar,
  MessageCircle,
  Phone,
  Video,
  MoreVertical,
  Sparkles,
  Send,
  Users,
  Bot,
  Clock3,
  TrendingUp,
  Flame,
  ArrowRight,
  Brain,
  Home,
  Smile,
  Paperclip,
  ImageIcon,
  Mic,
  ArrowUpRight,
  CheckCheck,
  Smartphone,
  CheckCircle2,
  Lock,
  Share2,
  Grid,
  Layers,
  Pause,
  BriefcaseBusiness,
  User,
  Info,
} from "lucide-react";
import qrImg from "../../assets/cortexa/qr.png";
export default function WhatsAppPage() {
  const [showTimelineDrawer, setShowTimelineDrawer] = React.useState(false);
  const [visibleConversations, setVisibleConversations] = React.useState(10);

  const {
    loading,
    statusLoading,
    messagesLoading,
    sending,

    status,
    qr,

    dashboardStats = [],
    dashboardSegments = {},
    aiStatus,
    filteredConversations = [],
    selectedConversation,
    setSelectedConversation,

    messages = [],
    selectedIntelligence = {},
    timeline = [],

    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    aiFilter,
    setAiFilter,

    messageText,
    setMessageText,

    refresh,
    connectDevice,
    disconnectDevice,
    sendMessage,
    toggleSelectedAi,
    intelligenceLoading,
    aiIntelligence,
    timelineLoading,
    timelineHasMore,
    loadMoreTimeline,
    conversations = [],
    aiAssistLoading,
    aiAssistReply,
    setAiAssistReply,
    generateAiAssistReply,
  } = useWhatsAppDashboard();

  const [showAiAssist, setShowAiAssist] = React.useState(false);
  React.useEffect(() => {
    setVisibleConversations(10);
  }, [search, statusFilter, aiFilter]);

  const formatChatDateTime = (value) => {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const now = new Date();

    const isSameDay = date.toDateString() === now.toDateString();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const time = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (isSameDay) return time;

    if (isYesterday) return `Yesterday, ${time}`;

    const dateText = date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      ...(date.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}),
    });

    return `${dateText}, ${time}`;
  };

  const getMessageStatusIcon = (msg) => {
    if (msg.direction === "inbound") return null;

    const status = msg.status || "sent";

    if (status === "pending") {
      return <Clock3 size={12} className="ticks-inline" />;
    }

    if (status === "failed") {
      return <span className="wa-message-failed">!</span>;
    }

    return (
      <CheckCheck
        size={12}
        className={`ticks-inline ${
          status === "read" ? "wa-read-tick" : "wa-sent-tick"
        }`}
      />
    );
  };

  const [showAiActivityDrawer, setShowAiActivityDrawer] = React.useState(false);
  const aiActivityItems = (timeline || []).filter((item) =>
    String(item.title || "")
      .toLowerCase()
      .includes("ai"),
  );
  return (
    <div className="leads-page whatsapp-page">
      <div className="heading_page">
        <MessageCircle className="header-icon" size={20} />
        <h1>
          WhatsApp Inbox{" "}
          <CheckCircle2
            size={16}
            fill="#2563eb"
            color="white"
            className="verified-badge"
          />
        </h1>
      </div>
      <p className="sub_head">
        Manage conversations, assist with AI, close more deals.
      </p>

      {/* MAIN THREE-COLUMN WORKSPACE */}
      <div className="leads-layout main-workspace-layout">
        <div className="main-workspace-left">
          {/* TOP STATS COUNTERS */}
          <div className="top-stats-row-grid">
            {(dashboardStats || []).map((item, index) => (
              <div className="stat-metric-box" key={index}>
                <div
                  className={`metric-icon-wrap ${
                    index === 0
                      ? "bg-light-green"
                      : index === 1
                        ? "bg-light-blue"
                        : index === 2
                          ? "bg-light-orange"
                          : index === 3
                            ? "bg-light-purple"
                            : index === 4
                              ? "bg-light-amber"
                              : index === 5
                                ? "bg-light-teal"
                                : "bg-light-indigo"
                  }`}
                >
                  {item.iconKey === "smartphone" ? (
                    <Smartphone size={18} color="#16a34a" />
                  ) : item.iconKey === "bot" ? (
                    <Bot size={18} color="#9333ea" />
                  ) : item.iconKey === "calendar" ? (
                    <Calendar size={18} color="#d97706" />
                  ) : item.iconKey === "clock" ? (
                    <Clock3 size={18} color="#0d9488" />
                  ) : item.iconKey === "trend" ? (
                    <TrendingUp size={18} color="#4f46e5" />
                  ) : (
                    <MessageCircle size={18} color="#2563eb" />
                  )}
                </div>

                <div className="metric-details">
                  <span className="metric-label">{item.label}</span>
                  <h3 className="metric-value">{item.value}</h3>
                  <span className={`metric-subtext ${item.className}`}>
                    {item.subtext}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="main-workspace-1">
            {/* COLUMN 1: CONVERSATIONS LIST */}
            <div className="lead-sidebar conversations-inbox-column">
              <div className="inbox-tabs-navigation">
                <button
                  className={`tab-item ${statusFilter === "all" ? "active" : ""}`}
                  onClick={() => setStatusFilter("all")}
                >
                  All <span className="tab-count">{conversations.length}</span>
                </button>

                <button
                  className={`tab-item ${statusFilter === "unread" ? "active" : ""}`}
                  onClick={() => setStatusFilter("unread")}
                >
                  Unread{" "}
                  <span className="tab-count">
                    {
                      conversations.filter(
                        (i) => Number(i.unread_count || 0) > 0,
                      ).length
                    }
                  </span>
                </button>

                <button
                  className={`tab-item ${statusFilter === "human" ? "active" : ""}`}
                  onClick={() => setStatusFilter("human")}
                >
                  Mine{" "}
                  <span className="tab-count">
                    {conversations.filter((i) => !i.ai_enabled).length}
                  </span>
                </button>
              </div>
              <div className="inbox-search-bar-wrapper">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  className="inbox-search-input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                {search && (
                  <button
                    className="wa-search-clear-btn"
                    onClick={() => setSearch("")}
                    type="button"
                  >
                    ×
                  </button>
                )}
              </div>
              <div className="lead-list inbox-cards-stack">
                {filteredConversations.length ? (
                  filteredConversations
                    .slice(0, visibleConversations)
                    .map((conv) => (
                      <div
                        className={`lead-card ${
                          selectedConversation?.id === conv.id
                            ? "active-chat-card"
                            : ""
                        }`}
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv)}
                      >
                        <div className="avatar-circle-frame">
                          {conv.avatarUrl ? (
                            <img
                              src={conv.avatarUrl}
                              alt={conv.displayName}
                              className="avatar-img"
                            />
                          ) : (
                            <div className="avatar-letters bg-orange-avatar">
                              {conv.initials}
                            </div>
                          )}
                        </div>

                        <div className="lead-meta-details">
                          <div className="meta-name-row">
                            <h4>{conv.displayName}</h4>
                            <span className="card-timestamp-meta">
                              {conv.timeAgo}
                            </span>
                          </div>

                          <div className="chat-card-score-strip">
                            <p
                              className={`last-message-snippet ${
                                Number(conv.unread_count || 0) > 0
                                  ? "emphasis-unread"
                                  : ""
                              }`}
                            >
                              {conv.lastMessage || "No recent message"}
                            </p>
                            <span
                              className={`pill-tag-temp ${conv.tag?.toLowerCase()}`}
                            >
                              {conv.tag}
                            </span>

                            {Number(conv.unread_count || 0) > 0 && (
                              <div className="unread-count-bubble-badge">
                                {conv.unread_count}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="lead-card">
                    <p className="last-message-snippet">
                      No conversations found.
                    </p>
                  </div>
                )}
              </div>

              <div className="sidebar-footer">
                <div className="sidebar-footer">
                  {filteredConversations.length > visibleConversations && (
                    <div className="sidebar-footer">
                      <button
                        className="view-all-btn full-width-center-btn"
                        onClick={() =>
                          setVisibleConversations((prev) => prev + 10)
                        }
                      >
                        Load More Conversations
                        <span style={{ marginLeft: 6 }}>
                          ({visibleConversations}/{filteredConversations.length}
                          )
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* COLUMN 2: CENTRAL CONVERSATION PANEL */}
            <div className="conversation-panel chat-workspace-column">
              <div className="conversation-header chat-header-top-nav">
                <div className="conversation-user header-user-profile-left">
                  <div className="avatar-letters bg-orange-avatar size-44">
                    {selectedConversation?.initials || "WA"}
                  </div>
                  <div>
                    <div className="d-flex">
                      <h3>
                        {selectedConversation?.displayName ||
                          "Select Conversation"}
                      </h3>
                      <span className="hot-tag-pill">
                        {selectedConversation?.tag || "-"}
                      </span>
                    </div>
                    <p>
                      {selectedConversation?.contact_phone || "-"} • WhatsApp
                      {selectedConversation?.lead_status
                        ? ` • ${selectedConversation.lead_status}`
                        : ""}
                      {selectedConversation?.assigned_agent_name
                        ? ` • ${selectedConversation.assigned_agent_name}`
                        : ""}
                    </p>

                    {selectedConversation?.property_title && (
                      <p className="wa-header-property">
                        🏠 {selectedConversation.property_title}
                        {selectedConversation.property_city
                          ? ` • ${selectedConversation.property_city}`
                          : ""}
                        {selectedConversation.property_price
                          ? ` • $${Number(selectedConversation.property_price).toLocaleString()}`
                          : ""}
                      </p>
                    )}
                  </div>
                </div>

                <div className="conversation-actions center-header-action-cluster">
                  <span
                    className="ai-handling-badge"
                    onClick={toggleSelectedAi}
                  >
                    <Sparkles size={12} />
                    {selectedConversation?.ai_enabled
                      ? "AI Handling"
                      : "Human Handling"}
                  </span>
                  <button className="icon-btn-borderless btn-normal">
                    <BriefcaseBusiness size={16} />
                    {selectedConversation?.ai_enabled
                      ? "Take Over"
                      : "Resume AI"}
                  </button>
                  <button className="icon-btn-borderless">
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>

              {/* AI SUMMARY BOX BANNER */}
              <div className="ai-summary horizontal-summary-banner">
                <div className="summary-banner-content-top">
                  <h4>AI Summary</h4>
                  {selectedIntelligence?.property && (
                    <div className="wa-property-summary">
                      <div>🏠 {selectedIntelligence.property.title}</div>

                      <div>
                        {selectedIntelligence.property.city}
                        {selectedIntelligence.property.state
                          ? `, ${selectedIntelligence.property.state}`
                          : ""}
                      </div>

                      <div>
                        {selectedIntelligence.property.price
                          ? `$${Number(selectedIntelligence.property.price).toLocaleString()}`
                          : ""}
                      </div>
                    </div>
                  )}
                  <div className="wa-lead-badges">
                    {selectedIntelligence?.lead?.status && (
                      <span className="wa-badge status">
                        {selectedIntelligence.lead.status}
                      </span>
                    )}

                    {selectedIntelligence?.lead?.priority && (
                      <span className="wa-badge priority">
                        {selectedIntelligence.lead.priority}
                      </span>
                    )}

                    {selectedIntelligence?.lead?.source && (
                      <span className="wa-badge source">
                        {selectedIntelligence.lead.source}
                      </span>
                    )}
                  </div>
                  <p>
                    {intelligenceLoading
                      ? "Analyzing conversation..."
                      : selectedIntelligence.summary ||
                        "Buyer interested in Downtown Apartment."}
                  </p>
                </div>

                <div className="summary-divider"></div>
                <div className="summary-metrics-grid">
                  <div className="metric-col">
                    <span className="metric-col-label">Sentiment</span>
                    <span className="metric-col-value sentiment-positive">
                      {selectedIntelligence.sentiment || "-"}
                    </span>
                  </div>

                  <div className="metric-col">
                    <span className="metric-col-label">Intent</span>
                    <span className="metric-col-value intent-high">
                      {selectedIntelligence.intent || "-"}
                    </span>
                  </div>

                  <div className="metric-col">
                    <span className="metric-col-label">AI Score</span>
                    <span className="metric-col-value score-blue">
                      {selectedIntelligence.score
                        ? `${selectedIntelligence.score}%`
                        : "-"}
                    </span>
                  </div>

                  <div className="metric-col">
                    <span className="metric-col-label">Next Action</span>
                    <span className="metric-col-value action-text">
                      {selectedIntelligence.recommendedAction ||
                        "Send property details"}
                    </span>
                  </div>
                </div>
              </div>

              {/* DIALOGUE STREAM SCROLL */}
              <div className="chat-body message-stream-container">
                {/* Incoming Customer Message */}
                {messagesLoading ? (
                  <div className="chat-message-row user-incoming-msg">
                    <div className="message-bubble-body">
                      <p>Loading messages...</p>
                    </div>
                  </div>
                ) : messages.length ? (
                  messages.map((msg) => {
                    const isInbound = msg.direction === "inbound";
                    const isAi = msg.sender_type === "ai";

                    return (
                      <div
                        className={`chat-message-row ${
                          isInbound ? "user-incoming-msg" : "agent-outgoing-msg"
                        }`}
                        key={msg.id}
                      >
                        {isInbound && (
                          <div className="avatar-letters bg-orange-avatar size-28">
                            {selectedConversation?.initials || "?"}
                          </div>
                        )}

                        <div
                          className={`message-bubble-body ${
                            !isInbound ? "bg-light-blue-bubble" : ""
                          }`}
                        >
                          <p>
                            {msg.body || `[${msg.message_type || "message"}]`}
                          </p>
                          <span
                            className={`message-time-stamp ${!isInbound ? "text-right" : ""}`}
                          >
                            {formatChatDateTime(msg.created_at)}
                            {!isInbound && getMessageStatusIcon(msg)}
                          </span>
                        </div>

                        {!isInbound && (
                          <div className="chat-avatar-badge-bot">
                            {isAi ? (
                              <Bot size={14} color="white" />
                            ) : (
                              <Users size={14} color="white" />
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="chat-message-row user-incoming-msg">
                    <div className="message-bubble-body">
                      <p>No messages yet.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="response-mode-banner">
                <div className="banner-title">Who is responding?</div>

                <div className="mode-options-group">
                  <button
                    className={`mode-btn ${
                      selectedConversation?.ai_enabled
                        ? "btn-ai active"
                        : "btn-ai"
                    }`}
                  >
                    <Bot size={16} />
                    <span>AI Active</span>
                  </button>

                  <button
                    className={`mode-btn ${
                      !selectedConversation?.ai_enabled
                        ? "btn-human active"
                        : "btn-human"
                    }`}
                  >
                    <User size={16} />
                    <span>Human Active</span>
                  </button>

                  <button className="mode-btn btn-shared">
                    <Users size={16} />
                    <span>Shared Mode</span>
                  </button>
                </div>

                <button className="info-icon-btn">
                  <Info size={16} />
                </button>
              </div>
              {/* AI CONTEXT SUGGESTED UTILITIES CHIPS */}
              <div className="suggested-chips-scroll panel-mid-utilities-row">
                {(selectedIntelligence.suggestedReplies || []).length ? (
                  selectedIntelligence.suggestedReplies.map((reply, index) => (
                    <button
                      className="utility-chip-action-btn"
                      key={index}
                      onClick={() => setMessageText(reply)}
                    >
                      <Sparkles size={12} /> {reply}
                    </button>
                  ))
                ) : (
                  <>
                    <button className="utility-chip-action-btn">
                      <Home size={12} /> Send Property Options
                    </button>
                    <button className="utility-chip-action-btn">
                      <Calendar size={12} /> Book Appointment
                    </button>
                    <button className="utility-chip-action-btn">
                      <Brain size={12} /> Ask Budget
                    </button>
                    <button className="utility-chip-action-btn">
                      <Share2 size={12} /> Share Location
                    </button>
                  </>
                )}
                <button className="utility-chip-arrow-nav-btn">❯</button>
              </div>

              {/* ACTION INSIGHTS INPUT BLOCK */}
              <div className="chat-input-box modern-input-container">
                <div className="chat-input-top text-area-row">
                  <div className="chat-input-left">
                    <button className="attachment-clip-btn">
                      <Paperclip size={18} />
                    </button>
                    <input
                      placeholder="Type a message or use AI Assist..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();

                          if (!sending && messageText.trim()) {
                            sendMessage();
                          }
                        }
                      }}
                    />
                  </div>
                  <div className="chat-input-right">
                    <button
                      className="ai-assist-spark-inline-btn"
                      onClick={async () => {
                        setShowAiAssist(true);
                        if (!aiAssistReply) {
                          await generateAiAssistReply();
                        }
                      }}
                      disabled={
                        !selectedConversation?.contact_phone || aiAssistLoading
                      }
                    >
                      <Sparkles size={16} color="#2563eb" />
                      {aiAssistLoading ? "Thinking..." : "AI Assist"}
                    </button>
                    <button
                      className={`send-message-main-submit-btn ${
                        sending ? "is-sending" : ""
                      }`}
                      onClick={sendMessage}
                      disabled={
                        sending ||
                        !selectedConversation?.contact_phone ||
                        !messageText.trim()
                      }
                      title={
                        !selectedConversation?.contact_phone
                          ? "Select a conversation first"
                          : !messageText.trim()
                            ? "Type a message first"
                            : "Send message"
                      }
                    >
                      {sending ? (
                        <span className="wa-send-spinner" />
                      ) : (
                        <Send size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="main-workspace-2">
          <div className="ai-status-card">
            <div className="card-header">
              <h3 className="card-title">AI Status</h3>
              <span
                className={`badge ${status?.connected ? "badge-active" : "badge-off"}`}
              >
                {status?.connected ? "Active" : "Offline"}
              </span>
            </div>

            <div className="status-metrics-list">
              <div className="metric-row">
                <span className="metric-label">AI Status</span>
                <span
                  className={`badge ${status?.connected ? "badge-active" : "badge-off"}`}
                >
                  {status?.connected ? "Active" : "Offline"}
                </span>
              </div>

              <div className="metric-row">
                <span className="metric-label">Human Mode</span>
                <span
                  className={`badge ${
                    (aiStatus?.human ?? 0) > 0 ? "badge-active" : "badge-off"
                  }`}
                >
                  {(aiStatus?.human ?? 0) > 0 ? "On" : "Off"}
                </span>
              </div>

              <div className="divider" />

              <div className="metric-row font-medium">
                <span className="metric-label text-dark">
                  Conversations Managed Today
                </span>
                <span className="metric-value text-dark font-bold">
                  {aiStatus?.conversationsToday ?? 0}
                </span>
              </div>

              <div className="metric-row font-medium">
                <span className="metric-label text-dark">
                  Appointments Booked
                </span>
                <span className="metric-value text-dark font-bold">
                  {aiStatus?.appointmentsToday ?? 0}
                </span>
              </div>

              <div className="metric-row font-medium">
                <span className="metric-label text-dark">
                  Average Response Time
                </span>
                <span className="metric-value text-dark font-bold">
                  {aiStatus?.averageResponseTime ?? "-"}
                </span>
              </div>
            </div>
            <div className="action-buttons-stack">
              <button
                className="btn-action btn-pause"
                onClick={toggleSelectedAi}
                disabled={!selectedConversation}
              >
                <Pause size={16} fill="currentColor" />
                {selectedConversation?.ai_enabled ? "Pause AI" : "Resume AI"}
              </button>

              <button
                className="btn-action btn-view-activity"
                onClick={() => setShowAiActivityDrawer(true)}
              >
                <TrendingUp size={16} /> View AI Activity
              </button>
            </div>
          </div>
          {/* CONVERSATION INTELLIGENCE */}
          <div className="insight-card metrics-box-panel">
            <div className="panel-header line-header">
              <h3>Conversation Intelligence</h3>
            </div>
            <div className="intelligence-donut-chart-row">
              <div className="radial-progress-gauge">
                <svg
                  width="80"
                  height="80"
                  viewBox="0 0 80 80"
                  className="gauge-svg"
                >
                  <defs>
                    <linearGradient
                      id="rightBlueGradient"
                      x1="0%"
                      y1="0%"
                      x2="0%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#2563eb" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>

                    <linearGradient
                      id="leftGreenGradient"
                      x1="0%"
                      y1="0%"
                      x2="0%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                  </defs>

                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    fill="transparent"
                    stroke="#e2e8f0"
                    strokeWidth="5"
                  />

                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    fill="transparent"
                    stroke="url(#rightBlueGradient)"
                    strokeWidth="5"
                    strokeDasharray={2 * Math.PI * 34}
                    strokeDashoffset={2 * Math.PI * 34 * (1 - 0.5)}
                    strokeLinecap="round"
                    transform="rotate(-90 40 40)"
                  />

                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    fill="transparent"
                    stroke="url(#leftGreenGradient)"
                    strokeWidth="5"
                    strokeDasharray={2 * Math.PI * 34}
                    strokeDashoffset={2 * Math.PI * 34 * (1 - 0.5)}
                    strokeLinecap="round"
                    transform="scale(-1, 1) translate(-80, 0) rotate(-90 40 40)"
                  />
                </svg>

                <div className="gauge-internal-text">
                  <h2>{selectedIntelligence.score}%</h2>
                  <span>AI Score</span>
                </div>
              </div>
              <div className="gauge-metrics-list-right">
                <div className="metric-row-item-flat">
                  <span className="flat-lbl">Sentiment</span>
                  <span className="flat-val positive-text">
                    {selectedIntelligence.sentiment}
                  </span>
                </div>
                <div className="metric-row-item-flat">
                  <span className="flat-lbl">Intent Level</span>
                  <span className="flat-val high-intent-badge-pill">
                    {selectedIntelligence.intent}
                  </span>
                </div>
                <div className="metric-row-item-flat">
                  <span className="flat-lbl">Response Likelihood</span>
                  <span className="flat-val positive-text">
                    {selectedIntelligence.responseLikelihood}
                  </span>
                </div>
                <div className="metric-row-item-flat">
                  <span className="flat-lbl">Close Probability</span>
                  <span className="flat-val positive-text">
                    {selectedIntelligence.closeProbability}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="insights-panel timeline-metrics-column">
            {/* JOURNEY TIMELINE */}
            <div className="insight-card metrics-box-panel">
              <div className="panel-header line-header">
                <h3>Journey Timeline</h3>
              </div>
              <div className="timeline-container vertical-stepper-axis">
                <div className="timeline-vertical-line axis-offset"></div>

                {timeline.length ? (
                  timeline.slice(0, 5).map((item) => (
                    <div className="timeline-item stepper-node" key={item.id}>
                      <div
                        className={`timeline-dot node-dot-style ${
                          item.type === "inbound" ? "dot-green" : "dot-blue"
                        }`}
                      ></div>

                      <div className="timeline-content box-content-layout">
                        <div className="timeline-content-top text-row-space">
                          <h5 className="timeline-title font-bold">
                            {item.title}
                          </h5>
                          <span className="timeline-time time-stamp-meta">
                            {formatChatDateTime(item.created_at)}
                          </span>
                        </div>

                        <p className="timeline-desc desc-dim text-small">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="timeline-item stepper-node">
                    <div className="timeline-dot dot-blue node-dot-style"></div>
                    <div className="timeline-content box-content-layout">
                      <h5 className="timeline-title font-bold">
                        No activity yet
                      </h5>
                    </div>
                  </div>
                )}
              </div>

              <div className="timeline-footer link-footer-row">
                <button
                  className="full-timeline-btn centered-link-btn"
                  onClick={() => setShowTimelineDrawer(true)}
                >
                  View Full Timeline
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showTimelineDrawer && (
        <div
          className="wa-drawer-overlay"
          onClick={() => setShowTimelineDrawer(false)}
        >
          <div
            className="wa-timeline-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="wa-drawer-header">
              <div>
                <h3>Conversation Timeline</h3>
                <p>{selectedConversation?.displayName || "WhatsApp Lead"}</p>
              </div>

              <button
                className="wa-drawer-close"
                onClick={() => setShowTimelineDrawer(false)}
              >
                ×
              </button>
            </div>

            <div className="wa-drawer-timeline-list">
              {timeline.length ? (
                timeline.map((item) => (
                  <div className="timeline-item stepper-node" key={item.id}>
                    <div
                      className={`timeline-dot node-dot-style ${
                        item.type === "inbound"
                          ? "dot-green"
                          : item.type === "system"
                            ? "dot-blue"
                            : "dot-blue"
                      }`}
                    />

                    <div className="timeline-content box-content-layout">
                      <div className="timeline-content-top text-row-space">
                        <h5 className="timeline-title font-bold">
                          {item.title}
                        </h5>
                        <span className="timeline-time time-stamp-meta">
                          {item.created_at
                            ? new Date(item.created_at).toLocaleString()
                            : ""}
                        </span>
                      </div>

                      <p className="timeline-desc desc-dim text-small">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="timeline-desc desc-dim text-small">
                  No timeline available.
                </p>
              )}

              {timelineHasMore && (
                <button
                  className="wa-load-more-btn"
                  onClick={loadMoreTimeline}
                  disabled={timelineLoading}
                >
                  {timelineLoading ? "Loading..." : "Load more"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {showAiActivityDrawer && (
        <div
          className="wa-drawer-overlay"
          onClick={() => setShowAiActivityDrawer(false)}
        >
          <div
            className="wa-timeline-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="wa-drawer-header">
              <div>
                <h3>AI Activity</h3>
                <p>{selectedConversation?.displayName || "WhatsApp Lead"}</p>
              </div>

              <button
                className="wa-drawer-close"
                onClick={() => setShowAiActivityDrawer(false)}
              >
                ×
              </button>
            </div>

            <div className="wa-drawer-timeline-list">
              {aiActivityItems.length ? (
                aiActivityItems.map((item) => (
                  <div className="timeline-item stepper-node" key={item.id}>
                    <div className="timeline-dot node-dot-style dot-blue" />

                    <div className="timeline-content box-content-layout">
                      <div className="timeline-content-top text-row-space">
                        <h5 className="timeline-title font-bold">
                          {item.title}
                        </h5>
                        <span className="timeline-time time-stamp-meta">
                          {formatChatDateTime(item.created_at)}
                        </span>
                      </div>

                      <p className="timeline-desc desc-dim text-small">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="timeline-desc desc-dim text-small">
                  No AI activity yet.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      {showAiAssist && (
        <div
          className="wa-ai-assist-overlay"
          onClick={() => setShowAiAssist(false)}
        >
          <div
            className="wa-ai-assist-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="wa-ai-assist-header">
              <div>
                <h3>AI Assist</h3>
                <p>Generate a suggested WhatsApp reply.</p>
              </div>

              <button
                className="wa-drawer-close"
                onClick={() => setShowAiAssist(false)}
              >
                ×
              </button>
            </div>

            <div className="wa-ai-assist-body">
              {aiAssistLoading ? (
                <div className="wa-ai-loading-box">
                  <span className="wa-send-spinner" />
                  <p>CORTEXA AI is writing a reply...</p>
                </div>
              ) : (
                <textarea
                  className="wa-ai-reply-textarea"
                  value={aiAssistReply}
                  onChange={(e) => setAiAssistReply(e.target.value)}
                  placeholder="AI reply will appear here..."
                />
              )}
            </div>

            <div className="wa-ai-assist-actions">
              <button
                className="wa-ai-secondary-btn"
                onClick={generateAiAssistReply}
                disabled={aiAssistLoading}
              >
                Regenerate
              </button>

              <button
                className="wa-ai-secondary-btn"
                onClick={() =>
                  navigator.clipboard?.writeText(aiAssistReply || "")
                }
                disabled={!aiAssistReply}
              >
                Copy
              </button>

              <button
                className="wa-ai-primary-btn"
                disabled={!aiAssistReply}
                onClick={() => {
                  setMessageText(aiAssistReply);
                  setShowAiAssist(false);
                }}
              >
                Insert Reply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
