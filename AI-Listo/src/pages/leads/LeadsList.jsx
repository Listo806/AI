import React from "react";
import "./leads.css";

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
  Settings2,
  Home,
  Smile,
  Paperclip,
  ImageIcon,
  Mic,
  ArrowUpRight,
} from "lucide-react";

export default function LeadsPage() {
  const stats = [
    {
      title: "Total Leads",
      value: "248",
      change: "+32 this month",
      icon: <Users size={20} />,
      className: "blue",
    },
    {
      title: "AI Qualified",
      value: "156",
      change: "63% qualified",
      icon: <Bot size={20} />,
      className: "green",
    },
    {
      title: "Active Conversations",
      value: "41",
      change: "+28 today",
      icon: <MessageCircle size={20} />,
      className: "purple",
    },
    {
      title: "Appointments",
      value: "18",
      change: "+6 this week",
      icon: <Calendar size={20} />,
      className: "orange",
    },
    {
      title: "Conversion Rate",
      value: "21%",
      change: "+4.8%",
      icon: <TrendingUp size={20} />,
      className: "cyan",
    },
    {
      title: "Avg Response",
      value: "2m",
      change: "-18%",
      icon: <Clock3 size={20} />,
      className: "pink",
    },
  ];

  const leads = [
    {
      name: "WhatsApp Lead",
      phone: "+593 988885817",
      score: "92%",
      status: "Hot",
      active: true,
    },
    {
      name: "Makoto Kawamoto",
      phone: "+81 90 7788 5541",
      score: "74%",
      status: "Warm",
    },
    {
      name: "Maria Fernanda",
      phone: "+593 995552277",
      score: "68%",
      status: "Warm",
    },
    {
      name: "Andres Lopez",
      phone: "+593 983311122",
      score: "55%",
      status: "Cool",
    },
  ];

  return (
    <div className="leads-page">
      <div className="heading_page">
        <Users className="header-icon" size={20} />
        <h1>Leads & Conversations</h1>
      </div>
      <div className="leads-header">
        <div className="header-actions">
          <button className="secondary-btn">
            <Calendar size={16} />
            May 12 - May 18
            <ChevronDown size={15} />
          </button>

          <button className="secondary-btn">
            <Download size={16} />
            Export
          </button>

          <button className="secondary-btn ai-btn">
            <Sparkles size={16} />
            AI View
          </button>

          <button className="primary-btn">
            <Plus size={17} />
            New Lead
          </button>
        </div>
      </div>

      {/* FILTERS */}

      <div className="filters-row">
        <div className="filter-btn">
          <select>
            <option>All Sources</option>
          </select>
          <ChevronDown size={15} />
        </div>
        <div className="filter-btn">
          <select>
            <option>All Temperatures</option>
          </select>
          <ChevronDown size={15} />
        </div>
        <div className="filter-btn">
          <select>
            <option>All AI Scores</option>
          </select>
          <ChevronDown size={15} />
        </div>
        <div className="filter-btn">
          <select>
            <option>All Stages</option>
          </select>
          <ChevronDown size={15} />
        </div>
        <div className="filter-btn">
          <select>
            <option>All Agents</option>
          </select>
          <ChevronDown size={15} />
        </div>
        <div className="search-box">
          <Search size={16} />
          <input placeholder="Search leads..." />
        </div>

        <button className="filter-btn">
          <SlidersHorizontal size={16} />
          Filters
        </button>
        <div className="filter-btn">
          <select>
            <option>Bulk Actions</option>
          </select>
          <ChevronDown size={15} />
        </div>
      </div>

      {/* STATS */}

      <div className="stats-grid">
        {stats.map((item, index) => (
          <div className="stats-card" key={index}>
            <div className={`stats-icon ${item.className}`}>{item.icon}</div>

            <div>
              <span>{item.title}</span>
              <h2>{item.value}</h2>
              <p>{item.change}</p>
            </div>
          </div>
        ))}
      </div>

      {/* PRIORITY BAR */}

      <div className="priority-bar">
        <div className="item-line">
          <div className="priority-title">
            <h3>AI Priority Queue</h3>
            <p>Real-time lead insights</p>
          </div>
        </div>
        <div className="item-line">
          <div className="priority-item">
            <div className="red icon">
              {" "}
              <Flame size={18} />
            </div>
            <div>
              <strong>12</strong>
              <span>Urgent Leads</span>
            </div>
          </div>
        </div>
        <div className="item-line">
          <div className="priority-item">
            <div className="orange icon">
              <Clock3 size={18} />
            </div>
            <div>
              <strong>8</strong>
              <span>Need Follow-Up</span>
            </div>
          </div>
        </div>
        <div className="item-line">
          <div className="priority-item">
            <div className="blue icon">
              <Phone size={18} />
            </div>
            <div>
              <strong>5</strong>
              <span>Ready To Call</span>
            </div>
          </div>
        </div>
        <div className="item-line">
          <div className="priority-item">
            <div className="green icon">
              <MessageCircle size={18} />
            </div>
            <div>
              <strong>14</strong>
              <span>Pending Replies</span>
            </div>
          </div>
        </div>
        <div className="item-line">
          <div className="priority-item">
            <div className="purple icon">
              <MessageCircle size={18} />
            </div>
            <div>
              <strong>23</strong>
              <span>AI Qualifield Today</span>
            </div>
          </div>
        </div>
        <div className="item-line">
          <button className="queue-btn">
            View Queue
            <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      {/* MAIN CONTENT */}
      <div className="leads-layout">
        {/* LEFT PANEL - AI LEAD INBOX */}
        <div className="lead-sidebar">
          <div className="panel-header">
            <div>
              <h3>AI Lead Inbox</h3>
              <p>Ranked by urgency & AI score</p>
            </div>
            <button className="icon-btn">
              <SlidersHorizontal size={16} />
            </button>
          </div>

          <div className="lead-list">
            {/* Lead 1: WhatsApp Lead (Active) */}
            <div className="lead-card active count-badge-container">
              <div className="lead-card-top">
                <div className="avatar-wrapper">
                  <div className="lead-avatar avatar-whatsapp">W</div>
                  <div className="avatar-icon-badge">
                    <MessageCircle size={12} color="#16a34a" fill="#16a34a" />
                  </div>
                </div>
                <div className="lead-meta">
                  <h4>WhatsApp Lead</h4>
                  <span>+593 988885817</span>
                </div>
                <div className="lead-score">
                  <strong>92%</strong>
                  <p className="score-hot">Hot</p>
                </div>
              </div>
              <div className="lead-message-wrap">
                <p className="lead-message">
                  I'm interested in seeing available homes this week.
                </p>
                <div className="lead-card-financials">
                  <span className="budget-range">$180K - $250K</span>
                  <span className="timestamp">2m ago</span>
                </div>
              </div>

              <div className="lead-tags">
                <span className="tag-property">Modern Luxury Villa</span>
                <span className="tag-status status-showing">Showing</span>
              </div>
              <div className="unread-count">3</div>
            </div>

            {/* Lead 2: Makoto Kawamoto */}
            <div className="lead-card count-badge-container">
              <div className="lead-card-top">
                <div className="avatar-wrapper">
                  <div className="lead-avatar avatar-purple">MK</div>
                  <div className="avatar-icon-badge">
                    <Search size={12} color="#2563eb" />
                  </div>
                </div>
                <div className="lead-meta">
                  <h4>Makoto Kawamoto</h4>
                  <span>+81 90 7788 5541</span>
                </div>
                <div className="lead-score">
                  <strong>74%</strong>
                  <p className="score-warm">Warm</p>
                </div>
              </div>
              <div className="lead-message-wrap">
                <p className="lead-message">
                  Can you send me more details about the apartment?
                </p>
                <div className="lead-card-financials">
                  <span className="budget-range">$250K - $400K</span>
                  <span className="timestamp">18m ago</span>
                </div>
              </div>
              <div className="lead-tags">
                <span className="tag-property">Downtown Apartment</span>
                <span className="tag-status status-showing">Qualified</span>
              </div>
              <div className="unread-count">1</div>
            </div>

            {/* Lead 3: Maria Fernanda */}
            <div className="lead-card">
              <div className="lead-card-top">
                <div className="avatar-wrapper">
                  <div className="lead-avatar avatar-pink">MF</div>
                  <div className="avatar-icon-badge">
                    <Users size={12} color="#1877f2" />
                  </div>
                </div>
                <div className="lead-meta">
                  <h4>Maria Fernanda</h4>
                  <span>+593 995552277</span>
                </div>
                <div className="lead-score">
                  <strong>68%</strong>
                  <p className="score-warm">Warm</p>
                </div>
              </div>
              <div className="lead-message-wrap">
                <p className="lead-message">
                  Do you have something near the beach?
                </p>
                <div className="lead-card-financials">
                  <span className="budget-range">$150K - $200K</span>
                  <span className="timestamp">2h ago</span>
                </div>
              </div>
              <div className="lead-tags">
                <span className="tag-property">Beach Condo</span>
                <span className="tag-status status-showing">Qualified</span>
              </div>
            </div>

            {/* Lead 4: Andres Lopez */}
            <div className="lead-card">
              <div className="lead-card-top">
                <div className="avatar-wrapper">
                  <div className="lead-avatar avatar-blue">AL</div>
                  <div className="avatar-icon-badge">
                    <Bot size={12} color="#0077b5" />
                  </div>
                </div>
                <div className="lead-meta">
                  <h4>Andres Lopez</h4>
                  <span>+593 983311122</span>
                </div>
                <div className="lead-score">
                  <strong>55%</strong>
                  <p className="score-cool">Cool</p>
                </div>
              </div>
              <div className="lead-message-wrap">
                <p className="lead-message">
                  Looking for investment opportunities.
                </p>
                <div className="lead-card-financials">
                  <span className="budget-range">$300K+</span>
                  <span className="timestamp">3h ago</span>
                </div>
              </div>
              <div className="lead-tags">
                <span className="tag-property">Investment Property</span>
                <span className="tag-status status-new">New</span>
              </div>
            </div>
          </div>

          {/* Footer of Sidebar */}
          <div className="sidebar-footer">
            <span className="footer-counter">Showing 1-4 of 248 leads</span>
            <button className="view-all-btn">
              View all leads <ArrowRight size={12} />
            </button>
          </div>
        </div>

        {/* CENTER PANEL - CONVERSATION WORKSPACE */}
        <div className="conversation-panel">
          <div className="conversation-header">
            <div className="conversation-user">
              <div className="lead-avatar large avatar-whatsapp">W</div>
              <div>
                <h3 className="user-status-title">
                  WhatsApp Lead <span className="status-online">● Online</span>
                </h3>
                <p className="user-sub-info">
                  +593 988885817 • WhatsApp • Quito, Ecuador
                </p>
              </div>
            </div>

            <div className="conversation-actions">
              <button className="icon-btn">
                <Phone size={16} />
              </button>
              <button className="icon-btn">
                <Video size={16} />
              </button>
              <button className="icon-btn">
                <MoreVertical size={16} />
              </button>

              <div className="score-badge">
                <span className="score-value">92%</span>
                <span className="score-label">Score</span>
              </div>
              <span className="hot-tag text-tag-align">Hot Lead</span>
            </div>
          </div>

          {/* AI SUMMARY */}
          <div className="ai-summary">
            <div className="summary-icon">
              <Brain size={18} />
            </div>
            <div className="summary-text-box">
              <h4>AI Lead Summary</h4>
              <p>
                High intent lead looking for a 3-bedroom home in Quito. Budget
                between <strong>$180K - $250K</strong>. Ready to see properties
                this week. Best time to contact: 10AM - 2PM.
              </p>
            </div>
            <button className="view-profile-btn">View Profile</button>
          </div>

          {/* CHAT BODY */}
          <div className="chat-body">
            <div className="message left">
              <p>Hi, I'm interested in a property in Quito.</p>
              <span>10:32 AM</span>
            </div>

            <div className="message right robot-msg-container">
              <p>
                Thanks for reaching out! Are you looking to buy, rent, or
                invest?
              </p>
              <span className="msg-status-right">10:33 AM ✔✔</span>
              <div className="robot-badge-icon">🤖</div>
            </div>

            <div className="message left">
              <p>I'm looking to buy. I need at least 3 bedrooms.</p>
              <span>10:35 AM</span>
            </div>

            <div className="message right robot-msg-container">
              <p>
                Perfect! I found several matching homes. What budget range are
                you comfortable with?
              </p>
              <span className="msg-status-right">10:36 AM ✔✔</span>
              <div className="robot-badge-icon">🤖</div>
            </div>

            <div className="typing-indicator">Lead is typing...</div>
          </div>

          {/* AI SUGGESTED REPLIES */}
          <div className="suggested-replies-container">
            <div className="suggested-title">
              <Sparkles size={12} /> AI Suggested Replies
            </div>
            <div className="suggested-chips-scroll">
              {[
                "Send matching properties",
                "Ask budget range",
                "Suggest viewing time",
              ].map((text, idx) => (
                <button key={idx} className="chip-btn">
                  {text}
                </button>
              ))}
            </div>
          </div>

          {/* INPUT FORM */}
          <div className="chat-input-box">
            <div className="chat-input-top">
              <input placeholder="Type a message or let AI assist..." />
            </div>

            <div className="chat-input-bottom">
              <div className="chat-util-icons">
                <button className="util-icon-btn">
                  <Smile size={18} />
                </button>
                <button className="util-icon-btn">
                  <Paperclip size={18} />
                </button>
                <button className="util-icon-btn">
                  <ImageIcon size={18} />
                </button>
                <button className="util-icon-btn">
                  <Mic size={18} />
                </button>
              </div>

              <div className="chat-action-buttons">
                <button className="secondary-btn ai-btn assist-btn-custom">
                  <Sparkles size={14} />
                  AI Assist
                </button>
                <button className="send-btn fixed-send-btn">
                  <Send size={16} fill="white" />
                </button>
              </div>
            </div>
          </div>

          {/* QUICK CHAT ACTIONS */}
          <div className="quick-actions-grid">
            {[
              {
                title: "AI Follow-Up",
                desc: "Send automated follow-up",
                icon: <Send size={14} color="#22c55e" />,
                bgClass: "icon-bg-green",
              },
              {
                title: "Book Showing",
                desc: "Schedule appointment",
                icon: <Calendar size={14} color="#2563eb" />,
                bgClass: "icon-bg-blue",
              },
              {
                title: "Send Properties",
                desc: "Send matching homes",
                icon: <Home size={14} color="#0284c7" />,
                bgClass: "icon-bg-sky",
              },
              {
                title: "Escalate Lead",
                desc: "Mark as urgent",
                icon: <Flame size={14} color="#dc2626" />,
                bgClass: "icon-bg-red",
              },
            ].map((act, i) => (
              <button key={i} className="quick-action-card-btn">
                <div className={`action-icon-circle ${act.bgClass}`}>
                  {act.icon}
                </div>
                <div className="action-text-wrapper">
                  <span className="action-title">{act.title}</span>
                  <span className="action-desc">{act.desc}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL - INSIGHTS & CONTROLS */}
        <div className="insights-panel">
          {/* BOX 1: LEAD INTELLIGENCE */}
          <div className="insight-card">
            <div className="panel-header">
              <h3>Lead Intelligence</h3>
              <span className="hot-tag">Hot Lead</span>
            </div>
            <div className="insight-wrap">
              <div className="score-circle">
                <div>
                  <h2>92%</h2>
                  <span>AI Score</span>
                </div>
              </div>

              <div className="insight-list">
                <div className="insight-row">
                  <span>Sentiment</span>
                  <strong>High Intent</strong>
                </div>
                <div className="insight-row">
                  <span>Interest Level</span>
                  <strong>Very High</strong>
                </div>
                <div className="insight-row">
                  <span>Response Likelihood</span>
                  <strong>Very High</strong>
                </div>
                <div className="insight-row">
                  <span>Engagement Score</span>
                  <strong className="dark-insight-text">85/100</strong>
                </div>
              </div>
            </div>
          </div>

          {/* BOX 2: REVENUE INTELLIGENCE */}
          <div className="insight-card">
            <div className="panel-header header-spacing">
              <h3>Revenue Intelligence</h3>
            </div>
            <div className="revenue-grid">
              <div className="revenue-box">
                <span className="revenue-label">Deal Value</span>
                <strong className="revenue-val-green">$220,000</strong>
              </div>
              <div className="revenue-box">
                <span className="revenue-label">Close Probability</span>
                <strong className="revenue-val-blue">78%</strong>
              </div>
              <div className="revenue-box">
                <span className="revenue-label">Est. Close Date</span>
                <strong className="revenue-val-dark">May 28, 2025</strong>
              </div>
              <div className="revenue-box">
                <span className="revenue-label">Pipeline Stage</span>
                <strong className="revenue-val-orange">Negotiation</strong>
              </div>
            </div>
          </div>

          {/* BOX 3: AI AUTOMATION CONTROLS */}
          <div className="insight-card automation-card-custom">
            <div className="panel-header automation-header">
              <div>
                <h3>AI Automation Controls</h3>
                <p className="panel-header-desc">
                  Manage AI actions for this lead
                </p>
              </div>
              <button className="manage-all-link">Manage All</button>
            </div>

            <div className="automation-list automation-list-spacing">
              {[
                { title: "AI Auto Follow-Up", icon: <Sparkles size={16} /> },
                { title: "AI Qualification", icon: <Bot size={16} /> },
                {
                  title: "Auto Appointment Booking",
                  icon: <Calendar size={16} />,
                },
                { title: "Smart Property Matching", icon: <Home size={16} /> },
                {
                  title: "Escalate Hot Leads",
                  icon: <ArrowUpRight size={16} />,
                },
              ].map((item, idx) => (
                <div className="automation-row-custom" key={idx}>
                  <div className="automation-left-group">
                    <span className="automation-row-icon">{item.icon}</span>
                    <h4 className="automation-item-title">{item.title}</h4>
                  </div>

                  <div className="automation-right-group">
                    <span className="status-active-text">Active</span>
                    <div className="switch active"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* BOX 4: LEAD JOURNEY TIMELINE */}
          <div className="insight-card">
            <div className="panel-header header-spacing">
              <h3>Lead Journey Timeline</h3>
            </div>

            <div className="timeline-container">
              <div className="timeline-vertical-line"></div>

              {[
                {
                  title: "Lead Captured",
                  desc: "Inbound message from WhatsApp",
                  time: "May 12, 10:32 AM",
                  class: "dot-green",
                },
                {
                  title: "AI Assistant Engaged",
                  desc: "Automated greeting & qualification",
                  time: "May 12, 10:33 AM",
                  class: "dot-blue",
                },
                {
                  title: "Requirements Identified",
                  desc: "3 beds, Quito, $180K-$250K budget",
                  time: "May 12, 10:35 AM",
                  class: "dot-purple",
                },
                {
                  title: "Stage Updated to 'Hot'",
                  desc: "Score triggered urgency escalation",
                  time: "May 12, 10:36 AM",
                  class: "dot-red",
                },
              ].map((step, idx) => (
                <div key={idx} className="timeline-item">
                  <div className={`timeline-dot ${step.class}`}></div>
                  <div className="timeline-content">
                    <div className="timeline-content-top">
                      <h5 className="timeline-title">{step.title}</h5>
                      <span className="timeline-time">{step.time}</span>
                    </div>
                    <p className="timeline-desc">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="timeline-footer">
              <button className="full-timeline-btn">
                Full Timeline <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
