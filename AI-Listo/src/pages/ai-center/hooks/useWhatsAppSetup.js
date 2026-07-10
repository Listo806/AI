import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

import whatsappSetupService from "../services/whatsappSetup.service";

const DEFAULT_STATUS = {
  enabled: true,
  connected: false,
  phone: null,
  status: "disconnected",
  connectedAt: null,
  updatedAt: null,
};

const normalizeStatus = (response) => {
  const data = response?.data ?? response ?? {};

  return {
    enabled: data.enabled !== false,
    connected: Boolean(data.connected),
    phone: data.phone ?? null,
    status: data.status ?? (data.connected ? "connected" : "disconnected"),
    connectedAt: data.connected_at ?? null,
    updatedAt: data.updated_at ?? null,
  };
};

const getStoredToken = () => {
  const directKeys = [
    "token",
    "accessToken",
    "access_token",
    "authToken",
    "jwt",
  ];

  for (const key of directKeys) {
    const value = localStorage.getItem(key) || sessionStorage.getItem(key);

    if (value) return value;
  }

  const objectKeys = ["auth", "user", "authData"];

  for (const key of objectKeys) {
    try {
      const raw = localStorage.getItem(key) || sessionStorage.getItem(key);

      if (!raw) continue;

      const parsed = JSON.parse(raw);

      const token =
        parsed?.token || parsed?.accessToken || parsed?.access_token;

      if (token) return token;
    } catch {
      // Ignore unrelated invalid JSON.
    }
  }

  return null;
};

const normalizeBaseUrl = (value) => {
  if (!value) return null;

  const url = String(value).trim();

  /*
   * Relative URLs such as "/api" point to Vite localhost.
   * We intentionally do not use them for Socket.IO.
   */
  if (!/^https?:\/\//i.test(url)) {
    return null;
  }

  return url.replace(/\/api\/?$/i, "").replace(/\/$/, "");
};

const getSocketBaseUrl = () => {
  return (
    normalizeBaseUrl(import.meta.env.VITE_SOCKET_URL) ||
    normalizeBaseUrl(import.meta.env.VITE_BACKEND_URL) ||
    normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL) ||
    normalizeBaseUrl(import.meta.env.VITE_API_URL) ||
    null
  );
};

export function useWhatsAppSetup({ onConnected } = {}) {
  const socketRef = useRef(null);
  const pollingTimerRef = useRef(null);
  const mountedRef = useRef(false);
  const connectedNotifiedRef = useRef(false);
  const onConnectedRef = useRef(onConnected);
  const socketWarningShownRef = useRef(false);

  const [status, setStatus] = useState(DEFAULT_STATUS);
  const [qr, setQr] = useState(null);

  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    onConnectedRef.current = onConnected;
  }, [onConnected]);

  const notifyConnected = useCallback((nextStatus) => {
    if (connectedNotifiedRef.current) return;

    connectedNotifiedRef.current = true;
    onConnectedRef.current?.(nextStatus);
  }, []);

  const stopPolling = useCallback(() => {
    if (!pollingTimerRef.current) return;

    window.clearInterval(pollingTimerRef.current);

    pollingTimerRef.current = null;
  }, []);

  const closeSocket = useCallback(() => {
    const socket = socketRef.current;

    if (!socket) return;

    socket.removeAllListeners();
    socket.disconnect();

    socketRef.current = null;

    if (mountedRef.current) {
      setSocketConnected(false);
    }
  }, []);

  const refreshQr = useCallback(async () => {
    try {
      const response = await whatsappSetupService.getPendingQr();

      const nextQr = response?.qr ?? response?.data?.qr ?? null;

      if (mountedRef.current) {
        setQr(nextQr);
      }

      return nextQr;
    } catch (requestError) {
      console.warn("GET WHATSAPP PENDING QR FAILED:", requestError);

      return null;
    }
  }, []);

  const refreshStatus = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent && mountedRef.current) {
        setLoading(true);
      }

      try {
        const response = await whatsappSetupService.getStatus();

        const nextStatus = normalizeStatus(response);

        if (!mountedRef.current) {
          return nextStatus;
        }

        setStatus(nextStatus);
        setError("");

        if (nextStatus.connected) {
          setQr(null);
          setConnecting(false);

          stopPolling();
          closeSocket();
          notifyConnected(nextStatus);
        } else {
          connectedNotifiedRef.current = false;
        }

        return nextStatus;
      } catch (requestError) {
        console.error("GET WHATSAPP STATUS FAILED:", requestError);

        if (mountedRef.current) {
          setError(
            requestError?.response?.data?.message ||
              requestError?.message ||
              "Unable to load WhatsApp connection status.",
          );
        }

        return null;
      } finally {
        if (!silent && mountedRef.current) {
          setLoading(false);
        }
      }
    },
    [closeSocket, notifyConnected, stopPolling],
  );

  const startPolling = useCallback(() => {
    stopPolling();

    pollingTimerRef.current = window.setInterval(async () => {
      const nextStatus = await refreshStatus({
        silent: true,
      });

      if (nextStatus?.connected) {
        stopPolling();
        return;
      }

      await refreshQr();
    }, 3000);
  }, [refreshQr, refreshStatus, stopPolling]);

  const openSocket = useCallback(() => {
    if (socketRef.current || status.connected) {
      return;
    }

    const token = getStoredToken();
    const baseUrl = getSocketBaseUrl();

    /*
     * Socket is optional because REST polling can still
     * receive pending QR and verify connection status.
     */
    if (!baseUrl) {
      if (!socketWarningShownRef.current) {
        console.warn(
          "VITE_SOCKET_URL is not configured. WhatsApp QR will use REST polling fallback.",
        );

        socketWarningShownRef.current = true;
      }

      setSocketConnected(false);
      return;
    }

    if (!token) {
      setError("Authentication token was not found. Please sign in again.");

      return;
    }

    const socket = io(`${baseUrl}/whatsapp-qr`, {
      transports: ["websocket", "polling"],

      auth: {
        token,
      },

      query: {
        token,
      },

      withCredentials: true,

      /*
       * Do not retry forever. REST polling is
       * the reliable fallback.
       */
      timeout: 8000,
      reconnection: true,
      reconnectionAttempts: 2,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      if (!mountedRef.current) return;

      setSocketConnected(true);
      setError("");
      socketWarningShownRef.current = false;
    });

    socket.on("disconnect", () => {
      if (!mountedRef.current) return;

      setSocketConnected(false);
    });

    socket.on("connect_error", (socketError) => {
      if (!mountedRef.current) return;

      setSocketConnected(false);

      /*
       * Do not display this as a setup failure.
       * REST polling continues to handle QR/status.
       */
      if (!socketWarningShownRef.current) {
        console.warn(
          "WhatsApp realtime socket unavailable; using REST polling fallback:",
          socketError?.message || socketError,
        );

        socketWarningShownRef.current = true;
      }
    });

    socket.on("qr", (payload) => {
      if (!mountedRef.current) return;

      const nextQr = payload?.qr ?? payload?.data?.qr ?? null;

      if (!nextQr) return;

      setQr(nextQr);
      setConnecting(true);
      setError("");
    });

    socket.on("connected", async (payload) => {
      if (!mountedRef.current) return;

      stopPolling();

      setQr(null);
      setConnecting(false);

      const optimisticStatus = {
        ...DEFAULT_STATUS,
        connected: true,
        status: "connected",
        phone: payload?.phone ?? null,
      };

      setStatus((current) => ({
        ...current,
        ...optimisticStatus,
        phone: payload?.phone ?? current.phone ?? null,
      }));

      /*
       * QR socket has completed its job.
       * Close intentionally to avoid timeout/reconnect noise.
       */
      closeSocket();

      const verifiedStatus = await refreshStatus({
        silent: true,
      });

      notifyConnected(verifiedStatus || optimisticStatus);
    });

    const handleDisconnected = async (payload) => {
      if (!mountedRef.current) return;

      connectedNotifiedRef.current = false;

      setQr(null);
      setConnecting(false);

      setStatus((current) => ({
        ...current,
        connected: false,
        status: "disconnected",
      }));

      if (payload?.reason) {
        setError(`WhatsApp disconnected: ${payload.reason}`);
      }

      await refreshStatus({
        silent: true,
      });
    };

    socket.on("disconnected", handleDisconnected);

    socket.on("session-disconnected", handleDisconnected);
  }, [
    closeSocket,
    notifyConnected,
    refreshStatus,
    status.connected,
    stopPolling,
  ]);

  const connect = useCallback(async () => {
    if (connecting || status.connected) {
      return;
    }

    setConnecting(true);
    setError("");
    setQr(null);

    connectedNotifiedRef.current = false;

    /*
     * Open realtime before POST /connect so the browser
     * does not miss the first QR event.
     */
    openSocket();

    try {
      const response = await whatsappSetupService.connect();

      const data = response?.data ?? response ?? {};

      const backendMessage = String(data.message || "");

      if (
        backendMessage.includes("WHATSAPP_QR_ENABLED=true") ||
        backendMessage.includes("REDIS_URL")
      ) {
        throw new Error(backendMessage);
      }

      await refreshQr();
      startPolling();
    } catch (requestError) {
      console.error("CONNECT WHATSAPP FAILED:", requestError);

      setConnecting(false);

      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to start WhatsApp connection.",
      );
    }
  }, [connecting, openSocket, refreshQr, startPolling, status.connected]);

  const disconnect = useCallback(async () => {
    if (disconnecting) return;

    setDisconnecting(true);
    setError("");

    try {
      await whatsappSetupService.disconnect();

      stopPolling();
      closeSocket();

      connectedNotifiedRef.current = false;

      setQr(null);
      setConnecting(false);
      setStatus(DEFAULT_STATUS);

      await refreshStatus({
        silent: true,
      });
    } catch (requestError) {
      console.error("DISCONNECT WHATSAPP FAILED:", requestError);

      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to disconnect WhatsApp.",
      );
    } finally {
      if (mountedRef.current) {
        setDisconnecting(false);
      }
    }
  }, [closeSocket, disconnecting, refreshStatus, stopPolling]);

  useEffect(() => {
    mountedRef.current = true;

    refreshStatus();

    return () => {
      mountedRef.current = false;

      stopPolling();
      closeSocket();
    };
  }, [closeSocket, refreshStatus, stopPolling]);

  /*
   * Open Socket.IO only while the QR connection
   * is not complete.
   */
  useEffect(() => {
    if (loading || status.connected) {
      if (status.connected) {
        closeSocket();
      }

      return undefined;
    }

    openSocket();

    return undefined;
  }, [closeSocket, loading, openSocket, status.connected]);

  return {
    status,
    qr,

    loading,
    connecting,
    disconnecting,
    socketConnected,
    error,

    connected: status.connected,
    phone: status.phone,

    connect,
    disconnect,

    refresh: refreshStatus,
    refreshStatus,
    refreshQr,
  };
}

export default useWhatsAppSetup;
