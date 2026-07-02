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
} from "lucide-react";
import qrImg from "../../assets/cortexa/qr.png";
export default function WhatsAppPage() {
  const {
    loading,
    statusLoading,
    messagesLoading,
    sending,

    status,
    qr,
    stats,
    segments,

    filteredConversations,
    selectedConversation,
    setSelectedConversation,

    messages,
    selectedIntelligence,
    timeline,

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
  } = useWhatsAppDashboard();
  return (
    <div className="leads-page whatsapp-page">
      <div className="heading_page">
        <MessageCircle className="header-icon" size={20} />
        <h1>
          AI Messaging & WhatsApp{" "}
          <CheckCircle2
            size={16}
            fill="#2563eb"
            color="white"
            className="verified-badge"
          />
        </h1>
      </div>
      <p className="sub_head">
        Connect Whatsapp, manage conversations, automate follow-ups, and let AI
        assist your team in real time.
      </p>
      <div className="leads-header-top-row">
        <div className="header-actions-right">
          <button className="secondary-btn">
            <Calendar size={14} />
            May 13 - May 19, 2025
            <ChevronDown size={14} />
          </button>
          <button className="secondary-btn">
            <Users size={14} />
            Team: All
            <ChevronDown size={14} />
          </button>
          {/*<div className="notification-bell-container">
            <div className="bell-badge">12</div>
            <button className="icon-btn-clear">🔔</button>
          </div>*/}
          <button className="primary-btn new-btn-custom">
            <Plus size={16} />
            New
          </button>
        </div>
      </div>
      {/* FILTER & ACTIONS BAR */}
      <div className="action-filter-strip">
        <div className="strip-left-buttons">
          <button className="secondary-btn compact-btn">
            <SlidersHorizontal size={14} /> Inbox Filters
          </button>
          <button className="secondary-btn compact-btn">
            <Bot size={14} /> AI Auto-Reply
          </button>
          <button className="secondary-btn compact-btn">
            <Send size={14} /> Broadcast
          </button>
          <button className="secondary-btn compact-btn">
            <Download size={14} /> Export
          </button>
          <button className="primary-btn compact-btn connection-blue-btn">
            <Grid size={14} /> Connect Device
          </button>
        </div>
      </div>
      {/* TOP STATS COUNTERS */}
      <div className="top-stats-row-grid">
        <div className="stat-metric-box">
          <div className="metric-icon-wrap bg-light-green">
            <Smartphone size={18} color="#16a34a" />
          </div>
          <div className="metric-details">
            <span className="metric-label">Connected Accounts</span>
            <h3 className="metric-value">{stats.connectedAccounts}</h3>
            <span className="metric-subtext text-green">
              ● Device connected
            </span>
          </div>
        </div>

        <div className="stat-metric-box">
          <div className="metric-icon-wrap bg-light-blue">
            <MessageCircle size={18} color="#2563eb" />
          </div>
          <div className="metric-details">
            <span className="metric-label">Active Conversations</span>
            <h3 className="metric-value">{stats.activeConversations}</h3>
            <span className="metric-subtext text-green">
              WhatsApp + CRM ↗ 18%
            </span>
          </div>
        </div>

        <div className="stat-metric-box">
          <div className="metric-icon-wrap bg-light-orange">
            <MessageCircle size={18} color="#ea580c" />
          </div>
          <div className="metric-details">
            <span className="metric-label">Unread Conversations</span>
            <h3 className="metric-value">{stats.unreadConversations}</h3>
            <span className="metric-subtext text-red">
              Need attention ↗ 12%
            </span>
          </div>
        </div>

        <div className="stat-metric-box">
          <div className="metric-icon-wrap bg-light-purple">
            <Bot size={18} color="#9333ea" />
          </div>
          <div className="metric-details">
            <span className="metric-label">AI Replies Today</span>
            <h3 className="metric-value">{stats.aiRepliesToday}</h3>
            <span className="metric-subtext text-green">
              Auto-reply activity ↗ 24%
            </span>
          </div>
        </div>

        <div className="stat-metric-box">
          <div className="metric-icon-wrap bg-light-amber">
            <Calendar size={18} color="#d97706" />
          </div>
          <div className="metric-details">
            <span className="metric-label">Appointments Booked</span>
            <h3 className="metric-value">{stats.appointmentsBooked}</h3>
            <span className="metric-subtext text-green">This week ↗ 15%</span>
          </div>
        </div>

        <div className="stat-metric-box">
          <div className="metric-icon-wrap bg-light-teal">
            <Clock3 size={18} color="#0d9488" />
          </div>
          <div className="metric-details">
            <span className="metric-label">Avg Response Time</span>
            <h3 className="metric-value">{stats.avgResponseTime}</h3>
            <span className="metric-subtext text-green">
              AI-assisted replies ↓ 8%
            </span>
          </div>
        </div>

        <div className="stat-metric-box">
          <div className="metric-icon-wrap bg-light-indigo">
            <TrendingUp size={18} color="#4f46e5" />
          </div>
          <div className="metric-details">
            <span className="metric-label">WhatsApp Close Rate</span>
            <h3 className="metric-value">{stats.closeRate}</h3>
            <span className="metric-subtext text-green">
              Lead-to-close ↗ 6%
            </span>
          </div>
        </div>
      </div>

      {/* STATUS & SEGMENTATION ROW */}
      <div className="priority-bar-line-layout-wrap">
        <div className="priority-bar-line-layout">
          <div className="segment-line-item text-red">
            <span className="segment-label">🔥 Urgent WhatsApp Leads</span>
            <h2 className="segment-count">{segments.urgent}</h2>
          </div>
          <div className="segment-line-item text-orange">
            <span className="segment-label">🔔 Unread Conversations</span>
            <h2 className="segment-count">{segments.unread}</h2>
          </div>
          <div className="segment-line-item text-blue">
            <span className="segment-label">⏳ Need Follow-Up</span>
            <h2 className="segment-count">{segments.needFollowUp}</h2>
          </div>
          <div className="segment-line-item text-green">
            <span className="segment-label">📅 Ready To Book</span>
            <h2 className="segment-count">{segments.readyToBook}</h2>
          </div>
          <div className="segment-line-item text-purple">
            <span className="segment-label">💜 AI Replies Pending Review</span>
            <h2 className="segment-count">{segments.aiPending}</h2>
          </div>
        </div>
        <div className="device-wrap">
          {/* DEVICE STATUS BLOCK */}
          <div className="device-status-subpanel">
            <div className="status-subpanel-column">
              <span className="device-status-header-text">
                Device Status{" "}
                <span
                  className={
                    status?.connected ? "status-green-pill" : "status-red-pill"
                  }
                >
                  {status?.connected
                    ? "Connected"
                    : status?.status || "Disconnected"}
                </span>
              </span>
              <div className="device-meta-mini">
                ● Session Health:{" "}
                <strong
                  className={status?.connected ? "text-green" : "text-red"}
                >
                  {status?.connected ? "Healthy" : "Disconnected"}
                </strong>
              </div>
              <div className="device-meta-mini">
                ● Messages Synced: <strong>12,842</strong>
              </div>
              <div className="device-meta-mini">
                ● Webhook QR: <strong>-</strong>
              </div>
            </div>
            <div className="status-subpanel-column">
              <div className="device-meta-mini font-offset-top">
                ● Last Sync: 1 min ago
              </div>
              <div className="device-meta-mini">
                ● Webhook: <strong className="text-green">Active</strong>
              </div>
            </div>
          </div>

          {/* QR CODE PLUG */}
          <div className="qr-code-holder-box">
            <div className="dummy-qr-graphic">
              {qr ? (
                <QRCodeCanvas value={qr} size={92} />
              ) : (
                <img src={qrImg} alt="Cortexa" className="qrcode" />
              )}
            </div>

            {status?.connected ? (
              <button
                className="refresh-qr-link"
                onClick={disconnectDevice}
                disabled={statusLoading}
              >
                {statusLoading ? "Disconnecting..." : "Disconnect"}
              </button>
            ) : (
              <button
                className="refresh-qr-link"
                onClick={connectDevice}
                disabled={statusLoading}
              >
                {statusLoading ? "Connecting..." : "Connect / Refresh QR"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SUB-FILTERS ROW */}
      <div className="filters-row drop-selectors-strip">
        <div className="filter-btn text-dropdown-btn">
          <div className="filter-wrap">
            <Calendar size={15} />
            <select>
              <option>This Week</option>
            </select>
          </div>
          <ChevronDown size={14} />
        </div>
        <div className="filter-btn text-dropdown-btn">
          <div className="filter-wrap">
            <Users size={15} />
            <select>
              <option>All Accounts</option>
            </select>
          </div>
          <ChevronDown size={14} />
        </div>
        <div className="filter-btn text-dropdown-btn">
          <div className="filter-wrap">
            <Layers size={15} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="unread">Unread</option>
              <option value="ai">AI Handling</option>
              <option value="human">Human Handling</option>
            </select>
          </div>
          <ChevronDown size={14} />
        </div>
        <div className="filter-btn text-dropdown-btn">
          <div className="filter-wrap">
            <Bot size={15} />
            <select
              value={aiFilter}
              onChange={(e) => setAiFilter(e.target.value)}
            >
              <option value="all">All AI Modes</option>
              <option value="ai">AI Enabled</option>
              <option value="human">Human Owner</option>
            </select>
          </div>
          <ChevronDown size={14} />
        </div>
        <div className="filter-btn text-dropdown-btn">
          <div className="filter-wrap">
            <Users size={15} />
            <select>
              <option>All Agents</option>
            </select>
          </div>
          <ChevronDown size={14} />
        </div>
        <div className="search-box-wrap">
          <div className="search-box search-box-expanded">
            <Search size={14} />
            <input
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="filter-btn icon-only-filter-btn">
            <SlidersHorizontal size={14} />
          </button>
        </div>
      </div>

      {/* MAIN THREE-COLUMN WORKSPACE */}
      <div className="leads-layout main-workspace-layout">
        <div className="main-workspace-1">
          {/* COLUMN 1: CONVERSATIONS LIST */}
          <div className="lead-sidebar conversations-inbox-column">
            <div className="panel-header header-inline-flex">
              <h3>Conversations</h3>
              <div className="header-right-sort-config">
                <span>Sort: AI Score</span>
                <ChevronDown size={12} />
                <button className="settings-gear-btn">⚙️</button>
              </div>
            </div>

            <div className="lead-list inbox-cards-stack">
              {filteredConversations.length ? (
                filteredConversations.map((conv) => (
                  <div
                    className={`lead-card ${
                      selectedConversation?.id === conv.id
                        ? "active-chat-card"
                        : ""
                    }`}
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                  >
                    <div className="lead-card-top">
                      <div className="avatar-circle-frame">
                        <div className="avatar-letters bg-orange-avatar">
                          {conv.initials}
                        </div>
                        {conv.status !== "closed" && (
                          <div className="avatar-status-badge-dot online"></div>
                        )}
                      </div>

                      <div className="lead-meta-details">
                        <div className="meta-name-row">
                          <h4>{conv.displayName}</h4>
                          <span className="card-timestamp-meta">
                            {conv.timeAgo}
                          </span>
                        </div>

                        <span className="meta-phone-string">
                          {conv.contact_phone}
                        </span>
                      </div>
                    </div>

                    <div className="chat-card-score-strip">
                      <span className={`pill-tag-temp ${conv.tag}`}>
                        {conv.tag}
                      </span>
                      <span
                        className={`pill-tag-percentage ${
                          conv.score >= 80
                            ? "score-high"
                            : conv.score >= 60
                              ? "score-med"
                              : "score-low"
                        }`}
                      >
                        {conv.score}%
                      </span>

                      {Number(conv.unread_count || 0) > 0 && (
                        <div className="unread-count-bubble-badge">
                          {conv.unread_count}
                        </div>
                      )}
                    </div>

                    <p
                      className={`last-message-snippet ${
                        Number(conv.unread_count || 0) > 0
                          ? "emphasis-unread"
                          : ""
                      }`}
                    >
                      {conv.lastMessage}
                    </p>
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
              <button className="view-all-btn full-width-center-btn">
                View All Conversations
              </button>
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
                  <h3>
                    {selectedConversation?.displayName || "Select Conversation"}
                  </h3>
                  <p>{selectedConversation?.contact_phone || "-"} • WhatsApp</p>
                </div>
              </div>

              <div className="conversation-actions center-header-action-cluster">
                <span className="hot-tag-pill">
                  {selectedConversation?.tag || "cold"}
                </span>
                <span className="ai-handling-badge" onClick={toggleSelectedAi}>
                  <Sparkles size={12} />
                  {selectedConversation?.ai_enabled
                    ? "AI Handling"
                    : "Human Handling"}
                </span>
                <button className="icon-btn-borderless">
                  <Phone size={16} />
                </button>
                <button className="icon-btn-borderless">
                  <Video size={16} />
                </button>
                <button className="icon-btn-borderless">
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>

            {/* AI SUMMARY BOX BANNER */}
            <div className="ai-summary horizontal-summary-banner">
              <div className="summary-banner-content-left">
                <h4>
                  AI Summary <span className="beta-tag-pill">Beta</span>
                </h4>
                <p>
                  {selectedConversation
                    ? `Latest context: ${selectedConversation.lastMessage || "No recent activity."}`
                    : "Select a WhatsApp conversation to view AI summary."}
                </p>
                <div className="summary-pills-row-footer">
                  <span className="badge-pill bg-light-green text-green">
                    Sentiment: {selectedIntelligence.sentiment}
                  </span>
                  <span className="badge-pill bg-light-blue text-blue">
                    Intent: {selectedIntelligence.intent}
                  </span>
                  <span className="badge-pill bg-light-purple text-purple">
                    Score: {selectedIntelligence.score}%
                  </span>
                  <span className="badge-pill bg-slate text-dark-gray">
                    Next Best Action: {selectedIntelligence.recommendedAction}
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
                          {selectedConversation?.initials || "WA"}
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
                          {msg.created_at
                            ? new Date(msg.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                          {!isInbound && (
                            <CheckCheck
                              size={12}
                              color="#2563eb"
                              className="ticks-inline"
                            />
                          )}
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

              {/* Outgoing AI Auto-Reply */}
              <div className="chat-message-row agent-outgoing-msg">
                <div className="message-bubble-body bg-light-blue-bubble">
                  <p>
                    Yes, it is currently available. Are you looking to buy,
                    rent, or schedule a viewing?
                  </p>
                  <span className="message-time-stamp text-right">
                    10:32 AM{" "}
                    <CheckCheck
                      size={12}
                      color="#2563eb"
                      className="ticks-inline"
                    />
                  </span>
                </div>
                <div className="chat-avatar-badge-bot">
                  <Bot size={14} color="white" />
                </div>
              </div>

              {/* Incoming Customer Message */}
              <div className="chat-message-row user-incoming-msg">
                <div className="avatar-letters bg-orange-avatar size-28">
                  MK
                </div>
                <div className="message-bubble-body">
                  <p>I'm looking to buy. Can I see more details?</p>
                  <span className="message-time-stamp">10:34 AM</span>
                </div>
              </div>

              {/* Outgoing AI Auto-Reply */}
              <div className="chat-message-row agent-outgoing-msg">
                <div className="message-bubble-body bg-light-blue-bubble">
                  <p>
                    Absolutely. I can send the property details and help book a
                    showing. What day works best for you?
                  </p>
                  <span className="message-time-stamp text-right">
                    10:35 AM{" "}
                    <CheckCheck
                      size={12}
                      color="#2563eb"
                      className="ticks-inline"
                    />
                  </span>
                </div>
                <div className="chat-avatar-badge-bot">
                  <Bot size={14} color="white" />
                </div>
              </div>
            </div>

            {/* AI CONTEXT SUGGESTED UTILITIES CHIPS */}
            <div className="suggested-chips-scroll panel-mid-utilities-row">
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
                      if (e.key === "Enter") {
                        sendMessage();
                      }
                    }}
                  />
                </div>
                <div className="chat-input-right">
                  <button className="ai-assist-spark-inline-btn">
                    <Sparkles size={16} color="#2563eb" /> AI Assist
                  </button>
                  <button
                    className="send-message-main-submit-btn"
                    onClick={sendMessage}
                    disabled={sending || !selectedConversation?.contact_phone}
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="main-workspace-2">
          {/* COLUMN 3: RIGHT PANEL - INTELLIGENCE & METRICS */}
          <div className="insights-panel intelligence-metrics-column">
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

            {/* REVENUE INTELLIGENCE */}
            <div className="insight-card metrics-box-panel">
              <div className="panel-header line-header">
                <h3>Revenue Intelligence</h3>
              </div>
              <div className="revenue-flat-data-grid">
                <div className="revenue-data-line">
                  <span className="rev-lbl">Expected Revenue</span>
                  <span className="rev-val font-semibold">
                    {selectedIntelligence.expectedRevenue}
                  </span>
                </div>
                <div className="revenue-data-line">
                  <span className="rev-lbl">Budget</span>
                  <span className="rev-val font-medium">
                    {selectedIntelligence.budget}
                  </span>
                </div>
                <div className="revenue-data-line">
                  <span className="rev-lbl">Timeline</span>
                  <span className="rev-val font-medium">
                    {selectedIntelligence.timeline}
                  </span>
                </div>
                <div className="revenue-data-line">
                  <span className="rev-lbl">Ghost Risk</span>
                  <span className="rev-val text-green font-medium">
                    {selectedIntelligence.ghostRisk}
                  </span>
                </div>

                {/* LARGE FLOATING GREEN CASH BADGE */}
                <div className="floating-cash-badge-circle">
                  <span>$</span>
                </div>
              </div>
            </div>

            {/* RECOMMENDED ACTION */}
            <div className="insight-card metrics-box-panel bg-gradient-action-card">
              <div className="panel-header compact-header">
                <h3>Recommended Action</h3>
              </div>
              <p className="recommendation-instruction-text">
                {selectedIntelligence.recommendedAction}
              </p>
              <div className="recommendation-cta-buttons-stack">
                <button
                  className="primary-btn center-aligned-btn blue-action-btn"
                  onClick={toggleSelectedAi}
                  disabled={!selectedConversation?.id}
                >
                  <Sparkles size={14} />
                  {selectedConversation?.ai_enabled
                    ? "AI Is Handling"
                    : "Let AI Handle Follow-Up"}
                </button>
                <button className="secondary-btn center-aligned-btn white-action-btn">
                  <Calendar size={14} /> Book Appointment
                </button>
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
                  timeline.map((item) => (
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
                            {item.time}
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
                <button className="full-timeline-btn centered-link-btn">
                  View Full Timeline
                </button>
              </div>
            </div>

            {/* BROADCAST PERFORMANCE */}
            <div className="insight-card metrics-box-panel">
              <div className="panel-header line-header">
                <h3>Broadcast Performance</h3>
              </div>
              <div className="broadcast-stats-summary-grid">
                <div className="broadcast-stat-node">
                  <span className="b-lbl">Sent</span>
                  <strong className="b-val">1,248</strong>
                </div>
                <div className="broadcast-stat-node">
                  <span className="b-lbl">Replies</span>
                  <strong className="b-val">156</strong>
                </div>
                <div className="broadcast-stat-node">
                  <span className="b-lbl">Booked</span>
                  <strong className="b-val">37</strong>
                </div>
                <div className="broadcast-stat-node">
                  <span className="b-lbl">Opt-Outs</span>
                  <strong className="b-val text-red">12</strong>
                </div>
              </div>
              <div className="timeline-footer link-footer-row">
                <button className="full-timeline-btn centered-link-btn">
                  View Broadcasts
                </button>
              </div>
            </div>

            {/* SECURITY STATUS */}
            <div className="insight-card metrics-box-panel security-clearance-panel">
              <div className="panel-header line-header">
                <h3>Security</h3>
              </div>
              <div className="security-checklist-stack">
                <div className="security-check-line">
                  <CheckCircle2 size={14} color="#16a34a" fill="#dcfce7" />{" "}
                  <span>No passwords stored</span>
                </div>
                <div className="security-check-line">
                  <CheckCircle2 size={14} color="#16a34a" fill="#dcfce7" />{" "}
                  <span>End-to-end encrypted</span>
                </div>
                <div className="security-check-line">
                  <CheckCircle2 size={14} color="#16a34a" fill="#dcfce7" />{" "}
                  <span>Session under your control</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
