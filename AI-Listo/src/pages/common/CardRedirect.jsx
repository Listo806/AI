import { useLocation, Navigate } from "react-router-dom";
import { buildLocalizedPath, localeCodeFromPath } from "../../i18n/locales";

/**
 * /card — the address printed on the business card.
 *
 * It is public, shows nothing of its own, and immediately sends the visitor to
 * the normal landing page with the campaign parameters attached. Its only job is
 * to mark where the visit came from, which it records before redirecting so the
 * original landing route is /card and not the landing page it forwards to.
 *
 * The values are written only when they are not already set, so a returning
 * visitor keeps whatever source first brought them in.
 */
const CARD_UTM = {
  attr_utm_source: "business_card",
  attr_utm_medium: "qr",
  attr_utm_campaign: "offline",
};

export const CARD_QUERY =
  "utm_source=business_card&utm_medium=qr&utm_campaign=offline";

function rememberCardVisit() {
  try {
    for (const [key, value] of Object.entries(CARD_UTM)) {
      if (!localStorage.getItem(key)) localStorage.setItem(key, value);
    }
    if (!localStorage.getItem("attr_landing_route")) {
      localStorage.setItem("attr_landing_route", "/card");
    }
    if (!localStorage.getItem("attr_landing_page")) {
      localStorage.setItem("attr_landing_page", `/card?${CARD_QUERY}`);
    }
    if (!localStorage.getItem("attr_first_visit_at")) {
      localStorage.setItem("attr_first_visit_at", new Date().toISOString());
    }
  } catch (_e) {
    /* best-effort: a visitor with storage blocked still reaches the site */
  }
}

export default function CardRedirect() {
  const { pathname } = useLocation();
  rememberCardVisit();
  // Keep the language the visitor arrived in: /card goes to /, /es/card to /es.
  const home = buildLocalizedPath("/", localeCodeFromPath(pathname));
  return <Navigate to={`${home}?${CARD_QUERY}`} replace />;
}
