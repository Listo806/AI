import React, { useEffect, useRef, useState } from "react";
import "./contacts.css";
import { useNavigate, useLocation } from "react-router-dom";
import apiClient from "../../api/apiClient";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

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

  const [contactMessages, setContactMessages] = useState([]);
  const [contactMessagesLoading, setContactMessagesLoading] = useState(false);

  const fetchContactMessages = async (contactId) => {
    if (!contactId) return;
    try {
      setContactMessagesLoading(true);
      const response = await apiClient.request(
        `/whatsapp-qr/contacts/${contactId}/messages?limit=100`,
        {
          method: "GET",
        },
      );
      const data = response?.data || response || [];
      setContactMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch contact WhatsApp messages error:", err);
      setContactMessages([]);
    } finally {
      setContactMessagesLoading(false);
    }
  };

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
      showToast(t("contacts.contactCreated"));
    } catch (err) {
      console.error(err);
      showToast(t("contacts.createFailed"), "error");
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
      showToast(t("contacts.contactUpdated"));
    } catch (err) {
      console.error(err);
      showToast(err?.message || t("contacts.updateFailed"), "error");
    }
  };
  const fetchContacts = async (query = "") => {
    try {
      setLoading(true);
      const response = await apiClient.request(`/contacts${query}`, {
        method: "GET",
      });
      const data = response?.data || response || [];
      const contactList = Array.isArray(data) ? data : [];
      setContacts(contactList);
      return contactList;
    } catch (err) {
      console.error("Fetch contacts error:", err);
      return [];
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
          label: t("contacts.statTotalContacts"),
          value: data.totalContacts || 0,
          sub: t("contacts.statAllRelationships"),
          icon: Users,
        },
        {
          label: t("contacts.statActiveBuyers"),
          value: data.activeBuyers || 0,
          sub: t("contacts.statLookingNow"),
          icon: UserCheck,
          variant: "buyers",
        },
        {
          label: t("contacts.statActiveSellers"),
          value: data.activeSellers || 0,
          sub: t("contacts.statSellingProperties"),
          icon: Home,
          variant: "sellers",
        },
        {
          label: t("contacts.statActiveRenters"),
          value: data.activeRenters || 0,
          sub: t("contacts.statRentalDemand"),
          icon: Handshake,
          variant: "renters",
        },
        {
          label: t("contacts.statActiveDevelopers"),
          value: data.activeDevelopers || 0,
          sub: t("contacts.statDeveloperNetwork"),
          icon: Building2,
          variant: "developers",
        },
        {
          label: t("contacts.statAiScore"),
          value: `${data.aiEngagement || 0}%`,
          sub: t("contacts.statAiRelationshipScore"),
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
    openContactFromUrl();
  }, [location.search]);

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
      showToast(t("contacts.aiReviewCompleted"));
    } catch (err) {
      console.error(err);
      showToast(err?.message || t("contacts.aiReviewFailed"), "error");
    }
  };

  const loadAiInsights = async () => {
    try {
      const response = await apiClient.request("/contacts/ai-insights", {
        method: "GET",
      });
      const data = response?.data || response;
      showToast(data?.summary || t("contacts.noInsights"));
    } catch (err) {
      console.error(err);
      showToast(err?.message || t("contacts.aiInsightsFailed"), "error");
    }
  };

  const messageContact = async (contactId) => {
    const message = window.prompt(t("contacts.enterWhatsappMessage"));
    if (!message?.trim()) return;
    try {
      await apiClient.request(`/whatsapp-qr/contacts/${contactId}/send`, {
        method: "POST",
        body: JSON.stringify({
          message: message.trim(),
        }),
      });
      showToast(t("contacts.whatsappMessageSent"));
      if (selectedContact?.id === contactId) {
        await fetchContactMessages(contactId);
      }
    } catch (err) {
      console.error("Send WhatsApp message from contact error:", err);

      showToast(err?.message || t("contacts.whatsappSendFailed"), "error");
    }
  };

  const callContact = (phone) => {
    if (!phone) {
      showToast(t("contacts.noPhoneNumber"), "error");
      return;
    }
    window.location.href = `tel:${phone}`;
  };

  const deleteContact = async (contactId) => {
    const ok = window.confirm(t("contacts.deleteContactConfirm"));
    if (!ok) return;

    try {
      await apiClient.request(`/contacts/${contactId}`, {
        method: "DELETE",
      });

      setContacts((prev) => prev.filter((item) => item.id !== contactId));
      fetchStats();
      showToast(t("contacts.contactDeleted"));
    } catch (err) {
      console.error(err);
      showToast(err?.message || t("contacts.deleteFailed"), "error");
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
      showToast(t("contacts.statusChanged", { status }));
    } catch (err) {
      console.error(err);
      showToast(err?.message || t("contacts.statusChangeFailed"), "error");
    }
  };

  const archiveContact = async (contactId) => {
    const ok = window.confirm(t("contacts.archiveConfirm"));
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
      showToast(t("contacts.contactArchived"));
    } catch (err) {
      console.error(err);
      showToast(err?.message || t("contacts.archiveFailed"), "error");
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
        showToast(t("contacts.noTeamFound"), "error");
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
      showToast(err?.message || t("contacts.teamMembersFailed"), "error");
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
      showToast(t("contacts.agentAssigned"));
    } catch (err) {
      console.error(err);
      showToast(err?.message || t("contacts.assignAgentFailed"), "error");
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
    fetchContactMessages(contact.id);
  };

  const openLinkedLead = async (contact) => {
    if (!contact?.id) return;
    try {
      let leadId = contact.linkedLeadId || null;
      if (!leadId) {
        const response = await apiClient.request(
          `/contacts/${contact.id}/linked-lead`,
          {
            method: "GET",
          },
        );
        const data = response?.data || response || {};
        leadId = data?.lead?.id || null;
      }
      if (!leadId) {
        showToast(t("contacts.noLinkedLead"), "error");
        return;
      }
      setOpenMenuId(null);
      setShowDetailMoreMenu(false);
      navigate(`/dashboard/leads?leadId=${leadId}`);
    } catch (err) {
      console.error("Open linked lead error:", err);
      showToast(err?.message || t("contacts.openLinkedLeadFailed"), "error");
    }
  };

  const openContactFromUrl = async () => {
    const params = new URLSearchParams(location.search);
    const contactId = params.get("contactId");
    if (!contactId) return;
    try {
      const response = await apiClient.request(`/contacts/${contactId}`, {
        method: "GET",
      });
      const contact = response?.data || response;
      if (!contact?.id) return;
      setSelectedContact({
        ...contact,
        avatar: contact.avatar || contact.name?.charAt(0)?.toUpperCase() || "?",
      });

      fetchActivities(contact.id);
    } catch (err) {
      console.error("Open contact from URL error:", err);
      showToast(err?.message || t("contacts.openContactFailed"), "error");
    }
  };

  const latestNote =
    activities.find((item) => item.type === "note")?.sub ||
    selectedContact?.notes ||
    t("contacts.addNotes");

  const openNoteModal = (contact) => {
    setNoteContact(contact);
    setNoteText("");
    setShowNoteModal(true);
  };

  const addContactNote = async (e) => {
    e.preventDefault();

    if (!noteText.trim()) {
      showToast(t("contacts.enterNote"), "error");
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
      showToast(t("contacts.noteAdded"));
    } catch (err) {
      console.error(err);
      showToast(err?.message || t("contacts.addNoteFailed"), "error");
    }
  };

  const getLatestNote = () => {
    const latest = activities.find((item) => item.type === "note");
    return latest?.sub || selectedContact?.notes || t("contacts.addNotes");
  };

  const closeDetail = () => {
    setSelectedContact(null);
    setActivities([]);
    setShowDetailMoreMenu(false);
    const params = new URLSearchParams(location.search);
    if (params.has("contactId")) {
      params.delete("contactId");
      const query = params.toString();
      navigate(query ? `/dashboard/contacts?${query}` : "/dashboard/contacts", {
        replace: true,
      });
    }
  };

  const Modals = () => (
    <>
      {showEditModal && editForm && (
        <div className="modal-overlay">
          <div className="contact-modal">
            <div className="modal-header">
              <h2>{t("contacts.editContactTitle")}</h2>
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
                  <label>{t("contacts.contactName")}</label>
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
                  <label>{t("contacts.labelEmail")}</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm({ ...editForm, email: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>{t("contacts.labelPhone")}</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) =>
                      setEditForm({ ...editForm, phone: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>{t("contacts.labelType")}</label>
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
                  <label>{t("contacts.labelStatus")}</label>
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
                  <label>{t("contacts.labelSource")}</label>
                  <input
                    type="text"
                    value={editForm.source}
                    onChange={(e) =>
                      setEditForm({ ...editForm, source: e.target.value })
                    }
                  />
                </div>

                <div className="form-group full">
                  <label>{t("contacts.labelInterest")}</label>
                  <input
                    type="text"
                    value={editForm.interest}
                    onChange={(e) =>
                      setEditForm({ ...editForm, interest: e.target.value })
                    }
                  />
                </div>

                <div className="form-group full">
                  <label>{t("contacts.notes")}</label>
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
                  {t("contacts.cancel")}
                </button>

                <button type="submit" className="primary-action">
                  {t("contacts.saveChanges")}
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
              <h2>{t("contacts.assignAgentTitle")}</h2>
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
                  <label>{t("contacts.labelContact")}</label>
                  <input value={assignContact.name || ""} disabled />
                </div>

                <div className="form-group full">
                  <label>{t("contacts.labelAgent")}</label>
                  <select
                    value={assignTo}
                    onChange={(e) => setAssignTo(e.target.value)}
                  >
                    <option value="">{t("contacts.unassigned")}</option>
                    {teamMembers.map((member) => (
                      <option
                        key={member.userId || member.id}
                        value={member.userId || member.id}
                      >
                        {member.name || member.email || t("contacts.teamMember")}
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
                  {t("contacts.cancel")}
                </button>

                <button type="submit" className="primary-action">
                  {t("contacts.assignAgentTitle")}
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
              <h2>{t("contacts.addNoteTitle")}</h2>
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
                  <label>{t("contacts.labelContact")}</label>
                  <input value={noteContact.name || ""} disabled />
                </div>

                <div className="form-group full">
                  <label>{t("contacts.labelNote")}</label>
                  <textarea
                    rows="5"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder={t("contacts.notePlaceholder")}
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
                  {t("contacts.cancel")}
                </button>

                <button type="submit" className="primary-action">
                  {t("contacts.saveNote")}
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
            <span>{t("contacts.back")}</span>
          </button>
          <h2>{t("contacts.contactDetails")}</h2>
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
              <Edit3 size={15} /> {t("contacts.editContactTitle")}
            </button>

            <button
              onClick={() => {
                setShowDetailMoreMenu(false);
                openAssignAgent(selectedContact);
              }}
            >
              <UserCog size={15} /> {t("contacts.assignAgentTitle")}
            </button>
            {selectedContact.linkedLeadId && (
              <button onClick={() => openLinkedLead(selectedContact)}>
                <GitFork size={15} />
                {t("contacts.openLead")}
              </button>
            )}
            <button
              onClick={() => {
                setShowDetailMoreMenu(false);
                openNoteModal(selectedContact);
              }}
            >
              <StickyNote size={15} /> {t("contacts.addNoteTitle")}
            </button>

            <button
              onClick={() => {
                setShowDetailMoreMenu(false);
                archiveContact(selectedContact.id);
              }}
              className="warning"
            >
              <Archive size={15} /> {t("contacts.archiveContact")}
            </button>

            <button
              onClick={() => {
                setShowDetailMoreMenu(false);
                deleteContact(selectedContact.id);
                setSelectedContact(null);
              }}
              className="danger"
            >
              <Trash2 size={15} /> {t("contacts.deleteContactAction")}
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
                      AI {Number(selectedContact.score || 0)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="contact-info-list no-border-bottom">
              <div className="info-item">
                <div className="info-label-group">
                  <Mail size={16} /> <span>{t("contacts.labelEmail")}:</span>
                </div>
                <div className="info-value text-link">
                  {selectedContact.email || "-"}
                </div>
              </div>

              <div className="info-item">
                <div className="info-label-group">
                  <Phone size={16} /> <span>{t("contacts.labelPhone")}:</span>
                </div>
                <div className="info-value">{selectedContact.phone || "-"}</div>
              </div>

              <div className="info-item">
                <div className="info-label-group">
                  <UserPlus size={16} /> <span>{t("contacts.labelSource")}:</span>
                </div>
                <div className="info-value">
                  {selectedContact.source || "-"}
                </div>
              </div>

              <div className="info-item">
                <div className="info-label-group">
                  <GitFork size={16} />
                  <span>{t("contacts.labelLinkedLead")}:</span>
                </div>
                <div className="info-value">
                  {selectedContact.linkedLeadId ? (
                    <button
                      type="button"
                      className="contact-linked-lead-btn"
                      onClick={() => openLinkedLead(selectedContact)}
                    >
                      {selectedContact.linkedLead || t("contacts.openLead")}
                      <ChevronRight size={14} />
                    </button>
                  ) : (
                    "-"
                  )}
                </div>
              </div>

              <div className="info-item">
                <div className="info-label-group">
                  <Home size={16} /> <span>{t("contacts.labelInterested")}:</span>
                </div>
                <div className="info-value emphasis">
                  {selectedContact.interest || "-"}
                </div>
              </div>

              <div className="info-item">
                <div className="info-label-group">
                  <UserCog size={16} /> <span>{t("contacts.labelAgent")}:</span>
                </div>
                <div className="info-value">
                  {selectedContact.assignedAgentName ||
                    selectedContact.assignedAgentEmail ||
                    t("contacts.unassigned")}
                </div>
              </div>

              <div className="info-item">
                <div className="info-label-group">
                  <Calendar size={16} /> <span>{t("contacts.labelAdded")}:</span>
                </div>
                <div className="info-value">
                  {selectedContact.addedDate
                    ? selectedContact.addedDate
                    : selectedContact.createdAt
                      ? new Date(
                          selectedContact.createdAt,
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"}
                </div>
              </div>

              <div className="info-item alignment-top">
                <div className="info-label-group">
                  <StickyNote size={16} /> <span>{t("contacts.notes")}:</span>
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
                <span>{t("contacts.aiInsights")}</span>
              </div>
              <button className="section-action-link" onClick={loadAiInsights}>
                {t("contacts.viewInsights")}
              </button>
            </div>
            <p className="section-card-body">
              {t("contacts.aiInsightPlaceholder")}
            </p>
          </div>

          {/* Conversation History */}
          <div className="detail-section-card">
            <div className="section-card-header">
              <div className="section-card-title">
                <MessageSquare size={18} />
                <span>{t("contacts.conversationHistory")}</span>
              </div>
            </div>
            {activitiesLoading ? (
              <div className="history-item-clickable">
                <div className="history-brief">
                  <span>{t("contacts.loadingActivities")}</span>
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
                  <span>{t("contacts.noActivity")}</span>
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
              <span>{t("contacts.message")}</span>
            </button>
            <button
              className="action-grid-btn"
              onClick={() => callContact(selectedContact.phone)}
            >
              <Phone size={18} />
              <span>{t("contacts.call")}</span>
            </button>
            <button
              className="action-grid-btn"
              onClick={() => openNoteModal(selectedContact)}
            >
              <StickyNote size={18} />
              <span>{t("contacts.notes")}</span>
            </button>
            <button
              className="action-grid-btn"
              onClick={() => setShowDetailMoreMenu((prev) => !prev)}
            >
              <MoreVertical size={18} />
              <span>{t("contacts.more")}</span>
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
        <h1>{t("contacts.pageTitle")}</h1>
      </div>
      <p className="sub_head">{t("contacts.pageSubtitle")}</p>
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
                    trend={stat.variant === "sellers" ? "0%" : "+12%"}
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
                    placeholder={t("contacts.searchPlaceholder")}
                    value={search}
                    onChange={handleSearch}
                  />
                </div>

                {[
                  { label: t("contacts.filterAll"), query: "" },
                  { label: t("contacts.filterBuyers"), query: "?type=Buyer" },
                  { label: t("contacts.filterSellers"), query: "?type=Seller" },
                  { label: t("contacts.filterDevelopers"), query: "?type=Developer" },
                  { label: t("contacts.filterRenters"), query: "?type=Renter" },
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
                    <Sparkles /> {t("contacts.aiInsights")}
                  </button>
                  <button className="action-btn runai" onClick={runAiReview}>
                    <Bot /> {t("contacts.runAiReview")}
                  </button>
                  <button
                    className="primary-btn"
                    onClick={() => setShowCreateModal(true)}
                  >
                    <Plus size={18} /> {t("contacts.addContactTitle")}
                  </button>
                </div>
              </div>
            </div>

            {/* CONTACTS GRID */}
            <div className="contacts-grid">
              {loading ? (
                <div>{t("contacts.loading")}</div>
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
                              <Edit3 size={15} /> {t("contacts.editContactTitle")}
                            </button>
                            <button onClick={() => openAssignAgent(contact)}>
                              <UserCog size={15} /> {t("contacts.assignAgentTitle")}
                            </button>
                            {contact.linkedLeadId && (
                              <button onClick={() => openLinkedLead(contact)}>
                                <GitFork size={15} />
                                {t("contacts.openLead")}
                              </button>
                            )}
                            <div className="status-menu-group">
                              <button>
                                <StickyNote size={15} /> {t("contacts.changeStatus")}
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
                            <button onClick={runAiReview}>
                              <Bot size={15} /> {t("contacts.runAiReview")}
                            </button>
                            <button
                              className="warning"
                              onClick={() => archiveContact(contact.id)}
                            >
                              <Archive size={15} /> {t("contacts.archiveContact")}
                            </button>
                            <button
                              className="danger"
                              onClick={() => deleteContact(contact.id)}
                            >
                              <Trash2 size={15} /> {t("contacts.deleteContactAction")}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="contact-info-list">
                      <div className="info-item">
                        <div className="info-label-group">
                          <Mail size={16} /> <span>{t("contacts.labelEmail")}:</span>
                        </div>
                        <div className="info-value text-link">
                          {contact.email || "-"}
                        </div>
                      </div>
                      <div className="info-item">
                        <div className="info-label-group">
                          <Phone size={16} /> <span>{t("contacts.labelPhone")}:</span>
                        </div>
                        <div className="info-value">{contact.phone || "-"}</div>
                      </div>
                      <div className="info-item">
                        <div className="info-label-group">
                          <UserPlus size={16} /> <span>{t("contacts.labelSource")}:</span>
                        </div>
                        <div className="info-value">
                          {contact.source || "-"}
                        </div>
                      </div>
                      <div className="info-item">
                        <div className="info-label-group">
                          <Home size={16} /> <span>{t("contacts.labelInterested")}:</span>
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
                        <Eye size={16} /> <span>{t("contacts.view")}</span>
                      </button>
                      <button
                        className="footer-action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          messageContact(contact.id);
                        }}
                      >
                        <Send size={16} /> <span>{t("contacts.message")}</span>
                      </button>
                      <button
                        className="footer-action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          callContact(contact.phone);
                        }}
                      >
                        <Phone size={16} /> <span>{t("contacts.call")}</span>
                      </button>
                      <button
                        className="footer-action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          openNoteModal(contact);
                        }}
                      >
                        <StickyNote size={16} /> <span>{t("contacts.notes")}</span>
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
                  <h2>{t("contacts.addContactTitle")}</h2>
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
                      <label>{t("contacts.contactName")}</label>
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
                      <label>{t("contacts.labelEmail")}</label>
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
                      <label>{t("contacts.labelPhone")}</label>
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
                      <label>{t("contacts.labelType")}</label>
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
                      <label>{t("contacts.notes")}</label>
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
                      {t("contacts.cancel")}
                    </button>
                    <button type="submit" className="primary-action">
                      {t("contacts.createContactTitle")}
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
  const { t } = useTranslation();
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
                variant === "sellers"
                  ? "M0 24 L20 24 L40 24 L60 24 L80 24 L100 24 L120 24 L140 24 L160 24 L180 24"
                  : variant === "ai"
                    ? "M0 32 L20 28 L40 26 L60 18 L80 24 L100 16 L120 12 L140 20 L160 10 L180 6"
                    : variant === "buyers"
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
          <span>{t("contacts.last30Days")}</span>
        </div>
      </div>
    </div>
  );
}
