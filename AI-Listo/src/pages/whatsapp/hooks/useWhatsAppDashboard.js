import { useCallback, useEffect, useMemo, useState } from "react";
import { whatsappService } from "../services/whatsapp.service";

const initials = (name = "") =>
  String(name || "WA")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase() || "WA";

const timeAgo = (value) => {
  if (!value) return "Recently";
  const date = new Date(value);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
};

const scoreFromConversation = (conv) => {
  const unread = Number(conv.unread_count || 0);
  const ai = conv.ai_enabled ? 12 : 0;
  const active = conv.last_activity_at ? 18 : 0;
  return Math.min(95, 45 + unread * 4 + ai + active);
};

const tagFromScore = (score) => {
  if (score >= 80) return "hot";
  if (score >= 60) return "warm";
  return "cold";
};

export function useWhatsAppDashboard() {
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [qr, setQr] = useState(null);

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [aiFilter, setAiFilter] = useState("all");
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);

  const [dashboardStats, setDashboardStats] = useState([]);
  const [dashboardSegments, setDashboardSegments] = useState(null);

  const [intelligenceLoading, setIntelligenceLoading] = useState(false);
  const [aiIntelligence, setAiIntelligence] = useState(null);

  const loadStatus = useCallback(async () => {
    try {
      setStatusLoading(true);
      const res = await whatsappService.getStatus();
      const data = res?.data || res || {};
      setStatus(data);

      if (!data.connected) {
        const qrRes = await whatsappService.getPendingQr();
        setQr(qrRes?.data?.qr || qrRes?.qr || null);
      } else {
        setQr(null);
      }
    } catch (err) {
      console.error("Load WhatsApp status error:", err);
    } finally {
      setStatusLoading(false);
    }
  }, []);

  const loadDashboard = useCallback(async () => {
    try {
      const res = await whatsappService.getDashboard();
      const data = res?.data || res || {};

      const normalized = Array.isArray(data.conversations)
        ? data.conversations.map((conv) => ({
            ...conv,
            initials: initials(conv.displayName || conv.contact_phone),
          }))
        : [];

      setDashboardStats(Array.isArray(data.stats) ? data.stats : []);
      setDashboardSegments(data.segments || null);
      setConversations(normalized);

      setSelectedConversation((prev) => {
        if (prev) {
          return (
            normalized.find((item) => item.id === prev.id) ||
            normalized[0] ||
            null
          );
        }
        return normalized[0] || null;
      });
    } catch (err) {
      console.error("Load WhatsApp dashboard error:", err);
      setDashboardStats([]);
      setDashboardSegments(null);
      setConversations([]);
    }
  }, []);

  const loadMessages = useCallback(async (conversation) => {
    if (!conversation?.contact_phone) {
      setMessages([]);
      return;
    }

    try {
      setMessagesLoading(true);

      const res = await whatsappService.getMessages(
        conversation.contact_phone,
        80,
      );
      const data = res?.data || res || [];

      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Load messages error:", err);
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([loadStatus(), loadDashboard()]);
    } finally {
      setLoading(false);
    }
  }, [loadStatus, loadDashboard]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
      loadConversationIntelligence(selectedConversation);
    }
  }, [selectedConversation, loadMessages, loadConversationIntelligence]);

  const connectDevice = async () => {
    try {
      setStatusLoading(true);
      await whatsappService.connect();
      await loadStatus();
    } catch (err) {
      console.error("Connect WhatsApp error:", err);
    } finally {
      setStatusLoading(false);
    }
  };

  const disconnectDevice = async () => {
    try {
      setStatusLoading(true);
      await whatsappService.disconnect();
      await loadStatus();
    } catch (err) {
      console.error("Disconnect WhatsApp error:", err);
    } finally {
      setStatusLoading(false);
    }
  };

  const sendMessage = async () => {
    const text = messageText.trim();
    if (!selectedConversation?.contact_phone || !text) return;

    try {
      setSending(true);

      await whatsappService.sendMessage(
        selectedConversation.contact_phone,
        text,
      );

      setMessageText("");
      await loadMessages(selectedConversation);
      await loadDashboard();
    } catch (err) {
      console.error("Send WhatsApp message error:", err);
    } finally {
      setSending(false);
    }
  };

  const toggleSelectedAi = async () => {
    if (!selectedConversation?.contact_phone) return;

    try {
      const next = !selectedConversation.ai_enabled;

      await whatsappService.toggleAi(selectedConversation.contact_phone, next);

      setSelectedConversation((prev) =>
        prev
          ? { ...prev, ai_enabled: next, owner_type: next ? "ai" : "human" }
          : prev,
      );

      await loadDashboard();
    } catch (err) {
      console.error("Toggle AI error:", err);
    }
  };

  const filteredConversations = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return conversations.filter((conv) => {
      const matchesSearch =
        !keyword ||
        [conv.displayName, conv.contact_phone, conv.lastMessage]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "unread" && Number(conv.unread_count || 0) > 0) ||
        (statusFilter === "ai" && conv.ai_enabled) ||
        (statusFilter === "human" && !conv.ai_enabled);

      const matchesAi =
        aiFilter === "all" ||
        (aiFilter === "ai" && conv.ai_enabled) ||
        (aiFilter === "human" && !conv.ai_enabled);

      return matchesSearch && matchesStatus && matchesAi;
    });
  }, [conversations, search, statusFilter, aiFilter]);

  const stats = useMemo(() => {
    const unread = conversations.reduce(
      (sum, conv) => sum + Number(conv.unread_count || 0),
      0,
    );

    const aiHandled = conversations.filter((conv) => conv.ai_enabled).length;

    return {
      connectedAccounts: status?.connected ? 1 : 0,
      activeConversations: conversations.length,
      unreadConversations: unread,
      aiRepliesToday: aiHandled,
      appointmentsBooked: 0,
      avgResponseTime: status?.connected ? "14s" : "-",
      closeRate: conversations.length ? "28.6%" : "0%",
    };
  }, [conversations, status]);

  const segments = useMemo(() => {
    const urgent = conversations.filter((conv) => conv.score >= 80).length;
    const unread = conversations.reduce(
      (sum, conv) => sum + Number(conv.unread_count || 0),
      0,
    );
    const needFollowUp = conversations.filter(
      (conv) =>
        conv.last_message_type === "human" || conv.owner_type === "human",
    ).length;
    const aiPending = conversations.filter((conv) => conv.ai_enabled).length;

    return {
      urgent,
      unread,
      needFollowUp,
      readyToBook: 0,
      aiPending,
    };
  }, [conversations]);

  const selectedIntelligence = useMemo(() => {
    if (aiIntelligence) {
      return aiIntelligence;
    }

    if (!selectedConversation) {
      return {
        score: 0,
        sentiment: "Unknown",
        intent: "Unknown",
        responseLikelihood: "0%",
        closeProbability: "0%",
        expectedRevenue: "$0",
        budget: "Unknown",
        timeline: "Unknown",
        ghostRisk: "0%",
        summary: "Select a conversation to see AI summary.",
        recommendedAction: "Select a conversation to see AI recommendations.",
        suggestedReplies: [],
      };
    }

    const score = selectedConversation.score || 0;

    return {
      score,
      sentiment: score >= 60 ? "Positive" : "Neutral",
      intent: score >= 80 ? "Very High" : score >= 60 ? "Medium" : "Low",
      responseLikelihood: `${Math.min(95, score + 4)}%`,
      closeProbability: `${Math.max(8, score - 10)}%`,
      expectedRevenue: "$0",
      budget: "Unknown",
      timeline: "Unknown",
      ghostRisk: `${Math.max(5, 100 - score)}%`,
      summary: selectedConversation.lastMessage || "No recent activity.",
      recommendedAction: selectedConversation.ai_enabled
        ? "Let AI handle the next reply or send property options."
        : "Human owner selected. Review conversation and reply manually.",
      suggestedReplies: [],
    };
  }, [aiIntelligence, selectedConversation]);

  const timeline = useMemo(() => {
    return messages.slice(-5).map((msg) => ({
      id: msg.id,
      title:
        msg.direction === "inbound"
          ? "Message received"
          : msg.sender_type === "ai"
            ? "AI replied"
            : "Agent replied",
      description: msg.body || `[${msg.message_type}]`,
      time: msg.created_at
        ? new Date(msg.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "",
      type: msg.direction,
    }));
  }, [messages]);

  const loadConversationIntelligence = useCallback(async (conversation) => {
    if (!conversation?.contact_phone) {
      setAiIntelligence(null);
      return;
    }

    try {
      setIntelligenceLoading(true);

      const res = await whatsappService.getConversationIntelligence(
        conversation.contact_phone,
      );

      const data = res?.data || res || null;
      setAiIntelligence(data);
    } catch (err) {
      console.error("Load conversation intelligence error:", err);
      setAiIntelligence(null);
    } finally {
      setIntelligenceLoading(false);
    }
  }, []);

  return {
    loading,
    statusLoading,
    messagesLoading,
    sending,

    status,
    qr,

    dashboardStats,
    dashboardSegments,

    filteredConversations,
    selectedConversation,
    setSelectedConversation,

    messages,
    selectedIntelligence,
    timeline,

    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    aiFilter,
    setAiFilter,

    messageText,
    setMessageText,

    refresh,
    connectDevice,
    disconnectDevice,
    sendMessage,
    toggleSelectedAi,
    intelligenceLoading,
    aiIntelligence,
  };
}
