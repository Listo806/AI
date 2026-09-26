import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import i18n from "../i18n/config";
import { localeByCode } from "../i18n/locales";

// Layout for every public page. The URL decides the language, not a cookie:
// this sets the language storage the pages read, updates i18next and the
// <html lang> attribute. The head tags are handled once for every route in
// src/seo/head.js, so there is a single place where they are decided.
export default function LocaleLayout({ code }) {
  const locale = localeByCode(code);

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

  return <Outlet />;
}
