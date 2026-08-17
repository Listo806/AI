import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { io } from "socket.io-client";
import apiClient from "../../api/apiClient";
import "./leads.css";
import EmojiPicker from "emoji-picker-react";
import {
  Search,
  SlidersHorizontal,
  Download,
  ChevronDown,
  ChevronRight,
  Plus,
  Calendar,
  MessageCircle,
  Phone,
  Video,
  MoreVertical,
  MoreHorizontal,
  Sparkles,
  Send,
  Users,
  Bot,
  Clock3,
  TrendingUp,
  Flame,
  ArrowRight,
  ArrowLeft,
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
  Check,
  CircleAlert,
  Target,
  DollarSign,
  Flag,
  Ghost,
  WandSparkles,
  Workflow,
  Mail,
  Eye,
  Inbox,
  CircleDot,
  MapPin,
  Zap,
  FileText,
} from "lucide-react";
const getStoredAuthToken = () => {
  const tokenKeys = [
    "token",
    "accessToken",
    "access_token",
    "authToken",
    "jwt",
  ];

  for (const key of tokenKeys) {
    const localValue = localStorage.getItem(key);

    if (localValue) {
      return localValue;
    }

    const sessionValue = sessionStorage.getItem(key);

    if (sessionValue) {
      return sessionValue;
    }
  }

  const objectKeys = ["auth", "user", "authData"];

  for (const key of objectKeys) {
    try {
      const rawValue = localStorage.getItem(key) || sessionStorage.getItem(key);

      if (!rawValue) {
        continue;
      }

      const parsedValue = JSON.parse(rawValue);

      const token =
        parsedValue?.token ||
        parsedValue?.accessToken ||
        parsedValue?.access_token ||
        null;

      if (token) {
        return token;
      }
    } catch {
      // cancel storage value not JSON.
    }
  }

  return null;
};

const getWhatsAppSocketBaseUrl = () => {
  const configuredUrl =
    import.meta.env.VITE_SOCKET_URL ||
    import.meta.env.VITE_BACKEND_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL;

  if (configuredUrl) {
    return String(configuredUrl)
      .replace(/\/api\/?$/, "")
      .replace(/\/$/, "");
  }

  return window.location.origin;
};

const normalizeWhatsAppPhone = (value) => {
  return String(value || "").replace(/\D/g, "");
};

const normalizeRealtimeMessage = (payload) => {
  const createdAt =
    payload?.createdAt || payload?.sentAt || new Date().toISOString();

  return {
    id:
      payload?.databaseMessageId ||
      payload?.id ||
      payload?.messageId ||
      `realtime-${Date.now()}-${Math.random()}`,

    conversation_id:
      payload?.conversationId || payload?.conversation_id || null,

    direction: payload?.direction || "inbound",

    sender_type:
      payload?.senderType ||
      payload?.sender_type ||
      (payload?.direction === "outbound" ? "agent" : "lead"),

    message_type: payload?.messageType || payload?.message_type || "text",

    body: payload?.body ?? payload?.message ?? payload?.text ?? null,

    message_id: payload?.messageId || payload?.message_id || null,

    status:
      payload?.status || (payload?.direction === "outbound" ? "sent" : null),

    sent_at: payload?.sentAt || payload?.sent_at || null,

    delivered_at: payload?.deliveredAt || payload?.delivered_at || null,

    read_at: payload?.readAt || payload?.read_at || null,

    failed_at: payload?.failedAt || payload?.failed_at || null,

    contact_phone: payload?.contactPhone || payload?.contact_phone || null,

    created_at: createdAt,
  };
};
export default function LeadsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [leadsData, setLeadsData] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [convertingLead, setConvertingLead] = useState(false);
  const [leadActionMessage, setLeadActionMessage] = useState("");
  const [showScoreModal, setShowScoreModal] = useState(false);

  const [leadEvents, setLeadEvents] = useState([]);
  const [leadEventsLoading, setLeadEventsLoading] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);

  const [fullLeadEvents, setFullLeadEvents] = useState([]);
  const [fullTimelinePage, setFullTimelinePage] = useState(1);
  const [fullTimelineHasMore, setFullTimelineHasMore] = useState(false);
  const [fullTimelineLoading, setFullTimelineLoading] = useState(false);

  const [showSendPropertiesModal, setShowSendPropertiesModal] = useState(false);
  const [propertiesNote, setPropertiesNote] = useState("");
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpMessage, setFollowUpMessage] = useState("");
  const [isSubmittingFollowUp, setIsSubmittingFollowUp] = useState(false);
  const [showLeadProfileModal, setShowLeadProfileModal] = useState(false);

  const [chatMessage, setChatMessage] = useState("");
  const [leadMessages, setLeadMessages] = useState([]);
  const [leadMessagesLoading, setLeadMessagesLoading] = useState(false);
  const [conversationIntelligence, setConversationIntelligence] =
    useState(null);
  const [conversationIntelligenceLoading, setConversationIntelligenceLoading] =
    useState(false);

  const [showBookShowingModal, setShowBookShowingModal] = useState(false);
  const [showAutomationModal, setShowAutomationModal] = useState(false);
  const [leadStats, setLeadStats] = useState(null);
  const [leadDashboard, setLeadDashboard] = useState(null);
  const [queueFilter, setQueueFilter] = useState(null);
  const [leadSearch, setLeadSearch] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [aiView, setAiView] = useState(false);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadingChatFile, setUploadingChatFile] = useState(false);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordTimerRef = useRef(null);
  const recordingCancelledRef = useRef(false);
  const chatBodyRef = useRef(null);
  const leadChatSocketRef = useRef(null);
  const selectedLeadRef = useRef(null);
  const [sendingLeadMessage, setSendingLeadMessage] = useState(false);
  const [leadFilters, setLeadFilters] = useState({
    source: "all",
    temperature: "all",
    aiScore: "all",
    stage: "all",
    agent: "all",
  });
  const [teamMembers, setTeamMembers] = useState([]);
  const [showingForm, setShowingForm] = useState({
    date: "",
    time: "",
    note: "",
  });
  const [showCreateLeadModal, setShowCreateLeadModal] = useState(false);
  const [createLeadForm, setCreateLeadForm] = useState({
    name: "",
    email: "",
    phone: "",
    source: "",
    status: "new",
    priority: "low",
    notes: "",
  });
  const [leadProfileForm, setLeadProfileForm] = useState({
    status: "new",
    priority: "low",
    notes: "",
  });

  const [leadPage, setLeadPage] = useState(1);
  const [leadHasMore, setLeadHasMore] = useState(false);
  const [leadLoadingMore, setLeadLoadingMore] = useState(false);

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
  useEffect(() => {
    selectedLeadRef.current = selectedLead;
  }, [selectedLead]);
  const applyPriorityQueue = () => {
    setQueueFilter("urgent");
    setAiView(false);
  };
  const [showFilters, setShowFilters] = useState(false);
  const [showMobileMore, setShowMobileMore] = useState(false);
  const [mobileLeadScreen, setMobileLeadScreen] = useState("insights");
  const [mobileHandlingMode, setMobileHandlingMode] = useState("ai");
  const [mobileInboxFilter, setMobileInboxFilter] = useState("all");
  const [mobileConversationTab, setMobileConversationTab] = useState("conversation");
  const stats = [
    {
      title: t("leads.statTotalLeads"),
      value: leadStats?.total || 0,
      change: leadStats?.rangeLabel || t("leads.allTime"),
      icon: <Users size={20} />,
      className: "blue",
    },
    {
      title: t("leads.statAiQualified"),
      value: leadStats?.qualified || 0,
      change: t("leads.percentQualified", {
        rate: leadStats?.qualifiedRate || 0,
      }),
      icon: <Bot size={20} />,
      className: "green",
    },
    {
      title: t("leads.statActiveConversations"),
      value: leadStats?.activeConversations || 0,
      change: t("leads.plusToday", { count: leadStats?.conversationToday || 0 }),
      icon: <MessageCircle size={20} />,
      className: "purple",
    },
    {
      title: t("leads.statAppointments"),
      value: leadStats?.appointments || 0,
      change: t("leads.plusThisWeek", {
        count: leadStats?.appointmentThisWeek || 0,
      }),
      icon: <Calendar size={20} />,
      className: "orange",
    },
    {
      title: t("leads.statConversionRate"),
      value: `${leadStats?.conversionRate || 0}%`,
      change: t("leads.closedWonTotal"),
      icon: <TrendingUp size={20} />,
      className: "cyan",
    },
    {
      title: t("leads.statAvgResponse"),
      value: leadStats?.avgResponse || "0m",
      change: `-${leadStats?.responseImprove || 0}%`,
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
    if (!lead) return 0;

    if (lead.aiScore !== undefined && lead.aiScore !== null) {
      return Number(lead.aiScore);
    }

    if (lead.score !== undefined && lead.score !== null) {
      return Number(lead.score);
    }

    let score = 20;

    if (lead.priority === "high") score += 35;
    if (lead.priority === "medium") score += 20;

    if (lead.status === "qualified") score += 25;
    if (lead.status === "follow-up") score += 15;
    if (lead.status === "closed-won") score = 100;
    if (lead.status === "closed-lost") score = 0;

    if (lead.phone) score += 5;
    if (lead.email) score += 5;
    if (lead.dealValue) score += 10;

    return Math.max(0, Math.min(100, score));
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

  const getMobileLeadStatusClass = (status) => {
    const value = String(status || "new").toLowerCase();

    if (["qualified", "contacted", "active", "won", "closed-won"].includes(value)) {
      return "green";
    }

    if (["follow-up", "follow_up", "followup"].includes(value)) {
      return "purple";
    }

    if (["nurturing", "new", "discovery"].includes(value)) {
      return "blue";
    }

    if (["past_due", "lost", "closed-lost"].includes(value)) {
      return "red";
    }

    return "blue";
  };

  // Localize temperature labels for display only. The raw Hot/Warm/Cool values
  // stay English because filters and score classes compare them in logic.
  const translateTemperature = (temp) => {
    const key = String(temp || "").toLowerCase();
    if (key === "hot") return t("leads.tempHot");
    if (key === "warm") return t("leads.tempWarm");
    if (key === "cool" || key === "cold") return t("leads.tempCool");
    return temp;
  };

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

  const formatTimeAgo = (value) => {
    if (!value) return "";

    const diffMs = Date.now() - new Date(value).getTime();
    const minutes = Math.max(0, Math.floor(diffMs / 60000));

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getMobileInboxActivity = (lead) => {
    const when = lead?.updatedAt || lead?.updated_at || lead?.createdAt || lead?.created_at;
    const ago = formatTimeAgo(when);

    const status = String(lead?.status || "").toLowerCase();

    if (status === "contacted") {
      return { type: "message", text: `Replied ${ago || ""}`.trim() };
    }

    if (status === "follow-up" || status === "follow_up") {
      return { type: "clock", text: `Needs follow-up ${ago || ""}`.trim() };
    }

    if (status === "qualified") {
      return { type: "sparkles", text: `Qualified ${ago || ""}`.trim() };
    }

    if (lead?.phone) {
      return { type: "message", text: `Updated ${ago || ""}`.trim() };
    }

    if (lead?.email) {
      return { type: "mail", text: `Updated ${ago || ""}`.trim() };
    }

    return { type: "clock", text: ago ? `Updated ${ago}` : "Lead updated" };
  };

  const getMobileInboxSecondary = (lead) =>
    lead?.company ||
    lead?.companyName ||
    lead?.organization ||
    lead?.source ||
    lead?.email ||
    t("leads.noContactInfo");

  const renderMobileInboxActivityIcon = (type) => {
    if (type === "message") return <MessageCircle size={15} />;
    if (type === "mail") return <Mail size={15} />;
    if (type === "sparkles") return <Sparkles size={15} />;
    return <Clock3 size={15} />;
  };

  const fetchLeadEvents = async (leadId) => {
    try {
      setLeadEventsLoading(true);

      const response = await apiClient.request(
        `/leads/${leadId}/events?limit=5&page=1`,
        { method: "GET" },
      );

      const data = response?.data || response || {};
      setLeadEvents(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      console.error("Fetch lead events error:", err);
      setLeadEvents([]);
    } finally {
      setLeadEventsLoading(false);
    }
  };

  const selectLead = (lead) => {
    setSelectedLead(lead);
    setLeadActionMessage("");
    setConversationIntelligence(null);

    if (isMobile) {
      setMobileLeadScreen("conversation");
    }

    fetchLeadEvents(lead.id);
    fetchLeadMessages(lead.id);

    if (lead.phone) {
      fetchConversationIntelligence(lead.phone);
    }
  };

  const fetchLeadById = async (leadId) => {
    if (!leadId) return null;
    try {
      const response = await apiClient.request(`/leads/${leadId}`, {
        method: "GET",
      });
      return response?.data || response || null;
    } catch (err) {
      console.error("Fetch lead by ID error:", err);
      return null;
    }
  };

  const convertSelectedLeadToContact = async () => {
    if (!selectedLead?.id || convertingLead) return;

    const confirmed = window.confirm(
      t("leads.confirmConvertContact", {
        name: selectedLead.name || t("leads.thisLead"),
      }),
    );

    if (!confirmed) return;

    try {
      setConvertingLead(true);
      setLeadActionMessage("");

      const response = await apiClient.request(
        `/leads/${selectedLead.id}/convert-to-contact`,
        {
          method: "POST",
        },
      );

      const data = response?.data || response || {};
      const contact = data?.contact || null;
      const contactId = contact?.id || selectedLead.contactId || null;

      const normalizedLead = {
        ...selectedLead,
        contactId,
      };

      setSelectedLead(normalizedLead);

      setLeadsData((prev) =>
        prev.map((lead) =>
          lead.id === selectedLead.id
            ? {
                ...lead,
                contactId,
              }
            : lead,
        ),
      );

      setLeadActionMessage(
        data?.alreadyConverted
          ? t("leads.alreadyLinkedContact")
          : t("leads.leadConverted"),
      );

      await fetchLeadEvents(selectedLead.id);
    } catch (err) {
      console.error("Convert lead to contact error:", err);

      setLeadActionMessage(
        err?.message || t("leads.convertFailed"),
      );
    } finally {
      setConvertingLead(false);
    }
  };

  const openSelectedLeadContact = () => {
    if (!selectedLead?.contactId) return;
    navigate(`/dashboard/contacts?contactId=${selectedLead.contactId}`);
  };

  const handleLeadContactAction = () => {
    if (!selectedLead?.id) return;
    if (selectedLead.contactId) {
      openSelectedLeadContact();
      return;
    }
    convertSelectedLeadToContact();
  };

  // Shared guard: every lead action operates on the selected lead. When none is
  // selected we surface a clear message instead of silently doing nothing.
  const requireSelectedLead = () => {
    if (!selectedLead?.id) {
      setLeadActionMessage(t("leads.selectLeadFirst"));
      return false;
    }
    return true;
  };

  const escalateSelectedLead = async () => {
    if (!requireSelectedLead()) return;

    await updateSelectedLead({
      priority: "high",
      status: "qualified",
    });
    setLeadActionMessage(t("leads.leadEscalated"));
  };

  // Call: open the device dialer where available and log the call to the lead
  // timeline. (A full integrated dialer would replace the tel: link later.)
  const callSelectedLead = async () => {
    if (!requireSelectedLead()) return;

    const phone = selectedLead.phone || selectedLead.contact_phone || "";
    if (phone) {
      window.open(`tel:${phone}`, "_self");
    }

    try {
      setLeadActionMessage("");
      await apiClient.request(`/leads/${selectedLead.id}/events`, {
        method: "POST",
        body: JSON.stringify({
          eventType: "lead.call_logged",
          metadata: {
            title: "Call logged",
            sub: phone ? `Called ${phone}` : "Manual call",
            phone: phone || null,
          },
        }),
      });
      setLeadActionMessage(
        phone
          ? t("leads.callStartedLogged", { phone })
          : t("leads.callLoggedToast"),
      );
      await fetchLeadEvents(selectedLead.id);
    } catch (err) {
      console.error("Log call error:", err);
      setLeadActionMessage(err?.message || t("leads.callLogFailed"));
    }
  };

  // No Lead: mark the conversation as not a lead (closed-lost) after confirming;
  // this drops it out of the active priority queue.
  const markSelectedLeadNoLead = async () => {
    if (!requireSelectedLead()) return;

    const confirmed = window.confirm(
      t("leads.confirmMarkNoLead", {
        name: selectedLead.name || t("leads.thisLead"),
      }),
    );
    if (!confirmed) return;

    await updateSelectedLead({ status: "closed-lost", priority: "low" });
    setLeadActionMessage(t("leads.markedNoLead"));
  };

  const openScoreDetails = () => {
    if (!requireSelectedLead()) return;
    setShowScoreModal(true);
  };

  const fetchFullLeadEvents = async (page = 1, append = false) => {
    if (!selectedLead?.id) return;

    try {
      setFullTimelineLoading(true);

      const response = await apiClient.request(
        `/leads/${selectedLead.id}/events?limit=20&page=${page}`,
        { method: "GET" },
      );

      const data = response?.data || response || {};
      const items = Array.isArray(data.items) ? data.items : [];

      setFullLeadEvents((prev) => (append ? [...prev, ...items] : items));
      setFullTimelinePage(data.page || page);
      setFullTimelineHasMore(Boolean(data.hasMore));
    } catch (err) {
      console.error("Fetch full timeline error:", err);
    } finally {
      setFullTimelineLoading(false);
    }
  };

  const openFullTimeline = () => {
    setShowTimelineModal(true);
    setFullTimelinePage(1);
    fetchFullLeadEvents(1, false);
  };

  const loadMoreFullTimeline = () => {
    if (fullTimelineLoading || !fullTimelineHasMore) return;
    fetchFullLeadEvents(fullTimelinePage + 1, true);
  };

  const openBookShowing = () => {
    if (!requireSelectedLead()) return;

    setShowingForm({
      date: "",
      time: "",
      note: "",
    });

    setShowBookShowingModal(true);
  };

  const submitBookShowing = async (e) => {
    e.preventDefault();

    if (!selectedLead?.id) return;

    if (!showingForm.date || !showingForm.time) {
      return;
    }

    try {
      await apiClient.request(`/leads/${selectedLead.id}/events`, {
        method: "POST",
        body: JSON.stringify({
          eventType: "lead.showing_booked",
          metadata: {
            title: "Showing booked",
            sub: `${showingForm.date} at ${showingForm.time}`,
            date: showingForm.date,
            time: showingForm.time,
            note: showingForm.note,
          },
        }),
      });

      setShowBookShowingModal(false);
      setShowingForm({
        date: "",
        time: "",
        note: "",
      });

      fetchLeadEvents(selectedLead.id);
      fetchFullLeadEvents(1, false);
    } catch (err) {
      console.error("Book showing error:", err);
    }
  };

  const openSendProperties = () => {
    if (!requireSelectedLead()) return;
    setPropertiesNote("");
    setShowSendPropertiesModal(true);
  };

  const submitSendProperties = async (e) => {
    e.preventDefault();

    if (!selectedLead?.id) return;

    try {
      await apiClient.request(`/leads/${selectedLead.id}/events`, {
        method: "POST",
        body: JSON.stringify({
          eventType: "lead.properties_sent",
          metadata: {
            title: "Properties sent",
            sub: propertiesNote || "Matching properties sent to lead",
            note: propertiesNote,
          },
        }),
      });

      setShowSendPropertiesModal(false);
      setPropertiesNote("");
      fetchLeadEvents(selectedLead.id);
      fetchFullLeadEvents(1, false);
    } catch (err) {
      console.error("Send properties error:", err);
    }
  };

  const openAiFollowUp = () => {
    if (!requireSelectedLead()) return;

    const firstAiReply = Array.isArray(
      conversationIntelligence?.suggestedReplies,
    )
      ? conversationIntelligence.suggestedReplies.find(
          (reply) => typeof reply === "string" && reply.trim(),
        )
      : null;

    const fallbackMessage = t("leads.followUpFallback", {
      name: selectedLead.name || t("leads.there"),
    });

    setFollowUpMessage(firstAiReply?.trim() || fallbackMessage);
    setShowFollowUpModal(true);
  };

  const submitAiFollowUp = async (e) => {
    e.preventDefault();

    const message = String(followUpMessage || "").trim();

    if (!selectedLead?.id || !message || isSubmittingFollowUp) return;

    try {
      setIsSubmittingFollowUp(true);

      await apiClient.request(`/whatsapp-qr/leads/${selectedLead.id}/send`, {
        method: "POST",
        body: JSON.stringify({ message }),
      });

      setShowFollowUpModal(false);
      setFollowUpMessage("");

      await Promise.all([
        fetchLeadMessages(selectedLead.id),
        fetchConversationIntelligence(selectedLead.phone),
      ]);

      if (showTimelineModal) {
        await fetchFullLeadEvents(1, false);
      }
    } catch (err) {
      console.error("Send AI WhatsApp follow-up error:", err);
      setLeadActionMessage(
        err?.message || t("leads.followUpSendFailed"),
      );
    } finally {
      setIsSubmittingFollowUp(false);
    }
  };

  const sendLeadMessage = async () => {
    const message = String(chatMessage || "").trim();

    if (!selectedLead?.id || !message || sendingLeadMessage) {
      return;
    }

    try {
      setSendingLeadMessage(true);
      setChatMessage("");

      await apiClient.request(`/whatsapp-qr/leads/${selectedLead.id}/send`, {
        method: "POST",
        body: JSON.stringify({ message }),
      });

      await Promise.all([
        fetchLeadMessages(selectedLead.id),
        fetchConversationIntelligence(selectedLead.phone),
      ]);
    } catch (err) {
      console.error("Send WhatsApp message from lead error:", err);

      setChatMessage(message);
    } finally {
      setSendingLeadMessage(false);
    }
  };

  const generateAiAssistMessage = async () => {
    if (!selectedLead?.phone) return;

    try {
      const response = await apiClient.request(
        `/whatsapp-qr/conversations/${encodeURIComponent(
          selectedLead.phone,
        )}/ai-assist`,
        {
          method: "POST",
        },
      );
      const data = response?.data || response || {};
      const reply = data.reply || data.message || "";
      if (reply) {
        setChatMessage(reply);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const applySuggestedReply = (type) => {
    if (!selectedLead) return;

    const name = selectedLead.name || t("leads.there");

    const replies = {
      properties: t("leads.replyProperties", { name }),
      budget: t("leads.replyBudget", { name }),
      viewing: t("leads.replyViewing", { name }),
    };

    setChatMessage(replies[type] || "");
  };
  const openLeadProfile = () => {
    if (!selectedLead) return;

    if (isMobile) {
      setMobileLeadScreen("insights");
      return;
    }

    setLeadProfileForm({
      status: selectedLead.status || "new",
      priority: selectedLead.priority || "low",
      notes: selectedLead.notes || "",
    });

    setShowLeadProfileModal(true);
  };
  const saveLeadProfile = async (e) => {
    e.preventDefault();

    await updateSelectedLead({
      status: leadProfileForm.status,
      priority: leadProfileForm.priority,
      notes: leadProfileForm.notes,
    });

    setShowLeadProfileModal(false);
  };
  const fetchLeadMessages = async (leadId) => {
    try {
      setLeadMessagesLoading(true);

      const response = await apiClient.request(
        `/whatsapp-qr/leads/${leadId}/messages?limit=100`,
        {
          method: "GET",
        },
      );
      const data = response?.data || response || [];
      setLeadMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch lead messages error:", err);
      setLeadMessages([]);
    } finally {
      setLeadMessagesLoading(false);
    }
  };

  const fetchConversationIntelligence = async (phone) => {
    if (!phone) {
      setConversationIntelligence(null);
      setConversationIntelligenceLoading(false);
      return;
    }

    try {
      setConversationIntelligenceLoading(true);

      const response = await apiClient.request(
        `/whatsapp-qr/conversations/${encodeURIComponent(phone)}/intelligence`,
        {
          method: "GET",
        },
      );

      setConversationIntelligence(response?.data || response || null);
    } catch (err) {
      console.error("Fetch conversation intelligence error:", err);
      setConversationIntelligence(null);
    } finally {
      setConversationIntelligenceLoading(false);
    }
  };

  const getCloseProbability = (stage) => {
    const map = {
      new: 10,
      discovery: 20,
      qualified: 35,
      "property-match": 45,
      showing: 55,
      proposal: 65,
      negotiation: 78,
      contract: 88,
      closing: 95,
      won: 100,
      lost: 0,
    };

    return map[String(stage || "new").toLowerCase()] ?? 10;
  };
  const getAutomationStatus = (type) => {
    if (!selectedLead) return false;

    const status = selectedLead.status || "new";
    const priority = selectedLead.priority || "low";
    const stage = selectedLead.dealStage || "new";

    const rules = {
      followUp: ["contacted", "follow-up", "qualified"].includes(status),
      qualification: ["new", "contacted"].includes(status),
      appointment: ["qualified", "follow-up"].includes(status),
      propertyMatch: ["qualified", "follow-up"].includes(status),
      escalation:
        priority === "high" ||
        ["negotiation", "contract", "closing"].includes(stage),
    };

    return Boolean(rules[type]);
  };
  const automationItems = [
    {
      title: t("leads.autoFollowUpTitle"),
      type: "followUp",
      desc: t("leads.autoFollowUpDesc"),
      icon: <Sparkles size={16} />,
    },
    {
      title: t("leads.aiQualificationTitle"),
      type: "qualification",
      desc: t("leads.aiQualificationDesc"),
      icon: <Bot size={16} />,
    },
    {
      title: t("leads.autoAppointmentTitle"),
      type: "appointment",
      desc: t("leads.autoAppointmentDesc"),
      icon: <Calendar size={16} />,
    },
    {
      title: t("leads.smartPropertyMatchingTitle"),
      type: "propertyMatch",
      desc: t("leads.smartPropertyMatchingDesc"),
      icon: <Home size={16} />,
    },
    {
      title: t("leads.escalateHotLeadsTitle"),
      type: "escalation",
      desc: t("leads.escalateHotLeadsDesc"),
      icon: <ArrowUpRight size={16} />,
    },
  ];

  const getLeadIntelligence = () => {
    if (!selectedLead) {
      return {
        score: 0,
        sentiment: "-",
        interestLevel: "-",
        responseLikelihood: "-",
        engagementScore: 0,
        temperature: "No Lead",
      };
    }

    const score = Number(getLeadScore(selectedLead));
    const messageCount = leadMessages.length;
    const hasShowing = leadEvents.some(
      (event) => event.eventType === "lead.showing_booked",
    );
    const hasPropertiesSent = leadEvents.some(
      (event) => event.eventType === "lead.properties_sent",
    );

    const engagementScore = Math.min(
      100,
      score +
        messageCount * 5 +
        (hasShowing ? 10 : 0) +
        (hasPropertiesSent ? 5 : 0),
    );

    const sentiment =
      score >= 80 || selectedLead.priority === "high"
        ? t("leads.sentimentHighIntent")
        : score >= 50
          ? t("leads.sentimentInterested")
          : t("leads.sentimentLowIntent");

    const interestLevel =
      engagementScore >= 80
        ? t("leads.levelVeryHigh")
        : engagementScore >= 60
          ? t("leads.levelHigh")
          : engagementScore >= 40
            ? t("leads.levelMedium")
            : t("leads.levelLow");

    const responseLikelihood =
      messageCount >= 3 || selectedLead.status === "contacted"
        ? t("leads.levelVeryHigh")
        : messageCount >= 1
          ? t("leads.levelHigh")
          : t("leads.levelMedium");

    return {
      score,
      sentiment,
      interestLevel,
      responseLikelihood,
      engagementScore,
      temperature: getLeadTemperature(selectedLead),
    };
  };

  const fallbackLeadIntelligence = getLeadIntelligence();

  const normalizePercentNumber = (value, fallback = 0) => {
    if (value === null || value === undefined || value === "") {
      return Number(fallback) || 0;
    }

    const parsed = Number(String(value).replace("%", "").trim());

    return Number.isFinite(parsed)
      ? Math.max(0, Math.min(100, Math.round(parsed)))
      : Number(fallback) || 0;
  };

  const intelligenceScore = normalizePercentNumber(
    conversationIntelligence?.score,
    fallbackLeadIntelligence.score,
  );

  const leadIntelligence = {
    ...fallbackLeadIntelligence,
    score: intelligenceScore,
    temperature:
      intelligenceScore >= 80
        ? "Hot"
        : intelligenceScore >= 60
          ? "Warm"
          : "Cool",
    sentiment:
      conversationIntelligence?.sentiment ||
      fallbackLeadIntelligence.sentiment ||
      t("leads.unknown"),
    interestLevel:
      conversationIntelligence?.intent ||
      fallbackLeadIntelligence.interestLevel ||
      t("leads.unknown"),
    responseLikelihood:
      conversationIntelligence?.responseLikelihood ||
      fallbackLeadIntelligence.responseLikelihood ||
      t("leads.unknown"),
    closeProbability:
      conversationIntelligence?.closeProbability ||
      `${getCloseProbability(selectedLead?.dealStage)}%`,
    expectedRevenue:
      conversationIntelligence?.expectedRevenue ||
      `$${Number(selectedLead?.dealValue || 0).toLocaleString()}`,
    budget: conversationIntelligence?.budget || t("leads.unknown"),
    timeline: conversationIntelligence?.timeline || t("leads.unknown"),
    ghostRisk: conversationIntelligence?.ghostRisk || t("leads.unknown"),
    summary:
      conversationIntelligence?.summary ||
      selectedLead?.notes ||
      t("leads.summaryFallback", {
        source: selectedLead?.source || "CRM",
        status: selectedLead?.status || "new",
      }),
    recommendedAction:
      conversationIntelligence?.recommendedAction ||
      selectedLead?.recommendedActionReason ||
      t("leads.recommendedActionFallback"),
  };

  useEffect(() => {
    if (!chatBodyRef.current) return;

    requestAnimationFrame(() => {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    });
  }, [leadMessages, selectedLead?.id]);

  const createLead = async (e) => {
    e.preventDefault();
    if (
      createLeadForm.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createLeadForm.email)
    ) {
      alert(t("leads.invalidEmail"));
      return;
    }
    try {
      await apiClient.request("/leads", {
        method: "POST",
        body: JSON.stringify(createLeadForm),
      });

      setShowCreateLeadModal(false);
      setCreateLeadForm({
        name: "",
        email: "",
        phone: "",
        source: "",
        status: "new",
        priority: "low",
        notes: "",
      });

      fetchDashboard();
    } catch (err) {
      console.error("Create lead error:", err);
    }
  };
  const exportLeadsCsv = () => {
    const headers = [
      t("leads.name"),
      t("leads.email"),
      t("leads.phone"),
      t("leads.status"),
      t("leads.priority"),
      t("leads.source"),
      t("leads.dealValue"),
      t("leads.dealStageHeader"),
    ];

    const rows = visibleLeads.map((lead) => [
      lead.name || "",
      lead.email || "",
      lead.phone || "",
      lead.status || "",
      lead.priority || "",
      lead.source || "",
      lead.dealValue || "",
      lead.dealStage || "",
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "leads.csv";
    link.click();

    URL.revokeObjectURL(url);
  };
  const updateLeadFilter = (key, value) => {
    setLeadFilters((prev) => ({
      ...prev,
      [key]: value,
    }));

    if (isMobile) {
      setShowFilters(false);
    }
  };
  const runBulkAction = async (action) => {
    if (!action) return;

    try {
      if (action === "export") {
        exportLeadsCsv();
        return;
      }

      if (action === "clear") {
        setQueueFilter(null);
        setLeadSearch("");
        setLeadFilters({
          source: "all",
          temperature: "all",
          aiScore: "all",
          stage: "all",
          agent: "all",
        });
        setDateRange("all");
        setAiView(false);
        return;
      }

      const payloadMap = {
        markQualified: { status: "qualified" },
        priorityHigh: { priority: "high" },
        followUp: { status: "follow-up" },
      };

      const payload = payloadMap[action];

      if (!payload || !visibleLeads.length) return;

      await Promise.all(
        visibleLeads.map((lead) =>
          apiClient.request(`/leads/${lead.id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          }),
        ),
      );

      fetchDashboard();

      if (selectedLead?.id) {
        fetchLeadEvents(selectedLead.id);
      }
    } catch (err) {
      console.error("Bulk action error:", err);
    }
  };
  const toggleAiView = () => {
    setAiView((prev) => !prev);
    setQueueFilter(null);
  };
  const visibleLeads = leadsData.filter((lead) => {
    const matchesAiView = aiView
      ? lead.priority === "high" ||
        getLeadScore(lead) >= 70 ||
        ["qualified", "follow-up"].includes(String(lead.status || ""))
      : true;
    const matchesQueue =
      queueFilter === "urgent" ? lead.priority === "high" : true;

    const keyword = leadSearch.trim().toLowerCase();

    const matchesSearch = !keyword
      ? true
      : [
          lead.name,
          lead.email,
          lead.phone,
          lead.status,
          lead.priority,
          lead.source,
          lead.dealStage,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));

    const temperature = getLeadTemperature(lead).toLowerCase();
    const score = Number(getLeadScore(lead));
    const stage = String(lead.dealStage || "new").toLowerCase();
    const source = String(lead.source || "crm").toLowerCase();

    const matchesSource =
      leadFilters.source === "all" ||
      source === leadFilters.source.toLowerCase();

    const matchesTemperature =
      leadFilters.temperature === "all" ||
      temperature === leadFilters.temperature.toLowerCase();

    const matchesAiScore =
      leadFilters.aiScore === "all" ||
      (leadFilters.aiScore === "80+" && score >= 80) ||
      (leadFilters.aiScore === "50-79" && score >= 50 && score < 80) ||
      (leadFilters.aiScore === "0-49" && score < 50);

    const matchesStage =
      leadFilters.stage === "all" || stage === leadFilters.stage.toLowerCase();

    const matchesAgent =
      leadFilters.agent === "all" ||
      String(lead.assignedTo || "").toLowerCase() ===
        leadFilters.agent.toLowerCase();

    const mobileInboxMatches =
      !isMobile ||
      mobileInboxFilter === "all" ||
      (mobileInboxFilter === "urgent" && lead.priority === "high") ||
      (mobileInboxFilter === "followup" &&
        ["follow-up", "follow_up"].includes(String(lead.status || "").toLowerCase())) ||
      (mobileInboxFilter === "replies" &&
        ["contacted", "follow-up", "follow_up"].includes(
          String(lead.status || "").toLowerCase(),
        )) ||
      (mobileInboxFilter === "ai" &&
        (getLeadScore(lead) >= 70 ||
          String(lead.status || "").toLowerCase() === "qualified"));

    return (
      matchesQueue &&
      matchesSearch &&
      matchesSource &&
      matchesTemperature &&
      matchesAiScore &&
      matchesStage &&
      matchesAgent &&
      matchesAiView &&
      mobileInboxMatches
    );
  });

  const fetchTeamMembers = async () => {
    try {
      const teams = await apiClient.request("/teams", { method: "GET" });
      const teamList = teams?.data || teams || [];
      const teamId = teamList?.[0]?.id;

      if (!teamId) {
        setTeamMembers([]);
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
    } catch (err) {
      console.error("Fetch team members error:", err);
      setTeamMembers([]);
    }
  };

  const fetchDashboard = async (page = 1, append = false) => {
    try {
      if (append) setLeadLoadingMore(true);
      else setLeadsLoading(true);

      const response = await apiClient.request(
        `/leads/dashboard?range=${dateRange}&page=${page}&limit=20`,
        { method: "GET" },
      );

      const data = response?.data || response;
      const incomingLeads = Array.isArray(data?.leads) ? data.leads : [];

      setLeadDashboard(data);
      setLeadStats(data?.stats || null);
      setLeadPage(data?.pagination?.page || page);
      setLeadHasMore(Boolean(data?.pagination?.hasMore));

      setLeadsData((prev) => {
        if (!append) return incomingLeads;

        const map = new Map(prev.map((lead) => [lead.id, lead]));
        incomingLeads.forEach((lead) => map.set(lead.id, lead));
        return Array.from(map.values());
      });

      if (!append) {
        const params = new URLSearchParams(location.search);
        const leadId = params.get("leadId");
        let activeLead = leadId
          ? incomingLeads.find((item) => String(item.id) === String(leadId))
          : null;
        if (leadId && !activeLead) {
          activeLead = await fetchLeadById(leadId);
        }
        activeLead = activeLead || incomingLeads[0] || null;
        setSelectedLead(activeLead);
        setLeadActionMessage("");
        if (activeLead?.id) {
          setConversationIntelligence(null);
          fetchLeadEvents(activeLead.id);
          fetchLeadMessages(activeLead.id);
          if (activeLead.phone) {
            fetchConversationIntelligence(activeLead.phone);
          }
        }
      }
    } catch (err) {
      console.error("Fetch dashboard error:", err);
    } finally {
      setLeadsLoading(false);
      setLeadLoadingMore(false);
    }
  };

  const loadMoreLeads = () => {
    if (leadLoadingMore || !leadHasMore) return;
    fetchDashboard(leadPage + 1, true);
  };
  useEffect(() => {
    setLeadPage(1);
    setLeadsData([]);
    fetchDashboard(1, false);
  }, [location.search, dateRange]);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const uploadLeadChatFile = async (file) => {
    if (!selectedLead?.id || !file) return;

    try {
      setUploadingChatFile(true);

      const formData = new FormData();
      formData.append("file", file);

      await apiClient.request(`/leads/${selectedLead.id}/upload-message-file`, {
        method: "POST",
        body: formData,
      });

      fetchLeadEvents(selectedLead.id);
      fetchLeadMessages(selectedLead.id);
      fetchFullLeadEvents(1, false);
    } catch (err) {
      console.error("Upload chat file error:", err);
    } finally {
      setUploadingChatFile(false);
    }
  };

  const startVoiceUpload = () => {
    audioInputRef.current?.click();
  };
  const formatRecordTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const toggleVoiceRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        clearInterval(recordTimerRef.current);

        setIsRecording(false);
        setRecordSeconds(0);

        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `voice-${Date.now()}.webm`, {
          type: "audio/webm",
        });

        stream.getTracks().forEach((track) => track.stop());
        if (recordingCancelledRef.current) {
          audioChunksRef.current = [];
          return;
        }
        if (blob.size > 0) {
          await uploadLeadChatFile(file);
        }
      };
      recordingCancelledRef.current = false;
      recorder.start();
      setIsRecording(true);

      recordTimerRef.current = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Voice recording error:", err);
    }
  };
  const cancelVoiceRecording = () => {
    recordingCancelledRef.current = true;
    mediaRecorderRef.current?.stop();
  };

  const finishVoiceRecording = () => {
    recordingCancelledRef.current = false;
    mediaRecorderRef.current?.stop();
  };
  const fallbackSuggestedReplies = [
    t("leads.suggestReplyProperties"),
    t("leads.suggestReplyBudget"),
    t("leads.suggestReplyViewing"),
  ];

  const aiSuggestedReplies = (() => {
    const rawReplies =
      conversationIntelligence?.suggestedReplies ||
      conversationIntelligence?.suggested_replies ||
      conversationIntelligence?.replies ||
      [];

    if (!Array.isArray(rawReplies)) {
      return fallbackSuggestedReplies;
    }

    const normalizedReplies = rawReplies
      .map((reply) => {
        if (typeof reply === "string") {
          return reply.trim();
        }

        return String(
          reply?.text || reply?.message || reply?.reply || reply?.content || "",
        ).trim();
      })
      .filter(Boolean)
      .slice(0, 3);

    return normalizedReplies.length
      ? normalizedReplies
      : fallbackSuggestedReplies;
  })();

  const renderMessageStatus = (message) => {
    if (message?.direction !== "outbound") {
      return null;
    }
    const status = String(message?.status || "sent").toLowerCase();
    if (status === "pending") {
      return (
        <Clock3
          size={12}
          className="lead-message-status lead-message-status-pending"
        />
      );
    }
    if (status === "failed") {
      return (
        <CircleAlert
          size={12}
          className="lead-message-status lead-message-status-failed"
        />
      );
    }
    if (status === "read") {
      return (
        <CheckCheck
          size={13}
          className="lead-message-status lead-message-status-read"
        />
      );
    }
    if (status === "delivered") {
      return (
        <CheckCheck
          size={13}
          className="lead-message-status lead-message-status-delivered"
        />
      );
    }
    return (
      <Check
        size={13}
        className="lead-message-status lead-message-status-sent"
      />
    );
  };
  const handleRealtimeMessage = (payload) => {
    console.log("LEAD REALTIME MESSAGE:", payload);
    const activeLead = selectedLeadRef.current;
    if (!activeLead?.id) {
      return;
    }
    const payloadPhone = normalizeWhatsAppPhone(
      payload?.contactPhone || payload?.contact_phone,
    );
    const selectedPhone = normalizeWhatsAppPhone(activeLead?.phone);
    /*
     * User can revived realtime from conversations
     * Only append message from lead is opening.
     */
    if (payloadPhone && selectedPhone && payloadPhone !== selectedPhone) {
      return;
    }
    const incomingMessage = normalizeRealtimeMessage(payload);
    setLeadMessages((currentMessages) => {
      const safeMessages = Array.isArray(currentMessages)
        ? currentMessages
        : [];

      const alreadyExists = safeMessages.some((message) => {
        const sameDatabaseId =
          incomingMessage.id &&
          message?.id &&
          String(message.id) === String(incomingMessage.id);

        const sameWhatsAppId =
          incomingMessage.message_id &&
          message?.message_id &&
          String(message.message_id) === String(incomingMessage.message_id);

        return sameDatabaseId || sameWhatsAppId;
      });
      if (alreadyExists) {
        return safeMessages.map((message) => {
          const sameDatabaseId =
            incomingMessage.id &&
            message?.id &&
            String(message.id) === String(incomingMessage.id);

          const sameWhatsAppId =
            incomingMessage.message_id &&
            message?.message_id &&
            String(message.message_id) === String(incomingMessage.message_id);

          if (!sameDatabaseId && !sameWhatsAppId) {
            return message;
          }
          return {
            ...message,
            ...incomingMessage,
          };
        });
      }

      return [...safeMessages, incomingMessage];
    });

    /*
     * Inbound message make AI Intelligence change.
     */
    if (payload?.direction === "inbound") {
      fetchConversationIntelligence(activeLead.phone);
    }
  };
  const handleMessageStatus = (payload) => {
    console.log("LEAD MESSAGE STATUS:", payload);
    const activeLead = selectedLeadRef.current;

    if (!activeLead?.id) {
      return;
    }
    const payloadPhone = normalizeWhatsAppPhone(
      payload?.contactPhone || payload?.contact_phone,
    );
    const selectedPhone = normalizeWhatsAppPhone(activeLead?.phone);
    if (payloadPhone && selectedPhone && payloadPhone !== selectedPhone) {
      return;
    }
    const whatsappMessageId = payload?.messageId || payload?.message_id || null;
    const databaseMessageId =
      payload?.databaseMessageId ||
      payload?.database_message_id ||
      payload?.id ||
      null;

    if (!whatsappMessageId && !databaseMessageId) {
      return;
    }

    setLeadMessages((currentMessages) =>
      (Array.isArray(currentMessages) ? currentMessages : []).map((message) => {
        const matchesDatabaseId =
          Boolean(databaseMessageId) &&
          String(message?.id) === String(databaseMessageId);

        const matchesWhatsAppId =
          Boolean(whatsappMessageId) &&
          String(message?.message_id) === String(whatsappMessageId);

        if (!matchesDatabaseId && !matchesWhatsAppId) {
          return message;
        }

        return {
          ...message,

          status: payload?.status || message?.status || "sent",

          sent_at:
            payload?.sentAt ?? payload?.sent_at ?? message?.sent_at ?? null,

          delivered_at:
            payload?.deliveredAt ??
            payload?.delivered_at ??
            message?.delivered_at ??
            null,

          read_at:
            payload?.readAt ?? payload?.read_at ?? message?.read_at ?? null,

          failed_at:
            payload?.failedAt ??
            payload?.failed_at ??
            message?.failed_at ??
            null,
        };
      }),
    );
  };
  useEffect(() => {
    const token = getStoredAuthToken();
    if (!token) {
      console.warn("Lead chat socket skipped: authentication token not found.");
      return undefined;
    }
    const socketUrl = `${getWhatsAppSocketBaseUrl()}/whatsapp-qr`;
    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      auth: {
        token,
      },
      query: {
        token,
      },
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    leadChatSocketRef.current = socket;
    const handleSocketConnect = () => {
      console.log("LEAD WHATSAPP SOCKET CONNECTED:", socket.id);
    };
    const handleSocketDisconnect = (reason) => {
      console.log("LEAD WHATSAPP SOCKET DISCONNECTED:", reason);
    };
    const handleSocketError = (error) => {
      console.error("LEAD WHATSAPP SOCKET ERROR:", error);
    };

    socket.on("connect", handleSocketConnect);
    socket.on("disconnect", handleSocketDisconnect);
    socket.on("connect_error", handleSocketError);
    socket.on("message", handleRealtimeMessage);
    socket.on("message-status", handleMessageStatus);

    return () => {
      socket.off("connect", handleSocketConnect);
      socket.off("disconnect", handleSocketDisconnect);
      socket.off("connect_error", handleSocketError);
      socket.off("message", handleRealtimeMessage);
      socket.off("message-status", handleMessageStatus);
      socket.disconnect();

      if (leadChatSocketRef.current === socket) {
        leadChatSocketRef.current = null;
      }
    };
  }, []);
  return (
    <div className="leads-page">
      <div className="heading_page">
        <Users className="header-icon" size={20} />
        <h1>{t("leads.pageTitle")}</h1>
      </div>
      <p className="sub_head">{t("leads.subheading")}</p>
      <div className="leads-header">
        <div className="header-actions">
          {isMobile ? (
            <>
              <div className="secondary-btn mobile-overview-action mobile-overview-date">
                <Calendar size={18} />
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                >
                  <option value="all">{t("leads.dateAllTime")}</option>
                  <option value="today">{t("leads.dateToday")}</option>
                  <option value="7days">{t("leads.dateLast7Days")}</option>
                  <option value="30days">{t("leads.dateLast30Days")}</option>
                  <option value="month">{t("leads.dateThisMonth")}</option>
                </select>
                <ChevronDown size={17} />
              </div>

              <button
                type="button"
                className="secondary-btn mobile-overview-action"
                onClick={exportLeadsCsv}
              >
                <Download size={18} />
                <span>{t("leads.export")}</span>
              </button>

              <button
                type="button"
                className={`secondary-btn mobile-overview-action mobile-overview-ai ${aiView ? "active" : ""}`}
                onClick={toggleAiView}
              >
                <Sparkles size={18} />
                <span>{aiView ? t("leads.aiViewOn") : t("leads.aiView")}</span>
              </button>

              <button
                type="button"
                className="secondary-btn mobile-overview-action mobile-overview-new"
                onClick={() => setShowCreateLeadModal(true)}
              >
                <Plus size={19} />
                <span>{t("leads.newLead")}</span>
              </button>
            </>
          ) : (
            <>
              <div className="secondary-btn">
                <Calendar size={16} />
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                >
                  <option value="all">{t("leads.dateAllTime")}</option>
                  <option value="today">{t("leads.dateToday")}</option>
                  <option value="7days">{t("leads.dateLast7Days")}</option>
                  <option value="30days">{t("leads.dateLast30Days")}</option>
                  <option value="month">{t("leads.dateThisMonth")}</option>
                </select>
                <ChevronDown size={15} />
              </div>

              <button className="secondary-btn" onClick={exportLeadsCsv}>
                <Download size={16} />
                {t("leads.export")}
              </button>

              <button
                className={`secondary-btn ai-btn ${aiView ? "active" : ""}`}
                onClick={toggleAiView}
              >
                <Sparkles size={16} />
                {aiView ? t("leads.aiViewOn") : t("leads.aiView")}
              </button>

              <button
                className="primary-btn"
                onClick={() => setShowCreateLeadModal(true)}
              >
                <Plus size={17} />
                {t("leads.newLead")}
              </button>
            </>
          )}
        </div>
      </div>

      {isMobile && (
        <div className="mobile-overview-search-row">
          <label className="mobile-overview-search">
            <Search size={20} />
            <input
              type="search"
              placeholder={t("leads.searchPlaceholder")}
              value={leadSearch}
              onChange={(e) => setLeadSearch(e.target.value)}
            />
          </label>

          <button
            type="button"
            className="mobile-overview-filter-button"
            onClick={() => setShowFilters(true)}
          >
            <SlidersHorizontal size={20} />
            <span>{t("leads.filters")}</span>
          </button>
        </div>
      )}

      {isMobile && showFilters && (
        <>
          <div
            className="filter-overlay"
            onClick={() => setShowFilters(false)}
          />

          <div className="mobile-filter-drawer">
            <div className="drawer-header">
              <h3>{t("leads.filters")}</h3>

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
                <select
                  value={leadFilters.source}
                  onChange={(e) => updateLeadFilter("source", e.target.value)}
                >
                  <option value="all">{t("leads.allSources")}</option>
                  <option value="crm">CRM</option>
                  <option value="website">{t("leads.website")}</option>
                  <option value="facebook">Facebook</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="instagram">Instagram</option>
                </select>
                <ChevronDown size={15} />
              </div>
              <div className="filter-btn">
                <Clock3 size={15} />
                <select
                  value={leadFilters.temperature}
                  onChange={(e) =>
                    updateLeadFilter("temperature", e.target.value)
                  }
                >
                  <option value="all">{t("leads.allTemperatures")}</option>
                  <option value="hot">{t("leads.tempHot")}</option>
                  <option value="warm">{t("leads.tempWarm")}</option>
                  <option value="cool">{t("leads.tempCool")}</option>
                </select>
                <ChevronDown size={15} />
              </div>
              <div className="filter-btn">
                <Bot size={15} />
                <select
                  value={leadFilters.aiScore}
                  onChange={(e) => updateLeadFilter("aiScore", e.target.value)}
                >
                  <option value="all">{t("leads.allAiScores")}</option>
                  <option value="80+">80+</option>
                  <option value="50-79">50 - 79</option>
                  <option value="0-49">0 - 49</option>
                </select>
                <ChevronDown size={15} />
              </div>
              <div className="filter-btn">
                <Layers size={15} />
                <select
                  value={leadFilters.stage}
                  onChange={(e) => updateLeadFilter("stage", e.target.value)}
                >
                  <option value="all">{t("leads.allStages")}</option>
                  <option value="new">{t("leads.optNew")}</option>
                  <option value="discovery">{t("leads.optDiscovery")}</option>
                  <option value="qualified">{t("leads.optQualified")}</option>
                  <option value="property-match">{t("leads.optPropertyMatch")}</option>
                  <option value="showing">{t("leads.optShowing")}</option>
                  <option value="proposal">{t("leads.optProposal")}</option>
                  <option value="negotiation">{t("leads.optNegotiation")}</option>
                  <option value="contract">{t("leads.optContract")}</option>
                  <option value="closing">{t("leads.optClosing")}</option>
                  <option value="won">{t("leads.optWon")}</option>
                  <option value="lost">{t("leads.optLost")}</option>
                </select>
                <ChevronDown size={15} />
              </div>
              <div className="filter-btn">
                <Users size={15} />
                <select
                  value={leadFilters.agent}
                  onChange={(e) => updateLeadFilter("agent", e.target.value)}
                >
                  <option value="all">{t("leads.allAgents")}</option>
                  {teamMembers.map((member) => (
                    <option
                      key={member.userId || member.id}
                      value={member.userId || member.id}
                    >
                      {member.name || member.email || t("leads.teamMember")}
                    </option>
                  ))}
                </select>
                <ChevronDown size={15} />
              </div>
              <button className="btn-export" onClick={exportLeadsCsv}>
                <Download size={15} />
                {t("leads.export")}
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
            <select
              value={leadFilters.source}
              onChange={(e) => updateLeadFilter("source", e.target.value)}
            >
              <option value="all">{t("leads.allSources")}</option>
              <option value="crm">CRM</option>
              <option value="website">{t("leads.website")}</option>
              <option value="facebook">Facebook</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="instagram">Instagram</option>
            </select>
            <ChevronDown size={15} />
          </div>
          <div className="filter-btn">
            <select
              value={leadFilters.temperature}
              onChange={(e) => updateLeadFilter("temperature", e.target.value)}
            >
              <option value="all">{t("leads.allTemperatures")}</option>
              <option value="hot">{t("leads.tempHot")}</option>
              <option value="warm">{t("leads.tempWarm")}</option>
              <option value="cool">{t("leads.tempCool")}</option>
            </select>
            <ChevronDown size={15} />
          </div>
          <div className="filter-btn">
            <select
              value={leadFilters.aiScore}
              onChange={(e) => updateLeadFilter("aiScore", e.target.value)}
            >
              <option value="all">{t("leads.allAiScores")}</option>
              <option value="80+">80+</option>
              <option value="50-79">50 - 79</option>
              <option value="0-49">0 - 49</option>
            </select>
            <ChevronDown size={15} />
          </div>
          <div className="filter-btn">
            <select
              value={leadFilters.stage}
              onChange={(e) => updateLeadFilter("stage", e.target.value)}
            >
              <option value="all">{t("leads.allStages")}</option>
              <option value="new">{t("leads.optNew")}</option>
              <option value="discovery">{t("leads.optDiscovery")}</option>
              <option value="qualified">{t("leads.optQualified")}</option>
              <option value="property-match">{t("leads.optPropertyMatch")}</option>
              <option value="showing">{t("leads.optShowing")}</option>
              <option value="proposal">{t("leads.optProposal")}</option>
              <option value="negotiation">{t("leads.optNegotiation")}</option>
              <option value="contract">{t("leads.optContract")}</option>
              <option value="closing">{t("leads.optClosing")}</option>
              <option value="won">{t("leads.optWon")}</option>
              <option value="lost">{t("leads.optLost")}</option>
            </select>
            <ChevronDown size={15} />
          </div>
          <div className="filter-btn">
            <select
              value={leadFilters.agent}
              onChange={(e) => updateLeadFilter("agent", e.target.value)}
            >
              <option value="all">{t("leads.allAgents")}</option>
              {teamMembers.map((member) => (
                <option
                  key={member.userId || member.id}
                  value={member.userId || member.id}
                >
                  {member.name || member.email || t("leads.teamMember")}
                </option>
              ))}
            </select>
            <ChevronDown size={15} />
          </div>
          <div className="search-box">
            <Search size={16} />
            <input
              placeholder={t("leads.searchPlaceholder")}
              value={leadSearch}
              onChange={(e) => setLeadSearch(e.target.value)}
            />
          </div>

          <button className="filter-btn">
            <SlidersHorizontal size={16} />
            {t("leads.filters")}
          </button>
          <div className="filter-btn">
            <select
              defaultValue=""
              onChange={(e) => {
                runBulkAction(e.target.value);
                e.target.value = "";
              }}
            >
              <option value="">{t("leads.bulkActions")}</option>
              <option value="markQualified">{t("leads.bulkMarkQualified")}</option>
              <option value="priorityHigh">{t("leads.bulkPriorityHigh")}</option>
              <option value="followUp">{t("leads.bulkFollowUp")}</option>
              <option value="export">{t("leads.bulkExportVisible")}</option>
              <option value="clear">{t("leads.bulkClearFilters")}</option>
            </select>
            <ChevronDown size={15} />
          </div>
        </div>
      )}

      {/* STATS */}

      <div className="mobile-kpi-section-head">
        <h2>Key Performance Indicators</h2>
        <span>{leadStats?.rangeLabel || t("leads.allTime")}</span>
      </div>

      <div className="stats-grid">
        {stats.map((item, index) => (
          <div className={`stats-card stats-card-${item.className}`} key={index}>
            <div className={`stats-icon ${item.className}`}>{item.icon}</div>

            <div className="stats-card-copy">
              <span>{item.title}</span>
              <h2>{item.value}</h2>
              <p>{item.change}</p>
            </div>

            <ChevronRight className="mobile-stats-chevron" size={25} />
          </div>
        ))}
      </div>

      {isMobile && (
        <div className="mobile-realtime-note">
          <Sparkles size={21} />
          <span>All metrics update in real time as your team engages with leads.</span>
        </div>
      )}

      {/* PRIORITY BAR */}

      <div className="priority-bar priority-bar-desktop">
        <div className="item-line">
          <div className="priority-title">
            <h3>{t("leads.aiPriorityQueue")}</h3>
            <p>{t("leads.realtimeLeadInsights")}</p>
          </div>
        </div>
        <div className="item-line">
          <div className="priority-item">
            <div className="red icon">
              {" "}
              <Flame size={18} />
            </div>
            <div className="priority-wrap">
              <strong>{leadStats?.urgentLeads || 0}</strong>
              <span>{t("leads.urgentLeads")}</span>
            </div>
          </div>
        </div>
        <div className="item-line">
          <div className="priority-item">
            <div className="orange icon">
              <Clock3 size={18} />
            </div>
            <div className="priority-wrap">
              <strong>{leadStats?.needFollowUp || 0}</strong>
              <span>{t("leads.needFollowUp")}</span>
            </div>
          </div>
        </div>
        <div className="item-line">
          <div className="priority-item">
            <div className="blue icon">
              <Phone size={18} />
            </div>
            <div className="priority-wrap">
              <strong>{leadStats?.readyToCall || 0}</strong>
              <span>{t("leads.readyToCall")}</span>
            </div>
          </div>
        </div>
        <div className="item-line">
          <div className="priority-item">
            <div className="green icon">
              <MessageCircle size={18} />
            </div>
            <div className="priority-wrap">
              <strong>{leadStats?.pendingReplies || 0}</strong>
              <span>{t("leads.pendingReplies")}</span>
            </div>
          </div>
        </div>
        <div className="item-line">
          <div className="priority-item">
            <div className="purple icon">
              <MessageCircle size={18} />
            </div>
            <div className="priority-wrap">
              <strong>{leadStats?.aiQualifiedToday || 0}</strong>
              <span>{t("leads.aiQualifiedToday")}</span>
            </div>
          </div>
        </div>
        <div className="item-line">
          <button className="queue-btn" onClick={applyPriorityQueue}>
            {t("leads.viewQueue")}
            <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {/* MOBILE PRIORITY BAR */}
      <div className="mobile-priority-bar">
        <div className="mobile-priority-head">
          <h3>{t("leads.aiPriorityQueue")}</h3>

          <button
            type="button"
            className="mobile-priority-view"
            onClick={applyPriorityQueue}
          >
            {t("leads.viewQueue")}
          </button>
        </div>

        <div className="mobile-priority-grid">
          <div className="mobile-priority-cell mobile-priority-cell-red">
            <div className="mobile-priority-value-row">
              <div className="mobile-priority-icon">
                <Flame size={18} />
              </div>
              <strong>{leadStats?.urgentLeads || 0}</strong>
            </div>
            <span>{t("leads.urgentLeads")}</span>
          </div>

          <div className="mobile-priority-cell mobile-priority-cell-orange">
            <div className="mobile-priority-value-row">
              <div className="mobile-priority-icon">
                <Clock3 size={18} />
              </div>
              <strong>{leadStats?.needFollowUp || 0}</strong>
            </div>
            <span>{t("leads.needFollowUp")}</span>
          </div>

          <div className="mobile-priority-cell mobile-priority-cell-blue">
            <div className="mobile-priority-value-row">
              <div className="mobile-priority-icon">
                <Phone size={18} />
              </div>
              <strong>{leadStats?.readyToCall || 0}</strong>
            </div>
            <span>{t("leads.readyToCall")}</span>
          </div>

          <div className="mobile-priority-cell mobile-priority-cell-green">
            <div className="mobile-priority-value-row">
              <div className="mobile-priority-icon">
                <MessageCircle size={18} />
              </div>
              <strong>{leadStats?.pendingReplies || 0}</strong>
            </div>
            <span>{t("leads.pendingReplies")}</span>
          </div>

          <div className="mobile-priority-cell mobile-priority-cell-purple">
            <div className="mobile-priority-value-row">
              <div className="mobile-priority-icon">
                <Users size={18} />
              </div>
              <strong>{leadStats?.aiQualifiedToday || 0}</strong>
            </div>
            <span>{t("leads.aiQualifiedToday")}</span>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      {/* MAIN CONTENT */}
      <div className={`leads-layout ${isMobile ? `mobile-lead-screen-${mobileLeadScreen}` : ""}`}>
        {/* LEFT PANEL - AI LEAD INBOX */}
        <div className="lead-sidebar">
          <div className="panel-header lead-inbox-header">
            <div className="lead-inbox-heading-copy">
              <h3>
                <Inbox className="lead-inbox-title-icon" size={28} />
                <span className="lead-inbox-mobile-title">Lead Inbox</span>
                <span className="lead-inbox-desktop-title">{t("leads.aiLeadInbox")}</span>
              </h3>
              <p className="lead-inbox-mobile-subtitle">
                Your leads, organized by priority and AI score.
              </p>
              <p className="lead-inbox-desktop-subtitle">{t("leads.rankedByUrgency")}</p>
            </div>

            <button
              type="button"
              className="icon-btn lead-inbox-desktop-filter"
              onClick={() => setShowFilters(true)}
            >
              <SlidersHorizontal size={16} />
            </button>
          </div>

          <div className="mobile-lead-inbox-tools">
            <div className="mobile-inbox-filter-strip">
              <button
                type="button"
                className={`mobile-inbox-chip mobile-inbox-chip-all ${mobileInboxFilter === "all" ? "active" : ""}`}
                onClick={() => setMobileInboxFilter("all")}
              >
                <span>All</span>
                <strong>{leadStats?.total ?? leadsData.length}</strong>
              </button>

              <button
                type="button"
                className={`mobile-inbox-chip mobile-inbox-chip-hot ${mobileInboxFilter === "urgent" ? "active" : ""}`}
                onClick={() => setMobileInboxFilter("urgent")}
                aria-label="Urgent leads"
              >
                <Flame size={21} />
                <strong>{leadStats?.urgentLeads ?? 0}</strong>
              </button>

              <button
                type="button"
                className={`mobile-inbox-chip mobile-inbox-chip-followup ${mobileInboxFilter === "followup" ? "active" : ""}`}
                onClick={() => setMobileInboxFilter("followup")}
                aria-label="Need follow-up"
              >
                <Clock3 size={21} />
                <strong>{leadStats?.needFollowUp ?? 0}</strong>
              </button>

              <button
                type="button"
                className={`mobile-inbox-chip mobile-inbox-chip-replies ${mobileInboxFilter === "replies" ? "active" : ""}`}
                onClick={() => setMobileInboxFilter("replies")}
                aria-label="Pending replies"
              >
                <MessageCircle size={21} />
                <strong>{leadStats?.pendingReplies ?? leadStats?.activeConversations ?? 0}</strong>
              </button>

              <button
                type="button"
                className={`mobile-inbox-chip mobile-inbox-chip-ai ${mobileInboxFilter === "ai" ? "active" : ""}`}
                onClick={() => setMobileInboxFilter("ai")}
                aria-label="AI qualified"
              >
                <Sparkles size={21} />
                <strong>{leadStats?.aiQualifiedToday ?? leadStats?.qualified ?? 0}</strong>
              </button>

              <button
                type="button"
                className="mobile-inbox-chip mobile-inbox-chip-filter"
                onClick={() => setShowFilters(true)}
                aria-label={t("leads.filters")}
              >
                <SlidersHorizontal size={21} />
              </button>
            </div>

            <div className="mobile-inbox-search-row">
              <label className="mobile-lead-search">
                <Search size={21} />
                <input
                  value={leadSearch}
                  onChange={(e) => setLeadSearch(e.target.value)}
                  placeholder={t("leads.searchPlaceholder")}
                />
              </label>

              <button
                type="button"
                className="mobile-lead-filter-icon-btn"
                onClick={() => setShowFilters(true)}
                aria-label={t("leads.filters")}
              >
                <SlidersHorizontal size={21} />
              </button>
            </div>
          </div>

          <div
            className="lead-list"
            onScroll={(e) => {
              const el = e.currentTarget;
              const nearBottom =
                el.scrollTop + el.clientHeight >= el.scrollHeight - 80;

              if (nearBottom) {
                loadMoreLeads();
              }
            }}
          >
            {leadsLoading ? (
              <div className="lead-card">
                <p className="lead-message">{t("leads.loadingLeads")}</p>
              </div>
            ) : visibleLeads.length ? (
              <>
                {visibleLeads.map((lead) => {
                  const isActive = selectedLead?.id === lead.id;
                  const temperature = getLeadTemperature(lead);
                  const score = getLeadScore(lead);

                  return (
                    <div
                      key={lead.id}
                      className={`lead-card count-badge-container ${isActive ? "active" : ""}`}
                      onClick={() => selectLead(lead)}
                    >
                      <div className="lead-card-desktop-content">
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
                            <h4>{lead.name || t("leads.unnamedLead")}</h4>
                            <span>
                              {lead.phone ||
                                lead.email ||
                                t("leads.noContactInfo")}
                            </span>
                          </div>

                          <div className="lead-score">
                            <strong>{score}%</strong>
                            <p className={getScoreClass(lead)}>
                              {translateTemperature(temperature)}
                            </p>
                          </div>
                        </div>

                        <div className="lead-message-wrap">
                          <p className="lead-message">
                            {lead.notes || lead.source || t("leads.newCrmLead")}
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
                            {lead.propertyTitle || t("leads.noPropertyLinked")}
                          </span>
                          <span className="tag-status status-new">
                            {lead.status || "new"}
                          </span>
                        </div>
                      </div>

                      <div className="mobile-lead-card-content">
                        {(() => {
                          const activity = getMobileInboxActivity(lead);
                          return (
                            <div className="mobile-inbox-lead-row">
                              <div className="mobile-inbox-avatar-wrap">
                                <div className="mobile-inbox-avatar">
                                  {getInitials(lead.name)}
                                </div>
                              </div>

                              <div className="mobile-inbox-lead-copy">
                                <div className="mobile-inbox-name-row">
                                  <h4>{lead.name || t("leads.unnamedLead")}</h4>
                                  <span className="mobile-inbox-online-dot" />
                                </div>

                                <p className="mobile-inbox-company">
                                  {getMobileInboxSecondary(lead)}
                                </p>

                                <div className={`mobile-inbox-activity mobile-inbox-activity-${activity.type}`}>
                                  {renderMobileInboxActivityIcon(activity.type)}
                                  <span>{activity.text}</span>
                                </div>
                              </div>

                              <div className="mobile-inbox-score-wrap">
                                <strong>{score}</strong>
                                {lead.priority === "high" && (
                                  <Flame className="mobile-inbox-priority-mark" size={18} />
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })}

                {leadLoadingMore && (
                  <div className="lead-card">
                    <p className="lead-message">{t("leads.loadingMoreLeads")}</p>
                  </div>
                )}

                {leadHasMore && !leadLoadingMore && (
                  <button
                    type="button"
                    className="mobile-inbox-view-all"
                    onClick={loadMoreLeads}
                  >
                    View All Leads ({leadStats?.total ?? leadsData.length})
                  </button>
                )}

                {!leadHasMore && leadsData.length > 0 && (
                  <div className="mobile-inbox-view-all mobile-inbox-view-all-static">
                    View All Leads ({leadStats?.total ?? leadsData.length})
                  </div>
                )}
              </>
            ) : (
              <div className="lead-card">
                <p className="lead-message">{t("leads.noLeadsFound")}</p>
              </div>
            )}
          </div>

          {/* Footer of Sidebar 
          <div className="sidebar-footer">
            <span className="footer-counter">
              Showing {leadsData.length} leads
            </span>
            <button
              className="view-all-btn"
              onClick={() => {
                setQueueFilter(null);
                setLeadSearch("");
                setDateRange("all");
                setAiView(false);
                setLeadFilters({
                  source: "all",
                  temperature: "all",
                  aiScore: "all",
                  stage: "all",
                  agent: "all",
                });
              }}
            >
              View all leads <ArrowRight size={12} />
            </button>
          </div> */}
        </div>

        {/* CENTER PANEL - CONVERSATION WORKSPACE */}
        <div className="conversation-panel">

          <div className="mobile-lead-detail-screen">
            <section className="mobile-lead-profile-card">
              <div className="mobile-lead-profile-main">
                <div className="mobile-lead-profile-avatar-wrap">
                  <div className="mobile-lead-profile-avatar">
                    {getInitials(selectedLead?.name)}
                  </div>
                  <span className="mobile-lead-profile-online-dot" />
                </div>

                <div className="mobile-lead-profile-copy">
                  <div className="mobile-lead-profile-name-row">
                    <h2>{selectedLead?.name || t("leads.selectALead")}</h2>
                  </div>

                  <span className="mobile-lead-online-pill">Online</span>
                </div>

                <p className="mobile-lead-profile-meta">
                  {selectedLead?.jobTitle ||
                    selectedLead?.title ||
                    selectedLead?.source ||
                    "Lead"}
                  <span>•</span>
                  {selectedLead?.company ||
                    selectedLead?.companyName ||
                    selectedLead?.organization ||
                    selectedLead?.source ||
                    "CRM"}
                </p>

                <div className="mobile-lead-profile-actions">
                  <button type="button" onClick={callSelectedLead} aria-label="Call lead">
                    <Phone size={21} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const phone = normalizeWhatsAppPhone(selectedLead?.phone);
                      if (phone) window.open(`https://wa.me/${phone}`, "_blank", "noopener,noreferrer");
                    }}
                    aria-label="Open WhatsApp"
                  >
                    <MessageCircle size={22} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (selectedLead?.email) {
                        window.location.href = `mailto:${selectedLead.email}`;
                      }
                    }}
                    aria-label="Email lead"
                  >
                    <Mail size={21} />
                  </button>

                  <button type="button" onClick={openBookShowing} aria-label="Schedule">
                    <Calendar size={21} />
                  </button>

                  <button
                    type="button"
                    aria-label="More lead details"
                  >
                    <MoreHorizontal size={23} />
                  </button>
                </div>
              </div>

              <div className="mobile-lead-contact-strip">
                <div>
                  <Mail size={17} />
                  <span>{selectedLead?.email || t("leads.noContactInfo")}</span>
                </div>
                <div>
                  <Phone size={17} />
                  <span>{selectedLead?.phone || t("leads.noContactInfo")}</span>
                </div>
                <div>
                  <MapPin size={17} />
                  <span>
                    {[
                      selectedLead?.city,
                      selectedLead?.state,
                      selectedLead?.country,
                    ].filter(Boolean).join(", ") || selectedLead?.source || "—"}
                  </span>
                </div>
              </div>
            </section>

            <section className="mobile-lead-performance-card">
              <div className="mobile-performance-cell mobile-performance-score">
                <span>Close Probability</span>
                <div className="mobile-score-gauge">
                  <div className="mobile-score-gauge-value">
                    {leadIntelligence.score}
                  </div>
                </div>
                <strong>{translateTemperature(leadIntelligence.temperature)}</strong>
              </div>

              <div className="mobile-performance-cell">
                <span>Potential Value</span>
                <strong className="mobile-performance-main">
                  {leadIntelligence.closeProbability &&
                  String(leadIntelligence.closeProbability).toLowerCase() !== "unknown"
                    ? leadIntelligence.closeProbability
                    : "-"}
                </strong>
                <small>↑ {translateTemperature(leadIntelligence.temperature)}</small>
              </div>

              <div className="mobile-performance-cell">
                <span>Estimated Value</span>
                <strong className="mobile-performance-main">
                  {leadIntelligence.expectedRevenue &&
                  String(leadIntelligence.expectedRevenue).toLowerCase() !== "unknown"
                    ? leadIntelligence.expectedRevenue
                    : "-"}
                </strong>
                <small>USD<br />Estimated</small>
              </div>

              <div className="mobile-performance-cell mobile-performance-intent">
                <span>Intent</span>
                <strong className="mobile-performance-main">
                  {leadIntelligence.interestLevel &&
                  String(leadIntelligence.interestLevel).toLowerCase() !== "unknown"
                    ? leadIntelligence.interestLevel
                    : "-"}
                </strong>
                <svg viewBox="0 0 120 45" aria-hidden="true">
                  <polyline
                    points="4,38 18,34 30,36 44,24 58,29 72,21 86,14 99,20 116,5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              </div>
            </section>

            <section className="mobile-next-best-action-card">
              <div className="mobile-next-best-action-icon">
                <Zap size={34} />
              </div>

              <div className="mobile-next-best-action-copy">
                <h3>AI Next Best Action</h3>
                <p>{leadIntelligence.recommendedAction}</p>
              </div>

              <button type="button" onClick={callSelectedLead}>
                <Phone size={21} />
                <span>Call Now</span>
              </button>
            </section>

            <section className="mobile-lead-activity-card">
              <div className="mobile-lead-activity-tabs">
                {[
                  ["conversation", "Conversation"],
                  ["notes", "Notes"],
                  [
                    "emails",
                    `Emails (${leadEvents.filter((event) =>
                      String(event?.eventType || "").toLowerCase().includes("email"),
                    ).length})`,
                  ],
                  [
                    "calls",
                    `Calls (${leadEvents.filter((event) =>
                      String(event?.eventType || "").toLowerCase().includes("call"),
                    ).length})`,
                  ],
                  ["whatsapp", `WhatsApp (${leadMessages.length})`],
                  ["files", "Files"],
                  ["tasks", "Tasks"],
                ].map(([key, label]) => (
                  <button
                    type="button"
                    key={key}
                    className={mobileConversationTab === key ? "active" : ""}
                    onClick={() => setMobileConversationTab(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {(mobileConversationTab === "conversation" ||
                mobileConversationTab === "whatsapp") && (
                <div className="mobile-thread-list">
                  {leadMessagesLoading ? (
                    <div className="mobile-thread-empty">{t("leads.loadingMessages")}</div>
                  ) : leadMessages.length ? (
                    leadMessages
                      .slice()
                      .sort(
                        (a, b) =>
                          new Date(a.created_at || a.createdAt).getTime() -
                          new Date(b.created_at || b.createdAt).getTime(),
                      )
                      .map((message) => {
                        const isOutbound =
                          message.direction === "outbound" ||
                          message.sender_type === "agent" ||
                          message.sender_type === "ai";

                        const isAi = message.sender_type === "ai";
                        const senderLabel = isAi
                          ? "AI Assistant"
                          : isOutbound
                            ? "You"
                            : selectedLead?.name || t("leads.unnamedLead");

                        const messageText = String(
                          message.body || message.message || message.text || "",
                        ).trim();

                        const messageType = String(
                          message.message_type || "text",
                        ).toLowerCase();

                        const mediaUrl =
                          message.media_url ||
                          message.file_url ||
                          message.url ||
                          null;

                        return (
                          <article
                            className={`mobile-thread-message ${
                              isOutbound ? "outbound" : "inbound"
                            } ${isAi ? "ai-message" : ""}`}
                            key={
                              message.id ||
                              message.message_id ||
                              `${message.direction}-${message.created_at}-${message.body}`
                            }
                          >
                            <div className="mobile-thread-message-icon">
                              {isAi ? <Zap size={22} /> : <MessageCircle size={22} />}
                            </div>

                            <div className="mobile-thread-message-copy">
                              <strong>{senderLabel}</strong>

                              {messageType === "image" && mediaUrl ? (
                                <img
                                  src={mediaUrl}
                                  alt={t("leads.whatsappAttachment")}
                                  className="mobile-thread-media"
                                />
                              ) : messageType === "audio" && mediaUrl ? (
                                <audio controls src={mediaUrl} />
                              ) : messageType === "video" && mediaUrl ? (
                                <video controls src={mediaUrl} className="mobile-thread-media" />
                              ) : messageType === "document" && mediaUrl ? (
                                <a href={mediaUrl} target="_blank" rel="noreferrer">
                                  {t("leads.downloadAttachment")}
                                </a>
                              ) : (
                                <p>
                                  {messageText ||
                                    (messageType === "image"
                                      ? t("leads.photoMessage")
                                      : messageType === "audio"
                                        ? t("leads.voiceMessage")
                                        : messageType === "video"
                                          ? t("leads.videoMessage")
                                          : messageType === "document"
                                            ? t("leads.documentMessage")
                                            : t("leads.messageFallback"))}
                                </p>
                              )}

                              <span>
                                {formatTimeAgo(message.created_at || message.createdAt)}
                              </span>
                            </div>

                            {isOutbound && (
                              <div className="mobile-thread-message-status">
                                <CheckCheck size={22} />
                              </div>
                            )}
                          </article>
                        );
                      })
                  ) : (
                    <div className="mobile-thread-empty">{t("leads.noMessages")}</div>
                  )}
                </div>
              )}

              {mobileConversationTab === "notes" && (
                <div className="mobile-tab-simple-content">
                  <FileText size={22} />
                  <div>
                    <strong>Notes</strong>
                    <p>{selectedLead?.notes || "No notes available for this lead."}</p>
                  </div>
                </div>
              )}

              {["emails", "calls", "tasks"].includes(mobileConversationTab) && (
                <div className="mobile-event-list">
                  {leadEvents.filter((event) => {
                    const type = String(event?.eventType || "").toLowerCase();
                    if (mobileConversationTab === "emails") return type.includes("email");
                    if (mobileConversationTab === "calls") return type.includes("call");
                    return type.includes("task");
                  }).length ? (
                    leadEvents
                      .filter((event) => {
                        const type = String(event?.eventType || "").toLowerCase();
                        if (mobileConversationTab === "emails") return type.includes("email");
                        if (mobileConversationTab === "calls") return type.includes("call");
                        return type.includes("task");
                      })
                      .map((event) => (
                        <div className="mobile-event-row" key={event.id}>
                          <div>
                            {mobileConversationTab === "emails" ? (
                              <Mail size={18} />
                            ) : mobileConversationTab === "calls" ? (
                              <Phone size={18} />
                            ) : (
                              <FileText size={18} />
                            )}
                          </div>
                          <div>
                            <strong>
                              {event.metadata?.title ||
                                event.eventType?.replaceAll("_", " ") ||
                                "Activity"}
                            </strong>
                            <p>
                              {event.metadata?.sub ||
                                event.metadata?.description ||
                                formatLeadEventDate(event.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="mobile-thread-empty">No activity available.</div>
                  )}
                </div>
              )}

              {mobileConversationTab === "files" && (
                <div className="mobile-event-list">
                  {leadMessages.filter((message) =>
                    ["image", "audio", "video", "document"].includes(
                      String(message.message_type || "text").toLowerCase(),
                    ),
                  ).length ? (
                    leadMessages
                      .filter((message) =>
                        ["image", "audio", "video", "document"].includes(
                          String(message.message_type || "text").toLowerCase(),
                        ),
                      )
                      .map((message) => (
                        <div className="mobile-event-row" key={message.id || message.message_id}>
                          <div><Paperclip size={18} /></div>
                          <div>
                            <strong>{message.message_type || "Attachment"}</strong>
                            <p>{formatLeadEventDate(message.created_at || message.createdAt)}</p>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="mobile-thread-empty">No files available.</div>
                  )}
                </div>
              )}

              <div className="mobile-lead-composer">
                <div className="mobile-lead-composer-top">
                  <input
                    placeholder="Type a message or use AI Assist..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && !sendingLeadMessage) {
                        e.preventDefault();
                        sendLeadMessage();
                      }
                    }}
                  />

                  <button
                    type="button"
                    className="mobile-ai-assist-btn"
                    onClick={generateAiAssistMessage}
                    disabled={!selectedLead}
                  >
                    <Sparkles size={20} />
                    <span>AI Assist</span>
                  </button>

                  <button
                    type="button"
                    className="mobile-send-message-btn"
                    onClick={sendLeadMessage}
                    disabled={!chatMessage.trim() || sendingLeadMessage}
                  >
                    <Send size={20} />
                  </button>
                </div>

                <div className="mobile-lead-composer-tools">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker((prev) => !prev)}
                    disabled={!selectedLead}
                  >
                    <Smile size={19} />
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!selectedLead || uploadingChatFile}
                  >
                    <Paperclip size={19} />
                  </button>

                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={!selectedLead || uploadingChatFile}
                  >
                    <ImageIcon size={19} />
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!selectedLead || uploadingChatFile}
                  >
                    <FileText size={19} />
                  </button>

                  <button
                    type="button"
                    onClick={toggleVoiceRecording}
                    disabled={!selectedLead || uploadingChatFile}
                  >
                    <Mic size={19} />
                  </button>
                </div>
              </div>
            </section>
          

            {/* LEAD INTELLIGENCE - ALWAYS VISIBLE ON MOBILE */}
          <div className="mobile-insights-screen">


            <section className="mobile-insight-card mobile-intelligence-card">
              <div className="mobile-insight-heading centered">
                <Brain size={27} />
                <div>
                  <h3>AI Lead Intelligence</h3>
                  <p>AI insights and lead analysis</p>
                </div>
              </div>

              <div className="mobile-intelligence-grid">
                <div className="mobile-ai-score-block">
                  <div className="mobile-ai-score-ring">
                    <strong>{leadIntelligence.score}</strong>
                  </div>
                  <span>AI Score</span>
                  <b>{translateTemperature(leadIntelligence.temperature)}</b>
                </div>

                <div className="mobile-intel-metric metric-purple">
                  <Target size={31} />
                  <span>Intent</span>
                  <strong>{leadIntelligence.interestLevel}</strong>
                </div>

                <div className="mobile-intel-metric metric-green">
                  <TrendingUp size={31} />
                  <span>Response Likelihood</span>
                  <strong>{leadIntelligence.responseLikelihood}</strong>
                </div>

                <div className="mobile-intel-metric metric-orange">
                  <CircleAlert size={31} />
                  <span>Sentiment</span>
                  <strong>{leadIntelligence.sentiment}</strong>
                </div>

                <div className="mobile-intel-metric metric-pink">
                  <Ghost size={31} />
                  <span>Ghost Risk</span>
                  <strong>{leadIntelligence.ghostRisk}</strong>
                </div>
              </div>
            </section>

            <section className="mobile-insight-card mobile-recommended-card">
              <div className="mobile-recommended-icon">
                <WandSparkles size={28} />
              </div>
              <div className="mobile-recommended-copy">
                <h3>{t("leads.recommendedAction")}</h3>
                <p>{leadIntelligence.recommendedAction}</p>
              </div>
              <button type="button" className="mobile-card-arrow">
                <ArrowRight size={20} />
              </button>
            </section>

            <section className="mobile-insight-card mobile-revenue-card">
              <div className="mobile-insight-heading centered">
                <DollarSign size={25} />
                <div>
                  <h3>{t("leads.revenueIntelligence")}</h3>
                  <p>Key deal and revenue insights</p>
                </div>
              </div>

              <div className="mobile-revenue-grid">
                <div className="mobile-revenue-box revenue-green">
                  <span className="mobile-revenue-icon"><DollarSign size={22} /></span>
                  <small>{t("leads.dealValue")}</small>
                  <strong>{leadIntelligence.expectedRevenue}</strong>
                  <p>{selectedLead?.priority || "High"}</p>
                </div>

                <div className="mobile-revenue-box revenue-blue">
                  <span className="mobile-revenue-icon"><TrendingUp size={22} /></span>
                  <small>{t("leads.closeProbability")}</small>
                  <strong>{leadIntelligence.closeProbability}</strong>
                  <p>{translateTemperature(leadIntelligence.temperature)}</p>
                </div>

                <div className="mobile-revenue-box revenue-orange">
                  <span className="mobile-revenue-icon"><Flag size={22} /></span>
                  <small>{t("leads.pipelineStage")}</small>
                  <strong>{selectedLead?.dealStage || "new"}</strong>
                  <p>{selectedLead?.status || "Active"}</p>
                </div>

                <div className="mobile-revenue-box revenue-purple">
                  <span className="mobile-revenue-icon"><Calendar size={22} /></span>
                  <small>{t("leads.timeline")}</small>
                  <strong>{leadIntelligence.timeline}</strong>
                  <p>{selectedLead?.status || "Active"}</p>
                </div>
              </div>
            </section>

            <section className="mobile-insight-card mobile-automation-card">
              <div className="mobile-insight-heading centered">
                <Bot size={27} />
                <div>
                  <h3>{t("leads.aiAutomationControls")}</h3>
                  <p>{t("leads.manageAiActions")}</p>
                </div>
              </div>

              <div className="mobile-automation-grid">
                {automationItems.map((item, idx) => {
                  const isActive = getAutomationStatus(item.type);
                  return (
                    <div className={`mobile-automation-tile automation-tile-${idx + 1}`} key={item.type || idx}>
                      <span className="mobile-automation-tile-icon">{item.icon}</span>
                      <strong>{item.title}</strong>
                      <div className={`mobile-automation-switch ${isActive ? "active" : ""}`}>
                        <span>{isActive ? "ON" : "OFF"}</span>
                        <i />
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                className="mobile-manage-automation"
                onClick={() => setShowAutomationModal(true)}
              >
                <Settings2 size={17} />
                <span>Manage All Automation</span>
                <ArrowRight size={17} />
              </button>
            </section>

            <section className="mobile-insight-card mobile-timeline-card">
              <div className="mobile-timeline-head">
                <div className="mobile-insight-heading centered">
                  <Workflow size={25} />
                  <div>
                    <h3>{t("leads.leadJourneyTimeline")}</h3>
                    <p>Timeline of lead interactions and activities</p>
                  </div>
                </div>

                <button type="button" className="mobile-card-arrow" onClick={openFullTimeline}>
                  <ArrowRight size={20} />
                </button>
              </div>

              <div className="mobile-timeline-list">
                {leadEventsLoading ? (
                  <div className="mobile-timeline-empty">{t("leads.loadingTimeline")}</div>
                ) : leadEvents.length ? (
                  leadEvents.slice(0, 5).map((event, idx) => (
                    <div className={`mobile-timeline-row timeline-color-${(idx % 5) + 1}`} key={event.id}>
                      <div className="mobile-timeline-time">
                        <span>{formatLeadEventDate(event.createdAt)}</span>
                      </div>
                      <span className="mobile-timeline-dot" />
                      <div className="mobile-timeline-event-icon">
                        {idx === 0 ? <MessageCircle size={17} /> :
                         idx === 1 ? <Eye size={17} /> :
                         idx === 2 ? <Mail size={17} /> :
                         idx === 3 ? <Flag size={17} /> :
                         <Users size={17} />}
                      </div>
                      <div className="mobile-timeline-event-copy">
                        <strong>
                          {event.metadata?.title ||
                            event.eventType?.replaceAll("_", " ") ||
                            t("leads.leadActivity")}
                        </strong>
                        <p>
                          {event.metadata?.sub ||
                            event.metadata?.description ||
                            t("leads.leadUpdated")}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="mobile-timeline-row timeline-color-5">
                    <div className="mobile-timeline-time"><span>—</span></div>
                    <span className="mobile-timeline-dot" />
                    <div className="mobile-timeline-event-icon"><Users size={17} /></div>
                    <div className="mobile-timeline-event-copy">
                      <strong>{t("leads.leadCreated")}</strong>
                      <p>{t("leads.noEventYet")}</p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
</div>

          <div className="desktop-conversation-stack">
          <div className="mobile-conversation-topbar">
            <button
              type="button"
              className="mobile-conversation-back"
              onClick={() => setMobileLeadScreen("inbox")}
              aria-label="Back to leads"
            >
              <ArrowLeft size={21} />
            </button>

            <div className="mobile-conversation-title">
              <strong>Lead Conversation</strong>
              <span>
                Lead ID: {selectedLead?.id ? String(selectedLead.id).slice(0, 8) : "—"}
              </span>
            </div>

            <div className="mobile-conversation-top-actions">
              <button type="button" onClick={callSelectedLead}>
                <Phone size={18} />
              </button>
              <button type="button">
                <MoreHorizontal size={20} />
              </button>
            </div>
          </div>

          <div className="conversation-header">
            <div className="conversation-user">
              <div className="lead-avatar large avatar-whatsapp">
                {getInitials(selectedLead?.name)}
              </div>
              <div>
                <h3 className="user-status-title">
                  {selectedLead?.name || t("leads.selectALead")}{" "}
                  <span className="status-online">● {t("leads.online")}</span>
                </h3>
                <p className="user-sub-info">
                  {selectedLead?.phone ||
                    selectedLead?.email ||
                    t("leads.noContactInfo")}{" "}
                  • {selectedLead?.source || "CRM"}
                </p>
              </div>
            </div>

            <div className="mobile-conversation-status">
              <select
                value={selectedLead?.status || "new"}
                onChange={(e) => updateSelectedLead({ status: e.target.value })}
                disabled={!selectedLead}
              >
                <option value="new">{t("leads.optNew")}</option>
                <option value="contacted">{t("leads.contacted")}</option>
                <option value="qualified">{t("leads.optQualified")}</option>
                <option value="follow-up">{t("leads.optFollowUp")}</option>
                <option value="closed-won">{t("leads.optClosedWon")}</option>
                <option value="closed-lost">{t("leads.optClosedLost")}</option>
              </select>
              <ChevronDown size={16} />
            </div>

            <div className="mobile-conversation-metrics">
              <div className="mobile-conversation-metric">
                <span>AI Score</span>
                <strong>{selectedLead ? getLeadScore(selectedLead) : "--"}</strong>
              </div>
              <div className="mobile-conversation-metric">
                <span>Priority</span>
                <strong>
                  <i className={`mobile-priority-dot mobile-priority-${String(
                    selectedLead?.priority || "medium",
                  ).toLowerCase()}`} />
                  {selectedLead?.priority || "Medium"}
                </strong>
              </div>
              <div className="mobile-conversation-metric">
                <span>Temp.</span>
                <strong className={`mobile-temp-${String(
                  selectedLead ? getLeadTemperature(selectedLead) : "cool",
                ).toLowerCase()}`}>
                  <Flame size={14} />
                  {selectedLead
                    ? translateTemperature(getLeadTemperature(selectedLead))
                    : "--"}
                </strong>
              </div>
              <div className="mobile-conversation-metric">
                <span>Status</span>
                <strong className={`mobile-status-text-${getMobileLeadStatusClass(
                  selectedLead?.status,
                )}`}>
                  {selectedLead?.status || "new"}
                </strong>
              </div>
            </div>

            <div className="conversation-actions">
              <button
                type="button"
                className="icon-btn"
                onClick={callSelectedLead}
                title={t("leads.callLeadTitle")}
              >
                <Phone size={16} />
              </button>

              <button
                type="button"
                className="icon-btn"
                disabled
                title={t("leads.videoUnavailableTitle")}
              >
                <Video size={16} />
              </button>

              <button
                type="button"
                className={`lead-contact-action-btn ${
                  selectedLead?.contactId ? "linked" : ""
                }`}
                onClick={handleLeadContactAction}
                disabled={!selectedLead || convertingLead}
                title={
                  selectedLead?.contactId
                    ? t("leads.openLinkedContactTitle")
                    : t("leads.convertToContactTitle")
                }
              >
                {convertingLead ? (
                  <>
                    <span className="lead-contact-action-spinner" />
                    {t("leads.converting")}
                  </>
                ) : selectedLead?.contactId ? (
                  <>
                    <Users size={16} />
                    {t("leads.openContact")}
                  </>
                ) : (
                  <>
                    <Users size={16} />
                    {t("leads.convertToContact")}
                  </>
                )}
              </button>

              <div
                className="score-badge"
                role="button"
                tabIndex={0}
                onClick={openScoreDetails}
                title={t("leads.viewScoreDetailsTitle")}
                style={{ cursor: "pointer" }}
              >
                <span className="score-value">
                  {selectedLead ? `${getLeadScore(selectedLead)}%` : "--"}
                </span>
                <span className="score-label">{t("leads.scoreLabel")}</span>
              </div>
              <span className="hot-tag text-tag-align">
                {selectedLead
                  ? t("leads.temperatureLead", {
                      temperature: translateTemperature(
                        getLeadTemperature(selectedLead),
                      ),
                    })
                  : t("leads.noLead")}
              </span>
              <button
                type="button"
                onClick={markSelectedLeadNoLead}
                title={t("leads.markNoLeadTitle")}
                style={{
                  padding: "6px 12px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#9b2c2c",
                  background: "#fdf3f3",
                  border: "1px solid #f0c2c2",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                {t("leads.noLead")}
              </button>
            </div>
          </div>
          <div className="lead-control-row">
            <div className="lead-control-field">
              <label>{t("leads.status")}</label>
              <select
                value={selectedLead?.status || "new"}
                onChange={(e) => updateSelectedLead({ status: e.target.value })}
                disabled={!selectedLead}
              >
                <option value="new">{t("leads.optNew")}</option>
                <option value="contacted">{t("leads.contacted")}</option>
                <option value="qualified">{t("leads.optQualified")}</option>
                <option value="follow-up">{t("leads.optFollowUp")}</option>
                <option value="closed-won">{t("leads.optClosedWon")}</option>
                <option value="closed-lost">{t("leads.optClosedLost")}</option>
              </select>
            </div>

            <div className="lead-control-field">
              <label>{t("leads.priority")}</label>
              <select
                value={selectedLead?.priority || "low"}
                onChange={(e) =>
                  updateSelectedLead({ priority: e.target.value })
                }
                disabled={!selectedLead}
              >
                <option value="low">{t("leads.optLow")}</option>
                <option value="medium">{t("leads.optMedium")}</option>
                <option value="high">{t("leads.optHigh")}</option>
              </select>
            </div>
          </div>
          {leadActionMessage && (
            <div
              className={`lead-action-message ${
                leadActionMessage.toLowerCase().includes("failed")
                  ? "error"
                  : "success"
              }`}
            >
              <span>{leadActionMessage}</span>
              <button
                type="button"
                onClick={() => setLeadActionMessage("")}
                aria-label={t("leads.closeMessage")}
              >
                ×
              </button>
            </div>
          )}
          {/* AI SUMMARY */}
          <div className="ai-summary">
            <div className="summary-icon">
              <Brain size={18} />
            </div>
            <div className="summary-text-box">
              <h4>{t("leads.aiLeadSummary")}</h4>
              <p>
                {conversationIntelligenceLoading
                  ? t("leads.analyzingConversation")
                  : leadIntelligence.summary}
              </p>
            </div>
            <button
              className="view-profile-btn"
              onClick={openLeadProfile}
              disabled={!selectedLead}
            >
              {t("leads.viewProfile")}
            </button>
          </div>

          <div className="mobile-handling-tabs">
            <button
              type="button"
              className={mobileHandlingMode === "ai" ? "active" : ""}
              onClick={() => setMobileHandlingMode("ai")}
            >
              <Sparkles size={17} />
              <span>AI Handling</span>
            </button>

            <button
              type="button"
              className={mobileHandlingMode === "human" ? "active" : ""}
              onClick={() => setMobileHandlingMode("human")}
            >
              <Users size={17} />
              <span>Human Handling</span>
            </button>

            <button
              type="button"
              className={mobileHandlingMode === "shared" ? "active" : ""}
              onClick={() => setMobileHandlingMode("shared")}
            >
              <Users size={17} />
              <span>Shared</span>
            </button>
          </div>

          {/* CHAT BODY */}
          <div className="chat-body" ref={chatBodyRef}>
            <div className="mobile-chat-day-badge">Today</div>
            {leadMessagesLoading ? (
              <div className="message left">
                <p>{t("leads.loadingMessages")}</p>
              </div>
            ) : leadMessages.length ? (
              leadMessages
                .slice()
                .sort((a, b) => {
                  return (
                    new Date(a.created_at || a.createdAt).getTime() -
                    new Date(b.created_at || b.createdAt).getTime()
                  );
                })
                .map((message) => {
                  const isOutbound =
                    message.direction === "outbound" ||
                    message.sender_type === "agent" ||
                    message.sender_type === "ai";

                  const isAi = message.sender_type === "ai";

                  const messageText = String(
                    message.body || message.message || message.text || "",
                  ).trim();

                  const messageType = String(
                    message.message_type || "text",
                  ).toLowerCase();

                  const mediaUrl =
                    message.media_url ||
                    message.file_url ||
                    message.url ||
                    null;

                  return (
                    <div
                      key={
                        message.id ||
                        message.message_id ||
                        `${message.direction}-${message.created_at}-${message.body}`
                      }
                      className={`message ${
                        isOutbound ? "right robot-msg-container" : "left"
                      }`}
                    >
                      {messageType === "image" && mediaUrl ? (
                        <a href={mediaUrl} target="_blank" rel="noreferrer">
                          <img
                            src={mediaUrl}
                            alt={t("leads.whatsappAttachment")}
                            className="chat-image-preview"
                          />
                        </a>
                      ) : messageType === "audio" && mediaUrl ? (
                        <audio controls src={mediaUrl} />
                      ) : messageType === "video" && mediaUrl ? (
                        <video
                          controls
                          src={mediaUrl}
                          className="chat-video-preview"
                        />
                      ) : messageType === "document" && mediaUrl ? (
                        <a href={mediaUrl} target="_blank" rel="noreferrer">
                          {t("leads.downloadAttachment")}
                        </a>
                      ) : (
                        <p>
                          {messageText ||
                            (messageType === "image"
                              ? t("leads.photoMessage")
                              : messageType === "audio"
                                ? t("leads.voiceMessage")
                                : messageType === "video"
                                  ? t("leads.videoMessage")
                                  : messageType === "document"
                                    ? t("leads.documentMessage")
                                    : t("leads.messageFallback"))}
                        </p>
                      )}

                      <span
                        className={
                          isOutbound ? "msg-status-right" : "msg-status-left"
                        }
                      >
                        {formatLeadEventDate(
                          message.created_at || message.createdAt,
                        )}

                        {isOutbound && <> {renderMessageStatus(message)}</>}
                      </span>

                      {isAi && <div className="robot-badge-icon">🤖</div>}
                    </div>
                  );
                })
            ) : (
              <div className="message left">
                <p>{t("leads.noMessages")}</p>
                <span>{t("leads.startConversation")}</span>
              </div>
            )}
          </div>

          {/* AI SUGGESTED REPLIES */}
          <div className="suggested-replies-container">
            <div className="suggested-title">
              <span>
                <Sparkles size={12} /> {t("leads.aiSuggestedReplies")}
              </span>
              <button type="button" className="mobile-suggested-more">
                See more
              </button>
            </div>
            <div className="suggested-chips-scroll">
              {aiSuggestedReplies.map((reply, index) => (
                <button
                  className="chip-btn"
                  type="button"
                  key={`${reply}-${index}`}
                  onClick={() => setChatMessage(reply)}
                >
                  {reply}
                </button>
              ))}
            </div>
          </div>

          {/* INPUT FORM */}
          <div className="chat-input-box">
            <div className="chat-input-top">
              {isRecording ? (
                <div className="voice-recording-inline">
                  <button
                    type="button"
                    className="voice-cancel-btn"
                    onClick={cancelVoiceRecording}
                  >
                    {t("leads.cancel")}
                  </button>

                  <span className="recording-dot"></span>

                  <strong>{formatRecordTime(recordSeconds)}</strong>

                  <span>{t("leads.recording")}</span>

                  <button
                    type="button"
                    className="voice-send-btn"
                    onClick={finishVoiceRecording}
                  >
                    {t("leads.send")}
                  </button>
                </div>
              ) : (
                <input
                  placeholder={t("leads.chatPlaceholder")}
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      !e.shiftKey &&
                      !sendingLeadMessage
                    ) {
                      e.preventDefault();
                      sendLeadMessage();
                    }
                  }}
                />
              )}
            </div>

            <div className="chat-input-bottom">
              <div className="chat-util-icons">
                <button
                  type="button"
                  className="util-icon-btn"
                  onClick={() => setShowEmojiPicker((prev) => !prev)}
                  disabled={!selectedLead}
                >
                  <Smile size={18} />
                </button>

                <button
                  type="button"
                  className="util-icon-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!selectedLead || uploadingChatFile}
                >
                  <Paperclip size={18} />
                </button>

                <button
                  type="button"
                  className="util-icon-btn"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={!selectedLead || uploadingChatFile}
                >
                  <ImageIcon size={18} />
                </button>

                <button
                  type="button"
                  className={`util-icon-btn ${isRecording ? "recording" : ""}`}
                  onClick={toggleVoiceRecording}
                  disabled={!selectedLead || uploadingChatFile}
                >
                  <Mic size={18} />
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    uploadLeadChatFile(file);
                    e.target.value = "";
                  }}
                />

                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    uploadLeadChatFile(file);
                    e.target.value = "";
                  }}
                />

                <input
                  ref={audioInputRef}
                  type="file"
                  accept="audio/*"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    uploadLeadChatFile(file);
                    e.target.value = "";
                  }}
                />
              </div>

              <div className="chat-action-buttons">
                <button
                  className="secondary-btn ai-btn assist-btn-custom"
                  onClick={generateAiAssistMessage}
                  disabled={!selectedLead}
                >
                  <Sparkles size={14} />
                  {t("leads.aiAssist")}
                </button>
                <button
                  className="send-btn fixed-send-btn"
                  onClick={sendLeadMessage}
                  disabled={!chatMessage.trim() || sendingLeadMessage}
                >
                  <Send size={16} fill="white" />
                </button>
              </div>
            </div>
          </div>
          {showEmojiPicker && (
            <div className="emoji-picker-wrap">
              <EmojiPicker
                onEmojiClick={(emojiData) => {
                  setChatMessage((prev) => `${prev}${emojiData.emoji}`);
                }}
              />
            </div>
          )}
          {/* QUICK CHAT ACTIONS */}
          <div className="quick-actions-grid">
            {[
              {
                title: t("leads.aiFollowUp"),
                desc: t("leads.aiFollowUpDesc"),
                icon: <Send size={14} color="#22c55e" />,
                bgClass: "icon-bg-green",
                onClick: openAiFollowUp,
              },
              {
                title: t("leads.bookShowing"),
                desc: t("leads.bookShowingDesc"),
                icon: <Calendar size={14} color="#2563eb" />,
                bgClass: "icon-bg-blue",
                onClick: openBookShowing,
              },
              {
                title: t("leads.sendProperties"),
                desc: t("leads.sendPropertiesDesc"),
                icon: <Home size={14} color="#0284c7" />,
                bgClass: "icon-bg-sky",
                onClick: openSendProperties,
              },
              {
                title: t("leads.escalateLead"),
                desc: t("leads.escalateLeadDesc"),
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
        </div>

        {/* RIGHT PANEL - INSIGHTS & CONTROLS */}
        <div className="insights-panel">


          <div className="desktop-insights-stack">
          {/* BOX 1: LEAD INTELLIGENCE */}
          <div className="insight-card">
            <div className="panel-header">
              <h3>{t("leads.leadIntelligenceTitle")}</h3>
              <span className="hot-tag">
                {t("leads.temperatureLead", {
                  temperature: translateTemperature(
                    leadIntelligence.temperature,
                  ),
                })}
              </span>
            </div>
            {conversationIntelligenceLoading && (
              <p className="panel-header-desc">
                {t("leads.analyzingConversation")}
              </p>
            )}

            <div className="insight-wrap">
              <div className="score-circle">
                <div>
                  <h2>{leadIntelligence.score}%</h2>
                  <span>{t("leads.aiScore")}</span>
                </div>
              </div>

              <div className="insight-list">
                <div className="insight-row">
                  <span>{t("leads.sentiment")}</span>
                  <strong>{leadIntelligence.sentiment}</strong>
                </div>

                <div className="insight-row">
                  <span>{t("leads.intent")}</span>
                  <strong>{leadIntelligence.interestLevel}</strong>
                </div>

                <div className="insight-row">
                  <span>{t("leads.responseLikelihood")}</span>
                  <strong>{leadIntelligence.responseLikelihood}</strong>
                </div>

                <div className="insight-row">
                  <span>{t("leads.ghostRisk")}</span>
                  <strong>{leadIntelligence.ghostRisk}</strong>
                </div>
              </div>
            </div>

            <div className="lead-ai-summary">
              <strong>{t("leads.recommendedAction")}</strong>
              <p>{leadIntelligence.recommendedAction}</p>
            </div>
          </div>

          {/* BOX 2: REVENUE INTELLIGENCE */}
          <div className="insight-card">
            <div className="panel-header header-spacing">
              <h3>{t("leads.revenueIntelligence")}</h3>
            </div>
            <div className="revenue-grid">
              <div className="revenue-box">
                <span className="revenue-label">{t("leads.dealValue")}</span>
                <strong className="revenue-val-green">
                  {leadIntelligence.expectedRevenue}
                </strong>
              </div>

              <div className="revenue-box">
                <span className="revenue-label">
                  {t("leads.closeProbability")}
                </span>
                <strong className="revenue-val-blue">
                  {leadIntelligence.closeProbability}
                </strong>
              </div>

              <div className="revenue-box">
                <span className="revenue-label">{t("leads.timeline")}</span>
                <strong className="revenue-val-dark">
                  {leadIntelligence.timeline}
                </strong>
              </div>

              <div className="revenue-box">
                <span className="revenue-label">
                  {t("leads.pipelineStage")}
                </span>
                <strong className="revenue-val-orange">
                  {selectedLead?.dealStage || "new"}
                </strong>
              </div>
            </div>
          </div>

          {/* BOX 3: AI AUTOMATION CONTROLS */}
          <div className="insight-card automation-card-custom">
            <div className="panel-header automation-header">
              <div>
                <h3>{t("leads.aiAutomationControls")}</h3>
                <p className="panel-header-desc">
                  {t("leads.manageAiActions")}
                </p>
              </div>
              <button
                className="manage-all-link"
                onClick={() => setShowAutomationModal(true)}
              >
                {t("leads.manageAll")}
              </button>
            </div>

            <div className="automation-list automation-list-spacing">
              {automationItems.map((item, idx) => {
                const isActive = getAutomationStatus(item.type);

                return (
                  <div className="automation-row-custom" key={idx}>
                    <div className="automation-left-group">
                      <span className="automation-row-icon">{item.icon}</span>
                      <h4 className="automation-item-title">{item.title}</h4>
                    </div>

                    <div className="automation-right-group">
                      <span
                        className={
                          isActive
                            ? "status-active-text"
                            : "status-inactive-text"
                        }
                      >
                        {isActive ? t("leads.active") : t("leads.inactive")}
                      </span>
                      <div
                        className={`switch ${isActive ? "active" : ""}`}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* BOX 4: LEAD JOURNEY TIMELINE */}
          <div className="insight-card">
            <div className="panel-header header-spacing">
              <h3>{t("leads.leadJourneyTimeline")}</h3>
            </div>

            <div className="timeline-container">
              <div className="timeline-vertical-line"></div>

              {leadEventsLoading ? (
                <div className="timeline-item">
                  <div className="timeline-dot dot-blue"></div>
                  <div className="timeline-content">
                    <p className="timeline-desc">
                      {t("leads.loadingTimeline")}
                    </p>
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
                            t("leads.leadActivity")}
                        </h5>
                        <span className="timeline-time">
                          {formatLeadEventDate(event.createdAt)}
                        </span>
                      </div>
                      <p className="timeline-desc">
                        {event.metadata?.sub ||
                          event.metadata?.description ||
                          t("leads.leadUpdated")}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="timeline-item">
                  <div className="timeline-dot dot-green"></div>
                  <div className="timeline-content">
                    <div className="timeline-content-top">
                      <h5 className="timeline-title">
                        {t("leads.leadCreated")}
                      </h5>
                    </div>
                    <p className="timeline-desc">{t("leads.noEventYet")}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="timeline-footer">
              <button className="full-timeline-btn" onClick={openFullTimeline}>
                {t("leads.fullTimeline")} <ArrowRight size={12} />
              </button>
            </div>
          </div>
          </div>
        </div>
      </div>
      {showScoreModal && selectedLead && (
        <div
          className="lead-modal-overlay"
          onClick={() => setShowScoreModal(false)}
        >
          <div
            className="lead-score-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#ffffff",
              borderRadius: 14,
              width: "min(460px, 92vw)",
              maxHeight: "86vh",
              overflowY: "auto",
              padding: 24,
              boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                {t("leads.aiLeadScore")}
              </h3>
              <button
                type="button"
                onClick={() => setShowScoreModal(false)}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: 22,
                  lineHeight: 1,
                  cursor: "pointer",
                  color: "#6b7280",
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginBottom: 20,
              }}
            >
              <div
                style={{ fontSize: 40, fontWeight: 800, color: "#111827" }}
              >
                {getLeadScore(selectedLead)}%
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {t("leads.temperatureLeadLower", {
                    temperature: translateTemperature(
                      getLeadTemperature(selectedLead),
                    ),
                  })}
                </div>
                <div style={{ fontSize: 12.5, color: "#6b7280" }}>
                  {selectedLead.name || t("leads.thisLeadName")}
                </div>
              </div>
            </div>

            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                color: "#6b7280",
                marginBottom: 10,
              }}
            >
              {t("leads.whyThisScore")}
            </div>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {[
                {
                  label: t("leads.priority"),
                  value: selectedLead.priority || t("leads.notSet"),
                  positive: selectedLead.priority === "high",
                },
                {
                  label: t("leads.stage"),
                  value: selectedLead.status || "new",
                  positive: ["qualified", "follow-up", "closed-won"].includes(
                    String(selectedLead.status || ""),
                  ),
                },
                {
                  label: t("leads.phoneOnFile"),
                  value: selectedLead.phone ? t("leads.yes") : t("leads.no"),
                  positive: Boolean(selectedLead.phone),
                },
                {
                  label: t("leads.emailOnFile"),
                  value: selectedLead.email ? t("leads.yes") : t("leads.no"),
                  positive: Boolean(selectedLead.email),
                },
                {
                  label: t("leads.dealValue"),
                  value: selectedLead.dealValue
                    ? `$${Number(selectedLead.dealValue).toLocaleString()}`
                    : t("leads.none"),
                  positive: Boolean(selectedLead.dealValue),
                },
                {
                  label: t("leads.source"),
                  value: selectedLead.source || t("leads.unknown"),
                  positive: Boolean(selectedLead.source),
                },
                {
                  label: t("leads.sentiment"),
                  value: leadIntelligence?.sentiment || t("leads.unknown"),
                  positive: false,
                },
                {
                  label: t("leads.responseLikelihood"),
                  value:
                    leadIntelligence?.responseLikelihood || t("leads.unknown"),
                  positive: false,
                },
              ].map((f) => (
                <li
                  key={f.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "9px 12px",
                    background: "#f7f8fa",
                    border: "1px solid #eceef1",
                    borderRadius: 8,
                  }}
                >
                  <span style={{ fontSize: 13, color: "#374151" }}>
                    {f.label}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: f.positive ? "#166534" : "#374151",
                      textTransform: "capitalize",
                    }}
                  >
                    {f.value}
                  </span>
                </li>
              ))}
            </ul>

            <p
              style={{
                fontSize: 11.5,
                color: "#9ca3af",
                marginTop: 14,
                marginBottom: 0,
              }}
            >
              {t("leads.scoreExplanation")}
            </p>
          </div>
        </div>
      )}
      {showTimelineModal && (
        <div className="lead-modal-overlay">
          <div
            className="lead-timeline-modal"
            onScroll={(e) => {
              const el = e.currentTarget;
              const nearBottom =
                el.scrollTop + el.clientHeight >= el.scrollHeight - 40;

              if (nearBottom) {
                loadMoreFullTimeline();
              }
            }}
          >
            <div className="lead-modal-header">
              <h3>{t("leads.fullLeadTimeline")}</h3>
              <button onClick={() => setShowTimelineModal(false)}>✕</button>
            </div>

            <div className="timeline-container">
              <div className="timeline-vertical-line"></div>

              {fullLeadEvents.length ? (
                fullLeadEvents.map((event) => (
                  <div key={event.id} className="timeline-item">
                    <div className="timeline-dot dot-blue"></div>
                    <div className="timeline-content">
                      <div className="timeline-content-top">
                        <h5 className="timeline-title">
                          {event.metadata?.title || t("leads.leadActivity")}
                        </h5>
                        <span className="timeline-time">
                          {formatLeadEventDate(event.createdAt)}
                        </span>
                      </div>
                      <p className="timeline-desc">
                        {event.metadata?.sub || t("leads.leadUpdated")}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="timeline-desc">{t("leads.noTimeline")}</p>
              )}

              {fullTimelineLoading && (
                <p className="timeline-desc">{t("leads.loadingMore")}</p>
              )}

              {!fullTimelineHasMore && fullLeadEvents.length > 0 && (
                <p className="timeline-desc">{t("leads.endOfTimeline")}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {showBookShowingModal && (
        <div className="lead-modal-overlay">
          <div className="lead-timeline-modal">
            <div className="lead-modal-header">
              <h3>{t("leads.bookShowing")}</h3>
              <button onClick={() => setShowBookShowingModal(false)}>✕</button>
            </div>

            <form onSubmit={submitBookShowing}>
              <div className="lead-form-grid">
                <div className="lead-form-field">
                  <label>{t("leads.date")}</label>
                  <input
                    type="date"
                    required
                    value={showingForm.date}
                    onChange={(e) =>
                      setShowingForm({ ...showingForm, date: e.target.value })
                    }
                  />
                </div>

                <div className="lead-form-field">
                  <label>{t("leads.time")}</label>
                  <input
                    type="time"
                    required
                    value={showingForm.time}
                    onChange={(e) =>
                      setShowingForm({ ...showingForm, time: e.target.value })
                    }
                  />
                </div>

                <div className="lead-form-field full">
                  <label>{t("leads.note")}</label>
                  <textarea
                    rows="4"
                    value={showingForm.note}
                    onChange={(e) =>
                      setShowingForm({ ...showingForm, note: e.target.value })
                    }
                    placeholder={t("leads.showingNotePlaceholder")}
                  />
                </div>
              </div>

              <div className="lead-modal-actions">
                <button
                  type="button"
                  onClick={() => setShowBookShowingModal(false)}
                >
                  {t("leads.cancel")}
                </button>

                <button type="submit">{t("leads.bookShowing")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSendPropertiesModal && (
        <div className="lead-modal-overlay">
          <div className="lead-timeline-modal">
            <div className="lead-modal-header">
              <h3>{t("leads.sendProperties")}</h3>
              <button onClick={() => setShowSendPropertiesModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={submitSendProperties}>
              <div className="lead-form-grid">
                <div className="lead-form-field full">
                  <label>{t("leads.note")}</label>
                  <textarea
                    rows="4"
                    value={propertiesNote}
                    onChange={(e) => setPropertiesNote(e.target.value)}
                    placeholder={t("leads.propertiesNotePlaceholder")}
                  />
                </div>
              </div>

              <div className="lead-modal-actions">
                <button
                  type="button"
                  onClick={() => setShowSendPropertiesModal(false)}
                >
                  {t("leads.cancel")}
                </button>

                <button type="submit">{t("leads.sendProperties")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showFollowUpModal && (
        <div className="lead-modal-overlay">
          <div className="lead-timeline-modal">
            <div className="lead-modal-header">
              <h3>{t("leads.aiFollowUp")}</h3>
              <button onClick={() => setShowFollowUpModal(false)}>✕</button>
            </div>

            <form onSubmit={submitAiFollowUp}>
              <div className="lead-form-grid">
                <div className="lead-form-field full">
                  <label>{t("leads.message")}</label>
                  <textarea
                    rows="5"
                    value={followUpMessage}
                    onChange={(e) => setFollowUpMessage(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="lead-modal-actions">
                <button
                  type="button"
                  onClick={() => setShowFollowUpModal(false)}
                  disabled={isSubmittingFollowUp}
                >
                  {t("leads.cancel")}
                </button>

                <button
                  type="submit"
                  disabled={
                    isSubmittingFollowUp ||
                    !followUpMessage.trim() ||
                    !selectedLead?.id
                  }
                >
                  {isSubmittingFollowUp
                    ? t("leads.sending")
                    : t("leads.sendFollowUp")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showLeadProfileModal && selectedLead && (
        <div className="lead-modal-overlay">
          <div className="lead-timeline-modal">
            <div className="lead-modal-header">
              <h3>{t("leads.leadProfile")}</h3>
              <button onClick={() => setShowLeadProfileModal(false)}>✕</button>
            </div>

            <form onSubmit={saveLeadProfile}>
              <div className="lead-form-grid">
                <div className="lead-form-field form-group">
                  <label>{t("leads.status")}</label>
                  <select
                    value={leadProfileForm.status}
                    onChange={(e) =>
                      setLeadProfileForm({
                        ...leadProfileForm,
                        status: e.target.value,
                      })
                    }
                  >
                    <option value="new">{t("leads.optNew")}</option>
                    <option value="contacted">{t("leads.contacted")}</option>
                    <option value="qualified">{t("leads.optQualified")}</option>
                    <option value="follow-up">{t("leads.optFollowUp")}</option>
                    <option value="closed-won">{t("leads.optClosedWon")}</option>
                    <option value="closed-lost">{t("leads.optClosedLost")}</option>
                  </select>
                </div>

                <div className="lead-form-field form-group">
                  <label>{t("leads.priority")}</label>
                  <select
                    value={leadProfileForm.priority}
                    onChange={(e) =>
                      setLeadProfileForm({
                        ...leadProfileForm,
                        priority: e.target.value,
                      })
                    }
                  >
                    <option value="low">{t("leads.optLow")}</option>
                    <option value="medium">{t("leads.optMedium")}</option>
                    <option value="high">{t("leads.optHigh")}</option>
                  </select>
                </div>

                <div className="lead-form-field full">
                  <label>{t("leads.notes")}</label>
                  <textarea
                    rows="5"
                    value={leadProfileForm.notes}
                    onChange={(e) =>
                      setLeadProfileForm({
                        ...leadProfileForm,
                        notes: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="lead-modal-actions">
                <button
                  type="button"
                  onClick={() => setShowLeadProfileModal(false)}
                >
                  {t("leads.cancel")}
                </button>

                <button type="submit">{t("leads.saveProfile")}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showAutomationModal && (
        <div className="lead-modal-overlay">
          <div className="lead-timeline-modal">
            <div className="lead-modal-header">
              <h3>{t("leads.aiAutomationControls")}</h3>
              <button onClick={() => setShowAutomationModal(false)}>✕</button>
            </div>

            <div className="automation-modal-list">
              {automationItems.map((item) => {
                const isActive = getAutomationStatus(item.type);

                return (
                  <div className="automation-modal-row" key={item.type}>
                    <div className="automation-left-group">
                      <span className="automation-row-icon">{item.icon}</span>
                      <div>
                        <h4 className="automation-item-title">{item.title}</h4>
                        <p className="automation-item-desc">{item.desc}</p>
                      </div>
                    </div>

                    <div className="automation-right-group">
                      <span
                        className={
                          isActive
                            ? "status-active-text"
                            : "status-inactive-text"
                        }
                      >
                        {isActive ? t("leads.active") : t("leads.inactive")}
                      </span>
                      <div
                        className={`switch ${isActive ? "active" : ""}`}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {showCreateLeadModal && (
        <div className="lead-modal-overlay">
          <div className="lead-timeline-modal">
            <div className="lead-modal-header">
              <h3>{t("leads.newLead")}</h3>
              <button onClick={() => setShowCreateLeadModal(false)}>✕</button>
            </div>

            <form onSubmit={createLead}>
              <div className="lead-form-grid">
                <div className="lead-form-field">
                  <label>{t("leads.name")}</label>
                  <input
                    required
                    value={createLeadForm.name}
                    onChange={(e) =>
                      setCreateLeadForm({
                        ...createLeadForm,
                        name: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="lead-form-field">
                  <label>{t("leads.email")}</label>
                  <input
                    type="email"
                    required
                    value={createLeadForm.email}
                    onChange={(e) =>
                      setCreateLeadForm({
                        ...createLeadForm,
                        email: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="lead-form-field">
                  <label>{t("leads.phone")}</label>
                  <input
                    required
                    value={createLeadForm.phone}
                    onChange={(e) =>
                      setCreateLeadForm({
                        ...createLeadForm,
                        phone: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="lead-form-field">
                  <label>{t("leads.source")}</label>
                  <input
                    value={createLeadForm.source}
                    onChange={(e) =>
                      setCreateLeadForm({
                        ...createLeadForm,
                        source: e.target.value,
                      })
                    }
                    placeholder={t("leads.sourcePlaceholder")}
                  />
                </div>

                <div className="lead-form-field form-group">
                  <label>{t("leads.status")}</label>
                  <select
                    value={createLeadForm.status}
                    onChange={(e) =>
                      setCreateLeadForm({
                        ...createLeadForm,
                        status: e.target.value,
                      })
                    }
                  >
                    <option value="new">{t("leads.optNew")}</option>
                    <option value="contacted">{t("leads.contacted")}</option>
                    <option value="qualified">{t("leads.optQualified")}</option>
                    <option value="follow-up">{t("leads.optFollowUp")}</option>
                    <option value="closed-won">{t("leads.optClosedWon")}</option>
                    <option value="closed-lost">{t("leads.optClosedLost")}</option>
                  </select>
                </div>

                <div className="lead-form-field form-group">
                  <label>{t("leads.priority")}</label>
                  <select
                    value={createLeadForm.priority}
                    onChange={(e) =>
                      setCreateLeadForm({
                        ...createLeadForm,
                        priority: e.target.value,
                      })
                    }
                  >
                    <option value="low">{t("leads.optLow")}</option>
                    <option value="medium">{t("leads.optMedium")}</option>
                    <option value="high">{t("leads.optHigh")}</option>
                  </select>
                </div>

                <div className="lead-form-field full">
                  <label>{t("leads.notes")}</label>
                  <textarea
                    rows="4"
                    value={createLeadForm.notes}
                    onChange={(e) =>
                      setCreateLeadForm({
                        ...createLeadForm,
                        notes: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="lead-modal-actions">
                <button
                  type="button"
                  onClick={() => setShowCreateLeadModal(false)}
                >
                  {t("leads.cancel")}
                </button>

                <button type="submit">{t("leads.createLead")}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}