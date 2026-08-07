import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { buildLocalizedPath, SUPPORTED_CODES } from "../i18n/locales";

// Set only when the visitor EXPLICITLY picks a language (dashboard/site switcher).
// An explicit choice always wins over browser detection. We deliberately do NOT
// read preferredLanguage / cortexa_lang here: LocaleLayout writes those to the
// current URL's language during render (before this effect runs), so on the
// English root they would always read "en" and defeat detection.
export const LANG_CHOICE_KEY = "cortexa_lang_choice";

// Read the browser languages defensively (array, with a fallback).
function browserLanguages() {
  try {
    if (typeof navigator === "undefined") return [];
    return navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language];
  } catch (_e) {
    return [];
  }
}

// Browser-language homepage redirect.
//
// On the homepage ("/"), a Spanish or Portuguese browser is sent to /es or /pt;
// English (and anything else) stays on the English root. This runs on every fresh
// homepage load (not just the first visit), so a Spanish browser reliably opens in
// Spanish — but an EXPLICIT choice made with the switcher always wins and is never
// overridden. Scoped to the homepage on purpose; the authed app is not
// locale-prefixed. Landing on "/es" makes pathname != "/", so it never loops.
//
// NOTE: this reads the BROWSER's language (navigator.languages), not the visitor's
// country. A Spanish-country computer whose browser is set to English correctly
// stays English. Append ?langdebug to any URL to see the live detection + reason.
export default function LanguageAutoDetect() {
  const location = useLocation();
  const navigate = useNavigate();
  const ranRef = useRef(false);

  const debug = new URLSearchParams(location.search).has("langdebug");

  useEffect(() => {
    if (debug) return undefined; // diagnostic mode: show the panel, never redirect
    if (ranRef.current) return undefined;
    if (location.pathname !== "/") return undefined;
    ranRef.current = true;

    let explicitChoice = null;
    try {
      explicitChoice = localStorage.getItem(LANG_CHOICE_KEY);
    } catch (_e) {
      /* storage blocked — treat as no explicit choice */
    }

    // An explicit choice always wins over browser detection.
    if (explicitChoice) {
      if (explicitChoice !== "en" && SUPPORTED_CODES.includes(explicitChoice)) {
        navigate(
          buildLocalizedPath("/", explicitChoice) +
            location.search +
            location.hash,
          { replace: true },
        );
      }
      return undefined;
    }

    // Otherwise follow the browser language.
    const primary = String(browserLanguages()[0] || "")
      .slice(0, 2)
      .toLowerCase();
    if (primary === "en" || !SUPPORTED_CODES.includes(primary)) return undefined;

    navigate(
      buildLocalizedPath("/", primary) + location.search + location.hash,
      { replace: true },
    );
    return undefined;
  }, [debug, location.pathname, location.search, location.hash, navigate]);

  if (!debug) return null;

  // ?langdebug — read-only diagnostic: shows what the browser reports and exactly
  // why the site did or did not auto-switch, on this device.
  const langs = browserLanguages();
  const primary = String(langs[0] || "")
    .slice(0, 2)
    .toLowerCase();
  let choice = null;
  try {
    choice = localStorage.getItem(LANG_CHOICE_KEY);
  } catch (_e) {
    /* ignore */
  }

  let decision;
  if (location.pathname !== "/") {
    decision = "detection only runs on the homepage /";
  } else if (choice) {
    decision =
      choice !== "en" && SUPPORTED_CODES.includes(choice)
        ? `you previously chose "${choice}" → would open /${choice}`
        : `you previously chose "${choice}" → stays English`;
  } else if (primary === "en") {
    decision = `browser language is "${langs[0] || "?"}" (English) → correctly stays English`;
  } else if (!SUPPORTED_CODES.includes(primary)) {
    decision = `browser language "${primary}" is not es/pt → stays English`;
  } else {
    decision = `browser language "${primary}" → WOULD open /${primary}`;
  }

  return (
    <div
      role="status"
      style={{
        position: "fixed",
        top: 8,
        left: 8,
        zIndex: 2147483647,
        background: "rgba(15,23,42,0.94)",
        color: "#e2e8f0",
        font: "12px/1.5 ui-monospace, monospace",
        padding: "10px 12px",
        borderRadius: 8,
        maxWidth: 360,
        pointerEvents: "none",
        whiteSpace: "pre-wrap",
        border: "1px solid #334155",
      }}
    >
      {[
        "▛ language auto-detect debug",
        `navigator.languages: ${JSON.stringify(langs)}`,
        `detected primary: "${primary}"`,
        `supported: ${JSON.stringify(SUPPORTED_CODES)}`,
        `explicit choice: ${choice || "(none)"}`,
        `→ ${decision}`,
      ].join("\n")}
    </div>
  );
}
