// One source of truth for everything search engines and social platforms see.
//
// The same table drives three things, so they can never disagree: the tags
// written into the HTML at build time (scripts/build-seo.mjs), the tags updated
// in the browser when the customer navigates inside the app (src/seo/head.js),
// and sitemap.xml. Adding a public page means adding one entry here.

export const SITE_ORIGIN = "https://www.cortexaaicrm.com";
export const BRAND_NAME = "Cortexa Agentic CRM";
// The approved 1200 x 630 sharing image: logo, dashboard, "Agentic CRM Built
// Around Your Business". No real-estate-only wording, no prices.
export const SOCIAL_IMAGE = `${SITE_ORIGIN}/images/cortexa-agentic-crm-social.jpg`;
export const SOCIAL_IMAGE_TYPE = "image/jpeg";
export const LOGO_URL = `${SITE_ORIGIN}/cortexa-agentic-crm-logo.png`;
export const LEGAL_NAME = "Cortexa S-E-S S.A.S.";
export const SUPPORT_EMAIL = "support@cortexaaicrm.com";

// The three published languages. English lives at the root, Spanish under /es,
// Portuguese under /pt. `hreflang` is what search engines are told.
export const LANGUAGES = [
  { code: "en", prefix: "", hreflang: "en", htmlLang: "en", ogLocale: "en_US" },
  { code: "es", prefix: "/es", hreflang: "es", htmlLang: "es", ogLocale: "es_ES" },
  { code: "pt", prefix: "/pt", hreflang: "pt-BR", htmlLang: "pt-BR", ogLocale: "pt_BR" },
];

// Public pages that belong in search results. `file` is the source file whose
// last change date becomes the sitemap lastmod, so the dates mean something.
// `languages` lists the versions that genuinely exist; a page is only offered
// in a language when an approved translation is published for it. `type`
// selects the structured data the page can honestly carry (scripts/build-seo.mjs).
export const INDEXABLE_PAGES = [
  { path: "/", file: "src/pages/landing/Landing.jsx", languages: ["en", "es", "pt"], priority: "1.0", changefreq: "weekly", type: "home" },
  { path: "/features", file: "src/pages/common/FeaturesPage.jsx", languages: ["en", "es", "pt"], priority: "0.9", changefreq: "monthly" },
  { path: "/pricing", file: "src/pages/common/Pricing.jsx", languages: ["en", "es", "pt"], priority: "0.9", changefreq: "weekly", type: "pricing" },
  { path: "/integrations", file: "src/pages/common/IntegrationsPage.jsx", languages: ["en", "es", "pt"], priority: "0.8", changefreq: "monthly" },
  { path: "/setup-guide", file: "src/pages/common/SetupGuidePage.jsx", languages: ["en", "es", "pt"], priority: "0.6", changefreq: "monthly" },
  { path: "/about", file: "src/pages/common/About.jsx", languages: ["en", "es", "pt"], priority: "0.6", changefreq: "yearly" },
  { path: "/contact", file: "src/pages/common/Contact.jsx", languages: ["en", "es", "pt"], priority: "0.6", changefreq: "yearly" },
  { path: "/privacy-policy", file: "src/pages/common/Privacy.jsx", languages: ["en", "es", "pt"], priority: "0.3", changefreq: "yearly" },
  { path: "/terms", file: "src/pages/common/Terms.jsx", languages: ["en", "es", "pt"], priority: "0.3", changefreq: "yearly" },
  { path: "/refund-policy", file: "src/pages/common/Refund.jsx", languages: ["en", "es", "pt"], priority: "0.3", changefreq: "yearly" },
  { path: "/cancellation", file: "src/pages/common/Cancellation.jsx", languages: ["en", "es", "pt"], priority: "0.3", changefreq: "yearly" },
  { path: "/editorial/the-end-of-legacy-crm", file: "src/pages/editorial/EditorialFunnel.jsx", languages: ["en", "es", "pt"], priority: "0.7", changefreq: "yearly", type: "article" },
  { path: "/editorial/business", file: "src/pages/editorial/EditorialBusinessAI.jsx", languages: ["en", "es", "pt"], priority: "0.7", changefreq: "yearly", type: "article" },
  // Spanish and Portuguese versions of the two development pages wait for the
  // client's approved text; until then only English is published.
  { path: "/web-solutions", file: "src/pages/web-solutions/WebSolutions.jsx", languages: ["en"], priority: "0.9", changefreq: "monthly", type: "service" },
  { path: "/web-solutions/free-review", file: "src/pages/web-solutions/FreeWebsiteReview.jsx", languages: ["en"], priority: "0.6", changefreq: "monthly" },
];

// Public marketing pages that are finished but held out of search until the
// client decides they launch. They get their own title, description, canonical
// and social preview, and a noindex directive; they stay out of the sitemap.
// Moving one into INDEXABLE_PAGES is all it takes to publish it.
export const HELD_PAGES = [
  // The help search and the "AI assist" box do not work yet (they only log to
  // the console), so these stay out of search until they do.
  { path: "/help", file: "src/pages/common/HelpCenter.jsx", languages: ["en", "es", "pt"] },
  { path: "/support", file: "src/pages/common/Support.jsx", languages: ["en", "es", "pt"] },
  { path: "/e-commerce", file: "src/pages/ecommerce-product/EcommerceProduct.jsx", languages: ["en"], type: "ecommerce" },
  { path: "/e-commerce/pricing", file: "src/pages/ecommerce-product/EcommerceProduct.jsx", languages: ["en"] },
  { path: "/e-commerce/terms", file: "src/pages/ecommerce-product/EcommerceProduct.jsx", languages: ["en"] },
];

// Public but transactional: reachable by anyone, never a search result. They get
// a real page and a noindex directive, and they stay out of the sitemap.
const ALL = ["en", "es", "pt"];
export const NOINDEX_PUBLIC_PAGES = [
  ...[
    "/sign-in", "/sign-up", "/forgot-password", "/reset-password", "/trial",
    "/checkout", "/checkout-business-offer", "/payment-success", "/verify-email",
    "/onboarding", "/card",
  ].map((path) => ({ path, languages: ALL })),
  ...[
    "/web-solutions/checkout", "/e-commerce/login", "/e-commerce/signup", "/e-commerce/checkout",
  ].map((path) => ({ path, languages: ["en"] })),
];

// Everything behind a login, plus the one-time links. Rewritten to the app and
// marked noindex; never prerendered and never in the sitemap. The listings and
// vacation-rental areas stay here until the client decides on them.
export const PRIVATE_PREFIXES = [
  "/dashboard", "/account", "/settings", "/admin",
  "/e-commerce/dashboard", "/e-commerce/subscriptions", "/e-commerce/integrations",
  "/listings", "/buy", "/rent", "/vacation-rentals", "/view",
  "/accept-invite", "/activate-free", "/internal/sign-in", "/team/sign-in",
  "/sign-up-dev", "/properties", "/leads",
];

// Legacy URLs that must keep working, as real 301s rather than a client-side
// bounce. Left side is the old address, right side the current one.
export const LEGACY_REDIRECTS = [
  { from: "/pt-br", to: "/pt" },
  { from: "/pt-br/*", to: "/pt/:splat" },
  { from: "/why-legacy-crm", to: "/editorial/the-end-of-legacy-crm" },
  { from: "/editorial/the-end-of-legacy-crm/es", to: "/es/editorial/the-end-of-legacy-crm" },
  { from: "/editorial/the-end-of-legacy-crm/pt", to: "/pt/editorial/the-end-of-legacy-crm" },
  { from: "/editorial/business/es", to: "/es/editorial/business" },
  { from: "/editorial/business/pt", to: "/pt/editorial/business" },
];

// The robots directives, exactly as the approved SEO document specifies them.
export const ROBOTS_INDEX = "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";
export const ROBOTS_PRIVATE = "noindex,nofollow";
// Held pages and the legacy location pages are ordinary public pages that are
// simply not offered to search yet, so their links are still followed.
export const ROBOTS_HELD = "noindex,follow";

const byCode = Object.fromEntries(LANGUAGES.map((l) => [l.code, l]));

/** The language a URL asks for, from its prefix. "/es/pricing" -> "es". */
export function languageFromPath(pathname) {
  const first = String(pathname || "/").split("/").filter(Boolean)[0];
  const hit = LANGUAGES.find((l) => l.prefix === `/${first}`);
  // The Ecuador campaign namespace is Spanish content on its own URLs.
  if (first === "es-ec") return "es";
  return hit ? hit.code : "en";
}

/** Drop the language prefix: "/es/pricing" -> "/pricing", "/pt" -> "/". */
export function basePathOf(pathname) {
  const parts = String(pathname || "/").split("/").filter(Boolean);
  if (parts.length && (LANGUAGES.some((l) => l.prefix === `/${parts[0]}`) || parts[0] === "es-ec")) {
    parts.shift();
  }
  return parts.length ? `/${parts.join("/")}` : "/";
}

/** The absolute URL of a base path in one language. */
export function urlFor(basePath, code) {
  const lang = byCode[code] || byCode.en;
  const clean = !basePath || basePath === "/" ? "" : basePath.replace(/\/+$/, "");
  // One shape for every address: https, www, lower case, no trailing slash,
  // except the English home page which is the bare origin with one slash.
  const url = `${SITE_ORIGIN}${lang.prefix}${clean}`;
  return url === SITE_ORIGIN ? `${SITE_ORIGIN}/` : url;
}

const cleanPath = (basePath) =>
  basePath && basePath !== "/" ? basePath.replace(/\/+$/, "") : "/";

/** The page entry for a base path, or null when the path is not a public page. */
export function pageFor(basePath) {
  const key = cleanPath(basePath);
  return INDEXABLE_PAGES.find((p) => p.path === key) || null;
}

/** A finished page that is held out of search, or null. */
export function heldPageFor(basePath) {
  const key = cleanPath(basePath);
  return HELD_PAGES.find((p) => p.path === key) || null;
}

/** True when a path is private or transactional: noindex and nofollow. */
export function isPrivatePath(pathname) {
  const base = cleanPath(basePathOf(pathname));
  if (NOINDEX_PUBLIC_PAGES.some((p) => p.path === base)) return true;
  return PRIVATE_PREFIXES.some((p) => base === p || base.startsWith(`${p}/`));
}

/** True when a path must carry a noindex directive. */
export function isNoIndexPath(pathname) {
  const base = basePathOf(pathname);
  if (isPrivatePath(pathname) || heldPageFor(base)) return true;
  // The legacy country and city pages are generated from a list rather than
  // written, so they are kept out of search results.
  return !pageFor(base) && base !== "/";
}

/** The robots directive for any address. */
export function robotsFor(pathname) {
  if (isPrivatePath(pathname)) return ROBOTS_PRIVATE;
  if (isNoIndexPath(pathname)) return ROBOTS_HELD;
  return ROBOTS_INDEX;
}
