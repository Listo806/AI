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
  ChevronDown,
  LayoutDashboard,
  GitFork,
  Menu,
  Filter,
  ArrowUpDown,
  Star,
  Target,
  Bell,
  Download,
  Activity,
  Folder,
  CheckSquare,
  CalendarDays,
  MapPin,
  Globe2,
  Info,
  Copy,
  BriefcaseBusiness,
} from "lucide-react";

export default function ContactsRelationshipsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [contacts, setContacts] = useState([]);
  const [stats, setStats] = useState([]);
  const [rawStats, setRawStats] = useState(null);
  const [filterOptions, setFilterOptions] = useState({
    statuses: [],
    sources: [],
    owners: [],
    types: [],
    tags: [],
  });
  const [desktopFilters, setDesktopFilters] = useState({
    status: "",
    source: "",
    assignedTo: "",
    lastActivity: "",
    type: "",
    tag: "",
  });

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
  const [mobileSort, setMobileSort] = useState("activity");
  const [mobileDetailSection, setMobileDetailSection] = useState("activity");
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(min-width: 1025px)").matches
      : false,
  );
  const [desktopDetailTab, setDesktopDetailTab] = useState("overview");
  const [desktopPage, setDesktopPage] = useState(1);
  const [desktopPerPage, setDesktopPerPage] = useState(25);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importRows, setImportRows] = useState([]);
  const [importFileName, setImportFileName] = useState("");
  const [importDuplicateStrategy, setImportDuplicateStrategy] = useState("skip");
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);



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

  useEffect(() => {
    const desktopMediaQuery = window.matchMedia("(min-width: 1025px)");
    const syncDesktop = () => setIsDesktop(desktopMediaQuery.matches);
    syncDesktop();
    desktopMediaQuery.addEventListener?.("change", syncDesktop);
    return () => desktopMediaQuery.removeEventListener?.("change", syncDesktop);
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

  const formatTrend = (value) => {
    const number = Number(value || 0);
    if (!Number.isFinite(number) || number === 0) return "0%";
    return `${number > 0 ? "+" : ""}${number}%`;
  };

  const fetchStats = async () => {
    try {
      const response = await apiClient.request("/contacts/stats", {
        method: "GET",
      });
      const data = response?.data || response || {};

      setRawStats(data);

      setStats([
        {
          label: t("contacts.statTotalContacts"),
          value: Number(data.totalContacts || 0),
          sub: t("contacts.last30Days"),
          icon: Users,
          variant: "total",
          trend: formatTrend(data.totalContactsTrend),
          series: data?.series?.totalContacts || [],
        },
        {
          label: t("contacts.statNewContacts"),
          value: Number(data.newContacts || 0),
          sub: t("contacts.last30Days"),
          icon: UserPlus,
          variant: "new",
          trend: formatTrend(data.newContactsTrend),
          series: data?.series?.newContacts || [],
        },
        {
          label: t("contacts.statActiveCustomers"),
          value: Number(data.activeCustomers || 0),
          sub: t("contacts.last30Days"),
          icon: UserCheck,
          variant: "active",
          trend: formatTrend(data.activeCustomersTrend),
          series: data?.series?.activeCustomers || [],
        },
        {
          label: t("contacts.statOpenOpportunities"),
          value: Number(data.openOpportunities || 0),
          sub: t("contacts.last30Days"),
          icon: Target,
          variant: "opportunities",
          trend: formatTrend(data.openOpportunitiesTrend),
          series: data?.series?.openOpportunities || [],
        },
        {
          label: t("contacts.statNeedsFollowUp"),
          value: Number(data.needsFollowUp || 0),
          sub: t("contacts.last30Days"),
          icon: Bell,
          variant: "followup",
          trend: formatTrend(data.needsFollowUpTrend),
          series: data?.series?.needsFollowUp || [],
        },
        {
          label: t("contacts.statAiEngagement"),
          value: `${Math.round(Number(data.aiEngagement || 0))}%`,
          sub: t("contacts.last30Days"),
          icon: Star,
          variant: "ai",
          trend: formatTrend(data.aiEngagementTrend),
          series: data?.series?.aiEngagement || [],
        },
      ]);
    } catch (err) {
      console.error("Fetch stats error:", err);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const response = await apiClient.request("/contacts/filter-options", {
        method: "GET",
      });
      const data = response?.data || response || {};

      setFilterOptions({
        statuses: Array.isArray(data.statuses) ? data.statuses : [],
        sources: Array.isArray(data.sources) ? data.sources : [],
        owners: Array.isArray(data.owners) ? data.owners : [],
        types: Array.isArray(data.types) ? data.types : [],
        tags: Array.isArray(data.tags) ? data.tags : [],
      });
    } catch (err) {
      console.error("Fetch contact filter options error:", err);
    }
  };

  const buildContactQuery = (overrides = {}) => {
    const next = {
      ...desktopFilters,
      ...overrides,
    };

    const params = new URLSearchParams();

    if (search.trim()) params.set("search", search.trim());
    if (next.status) params.set("status", next.status);
    if (next.source) params.set("source", next.source);
    if (next.assignedTo) params.set("assignedTo", next.assignedTo);
    if (next.lastActivity) params.set("lastActivity", next.lastActivity);
    if (next.type) params.set("type", next.type);
    if (next.tag) params.set("tag", next.tag);

    return params.toString() ? `?${params.toString()}` : "";
  };

  const updateDesktopFilter = (key, value) => {
    const next = {
      ...desktopFilters,
      [key]: value,
    };

    setDesktopFilters(next);
    setDesktopPage(1);
    fetchContacts(buildContactQuery(next));
  };

  const resetDesktopFilters = () => {
    const reset = {
      status: "",
      source: "",
      assignedTo: "",
      lastActivity: "",
      type: "",
      tag: "",
    };

    setDesktopFilters(reset);
    setDesktopPage(1);
    fetchContacts(search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "");
  };

  useEffect(() => {
    fetchContacts();
    fetchStats();
    fetchFilterOptions();
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
    setDesktopPage(1);
    setSearch(value);

    const params = new URLSearchParams();

    if (value.trim()) params.set("search", value.trim());
    if (desktopFilters.status) params.set("status", desktopFilters.status);
    if (desktopFilters.source) params.set("source", desktopFilters.source);
    if (desktopFilters.assignedTo) params.set("assignedTo", desktopFilters.assignedTo);
    if (desktopFilters.lastActivity) params.set("lastActivity", desktopFilters.lastActivity);
    if (desktopFilters.type) params.set("type", desktopFilters.type);
    if (desktopFilters.tag) params.set("tag", desktopFilters.tag);

    fetchContacts(params.toString() ? `?${params.toString()}` : "");
  };

  const applyFilter = (query) => {
    setDesktopPage(1);
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
    setDesktopDetailTab("overview");
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


  const scrollToMobileDetailSection = (section, elementId) => {
    setMobileDetailSection(section);

    window.requestAnimationFrame(() => {
      document.getElementById(elementId)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const mobileStatValue = (index, fallback = 0) => {
    const raw = stats?.[index]?.value;
    return raw === undefined || raw === null || raw === "" ? fallback : raw;
  };

  const mobileAiScore = (contact) =>
    Math.max(0, Math.min(100, Number(contact?.score || contact?.aiScore || 0)));

  const mobileCompany = (contact) =>
    contact?.company ||
    contact?.companyName ||
    contact?.linkedLeadName ||
    contact?.interest ||
    "";

  const mobileOwner = (contact) =>
    contact?.assignedAgentName ||
    contact?.assignedAgentEmail ||
    t("contacts.unassigned");

  const mobileRelativeTime = (value) => {
    if (!value) return "—";
    const time = new Date(value).getTime();
    if (!Number.isFinite(time)) return "—";
    const diff = Math.max(0, Date.now() - time);
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${Math.max(1, mins)}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(value).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const mobileContactTone = (contact, index) => {
    const status = String(contact?.status || "").toLowerCase();
    if (status === "active") return "green";
    if (status === "hot") return "red";
    if (status === "warm") return "orange";
    return ["purple", "blue", "orange"][index % 3];
  };

  const mobileSortedContacts = [...contacts].sort((a, b) => {
    if (mobileSort === "score") {
      return mobileAiScore(b) - mobileAiScore(a);
    }
    if (mobileSort === "name") {
      return String(a?.name || "").localeCompare(String(b?.name || ""));
    }
    const aTime = new Date(a?.updatedAt || a?.createdAt || 0).getTime();
    const bTime = new Date(b?.updatedAt || b?.createdAt || 0).getTime();
    return bTime - aTime;
  });

  const mobileTotalContacts =
    Number(String(mobileStatValue(0, contacts.length)).replace(/[^\d.-]/g, "")) ||
    contacts.length;

  const mobileCommandStats = [
    {
      label: "Total Contacts",
      value: mobileStatValue(0, contacts.length),
      trend: "18%",
      tone: "purple",
      icon: Users,
      path: "M0 32 L20 27 L40 29 L60 21 L80 15 L100 17 L120 10 L140 13 L160 8 L180 3",
    },
    {
      label: "New Contacts",
      value: contacts.filter((contact) => {
        if (!contact?.createdAt) return false;
        return Date.now() - new Date(contact.createdAt).getTime() <= 30 * 86400000;
      }).length,
      trend: "24%",
      tone: "green",
      icon: UserPlus,
      path: "M0 33 L20 25 L40 28 L60 19 L80 13 L100 16 L120 10 L140 8 L160 3 L180 0",
    },
    {
      label: "Active Customers",
      value: contacts.filter(
        (contact) => String(contact?.status || "").toLowerCase() === "active",
      ).length,
      trend: "16%",
      tone: "blue",
      icon: UserCheck,
      path: "M0 34 L20 28 L40 30 L60 22 L80 16 L100 20 L120 14 L140 10 L160 5 L180 4",
    },
    {
      label: "Open Opportunities",
      value: contacts.filter((contact) =>
        ["warm", "hot"].includes(String(contact?.status || "").toLowerCase()),
      ).length,
      trend: "21%",
      tone: "orange",
      icon: Target,
      path: "M0 35 L20 30 L40 31 L60 23 L80 16 L100 20 L120 14 L140 11 L160 5 L180 0",
    },
    {
      label: "Needs Follow-Up",
      value: contacts.filter(
        (contact) =>
          Boolean(contact?.recommendedAction) ||
          Boolean(contact?.followUpRecommended),
      ).length,
      trend: "15%",
      tone: "red",
      icon: Bell,
      path: "M0 34 L20 28 L40 30 L60 21 L80 13 L100 18 L120 11 L140 8 L160 2 L180 0",
    },
    {
      label: "AI Engagement",
      value: mobileStatValue(5, "0%"),
      trend: "12%",
      tone: "purple",
      icon: Star,
      path: "M0 34 L20 30 L40 31 L60 24 L80 17 L100 21 L120 13 L140 10 L160 4 L180 2",
    },
  ];

  const mobileActivityIcon = (activity) => {
    const key = String(activity?.type || activity?.title || "").toLowerCase();
    if (key.includes("whatsapp") || key.includes("message")) return MessageSquare;
    if (key.includes("email")) return Mail;
    if (key.includes("call") || key.includes("phone")) return Phone;
    if (key.includes("meeting") || key.includes("appointment")) return CalendarDays;
    if (key.includes("task")) return CheckSquare;
    if (key.includes("form")) return StickyNote;
    return Activity;
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



  const parseCsvText = (text) => {
    const rows = [];
    let row = [];
    let value = "";
    let quoted = false;

    for (let index = 0; index < text.length; index++) {
      const char = text[index];
      const next = text[index + 1];

      if (char === '"') {
        if (quoted && next === '"') {
          value += '"';
          index++;
        } else {
          quoted = !quoted;
        }
        continue;
      }

      if (char === "," && !quoted) {
        row.push(value);
        value = "";
        continue;
      }

      if ((char === "\n" || char === "\r") && !quoted) {
        if (char === "\r" && next === "\n") index++;
        row.push(value);
        value = "";

        if (row.some((cell) => String(cell || "").trim() !== "")) {
          rows.push(row);
        }

        row = [];
        continue;
      }

      value += char;
    }

    row.push(value);
    if (row.some((cell) => String(cell || "").trim() !== "")) {
      rows.push(row);
    }

    if (rows.length < 2) return [];

    const headers = rows[0].map((header) =>
      String(header || "").replace(/^\uFEFF/, "").trim(),
    );

    return rows.slice(1).map((cells, index) => {
      const item = {
        __rowNumber: index + 2,
      };

      headers.forEach((header, cellIndex) => {
        if (!header) return;
        item[header] = String(cells[cellIndex] ?? "").trim();
      });

      return item;
    });
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      showToast(t("contacts.importCsvOnly"), "error");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast(t("contacts.importFileTooLarge"), "error");
      event.target.value = "";
      return;
    }

    try {
      const text = await file.text();
      const parsed = parseCsvText(text);

      if (!parsed.length) {
        showToast(t("contacts.importNoRows"), "error");
        event.target.value = "";
        return;
      }

      setImportFileName(file.name);
      setImportRows(parsed);
      setImportResult(null);
    } catch (error) {
      console.error("Read contacts CSV error:", error);
      showToast(t("contacts.importReadFailed"), "error");
    }
  };

  const runContactsImport = async () => {
    if (!importRows.length || importLoading) return;

    setImportLoading(true);
    setImportResult(null);

    try {
      const batchSize = 100;
      const totals = {
        processed: 0,
        imported: 0,
        updated: 0,
        skipped: 0,
        failed: 0,
        errors: [],
      };

      let importId = null;

      for (let start = 0; start < importRows.length; start += batchSize) {
        const rows = importRows.slice(start, start + batchSize);
        const isFirstBatch = start === 0;
        const isLastBatch = start + batchSize >= importRows.length;

        const response = await apiClient.request("/contacts/import/batch", {
          method: "POST",
          body: JSON.stringify({
            importId,
            fileName: importFileName,
            rows,
            duplicateStrategy: importDuplicateStrategy,
            isFirstBatch,
            isLastBatch,
          }),
        });

        const data = response?.data || response || {};
        importId = data.importId || importId;

        totals.processed += Number(data?.batch?.processed || 0);
        totals.imported += Number(data?.batch?.imported || 0);
        totals.updated += Number(data?.batch?.updated || 0);
        totals.skipped += Number(data?.batch?.skipped || 0);
        totals.failed += Number(data?.batch?.failed || 0);

        if (Array.isArray(data?.batch?.errors)) {
          totals.errors.push(...data.batch.errors);
        }
      }

      setImportResult(totals);

      await Promise.all([
        fetchContacts(buildContactQuery()),
        fetchStats(),
        fetchFilterOptions(),
      ]);

      showToast(t("contacts.importCompleted"), "success");
    } catch (error) {
      console.error("Contacts import error:", error);
      showToast(error?.message || t("contacts.importFailed"), "error");
    } finally {
      setImportLoading(false);
    }
  };

  const desktopTotalContacts = contacts.length;
  const desktopTotalPages = Math.max(
    1,
    Math.ceil(desktopTotalContacts / desktopPerPage),
  );
  const desktopSafePage = Math.min(desktopPage, desktopTotalPages);
  const desktopStartIndex = (desktopSafePage - 1) * desktopPerPage;
  const desktopVisibleContacts = contacts.slice(
    desktopStartIndex,
    desktopStartIndex + desktopPerPage,
  );

  const desktopStatusClass = (contact) =>
    String(contact?.status || contact?.type || "contact")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");

  const desktopContactAvatar = (contact) => {
    const value = contact?.avatar;
    if (
      typeof value === "string" &&
      (value.startsWith("http://") ||
        value.startsWith("https://") ||
        value.startsWith("data:"))
    ) {
      return <img src={value} alt="" />;
    }

    return (
      <span>
        {value ||
          contact?.name
            ?.split(/\s+/)
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() ||
          "?"}
      </span>
    );
  };

  if (selectedContact && !isDesktop) {
    const selectedScore = mobileAiScore(selectedContact);
    const selectedCompany = mobileCompany(selectedContact);
    const selectedLastContact =
      selectedContact.lastContactAt ||
      selectedContact.updatedAt ||
      selectedContact.createdAt;

    return (
      <>
        <section className="contacts-mobile-detail-v2">
          <header className="cmd2-header">
            <button type="button" className="cmd2-header-btn" onClick={closeDetail}>
              <ChevronLeft />
            </button>

            <div className="cmd2-heading">
              <h1>Contact Profile</h1>
              <p>
                View and manage contact information, communication, and relationship
                details.
              </p>
            </div>

            <button
              type="button"
              className="cmd2-header-btn"
              onClick={() => setShowDetailMoreMenu((prev) => !prev)}
            >
              <MoreVertical />
            </button>
          </header>

          {showDetailMoreMenu && (
            <div className="contact-menu detail-more-menu cmd2-more-menu">
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
                  <GitFork size={15} /> {t("contacts.openLead")}
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
                className="warning"
                onClick={() => {
                  setShowDetailMoreMenu(false);
                  archiveContact(selectedContact.id);
                }}
              >
                <Archive size={15} /> {t("contacts.archiveContact")}
              </button>
              <button
                className="danger"
                onClick={() => {
                  setShowDetailMoreMenu(false);
                  deleteContact(selectedContact.id);
                  setSelectedContact(null);
                }}
              >
                <Trash2 size={15} /> {t("contacts.deleteContactAction")}
              </button>
            </div>
          )}

          <section className="cmd2-profile-card">
            <div className="cmd2-profile-main">
              <div className="cmd2-avatar">
                {selectedContact.avatar ||
                  selectedContact.name?.charAt(0)?.toUpperCase() ||
                  "?"}
                <span />
              </div>

              <div className="cmd2-profile-copy">
                <div className="cmd2-name-row">
                  <h2>{selectedContact.name}</h2>
                  <span
                    className={`badge-status ${String(
                      selectedContact.status || "",
                    ).toLowerCase()}`}
                  >
                    {selectedContact.status ||
                      selectedContact.type ||
                      "Contact"}
                  </span>
                </div>
                <p>{selectedCompany || selectedContact.email || "—"}</p>
                <div className="cmd2-profile-meta">
                  <span>
                    <BriefcaseBusiness />
                    {selectedContact.title ||
                      selectedContact.type ||
                      "Contact"}
                  </span>
                  <i />
                  <span>
                    <Star />
                    {selectedScore >= 80
                      ? "High Value"
                      : selectedScore >= 50
                        ? "Engaged"
                        : "Contact"}
                  </span>
                </div>
              </div>
            </div>

            <div className="cmd2-quick-actions">
              <button onClick={() => messageContact(selectedContact.id)}>
                <MessageSquare />
                <span>WhatsApp</span>
              </button>
              <button
                onClick={() => {
                  if (selectedContact.email) {
                    window.location.href = `mailto:${selectedContact.email}`;
                  }
                }}
              >
                <Mail />
                <span>Email</span>
              </button>
              <button onClick={() => callContact(selectedContact.phone)}>
                <Phone />
                <span>Call</span>
              </button>
              <button onClick={() => navigate("/dashboard/calendar")}>
                <CalendarDays />
                <span>Schedule</span>
              </button>
              <button onClick={() => setShowDetailMoreMenu((prev) => !prev)}>
                <MoreVertical />
                <span>More</span>
              </button>
            </div>
          </section>

          <section className="cmd2-section-card">
            <div className="cmd2-section-head">
              <h2>
                <UserPlus /> Contact Information
              </h2>
              <button onClick={() => openEditContact(selectedContact)}>
                <Edit3 /> Edit
              </button>
            </div>

            <div className="cmd2-info-list">
              <div>
                <Mail />
                <span>Email</span>
                <strong>{selectedContact.email || "—"}</strong>
                <Copy />
              </div>
              <div>
                <Phone />
                <span>Phone</span>
                <strong>{selectedContact.phone || "—"}</strong>
                <Phone />
              </div>
              <div>
                <Building2 />
                <span>Company</span>
                <strong>{selectedCompany || "—"}</strong>
                <ChevronRight />
              </div>
              <div>
                <BriefcaseBusiness />
                <span>Title</span>
                <strong>{selectedContact.title || selectedContact.type || "—"}</strong>
                <ChevronRight />
              </div>
              <div>
                <Target />
                <span>Status</span>
                <strong>{selectedContact.status || "—"}</strong>
                <ChevronRight />
              </div>
            </div>
          </section>

          <section className="cmd2-section-card">
            <div className="cmd2-section-head">
              <h2>
                <Info /> Additional Details
              </h2>
            </div>
            <div className="cmd2-info-list">
              <div>
                <MapPin />
                <span>Location</span>
                <strong>{selectedContact.location || "—"}</strong>
                <ChevronRight />
              </div>
              <div>
                <Globe2 />
                <span>Source</span>
                <strong>{selectedContact.source || "—"}</strong>
                <ChevronRight />
              </div>
              <div>
                <UserCog />
                <span>Owner</span>
                <strong>{mobileOwner(selectedContact)}</strong>
                <ChevronRight />
              </div>
              <div>
                <CalendarDays />
                <span>Lead Created</span>
                <strong>
                  {selectedContact.createdAt
                    ? new Date(selectedContact.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })
                    : "—"}
                </strong>
                <ChevronRight />
              </div>
              <div>
                <Clock />
                <span>Last Contact</span>
                <strong>{mobileRelativeTime(selectedLastContact)}</strong>
                <ChevronRight />
              </div>
            </div>
          </section>

          <button
            type="button"
            className="cmd2-wide-link"
            onClick={() => openNoteModal(selectedContact)}
          >
            <StickyNote />
            <span>Add Tags / Notes</span>
            <ChevronRight />
          </button>

          <div className="cmd2-major-title">
            <Sparkles />
            <div>
              <h2>AI Contact Intelligence</h2>
              <p>
                AI-powered insights and recommendations to help you build stronger
                relationships.
              </p>
            </div>
          </div>

          <section className="cmd2-section-card cmd2-ai-summary">
            <div className="cmd2-section-head">
              <h2>
                <Sparkles /> AI Summary
              </h2>
              <em>AI Generated</em>
            </div>
            <div className="cmd2-ai-summary-body">
              <p>
                {selectedContact.aiSummary ||
                  selectedContact.notes ||
                  t("contacts.aiInsightPlaceholder")}
              </p>
              <button onClick={loadAiInsights}>
                View full analysis <ChevronRight />
              </button>
            </div>
          </section>

          <section className="cmd2-section-card cmd2-next-action">
            <div className="cmd2-section-head">
              <h2>
                <Target /> AI Next Best Action
              </h2>
              <em>Recommended</em>
            </div>
            <div className="cmd2-next-action-body">
              <span className="cmd2-next-icon">
                <CalendarDays />
              </span>
              <div>
                <strong>
                  {selectedContact.recommendedAction || "Schedule Follow-up"}
                </strong>
                <p>
                  {selectedContact.followUpRecommended
                    ? "Follow-up is recommended based on this contact’s recent activity."
                    : "Review the latest contact activity and choose the next best step."}
                </p>
              </div>
              <button onClick={() => navigate("/dashboard/calendar")}>
                Take Action
              </button>
            </div>
          </section>

          <section className="cmd2-section-card cmd2-score-card">
            <div className="cmd2-section-head">
              <h2>
                <Activity /> AI Relationship Score
              </h2>
            </div>
            <div className="cmd2-score-layout">
              <div>
                <div
                  className="cmd2-score-ring"
                  style={{ "--score": `${selectedScore * 3.6}deg` }}
                >
                  <strong>{selectedScore}</strong>
                </div>
                <span>
                  {selectedScore >= 80
                    ? "Excellent"
                    : selectedScore >= 60
                      ? "Strong"
                      : selectedScore >= 40
                        ? "Developing"
                        : "Needs Attention"}
                </span>
              </div>

              <div className="cmd2-score-bars">
                {[
                  ["Engagement", Math.min(100, selectedScore + 3)],
                  ["Recency", Math.max(0, selectedScore - 4)],
                  ["Relationship Strength", Math.min(100, selectedScore + 1)],
                ].map(([label, value]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <i>
                      <b style={{ width: `${value}%` }} />
                    </i>
                    <strong>{value}%</strong>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="cmd2-section-card">
            <div className="cmd2-section-head">
              <h2>
                <MessageSquare /> AI Conversation Highlights
              </h2>
              <button>View All</button>
            </div>
            <div className="cmd2-highlights">
              {(contactMessages.length
                ? contactMessages.slice(0, 3)
                : activities.slice(0, 3)
              ).map((item, index) => (
                <div key={item.id || index}>
                  <span>•</span>
                  <strong>
                    {item.message ||
                      item.title ||
                      item.sub ||
                      "Contact activity"}
                  </strong>
                  <em>{mobileRelativeTime(item.createdAt || item.timestamp)}</em>
                </div>
              ))}
              {!contactMessages.length && !activities.length && (
                <div>
                  <span>•</span>
                  <strong>{t("contacts.noActivity")}</strong>
                </div>
              )}
            </div>
          </section>

          <div className="cmd2-major-title cmd2-major-title-activity">
            <Activity />
            <div>
              <h2>{selectedContact.name}</h2>
              <p>Activity, deals, tasks, and files</p>
            </div>
          </div>

          <nav className="cmd2-detail-tabs" aria-label="Contact detail sections">
            <button
              type="button"
              className={mobileDetailSection === "activity" ? "active activity" : "activity"}
              aria-current={mobileDetailSection === "activity" ? "page" : undefined}
              onClick={() =>
                scrollToMobileDetailSection(
                  "activity",
                  "cmd2-recent-activity",
                )
              }
            >
              <Activity />
              <span>Activity</span>
            </button>

            <button
              type="button"
              className={mobileDetailSection === "deals" ? "active deals" : "deals"}
              aria-current={mobileDetailSection === "deals" ? "page" : undefined}
              onClick={() =>
                scrollToMobileDetailSection(
                  "deals",
                  "cmd2-deals",
                )
              }
            >
              <CalendarDays />
              <span>Deals</span>
            </button>

            <button
              type="button"
              className={mobileDetailSection === "tasks" ? "active tasks" : "tasks"}
              aria-current={mobileDetailSection === "tasks" ? "page" : undefined}
              onClick={() =>
                scrollToMobileDetailSection(
                  "tasks",
                  "cmd2-upcoming-tasks",
                )
              }
            >
              <CheckSquare />
              <span>Tasks</span>
            </button>

            <button
              type="button"
              className={mobileDetailSection === "files" ? "active files" : "files"}
              aria-current={mobileDetailSection === "files" ? "page" : undefined}
              onClick={() =>
                scrollToMobileDetailSection(
                  "files",
                  "cmd2-files-documents",
                )
              }
            >
              <Folder />
              <span>Files</span>
            </button>
          </nav>

          <section
            id="cmd2-recent-activity"
            className="cmd2-activity-section cmd2-scroll-target"
          >
            <div className="cmd2-activity-heading">
              <h2>Recent Activity</h2>
              <button
                type="button"
                onClick={() =>
                  scrollToMobileDetailSection(
                    "activity",
                    "cmd2-recent-activity",
                  )
                }
              >
                View All <ChevronRight />
              </button>
            </div>

            <div className="cmd2-activity-list">
              {activitiesLoading ? (
                <div className="cmd2-empty">
                  {t("contacts.loadingActivities")}
                </div>
              ) : activities.length ? (
                activities.slice(0, 6).map((activity) => {
                  const ActivityIcon = mobileActivityIcon(activity);
                  return (
                    <button
                      type="button"
                      key={activity.id}
                      className="cmd2-activity-row"
                    >
                      <span className="cmd2-activity-icon">
                        <ActivityIcon />
                      </span>
                      <div>
                        <strong>{activity.title || activity.type}</strong>
                        <small>{activity.sub || "Contact activity"}</small>
                      </div>
                      <time>{mobileRelativeTime(activity.createdAt)}</time>
                      <ChevronRight />
                    </button>
                  );
                })
              ) : (
                <div className="cmd2-empty">{t("contacts.noActivity")}</div>
              )}
            </div>
          </section>

          <section
            id="cmd2-deals"
            className="cmd2-activity-section cmd2-scroll-target"
          >
            <div className="cmd2-activity-heading">
              <h2>Deals</h2>
              {selectedContact.linkedLeadId ? (
                <button
                  type="button"
                  onClick={() => openLinkedLead(selectedContact)}
                >
                  View Deal <ChevronRight />
                </button>
              ) : null}
            </div>

            {selectedContact.linkedLeadId ? (
              <button
                type="button"
                className="cmd2-deal-row"
                onClick={() => openLinkedLead(selectedContact)}
              >
                <span className="cmd2-deal-icon">
                  <Handshake />
                </span>
                <div>
                  <strong>
                    {selectedContact.linkedLeadName ||
                      selectedContact.linkedLead ||
                      "Linked Opportunity"}
                  </strong>
                  <small>
                    Open the linked lead / deal in the existing pipeline flow.
                  </small>
                </div>
                <ChevronRight />
              </button>
            ) : (
              <div className="cmd2-empty cmd2-deal-empty">
                No linked deal for this contact yet.
              </div>
            )}
          </section>

          <section
            id="cmd2-upcoming-tasks"
            className="cmd2-activity-section cmd2-scroll-target"
          >
            <div className="cmd2-activity-heading">
              <h2>Upcoming Tasks</h2>
              <button
                type="button"
                onClick={() =>
                  scrollToMobileDetailSection(
                    "tasks",
                    "cmd2-upcoming-tasks",
                  )
                }
              >
                View All
              </button>
            </div>
            <button
              type="button"
              className="cmd2-task-row"
              onClick={() => openNoteModal(selectedContact)}
            >
              <CheckSquare />
              <div>
                <strong>
                  {selectedContact.recommendedAction || "Follow up with contact"}
                </strong>
                <small>Review the next action and latest contact notes.</small>
              </div>
              <em>High</em>
              <ChevronRight />
            </button>
          </section>

          <section
            id="cmd2-files-documents"
            className="cmd2-activity-section cmd2-scroll-target"
          >
            <div className="cmd2-activity-heading">
              <h2>Files & Documents</h2>
              <button
                type="button"
                onClick={() =>
                  scrollToMobileDetailSection(
                    "files",
                    "cmd2-files-documents",
                  )
                }
              >
                View All
              </button>
            </div>
            <button type="button" className="cmd2-file-row">
              <Folder />
              <div>
                <strong>Contact documents</strong>
                <small>Files linked to this contact will appear here.</small>
              </div>
              <Download />
              <ChevronRight />
            </button>
          </section>

          <Modals />
        </section>

        <div className="contacts-desktop-detail-v2">
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
        </div>
      </>
    );
  }


  return (
    <>
      <section className="contacts-mobile-v2">
        <header className="cmv2-header">
          <div className="cmv2-heading">
            <h1>Contacts & Relationships</h1>
            <p>
              Manage every customer, prospect, company, and relationship in one
              AI-powered workspace.
            </p>
          </div>
        </header>

        <div className="cmv2-search-row">
          <label>
            <Search />
            <input
              placeholder={t("contacts.searchPlaceholder")}
              value={search}
              onChange={handleSearch}
            />
          </label>
          <button type="button">
            <SlidersHorizontal />
            <span>Filters</span>
          </button>
        </div>

        <section className="cmv2-command-center">
          <h2>CONTACTS COMMAND CENTER</h2>
          <i />
          <div className="cmv2-kpi-list">
            {mobileCommandStats.map((stat) => {
              const StatIcon = stat.icon;
              return (
                <article key={stat.label} className={`cmv2-kpi-card ${stat.tone}`}>
                  <div className="cmv2-kpi-icon">
                    <StatIcon />
                  </div>
                  <div className="cmv2-kpi-copy">
                    <strong>{stat.label}</strong>
                    <em>{stat.value}</em>
                  </div>
                  <div className="cmv2-kpi-trend">
                    <span>
                    <b>↑ {stat.trend}</b><br />
                    <span>vs last 30 days</span>
                    </span>
                    <svg viewBox="0 0 180 42" preserveAspectRatio="none">
                      <path
                        d={stat.path}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <ChevronRight />
                </article>
              );
            })}
          </div>
        </section>

        <section className="cmv2-actions">
          <button className="purple" onClick={loadAiInsights}>
            <Sparkles />
            <div>
              <strong>AI Insights</strong>
              <span>Get AI-powered contact insights</span>
            </div>
            <ChevronRight />
          </button>

          <button className="orange" onClick={runAiReview}>
            <Bot />
            <div>
              <strong>Run AI Review</strong>
              <span>Review contacts with AI</span>
            </div>
            <ChevronRight />
          </button>

          <button className="green">
            <Download />
            <div>
              <strong>Import</strong>
              <span>Import contacts from CSV</span>
            </div>
            <ChevronRight />
          </button>

          <button className="pink" onClick={() => setShowCreateModal(true)}>
            <UserPlus />
            <div>
              <strong>Add Contact</strong>
              <span>Manually add a new contact</span>
            </div>
            <ChevronRight />
          </button>
        </section>

        <div className="cmv2-list-summary">
          <div>
            <Users />
            <div>
              <strong>{mobileTotalContacts.toLocaleString()} Contacts</strong>
              <span>Showing all contacts</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setMobileSort((current) =>
                current === "activity"
                  ? "score"
                  : current === "score"
                    ? "name"
                    : "activity",
              )
            }
          >
            <ArrowUpDown />
            <div>
              <span>Sort by</span>
              <strong>
                {mobileSort === "score"
                  ? "AI Score"
                  : mobileSort === "name"
                    ? "Name"
                    : "Last Activity"}
              </strong>
            </div>
            <ChevronRight />
          </button>
        </div>

        <div className="cmv2-contact-list">
          {loading ? (
            <div className="cmv2-empty">{t("contacts.loading")}</div>
          ) : mobileSortedContacts.length ? (
            mobileSortedContacts.map((contact, index) => {
              const tone = mobileContactTone(contact, index);
              const score = mobileAiScore(contact);
              const lastContact =
                contact.lastContactAt || contact.updatedAt || contact.createdAt;

              return (
                <article
                  key={contact.id}
                  className={`cmv2-contact-card ${tone}`}
                >
                  <div className="cmv2-contact-top">
                    <div className="cmv2-contact-avatar">
                      {contact.avatar ||
                        contact.name?.charAt(0)?.toUpperCase() ||
                        "?"}
                      <span />
                    </div>

                    <div className="cmv2-contact-main">
                      <h3>{contact.name}</h3>
                      <p>{mobileCompany(contact) || contact.email || "—"}</p>
                      <em>{contact.type || contact.status || "Contact"}</em>
                    </div>

                    <div className="cmv2-contact-action">
                      <small>{mobileRelativeTime(lastContact)}</small>
                      <strong>{contact.recommendedAction || "Follow up"}</strong>
                      <em>{contact.followUpRecommended ? "Today" : "Next"}</em>
                    </div>

                    <div className="cmv2-ai-score">
                      <strong>{score}</strong>
                      <span>AI Score</span>
                    </div>

                    <button
                      type="button"
                      className="cmv2-more"
                      onClick={(event) => {
                        event.stopPropagation();
                        setOpenMenuId(
                          openMenuId === contact.id ? null : contact.id,
                        );
                      }}
                    >
                      <MoreVertical />
                    </button>
                  </div>

                  {openMenuId === contact.id && (
                    <div
                      className="contact-menu cmv2-card-menu"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <button onClick={() => openEditContact(contact)}>
                        <Edit3 size={15} /> {t("contacts.editContactTitle")}
                      </button>
                      <button onClick={() => openAssignAgent(contact)}>
                        <UserCog size={15} /> {t("contacts.assignAgentTitle")}
                      </button>
                      <button onClick={() => openNoteModal(contact)}>
                        <StickyNote size={15} /> {t("contacts.addNoteTitle")}
                      </button>
                      <button onClick={runAiReview}>
                        <Bot size={15} /> {t("contacts.runAiReview")}
                      </button>
                    </div>
                  )}

                  <div className="cmv2-contact-meta">
                    <div>
                      <Target />
                      <span>Source</span>
                      <strong>{contact.source || "—"}</strong>
                    </div>
                    <div>
                      <UserCog />
                      <span>Owner</span>
                      <strong>{mobileOwner(contact)}</strong>
                    </div>
                    <div>
                      <Clock />
                      <span>Last Contact</span>
                      <strong>{mobileRelativeTime(lastContact)}</strong>
                    </div>
                    <div>
                      <CalendarDays />
                      <span>Next Action</span>
                      <strong>{contact.recommendedAction || "Follow up"}</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="cmv2-view-contact"
                    onClick={() => openContactDetail(contact)}
                  >
                    View Contact <ChevronRight />
                  </button>
                </article>
              );
            })
          ) : (
            <div className="cmv2-empty">No contacts found.</div>
          )}
        </div>

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
                      required
                      value={createForm.name}
                      onChange={(event) =>
                        setCreateForm({
                          ...createForm,
                          name: event.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>{t("contacts.labelEmail")}</label>
                    <input
                      type="email"
                      required
                      value={createForm.email}
                      onChange={(event) =>
                        setCreateForm({
                          ...createForm,
                          email: event.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>{t("contacts.labelPhone")}</label>
                    <input
                      value={createForm.phone}
                      onChange={(event) =>
                        setCreateForm({
                          ...createForm,
                          phone: event.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>{t("contacts.labelType")}</label>
                    <select
                      value={createForm.type}
                      onChange={(event) =>
                        setCreateForm({
                          ...createForm,
                          type: event.target.value,
                        })
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
                      onChange={(event) =>
                        setCreateForm({
                          ...createForm,
                          notes: event.target.value,
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
      </section>

      <div className="contacts-desktop-v2">
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
                    icon={<Icon size={24} />}
                    title={stat.label}
                    value={stat.value}
                    sub={stat.sub}
                    trend={stat.trend}
                    series={stat.series}
                    variant={stat.variant}
                  />
                );
              })}
            </div>

            {/* FILTER BAR */}
            <div className="filter-bar contacts-desktop-filter-bar">
              <div className="filter-left">
                <div className="search-box">
                  <Search size={18} />
                  <input
                    placeholder={t("contacts.searchPlaceholder")}
                    value={search}
                    onChange={handleSearch}
                  />
                </div>

                <button
                  type="button"
                  className={`filter-btn ${
                    !Object.values(desktopFilters).some(Boolean) ? "selected" : ""
                  }`}
                  onClick={resetDesktopFilters}
                >
                  {t("contacts.filterAll")}
                </button>

                <label className="filter-select">
                  <select
                    value={desktopFilters.status}
                    onChange={(event) =>
                      updateDesktopFilter("status", event.target.value)
                    }
                  >
                    <option value="">{t("contacts.filterStatus")}</option>
                    {filterOptions.statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <ChevronDown />
                </label>

                <label className="filter-select">
                  <select
                    value={desktopFilters.source}
                    onChange={(event) =>
                      updateDesktopFilter("source", event.target.value)
                    }
                  >
                    <option value="">{t("contacts.filterSource")}</option>
                    {filterOptions.sources.map((source) => (
                      <option key={source} value={source}>
                        {source}
                      </option>
                    ))}
                  </select>
                  <ChevronDown />
                </label>

                <label className="filter-select">
                  <select
                    value={desktopFilters.assignedTo}
                    onChange={(event) =>
                      updateDesktopFilter("assignedTo", event.target.value)
                    }
                  >
                    <option value="">{t("contacts.filterOwner")}</option>
                    {filterOptions.owners.map((owner) => (
                      <option key={owner.id} value={owner.id}>
                        {owner.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown />
                </label>

                <label className="filter-select">
                  <select
                    value={desktopFilters.tag}
                    onChange={(event) =>
                      updateDesktopFilter("tag", event.target.value)
                    }
                  >
                    <option value="">{t("contacts.filterTags")}</option>
                    {filterOptions.tags.map((tag) => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                  <ChevronDown />
                </label>

                <label className="filter-select filter-last-activity">
                  <select
                    value={desktopFilters.lastActivity}
                    onChange={(event) =>
                      updateDesktopFilter("lastActivity", event.target.value)
                    }
                  >
                    <option value="">{t("contacts.filterLastActivity")}</option>
                    <option value="today">{t("common.today")}</option>
                    <option value="7d">{t("contacts.filterLast7Days")}</option>
                    <option value="30d">{t("contacts.last30Days")}</option>
                  </select>
                  <ChevronDown />
                </label>

                <label className="filter-select more-filters">
                  <Filter size={14} />
                  <select
                    value={desktopFilters.type}
                    onChange={(event) =>
                      updateDesktopFilter("type", event.target.value)
                    }
                  >
                    <option value="">{t("contacts.moreFilters")}</option>
                    {filterOptions.types.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <ChevronDown />
                </label>

                <div className="filter-actions">
                  <button
                    className="action-btn insights"
                    onClick={loadAiInsights}
                  >
                    <Sparkles /> {t("contacts.aiInsights")}
                  </button>

                  <button
                    className="action-btn runai"
                    onClick={runAiReview}
                  >
                    <Bot /> {t("contacts.runAiReview")}
                  </button>

                  <button
                    type="button"
                    className="action-btn import"
                    onClick={() => {
                      setImportRows([]);
                      setImportFileName("");
                      setImportResult(null);
                      setImportDuplicateStrategy("skip");
                      setShowImportModal(true);
                    }}
                  >
                    <Download /> {t("contacts.import")}
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

            {/* DESKTOP CONTACTS TABLE + DETAIL DRAWER */}
            <div
              className={`contacts-table-layout ${
                selectedContact ? "has-detail" : ""
              }`}
            >
              <section className="contacts-table-card">
                <div className="contacts-table-summary">
                  {t("contacts.desktopContactCount", {
                    count: desktopTotalContacts,
                  })}
                </div>

                <div className="contacts-table-scroll">
                  <table className="contacts-table">
                    <thead>
                      <tr>
                        <th className="check-column">
                          <span className="contacts-table-checkbox" />
                        </th>
                        <th>
                          {t("contacts.desktopColumnContact")}
                          <ArrowUpDown size={12} />
                        </th>
                        <th>{t("contacts.desktopColumnCompany")}</th>
                        <th>{t("contacts.desktopColumnStatus")}</th>
                        <th>{t("contacts.desktopColumnSource")}</th>
                        <th>{t("contacts.desktopColumnOwner")}</th>
                        <th>{t("contacts.desktopColumnLastContact")}</th>
                        <th>{t("contacts.desktopColumnNextAction")}</th>
                        <th>{t("contacts.desktopColumnAiScore")}</th>
                        <th>{t("contacts.desktopColumnActions")}</th>
                      </tr>
                    </thead>

                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="10" className="contacts-table-empty">
                            {t("contacts.loading")}
                          </td>
                        </tr>
                      ) : desktopVisibleContacts.length ? (
                        desktopVisibleContacts.map((contact) => {
                          const score = mobileAiScore(contact);
                          const lastContact =
                            contact.lastContactAt ||
                            contact.updatedAt ||
                            contact.createdAt;

                          return (
                            <tr
                              key={contact.id}
                              className={
                                selectedContact?.id === contact.id
                                  ? "is-selected"
                                  : ""
                              }
                              onClick={() => openContactDetail(contact)}
                            >
                              <td className="check-column">
                                <span className="contacts-table-checkbox" />
                              </td>

                              <td>
                                <div className="contacts-table-person">
                                  <div className="contacts-table-avatar">
                                    {desktopContactAvatar(contact)}
                                  </div>
                                  <div>
                                    <strong>{contact.name || "—"}</strong>
                                    <span>{contact.email || "—"}</span>
                                    <small>{contact.phone || "—"}</small>
                                  </div>
                                </div>
                              </td>

                              <td>{mobileCompany(contact) || "—"}</td>

                              <td>
                                <span
                                  className={`contacts-table-status ${desktopStatusClass(
                                    contact,
                                  )}`}
                                >
                                  {contact.status || contact.type || "—"}
                                </span>
                              </td>

                              <td>{contact.source || "—"}</td>

                              <td>
                                <div className="contacts-table-owner">
                                  <span>
                                    {mobileOwner(contact)
                                      ?.charAt(0)
                                      ?.toUpperCase() || "?"}
                                  </span>
                                  <strong>{mobileOwner(contact)}</strong>
                                </div>
                              </td>

                              <td>
                                <div className="contacts-table-last">
                                  <MessageSquare />
                                  <span>{mobileRelativeTime(lastContact)}</span>
                                </div>
                              </td>

                              <td>
                                <div className="contacts-table-next">
                                  <strong>
                                    {contact.recommendedAction ||
                                      t("contacts.desktopNoNextAction")}
                                  </strong>
                                  <span>
                                    {contact.followUpRecommended
                                      ? t("contacts.desktopToday")
                                      : "—"}
                                  </span>
                                </div>
                              </td>

                              <td>
                                <span
                                  className={`contacts-table-score ${
                                    score >= 80
                                      ? "high"
                                      : score >= 60
                                        ? "medium"
                                        : "low"
                                  }`}
                                >
                                  {score}
                                </span>
                              </td>

                              <td className="contacts-table-actions-cell">
                                <button
                                  type="button"
                                  className="contacts-table-more"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setOpenMenuId(
                                      openMenuId === contact.id
                                        ? null
                                        : contact.id,
                                    );
                                  }}
                                >
                                  <MoreVertical />
                                </button>

                                {openMenuId === contact.id && (
                                  <div
                                    className="contact-menu contacts-table-menu"
                                    onClick={(event) => event.stopPropagation()}
                                  >
                                    <button
                                      onClick={() => openEditContact(contact)}
                                    >
                                      <Edit3 size={15} />
                                      {t("contacts.editContactTitle")}
                                    </button>

                                    <button
                                      onClick={() => openAssignAgent(contact)}
                                    >
                                      <UserCog size={15} />
                                      {t("contacts.assignAgentTitle")}
                                    </button>

                                    {contact.linkedLeadId && (
                                      <button
                                        onClick={() => openLinkedLead(contact)}
                                      >
                                        <GitFork size={15} />
                                        {t("contacts.openLead")}
                                      </button>
                                    )}

                                    <div className="status-menu-group">
                                      <button>
                                        <StickyNote size={15} />
                                        {t("contacts.changeStatus")}
                                      </button>

                                      <div className="status-submenu">
                                        {["Cold", "Warm", "Hot", "Active"].map(
                                          (status) => (
                                            <button
                                              key={status}
                                              onClick={() =>
                                                changeContactStatus(
                                                  contact.id,
                                                  status,
                                                )
                                              }
                                            >
                                              {status}
                                            </button>
                                          ),
                                        )}
                                      </div>
                                    </div>

                                    <button
                                      className="warning"
                                      onClick={() =>
                                        archiveContact(contact.id)
                                      }
                                    >
                                      <Archive size={15} />
                                      {t("contacts.archiveContact")}
                                    </button>

                                    <button
                                      className="danger"
                                      onClick={() =>
                                        deleteContact(contact.id)
                                      }
                                    >
                                      <Trash2 size={15} />
                                      {t("contacts.deleteContactAction")}
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="10" className="contacts-table-empty">
                            {t("contacts.noContacts")}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <footer className="contacts-table-pagination">
                  <span>
                    {desktopTotalContacts > 0
                      ? t("contacts.desktopShowingRange", {
                          from: desktopStartIndex + 1,
                          to: Math.min(
                            desktopStartIndex + desktopPerPage,
                            desktopTotalContacts,
                          ),
                          total: desktopTotalContacts,
                        })
                      : t("contacts.desktopShowingRange", {
                          from: 0,
                          to: 0,
                          total: 0,
                        })}
                  </span>

                  <div className="contacts-table-pages">
                    <button
                      type="button"
                      disabled={desktopSafePage <= 1}
                      onClick={() =>
                        setDesktopPage((page) => Math.max(1, page - 1))
                      }
                    >
                      <ChevronLeft />
                    </button>

                    {Array.from(
                      { length: Math.min(desktopTotalPages, 5) },
                      (_, index) => {
                        let page = index + 1;
                        if (
                          desktopTotalPages > 5 &&
                          desktopSafePage > 3
                        ) {
                          page = Math.min(
                            desktopTotalPages - 4 + index,
                            desktopSafePage - 2 + index,
                          );
                        }

                        return (
                          <button
                            type="button"
                            key={page}
                            className={
                              page === desktopSafePage ? "active" : ""
                            }
                            onClick={() => setDesktopPage(page)}
                          >
                            {page}
                          </button>
                        );
                      },
                    )}

                    <button
                      type="button"
                      disabled={desktopSafePage >= desktopTotalPages}
                      onClick={() =>
                        setDesktopPage((page) =>
                          Math.min(desktopTotalPages, page + 1),
                        )
                      }
                    >
                      <ChevronRight />
                    </button>
                  </div>

                  <label className="contacts-table-per-page">
                    <select
                      value={desktopPerPage}
                      onChange={(event) => {
                        setDesktopPerPage(Number(event.target.value));
                        setDesktopPage(1);
                      }}
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                    <span>{t("contacts.desktopPerPage")}</span>
                    <ChevronDown />
                  </label>
                </footer>
              </section>

              {selectedContact && (
                <aside className="contacts-detail-drawer">
                  <header className="contacts-detail-drawer-head">
                    <div className="contacts-detail-person">
                      <div className="contacts-detail-avatar">
                        {desktopContactAvatar(selectedContact)}
                      </div>

                      <div>
                        <div className="contacts-detail-name-row">
                          <strong>{selectedContact.name || "—"}</strong>
                          <span
                            className={`contacts-table-status ${desktopStatusClass(
                              selectedContact,
                            )}`}
                          >
                            {selectedContact.status ||
                              selectedContact.type ||
                              "—"}
                          </span>
                        </div>
                        <small>{mobileCompany(selectedContact) || "—"}</small>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="contacts-detail-close"
                      onClick={() => setSelectedContact(null)}
                    >
                      ×
                    </button>
                  </header>

                  <div className="contacts-detail-actions">
                    <button
                      type="button"
                      className="whatsapp"
                      onClick={() => messageContact(selectedContact.id)}
                    >
                      <MessageSquare />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedContact.email) {
                          window.location.href = `mailto:${selectedContact.email}`;
                        }
                      }}
                    >
                      <Mail />
                    </button>
                    <button
                      type="button"
                      onClick={() => callContact(selectedContact.phone)}
                    >
                      <Phone />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setShowDetailMoreMenu((value) => !value)
                      }
                    >
                      <MoreVertical />
                    </button>
                  </div>

                  <nav className="contacts-detail-tabs">
                    {[
                      ["overview", t("contacts.desktopTabOverview")],
                      ["activity", t("contacts.desktopTabActivity")],
                      ["deals", t("contacts.desktopTabDeals")],
                      ["tasks", t("contacts.desktopTabTasks")],
                      ["files", t("contacts.desktopTabFiles")],
                    ].map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        className={
                          desktopDetailTab === key ? "active" : ""
                        }
                        onClick={() => setDesktopDetailTab(key)}
                      >
                        {label}
                      </button>
                    ))}
                  </nav>

                  <div className="contacts-detail-body">
                    {desktopDetailTab === "overview" && (
                      <>
                        <section className="contacts-detail-section">
                          <div className="contacts-detail-section-title">
                            <strong>
                              {t("contacts.desktopContactInformation")}
                            </strong>
                            <button
                              type="button"
                              onClick={() =>
                                openEditContact(selectedContact)
                              }
                            >
                              {t("common.edit")}
                            </button>
                          </div>

                          <div className="contacts-detail-info">
                            <div>
                              <Mail />
                              <span>
                                {selectedContact.email || "—"}
                              </span>
                            </div>
                            <div>
                              <Phone />
                              <span>
                                {selectedContact.phone || "—"}
                              </span>
                            </div>
                            <div>
                              <MapPin />
                              <span>
                                {selectedContact.location || "—"}
                              </span>
                            </div>
                          </div>

                          <div className="contacts-detail-meta">
                            <div>
                              <span>{t("contacts.labelSource")}</span>
                              <strong>
                                {selectedContact.source || "—"}
                              </strong>
                            </div>
                            <div>
                              <span>
                                {t("contacts.desktopColumnOwner")}
                              </span>
                              <strong>
                                {mobileOwner(selectedContact)}
                              </strong>
                            </div>
                          </div>
                        </section>

                        <section className="contacts-detail-section">
                          <div className="contacts-detail-section-title ai">
                            <strong>
                              <Sparkles />
                              {t("contacts.desktopAiSummary")}
                            </strong>
                          </div>
                          <p>
                            {selectedContact.aiSummary ||
                              selectedContact.notes ||
                              t("contacts.noInsights")}
                          </p>
                          <button
                            type="button"
                            className="contacts-detail-outline"
                            onClick={loadAiInsights}
                          >
                            {t("contacts.desktopSeeFullSummary")}
                          </button>
                        </section>

                        <section className="contacts-detail-section">
                          <div className="contacts-detail-section-title ai">
                            <strong>
                              <Target />
                              {t("contacts.desktopNextAction")}
                            </strong>
                          </div>

                          <div className="contacts-detail-next">
                            <div>
                              <strong>
                                {selectedContact.recommendedAction ||
                                  t("contacts.desktopNoNextAction")}
                              </strong>
                              <span>
                                {selectedContact.followUpRecommended
                                  ? t("contacts.desktopToday")
                                  : "—"}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                openNoteModal(selectedContact)
                              }
                            >
                              {t("contacts.desktopMarkComplete")}
                            </button>
                          </div>
                        </section>

                        <button
                          type="button"
                          className="contacts-detail-full"
                          onClick={() => setDesktopDetailTab("activity")}
                        >
                          {t("contacts.desktopViewFullProfile")}
                        </button>
                      </>
                    )}

                    {desktopDetailTab === "activity" && (
                      <section className="contacts-detail-section">
                        <div className="contacts-detail-section-title">
                          <strong>
                            {t("contacts.desktopRecentActivity")}
                          </strong>
                        </div>

                        {activitiesLoading ? (
                          <div className="contacts-detail-empty">
                            {t("contacts.loadingActivities")}
                          </div>
                        ) : activities.length ? (
                          <div className="contacts-detail-activity-list">
                            {activities.slice(0, 10).map((activity) => (
                              <article key={activity.id}>
                                <Activity />
                                <div>
                                  <strong>
                                    {activity.title ||
                                      activity.type ||
                                      "—"}
                                  </strong>
                                  <span>{activity.sub || "—"}</span>
                                </div>
                                <small>
                                  {formatActivityDate(
                                    activity.createdAt,
                                  )}
                                </small>
                              </article>
                            ))}
                          </div>
                        ) : (
                          <div className="contacts-detail-empty">
                            {t("contacts.noActivity")}
                          </div>
                        )}
                      </section>
                    )}

                    {desktopDetailTab === "deals" && (
                      <section className="contacts-detail-section">
                        <div className="contacts-detail-section-title">
                          <strong>{t("contacts.desktopTabDeals")}</strong>
                        </div>

                        {selectedContact.linkedLeadId ? (
                          <button
                            type="button"
                            className="contacts-detail-linked"
                            onClick={() =>
                              openLinkedLead(selectedContact)
                            }
                          >
                            <Handshake />
                            <div>
                              <strong>
                                {selectedContact.linkedLeadName ||
                                  selectedContact.linkedLead ||
                                  t(
                                    "contacts.desktopLinkedOpportunity",
                                  )}
                              </strong>
                              <span>{t("contacts.openLead")}</span>
                            </div>
                            <ChevronRight />
                          </button>
                        ) : (
                          <div className="contacts-detail-empty">
                            {t("contacts.desktopNoLinkedDeal")}
                          </div>
                        )}
                      </section>
                    )}

                    {desktopDetailTab === "tasks" && (
                      <section className="contacts-detail-section">
                        <div className="contacts-detail-section-title">
                          <strong>{t("contacts.desktopTabTasks")}</strong>
                        </div>

                        {selectedContact.recommendedAction ? (
                          <button
                            type="button"
                            className="contacts-detail-linked task"
                            onClick={() =>
                              openNoteModal(selectedContact)
                            }
                          >
                            <CheckSquare />
                            <div>
                              <strong>
                                {selectedContact.recommendedAction}
                              </strong>
                              <span>
                                {selectedContact.followUpRecommended
                                  ? t("contacts.desktopToday")
                                  : t("contacts.desktopReviewNextAction")}
                              </span>
                            </div>
                            <ChevronRight />
                          </button>
                        ) : (
                          <div className="contacts-detail-empty">
                            {t("contacts.desktopNoTaskData")}
                          </div>
                        )}
                      </section>
                    )}

                    {desktopDetailTab === "files" && (
                      <section className="contacts-detail-section">
                        <div className="contacts-detail-section-title">
                          <strong>{t("contacts.desktopTabFiles")}</strong>
                        </div>
                        <div className="contacts-detail-empty">
                          {t("contacts.desktopNoFileData")}
                        </div>
                      </section>
                    )}
                  </div>

                  {showDetailMoreMenu && (
                    <div className="contact-menu contacts-detail-menu">
                      <button
                        onClick={() => {
                          setShowDetailMoreMenu(false);
                          openEditContact(selectedContact);
                        }}
                      >
                        <Edit3 size={15} />
                        {t("contacts.editContactTitle")}
                      </button>
                      <button
                        onClick={() => {
                          setShowDetailMoreMenu(false);
                          openAssignAgent(selectedContact);
                        }}
                      >
                        <UserCog size={15} />
                        {t("contacts.assignAgentTitle")}
                      </button>
                      <button
                        onClick={() => {
                          setShowDetailMoreMenu(false);
                          openNoteModal(selectedContact);
                        }}
                      >
                        <StickyNote size={15} />
                        {t("contacts.addNoteTitle")}
                      </button>
                    </div>
                  )}
                </aside>
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

          {showImportModal && (
            <div className="modal-overlay contacts-import-overlay">
              <div
                className="modal-content contacts-import-modal"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="contacts-import-head">
                  <div>
                    <h3>{t("contacts.importContactsTitle")}</h3>
                    <p>{t("contacts.importContactsSubtitle")}</p>
                  </div>

                  <button
                    type="button"
                    className="contacts-import-close"
                    onClick={() => setShowImportModal(false)}
                  >
                    ×
                  </button>
                </div>

                <div className="contacts-import-upload">
                  <Download />
                  <div>
                    <strong>
                      {importFileName || t("contacts.importChooseCsv")}
                    </strong>
                    <span>{t("contacts.importSupportedColumns")}</span>
                  </div>

                  <label>
                    {t("contacts.importBrowse")}
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleImportFile}
                    />
                  </label>
                </div>

                <div className="contacts-import-options">
                  <label>
                    <span>{t("contacts.importDuplicateHandling")}</span>
                    <select
                      value={importDuplicateStrategy}
                      onChange={(event) =>
                        setImportDuplicateStrategy(event.target.value)
                      }
                    >
                      <option value="skip">
                        {t("contacts.importSkipDuplicates")}
                      </option>
                      <option value="update">
                        {t("contacts.importUpdateDuplicates")}
                      </option>
                    </select>
                  </label>

                  <div className="contacts-import-count">
                    <strong>{importRows.length}</strong>
                    <span>{t("contacts.importRowsReady")}</span>
                  </div>
                </div>

                {importRows.length > 0 && (
                  <div className="contacts-import-preview">
                    <div className="contacts-import-preview-title">
                      <strong>{t("contacts.importPreview")}</strong>
                      <span>{t("contacts.importPreviewHint")}</span>
                    </div>

                    <div className="contacts-import-preview-scroll">
                      <table>
                        <thead>
                          <tr>
                            {Object.keys(importRows[0])
                              .filter((key) => key !== "__rowNumber")
                              .slice(0, 6)
                              .map((key) => (
                                <th key={key}>{key}</th>
                              ))}
                          </tr>
                        </thead>
                        <tbody>
                          {importRows.slice(0, 5).map((row) => (
                            <tr key={row.__rowNumber}>
                              {Object.keys(importRows[0])
                                .filter((key) => key !== "__rowNumber")
                                .slice(0, 6)
                                .map((key) => (
                                  <td key={key}>{row[key] || "—"}</td>
                                ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {importResult && (
                  <div className="contacts-import-result">
                    <div>
                      <strong>{importResult.imported}</strong>
                      <span>{t("contacts.importImported")}</span>
                    </div>
                    <div>
                      <strong>{importResult.updated}</strong>
                      <span>{t("contacts.importUpdated")}</span>
                    </div>
                    <div>
                      <strong>{importResult.skipped}</strong>
                      <span>{t("contacts.importSkipped")}</span>
                    </div>
                    <div>
                      <strong>{importResult.failed}</strong>
                      <span>{t("contacts.importFailedRows")}</span>
                    </div>
                  </div>
                )}

                {importResult?.errors?.length > 0 && (
                  <div className="contacts-import-errors">
                    {importResult.errors.slice(0, 8).map((item) => (
                      <div key={`${item.rowNumber}-${item.message}`}>
                        <strong>
                          {t("contacts.importRow", {
                            row: item.rowNumber,
                          })}
                        </strong>
                        <span>{item.message}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="contacts-import-actions">
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => setShowImportModal(false)}
                    disabled={importLoading}
                  >
                    {t("common.cancel")}
                  </button>

                  <button
                    type="button"
                    className="primary-btn"
                    onClick={runContactsImport}
                    disabled={!importRows.length || importLoading}
                  >
                    {importLoading
                      ? t("contacts.importing")
                      : t("contacts.importContactsAction")}
                  </button>
                </div>
              </div>
            </div>
          )}

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
      </div>
    </>
  );
}

function KPIBox({ icon, title, value, sub, trend, series = [], variant }) {
  const { t } = useTranslation();

  const buildSparklinePath = (values = []) => {
    const clean = (Array.isArray(values) ? values : [])
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value));

    if (!clean.length) return "M0 24 L180 24";

    const min = Math.min(...clean);
    const max = Math.max(...clean);
    const range = Math.max(1, max - min);
    const width = 180;
    const height = 34;
    const top = 4;

    if (clean.length === 1) {
      const y = top + height / 2;
      return `M0 ${y} L180 ${y}`;
    }

    return clean
      .map((number, index) => {
        const x = (index / (clean.length - 1)) * width;
        const y = top + height - ((number - min) / range) * height;
        return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");
  };

  const trendNumber = Number(String(trend || "0").replace("%", ""));
  const trendClass =
    trendNumber > 0 ? "positive" : trendNumber < 0 ? "negative" : "neutral";

  return (
    <div className={`kpi-box ${variant}`}>
      <div className="kpi-top">
        <div className="kpi-left">
          <div className="kpi-icon">{icon}</div>

          <div className="kpi-content">
            <div className="kpi-title">{title}</div>

            <div className="kpi-value-row">
              <div className="kpi-value">{value}</div>
              <div className={`kpi-trend ${trendClass}`}>
                {trendNumber > 0 ? "↑ " : trendNumber < 0 ? "↓ " : ""}
                {trend || "0%"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="kpi-chart_wrap">
        <div className="kpi-chart">
          <svg viewBox="0 0 180 42" preserveAspectRatio="none">
            <path
              d={buildSparklinePath(series)}
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="kpi-bottom">
          <span>{t("contacts.vsLast30Days")}</span>
        </div>
      </div>
    </div>
  );
}
