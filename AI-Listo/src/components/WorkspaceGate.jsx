import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Lock, ShieldCheck, RefreshCw } from "lucide-react";
import workspaceApi from "../api/workspaceApi";
import WorkspaceSkeleton from "./WorkspaceSkeleton";
import { fetchPaddleConfig } from "../api/paddleApi";
import { initPaddle, openWorkspaceCheckout } from "../pages/checkout/paddleCheckout";
import {
  fetchNuveiConfig,
  nuveiWorkspaceAddon,
  nuveiWorkspaceAddonContinue,
  nuveiWorkspaceAddonStatus,
  nuveiSaveToken,
  nuveiListCards,
  collectBrowserInfo,
} from "../api/nuveiApi";
import { mountNuveiForm } from "../pages/checkout/nuveiSdk";
import { runAddonThreeDs } from "../pages/checkout/workspaceAddonThreeDs";
import { useAuth } from "../context/AuthContext";

// Access gate for a paid Workspace. It fails OPEN: if the workspace's lock is off
// (the default), the account is entitled, or the access check errors, the
// workspace renders normally. It shows the purchase screen ONLY when the server
// says the workspace is locked and this account is not entitled — so no existing
// customer is ever blocked until the client turns a lock on.
//
// Payment: when Nuvei is enabled (/nuvei/config) the $97/month add-on is paid
// with the customer's saved Nuvei card (or a card entered in Nuvei's secure
// form) right inside this card; Paddle is used only when Nuvei is off. Either
// way the server unlocks the workspace only after the payment is confirmed.

let accessCache = null; // { at, promise }
const ACCESS_TTL = 30000;

function loadAccessMap(force = false) {
  const now = Date.now();
  if (!force && accessCache && now - accessCache.at < ACCESS_TTL) {
    return accessCache.promise;
  }
  const promise = workspaceApi
    .getAccess()
    .then((res) => {
      const map = {};
      (res?.workspaces || []).forEach((w) => {
        map[w.id] = w;
      });
      return map;
    })
    .catch(() => null); // fail open: no info -> treat as accessible
  accessCache = { at: now, promise };
  return promise;
}

// Copy for the Nuvei add-on payment step only (the existing card copy is
// unchanged). {a} = monthly amount, {l} = card last 4.
const ADDON_TXT = {
  en: {
    payWith: "Pay ${a}/month with card ending ••••{l}",
    payNow: "Pay ${a}/month",
    processing: "Processing payment…",
    declined: "The payment could not be completed. Please try another card.",
    pending: "Your payment is being verified. The workspace will unlock automatically once confirmed.",
    error: "Something went wrong. Please try again.",
    cardIncomplete: "Please complete your card details.",
    formError: "We could not load the payment form. Please refresh the page and try again.",
    adminOnly: "Only an account admin can add this workspace. Please ask your admin.",
  },
  es: {
    payWith: "Pagar ${a}/mes con la tarjeta terminada en ••••{l}",
    payNow: "Pagar ${a}/mes",
    processing: "Procesando el pago…",
    declined: "No se pudo completar el pago. Prueba con otra tarjeta.",
    pending: "Tu pago se está verificando. El espacio de trabajo se desbloqueará automáticamente cuando se confirme.",
    error: "Algo salió mal. Inténtalo de nuevo.",
    cardIncomplete: "Completa los datos de tu tarjeta.",
    formError: "No pudimos cargar el formulario de pago. Actualiza la página e inténtalo de nuevo.",
    adminOnly: "Solo un administrador de la cuenta puede agregar este espacio de trabajo. Pídeselo a tu administrador.",
  },
  pt: {
    payWith: "Pagar ${a}/mês com o cartão final ••••{l}",
    payNow: "Pagar ${a}/mês",
    processing: "Processando o pagamento…",
    declined: "Não foi possível concluir o pagamento. Tente outro cartão.",
    pending: "Seu pagamento está sendo verificado. O workspace será desbloqueado automaticamente após a confirmação.",
    error: "Algo deu errado. Tente novamente.",
    cardIncomplete: "Preencha os dados do seu cartão.",
    formError: "Não conseguimos carregar o formulário de pagamento. Atualize a página e tente novamente.",
    adminOnly: "Somente um administrador da conta pode adicionar este workspace. Peça ao seu administrador.",
  },
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const money = (v) => Number(v || 0).toFixed(2);

export default function WorkspaceGate({ workspaceId, children }) {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const langCode = String(i18n?.language || "en").slice(0, 2);
  const lang = ADDON_TXT[langCode] ? langCode : "en";
  const tx = ADDON_TXT[lang];

  const [loading, setLoading] = useState(true);
  const [ws, setWs] = useState(null);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState("");
  const paddleReady = useRef(false);
  const timers = useRef([]);

  // Nuvei add-on payment step: idle | confirm (saved card) | card (secure form)
  // | processing (charging / 3DS / waiting for the bank).
  const [step, setStep] = useState("idle");
  const [savedCard, setSavedCard] = useState(null);
  const [amount, setAmount] = useState(97);
  const [notice, setNotice] = useState("");
  const [formReady, setFormReady] = useState(false);
  const [formGen, setFormGen] = useState(0);
  const [paying, setPaying] = useState(false);
  const nuveiCfg = useRef(null);
  const submitRef = useRef(null);
  const remounts = useRef(0);
  const alive = useRef(true);
  const payingRef = useRef(false);
  const formGenRef = useRef(0);
  useEffect(() => {
    payingRef.current = paying;
  }, [paying]);
  useEffect(() => {
    formGenRef.current = formGen;
  }, [formGen]);
  // Back from a bank 3DS challenge: ?threeds=return&addon=<id>.
  const returnAddon = useRef(null);

  const refresh = (force) => {
    return loadAccessMap(force).then((map) => {
      // map === null -> access check failed; fail open by leaving ws null.
      setWs(map ? map[workspaceId] || null : null);
      setLoading(false);
    });
  };

  useEffect(() => {
    alive.current = true;
    try {
      const p = new URLSearchParams(window.location.search);
      const id = p.get("addon");
      if (p.get("threeds") === "return" && id && UUID_RE.test(id)) returnAddon.current = id;
    } catch (e) {
      /* ignore */
    }
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    setLoading(true);
    setStep("idle");
    setError("");
    setNotice("");
    refresh(false);
    return () => timers.current.forEach((t) => clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  // ---- Nuvei add-on payment ----------------------------------------------

  // The server confirmed the payment and granted the workspace: reload so the
  // gate, the sidebar badge and every cached access check read the new
  // entitlement (the server is the only source of truth).
  const unlocked = () => {
    accessCache = null;
    window.location.replace(window.location.pathname);
  };

  // Stays locked. After a decline the secure card form is shown so another
  // card can be used (Nuvei removes its form after every answer, so a fresh
  // one is mounted).
  const fail = (msg, otherCard = false) => {
    setPaying(false);
    setNotice("");
    setError(msg || tx.error);
    if (otherCard) {
      setSavedCard(null);
      setStep("card");
      setFormGen((g) => g + 1);
    } else {
      setStep("idle");
    }
  };

  const sleep = (ms) =>
    new Promise((r) => {
      timers.current.push(setTimeout(r, ms));
    });

  // The charge request left the browser but no answer came back (or the add-on
  // id is unknown): ask the server what happened instead of charging again.
  const recover = async () => {
    setStep("processing");
    for (let i = 0; i < 5 && alive.current; i += 1) {
      await sleep(3000);
      try {
        const q = await nuveiWorkspaceAddon({ workspaceId, quote: true });
        if (q?.alreadyEntitled || q?.comped || q?.status === "active") return unlocked();
        if (q?.status === "pending" && q?.addonId) return poll(q.addonId);
        if (q?.status === "confirm") break; // nothing was charged
      } catch (e) {
        /* retry */
      }
    }
    fail(tx.error);
  };

  // Wait for the bank / callback to settle the add-on (3DS, review).
  const poll = (addonId) => {
    if (!addonId) return recover();
    setStep("processing");
    setError("");
    let tries = 0;
    const tick = async () => {
      if (!alive.current) return;
      let r = null;
      try {
        r = await nuveiWorkspaceAddonStatus(addonId);
      } catch (e) {
        /* retry */
      }
      const st = String(r?.status || "");
      // 'refunded' here is a duplicate of a workspace the account already
      // holds: reload and let the server-side access check decide.
      if (st === "active" || st === "refunded") return unlocked();
      if (["payment_failed", "canceled", "suspended"].includes(st)) {
        return fail(st === "payment_failed" ? tx.declined : r?.message || tx.error, st === "payment_failed");
      }
      tries += 1;
      if (tries >= 20) {
        setStep("idle");
        setNotice(tx.pending);
        return;
      }
      timers.current.push(setTimeout(tick, 3000));
    };
    tick();
  };

  const handleResult = async (r) => {
    if (!r) return fail(tx.error);
    if (r.alreadyEntitled || r.comped || r.status === "active") return unlocked();
    if (r.requires3ds && r.challenge) {
      let next = null;
      try {
        next = await runAddonThreeDs(r, nuveiWorkspaceAddonContinue);
      } catch (e) {
        return poll(r.addonId); // the callback / 3DS return settles it
      }
      if (next?.navigated) return; // the bank's page took over the window
      return handleResult({ ...next, addonId: next?.addonId || r.addonId });
    }
    if (r.status === "pending") return poll(r.addonId);
    if (r.status === "card_required") {
      setSavedCard(null);
      setStep("card");
      return;
    }
    // A duplicate payment refunded because the account already holds this
    // workspace: reload, the server-side access check opens it.
    if (r.status === "refunded") return unlocked();
    // payment_failed (declined): stays locked.
    return fail(r.status === "payment_failed" ? tx.declined : r.message || tx.error, r.status === "payment_failed");
  };

  const payWithCard = async (cardId) => {
    setStep("processing");
    setError("");
    setNotice("");
    try {
      let testScenario;
      try {
        testScenario = new URLSearchParams(window.location.search).get("test3ds") || undefined; // staging-only hook, ignored in production
      } catch (e) {
        testScenario = undefined;
      }
      const result = await nuveiWorkspaceAddon({
        workspaceId,
        cardId,
        browserInfo: collectBrowserInfo(),
        termUrl: `${window.location.origin}${window.location.pathname}`,
        ...(testScenario ? { testScenario } : {}),
      });
      await handleResult(result);
    } catch (e) {
      const msg = e?.message || "";
      if (/failed to fetch|networkerror|load failed|timed? ?out|server error|bad gateway|gateway time/i.test(msg)) {
        return recover(); // the server may well have completed the charge
      }
      fail(e?.status === 403 ? tx.adminOnly : msg || tx.error);
    }
  };

  const handleTokenized = async (tok) => {
    setStep("processing");
    setError("");
    let cardId = null;
    try {
      if (tok?.reuseSavedCard && !tok?.token) {
        // Nuvei reported this exact card as already stored for this customer
        // without echoing its token: charge the stored card (by last4 only).
        const list = await nuveiListCards();
        const cards = list?.cards || [];
        const match = tok.last4 ? cards.find((c) => c.last4 === tok.last4) : cards.length === 1 ? cards[0] : null;
        if (!match?.id) throw new Error(tx.declined);
        cardId = match.id;
      } else {
        const saved = await nuveiSaveToken(tok);
        if (!saved?.cardId) throw new Error(tx.error);
        cardId = saved.cardId;
      }
    } catch (e) {
      return fail(e?.message || tx.error, true);
    }
    await payWithCard(cardId);
  };

  const submitCard = () => {
    setError("");
    if (!formReady || !submitRef.current || paying) return;
    setPaying(true);
    const ok = submitRef.current();
    if (!ok) {
      setPaying(false);
      setError(tx.error);
      return;
    }
    // If the secure form never answers, do not leave a frozen button.
    const gen = formGen;
    timers.current.push(
      setTimeout(() => {
        if (alive.current && payingRef.current && formGenRef.current === gen) {
          setPaying(false);
          setError(tx.error);
          setFormGen((g) => g + 1);
        }
      }, 60000),
    );
  };

  // The SDK's own messages are English; show the customer's language.
  const cardError = (err) => {
    const m = String(err?.message || "");
    if (/declin/i.test(m)) return tx.declined;
    if (/secure card form|unavailable/i.test(m)) return tx.formError;
    return m || tx.error;
  };

  // Mount Nuvei's secure card form (the PAN never touches our servers).
  useEffect(() => {
    if (step !== "card" || !user?.id) return undefined;
    let cancelled = false;
    setFormReady(false);
    setPaying(false);
    (async () => {
      try {
        // Not loaded yet when coming back from a bank 3DS page.
        const cfg = nuveiCfg.current || (await fetchNuveiConfig());
        if (cancelled) return;
        if (!cfg?.enabled) {
          setError(tx.formError);
          return;
        }
        nuveiCfg.current = cfg;
        const form = await mountNuveiForm({
          containerSelector: "#nuvei-addon-card-form",
          environment: cfg.environment,
          appCode: cfg.clientAppCode,
          appKey: cfg.clientAppKey,
          user: { id: user.id, email: user.email },
          country: "ECU",
          locale: lang,
          onIncomplete: () => {
            setPaying(false);
            setError(tx.cardIncomplete);
          },
        });
        if (cancelled) return;
        submitRef.current = form.submit;
        form.ready.then((ok) => {
          if (cancelled) return;
          if (ok) {
            remounts.current = 0;
            setFormReady(true);
          } else {
            setError(tx.formError);
          }
        });
        const tok = await form.done; // resolves after the Pay click + a valid card
        if (cancelled) return;
        setPaying(false);
        await handleTokenized(tok);
      } catch (err) {
        if (cancelled) return;
        setPaying(false);
        setError(cardError(err));
        // Fresh form for another try; stop looping on a dead SDK.
        if (remounts.current < 3) {
          remounts.current += 1;
          setFormGen((g) => g + 1);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, formGen, user?.id]);

  // Back from the bank's 3DS page: wait for the add-on to settle.
  useEffect(() => {
    if (loading || !returnAddon.current) return;
    const id = returnAddon.current;
    returnAddon.current = null;
    if (!ws || ws.accessible) {
      try {
        window.history.replaceState(null, "", window.location.pathname);
      } catch (e) {
        /* ignore */
      }
      return;
    }
    poll(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, ws]);

  if (loading) {
    return <WorkspaceSkeleton />;
  }

  // Fail open: unknown workspace, no access info, or accessible -> render it.
  if (!ws || ws.accessible) return children;

  const scheduleRefresh = () => {
    [3000, 8000, 15000].forEach((ms) => {
      const t = setTimeout(() => refresh(true), ms);
      timers.current.push(t);
    });
  };

  // Nuvei: validate + price on the server first (account admin, active plan,
  // already entitled, included credit), then confirm with the saved card or
  // show the secure card form.
  const startNuvei = async () => {
    const q = await nuveiWorkspaceAddon({ workspaceId, quote: true });
    if (q?.alreadyEntitled || q?.comped || q?.status === "active") return unlocked();
    if (q?.amount) setAmount(q.amount);
    if (q?.status === "pending") return poll(q.addonId);
    if (q?.card?.id) {
      setSavedCard(q.card);
      setStep("confirm");
      return undefined;
    }
    setSavedCard(null);
    setStep("card");
    return undefined;
  };

  const buy = async () => {
    setBuying(true);
    setError("");
    setNotice("");
    try {
      const ncfg = await fetchNuveiConfig();
      if (ncfg?.enabled) {
        nuveiCfg.current = ncfg;
        await startNuvei();
        return;
      }
      // Payment options could not be loaded at all (offline / blocked): never
      // guess and open a checkout the account may not be able to use.
      if (!ncfg) {
        setError("Checkout is not available right now. Please try again shortly.");
        return;
      }
      const intent = await workspaceApi.purchase(workspaceId);
      if (intent?.alreadyEntitled) {
        await refresh(true);
        return;
      }
      // Included with the plan (e.g. the $257 Business promo's one free
      // workspace): comped server-side with no charge — refresh, never open Paddle.
      if (intent?.comped) {
        await refresh(true);
        return;
      }
      const cfg = await fetchPaddleConfig();
      if (!cfg?.clientToken) {
        setError("Checkout is not available right now. Please try again shortly.");
        return;
      }
      if (!paddleReady.current) {
        await initPaddle(cfg, (ev) => {
          if (ev?.name === "checkout.completed") scheduleRefresh();
        });
        paddleReady.current = true;
      }
      openWorkspaceCheckout({
        priceId: intent.priceId,
        customData: intent.customData,
        email: intent.email,
      });
      scheduleRefresh();
    } catch (e) {
      // Non-admins can't purchase (billing action); surface a helpful message.
      const msg = e?.message || "Could not start checkout.";
      setError(
        e?.status === 403 || /admin/i.test(msg)
          ? tx.adminOnly
          : msg,
      );
    } finally {
      setBuying(false);
    }
  };

  const payLabel = tx.payNow.replace("{a}", money(amount));
  const busy = buying || step === "processing";

  return (
    <div style={ST.wrap}>
      <div style={ST.card}>
        <div style={ST.iconWrap}>
          <Lock size={26} />
        </div>
        <h2 style={ST.title}>{ws.name} is a paid workspace</h2>
        <p style={ST.sub}>
          Unlock {ws.name} for your whole account with the workspace add-on. It is
          billed separately and does not change your base plan.
        </p>
        <div style={ST.price}>
          <span style={ST.priceAmt}>$97</span>
          <span style={ST.pricePer}>/month</span>
        </div>
        {step === "confirm" && savedCard && (
          <p style={ST.sub}>
            {tx.payWith.replace("{a}", money(amount)).replace("{l}", savedCard.last4 || "••••")}
          </p>
        )}
        {step === "card" && <div id="nuvei-addon-card-form" style={ST.cardHost} />}
        {notice && !error && <p style={ST.sub}>{notice}</p>}
        {error && <div style={ST.error}>{error}</div>}
        {step === "confirm" && savedCard ? (
          <button style={{ ...ST.btn, opacity: busy ? 0.6 : 1 }} disabled={busy} onClick={() => payWithCard(savedCard.id)}>
            {payLabel}
          </button>
        ) : step === "card" ? (
          <button
            style={{ ...ST.btn, opacity: !formReady || paying ? 0.6 : 1 }}
            disabled={!formReady || paying}
            onClick={submitCard}
          >
            {paying ? tx.processing : payLabel}
          </button>
        ) : step === "processing" ? (
          <button style={{ ...ST.btn, opacity: 0.6 }} disabled>
            {tx.processing}
          </button>
        ) : (
          <button style={{ ...ST.btn, opacity: buying ? 0.6 : 1 }} disabled={buying} onClick={buy}>
            {buying ? "Opening…" : `Add ${ws.name}`}
          </button>
        )}
        <div style={ST.foot}>
          <ShieldCheck size={14} /> Secure checkout, cancel anytime
        </div>
      </div>
    </div>
  );
}

const ST = {
  loader: { display: "flex", alignItems: "center", gap: 8, padding: 40, color: "#64748b", fontSize: 14, justifyContent: "center" },
  wrap: { display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "48px 20px" },
  card: { maxWidth: 440, width: "100%", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: "32px 28px", textAlign: "center", boxShadow: "0 10px 30px rgba(15,23,42,0.06)" },
  iconWrap: { width: 56, height: 56, borderRadius: 14, background: "#f1f5f9", color: "#475569", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" },
  title: { fontSize: 20, fontWeight: 700, color: "#0f172a", margin: "0 0 8px" },
  sub: { fontSize: 14, color: "#64748b", margin: "0 0 18px", lineHeight: 1.5 },
  price: { display: "flex", alignItems: "baseline", justifyContent: "center", gap: 3, marginBottom: 18 },
  priceAmt: { fontSize: 30, fontWeight: 800, color: "#0f172a" },
  pricePer: { fontSize: 14, color: "#64748b" },
  error: { background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", borderRadius: 8, padding: "9px 12px", fontSize: 13, marginBottom: 12 },
  btn: { width: "100%", border: "none", background: "#0f172a", color: "#fff", borderRadius: 10, padding: "12px 18px", fontSize: 15, fontWeight: 600, cursor: "pointer" },
  foot: { display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 14, fontSize: 12, color: "#94a3b8" },
  // Host for Nuvei's secure card iframe (the SDK renders the fields).
  cardHost: { textAlign: "left", minHeight: 190, marginBottom: 14 },
};
