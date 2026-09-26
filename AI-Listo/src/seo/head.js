// Keeps the page's head correct while the customer moves around the app.
//
// The first response already carries the right tags: they are written per page
// at build time by scripts/build-seo.mjs. From then on the app navigates
// without reloading, so the same tags are rewritten here from the same source
// of truth, and a page that must never be indexed says so on every view.

import { resolveSeo } from "../i18n/seo";
import {
  LANGUAGES,
  SITE_ORIGIN,
  SOCIAL_IMAGE,
  BRAND_NAME,
  basePathOf,
  languageFromPath,
  pageFor,
  heldPageFor,
  isNoIndexPath,
  robotsFor,
  urlFor,
} from "./site";

const byCode = Object.fromEntries(LANGUAGES.map((l) => [l.code, l]));

function setMeta(selector, attr, value, content) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, value);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel, href, extra = {}) {
  const key = extra.hreflang
    ? `link[rel="alternate"][hreflang="${extra.hreflang}"]`
    : `link[rel="${rel}"]`;
  let el = document.head.querySelector(key);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
  Object.entries(extra).forEach(([k, v]) => el.setAttribute(k, v));
}

/**
 * Apply the head for one address. Safe to call on every navigation: it updates
 * the tags in place rather than stacking duplicates.
 */
export function applyHead(pathname) {
  if (typeof document === "undefined") return;
  const base = basePathOf(pathname);
  const code = languageFromPath(pathname);
  const lang = byCode[code] || byCode.en;
  const page = pageFor(base);
  const held = heldPageFor(base);
  const noindex = isNoIndexPath(pathname);
  const seo = resolveSeo(base, code);
  const own = page || held;
  const url = own ? urlFor(own.path, code) : `${SITE_ORIGIN}${pathname}`;

  document.documentElement.lang = lang.htmlLang;
  document.title = seo.title;
  setMeta('meta[name="description"]', "name", "description", seo.description);
  setMeta(
    'meta[name="robots"]',
    "name",
    "robots",
    robotsFor(pathname),
  );
  setMeta('meta[property="og:title"]', "property", "og:title", seo.ogTitle);
  setMeta('meta[property="og:description"]', "property", "og:description", seo.ogDescription);
  setMeta('meta[property="og:url"]', "property", "og:url", url);
  setMeta('meta[property="og:locale"]', "property", "og:locale", lang.ogLocale);
  setMeta('meta[property="og:site_name"]', "property", "og:site_name", BRAND_NAME);
  setMeta('meta[property="og:image"]', "property", "og:image", SOCIAL_IMAGE);
  setMeta('meta[name="twitter:title"]', "name", "twitter:title", seo.twitterTitle);
  setMeta('meta[name="twitter:description"]', "name", "twitter:description", seo.twitterDescription);
  setMeta('meta[name="twitter:image"]', "name", "twitter:image", SOCIAL_IMAGE);

  // Indexable and held pages name their own address as canonical. Any other
  // address has no canonical at all, rather than one pointing somewhere wrong.
  const canonical = document.head.querySelector('link[rel="canonical"]');
  if (own) {
    setLink("canonical", url);
  } else if (canonical) {
    canonical.remove();
  }

  // Language alternates: every version points at every other one, including
  // itself, and x-default points at English.
  document.head
    .querySelectorAll('link[rel="alternate"][hreflang]')
    .forEach((el) => el.remove());
  if (page && !noindex) {
    for (const other of page.languages) {
      setLink("alternate", urlFor(page.path, other), { hreflang: byCode[other].hreflang });
    }
    setLink("alternate", urlFor(page.path, "en"), { hreflang: "x-default" });
  }
}
