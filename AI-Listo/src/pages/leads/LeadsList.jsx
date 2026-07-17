import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import apiClient from "../../api/apiClient";
import "./leads.css";
import EmojiPicker from "emoji-picker-react";
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
  const navigate = useNavigate();

  const [leadsData, setLeadsData] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [convertingLead, setConvertingLead] = useState(false);
  const [leadActionMessage, setLeadActionMessage] = useState("");

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
  const [showLeadProfileModal, setShowLeadProfileModal] = useState(false);

  const [chatMessage, setChatMessage] = useState("");
  const [leadMessages, setLeadMessages] = useState([]);
  const [leadMessagesLoading, setLeadMessagesLoading] = useState(false);

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
  const [leadFilters, setLeadFilters] = useState({
    source: "all",
    temperature: "all",
    aiScore: "all",
    stage: "all",
    agent: "all",
  });
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
  const applyPriorityQueue = () => {
    setQueueFilter("urgent");
    setAiView(false);
  };
  const [showFilters, setShowFilters] = useState(false);
  const stats = [
    {
      title: "Total Leads",
      value: leadStats?.total || 0,
      change: leadStats?.rangeLabel || "All time",
      icon: <Users size={20} />,
      className: "blue",
    },
    {
      title: "AI Qualified",
      value: leadStats?.qualified || 0,
      change: `${leadStats?.qualifiedRate || 0}% qualified`,
      icon: <Bot size={20} />,
      className: "green",
    },
    {
      title: "Active Conversations",
      value: leadStats?.activeConversations || 0,
      change: `+${leadStats?.conversationToday || 0} today`,
      icon: <MessageCircle size={20} />,
      className: "purple",
    },
    {
      title: "Appointments",
      value: leadStats?.appointments || 0,
      change: `+${leadStats?.appointmentThisWeek || 0} this week`,
      icon: <Calendar size={20} />,
      className: "orange",
    },
    {
      title: "Conversion Rate",
      value: `${leadStats?.conversionRate || 0}%`,
      change: "Closed won / total",
      icon: <TrendingUp size={20} />,
      className: "cyan",
    },
    {
      title: "Avg Response",
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
    fetchLeadEvents(lead.id);
    fetchLeadMessages(lead.id);
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
      `Convert ${selectedLead.name || "this lead"} to a contact?`,
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
          ? "This lead is already linked to a contact."
          : "Lead converted to contact successfully.",
      );

      await fetchLeadEvents(selectedLead.id);
    } catch (err) {
      console.error("Convert lead to contact error:", err);

      setLeadActionMessage(
        err?.message || "Failed to convert lead to contact.",
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

  const escalateSelectedLead = async () => {
    if (!selectedLead?.id) return;

    await updateSelectedLead({
      priority: "high",
      status: "qualified",
    });
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
    if (!selectedLead?.id) return;

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
    if (!selectedLead?.id) return;
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
    if (!selectedLead?.id) return;

    setFollowUpMessage(
      `Hi ${selectedLead.name || "there"}, just following up to see if you're still interested.`,
    );

    setShowFollowUpModal(true);
  };

  const submitAiFollowUp = async (e) => {
    e.preventDefault();

    if (!selectedLead?.id || !followUpMessage.trim()) return;

    try {
      await apiClient.request(`/leads/${selectedLead.id}/events`, {
        method: "POST",
        body: JSON.stringify({
          eventType: "lead.ai_follow_up_sent",
          metadata: {
            title: "AI follow-up sent",
            sub: followUpMessage.trim(),
            message: followUpMessage.trim(),
          },
        }),
      });

      setShowFollowUpModal(false);
      setFollowUpMessage("");
      fetchLeadEvents(selectedLead.id);
      fetchFullLeadEvents(1, false);
    } catch (err) {
      console.error("AI follow-up error:", err);
    }
  };

  const sendLeadMessage = async () => {
    if (!selectedLead?.id || !chatMessage.trim()) return;
    try {
      const message = chatMessage.trim();

      await apiClient.request(`/whatsapp-qr/leads/${selectedLead.id}/send`, {
        method: "POST",
        body: JSON.stringify({ message }),
      });
      setChatMessage("");
      await Promise.all([
        fetchLeadMessages(selectedLead.id),
        fetchLeadEvents(selectedLead.id),
      ]);
    } catch (err) {
      console.error("Send WhatsApp message from lead error:", err);
    }
  };

  const generateAiAssistMessage = () => {
    if (!selectedLead) return;

    const name = selectedLead.name || "there";
    const source = selectedLead.source || "your inquiry";
    const status = selectedLead.status || "new";

    const message = `Hi ${name}, thanks for your interest. Based on ${source}, I can help you with matching properties and next steps. Are you available for a quick call or showing this week?`;

    setChatMessage(message);
  };

  const applySuggestedReply = (type) => {
    if (!selectedLead) return;

    const name = selectedLead.name || "there";

    const replies = {
      properties: `Hi ${name}, I found a few properties that may match what you're looking for. Would you like me to send them over?`,
      budget: `Hi ${name}, what budget range are you comfortable with so I can narrow down the best options?`,
      viewing: `Hi ${name}, would you like to schedule a viewing this week? I can help arrange a convenient time.`,
    };

    setChatMessage(replies[type] || "");
  };
  const openLeadProfile = () => {
    if (!selectedLead) return;

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
      title: "AI Auto Follow-Up",
      type: "followUp",
      desc: "Send follow-up when lead needs nurturing",
      icon: <Sparkles size={16} />,
    },
    {
      title: "AI Qualification",
      type: "qualification",
      desc: "Analyze new leads and qualify intent",
      icon: <Bot size={16} />,
    },
    {
      title: "Auto Appointment Booking",
      type: "appointment",
      desc: "Suggest appointment actions for qualified leads",
      icon: <Calendar size={16} />,
    },
    {
      title: "Smart Property Matching",
      type: "propertyMatch",
      desc: "Recommend matching properties",
      icon: <Home size={16} />,
    },
    {
      title: "Escalate Hot Leads",
      type: "escalation",
      desc: "Flag urgent or high-value opportunities",
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
        ? "High Intent"
        : score >= 50
          ? "Interested"
          : "Low Intent";

    const interestLevel =
      engagementScore >= 80
        ? "Very High"
        : engagementScore >= 60
          ? "High"
          : engagementScore >= 40
            ? "Medium"
            : "Low";

    const responseLikelihood =
      messageCount >= 3 || selectedLead.status === "contacted"
        ? "Very High"
        : messageCount >= 1
          ? "High"
          : "Medium";

    return {
      score,
      sentiment,
      interestLevel,
      responseLikelihood,
      engagementScore,
      temperature: getLeadTemperature(selectedLead),
    };
  };

  const leadIntelligence = getLeadIntelligence();

  const createLead = async (e) => {
    e.preventDefault();

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
      "Name",
      "Email",
      "Phone",
      "Status",
      "Priority",
      "Source",
      "Deal Value",
      "Deal Stage",
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

    return (
      matchesQueue &&
      matchesSearch &&
      matchesSource &&
      matchesTemperature &&
      matchesAiScore &&
      matchesStage &&
      matchesAgent &&
      matchesAiView
    );
  });

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
          fetchLeadEvents(activeLead.id);
          fetchLeadMessages(activeLead.id);
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
              <div className="secondary-btn">
                <Calendar size={16} />
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="month">This Month</option>
                </select>
                <ChevronDown size={15} />
              </div>

              <button
                className={`secondary-btn ai-btn ${aiView ? "active" : ""}`}
                onClick={toggleAiView}
              >
                <Sparkles size={16} />
                {aiView ? "AI View On" : "AI View"}
              </button>

              <button
                className="primary-btn"
                onClick={() => setShowCreateLeadModal(true)}
              >
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
              <div className="secondary-btn">
                <Calendar size={16} />
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="month">This Month</option>
                </select>
                <ChevronDown size={15} />
              </div>

              <button className="secondary-btn" onClick={exportLeadsCsv}>
                <Download size={16} />
                Export
              </button>

              <button
                className={`secondary-btn ai-btn ${aiView ? "active" : ""}`}
                onClick={toggleAiView}
              >
                <Sparkles size={16} />
                {aiView ? "AI View On" : "AI View"}
              </button>

              <button
                className="primary-btn"
                onClick={() => setShowCreateLeadModal(true)}
              >
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
                <select
                  value={leadFilters.source}
                  onChange={(e) => updateLeadFilter("source", e.target.value)}
                >
                  <option value="all">All Sources</option>
                  <option value="crm">CRM</option>
                  <option value="website">Website</option>
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
                  <option value="all">All Temperatures</option>
                  <option value="hot">Hot</option>
                  <option value="warm">Warm</option>
                  <option value="cool">Cool</option>
                </select>
                <ChevronDown size={15} />
              </div>
              <div className="filter-btn">
                <Bot size={15} />
                <select
                  value={leadFilters.aiScore}
                  onChange={(e) => updateLeadFilter("aiScore", e.target.value)}
                >
                  <option value="all">All AI Scores</option>
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
                  <option value="all">All Stages</option>
                  <option value="new">New</option>
                  <option value="discovery">Discovery</option>
                  <option value="qualified">Qualified</option>
                  <option value="property-match">Property Match</option>
                  <option value="showing">Showing</option>
                  <option value="proposal">Proposal</option>
                  <option value="negotiation">Negotiation</option>
                  <option value="contract">Contract</option>
                  <option value="closing">Closing</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>
                <ChevronDown size={15} />
              </div>
              <div className="filter-btn">
                <Users size={15} />
                <select
                  value={leadFilters.agent}
                  onChange={(e) => updateLeadFilter("agent", e.target.value)}
                >
                  <option value="all">All Agents</option>
                </select>
                <ChevronDown size={15} />
              </div>
              <button className="btn-export" onClick={exportLeadsCsv}>
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
            <select
              value={leadFilters.source}
              onChange={(e) => updateLeadFilter("source", e.target.value)}
            >
              <option value="all">All Sources</option>
              <option value="crm">CRM</option>
              <option value="website">Website</option>
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
              <option value="all">All Temperatures</option>
              <option value="hot">Hot</option>
              <option value="warm">Warm</option>
              <option value="cool">Cool</option>
            </select>
            <ChevronDown size={15} />
          </div>
          <div className="filter-btn">
            <select
              value={leadFilters.aiScore}
              onChange={(e) => updateLeadFilter("aiScore", e.target.value)}
            >
              <option value="all">All AI Scores</option>
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
              <option value="all">All Stages</option>
              <option value="new">New</option>
              <option value="discovery">Discovery</option>
              <option value="qualified">Qualified</option>
              <option value="property-match">Property Match</option>
              <option value="showing">Showing</option>
              <option value="proposal">Proposal</option>
              <option value="negotiation">Negotiation</option>
              <option value="contract">Contract</option>
              <option value="closing">Closing</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
            <ChevronDown size={15} />
          </div>
          <div className="filter-btn">
            <select
              value={leadFilters.agent}
              onChange={(e) => updateLeadFilter("agent", e.target.value)}
            >
              <option value="all">All Agents</option>
            </select>
            <ChevronDown size={15} />
          </div>
          <div className="search-box">
            <Search size={16} />
            <input
              placeholder="Search leads..."
              value={leadSearch}
              onChange={(e) => setLeadSearch(e.target.value)}
            />
          </div>

          <button className="filter-btn">
            <SlidersHorizontal size={16} />
            Filters
          </button>
          <div className="filter-btn">
            <select
              defaultValue=""
              onChange={(e) => {
                runBulkAction(e.target.value);
                e.target.value = "";
              }}
            >
              <option value="">Bulk Actions</option>
              <option value="markQualified">Mark Qualified</option>
              <option value="priorityHigh">Set Priority High</option>
              <option value="followUp">Mark Follow-Up</option>
              <option value="export">Export Visible</option>
              <option value="clear">Clear Filters</option>
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
              <strong>{leadStats?.urgentLeads || 0}</strong>
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
              <strong>{leadStats?.needFollowUp || 0}</strong>
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
              <strong>{leadStats?.readyToCall || 0}</strong>
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
              <strong>{leadStats?.pendingReplies || 0}</strong>
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
              <strong>{leadStats?.aiQualifiedToday || 0}</strong>
              <span>AI Qualifield Today</span>
            </div>
          </div>
        </div>
        <div className="item-line">
          <button className="queue-btn" onClick={applyPriorityQueue}>
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
                <p className="lead-message">Loading leads...</p>
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
                })}

                {leadLoadingMore && (
                  <div className="lead-card">
                    <p className="lead-message">Loading more leads...</p>
                  </div>
                )}

                {leadHasMore && !leadLoadingMore && (
                  <button
                    type="button"
                    className="view-all-btn"
                    onClick={loadMoreLeads}
                  >
                    Load more leads <ArrowRight size={12} />
                  </button>
                )}
              </>
            ) : (
              <div className="lead-card">
                <p className="lead-message">No leads found.</p>
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
              <button
                type="button"
                className="icon-btn"
                disabled={!selectedLead}
                title="Call lead"
              >
                <Phone size={16} />
              </button>

              <button
                type="button"
                className="icon-btn"
                disabled={!selectedLead}
                title="Start video call"
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
                    ? "Open linked contact"
                    : "Convert this lead to a contact"
                }
              >
                {convertingLead ? (
                  <>
                    <span className="lead-contact-action-spinner" />
                    Converting...
                  </>
                ) : selectedLead?.contactId ? (
                  <>
                    <Users size={16} />
                    Open Contact
                  </>
                ) : (
                  <>
                    <Users size={16} />
                    Convert to Contact
                  </>
                )}
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
                <option value="follow-up">Follow Up</option>
                <option value="closed-won">Closed Won</option>
                <option value="closed-lost">Closed Lost</option>
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
                aria-label="Close message"
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
              <h4>AI Lead Summary</h4>
              <p>
                {selectedLead?.notes ||
                  `Lead source: ${selectedLead?.source || "CRM"}. Status: ${
                    selectedLead?.status || "new"
                  }.`}
              </p>
            </div>
            <button
              className="view-profile-btn"
              onClick={openLeadProfile}
              disabled={!selectedLead}
            >
              View Profile
            </button>
          </div>

          {/* CHAT BODY */}
          <div className="chat-body">
            {leadMessagesLoading ? (
              <div className="message left">
                <p>Loading messages...</p>
              </div>
            ) : leadMessages.length ? (
              leadMessages
                .slice()
                .reverse()
                .map((event) => (
                  <div
                    key={event.id}
                    className="message right robot-msg-container"
                  >
                    {event.metadata?.fileUrl ? (
                      event.metadata?.fileType?.startsWith("image/") ? (
                        <a
                          href={event.metadata.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <img
                            src={event.metadata.fileUrl}
                            alt={event.metadata.fileName || "Attachment"}
                            className="chat-image-preview"
                          />
                        </a>
                      ) : event.metadata?.fileType?.startsWith("audio/") ? (
                        <audio controls src={event.metadata.fileUrl} />
                      ) : (
                        <a
                          href={event.metadata.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          📎 {event.metadata.fileName || "Download file"}
                        </a>
                      )
                    ) : (
                      <p>{event.metadata?.message || event.metadata?.sub}</p>
                    )}
                    <span className="msg-status-right">
                      {formatLeadEventDate(event.createdAt)}{" "}
                      <CheckCheck size={12} />
                    </span>
                    <div className="robot-badge-icon">🤖</div>
                  </div>
                ))
            ) : (
              <div className="message left">
                <p>No messages yet.</p>
                <span>Start a conversation</span>
              </div>
            )}

            {chatMessage && <div className="typing-indicator">Typing...</div>}
          </div>

          {/* AI SUGGESTED REPLIES */}
          <div className="suggested-replies-container">
            <div className="suggested-title">
              <Sparkles size={12} /> AI Suggested Replies
            </div>
            <div className="suggested-chips-scroll">
              {[
                { label: "Send matching properties", type: "properties" },
                { label: "Ask budget range", type: "budget" },
                { label: "Suggest viewing time", type: "viewing" },
              ].map((item) => (
                <button
                  key={item.type}
                  className="chip-btn"
                  onClick={() => applySuggestedReply(item.type)}
                  disabled={!selectedLead}
                >
                  {item.label}
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
                    Cancel
                  </button>

                  <span className="recording-dot"></span>

                  <strong>{formatRecordTime(recordSeconds)}</strong>

                  <span>Recording...</span>

                  <button
                    type="button"
                    className="voice-send-btn"
                    onClick={finishVoiceRecording}
                  >
                    Send
                  </button>
                </div>
              ) : (
                <input
                  placeholder="Type a message or let AI assist..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
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
                  AI Assist
                </button>
                <button
                  className="send-btn fixed-send-btn"
                  onClick={sendLeadMessage}
                  disabled={!chatMessage.trim()}
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
                title: "AI Follow-Up",
                desc: "Send automated follow-up",
                icon: <Send size={14} color="#22c55e" />,
                bgClass: "icon-bg-green",
                onClick: openAiFollowUp,
              },
              {
                title: "Book Showing",
                desc: "Schedule appointment",
                icon: <Calendar size={14} color="#2563eb" />,
                bgClass: "icon-bg-blue",
                onClick: openBookShowing,
              },
              {
                title: "Send Properties",
                desc: "Send matching homes",
                icon: <Home size={14} color="#0284c7" />,
                bgClass: "icon-bg-sky",
                onClick: openSendProperties,
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
              <span className="hot-tag">
                {leadIntelligence.temperature} Lead
              </span>
            </div>
            <div className="insight-wrap">
              <div className="score-circle">
                <div>
                  <h2>{leadIntelligence.score}%</h2>
                  <span>AI Score</span>
                </div>
              </div>

              <div className="insight-list">
                <div className="insight-row">
                  <span>Sentiment</span>
                  <strong>{leadIntelligence.sentiment}</strong>
                </div>
                <div className="insight-row">
                  <span>Interest Level</span>
                  <strong>{leadIntelligence.interestLevel}</strong>
                </div>
                <div className="insight-row">
                  <span>Response Likelihood</span>
                  <strong>{leadIntelligence.responseLikelihood}</strong>
                </div>
                <div className="insight-row">
                  <span>Engagement Score</span>
                  <strong className="dark-insight-text">
                    {leadIntelligence.engagementScore}/100
                  </strong>
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
                <strong className="revenue-val-green">
                  ${Number(selectedLead?.dealValue || 0).toLocaleString()}
                </strong>
              </div>

              <div className="revenue-box">
                <span className="revenue-label">Close Probability</span>
                <strong className="revenue-val-blue">
                  {getCloseProbability(selectedLead?.dealStage)}%
                </strong>
              </div>

              <div className="revenue-box">
                <span className="revenue-label">Est. Close Date</span>
                <strong className="revenue-val-dark">
                  {selectedLead?.estimatedCloseDate || "-"}
                </strong>
              </div>

              <div className="revenue-box">
                <span className="revenue-label">Pipeline Stage</span>
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
                <h3>AI Automation Controls</h3>
                <p className="panel-header-desc">
                  Manage AI actions for this lead
                </p>
              </div>
              <button
                className="manage-all-link"
                onClick={() => setShowAutomationModal(true)}
              >
                Manage All
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
                        {isActive ? "Active" : "Inactive"}
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
              <button className="full-timeline-btn" onClick={openFullTimeline}>
                Full Timeline <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
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
              <h3>Full Lead Timeline</h3>
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
                          {event.metadata?.title || "Lead activity"}
                        </h5>
                        <span className="timeline-time">
                          {formatLeadEventDate(event.createdAt)}
                        </span>
                      </div>
                      <p className="timeline-desc">
                        {event.metadata?.sub || "Lead updated"}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="timeline-desc">No timeline yet.</p>
              )}

              {fullTimelineLoading && (
                <p className="timeline-desc">Loading more...</p>
              )}

              {!fullTimelineHasMore && fullLeadEvents.length > 0 && (
                <p className="timeline-desc">End of timeline.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {showBookShowingModal && (
        <div className="lead-modal-overlay">
          <div className="lead-timeline-modal">
            <div className="lead-modal-header">
              <h3>Book Showing</h3>
              <button onClick={() => setShowBookShowingModal(false)}>✕</button>
            </div>

            <form onSubmit={submitBookShowing}>
              <div className="lead-form-grid">
                <div className="lead-form-field">
                  <label>Date</label>
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
                  <label>Time</label>
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
                  <label>Note</label>
                  <textarea
                    rows="4"
                    value={showingForm.note}
                    onChange={(e) =>
                      setShowingForm({ ...showingForm, note: e.target.value })
                    }
                    placeholder="Add showing details..."
                  />
                </div>
              </div>

              <div className="lead-modal-actions">
                <button
                  type="button"
                  onClick={() => setShowBookShowingModal(false)}
                >
                  Cancel
                </button>

                <button type="submit">Book Showing</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSendPropertiesModal && (
        <div className="lead-modal-overlay">
          <div className="lead-timeline-modal">
            <div className="lead-modal-header">
              <h3>Send Properties</h3>
              <button onClick={() => setShowSendPropertiesModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={submitSendProperties}>
              <div className="lead-form-grid">
                <div className="lead-form-field full">
                  <label>Note</label>
                  <textarea
                    rows="4"
                    value={propertiesNote}
                    onChange={(e) => setPropertiesNote(e.target.value)}
                    placeholder="Example: Sent 3 matching homes in Quito..."
                  />
                </div>
              </div>

              <div className="lead-modal-actions">
                <button
                  type="button"
                  onClick={() => setShowSendPropertiesModal(false)}
                >
                  Cancel
                </button>

                <button type="submit">Send Properties</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showFollowUpModal && (
        <div className="lead-modal-overlay">
          <div className="lead-timeline-modal">
            <div className="lead-modal-header">
              <h3>AI Follow-Up</h3>
              <button onClick={() => setShowFollowUpModal(false)}>✕</button>
            </div>

            <form onSubmit={submitAiFollowUp}>
              <div className="lead-form-grid">
                <div className="lead-form-field full">
                  <label>Message</label>
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
                >
                  Cancel
                </button>

                <button type="submit">Send Follow-Up</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showLeadProfileModal && selectedLead && (
        <div className="lead-modal-overlay">
          <div className="lead-timeline-modal">
            <div className="lead-modal-header">
              <h3>Lead Profile</h3>
              <button onClick={() => setShowLeadProfileModal(false)}>✕</button>
            </div>

            <form onSubmit={saveLeadProfile}>
              <div className="lead-form-grid">
                <div className="lead-form-field form-group">
                  <label>Status</label>
                  <select
                    value={leadProfileForm.status}
                    onChange={(e) =>
                      setLeadProfileForm({
                        ...leadProfileForm,
                        status: e.target.value,
                      })
                    }
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="follow-up">Follow Up</option>
                    <option value="closed-won">Closed Won</option>
                    <option value="closed-lost">Closed Lost</option>
                  </select>
                </div>

                <div className="lead-form-field form-group">
                  <label>Priority</label>
                  <select
                    value={leadProfileForm.priority}
                    onChange={(e) =>
                      setLeadProfileForm({
                        ...leadProfileForm,
                        priority: e.target.value,
                      })
                    }
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className="lead-form-field full">
                  <label>Notes</label>
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
                  Cancel
                </button>

                <button type="submit">Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showAutomationModal && (
        <div className="lead-modal-overlay">
          <div className="lead-timeline-modal">
            <div className="lead-modal-header">
              <h3>AI Automation Controls</h3>
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
                        {isActive ? "Active" : "Inactive"}
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
              <h3>New Lead</h3>
              <button onClick={() => setShowCreateLeadModal(false)}>✕</button>
            </div>

            <form onSubmit={createLead}>
              <div className="lead-form-grid">
                <div className="lead-form-field">
                  <label>Name</label>
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
                  <label>Email</label>
                  <input
                    type="email"
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
                  <label>Phone</label>
                  <input
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
                  <label>Source</label>
                  <input
                    value={createLeadForm.source}
                    onChange={(e) =>
                      setCreateLeadForm({
                        ...createLeadForm,
                        source: e.target.value,
                      })
                    }
                    placeholder="Website, Facebook, WhatsApp..."
                  />
                </div>

                <div className="lead-form-field form-group">
                  <label>Status</label>
                  <select
                    value={createLeadForm.status}
                    onChange={(e) =>
                      setCreateLeadForm({
                        ...createLeadForm,
                        status: e.target.value,
                      })
                    }
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="follow-up">Follow Up</option>
                    <option value="closed-won">Closed Won</option>
                    <option value="closed-lost">Closed Lost</option>
                  </select>
                </div>

                <div className="lead-form-field form-group">
                  <label>Priority</label>
                  <select
                    value={createLeadForm.priority}
                    onChange={(e) =>
                      setCreateLeadForm({
                        ...createLeadForm,
                        priority: e.target.value,
                      })
                    }
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className="lead-form-field full">
                  <label>Notes</label>
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
                  Cancel
                </button>

                <button type="submit">Create Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
