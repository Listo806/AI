// Locale registry for URL-based language routing.
// English lives at the root, Spanish under /es, Brazilian Portuguese under /pt-br.
// `code` is the internal language code used across the app (matches cortexa_lang
// and the i18next resources). `prefix` is the URL segment. `htmlLang` is the
// value used for the <html lang> attribute and hreflang tags.
export const LOCALES = [
  { code: "en", prefix: "", htmlLang: "en" },
  { code: "es", prefix: "es", htmlLang: "es" },
  { code: "pt", prefix: "pt-br", htmlLang: "pt-BR" },
];

const byCode = Object.fromEntries(LOCALES.map((l) => [l.code, l]));
const byPrefix = Object.fromEntries(
  LOCALES.filter((l) => l.prefix).map((l) => [l.prefix, l]),
);

export const localeByCode = (code) => byCode[code] || LOCALES[0];

// Remove a leading /es or /pt-br from a path, returning the base path.
// "/es/pricing" -> "/pricing", "/es" -> "/", "/pricing" -> "/pricing".
export function stripLocaleFromPath(pathname) {
  const parts = String(pathname || "/").split("/").filter(Boolean);
  if (parts.length && byPrefix[parts[0]]) {
    parts.shift();
  }
  if (!parts.length) return "/";
  return "/" + parts.join("/");
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
