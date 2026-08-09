import i18n from "./config";
import { SUPPORTED_CODES } from "./locales";

// Resolve the site language the visitor is ACTUALLY using right now, for saving
// with a registration. Priority:
//   1. URL version prefix (/es, /pt) — the most reliable signal of which
//      language version of the site the page is on.
//   2. The active i18next language (LocaleLayout keeps this in sync with the URL,
//      so it stays correct even on a prefix-less page reached from a localized one).
//   3. The stored cortexa_lang, as a last resort.
// Falls back to "en" only when nothing else resolves. Never blindly forces "en".
export function currentSiteLanguage() {
  try {
    const seg = String(window.location.pathname || "")
      .split("/")
      .filter(Boolean)[0];
    if (seg === "es" || seg === "pt") return seg;

    const active = i18n && i18n.language ? String(i18n.language).slice(0, 2) : "";
    if (SUPPORTED_CODES.includes(active)) return active;

    const stored = String(localStorage.getItem("cortexa_lang") || "").slice(0, 2);
    if (SUPPORTED_CODES.includes(stored)) return stored;
  } catch (_e) {
    /* ignore and fall through */
  }
  return "en";
}
