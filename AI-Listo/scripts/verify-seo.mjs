// Checks the built site (dist/) against the approved SEO rules. Run after
// `npm run build`:  node scripts/verify-seo.mjs
//
// It reads the generated files exactly as the host will serve them, so what it
// checks is what search engines and link previews will receive.
import fs from "node:fs";
import path from "node:path";
import {
  SITE_ORIGIN, INDEXABLE_PAGES, HELD_PAGES, NOINDEX_PUBLIC_PAGES, PRIVATE_PREFIXES,
  LANGUAGES, ROBOTS_INDEX, ROBOTS_PRIVATE, ROBOTS_HELD, urlFor,
} from "../src/seo/site.js";

const DIST = path.resolve("dist");
const byCode = Object.fromEntries(LANGUAGES.map((l) => [l.code, l]));
const fileFor = (code, base) => {
  const clean = `${byCode[code].prefix}${base === "/" ? "" : base}`;
  return path.join(DIST, clean ? `${clean}.html` : "index.html");
};
const read = (f) => fs.readFileSync(f, "utf8");
const attr = (html, re) => (html.match(re) || [])[1];
const all = (html, re) => [...html.matchAll(re)].map((m) => m[1]);
const decode = (s) => String(s ?? "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">");

const failures = [];
const warnings = [];
const fail = (where, msg) => failures.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

// Wording that must not appear in anything a visitor, crawler or preview sees.
const FORBIDDEN = [
  /AI CRM for real estate/i, /Cortexa AI CRM/i, /Agentic AI CRM/i, /Revenue OS\b/i,
  /revenue operating system/i, /\$347\b/, /\$97 setup/i, /one-time setup fee/i, /\bPaddle\b/,
  /PayPal/i, /free trial/i,
];

const titles = new Map();
const descriptions = new Map();
let checked = 0;

for (const page of INDEXABLE_PAGES) {
  for (const code of page.languages) {
    const where = urlFor(page.path, code);
    const file = fileFor(code, page.path);
    if (!fs.existsSync(file)) { fail(where, "no HTML file"); continue; }
    const html = read(file);
    const head = html.slice(0, html.indexOf("</head>"));
    checked += 1;

    const title = decode(attr(head, /<title>([^<]*)<\/title>/));
    const desc = decode(attr(head, /<meta name="description" content="([^"]*)"/));
    if (!title) fail(where, "no title");
    if (!desc) fail(where, "no description");
    if (titles.has(title)) fail(where, `title duplicates ${titles.get(title)}`);
    if (descriptions.has(desc)) fail(where, `description duplicates ${descriptions.get(desc)}`);
    titles.set(title, where);
    descriptions.set(desc, where);

    if (attr(head, /<meta name="robots" content="([^"]*)"/) !== ROBOTS_INDEX) fail(where, "robots is not the approved index directive");
    const canonical = attr(head, /<link rel="canonical" href="([^"]*)"/);
    if (canonical !== where) fail(where, `canonical is ${canonical}`);
    if (!/^https:\/\/www\.cortexaaicrm\.com(\/|$)/.test(canonical || "")) fail(where, "canonical is not an absolute production https URL");
    if (attr(html, /<html lang="([^"]*)"/) !== byCode[code].htmlLang) fail(where, "wrong html lang");

    for (const prop of ["og:title", "og:description", "og:url", "og:image", "og:type"]) {
      if (!attr(head, new RegExp(`<meta property="${prop}" content="([^"]*)"`))) fail(where, `missing ${prop}`);
    }
    for (const name of ["twitter:card", "twitter:title", "twitter:description", "twitter:image"]) {
      if (!attr(head, new RegExp(`<meta name="${name}" content="([^"]*)"`))) fail(where, `missing ${name}`);
    }
    if (!/^https:\/\//.test(attr(head, /<meta property="og:image" content="([^"]*)"/) || "")) fail(where, "og:image is not absolute https");
    if (attr(head, /<meta property="og:url" content="([^"]*)"/) !== where) fail(where, "og:url differs from canonical");

    // hreflang: one per real language, plus x-default, each reciprocal.
    const alternates = all(head, /<link rel="alternate" hreflang="[^"]*" href="([^"]*)"/g);
    const expected = page.languages.map((c) => urlFor(page.path, c)).concat(urlFor(page.path, "en"));
    if (alternates.sort().join() !== expected.sort().join()) fail(where, `hreflang set is ${alternates.join(", ")}`);
    for (const other of page.languages) {
      const otherHtml = fs.existsSync(fileFor(other, page.path)) ? read(fileFor(other, page.path)) : "";
      if (!otherHtml.includes(`hreflang="${byCode[code].hreflang}" href="${where}"`)) fail(where, `not referenced back from ${other}`);
    }

    // JSON-LD must parse and use only allowed types.
    for (const block of all(head, /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      try {
        const data = JSON.parse(block);
        if (["Review", "AggregateRating", "LocalBusiness"].includes(data["@type"])) fail(where, `forbidden schema ${data["@type"]}`);
        if (JSON.stringify(data).includes("aggregateRating")) fail(where, "rating markup present");
      } catch (e) {
        fail(where, `invalid JSON-LD: ${e.message}`);
      }
    }

    // Body content written into the HTML, with exactly one H1.
    const pre = html.match(/<div id="prerender">([\s\S]*?)<\/div>\s*<div id="root">/);
    if (!pre) warn(where, "page content not written into the HTML (prerender)");
    else {
      const h1 = (pre[1].match(/<h1[\s>]/g) || []).length;
      if (h1 !== 1) fail(where, `${h1} h1 elements in the written content`);
    }

    // Visible text only (scripts and structured data removed) must not carry
    // the obsolete wording.
    const visible = html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, "");
    for (const re of FORBIDDEN) if (re.test(visible)) fail(where, `contains ${re}`);
  }
}

// Held, transactional and private pages: noindex, never in the sitemap.
for (const page of HELD_PAGES) {
  for (const code of page.languages) {
    const file = fileFor(code, page.path);
    const where = urlFor(page.path, code);
    if (!fs.existsSync(file)) { fail(where, "no HTML file"); continue; }
    if (!read(file).includes(`<meta name="robots" content="${ROBOTS_HELD}"`)) fail(where, "held page is not noindex");
  }
}
for (const { path: base, languages } of NOINDEX_PUBLIC_PAGES) {
  for (const code of languages) {
    const file = fileFor(code, base);
    const where = urlFor(base, code);
    if (!fs.existsSync(file)) { fail(where, "no HTML file"); continue; }
    const html = read(file);
    if (!html.includes(`<meta name="robots" content="${ROBOTS_PRIVATE}"`)) fail(where, "not noindex,nofollow");
    if (html.includes('rel="canonical"')) fail(where, "private page declares a canonical");
  }
}
const appShell = read(path.join(DIST, "app.html"));
if (!appShell.includes(`content="${ROBOTS_PRIVATE}"`)) fail("app.html", "application shell is not noindex,nofollow");
if (appShell.includes('rel="canonical"')) fail("app.html", "application shell declares a canonical");

// Sitemap: exactly the indexable pages.
const sitemap = read(path.join(DIST, "sitemap.xml"));
const locs = all(sitemap, /<loc>([^<]*)<\/loc>/g);
const expectedLocs = INDEXABLE_PAGES.flatMap((p) => p.languages.map((c) => urlFor(p.path, c)));
if (locs.sort().join() !== expectedLocs.sort().join()) fail("sitemap.xml", "does not list exactly the indexable pages");
for (const loc of locs) {
  if (/[?#A-Z]/.test(loc.replace(SITE_ORIGIN, ""))) fail("sitemap.xml", `non-canonical address ${loc}`);
  if (PRIVATE_PREFIXES.some((p) => loc.replace(SITE_ORIGIN, "").replace(/^\/(es|pt)(?=\/|$)/, "").startsWith(p))) fail("sitemap.xml", `private address ${loc}`);
}
if (!/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/.test(sitemap)) fail("sitemap.xml", "no lastmod dates");

// robots.txt and llms.txt.
const robots = read(path.join(DIST, "robots.txt"));
if (!robots.includes(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`)) fail("robots.txt", "does not reference the sitemap");
for (const p of ["/dashboard", "/admin", "/account", "/settings"]) if (!robots.includes(`Disallow: ${p}`)) fail("robots.txt", `does not protect ${p}`);
for (const p of INDEXABLE_PAGES) if (robots.split("\n").includes(`Disallow: ${p.path}`)) fail("robots.txt", `blocks public page ${p.path}`);
const llms = read(path.join(DIST, "llms.txt"));
for (const word of ["Cortexa Agentic CRM", "Web & Software Development", "Systems Integration", "Pricing", "Integrations"]) {
  if (!llms.includes(word)) fail("llms.txt", `does not mention ${word}`);
}
for (const p of PRIVATE_PREFIXES) if (llms.includes(`${SITE_ORIGIN}${p}`)) fail("llms.txt", `links private ${p}`);

// Redirects: one hop, never to the homepage by default, and a real 404.
const redirects = read(path.join(DIST, "_redirects"));
const hops = redirects.split("\n").filter((l) => /\s301!?$/.test(l)).map((l) => l.trim().split(/\s+/));
const sources = new Set(hops.map((h) => h[0]));
for (const [from, to] of hops) {
  if (sources.has(to)) fail("_redirects", `chain: ${from} -> ${to} -> ...`);
}
if (!/^\/\*\s+\/404\.html\s+404$/m.test(redirects)) fail("_redirects", "no real 404 rule");
const notFound = read(path.join(DIST, "404.html"));
if (!notFound.includes(ROBOTS_PRIVATE)) fail("404.html", "not noindex");

console.log(`Checked ${checked} indexable pages, ${locs.length} sitemap URLs.`);
for (const w of warnings) console.log(`  warning  ${w}`);
for (const f of failures) console.log(`  FAIL     ${f}`);
if (failures.length) {
  console.log(`${failures.length} problem(s).`);
  process.exit(1);
}
console.log("All SEO checks passed.");
