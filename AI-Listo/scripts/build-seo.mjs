// Runs straight after `vite build`.
//
// The app renders in the browser, so a crawler or a chat app that does not run
// JavaScript would otherwise receive one identical shell for every address.
// This writes a real HTML file per public page and language, with that page's
// own title, description, canonical, language, robots directive, social preview
// and structured data already in the response. It also writes sitemap.xml,
// robots.txt, llms.txt, the redirect rules and a genuine 404 page.
//
// Everything comes from src/seo/site.js and src/i18n/seo.js, so the tags in the
// HTML, the tags the app sets while the customer navigates, and the sitemap can
// never drift apart.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import {
  SITE_ORIGIN, BRAND_NAME, SOCIAL_IMAGE, SOCIAL_IMAGE_TYPE, LOGO_URL, LEGAL_NAME,
  SUPPORT_EMAIL, LANGUAGES, INDEXABLE_PAGES, HELD_PAGES, NOINDEX_PUBLIC_PAGES,
  PRIVATE_PREFIXES, LEGACY_REDIRECTS, ROBOTS_INDEX, ROBOTS_PRIVATE, ROBOTS_HELD,
  urlFor, pageFor,
} from "../src/seo/site.js";
import { resolveSeo } from "../src/i18n/seo.js";

const DIST = path.resolve("dist");
const byCode = Object.fromEntries(LANGUAGES.map((l) => [l.code, l]));
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;")
  .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// JSON-LD inside a <script> must not be able to close the tag.
const ldJson = (block) => JSON.stringify(block).replace(/</g, "\\u003c");

// The approved company and product descriptions (Cortexa SEO document, section 1).
const COMPANY_DESCRIPTION =
  "Cortexa Agentic CRM connects leads, contacts, WhatsApp conversations, AI agents, workflows, " +
  "pipelines, appointments, analytics, integrations, and specialized business workspaces in one " +
  "connected system. Cortexa also designs, develops, modernizes, and connects websites, custom " +
  "software, digital products, customer portals, CRM systems, AI agents, APIs, payments, " +
  "appointments, communications, automation, analytics, and business data.";
const CRM_DESCRIPTION =
  "Cortexa Agentic CRM connects leads, contacts, WhatsApp conversations, AI agents, workflows, " +
  "pipelines, appointments, analytics, integrations, and specialized business workspaces in one " +
  "connected system.";
const CRM_FEATURES = [
  "AI Agent", "Lead Management", "Contact Management", "WhatsApp Conversations",
  "Workflow Automation", "Sales Pipelines", "Appointment Booking", "Analytics and Reporting",
  "Integrations", "Specialized Workspaces", "Team Collaboration",
];
const DEVELOPMENT_SERVICE_TYPES = [
  "Web Development", "Custom Software Development", "Digital Product Engineering",
  "Software Modernization", "CRM and AI Integration", "API Integration",
  "Workflow Automation", "Systems Integration",
];

// The plans exactly as the pricing page shows them and the checkout charges
// them. Structured data may only carry prices that match the live checkout, so
// the build fails if the pricing page or the backend plan catalogue disagree.
const PLANS = [
  { key: "solo", name: "Solo", activation: 11, monthly: 127 },
  { key: "team", name: "Business", activation: 22, monthly: 297 },
  { key: "growth", name: "Scale", activation: 33, monthly: 497 },
];
function assertPricesMatchTheCheckout() {
  const src = fs.readFileSync("src/pages/common/Pricing.jsx", "utf8");
  // The prices the page renders live in its `billingPrices` table.
  const start = src.indexOf("billingPrices = {");
  const page = start >= 0 ? src.slice(start, src.indexOf("\n  };", start)) : "";
  const problems = [];
  for (const p of PLANS) {
    const block = page.match(new RegExp(`\\b${p.key}:\\s*\\{([^}]*)\\}`));
    const activation = block && block[1].match(/activation:\s*(\d+)/);
    const monthly = block && block[1].match(/monthly:\s*(\d+)/);
    if (!activation || Number(activation[1]) !== p.activation || !monthly || Number(monthly[1]) !== p.monthly) {
      problems.push(`${p.name} on the pricing page`);
    }
  }
  // The backend catalogue drives the Nuvei checkout. It is in the same
  // repository; when it is present, it must agree too.
  const catalogue = path.resolve("../ninja_backend/src/plans/plan-config.ts");
  if (fs.existsSync(catalogue)) {
    const src = fs.readFileSync(catalogue, "utf8");
    for (const p of PLANS) {
      const re = new RegExp(`introCents:\\s*${p.activation * 100},\\s*monthlyCents:\\s*${p.monthly * 100}\\b`);
      if (!re.test(src)) problems.push(`${p.name} in the checkout plan catalogue`);
    }
  }
  if (problems.length) {
    throw new Error(
      `Pricing structured data no longer matches: ${problems.join(", ")}. ` +
        "Update PLANS in scripts/build-seo.mjs only after confirming the live checkout prices.",
    );
  }
}

// The homepage FAQ, read from the page itself so the FAQPage markup can only
// ever contain the questions and answers visitors actually see.
function homepageFaq(code) {
  const src = fs.readFileSync("src/pages/landing/LandingDesktop.jsx", "utf8");
  const blocks = [...src.matchAll(/\bfaq:\s*\[([\s\S]*?)\n\s*\],/g)].map((m) => m[1]);
  const index = { en: 0, es: 1, pt: 2 }[code];
  const block = blocks[index];
  const str = `"((?:[^"\\\\]|\\\\.)*)"`;
  const items = block
    ? [...block.matchAll(new RegExp(`\\{\\s*q:\\s*${str},\\s*a:\\s*${str}\\s*\\}`, "g"))].map((m) => ({
        q: JSON.parse(`"${m[1]}"`),
        a: JSON.parse(`"${m[2]}"`),
      }))
    : [];
  if (items.length < 5) {
    throw new Error(`Could not read the ${code} homepage FAQ from LandingDesktop.jsx; FAQPage markup would be wrong.`);
  }
  return items;
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

// The short name of a page, for breadcrumbs: its title up to the first "|".
const shortName = (base, code) => resolveSeo(base, code).title.split("|")[0].trim();

const ORG_ID = `${SITE_ORIGIN}/#organization`;
const SITE_ID = `${SITE_ORIGIN}/#website`;

function breadcrumbs(page, code) {
  // Home, then every ancestor that is itself a public page, then this page.
  const trail = [{ name: "Cortexa", item: urlFor("/", code) }];
  const parts = page.path.split("/").filter(Boolean);
  for (let i = 1; i < parts.length; i += 1) {
    const ancestor = `/${parts.slice(0, i).join("/")}`;
    if (pageFor(ancestor)) trail.push({ name: shortName(ancestor, code), item: urlFor(ancestor, code) });
  }
  trail.push({ name: shortName(page.path, code), item: urlFor(page.path, code) });
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({ "@type": "ListItem", position: i + 1, name: t.name, item: t.item })),
  };
}

function planOffers(url) {
  return PLANS.map((p) => ({
    "@type": "Offer",
    name: `${p.name} plan`,
    url,
    price: String(p.monthly),
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
    priceSpecification: [
      {
        "@type": "UnitPriceSpecification",
        name: "One-time activation",
        price: String(p.activation),
        priceCurrency: "USD",
      },
      {
        "@type": "UnitPriceSpecification",
        name: "Monthly subscription after the 14-day trial",
        price: String(p.monthly),
        priceCurrency: "USD",
        unitCode: "MON",
        referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "MON" },
      },
    ],
  }));
}

// The structured data a page can honestly carry.
function structuredData(page, code, url) {
  const seo = resolveSeo(page.path, code);
  const lang = byCode[code];
  const blocks = [];
  if (page.type === "home") {
    blocks.push(
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": ORG_ID,
        name: "Cortexa",
        legalName: LEGAL_NAME,
        url: `${SITE_ORIGIN}/`,
        logo: LOGO_URL,
        description: COMPANY_DESCRIPTION,
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: SUPPORT_EMAIL,
          availableLanguage: ["English", "Spanish", "Portuguese"],
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": SITE_ID,
        name: BRAND_NAME,
        url: `${SITE_ORIGIN}/`,
        inLanguage: lang.hreflang,
        publisher: { "@id": ORG_ID },
      },
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: BRAND_NAME,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: `${SITE_ORIGIN}/`,
        description: CRM_DESCRIPTION,
        featureList: CRM_FEATURES,
        publisher: { "@id": ORG_ID },
        offers: {
          "@type": "AggregateOffer",
          lowPrice: String(Math.min(...PLANS.map((p) => p.monthly))),
          highPrice: String(Math.max(...PLANS.map((p) => p.monthly))),
          priceCurrency: "USD",
          offerCount: String(PLANS.length),
          url: urlFor("/pricing", code),
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        inLanguage: lang.hreflang,
        mainEntity: homepageFaq(code).map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    );
    return blocks;
  }

  blocks.push(breadcrumbs(page, code));
  if (page.type === "article") {
    blocks.push({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: shortName(page.path, code),
      description: seo.description,
      inLanguage: lang.hreflang,
      mainEntityOfPage: url,
      image: SOCIAL_IMAGE,
      author: { "@type": "Organization", name: "Cortexa", url: `${SITE_ORIGIN}/` },
      publisher: {
        "@type": "Organization",
        name: "Cortexa",
        logo: { "@type": "ImageObject", url: LOGO_URL },
      },
      datePublished: lastModified(page.file),
      dateModified: lastModified(page.file),
    });
  }
  if (page.type === "pricing") {
    blocks.push({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: BRAND_NAME,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: `${SITE_ORIGIN}/`,
      description: CRM_DESCRIPTION,
      offers: planOffers(url),
    });
  }
  if (page.type === "service") {
    // No price: the page says services start at $147, which is not the price of
    // a project, so marking it up as one would be a false claim.
    blocks.push(
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: seo.title,
        description: seo.description,
        url,
        inLanguage: lang.hreflang,
        isPartOf: { "@type": "WebSite", name: BRAND_NAME, url: `${SITE_ORIGIN}/` },
      },
      {
        "@context": "https://schema.org",
        "@type": "Service",
        name: "Web & Software Development and Systems Integration",
        description: seo.description,
        url,
        serviceType: DEVELOPMENT_SERVICE_TYPES,
        provider: { "@type": "Organization", name: "Cortexa", legalName: LEGAL_NAME, url: `${SITE_ORIGIN}/` },
      },
    );
  }
  if (page.type === "ecommerce") {
    // A separate product. No offer: its pricing is not final yet.
    blocks.push({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Cortexa E-Commerce Subscription CRM",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url,
      description: seo.description,
      publisher: { "@type": "Organization", name: "Cortexa", url: `${SITE_ORIGIN}/` },
    });
  }
  return blocks;
}

// The <head> for one page in one language. `kind` is "index", "held" or
// "private"; only indexable pages advertise language alternates, and private
// pages carry no canonical at all.
function headFor({ page, code, kind, title }) {
  const lang = byCode[code];
  const url = urlFor(page.path, code);
  const seo = resolveSeo(page.path, code);
  const robots = { index: ROBOTS_INDEX, held: ROBOTS_HELD, private: ROBOTS_PRIVATE }[kind];
  const tags = [
    `<title>${esc(title || seo.title)}</title>`,
    `<meta name="description" content="${esc(seo.description)}" />`,
    `<meta name="robots" content="${robots}" />`,
  ];
  if (kind !== "private") tags.push(`<link rel="canonical" href="${esc(url)}" />`);
  tags.push(
    `<meta property="og:type" content="${page.type === "article" ? "article" : "website"}" />`,
    `<meta property="og:site_name" content="${esc(BRAND_NAME)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:title" content="${esc(seo.ogTitle)}" />`,
    `<meta property="og:description" content="${esc(seo.ogDescription)}" />`,
    `<meta property="og:locale" content="${lang.ogLocale}" />`,
    `<meta property="og:image" content="${SOCIAL_IMAGE}" />`,
    `<meta property="og:image:secure_url" content="${SOCIAL_IMAGE}" />`,
    `<meta property="og:image:type" content="${SOCIAL_IMAGE_TYPE}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${esc(BRAND_NAME)}: Agentic CRM Built Around Your Business" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(seo.twitterTitle)}" />`,
    `<meta name="twitter:description" content="${esc(seo.twitterDescription)}" />`,
    `<meta name="twitter:image" content="${SOCIAL_IMAGE}" />`,
    `<meta name="twitter:image:alt" content="${esc(BRAND_NAME)}: Agentic CRM Built Around Your Business" />`,
  );
  if (kind === "index") {
    // Every language version points at every other one, and at itself, which is
    // what search engines require before they will treat them as one page.
    for (const other of page.languages) {
      tags.push(
        `<link rel="alternate" hreflang="${byCode[other].hreflang}" href="${esc(urlFor(page.path, other))}" />`,
      );
    }
    tags.push(`<link rel="alternate" hreflang="x-default" href="${esc(urlFor(page.path, "en"))}" />`);
  }
  if (kind !== "private") {
    for (const block of structuredData(page, code, url)) {
      tags.push(`<script type="application/ld+json">${ldJson(block)}</script>`);
    }
  }
  return tags.map((t) => `    ${t}`).join("\n");
}

// Take the built shell and swap its placeholder head for this page's head.
function renderPage(shell, opts) {
  const lang = byCode[opts.code];
  return shell
    .replace(/<html lang="[^"]*"/, `<html lang="${lang.htmlLang}"`)
    .replace("<!--seo-head-->", headFor(opts));
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

const outFile = (code, base) =>
  `${byCode[code].prefix}${base === "/" ? "" : base}/index.html`.replace(/^\//, "") || "index.html";

// A self-contained 404 page: a real page that works without the application,
// so a missing address answers 404 and shows a way back instead of bouncing.
function notFoundPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Page not found | ${esc(BRAND_NAME)}</title>
  <meta name="robots" content="${ROBOTS_PRIVATE}" />
  <link rel="icon" href="/favicon.ico" sizes="any" />
  <style>
    body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f7f8fb;
      font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;color:#0f172a}
    main{max-width:560px;padding:40px 24px;text-align:center}
    img{height:52px;width:auto;mix-blend-mode:multiply}
    p.code{margin:28px 0 4px;font-size:14px;font-weight:700;letter-spacing:.2em;color:#4f46e5}
    h1{margin:0 0 12px;font-size:32px;line-height:1.2}
    p{margin:0 0 8px;font-size:17px;line-height:1.55;color:#475569}
    nav{margin-top:28px;display:flex;flex-wrap:wrap;gap:10px;justify-content:center}
    a{display:inline-block;padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px}
    a.primary{background:#4f46e5;color:#fff}
    a.secondary{background:#fff;color:#4f46e5;border:1px solid #c7d2fe}
  </style>
</head>
<body>
  <main>
    <img src="/cortexa-agentic-crm-logo.png" alt="${esc(BRAND_NAME)}" width="600" height="150" />
    <p class="code">404</p>
    <h1>This page does not exist</h1>
    <p>The address may be mistyped, or the page may have moved.</p>
    <p lang="es">Esta página no existe. <span lang="pt">Esta página não existe.</span></p>
    <nav>
      <a class="primary" href="/">Cortexa Agentic CRM</a>
      <a class="secondary" href="/pricing">Pricing</a>
      <a class="secondary" href="/web-solutions">Web &amp; Software Development</a>
      <a class="secondary" href="/contact">Contact</a>
      <a class="secondary" href="/es">Español</a>
      <a class="secondary" href="/pt">Português</a>
    </nav>
  </main>
</body>
</html>
`;
}

// llms.txt: a short, accurate map of the public site for AI assistants. It
// supplements the sitemap and the pages themselves; it replaces nothing.
function llmsTxt() {
  const link = (base, label, note) => `- [${label}](${urlFor(base, "en")}): ${note}`;
  return [
    "# Cortexa",
    "",
    `> Cortexa builds ${BRAND_NAME}, which connects leads, contacts, WhatsApp conversations, AI agents, ` +
      "workflows, pipelines, appointments, analytics, integrations, and specialized business workspaces in one " +
      "connected system. Cortexa also provides web and software development and systems integration services.",
    "",
    `Company: Cortexa (${LEGAL_NAME}). Website: ${SITE_ORIGIN}/. Support: ${SUPPORT_EMAIL}. ` +
      "Languages: English, Spanish (/es), Portuguese (/pt).",
    "",
    "## Cortexa Agentic CRM",
    "",
    link("/", BRAND_NAME, "overview of the Agentic CRM: AI agents, leads, WhatsApp conversations, workflows, pipelines, appointments, analytics, and specialized workspaces"),
    link("/features", "Features", "AI agent, AI sales and lead follow-up, WhatsApp AI agent, workflows, pipelines, appointment booking, and analytics"),
    link("/pricing", "Pricing", "Solo, Business, and Scale plans with a one-time activation, a 14-day trial, and monthly or annual billing"),
    link("/integrations", "Integrations", "connecting WhatsApp, Instagram, websites, forms, APIs, webhooks, Zapier, and other business tools"),
    link("/setup-guide", "Setup guide", "how to set up the AI agent and connect customer entry points"),
    "",
    "Specialized workspaces include Business, Sales, Marketing, Customer Service, Projects, Insurance, " +
      "Financial Services, E-Commerce, Real Estate, Aesthetic & Wellness, Clinic & Medical, and Team.",
    "",
    "## Web & Software Development and Systems Integration",
    "",
    link("/web-solutions", "Web & Software Development | Systems Integration", "websites, custom software, digital product engineering, modernization, and CRM, AI, API, payment, and automation integration"),
    link("/web-solutions/free-review", "Free professional review", "request a free review of a website or technology before any project"),
    "",
    "## Articles",
    "",
    link("/editorial/the-end-of-legacy-crm", "The End of Legacy CRM?", "why legacy CRMs hold growing businesses back"),
    link("/editorial/business", "How AI Is Transforming Every Business", "how AI changes the way businesses capture, qualify, and convert customers"),
    "",
    "## Company and support",
    "",
    link("/about", "About Cortexa", "the company behind Cortexa Agentic CRM"),
    link("/contact", "Contact", "contact the Cortexa team"),
    "",
    "## Policies",
    "",
    link("/terms", "Terms of Service", "terms for Cortexa Agentic CRM and Cortexa services"),
    link("/privacy-policy", "Privacy Policy", "how personal data is handled"),
    link("/refund-policy", "Refund Policy", "refunds"),
    link("/cancellation", "Cancellation Policy", "cancelling a subscription"),
    "",
  ].join("\n");
}

function main() {
  assertPricesMatchTheCheckout();
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
  const indexable = [];

  // 1. Every public page that belongs in search, in each language it exists in.
  for (const page of INDEXABLE_PAGES) {
    const lastmod = lastModified(page.file);
    for (const code of page.languages) {
      const out = outFile(code, page.path);
      write(out, renderPage(shell, { page, code, kind: "index" }));
      written.push(out);
      indexable.push({ path: page.path, code, out });
      sitemap.push({ page, code, lastmod });
    }
  }

  // 2. Finished public pages held out of search until the client launches them.
  for (const page of HELD_PAGES) {
    for (const code of page.languages) {
      const out = outFile(code, page.path);
      write(out, renderPage(shell, { page, code, kind: "held" }));
      written.push(out);
    }
  }

  // 3. Public pages that must never be a search result: a real page, a real
  //    noindex directive, and out of the sitemap.
  for (const { path: base, languages } of NOINDEX_PUBLIC_PAGES) {
    const page = { path: base, languages };
    for (const code of languages) {
      const out = outFile(code, base);
      write(out, renderPage(shell, { page, code, kind: "private" }));
      written.push(out);
    }
  }

  // 4. The shell the application itself is served from (behind a login), the
  //    shell for the legacy location pages, and the 404 page.
  const privateShell = renderPage(shell, {
    page: { path: "/", languages: ["en"] },
    code: "en",
    kind: "private",
    title: BRAND_NAME,
  });
  write("app.html", privateShell);
  write(
    "location.html",
    renderPage(shell, { page: { path: "/", languages: ["en"] }, code: "en", kind: "private", title: BRAND_NAME })
      .replace(`content="${ROBOTS_PRIVATE}"`, `content="${ROBOTS_HELD}"`),
  );
  write("404.html", notFoundPage());

  // 5. sitemap.xml, with each page listing its other languages.
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

  // 6. robots.txt: every crawler, search and AI alike, may read the public
  //    site; genuinely private areas are closed. Public transactional pages
  //    (sign-in, checkout, and so on) stay crawlable on purpose: a page blocked
  //    here can still be listed, because the crawler never reads the noindex
  //    tag that removes it.
  const disallow = [...PRIVATE_PREFIXES].sort().map((p) => `Disallow: ${p}`);
  write(
    "robots.txt",
    [
      "# Public pages are open to search engines and AI assistants alike.",
      "# A summary for AI assistants is at /llms.txt.",
      "User-agent: *",
      "Allow: /",
      ...disallow,
      "",
      `Sitemap: ${SITE_ORIGIN}/sitemap.xml`,
      "",
    ].join("\n"),
  );

  // 7. llms.txt, the supplementary map for AI assistants.
  write("llms.txt", llmsTxt());

  // 8. Redirects and rewrites. Old addresses become real 301s, the application
  //    keeps its own routes, and anything else is a genuine 404 instead of an
  //    empty page answered with 200.
  const rules = [
    "# Generated by scripts/build-seo.mjs. Edit src/seo/site.js, not this file.",
    "",
    "# One host: https://www. Other hosts go straight to the same path there.",
    "http://cortexaaicrm.com/*    https://www.cortexaaicrm.com/:splat    301!",
    "https://cortexaaicrm.com/*    https://www.cortexaaicrm.com/:splat    301!",
    "http://www.cortexaaicrm.com/*    https://www.cortexaaicrm.com/:splat    301!",
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
    "# Legacy country and city pages: kept, reachable, not indexed until the",
    "# client decides. Listed one by one so every other unknown address still",
    "# reaches the 404.",
    ...legacyLocationPaths().map((p) => `${p}    /location.html    200`),
    "",
    "# Anything else does not exist.",
    "/*    /404.html    404",
  ];
  write("_redirects", rules.join("\n") + "\n");

  // The list of indexable pages, for the prerender step and the tests.
  write(".seo-pages.json", JSON.stringify(indexable, null, 2));

  console.log(
    `SEO build: ${written.length} pages written, ${sitemap.length} urls in sitemap.xml, ` +
      "robots.txt, llms.txt, _redirects and a real 404 page.",
  );
}

main();
