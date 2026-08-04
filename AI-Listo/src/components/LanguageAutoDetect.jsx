import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { buildLocalizedPath, SUPPORTED_CODES } from "../i18n/locales";

// Keys owned by the language logic.
//  - AUTODETECT_KEY: set once we've run first-visit detection for this browser,
//    so it happens exactly once and never fights later navigation.
//  - CHOICE_KEY: set only when the visitor EXPLICITLY picks a language (the
//    dashboard/site switcher). An explicit choice always wins over detection.
// We deliberately do NOT read preferredLanguage / cortexa_lang here: LocaleLayout
// writes those to the current URL's language during render (before this effect
// runs), so on the English root they would always read "en" and make every
// first-time visitor look like they'd already chosen English — which silently
// disabled detection entirely.
export const LANG_CHOICE_KEY = "cortexa_lang_choice";
const AUTODETECT_KEY = "cortexa_autodetect_done";

// First-visit browser-language detection.
//
// On a visitor's first arrival at the homepage ("/"), if they have not made an
// explicit language choice, a Spanish or Portuguese browser is sent to /es or
// /pt; English (and any other language) stays on the English root. It runs at
// most once per browser and never overrides an explicit choice, so it can't loop
// or fight a manual switch. Scoped to the homepage on purpose — the authed app is
// not language-prefixed, so redirecting deep paths is out of scope here.
export default function LanguageAutoDetect() {
  const location = useLocation();
  const navigate = useNavigate();
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    if (location.pathname !== "/") return;
    ranRef.current = true;

    let alreadyDetected = false;
    let explicitChoice = null;
    try {
      alreadyDetected = localStorage.getItem(AUTODETECT_KEY) === "1";
      explicitChoice = localStorage.getItem(LANG_CHOICE_KEY);
    } catch (_e) {
      /* storage blocked — treat as first visit, no explicit choice */
    }

    // An explicit choice always wins: never auto-redirect over it.
    if (explicitChoice) return;
    // First visit only.
    if (alreadyDetected) return;
    try {
      localStorage.setItem(AUTODETECT_KEY, "1");
    } catch (_e) {
      /* storage blocked — detection just won't be remembered */
    }

    const langs =
      (typeof navigator !== "undefined" &&
        (navigator.languages && navigator.languages.length
          ? navigator.languages
          : [navigator.language])) ||
      [];
    const primary = String(langs[0] || "")
      .slice(0, 2)
      .toLowerCase();

    // Only redirect for a supported, non-English language; en / unsupported stay
    // on the English root.
    if (primary === "en" || !SUPPORTED_CODES.includes(primary)) return;

    // Preserve the query string and hash across the redirect so ad-tracking
    // params (utm_*, gclid) and one-off flags (?exitoffer=...) are not lost when
    // a Spanish/Portuguese visitor is moved from "/" to "/es" or "/pt".
    navigate(
      buildLocalizedPath("/", primary) + location.search + location.hash,
      { replace: true },
    );
  }, [location.pathname, location.search, location.hash, navigate]);

  return null;
}
