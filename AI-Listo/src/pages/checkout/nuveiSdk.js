// Loader + thin wrapper for the Paymentez (Nuvei/Datafast) browser tokenization
// SDK. The card is entered inside Nuvei's own iframe form, so the PAN/CVV never
// touch our servers (PCI SAQ-A). generate_tokenize renders the form into a
// container and calls back with the card token.
//
// Docs: https://developers.paymentez.com/docs/payments  (PaymentGateway)

const SDK_SRC = "https://cdn.paymentez.com/ccapi/sdk/payment_sdk_stable.min.js";

let sdkPromise = null;

// One SDK instance per app code. Each `new PaymentGateway()` registers its own
// window `message` listener, and every listener's callback removes the SDK's
// iframe; with two instances the stale one removes it first and the live one
// throws inside its listener, so a retry after a decline never gets a response.
let pgInstance = null;
let pgInstanceKey = null;

// The SDK declares `class PaymentGateway` at the top level of a CLASSIC script.
// A top-level class is a global *lexical* binding (bare `PaymentGateway`), NOT a
// property of `window`, so module code can't see it directly. This inline
// classic script runs in global scope, where the bare binding is visible, and
// copies it onto `window` so the bundled app can use `window.PaymentGateway`.
function bridgeGlobal() {
  try {
    const b = document.createElement("script");
    b.text =
      "try{if(typeof PaymentGateway!=='undefined')window.PaymentGateway=PaymentGateway;}catch(e){}";
    document.head.appendChild(b);
    document.head.removeChild(b);
  } catch (e) {
    /* ignore */
  }
  return window.PaymentGateway;
}

export function loadNuveiSdk() {
  if (typeof window !== "undefined" && window.PaymentGateway) {
    return Promise.resolve(window.PaymentGateway);
  }
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${SDK_SRC}"]`);
    if (existing) {
      if (bridgeGlobal()) return resolve(window.PaymentGateway);
      existing.addEventListener("load", () => resolve(bridgeGlobal()));
      existing.addEventListener("error", () =>
        reject(new Error("Could not load the secure card form.")),
      );
      return;
    }
    const s = document.createElement("script");
    s.src = SDK_SRC;
    s.charset = "UTF-8";
    s.async = true;
    s.onload = () => resolve(bridgeGlobal());
    s.onerror = () => reject(new Error("Could not load the secure card form."));
    document.head.appendChild(s);
  });
  return sdkPromise;
}

// env: 'staging' | 'production' (from /nuvei/config). Maps to the SDK's stg/prod.
function envMode(env) {
  return String(env).toLowerCase().startsWith("prod") ? "prod" : "stg";
}

function mapCard(response) {
  const card = response?.card;
  // The same card typed again for the same customer: Nuvei keeps one token per
  // card and answers "already added" instead of a new token. Tell the checkout
  // to charge the stored card rather than reporting a decline.
  const errText = [
    response?.error?.type, response?.error?.description, response?.error?.help,
    card?.message, response?.message,
  ].filter(Boolean).join(" | ");
  if (/already\s*(added|exist|registered)/i.test(errText)) {
    // Nuvei's answer carries the existing token ("Card already added: <token>"),
    // so the stored card can be charged directly.
    const m = errText.match(/already\s*added[:\s]*([0-9A-Za-z_-]{6,})/i);
    return { reuseSavedCard: true, token: m ? m[1] : undefined, last4: card?.number, bin: card?.bin, brand: card?.type };
  }
  if (card?.token && card?.status !== "rejected") {
    return {
      token: card.token,
      bin: card.bin,
      last4: card.number,
      brand: card.type,
      expiryMonth: card.expiry_month,
      expiryYear: card.expiry_year,
      status: card.status,
      transactionReference: card.transaction_reference,
    };
  }
  // Never surface the raw provider string (e.g. "Response by mock") to a
  // customer; log it for support and show a clear, friendly decline.
  if (errText) console.warn("Nuvei card rejected:", errText);
  throw new Error("This card was declined. Please check the details or try another card.");
}

/**
 * Mount the Nuvei tokenization form into `containerSelector`.
 *
 * The Paymentez SDK renders only the card fields (in a secure iframe); the
 * merchant must call `pg.tokenize()` to submit. So this returns:
 *   - `ready`  : resolves once the secure iframe has rendered (enable "Pay")
 *   - `submit` : call on the Pay click to tokenize the entered card
 *   - `done`   : resolves with the card token (or rejects) after submit
 */
export async function mountNuveiForm({
  containerSelector,
  environment,
  appCode,
  appKey,
  user,
  country = "ECU",
  locale = "en",
  onIncomplete,
}) {
  const PaymentGateway = await loadNuveiSdk();
  if (!PaymentGateway) throw new Error("The secure card form is unavailable.");

  const key = `${envMode(environment)}|${appCode}`;
  if (!pgInstance || pgInstanceKey !== key) {
    pgInstance = new PaymentGateway(envMode(environment), appCode, appKey);
    pgInstanceKey = key;
  }
  const pg = pgInstance;

  let resolveDone, rejectDone;
  const done = new Promise((res, rej) => {
    resolveDone = res;
    rejectDone = rej;
  });

  pg.generate_tokenize(
    {
      locale,
      user: { id: String(user?.id || ""), email: String(user?.email || "") },
      configuration: { default_country: country },
    },
    containerSelector,
    (response) => {
      try {
        resolveDone(mapCard(response));
      } catch (e) {
        rejectDone(e);
      }
    },
    (message) => {
      // Incomplete form: let the customer fix and resubmit — don't tear it down.
      if (typeof onIncomplete === "function") {
        onIncomplete(message || "Please complete the card details.");
      } else {
        rejectDone(new Error(message || "Please complete the card form."));
      }
    },
  );

  // The iframe is created after an async handshake; resolve `ready` once it's up.
  const ready = new Promise((resolve) => {
    const started = Date.now();
    const tick = () => {
      const el = document.querySelector(`${containerSelector} iframe`);
      if (el || Date.now() - started > 90000) return resolve(!!el);
      setTimeout(tick, 300);
    };
    tick();
  });

  return {
    ready,
    done,
    submit: () => {
      try {
        pg.tokenize();
        return true;
      } catch (e) {
        return false;
      }
    },
  };
}
