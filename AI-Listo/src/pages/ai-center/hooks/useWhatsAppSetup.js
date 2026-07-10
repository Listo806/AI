import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
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
    status:
      data.status ??
      (data.connected ? "connected" : "disconnected"),
    connectedAt: data.connected_at ?? null,
    updatedAt: data.updated_at ?? null,
  };
};

const getStoredToken = () => {
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
      const raw =
        localStorage.getItem(key) ||
        sessionStorage.getItem(key);

      if (!raw) continue;

      const parsed = JSON.parse(raw);

      const token =
        parsed?.token ||
        parsed?.accessToken ||
        parsed?.access_token;

      if (token) {
        return token;
      }
    } catch {
      // Ignore invalid JSON from unrelated storage values.
    }
  }

  return null;
};

const getSocketBaseUrl = () => {
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

export function useWhatsAppSetup({ onConnected } = {}) {
  const socketRef = useRef(null);
  const pollingTimerRef = useRef(null);
  const mountedRef = useRef(false);
  const connectedNotifiedRef = useRef(false);
  const onConnectedRef = useRef(onConnected);

  const [status, setStatus] = useState(DEFAULT_STATUS);
  const [qr, setQr] = useState(null);

  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] =
    useState(false);
  const [socketConnected, setSocketConnected] =
    useState(false);
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

  const refreshQr = useCallback(async () => {
    try {
      const response =
        await whatsappSetupService.getPendingQr();

      const nextQr =
        response?.qr ??
        response?.data?.qr ??
        null;

      if (!mountedRef.current) {
        return nextQr;
      }

      setQr(nextQr);

      return nextQr;
    } catch (requestError) {
      console.error(
        "GET WHATSAPP PENDING QR FAILED:",
        requestError,
      );

      return null;
    }
  }, []);

  const refreshStatus = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent && mountedRef.current) {
        setLoading(true);
      }

      try {
        const response =
          await whatsappSetupService.getStatus();

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
          notifyConnected(nextStatus);
        } else {
          connectedNotifiedRef.current = false;
        }

        return nextStatus;
      } catch (requestError) {
        console.error(
          "GET WHATSAPP STATUS FAILED:",
          requestError,
        );

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
    [notifyConnected, stopPolling],
  );

  const startPolling = useCallback(() => {
    stopPolling();

    pollingTimerRef.current = window.setInterval(
      async () => {
        const nextStatus = await refreshStatus({
          silent: true,
        });

        if (nextStatus?.connected) {
          stopPolling();
          return;
        }

        await refreshQr();
      },
      3000,
    );
  }, [refreshQr, refreshStatus, stopPolling]);

  const connect = useCallback(async () => {
    if (connecting || status.connected) return;

    setConnecting(true);
    setError("");
    setQr(null);
    connectedNotifiedRef.current = false;

    try {
      const response =
        await whatsappSetupService.connect();

      const data = response?.data ?? response ?? {};
      const backendMessage = String(data.message || "");

      if (
        backendMessage.includes(
          "WHATSAPP_QR_ENABLED=true",
        ) ||
        backendMessage.includes("REDIS_URL")
      ) {
        throw new Error(backendMessage);
      }

      await refreshQr();

      startPolling();
    } catch (requestError) {
      console.error(
        "CONNECT WHATSAPP FAILED:",
        requestError,
      );

      setConnecting(false);

      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to start WhatsApp connection.",
      );
    }
  }, [
    connecting,
    refreshQr,
    startPolling,
    status.connected,
  ]);

  const disconnect = useCallback(async () => {
    if (disconnecting) return;

    setDisconnecting(true);
    setError("");

    try {
      await whatsappSetupService.disconnect();

      stopPolling();
      connectedNotifiedRef.current = false;

      setQr(null);
      setConnecting(false);
      setStatus(DEFAULT_STATUS);

      await refreshStatus({
        silent: true,
      });
    } catch (requestError) {
      console.error(
        "DISCONNECT WHATSAPP FAILED:",
        requestError,
      );

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
  }, [
    disconnecting,
    refreshStatus,
    stopPolling,
  ]);

  useEffect(() => {
    mountedRef.current = true;

    refreshStatus();

    return () => {
      mountedRef.current = false;
      stopPolling();
    };
  }, [refreshStatus, stopPolling]);

  useEffect(() => {
    const token = getStoredToken();

    if (!token) {
      setError(
        "Authentication token was not found. Please sign in again.",
      );

      return undefined;
    }

    const socketUrl = `${getSocketBaseUrl()}/whatsapp-qr`;

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

    socketRef.current = socket;

    socket.on("connect", () => {
      if (!mountedRef.current) return;

      setSocketConnected(true);
      setError("");
    });

    socket.on("disconnect", () => {
      if (!mountedRef.current) return;

      setSocketConnected(false);
    });

    socket.on("connect_error", (socketError) => {
      console.error(
        "WHATSAPP QR SOCKET ERROR:",
        socketError,
      );

      if (!mountedRef.current) return;

      setSocketConnected(false);

    });

    socket.on("qr", (payload) => {
      if (!mountedRef.current) return;

      const nextQr =
        payload?.qr ??
        payload?.data?.qr ??
        null;

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

      const verifiedStatus = await refreshStatus({
        silent: true,
      });

      notifyConnected(
        verifiedStatus || optimisticStatus,
      );
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
        setError(
          `WhatsApp disconnected: ${payload.reason}`,
        );
      }

      await refreshStatus({
        silent: true,
      });
    };

    socket.on("disconnected", handleDisconnected);

    socket.on(
      "session-disconnected",
      handleDisconnected,
    );

    return () => {
      socket.removeAllListeners();
      socket.disconnect();

      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [
    notifyConnected,
    refreshStatus,
    stopPolling,
  ]);

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

/*
 * 2 import:
 *
 * import { useWhatsAppSetup } from "./hooks/useWhatsAppSetup";
 *
 * &:
 *
 * import useWhatsAppSetup from "./hooks/useWhatsAppSetup";
 */
export default useWhatsAppSetup;