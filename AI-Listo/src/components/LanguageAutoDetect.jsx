import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { buildLocalizedPath, SUPPORTED_CODES } from "../i18n/locales";

// First-visit browser-language detection.
//
// Only on the bare homepage ("/"), and only when the visitor has not already
// chosen a language: a Spanish or Portuguese browser is sent to /es or /pt.
// Every other browser language (including English) stays on the English root.
// It never overrides a saved preference and runs at most once, so it can't loop
// or fight an explicit choice. Scoped to the homepage on purpose — the authed
// app is not language-prefixed, so redirecting deep paths is out of scope here.
export default function LanguageAutoDetect() {
  const location = useLocation();
  const navigate = useNavigate();
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    if (location.pathname !== "/") return;
    ranRef.current = true;

    let saved = null;
    try {
      saved =
        localStorage.getItem("preferredLanguage") ||
        localStorage.getItem("cortexa_lang");
    } catch (_e) {
      /* storage blocked — treat as no saved preference */
    }
    if (saved) return; // respect an explicit prior choice

    const langs =
      (typeof navigator !== "undefined" &&
        (navigator.languages && navigator.languages.length
          ? navigator.languages
          : [navigator.language])) ||
      [];
    const primary = String(langs[0] || "")
      .slice(0, 2)
      .toLowerCase();

    // Only redirect for a supported, non-English language; en / unsupported stay
    // on the English root.
    if (primary === "en" || !SUPPORTED_CODES.includes(primary)) return;

    navigate(buildLocalizedPath("/", primary), { replace: true });
  }, [location.pathname, navigate]);

  return null;
}
