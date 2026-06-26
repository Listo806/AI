import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import apiClient from "../../api/apiClient";
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
  CheckCheck,
  Layers,
} from "lucide-react";

export default function LeadsPage() {
  const location = useLocation();

  const [leadsData, setLeadsData] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [leadsLoading, setLeadsLoading] = useState(false);

  const [leadEvents, setLeadEvents] = useState([]);
  const [leadEventsLoading, setLeadEventsLoading] = useState(false);

  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 1024 : false,
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const [showFilters, setShowFilters] = useState(false);
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

  const getInitials = (name = "") => {
    return (
      name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((item) => item[0])
        .join("")
        .toUpperCase() || "L"
    );
  };

  const getLeadScore = (lead) => {
    return lead.aiScore || lead.score || 25;
  };

  const getLeadTemperature = (lead) => {
    const score = Number(getLeadScore(lead));

    if (score >= 80) return "Hot";
    if (score >= 50) return "Warm";
    return "Cool";
  };

  const getScoreClass = (lead) => {
    const temp = getLeadTemperature(lead).toLowerCase();

    if (temp === "hot") return "score-hot";
    if (temp === "warm") return "score-warm";
    return "score-cool";
  };

  const fetchLeads = async () => {
    try {
      setLeadsLoading(true);

      const response = await apiClient.request("/leads", {
        method: "GET",
      });

      const data = response?.data || response || [];
      const list = Array.isArray(data) ? data : [];

      setLeadsData(list);

      const params = new URLSearchParams(location.search);
      const leadId = params.get("leadId");

      const matchedLead = leadId
        ? list.find((item) => String(item.id) === String(leadId))
        : null;

      const activeLead = matchedLead || list[0] || null;
      setSelectedLead(activeLead);

      if (activeLead?.id) {
        fetchLeadEvents(activeLead.id);
      }
    } catch (err) {
      console.error("Fetch leads error:", err);
      setLeadsData([]);
      setSelectedLead(null);
    } finally {
      setLeadsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [location.search]);

  const updateSelectedLead = async (payload) => {
    if (!selectedLead?.id) return;

    try {
      const response = await apiClient.request(`/leads/${selectedLead.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      const updatedLead = response?.data || response;

      const normalizedLead = {
        ...selectedLead,
        ...updatedLead,
        ...payload,
      };

      setSelectedLead(normalizedLead);

      setLeadsData((prev) =>
        prev.map((item) =>
          item.id === selectedLead.id ? { ...item, ...normalizedLead } : item,
        ),
      );

      fetchLeadEvents(selectedLead.id);
    } catch (err) {
      console.error("Update lead error:", err);
    }
  };

  const formatLeadEventDate = (value) => {
    if (!value) return "";
    return new Date(value).toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const fetchLeadEvents = async (leadId) => {
    try {
      setLeadEventsLoading(true);

      const response = await apiClient.request(`/leads/${leadId}/events`, {
        method: "GET",
      });

      const data = response?.data || response || [];
      setLeadEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch lead events error:", err);
      setLeadEvents([]);
    } finally {
      setLeadEventsLoading(false);
    }
  };

  const selectLead = (lead) => {
    setSelectedLead(lead);
    fetchLeadEvents(lead.id);
  };

  const escalateSelectedLead = async () => {
    if (!selectedLead?.id) return;

    await updateSelectedLead({
      priority: "high",
      status: "qualified",
    });
  };

  return (
    <div className="leads-page">
      <div className="heading_page">
        <Users className="header-icon" size={20} />
        <h1>Leads & Conversations</h1>
      </div>
      <p className="sub_head">
        Manage leads, AI conversations, and deal activity in real time.
      </p>
      <div className="leads-header">
        <div className="header-actions">
          {isMobile ? (
            <>
              <button className="secondary-btn">
                <Calendar size={16} />
                May 12 - May 18
                <ChevronDown size={15} />
              </button>

              <button className="secondary-btn ai-btn">
                <Sparkles size={16} />
                AI View
              </button>

              <button className="primary-btn">
                <Plus size={17} />
                New Lead
              </button>
              <div className="control-btn" onClick={() => setShowFilters(true)}>
                <SlidersHorizontal size={15} />
                <span></span>
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
      {isMobile && showFilters && (
        <>
          <div
            className="filter-overlay"
            onClick={() => setShowFilters(false)}
          />

          <div className="mobile-filter-drawer">
            <div className="drawer-header">
              <h3>Filters</h3>

              <button
                className="drawer-close"
                onClick={() => setShowFilters(false)}
              >
                ✕
              </button>
            </div>

            <div className="drawer-body">
              <div className="filter-btn">
                <Layers size={15} />
                <select>
                  <option>All Sources</option>
                </select>
                <ChevronDown size={15} />
              </div>
              <div className="filter-btn">
                <Clock3 size={15} />
                <select>
                  <option>All Temperatures</option>
                </select>
                <ChevronDown size={15} />
              </div>
              <div className="filter-btn">
                <Bot size={15} />
                <select>
                  <option>All AI Scores</option>
                </select>
                <ChevronDown size={15} />
              </div>
              <div className="filter-btn">
                <Layers size={15} />
                <select>
                  <option>All Stages</option>
                </select>
                <ChevronDown size={15} />
              </div>
              <div className="filter-btn">
                <Users size={15} />
                <select>
                  <option>All Agents</option>
                </select>
                <ChevronDown size={15} />
              </div>
              <button className="btn-export">
                <Download size={15} />
                Export
                <ChevronDown size={14} />
              </button>
            </div>
          </div>
        </>
      )}
      {/* FILTERS */}
      {!isMobile && (
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
      )}

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
            <div className="priority-wrap">
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
            <div className="priority-wrap">
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
            <div className="priority-wrap">
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
            <div className="priority-wrap">
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
            <div className="priority-wrap">
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
            {leadsLoading ? (
              <div className="lead-card">
                <p className="lead-message">Loading leads...</p>
              </div>
            ) : leadsData.length ? (
              leadsData.map((lead) => {
                const isActive = selectedLead?.id === lead.id;
                const temperature = getLeadTemperature(lead);
                const score = getLeadScore(lead);

                return (
                  <div
                    key={lead.id}
                    className={`lead-card count-badge-container ${isActive ? "active" : ""}`}
                    onClick={() => selectLead(lead)}
                  >
                    <div className="lead-card-top">
                      <div className="avatar-wrapper">
                        <div className="lead-avatar avatar-whatsapp">
                          {getInitials(lead.name)}
                        </div>
                        <div className="avatar-icon-badge">
                          <MessageCircle
                            size={12}
                            color="#16a34a"
                            fill="#16a34a"
                          />
                        </div>
                      </div>

                      <div className="lead-meta">
                        <h4>{lead.name || "Unnamed Lead"}</h4>
                        <span>
                          {lead.phone || lead.email || "No contact info"}
                        </span>
                      </div>

                      <div className="lead-score">
                        <strong>{score}%</strong>
                        <p className={getScoreClass(lead)}>{temperature}</p>
                      </div>
                    </div>

                    <div className="lead-message-wrap">
                      <p className="lead-message">
                        {lead.notes || lead.source || "New CRM lead"}
                      </p>

                      <div className="lead-card-financials">
                        <span className="budget-range">
                          {lead.source || "CRM"}
                        </span>
                        <span className="timestamp">
                          {lead.status || "new"}
                        </span>
                      </div>
                    </div>

                    <div className="lead-tags">
                      <span className="tag-property">
                        {lead.propertyTitle || "No property linked"}
                      </span>
                      <span className="tag-status status-new">
                        {lead.status || "new"}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="lead-card">
                <p className="lead-message">No leads found.</p>
              </div>
            )}
          </div>

          {/* Footer of Sidebar */}
          <div className="sidebar-footer">
            <span className="footer-counter">
              Showing {leadsData.length} leads
            </span>
            <button className="view-all-btn">
              View all leads <ArrowRight size={12} />
            </button>
          </div>
        </div>

        {/* CENTER PANEL - CONVERSATION WORKSPACE */}
        <div className="conversation-panel">
          <div className="conversation-header">
            <div className="conversation-user">
              <div className="lead-avatar large avatar-whatsapp">
                {getInitials(selectedLead?.name)}
              </div>
              <div>
                <h3 className="user-status-title">
                  {selectedLead?.name || "Select a lead"}{" "}
                  <span className="status-online">● Online</span>
                </h3>
                <p className="user-sub-info">
                  {selectedLead?.phone ||
                    selectedLead?.email ||
                    "No contact info"}{" "}
                  • {selectedLead?.source || "CRM"}
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
                <span className="score-value">
                  {selectedLead ? `${getLeadScore(selectedLead)}%` : "--"}
                </span>
                <span className="score-label">Score</span>
              </div>
              <span className="hot-tag text-tag-align">
                {selectedLead
                  ? `${getLeadTemperature(selectedLead)} Lead`
                  : "No Lead"}
              </span>
            </div>
          </div>
          <div className="lead-control-row">
            <div className="lead-control-field">
              <label>Status</label>
              <select
                value={selectedLead?.status || "new"}
                onChange={(e) => updateSelectedLead({ status: e.target.value })}
                disabled={!selectedLead}
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="showing">Showing</option>
                <option value="negotiation">Negotiation</option>
                <option value="closed">Closed</option>
                <option value="lost">Lost</option>
              </select>
            </div>

            <div className="lead-control-field">
              <label>Priority</label>
              <select
                value={selectedLead?.priority || "low"}
                onChange={(e) =>
                  updateSelectedLead({ priority: e.target.value })
                }
                disabled={!selectedLead}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
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
                {selectedLead?.notes ||
                  `Lead source: ${selectedLead?.source || "CRM"}. Status: ${
                    selectedLead?.status || "new"
                  }.`}
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
              <span className="msg-status-right">
                10:33 AM <CheckCheck size={12} />
              </span>
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
              <span className="msg-status-right">
                10:36 AM <CheckCheck size={12} />
              </span>
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
                onClick: escalateSelectedLead,
              },
            ].map((act, i) => (
              <button
                key={i}
                className="quick-action-card-btn"
                onClick={act.onClick || (() => {})}
              >
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

              {leadEventsLoading ? (
                <div className="timeline-item">
                  <div className="timeline-dot dot-blue"></div>
                  <div className="timeline-content">
                    <p className="timeline-desc">Loading timeline...</p>
                  </div>
                </div>
              ) : leadEvents.length ? (
                leadEvents.map((event) => (
                  <div key={event.id} className="timeline-item">
                    <div className="timeline-dot dot-blue"></div>
                    <div className="timeline-content">
                      <div className="timeline-content-top">
                        <h5 className="timeline-title">
                          {event.metadata?.title ||
                            event.eventType?.replaceAll("_", " ") ||
                            "Lead activity"}
                        </h5>
                        <span className="timeline-time">
                          {formatLeadEventDate(event.createdAt)}
                        </span>
                      </div>
                      <p className="timeline-desc">
                        {event.metadata?.sub ||
                          event.metadata?.description ||
                          "Lead updated"}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="timeline-item">
                  <div className="timeline-dot dot-green"></div>
                  <div className="timeline-content">
                    <div className="timeline-content-top">
                      <h5 className="timeline-title">Lead created</h5>
                    </div>
                    <p className="timeline-desc">No event yet.</p>
                  </div>
                </div>
              )}
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
