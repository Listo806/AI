import React, { useEffect, useState } from "react";
import "./contacts.css";

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

import { useNavigate } from "react-router-dom";

export default function ContactsRelationshipsPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState(null);

  const [contacts, setContacts] = useState([]);

  const [search, setSearch] = useState("");

  const [selectedFilter, setSelectedFilter] = useState("all");

  // ======================================================
  // LOAD CONTACTS
  // ======================================================

  const loadContacts = async (params = "") => {
    try {
      setLoading(true);

      const res = await fetch(`/api/contacts${params}`, {
        credentials: "include",
      });

      const data = await res.json();

      setContacts(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // LOAD STATS
  // ======================================================

  const loadStats = async () => {
    try {
      const res = await fetch("/api/contacts/stats", {
        credentials: "include",
      });

      const data = await res.json();

      setStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  // ======================================================
  // INITIAL LOAD
  // ======================================================

  useEffect(() => {
    loadContacts();
    loadStats();
  }, []);

  // ======================================================
  // SEARCH
  // ======================================================

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!search.trim()) {
        loadContacts();
        return;
      }

      loadContacts(`?search=${encodeURIComponent(search)}`);
    }, 400);

    return () => clearTimeout(timeout);
  }, [search]);

  // ======================================================
  // FILTERS
  // ======================================================

  const handleFilter = async (filter) => {
    setSelectedFilter(filter);

    switch (filter) {
      case "buyers":
        return loadContacts("?type=Buyer");

      case "sellers":
        return loadContacts("?type=Seller");

      case "investors":
        return loadContacts("?type=Investor");

      case "renters":
        return loadContacts("?type=Renter");

      case "hot":
        return loadContacts("?status=Hot");

      case "inactive":
        return loadContacts("?status=Cold");

      default:
        return loadContacts();
    }
  };

  // ======================================================
  // AI INSIGHTS
  // ======================================================

  const handleAiInsights = async () => {
    try {
      const res = await fetch("/api/contacts/ai-insights", {
        credentials: "include",
      });

      const data = await res.json();

      alert(data.summary);
    } catch (err) {
      console.error(err);
    }
  };

  // ======================================================
  // AI REVIEW
  // ======================================================

  const handleAiReview = async () => {
    try {
      const res = await fetch("/api/contacts/ai-review", {
        method: "POST",
        credentials: "include",
      });

      const data = await res.json();

      alert(data.message);

      loadContacts();
      loadStats();
    } catch (err) {
      console.error(err);
    }
  };

  // ======================================================
  // MESSAGE
  // ======================================================

  const handleMessage = async (contact) => {
    const message = window.prompt(
      `Message ${contact.name}`
    );

    if (!message?.trim()) return;

    try {
      await fetch(`/api/contacts/${contact.id}/message`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        credentials: "include",

        body: JSON.stringify({
          channel: "whatsapp",
          message,
        }),
      });

      alert("Message sent");
    } catch (err) {
      console.error(err);
    }
  };

  // ======================================================
  // CREATE CONTACT
  // ======================================================

  const handleCreateContact = async () => {
    const name = window.prompt("Contact name");

    if (!name?.trim()) return;

    try {
      await fetch("/api/contacts", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        credentials: "include",

        body: JSON.stringify({
          name,
          type: "Buyer",
        }),
      });

      loadContacts();
      loadStats();
    } catch (err) {
      console.error(err);
    }
  };

  // ======================================================
  // STATS UI
  // ======================================================

  const statCards = [
    {
      label: "Total Contacts",
      value: stats?.totalContacts || 0,
      sub: "CRM contacts",
      icon: Users,
    },

    {
      label: "Active Buyers",
      value: stats?.activeBuyers || 0,
      sub: "Looking now",
      icon: UserCheck,
    },
  ];

  return (
    <div className="contacts-page">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <h1>Contacts & Relationships</h1>

          <p>
            Manage buyers, sellers, investors,
            renters, and conversations from one
            AI-powered workspace.
          </p>
        </div>

        <div className="header-actions">
          {/* SEARCH */}
          <div className="search-box">
            <Search size={18} />

            <input
              type="text"
              placeholder="Search contacts..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />
          </div>

          {/* FILTERS */}
          <div className="filters-row">
            <button
              className={`outline-btn ${
                selectedFilter === "all"
                  ? "active-filter"
                  : ""
              }`}
              onClick={() => handleFilter("all")}
            >
              All
            </button>

            <button
              className={`outline-btn ${
                selectedFilter === "buyers"
                  ? "active-filter"
                  : ""
              }`}
              onClick={() =>
                handleFilter("buyers")
              }
            >
              Buyers
            </button>

            <button
              className={`outline-btn ${
                selectedFilter === "sellers"
                  ? "active-filter"
                  : ""
              }`}
              onClick={() =>
                handleFilter("sellers")
              }
            >
              Sellers
            </button>

            <button
              className={`outline-btn ${
                selectedFilter === "investors"
                  ? "active-filter"
                  : ""
              }`}
              onClick={() =>
                handleFilter("investors")
              }
            >
              Investors
            </button>

            <button
              className={`outline-btn ${
                selectedFilter === "renters"
                  ? "active-filter"
                  : ""
              }`}
              onClick={() =>
                handleFilter("renters")
              }
            >
              Renters
            </button>

            <button
              className={`outline-btn ${
                selectedFilter === "hot"
                  ? "active-filter"
                  : ""
              }`}
              onClick={() => handleFilter("hot")}
            >
              Hot Leads
            </button>

            <button
              className={`outline-btn ${
                selectedFilter === "inactive"
                  ? "active-filter"
                  : ""
              }`}
              onClick={() =>
                handleFilter("inactive")
              }
            >
              Inactive
            </button>
          </div>

          {/* AI */}
          <button
            className="outline-btn"
            onClick={handleAiInsights}
          >
            <Bot size={16} />
            AI Insights
          </button>

          <button
            className="outline-btn"
            onClick={handleAiReview}
          >
            <SlidersHorizontal size={16} />
            Run AI Review
          </button>

          {/* RELATIONSHIP MAP */}
          <button
            className="outline-btn"
            onClick={() =>
              navigate(
                "/dashboard/contacts/relationship-map"
              )
            }
          >
            <Users size={16} />
            Relationship Map
          </button>

          {/* CREATE */}
          <button
            className="primary-btn"
            onClick={handleCreateContact}
          >
            <Plus size={16} />
            Add Contact
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="stats-grid">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;

          return (
            <div
              key={index}
              className="stat-card"
            >
              <div className="stat-icon">
                <Icon size={22} />
              </div>

              <div>
                <p className="stat-label">
                  {stat.label}
                </p>

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
          <div className="loading-box">
            Loading contacts...
          </div>
        ) : (
          contacts.map((contact) => (
            <div
              className="contact-card"
              key={contact.id}
            >
              {/* TOP */}
              <div className="card-top">
                <div className="card-user">
                  <div className="avatar">
                    {contact.avatar}
                  </div>

                  <div>
                    <h3>{contact.name}</h3>

                    <div className="badges">
                      <span className="badge blue">
                        {contact.type}
                      </span>

                      <span className="badge red">
                        {contact.status}
                      </span>
                    </div>
                  </div>
                </div>

                <button className="icon-btn">
                  <MoreVertical size={16} />
                </button>
              </div>

              {/* INFO */}
              <div className="info-grid">
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
                    <h4>
                      AI Relationship Score
                    </h4>

                    <span>
                      {contact.score || 0}%
                    </span>
                  </div>

                  <p>
                    Highly engaged contact.
                    Recommended follow-up
                    today.
                  </p>
                </div>
              </div>

              {/* FOOTER */}
              <div className="card-footer">
                <div className="footer-left">
                  <Clock size={14} />

                  Last contact:{" "}
                  {contact.lastContact}
                </div>

                <div className="footer-right">
                  <Flame size={14} />
                  High Intent
                </div>
              </div>

              {/* ACTIONS */}
              <div className="card-actions">
                {/* VIEW */}
                <button
                  className="outline-btn flex-btn"
                  onClick={() =>
                    navigate(
                      `/dashboard/contacts/${contact.id}`
                    )
                  }
                >
                  <Eye size={14} />
                  View
                </button>

                {/* MESSAGE */}
                <button
                  className="primary-btn flex-btn"
                  onClick={() =>
                    handleMessage(contact)
                  }
                >
                  <Send size={14} />
                  Message
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function InfoBox({
  icon: Icon,
  label,
  value,
}) {
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