// Loader + thin wrapper for the Paymentez (Nuvei/Datafast) browser tokenization
// SDK. The card is entered inside Nuvei's own iframe form, so the PAN/CVV never
// touch our servers (PCI SAQ-A). generate_tokenize renders the form into a
// container and calls back with the card token.
//
// Docs: https://developers.paymentez.com/docs/payments  (PaymentGateway)

const SDK_SRC = "https://cdn.paymentez.com/ccapi/sdk/payment_sdk_stable.min.js";

let sdkPromise = null;

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

/**
 * Render the Nuvei tokenization form into `containerSelector` and resolve with
 * the card token when the customer submits it.
 *
 * @returns Promise<{ token, bin, last4, brand, expiryMonth, expiryYear, transactionReference }>
 */
export async function tokenizeCard({
  containerSelector,
  environment,
  appCode,
  appKey,
  user,
  country = "ECU",
  locale = "en",
}) {
  const PaymentGateway = await loadNuveiSdk();
  if (!PaymentGateway) throw new Error("The secure card form is unavailable.");

  const pg = new PaymentGateway(envMode(environment), appCode, appKey);

  return new Promise((resolve, reject) => {
    pg.generate_tokenize(
      {
        locale,
        user: { id: String(user?.id || ""), email: String(user?.email || "") },
        configuration: { default_country: country },
      },
      containerSelector,
      (response) => {
        const card = response?.card;
        if (card?.token && card?.status !== "rejected") {
          resolve({
            token: card.token,
            bin: card.bin,
            last4: card.number,
            brand: card.type,
            expiryMonth: card.expiry_month,
            expiryYear: card.expiry_year,
            status: card.status,
            transactionReference: card.transaction_reference,
          });
        } else {
          reject(new Error(card?.message || "The card could not be verified."));
        }
      },
      (message) => reject(new Error(message || "Please complete the card form.")),
    );
  });
}
