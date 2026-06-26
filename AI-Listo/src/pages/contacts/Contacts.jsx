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
  Building2,
  ChevronLeft,
  Calendar,
  MessageSquare,
  ChevronRight,
  LayoutDashboard,
  GitFork,
  Menu,
} from "lucide-react";

export default function ContactsRelationshipsPage() {
  const navigate = useNavigate();

  const [contacts, setContacts] = useState([]);
  const [stats, setStats] = useState([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState(null);

  const [selectedContact, setSelectedContact] = useState(null);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignContact, setAssignContact] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [assignTo, setAssignTo] = useState("");

  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteContact, setNoteContact] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [showDetailMoreMenu, setShowDetailMoreMenu] = useState(false);

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
    setToast({ message, type });
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
  const openEditContact = (contact) => {
    setEditForm({
      id: contact.id,
      name: contact.name || "",
      type: contact.type || "Buyer",
      email: contact.email || "",
      phone: contact.phone || "",
      interest: contact.interest || "",
      status: contact.status || "Cold",
      source: contact.source || "",
      notes: contact.notes || "",
    });

    setOpenMenuId(null);
    setShowEditModal(true);
  };

  const updateContact = async (e) => {
    e.preventDefault();

    const contactId = editForm.id;

    const clean = (value) => {
      if (value === undefined || value === null) return undefined;
      const trimmed = String(value).trim();
      return trimmed === "" ? undefined : trimmed;
    };

    const payload = {
      name: clean(editForm.name),
      type: clean(editForm.type),
      email: clean(editForm.email),
      phone: clean(editForm.phone),
      interest: clean(editForm.interest),
      status: clean(editForm.status),
      source: clean(editForm.source),
      notes: clean(editForm.notes),
    };

    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });

    try {
      console.log("UPDATE PAYLOAD:", payload);
      const updated = await apiClient.request(`/contacts/${contactId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      const updatedContact = updated?.data || updated;

      setContacts((prev) =>
        prev.map((item) =>
          item.id === contactId
            ? {
                ...item,
                ...updatedContact,
                avatar:
                  updatedContact.name?.charAt(0)?.toUpperCase() ||
                  item.avatar ||
                  "?",
              }
            : item,
        ),
      );

      setShowEditModal(false);
      setEditForm(null);
      fetchStats();
      showToast("Contact updated");
    } catch (err) {
      console.error(err);
      showToast(err?.message || "Failed to update contact", "error");
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
          variant: "buyers",
        },
        {
          label: "Active Sellers",
          value: data.activeSellers || 0,
          sub: "Selling properties",
          icon: Home,
          variant: "sellers",
        },
        {
          label: "Active Renters",
          value: data.activeRenters || 0,
          sub: "Rental demand",
          icon: Handshake,
          variant: "renters",
        },
        {
          label: "Active Developers",
          value: data.activeDevelopers || 0,
          sub: "Developer network",
          icon: Building2,
          variant: "developers",
        },
        {
          label: "AI score",
          value: `${data.aiEngagement || 0}%`,
          sub: "AI relationship score",
          icon: Bot,
          variant: "ai",
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
      await apiClient.request("/contacts/ai-review", { method: "POST" });
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
        body: JSON.stringify({ channel: "whatsapp", message }),
      });
      showToast("Message sent");
    } catch (err) {
      console.error(err);
      showToast(err?.message || "Failed to send message", "error");
    }
  };
  const deleteContact = async (contactId) => {
    const ok = window.confirm("Delete this contact?");
    if (!ok) return;

    try {
      await apiClient.request(`/contacts/${contactId}`, {
        method: "DELETE",
      });

      setContacts((prev) => prev.filter((item) => item.id !== contactId));
      fetchStats();
      showToast("Contact deleted");
    } catch (err) {
      console.error(err);
      showToast(err?.message || "Failed to delete contact", "error");
    }
  };

  const changeContactStatus = async (contactId, status) => {
    try {
      const updated = await apiClient.request(`/contacts/${contactId}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });

      const updatedContact = updated?.data || updated;

      setContacts((prev) =>
        prev.map((item) =>
          item.id === contactId ? { ...item, ...updatedContact, status } : item,
        ),
      );

      setOpenMenuId(null);
      fetchStats();
      showToast(`Status changed to ${status}`);
    } catch (err) {
      console.error(err);
      showToast(err?.message || "Failed to change status", "error");
    }
  };

  const archiveContact = async (contactId) => {
    const ok = window.confirm("Archive this contact?");
    if (!ok) return;

    try {
      const updated = await apiClient.request(`/contacts/${contactId}`, {
        method: "PUT",
        body: JSON.stringify({ status: "Archived" }),
      });

      const updatedContact = updated?.data || updated;

      setContacts((prev) =>
        prev.map((item) =>
          item.id === contactId
            ? { ...item, ...updatedContact, status: "Archived" }
            : item,
        ),
      );

      setOpenMenuId(null);
      fetchStats();
      showToast("Contact archived");
    } catch (err) {
      console.error(err);
      showToast(err?.message || "Failed to archive contact", "error");
    }
  };

  const openAssignAgent = async (contact) => {
    try {
      setAssignContact(contact);
      setAssignTo(contact.assignedTo || "");
      setOpenMenuId(null);

      const teams = await apiClient.request("/teams", { method: "GET" });
      const teamList = teams?.data || teams || [];
      const teamId = teamList?.[0]?.id;

      if (!teamId) {
        showToast("No team found", "error");
        return;
      }

      const membersRes = await apiClient.request(`/teams/${teamId}/members`, {
        method: "GET",
      });

      const membersData = membersRes?.data || membersRes || [];
      const members = Array.isArray(membersData)
        ? membersData
        : membersData.members || [];

      setTeamMembers(members);
      setShowAssignModal(true);
    } catch (err) {
      console.error(err);
      showToast(err?.message || "Failed to load team members", "error");
    }
  };

  const assignAgent = async (e) => {
    e.preventDefault();

    try {
      const updated = await apiClient.request(`/contacts/${assignContact.id}`, {
        method: "PUT",
        body: JSON.stringify({
          assignedTo: assignTo || null,
        }),
      });

      const updatedContact = updated?.data || updated;
      const selectedMember = teamMembers.find(
        (member) => String(member.userId || member.id) === String(assignTo),
      );
      setContacts((prev) =>
        prev.map((item) =>
          item.id === assignContact.id
            ? {
                ...item,
                ...updatedContact,
                assignedTo: assignTo || null,
                assignedAgentName:
                  selectedMember?.name || selectedMember?.fullName || null,
                assignedAgentEmail: selectedMember?.email || null,
              }
            : item,
        ),
      );

      setShowAssignModal(false);
      setAssignContact(null);
      setAssignTo("");
      showToast("Agent assigned");
    } catch (err) {
      console.error(err);
      showToast(err?.message || "Failed to assign agent", "error");
    }
  };

  const formatActivityDate = (value) => {
    if (!value) return "";
    return new Date(value).toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const fetchActivities = async (contactId) => {
    try {
      setActivitiesLoading(true);

      const response = await apiClient.request(
        `/contacts/${contactId}/activities`,
        { method: "GET" },
      );

      const data = response?.data || response || [];
      setActivities(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch activities error:", err);
      setActivities([]);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const openContactDetail = (contact) => {
    setSelectedContact(contact);
    fetchActivities(contact.id);
  };

  const latestNote =
    activities.find((item) => item.type === "note")?.sub ||
    selectedContact?.notes ||
    "Add notes...";

  const openNoteModal = (contact) => {
    setNoteContact(contact);
    setNoteText("");
    setShowNoteModal(true);
  };

  const addContactNote = async (e) => {
    e.preventDefault();

    if (!noteText.trim()) {
      showToast("Please enter a note", "error");
      return;
    }

    try {
      const activity = await apiClient.request(
        `/contacts/${noteContact.id}/activities`,
        {
          method: "POST",
          body: JSON.stringify({
            type: "note",
            title: "Note added",
            sub: noteText.trim(),
          }),
        },
      );

      if (selectedContact?.id === noteContact.id) {
        setActivities((prev) => [activity?.data || activity, ...prev]);
      }

      setShowNoteModal(false);
      setNoteContact(null);
      setNoteText("");
      showToast("Note added");
    } catch (err) {
      console.error(err);
      showToast(err?.message || "Failed to add note", "error");
    }
  };

  const getLatestNote = () => {
    const latest = activities.find((item) => item.type === "note");
    return latest?.sub || selectedContact?.notes || "Add notes...";
  };

  const closeDetail = () => {
    setSelectedContact(null);
    setActivities([]);
    setShowDetailMoreMenu(false);
  };

  const convertContactToLead = async (contact) => {
    const ok = window.confirm(`Convert ${contact.name} to a lead?`);
    if (!ok) return;

    try {
      const response = await apiClient.request(
        `/contacts/${contact.id}/convert-to-lead`,
        { method: "POST" },
      );

      const data = response?.data || response;
      const leadId = data?.lead?.id;

      await fetchActivities(contact.id);

      showToast(
        data?.alreadyConverted
          ? "This contact is already converted to a lead"
          : "Contact converted to lead",
      );

      setOpenMenuId(null);
      setShowDetailMoreMenu(false);

      if (leadId) {
        navigate(`/dashboard/leads?leadId=${leadId}`);
      } else {
        navigate("/dashboard/leads");
      }
    } catch (err) {
      console.error(err);
      showToast(err?.message || "Failed to convert contact", "error");
    }
  };
  const Modals = () => (
    <>
      {showEditModal && editForm && (
        <div className="modal-overlay">
          <div className="contact-modal">
            <div className="modal-header">
              <h2>Edit Contact</h2>
              <button
                className="icon-btn"
                onClick={() => {
                  setShowEditModal(false);
                  setEditForm(null);
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={updateContact}>
              <div className="modal-grid">
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm({ ...editForm, email: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) =>
                      setEditForm({ ...editForm, phone: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Type</label>
                  <select
                    value={editForm.type}
                    onChange={(e) =>
                      setEditForm({ ...editForm, type: e.target.value })
                    }
                  >
                    <option>Buyer</option>
                    <option>Seller</option>
                    <option>Developer</option>
                    <option>Renter</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm({ ...editForm, status: e.target.value })
                    }
                  >
                    <option>Cold</option>
                    <option>Warm</option>
                    <option>Hot</option>
                    <option>Active</option>
                    <option>Archived</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Source</label>
                  <input
                    type="text"
                    value={editForm.source}
                    onChange={(e) =>
                      setEditForm({ ...editForm, source: e.target.value })
                    }
                  />
                </div>

                <div className="form-group full">
                  <label>Interest</label>
                  <input
                    type="text"
                    value={editForm.interest}
                    onChange={(e) =>
                      setEditForm({ ...editForm, interest: e.target.value })
                    }
                  />
                </div>

                <div className="form-group full">
                  <label>Notes</label>
                  <textarea
                    rows="4"
                    value={editForm.notes}
                    onChange={(e) =>
                      setEditForm({ ...editForm, notes: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-action"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditForm(null);
                  }}
                >
                  Cancel
                </button>

                <button type="submit" className="primary-action">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssignModal && assignContact && (
        <div className="modal-overlay">
          <div className="contact-modal">
            <div className="modal-header">
              <h2>Assign Agent</h2>
              <button
                className="icon-btn"
                onClick={() => {
                  setShowAssignModal(false);
                  setAssignContact(null);
                  setAssignTo("");
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={assignAgent}>
              <div className="modal-grid">
                <div className="form-group full">
                  <label>Contact</label>
                  <input value={assignContact.name || ""} disabled />
                </div>

                <div className="form-group full">
                  <label>Agent</label>
                  <select
                    value={assignTo}
                    onChange={(e) => setAssignTo(e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map((member) => (
                      <option
                        key={member.userId || member.id}
                        value={member.userId || member.id}
                      >
                        {member.name || member.email || "Team Member"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-action"
                  onClick={() => {
                    setShowAssignModal(false);
                    setAssignContact(null);
                    setAssignTo("");
                  }}
                >
                  Cancel
                </button>

                <button type="submit" className="primary-action">
                  Assign Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showNoteModal && noteContact && (
        <div className="modal-overlay">
          <div className="contact-modal">
            <div className="modal-header">
              <h2>Add Note</h2>
              <button
                className="icon-btn"
                onClick={() => {
                  setShowNoteModal(false);
                  setNoteContact(null);
                  setNoteText("");
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={addContactNote}>
              <div className="modal-grid">
                <div className="form-group full">
                  <label>Contact</label>
                  <input value={noteContact.name || ""} disabled />
                </div>

                <div className="form-group full">
                  <label>Note</label>
                  <textarea
                    rows="5"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Write a note about this contact..."
                    required
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-action"
                  onClick={() => {
                    setShowNoteModal(false);
                    setNoteContact(null);
                    setNoteText("");
                  }}
                >
                  Cancel
                </button>

                <button type="submit" className="primary-action">
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );

  if (selectedContact) {
    return (
      <div className="mobile-detail-page contacts-page">
        <div className="detail-header">
          <button className="back-btn" onClick={closeDetail}>
            <ChevronLeft size={20} />
            <span>Back</span>
          </button>
          <h2>Contact Details</h2>
          <button
            className="more-btn"
            onClick={() => setShowDetailMoreMenu((prev) => !prev)}
          >
            <MoreVertical size={20} />
          </button>
        </div>
        {showDetailMoreMenu && (
          <div className="contact-menu detail-more-menu">
            <button
              onClick={() => {
                setShowDetailMoreMenu(false);
                openEditContact(selectedContact);
              }}
            >
              <Edit3 size={15} /> Edit Contact
            </button>

            <button
              onClick={() => {
                setShowDetailMoreMenu(false);
                openAssignAgent(selectedContact);
              }}
            >
              <UserCog size={15} /> Assign Agent
            </button>
            <button
              onClick={() => {
                setShowDetailMoreMenu(false);
                convertContactToLead(selectedContact);
              }}
            >
              <GitFork size={15} /> Convert to Lead
            </button>
            <button
              onClick={() => {
                setShowDetailMoreMenu(false);
                openNoteModal(selectedContact);
              }}
            >
              <StickyNote size={15} /> Add Note
            </button>

            <button
              onClick={() => {
                setShowDetailMoreMenu(false);
                archiveContact(selectedContact.id);
              }}
              className="warning"
            >
              <Archive size={15} /> Archive Contact
            </button>

            <button
              onClick={() => {
                setShowDetailMoreMenu(false);
                deleteContact(selectedContact.id);
                setSelectedContact(null);
              }}
              className="danger"
            >
              <Trash2 size={15} /> Delete Contact
            </button>
          </div>
        )}

        <div className="detail-scroll-content">
          <div className="contact-card detail-card-spec">
            <div className="contact-top">
              <div className="contact-user">
                <div className="contact-avatar">
                  {selectedContact.avatar ||
                    selectedContact.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="contact-group-right">
                  <div className="contact-name">{selectedContact.name}</div>
                  <div className="contact-badges-row">
                    <span className="badge-type">
                      {selectedContact.type || "Buyer"}
                    </span>
                    <span className="badge-dot">•</span>
                    <span
                      className={`badge-status ${String(selectedContact.status).toLowerCase()}`}
                    >
                      {selectedContact.status || "Cold"}
                    </span>
                    <span className="badge-dot">•</span>
                    <span className="badge-ai-score">
                      AI {selectedContact.score || "25"}%
                    </span>
                  </div>
                </div>
              </div>
              <span className="badge-status active abs-active-badge">
                Active
              </span>
            </div>

            <div className="contact-info-list no-border-bottom">
              <div className="info-item">
                <div className="info-label-group">
                  <Mail size={16} /> <span>Email:</span>
                </div>
                <div className="info-value text-link">
                  {selectedContact.email || "-"}
                </div>
              </div>

              <div className="info-item">
                <div className="info-label-group">
                  <Phone size={16} /> <span>Phone:</span>
                </div>
                <div className="info-value">{selectedContact.phone || "-"}</div>
              </div>

              <div className="info-item">
                <div className="info-label-group">
                  <UserPlus size={16} /> <span>Source:</span>
                </div>
                <div className="info-value">
                  {selectedContact.source || "-"}
                </div>
              </div>

              <div className="info-item">
                <div className="info-label-group">
                  <Home size={16} /> <span>Interested:</span>
                </div>
                <div className="info-value emphasis">
                  {selectedContact.interest || "-"}
                </div>
              </div>

              <div className="info-item">
                <div className="info-label-group">
                  <UserCog size={16} /> <span>Agent:</span>
                </div>
                <div className="info-value">
                  {selectedContact.assignedAgentName ||
                    selectedContact.assignedAgentEmail ||
                    "Unassigned"}
                </div>
              </div>

              <div className="info-item">
                <div className="info-label-group">
                  <Calendar size={16} /> <span>Added:</span>
                </div>
                <div className="info-value">
                  {selectedContact.addedDate || "May 18, 2025"}
                </div>
              </div>

              <div className="info-item alignment-top">
                <div className="info-label-group">
                  <StickyNote size={16} /> <span>Notes:</span>
                </div>
                <div
                  className="info-value note-placeholder"
                  onClick={() => openNoteModal(selectedContact)}
                  style={{ cursor: "pointer" }}
                >
                  {getLatestNote()}
                </div>
              </div>
            </div>
          </div>

          {/* AI Insights */}
          <div className="detail-section-card purple-glow">
            <div className="section-card-header">
              <div className="section-card-title purple-text">
                <Sparkles size={18} />
                <span>AI Insights</span>
              </div>
              <button className="section-action-link" onClick={loadAiInsights}>
                View Insights
              </button>
            </div>
            <p className="section-card-body">
              High potential buyer based on engagement and property views.
            </p>
          </div>

          {/* Conversation History */}
          <div className="detail-section-card">
            <div className="section-card-header">
              <div className="section-card-title">
                <MessageSquare size={18} />
                <span>Conversation History</span>
              </div>
              <button className="section-action-link">View all</button>
            </div>
            {activitiesLoading ? (
              <div className="history-item-clickable">
                <div className="history-brief">
                  <span>Loading activities...</span>
                </div>
              </div>
            ) : activities.length ? (
              activities.map((activity) => (
                <div key={activity.id} className="history-item-clickable">
                  <div className="history-meta">
                    {formatActivityDate(activity.createdAt)}
                  </div>
                  <div className="history-brief">
                    <span>{activity.title}</span>
                    <ChevronRight size={16} />
                  </div>
                  {activity.sub && (
                    <div className="history-meta">{activity.sub}</div>
                  )}
                </div>
              ))
            ) : (
              <div className="history-item-clickable">
                <div className="history-brief">
                  <span>No activity yet.</span>
                </div>
              </div>
            )}
          </div>

          <div className="detail-action-bar-grid">
            <button
              className="action-grid-btn"
              onClick={() => messageContact(selectedContact.id)}
            >
              <Send size={18} />
              <span>Message</span>
            </button>
            <button className="action-grid-btn">
              <Phone size={18} />
              <span>Call</span>
            </button>
            <button
              className="action-grid-btn"
              onClick={() => openNoteModal(selectedContact)}
            >
              <StickyNote size={18} />
              <span>Notes</span>
            </button>
            <button
              className="action-grid-btn"
              onClick={() => setShowDetailMoreMenu((prev) => !prev)}
            >
              <MoreVertical size={18} />
              <span>More</span>
            </button>
          </div>
        </div>
        <Modals />
      </div>
    );
  }

  return (
    <div>
      <div className="heading_page">
        <Users className="header-icon" size={20} />
        <h1>Contacts & Relationships</h1>
      </div>
      <p className="sub_head">
        Manage buyers, sellers, investors, venters and conversations from one
        AI-powered workspace.
      </p>
      <div className="contacts-page">
        <main className="main-content">
          <div className="content-wrapper">
            {/* KPI GRID */}
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
                    variant={stat.variant}
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
                  { label: "All", query: "" },
                  { label: "Buyers", query: "?type=Buyer" },
                  { label: "Sellers", query: "?type=Seller" },
                  { label: "Developers", query: "?type=Developer" },
                  { label: "Renters", query: "?type=Renter" },
                ].map((item) => (
                  <button
                    key={item.label}
                    className="filter-btn"
                    onClick={() => applyFilter(item.query)}
                  >
                    {item.label}
                  </button>
                ))}
                <div>
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
                    <Plus size={18} /> Add Contact
                  </button>
                </div>
              </div>
            </div>

            {/* CONTACTS GRID */}
            <div className="contacts-grid">
              {loading ? (
                <div>Loading...</div>
              ) : (
                contacts.map((contact) => (
                  <div
                    className="contact-card clickable-card"
                    key={contact.id}
                    onClick={() => openContactDetail(contact)}
                  >
                    <div className="contact-top">
                      <div className="contact-user">
                        <div className="contact-avatar">
                          {contact.avatar ||
                            contact.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div className="contact-group-right">
                          <div className="contact-name">{contact.name}</div>
                          <div className="contact-badges-row">
                            <span className="badge-type">
                              {contact.type || "Buyer"}
                            </span>
                            <span className="badge-dot">•</span>
                            <span
                              className={`badge-status ${String(contact.status).toLowerCase()}`}
                            >
                              {contact.status || "Cold"}
                            </span>
                            <span className="badge-dot">•</span>
                            <span className="badge-ai-score">
                              AI {contact.score || "25"}%
                            </span>
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
                            <button onClick={() => openEditContact(contact)}>
                              <Edit3 size={15} /> Edit Contact
                            </button>
                            <button onClick={() => openAssignAgent(contact)}>
                              <UserCog size={15} /> Assign Agent
                            </button>
                            <button
                              onClick={() => convertContactToLead(contact)}
                            >
                              <GitFork size={15} /> Convert to Lead
                            </button>
                            <div className="status-menu-group">
                              <button>
                                <StickyNote size={15} /> Change Status
                              </button>

                              <div className="status-submenu">
                                {["Cold", "Warm", "Hot", "Active"].map(
                                  (status) => (
                                    <button
                                      key={status}
                                      onClick={() =>
                                        changeContactStatus(contact.id, status)
                                      }
                                    >
                                      {status}
                                    </button>
                                  ),
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                navigate(
                                  `/dashboard/contacts/relationship-map?id=${contact.id}`,
                                )
                              }
                            >
                              <GitBranch size={15} /> Open Relationship Map
                            </button>
                            <button onClick={runAiReview}>
                              <Bot size={15} /> Run AI Review
                            </button>
                            <button
                              className="warning"
                              onClick={() => archiveContact(contact.id)}
                            >
                              <Archive size={15} /> Archive Contact
                            </button>
                            <button
                              className="danger"
                              onClick={() => deleteContact(contact.id)}
                            >
                              <Trash2 size={15} /> Delete Contact
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="contact-info-list">
                      <div className="info-item">
                        <div className="info-label-group">
                          <Mail size={16} /> <span>Email:</span>
                        </div>
                        <div className="info-value text-link">
                          {contact.email || "-"}
                        </div>
                      </div>
                      <div className="info-item">
                        <div className="info-label-group">
                          <Phone size={16} /> <span>Phone:</span>
                        </div>
                        <div className="info-value">{contact.phone || "-"}</div>
                      </div>
                      <div className="info-item">
                        <div className="info-label-group">
                          <UserPlus size={16} /> <span>Source:</span>
                        </div>
                        <div className="info-value">
                          {contact.source || "-"}
                        </div>
                      </div>
                      <div className="info-item">
                        <div className="info-label-group">
                          <Home size={16} /> <span>Interested:</span>
                        </div>
                        <div className="info-value emphasis">
                          {contact.interest || "-"}
                        </div>
                      </div>
                    </div>

                    <div className="contact-actions-footer">
                      <button
                        className="footer-action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          openContactDetail(contact);
                        }}
                      >
                        <Eye size={16} /> <span>View</span>
                      </button>
                      <button
                        className="footer-action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          messageContact(contact.id);
                        }}
                      >
                        <Send size={16} /> <span>Message</span>
                      </button>
                      <button
                        className="footer-action-btn"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Phone size={16} /> <span>Call</span>
                      </button>
                      <button
                        className="footer-action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          openNoteModal(contact);
                        }}
                      >
                        <StickyNote size={16} /> <span>Notes</span>
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
                          setCreateForm({ ...createForm, name: e.target.value })
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
                          setCreateForm({ ...createForm, type: e.target.value })
                        }
                      >
                        <option>Buyer</option>
                        <option>Seller</option>
                        <option>Developer</option>
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
          <Modals />
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
      <div className="kpi-chart_wrap">
        <div className="kpi-chart">
          <svg viewBox="0 0 180 42" preserveAspectRatio="none">
            <path
              d={
                title === "Active Sellers"
                  ? "M0 24 L20 24 L40 24 L60 24 L80 24 L100 24 L120 24 L140 24 L160 24 L180 24"
                  : title === "AI score"
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
          <span>Last 30 days</span>
        </div>
      </div>
    </div>
  );
}
