// Runs straight after `vite build`.
//
// The app renders in the browser, so a crawler or a chat app that does not run
// JavaScript would otherwise receive one identical shell for every address.
// This writes a real HTML file per public page and language, with that page's
// own title, description, canonical, language, robots directive, social preview
// and structured data already in the response. It also writes sitemap.xml,
// robots.txt, the redirect rules and a genuine 404 page.
//
// Everything comes from src/seo/site.js and src/i18n/seo.js, so the tags in the
// HTML, the tags the app sets while the customer navigates, and the sitemap can
// never drift apart.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import {
  SITE_ORIGIN, BRAND_NAME, SOCIAL_IMAGE, LANGUAGES, INDEXABLE_PAGES,
  NOINDEX_PUBLIC_PAGES, PRIVATE_PREFIXES, LEGACY_REDIRECTS, urlFor,
} from "../src/seo/site.js";
import { resolveSeo } from "../src/i18n/seo.js";

const DIST = path.resolve("dist");
const byCode = Object.fromEntries(LANGUAGES.map((l) => [l.code, l]));
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;")
  .replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// The prices the pricing page actually shows. Marking up anything else would be
// a false claim, so the build fails if the page and this list disagree.
const PLANS = [
  { key: "solo", name: "Solo", monthly: 127 },
  { key: "team", name: "Team", monthly: 297 },
  { key: "growth", name: "Growth", monthly: 497 },
];
function assertPricesMatchThePage() {
  const src = fs.readFileSync("src/pages/common/Pricing.jsx", "utf8");
  const missing = PLANS.filter((p) => !new RegExp(`monthly:\\s*${p.monthly}\\b`).test(src));
  if (missing.length) {
    throw new Error(
      `Pricing structured data is out of date: ${missing.map((p) => p.name).join(", ")}. ` +
        "Update PLANS in scripts/build-seo.mjs to match src/pages/common/Pricing.jsx.",
    );
  }
}

// The date a page's content last changed, taken from its source file's last
// commit, so sitemap dates mean something instead of being today's date.
function lastModified(file) {
  try {
    const out = execFileSync("git", ["log", "-1", "--format=%cs", "--", file], {
      encoding: "utf8",
    }).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(out)) return out;
  } catch (_e) {
    /* a shallow clone or a new file: fall back to the build date */
  }
  return new Date().toISOString().slice(0, 10);
}

// The structured data a page can honestly carry.
function structuredData(page, code, url) {
  const seo = resolveSeo(page.path, code);
  const lang = byCode[code];
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND_NAME,
    url: `${SITE_ORIGIN}/`,
    logo: `${SITE_ORIGIN}/cortexa-email-logo.png`,
    description: resolveSeo("/", "en").description,
  };
  const blocks = [];
  if (page.type === "home") {
    blocks.push(organization, {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: BRAND_NAME,
      url: `${SITE_ORIGIN}/`,
      inLanguage: lang.hreflang,
      description: seo.description,
    });
  } else {
    // Breadcrumbs: home, then this page. Two levels, because that is the real
    // depth of the site.
    blocks.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: BRAND_NAME, item: urlFor("/", code) },
        { "@type": "ListItem", position: 2, name: seo.title.split("—")[0].split("|")[0].trim(), item: url },
      ],
    });
  }
  if (page.type === "article") {
    blocks.push({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: seo.title.split("|")[0].split("—")[0].trim(),
      description: seo.description,
      inLanguage: lang.hreflang,
      mainEntityOfPage: url,
      image: SOCIAL_IMAGE,
      author: { "@type": "Organization", name: BRAND_NAME, url: `${SITE_ORIGIN}/` },
      publisher: {
        "@type": "Organization",
        name: BRAND_NAME,
        logo: { "@type": "ImageObject", url: `${SITE_ORIGIN}/cortexa-email-logo.png` },
      },
      datePublished: lastModified(page.file),
      dateModified: lastModified(page.file),
    });
  }
  if (page.type === "pricing") {
    blocks.push({
      "@context": "https://schema.org",
      "@type": "Product",
      name: BRAND_NAME,
      description: seo.description,
      brand: { "@type": "Brand", name: BRAND_NAME },
      offers: PLANS.map((p) => ({
        "@type": "Offer",
        name: `${p.name} plan`,
        price: String(p.monthly),
        priceCurrency: "USD",
        url,
        availability: "https://schema.org/InStock",
      })),
    });
  }
  return blocks;
}

// The <head> for one page in one language.
function headFor({ page, code, indexable }) {
  const lang = byCode[code];
  const url = urlFor(page.path, code);
  const seo = resolveSeo(page.path, code);
  const tags = [
    `<title>${esc(seo.title)}</title>`,
    `<meta name="description" content="${esc(seo.description)}" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta name="robots" content="${indexable ? "index, follow, max-image-preview:large" : "noindex, follow"}" />`,
    `<meta property="og:type" content="${page.type === "article" ? "article" : "website"}" />`,
    `<meta property="og:site_name" content="${esc(BRAND_NAME)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:title" content="${esc(seo.title)}" />`,
    `<meta property="og:description" content="${esc(seo.description)}" />`,
    `<meta property="og:locale" content="${lang.ogLocale}" />`,
    `<meta property="og:image" content="${SOCIAL_IMAGE}" />`,
    `<meta property="og:image:secure_url" content="${SOCIAL_IMAGE}" />`,
    `<meta property="og:image:type" content="image/jpeg" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${esc(BRAND_NAME)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(seo.title)}" />`,
    `<meta name="twitter:description" content="${esc(seo.description)}" />`,
    `<meta name="twitter:image" content="${SOCIAL_IMAGE}" />`,
    `<meta name="twitter:image:alt" content="${esc(BRAND_NAME)}" />`,
  ];
  if (indexable) {
    // Every language version points at every other one, and at itself, which is
    // what search engines require before they will treat them as one page.
    for (const other of page.languages) {
      tags.push(
        `<link rel="alternate" hreflang="${byCode[other].hreflang}" href="${esc(urlFor(page.path, other))}" />`,
      );
    }
    tags.push(`<link rel="alternate" hreflang="x-default" href="${esc(urlFor(page.path, "en"))}" />`);
    for (const block of structuredData(page, code, url)) {
      tags.push(`<script type="application/ld+json">${JSON.stringify(block)}</script>`);
    }
  }
  return tags.map((t) => `    ${t}`).join("\n");
}

// Take the built shell and swap its placeholder head for this page's head.
function renderPage(shell, { page, code, indexable }) {
  const lang = byCode[code];
  return shell
    .replace(/<html lang="[^"]*"/, `<html lang="${lang.htmlLang}"`)
    .replace("<!--seo-head-->", headFor({ page, code, indexable }));
}

// The country and city pages are generated from a list inside the page itself.
// Read that list so the rules below cover exactly those addresses and nothing
// else. A format change fails the build rather than silently 404ing the pages.
function legacyLocationPaths() {
  const paths = new Set();
  for (const file of ["src/pages/common/CityPage.jsx", "src/pages/common/CountryPage.jsx"]) {
    const src = fs.readFileSync(file, "utf8");
    const block = src.slice(src.indexOf("const countries = {"), src.indexOf("\n};"));
    for (const [, country, cities] of block.matchAll(/(\w[\w-]*):\s*\[([^\]]*)\]/g)) {
      paths.add(`/${country}`);
      for (const [, city] of cities.matchAll(/"([^"]+)"/g)) paths.add(`/${country}/${city}`);
    }
  }
  if (paths.size < 10) {
    throw new Error("Could not read the country/city list; the redirect rules would be wrong.");
  }
  return [...paths].sort();
}

function write(relPath, contents) {
  const full = path.join(DIST, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, contents, "utf8");
}

function main() {
  assertPricesMatchThePage();
  // The untouched output of the bundler is kept aside, because this script
  // overwrites dist/index.html with the home page and would otherwise have
  // nothing left to build the other pages from when it runs a second time.
  const shellCopy = path.join(DIST, ".shell.html");
  if (!fs.existsSync(shellCopy)) {
    fs.copyFileSync(path.join(DIST, "index.html"), shellCopy);
  }
  const shell = fs.readFileSync(shellCopy, "utf8");
  if (!shell.includes("<!--seo-head-->")) {
    throw new Error("index.html is missing the <!--seo-head--> marker; nothing would be injected.");
  }

  const written = [];
  const sitemap = [];

  // 1. Every public page that belongs in search, in each language it exists in.
  for (const page of INDEXABLE_PAGES) {
    const lastmod = lastModified(page.file);
    for (const code of page.languages) {
      const prefix = byCode[code].prefix;
      const out = `${prefix}${page.path === "/" ? "" : page.path}/index.html`.replace(/^\//, "");
      write(out || "index.html", renderPage(shell, { page, code, indexable: true }));
      written.push(out || "index.html");
      sitemap.push({ page, code, lastmod });
    }
  }

  // 2. Public pages that must never be a search result: a real page, a real
  //    noindex directive, and out of the sitemap.
  for (const base of NOINDEX_PUBLIC_PAGES) {
    const page = { path: base, languages: ["en", "es", "pt"], file: "src/App.jsx" };
    for (const code of ["en", "es", "pt"]) {
      const out = `${byCode[code].prefix}${base}/index.html`.replace(/^\//, "");
      write(out, renderPage(shell, { page, code, indexable: false }));
      written.push(out);
    }
  }

  // 3. The shell the application itself is served from, and the 404 page. Both
  //    are noindex: one is behind a login, the other is not a page at all.
  const appShell = renderPage(shell, {
    page: { path: "/", languages: ["en"], file: "src/App.jsx" },
    code: "en",
    indexable: false,
  });
  write("app.html", appShell);
  write(
    "404.html",
    appShell.replace(/<title>[^<]*<\/title>/, `<title>Page not found — ${esc(BRAND_NAME)}</title>`),
  );

  // 4. sitemap.xml, with each page listing its other languages.
  const urls = sitemap.map(({ page, code, lastmod }) => {
    const alternates = page.languages
      .map(
        (other) =>
          `    <xhtml:link rel="alternate" hreflang="${byCode[other].hreflang}" href="${esc(urlFor(page.path, other))}"/>`,
      )
      .concat(`    <xhtml:link rel="alternate" hreflang="x-default" href="${esc(urlFor(page.path, "en"))}"/>`)
      .join("\n");
    return [
      "  <url>",
      `    <loc>${esc(urlFor(page.path, code))}</loc>`,
      `    <lastmod>${lastmod}</lastmod>`,
      `    <changefreq>${page.changefreq || "monthly"}</changefreq>`,
      `    <priority>${page.priority || "0.5"}</priority>`,
      alternates,
      "  </url>",
    ].join("\n");
  });
  write(
    "sitemap.xml",
    [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
      ...urls,
      "</urlset>",
      "",
    ].join("\n"),
  );

  // 5. robots.txt: everything public is open, everything private is closed, and
  //    the sitemap is announced.
  // Only genuinely private areas are blocked here. The public transactional
  // pages (sign-in, checkout, and so on) are left crawlable on purpose: a page
  // blocked in robots.txt can still be listed, because the crawler is never
  // allowed to read the noindex tag that would remove it.
  const disallow = [...PRIVATE_PREFIXES]
    .sort()
    .map((p) => `Disallow: ${p}`)
    .join("\n");
  write(
    "robots.txt",
    ["User-agent: *", "Allow: /", disallow, "", `Sitemap: ${SITE_ORIGIN}/sitemap.xml`, ""].join("\n"),
  );

  // 6. Redirects and rewrites. Old addresses become real 301s, the application
  //    keeps its own routes, and anything else is a genuine 404 instead of an
  //    empty page answered with 200.
  const rules = [
    "# Generated by scripts/build-seo.mjs. Edit src/seo/site.js, not this file.",
    "",
    "# The Netlify preview address is not a second site.",
    "https://stirring-liger-864437.netlify.app/*    https://www.cortexaaicrm.com/:splat    301!",
    "",
    "# Old addresses, as permanent redirects.",
    ...LEGACY_REDIRECTS.map((r) => `${r.from}    ${r.to}    301!`),
    "",
    "# The application: served by the app shell, never indexed.",
    ...PRIVATE_PREFIXES.flatMap((p) => [`${p}    /app.html    200`, `${p}/*    /app.html    200`]),
    ...["/es", "/pt", "/es-ec"].flatMap((prefix) =>
      PRIVATE_PREFIXES.map((p) => `${prefix}${p}/*    /app.html    200`),
    ),
    "",
    "# The Ecuador campaign namespace shares the Spanish pages.",
    "/es-ec    /es/index.html    200",
    "/es-ec/*    /es/:splat    200",
    "",
    "# Legacy country and city pages: still reachable, never indexed. Listed one",
    "# by one so that every other unknown address still reaches the 404.",
    ...legacyLocationPaths().map((p) => `${p}    /app.html    200`),
    "",
    "# Anything else does not exist.",
    "/*    /404.html    404",
  ];
  write("_redirects", rules.join("\n") + "\n");

  console.log(
    `SEO build: ${written.length} pages written, ${sitemap.length} urls in sitemap.xml, ` +
      "robots.txt, _redirects and a real 404 page.",
  );
}

main();
