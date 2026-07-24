import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import i18n from "../i18n/config";
import {
  LOCALES,
  localeByCode,
  stripLocaleFromPath,
  buildLocalizedPath,
} from "../i18n/locales";

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

  return <Outlet />;
}
