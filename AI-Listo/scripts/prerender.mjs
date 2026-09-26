// Runs after scripts/build-seo.mjs.
//
// The public pages are rendered by React in the browser, so a crawler that does
// not run JavaScript (most AI assistants, some search engines, link previews)
// would see only the page's metadata and an empty body. This opens each public
// page once in a headless browser, takes the rendered page content, and writes
// it into that page's HTML file, so the headline, the text and the links are in
// the first response.
//
// In the browser nothing changes for the visitor: the written content is shown
// on wide screens until the application has rendered the same page, and is then
// swapped out in a single frame (src/prerenderHandoff.js). Narrow screens use a
// different layout, so on them the written copy stays hidden and the page loads
// exactly as before.
//
// If a headless browser cannot be started (for example on a build machine that
// lacks one), the step says so and leaves the pages as they are: every page
// still has its full metadata, and the site works exactly as before.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const DIST = path.resolve("dist");
const VIEWPORT = { width: 1440, height: 900 };
// Wide screens only: at 1024px and below the site renders its mobile layout.
const DESKTOP_MIN = 1025;

const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
  ".avif": "image/avif", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".json": "application/json",
  ".woff2": "font/woff2", ".woff": "font/woff", ".txt": "text/plain", ".xml": "application/xml",
  ".gif": "image/gif", ".mp4": "video/mp4",
};

// A static server over dist/ that answers the way the host does for the pages
// we render: a folder's index.html, otherwise the file, otherwise the app shell.
function serve() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    const clean = decodeURIComponent(url.pathname).replace(/\/+$/, "") || "/";
    const candidates = [path.join(DIST, `${clean}.html`), path.join(DIST, clean, "index.html"), path.join(DIST, clean), path.join(DIST, "app.html")];
    const file = candidates.find((f) => f.startsWith(DIST) && fs.existsSync(f) && fs.statSync(f).isFile());
    res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

// Requests the snapshot must never make: analytics and ads would count the
// build machine as a visitor.
const BLOCKED = /googletagmanager\.com|google-analytics\.com|doubleclick\.net|googleadservices\.com|google\.com\/ccm|facebook\.net|connect\.facebook|hotjar|clarity\.ms|paymentez\.com|paddle\.com/;

async function snapshot(browser, origin, pagePath) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  try {
    await page.setViewport(VIEWPORT);
    await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });
    await page.evaluateOnNewDocument(() => {
      try {
        localStorage.setItem("cortexa_internal_traffic", "1");
        // A visitor who has already chosen a language is never auto-redirected.
        localStorage.setItem("cortexa_lang_choice", "en");
      } catch (_e) { /* storage unavailable */ }
    });
    await page.setRequestInterception(true);
    page.on("request", (r) => (BLOCKED.test(r.url()) ? r.abort() : r.continue()));
    // "load", not network idle: third-party requests that never settle must not
    // stall the snapshot. Readiness is judged by the page itself below.
    await page.goto(`${origin}${pagePath}`, { waitUntil: "load", timeout: 60000 });
    // The application has rendered this page when the loading splash is gone
    // and the page has a headline.
    await page.waitForFunction(
      () => {
        const root = document.getElementById("root");
        return root && !root.querySelector(".app-splash") && root.querySelector("h1");
      },
      { timeout: 30000 },
    );
    await new Promise((r) => setTimeout(r, 600));
    const finalPath = new URL(page.url()).pathname.replace(/\/+$/, "") || "/";
    const wanted = pagePath.replace(/\/+$/, "") || "/";
    if (finalPath !== wanted) throw new Error(`redirected to ${finalPath}`);
    return await page.evaluate(() => {
      const root = document.getElementById("root").cloneNode(true);
      root.querySelectorAll("script, noscript, iframe, object, embed, [data-prerender-skip]").forEach((n) => n.remove());
      // The application renders the same page next to this copy; duplicate ids
      // would make its scripts find the copy's elements instead of its own.
      root.querySelectorAll("[id]").forEach((n) => n.removeAttribute("id"));
      // Forms cannot work before the application loads; keep them visible but
      // make sure nothing submits from the written copy.
      root.querySelectorAll("form").forEach((f) => f.setAttribute("onsubmit", "return false"));
      return {
        html: root.innerHTML,
        h1: root.querySelectorAll("h1").length,
        text: root.innerText.replace(/\s+/g, " ").trim().length,
      };
    });
  } finally {
    await context.close();
  }
}

const HANDOFF_STYLE =
  `<style id="prerender-style">` +
  `@media (max-width:${DESKTOP_MIN - 1}px){#prerender{display:none!important}}` +
  `@media (min-width:${DESKTOP_MIN}px){html.has-prerender #root{position:absolute!important;top:0;left:0;right:0;` +
  `visibility:hidden!important;pointer-events:none}}` +
  `</style>`;

function inject(file, html) {
  const full = path.join(DIST, file);
  let doc = fs.readFileSync(full, "utf8");
  if (doc.includes('id="prerender"')) return; // already written on an earlier run
  if (!/<div id="root">/.test(doc)) throw new Error(`${file}: no #root to write next to`);
  doc = doc
    .replace(/<html lang="([^"]*)"/, '<html lang="$1" class="has-prerender"')
    .replace("</head>", `  ${HANDOFF_STYLE}\n</head>`)
    .replace('<div id="root">', `<div id="prerender">${html}</div>\n  <div id="root">`);
  fs.writeFileSync(full, doc, "utf8");
}

async function main() {
  const listFile = path.join(DIST, ".seo-pages.json");
  if (!fs.existsSync(listFile)) throw new Error("Run scripts/build-seo.mjs first.");
  const pages = JSON.parse(fs.readFileSync(listFile, "utf8"));

  let puppeteer;
  let browser;
  try {
    puppeteer = (await import("puppeteer")).default;
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--lang=en-US"],
    });
  } catch (err) {
    console.warn(`Prerender skipped: no headless browser available (${err.message.split("\n")[0]}).`);
    console.warn("Pages keep their full metadata; their body is rendered by the application as before.");
    return;
  }

  const server = await serve();
  const origin = `http://127.0.0.1:${server.address().port}`;
  const done = [];
  const failed = [];
  try {
    for (const p of pages) {
      const url = urlPath(p);
      try {
        let snap;
        try {
          snap = await snapshot(browser, origin, url);
        } catch (_first) {
          snap = await snapshot(browser, origin, url); // one retry for a slow load
        }
        if (snap.h1 !== 1) throw new Error(`expected one h1, found ${snap.h1}`);
        if (snap.text < 200) throw new Error(`only ${snap.text} characters of text`);
        inject(p.out, snap.html);
        done.push(url);
      } catch (err) {
        failed.push(`${url}: ${err.message.split("\n")[0]}`);
      }
    }
  } finally {
    await browser.close();
    server.close();
  }
  console.log(`Prerender: ${done.length} of ${pages.length} pages written with their content.`);
  // A page that could not be written keeps working exactly as before; say which.
  for (const f of failed) console.warn(`  not prerendered: ${f}`);
}

function urlPath({ path: base, code }) {
  const prefix = { en: "", es: "/es", pt: "/pt" }[code];
  return `${prefix}${base === "/" ? "" : base}` || "/";
}

main().catch((err) => {
  // Never fail the deploy over the written copy: the site is complete without it.
  console.warn(`Prerender skipped: ${err.message}`);
});
