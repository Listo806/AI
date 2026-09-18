import { useLocation, Navigate } from "react-router-dom";
import { buildLocalizedPath, localeCodeFromPath } from "../../i18n/locales";
import { recordFirstTouch } from "../../utils/track";

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
export const CARD_QUERY =
  "utm_source=business_card&utm_medium=qr&utm_campaign=offline";

export default function CardRedirect() {
  const { pathname } = useLocation();
  // Record the whole visit as one record, and only if this browser has no
  // earlier first visit: someone who found Cortexa another way first keeps that
  // original source even if they later scan the card.
  recordFirstTouch({
    source: "business_card",
    medium: "qr",
    campaign: "offline",
    landingRoute: pathname,
  });
  // Keep the language the visitor arrived in: /card goes to /, /es/card to /es.
  const home = buildLocalizedPath("/", localeCodeFromPath(pathname));
  return <Navigate to={`${home}?${CARD_QUERY}`} replace />;
}
