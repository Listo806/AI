import React, { useEffect, useState } from "react";
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

  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({
      message,
      type,
    });

    setTimeout(() => {
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
    <div className="contacts-page">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <h1>Contacts & Relationships</h1>

          <p>
            Manage buyers, sellers, investors, renters, and conversations from
            one AI-powered workspace.
          </p>
        </div>

        <div className="header-actions">
          <div className="search-box">
            <Search size={18} />

            <input
              type="text"
              placeholder="Search contacts..."
              value={search}
              onChange={handleSearch}
            />
          </div>

          <button className="outline-btn" onClick={() => applyFilter("")}>
            <SlidersHorizontal size={16} />
            All
          </button>

          <button
            className="outline-btn"
            onClick={() => applyFilter("?type=Buyer")}
          >
            Buyers
          </button>

          <button
            className="outline-btn"
            onClick={() => applyFilter("?type=Seller")}
          >
            Sellers
          </button>

          <button
            className="outline-btn"
            onClick={() => applyFilter("?type=Investor")}
          >
            Investors
          </button>

          <button
            className="outline-btn"
            onClick={() => applyFilter("?type=Renter")}
          >
            Renters
          </button>

          <button
            className="outline-btn"
            onClick={() => applyFilter("?status=Hot")}
          >
            Hot Leads
          </button>

          <button
            className="outline-btn"
            onClick={() => applyFilter("?status=Cold")}
          >
            Inactive
          </button>

          <button className="outline-btn" onClick={loadAiInsights}>
            <Bot size={16} />
            AI Insights
          </button>

          <button className="outline-btn" onClick={runAiReview}>
            <Bot size={16} />
            Run AI Review
          </button>

          <button
            className="outline-btn"
            onClick={() => navigate("/dashboard/contacts/relationship-map")}
          >
            Relationship Map
          </button>

          <button
            className="primary-btn"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={16} />
            Add Contact
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="stats-grid">
        {stats.map((stat, index) => {
          const Icon = stat.icon;

          return (
            <div key={index} className="stat-card">
              <div className="stat-icon">
                <Icon size={22} />
              </div>

              <div>
                <p className="stat-label">{stat.label}</p>

                <h2>{stat.value}</h2>

                <span>{stat.sub}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* CONTACTS */}
      <div className="contacts-grid">
        {loading ? (
          <div>Loading...</div>
        ) : (
          contacts.map((contact) => (
            <div className="contact-card" key={contact.id}>
              {/* TOP */}
              <div className="card-top">
                <div className="card-user">
                  <div className="avatar">
                    {contact.avatar || contact.name?.charAt(0)?.toUpperCase()}
                  </div>

                  <div>
                    <h3>{contact.name}</h3>

                    <div className="badges">
                      <span className="badge blue">{contact.type}</span>

                      <span className="badge red">{contact.status}</span>
                    </div>
                  </div>
                </div>

                <button className="icon-btn">
                  <MoreVertical size={16} />
                </button>
              </div>

              {/* INFO */}
              <div className="info-grid">
                <InfoBox icon={Mail} label="Email" value={contact.email} />

                <InfoBox icon={Phone} label="Phone" value={contact.phone} />

                <InfoBox
                  icon={UserPlus}
                  label="Linked Lead"
                  value={contact.linkedLead}
                />

                <InfoBox
                  icon={Home}
                  label="Interest"
                  value={contact.interest}
                />
              </div>

              {/* AI */}
              <div className="ai-box">
                <div className="ai-icon">
                  <Bot size={18} />
                </div>

                <div className="ai-content">
                  <div className="ai-header">
                    <h4>AI Relationship Score</h4>
                  </div>
                  <p>
                    Highly engaged contact.
                    <br />
                    Recommended follow-up today.
                  </p>
                </div>
                <span>{contact.score || 0}%</span>
              </div>

              {/* FOOTER */}
              <div className="card-footer">
                <div className="footer-left">
                  <Clock size={14} />
                  Last contact: {contact.lastContact || "No contact yet"}
                </div>

                <div className="footer-right">
                  <Flame size={14} />
                  High Intent
                </div>
              </div>

              {/* ACTIONS */}
              <div className="card-actions">
                <button
                  className="outline-btn flex-btn"
                  onClick={() => navigate(`/dashboard/contacts/${contact.id}`)}
                >
                  <Eye size={14} />
                  View
                </button>

                <button
                  className="primary-btn flex-btn"
                  onClick={() => messageContact(contact.id)}
                >
                  <Send size={14} />
                  Message
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      {/* CREATE CONTACT MODAL */}
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
                  <label>Linked Lead</label>

                  <input
                    type="text"
                    value={createForm.linkedLeadName}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        linkedLeadName: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Interest</label>

                  <input
                    type="text"
                    value={createForm.interest}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        interest: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Status</label>

                  <select
                    value={createForm.status}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        status: e.target.value,
                      })
                    }
                  >
                    <option>Cold</option>
                    <option>Warm</option>
                    <option>Hot</option>
                    <option>Active</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Source</label>

                  <input
                    type="text"
                    value={createForm.source}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        source: e.target.value,
                      })
                    }
                  />
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
                  className="outline-btn"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>

                <button type="submit" className="primary-btn">
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
            animation: "fadeIn 0.2s ease",
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

function InfoBox({ icon: Icon, label, value }) {
  return (
    <div className="info-box">
      <div className="info-label">
        <Icon size={13} />
        {label}
      </div>

      <p>{value || "-"}</p>
    </div>
  );
}
