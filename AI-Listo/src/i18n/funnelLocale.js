import i18n from "./config";
import { SUPPORTED_CODES } from "./locales";

// Keeps a visitor's language through the whole funnel (pricing -> account ->
// checkout -> email verification -> workspace selection -> CRM).
//
// Public funnel pages live under a language prefix (/es, /pt, and /es-ec for
// the Ecuador campaign). LocaleLayout resets the stored language to whatever
// the URL says, so an unprefixed hop (/trial, /checkout, /sign-in) would drop a
// Spanish or Portuguese visitor back to English. Every funnel navigation
// therefore carries the prefix of the page it starts from, and redirects that
// start outside a prefixed page (auth / dashboard guards) use the account's own
// language instead.

// Same key LanguageAutoDetect / LanguageSelector use for an explicit choice.
export const LANG_CHOICE_KEY = "cortexa_lang_choice";

const LANG_PREFIX = { en: "", es: "/es", pt: "/pt" };

// "/es-ec/checkout" -> "/es-ec", "/es/pricing" -> "/es", "/pt" -> "/pt",
// "/pricing" -> "".
export function localePrefixFromPath(pathname) {
  const first = String(pathname || "/").split("/").filter(Boolean)[0] || "";
  if (first === "es-ec") return "/es-ec";
  if (first === "es") return "/es";
  if (first === "pt") return "/pt";
  return "";
}

// The language a prefix stands for ("/es-ec" is Spanish).
export function languageFromPrefix(prefix) {
  if (prefix === "/es" || prefix === "/es-ec") return "es";
  if (prefix === "/pt") return "pt";
  return "en";
}

// Join a prefix and a funnel path: ("/es", "/checkout") -> "/es/checkout",
// ("/es", "/") -> "/es", ("", "/") -> "/".
export function withLocalePrefix(prefix, path) {
  const p = !path || path === "/" ? "" : path;
  return `${prefix || ""}${p}` || "/";
}

// The account's saved language (en / es / pt), or null when unknown.
export function userLanguage(user) {
  const raw = String(
    user?.preferredLanguage || user?.preferred_language || user?.language || "",
  )
    .slice(0, 2)
    .toLowerCase();
  return SUPPORTED_CODES.includes(raw) ? raw : null;
}

// The URL prefix for an account: its saved language, with the Ecuador
// namespace kept when the account registered from an /es-ec page (stored
// landing page) or this tab is in the Ecuador campaign flow.
export function userLocalePrefix(user) {
  const lang = userLanguage(user);
  let ecuador = /\/es-ec(?:[/?#]|$)/i.test(String(user?.landingPage || user?.landing_page || ""));
  if (!ecuador) {
    try {
      ecuador = sessionStorage.getItem("cortexa_market") === "EC";
    } catch (_e) {
      ecuador = false;
    }
  }
  if (ecuador && (!lang || lang === "es")) return "/es-ec";
  return LANG_PREFIX[lang || "en"] || "";
}

// The language the visitor picked on purpose (dashboard selector or the public
// site switcher), or null.
export function explicitLanguageChoice() {
  try {
    const c = localStorage.getItem(LANG_CHOICE_KEY);
    return c && SUPPORTED_CODES.includes(c) ? c : null;
  } catch (_e) {
    return null;
  }
}

// Apply the account's language to the app (used for the unprefixed CRM /
// dashboard). An explicit choice always wins. Pages under a language prefix
// are governed by their URL (LocaleLayout), so they are left alone.
export function applyUserLanguage(user) {
  try {
    // Only the logged-in application follows the account language. Public
    // pages take their language from the address, English included.
    if (typeof window === "undefined") return;
    const path = window.location.pathname;
    const inApp = ["/dashboard", "/account", "/settings", "/admin"].some(
      (p) => path === p || path.startsWith(`${p}/`),
    );
    if (!inApp) return;
    const lang = explicitLanguageChoice() || userLanguage(user);
    if (!lang) return;
    if (String(i18n.language || "").slice(0, 2) !== lang) {
      i18n.changeLanguage(lang);
    }
    document.documentElement.lang = lang === "pt" ? "pt-BR" : lang;
  } catch (_e) {
    /* language is cosmetic: never break auth or the dashboard over it */
  }
}
