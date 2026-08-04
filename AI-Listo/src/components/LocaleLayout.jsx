import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import i18n from "../i18n/config";
import {
  LOCALES,
  localeByCode,
  stripLocaleFromPath,
  buildLocalizedPath,
} from "../i18n/locales";
import { resolveSeo } from "../i18n/seo";

// Create or update a <head> <link> we manage, tagged so we can clean it up.
function setManagedLink(id, attrs) {
  let el = document.head.querySelector(`link[data-locale-link="${id}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("data-locale-link", id);
    document.head.appendChild(el);
  }
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
}

// Create or update a <meta> tag by name or property (og:*). Managed so it can be
// updated on every navigation without stacking duplicates.
function setMetaTag(selector, attr, value, content) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, value);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
  return el;
}

// Layout for every public page. The URL decides the language (no cookie
// reliance): this sets the language storage the pages read, updates i18next and
// the <html lang> attribute, and injects canonical + hreflang tags per page.
export default function LocaleLayout({ code }) {
  const locale = localeByCode(code);
  const location = useLocation();

  // Public pages seed their language from localStorage at mount, so this must
  // run synchronously during render (before the child page mounts), not in an
  // effect. The writes are guarded so they are no-ops once set.
  if (localStorage.getItem("cortexa_lang") !== code) {
    localStorage.setItem("cortexa_lang", code);
  }
  if (localStorage.getItem("preferredLanguage") !== code) {
    localStorage.setItem("preferredLanguage", code);
  }

  useEffect(() => {
    if (i18n.language !== code) {
      i18n.changeLanguage(code);
    }
    document.documentElement.lang = locale.htmlLang;
  }, [code, locale.htmlLang]);

  // Canonical + hreflang for the current page, rebuilt on every navigation.
  useEffect(() => {
    const basePath = stripLocaleFromPath(location.pathname);
    const origin = window.location.origin;
    const created = [];

    created.push(
      setManagedLink("canonical", {
        rel: "canonical",
        href: origin + buildLocalizedPath(basePath, code),
      }),
    );

    LOCALES.forEach((l) => {
      created.push(
        setManagedLink(`alt-${l.code}`, {
          rel: "alternate",
          hreflang: l.htmlLang,
          href: origin + buildLocalizedPath(basePath, l.code),
        }),
      );
    });

    created.push(
      setManagedLink("alt-x-default", {
        rel: "alternate",
        hreflang: "x-default",
        href: origin + buildLocalizedPath(basePath, "en"),
      }),
    );

    return () => created.forEach((el) => el && el.remove());
  }, [location.pathname, code]);

  // Localized document title + meta description (+ Open Graph) per page. Uses the
  // isolated SEO map, always resolving to a non-empty title so pages never show a
  // blank or raw value.
  useEffect(() => {
    const basePath = stripLocaleFromPath(location.pathname);
    const seo = resolveSeo(basePath, code);
    document.title = seo.title;
    setMetaTag('meta[name="description"]', "name", "description", seo.description);
    setMetaTag('meta[property="og:title"]', "property", "og:title", seo.title);
    setMetaTag(
      'meta[property="og:description"]',
      "property",
      "og:description",
      seo.description,
    );
    setMetaTag('meta[property="og:locale"]', "property", "og:locale", locale.htmlLang);
  }, [location.pathname, code, locale.htmlLang]);

  return <Outlet />;
}
