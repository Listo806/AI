// Locale registry for URL-based language routing.
// English lives at the root, Spanish under /es, Brazilian Portuguese under /pt.
// `code` is the internal language code used across the app (matches cortexa_lang
// and the i18next resources). `prefix` is the URL segment. `htmlLang` is the
// value used for the <html lang> attribute and hreflang tags.
export const LOCALES = [
  { code: "en", prefix: "", htmlLang: "en" },
  { code: "es", prefix: "es", htmlLang: "es" },
  { code: "pt", prefix: "pt", htmlLang: "pt-BR" },
];

// The language codes the app supports, derived from the registry so config.js,
// the switchers, and detection all read one source of truth.
export const SUPPORTED_CODES = LOCALES.map((l) => l.code);

const byCode = Object.fromEntries(LOCALES.map((l) => [l.code, l]));
const byPrefix = Object.fromEntries(
  LOCALES.filter((l) => l.prefix).map((l) => [l.prefix, l]),
);

export const localeByCode = (code) => byCode[code] || LOCALES[0];

// Remove a leading /es, /pt or /es-ec from a path, returning the base path.
// "/es/pricing" -> "/pricing", "/es" -> "/", "/pricing" -> "/pricing".
export function stripLocaleFromPath(pathname) {
  const parts = String(pathname || "/").split("/").filter(Boolean);
  // /es-ec (the Ecuador campaign namespace) is Spanish content under its own
  // prefix; strip it too so switching language from it lands on a real page.
  if (parts.length && (byPrefix[parts[0]] || parts[0] === "es-ec")) {
    parts.shift();
  }
  if (!parts.length) return "/";
  return "/" + parts.join("/");
}

// The language a URL asks for: "/es/checkout" -> "es", "/pt" -> "pt",
// "/checkout" -> "en". The URL is the single source of truth for the language
// of a public page, ahead of any stored preference.
export function localeCodeFromPath(pathname) {
  const first = String(pathname || "/").split("/").filter(Boolean)[0];
  return (first && byPrefix[first] && byPrefix[first].code) || "en";
}

// Build the localized path for a base path in a given locale code.
// ("/pricing","en") -> "/pricing", ("/pricing","es") -> "/es/pricing",
// ("/","es") -> "/es", ("/","en") -> "/".
export function buildLocalizedPath(basePath, code) {
  const locale = localeByCode(code);
  const clean = !basePath || basePath === "/" ? "" : basePath.replace(/\/+$/, "");
  if (!locale.prefix) {
    return clean || "/";
  }
  return `/${locale.prefix}${clean}`;
}
