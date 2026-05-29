import React, { useEffect, useRef, useState } from "react";
import "./contacts.css";
import { useNavigate } from "react-router-dom";
import apiClient from "../../api/apiClient";

import {
  Search,
  Plus,
  SlidersHorizontal,
  Bot,
  Users,
  UserCheck,
  Home,
  Mail,
  Phone,
  MoreVertical,
  Eye,
  Send,
  UserPlus,
  Clock,
  Flame,
  Sparkles,
  Handshake,
  Edit3,
  Trash2,
  Archive,
  UserCog,
  StickyNote,
  GitBranch,
} from "lucide-react";

export default function ContactsRelationshipsPage() {
  const navigate = useNavigate();

  const [contacts, setContacts] = useState([]);
  const [stats, setStats] = useState([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [createForm, setCreateForm] = useState({
    name: "",
    type: "Buyer",
    email: "",
    phone: "",
    linkedLeadName: "",
    interest: "",
    status: "Cold",
    source: "",
    notes: "",
  });

  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    const closeMenu = () => setOpenMenuId(null);

    window.addEventListener("click", closeMenu);

    return () => {
      window.removeEventListener("click", closeMenu);
    };
  }, []);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const showToast = (message, type = "success") => {
    clearTimeout(toastTimer.current);

    setToast({
      message,
      type,
    });

    toastTimer.current = setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const createContact = async (e) => {
    e.preventDefault();

    try {
      await apiClient.request("/contacts", {
        method: "POST",
        body: JSON.stringify(createForm),
      });

      setShowCreateModal(false);

      setCreateForm({
        name: "",
        type: "Buyer",
        email: "",
        phone: "",
        linkedLeadName: "",
        interest: "",
        status: "Cold",
        source: "",
        notes: "",
      });

      fetchContacts();
      fetchStats();

      showToast("Contact created");
    } catch (err) {
      console.error(err);
      showToast("Failed to create contact", "error");
    }
  };
  const fetchContacts = async (query = "") => {
    try {
      setLoading(true);

      const response = await apiClient.request(`/contacts${query}`, {
        method: "GET",
      });

      const data = response?.data || response || [];

      setContacts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch contacts error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiClient.request("/contacts/stats", {
        method: "GET",
      });

      const data = response?.data || response || {};

      setStats([
        {
          label: "Total Contacts",
          value: data.totalContacts || 0,
          sub: "All relationships",
          icon: Users,
        },
        {
          label: "Active Buyers",
          value: data.activeBuyers || 0,
          sub: "Looking now",
          icon: UserCheck,
        },
        {
          label: "Active Sellers",
          value: data.activeSellers || 0,
          sub: "Selling properties",
          icon: Home,
        },
        {
          label: "AI Engagement",
          value: `${data.aiEngagement || 0}%`,
          sub: "AI relationship score",
          icon: Bot,
        },
      ]);
    } catch (err) {
      console.error("Fetch stats error:", err);
    }
  };

  useEffect(() => {
    fetchContacts();
    fetchStats();
  }, []);

  useEffect(() => {
    const crmContent = document.querySelector(".crm-content");

    if (crmContent) {
      crmContent.classList.add("contacts-crm-content");
    }

    return () => {
      if (crmContent) {
        crmContent.classList.remove("contacts-crm-content");
      }
    };
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;

    setSearch(value);

    if (!value) {
      fetchContacts();
      return;
    }

    fetchContacts(`?search=${encodeURIComponent(value)}`);
  };

  const applyFilter = (query) => {
    fetchContacts(query);
  };

  const runAiReview = async () => {
    try {
      await apiClient.request("/contacts/ai-review", {
        method: "POST",
      });

      fetchContacts();
      fetchStats();

      showToast("AI review completed");
    } catch (err) {
      console.error(err);
      showToast(err?.message || "Failed to load AI review", "error");
    }
  };

  const loadAiInsights = async () => {
    try {
      const response = await apiClient.request("/contacts/ai-insights", {
        method: "GET",
      });

      const data = response?.data || response;

      showToast(data?.summary || "No insights");
    } catch (err) {
      console.error(err);
      showToast(err?.message || "Failed to load AI insights", "error");
    }
  };

  const messageContact = async (contactId) => {
    const message = prompt("Enter message");

    if (!message) return;

    try {
      await apiClient.request(`/contacts/${contactId}/message`, {
        method: "POST",
        body: JSON.stringify({
          channel: "whatsapp",
          message,
        }),
      });

      showToast("Message sent");
    } catch (err) {
      console.error(err);
      showToast(err?.message || "Failed to send message", "error");
    }
  };

  return (
    <div>
      <div className="heading_page">
        <Users className="header-icon" size={20} />
        <h1>Contacts & Relationships</h1>
      </div>
      <div className="contacts-page">
        {/* MAIN */}
        <main className="main-content">
          {/* CONTENT */}
          <div className="content-wrapper">
            {/* KPI */}
            <div className="kpi-grid">
              {stats.map((stat, index) => {
                const Icon = stat.icon;

                return (
                  <KPIBox
                    key={index}
                    icon={<Icon size={26} />}
                    title={stat.label}
                    value={stat.value}
                    sub={stat.sub}
                    trend={stat.label === "Active Sellers" ? "0%" : "+12%"}
                    variant={
                      stat.label === "Active Buyers"
                        ? "buyers"
                        : stat.label === "AI Engagement"
                          ? "ai"
                          : ""
                    }
                  />
                );
              })}
            </div>

            {/* FILTER BAR */}
            <div className="filter-bar">
              <div className="filter-left">
                <div className="search-box">
                  <Search size={18} />

                  <input
                    placeholder="Search contacts..."
                    value={search}
                    onChange={handleSearch}
                  />
                </div>

                {[
                  {
                    label: "All",
                    query: "",
                  },
                  {
                    label: "Buyers",
                    query: "?type=Buyer",
                  },
                  {
                    label: "Sellers",
                    query: "?type=Seller",
                  },
                  {
                    label: "Investors",
                    query: "?type=Investor",
                  },
                  {
                    label: "Renters",
                    query: "?type=Renter",
                  },
                ].map((item) => (
                  <button
                    key={item.label}
                    className="filter-btn"
                    onClick={() => applyFilter(item.query)}
                  >
                    {item.label}
                  </button>
                ))}
                <button
                  className="action-btn insights"
                  onClick={loadAiInsights}
                >
                  <Sparkles /> AI Insights
                </button>

                <button className="action-btn runai" onClick={runAiReview}>
                  <Bot /> Run AI Review
                </button>
                <button
                  className="action-btn map"
                  onClick={() =>
                    navigate("/dashboard/contacts/relationship-map")
                  }
                >
                  <Handshake /> Relationship Map
                </button>
                <button
                  className="primary-btn"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus size={18} />
                  Add Contact
                </button>
              </div>
            </div>

            {/* CONTACTS */}
            <div className="contacts-grid">
              {loading ? (
                <div>Loading...</div>
              ) : (
                contacts.map((contact) => (
                  <div className="contact-card" key={contact.id}>
                    {/* TOP */}
                    <div className="contact-top">
                      <div className="contact-user">
                        <div className="contact-avatar">
                          {contact.avatar ||
                            contact.name?.charAt(0)?.toUpperCase()}
                        </div>

                        <div className="contact-group-right">
                          <div className="contact-name">{contact.name}</div>
                          <div className="intent-badge">
                            {contact.status || "Cold"}
                          </div>
                        </div>
                      </div>

                      <div
                        className="contact-action"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(
                            openMenuId === contact.id ? null : contact.id,
                          );
                        }}
                      >
                        <MoreVertical size={18} />

                        {openMenuId === contact.id && (
                          <div
                            className="contact-menu"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() =>
                                navigate(`/dashboard/contacts/${contact.id}`)
                              }
                            >
                              <Eye size={15} />
                              View Contact
                            </button>

                            <button>
                              <Edit3 size={15} />
                              Edit Contact
                            </button>

                            <button onClick={() => messageContact(contact.id)}>
                              <Send size={15} />
                              Message
                            </button>

                            <button>
                              <UserCog size={15} />
                              Assign Agent
                            </button>

                            <button>
                              <StickyNote size={15} />
                              Add Note
                            </button>

                            <button
                              onClick={() =>
                                navigate(
                                  `/dashboard/contacts/relationship-map?id=${contact.id}`,
                                )
                              }
                            >
                              <GitBranch size={15} />
                              Open Relationship Map
                            </button>

                            <button onClick={runAiReview}>
                              <Bot size={15} />
                              Run AI Review
                            </button>

                            <button className="warning">
                              <Archive size={15} />
                              Archive Contact
                            </button>

                            <button className="danger">
                              <Trash2 size={15} />
                              Delete Contact
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* INFO */}
                    <div className="info-grid modern">
                      <InfoBox
                        icon={Mail}
                        label="Email"
                        value={contact.email}
                      />

                      <InfoBox
                        icon={Phone}
                        label="Phone"
                        value={contact.phone}
                      />

                      <InfoBox
                        icon={UserPlus}
                        label="Source"
                        value={contact.linkedLead || "-"}
                      />

                      <InfoBox
                        icon={Home}
                        label="Interest"
                        value={contact.interest || "-"}
                      />
                    </div>

                    {/* AI SCORE */}
                    <div className="ai-score-box">
                      <div className="ai-left">
                        <div className="ai-icon">
                          <Bot size={22} />
                        </div>

                        <div className="ai-top">
                          <div className="ai-title">AI Score: </div>
                          <div className="ai-score">{contact.score || 0}%</div>
                        </div>
                        <div className="ai-sub">
                          Highly engaged. Recommended follow-up today.
                        </div>
                      </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="actions-grid">
                      <button
                        className="secondary-action"
                        onClick={() =>
                          navigate(`/dashboard/contacts/${contact.id}`)
                        }
                      >
                        <Eye size={16} />
                        View
                      </button>

                      <button
                        className="secondary-action"
                        onClick={() => messageContact(contact.id)}
                      >
                        <Send size={16} />
                        Message
                      </button>

                      <button className="secondary-action">
                        <Phone size={16} />
                        Call
                      </button>

                      <button className="secondary-action">
                        <StickyNote size={16} />
                        Notes
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* CREATE MODAL */}
          {showCreateModal && (
            <div className="modal-overlay">
              <div className="contact-modal">
                <div className="modal-header">
                  <h2>Add Contact</h2>

                  <button
                    className="icon-btn"
                    onClick={() => setShowCreateModal(false)}
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={createContact}>
                  <div className="modal-grid">
                    <div className="form-group">
                      <label>Name</label>

                      <input
                        type="text"
                        required
                        value={createForm.name}
                        onChange={(e) =>
                          setCreateForm({
                            ...createForm,
                            name: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label>Email</label>

                      <input
                        type="email"
                        required
                        value={createForm.email}
                        onChange={(e) =>
                          setCreateForm({
                            ...createForm,
                            email: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label>Phone</label>

                      <input
                        type="text"
                        value={createForm.phone}
                        onChange={(e) =>
                          setCreateForm({
                            ...createForm,
                            phone: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label>Type</label>

                      <select
                        value={createForm.type}
                        onChange={(e) =>
                          setCreateForm({
                            ...createForm,
                            type: e.target.value,
                          })
                        }
                      >
                        <option>Buyer</option>
                        <option>Seller</option>
                        <option>Investor</option>
                        <option>Renter</option>
                      </select>
                    </div>

                    <div className="form-group full">
                      <label>Notes</label>

                      <textarea
                        rows="4"
                        value={createForm.notes}
                        onChange={(e) =>
                          setCreateForm({
                            ...createForm,
                            notes: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="modal-actions">
                    <button
                      type="button"
                      className="secondary-action"
                      onClick={() => setShowCreateModal(false)}
                    >
                      Cancel
                    </button>

                    <button type="submit" className="primary-action">
                      Create Contact
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TOAST */}
          {toast && (
            <div
              style={{
                position: "fixed",
                top: 30,
                right: 30,
                background: toast.type === "success" ? "#16a34a" : "#dc2626",
                color: "#fff",
                padding: "14px 18px",
                borderRadius: 14,
                fontWeight: 600,
                boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                zIndex: 9999,
                minWidth: 280,
              }}
            >
              {toast.message}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function InfoBox({ icon: Icon, label, value }) {
  return (
    <div className="info-box">
      <div className="info-label">
        <Icon size={12} />
        <span>{label}</span>
      </div>

      <div className="info-text">{value || "-"}</div>
    </div>
  );
}

function KPIBox({ icon, title, value, sub, trend, variant }) {
  return (
    <div className={`kpi-box ${variant}`}>
      <div className="kpi-top">
        <div className="kpi-left">
          <div className="kpi-icon">{icon}</div>

          <div className="kpi-content">
            <div className="kpi-title">{title}</div>

            <div className="kpi-value-row">
              <div className="kpi-value">{value}</div>

              <div className={`kpi-trend ${trend === "0%" ? "neutral" : ""}`}>
                {trend}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="kpi-chart">
        <svg viewBox="0 0 180 42" preserveAspectRatio="none">
          <path
            d={
              title === "Active Sellers"
                ? "M0 24 L20 24 L40 24 L60 24 L80 24 L100 24 L120 24 L140 24 L160 24 L180 24"
                : title === "AI Engagement"
                  ? "M0 32 L20 28 L40 26 L60 18 L80 24 L100 16 L120 12 L140 20 L160 10 L180 6"
                  : title === "Active Buyers"
                    ? "M0 30 L20 24 L40 26 L60 18 L80 22 L100 16 L120 8 L140 14 L160 10 L180 4"
                    : "M0 34 L20 30 L40 32 L60 24 L80 28 L100 18 L120 8 L140 14 L160 10 L180 4"
            }
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="kpi-bottom">
        <span>this month</span>
      </div>
    </div>
  );
}
