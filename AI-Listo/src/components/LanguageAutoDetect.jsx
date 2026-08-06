import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { buildLocalizedPath, SUPPORTED_CODES } from "../i18n/locales";

// Keys owned by the language logic.
//  - AUTODETECT_KEY: set once we've run first-visit detection for this browser,
//    so it happens exactly once and never fights later navigation.
//  - CHOICE_KEY: set only when the visitor EXPLICITLY picks a language (the
//    dashboard/site switcher). An explicit choice always wins over detection.
// We deliberately do NOT read preferredLanguage / cortexa_lang here: LocaleLayout
// writes those to the current URL's language during render (before this effect
// runs), so on the English root they would always read "en" and make every
// first-time visitor look like they'd already chosen English — which silently
// disabled detection entirely.
export const LANG_CHOICE_KEY = "cortexa_lang_choice";
const AUTODETECT_KEY = "cortexa_autodetect_done";

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

// First-visit browser-language detection.
//
// On a visitor's first arrival at the homepage ("/"), if they have not made an
// explicit language choice, a Spanish or Portuguese browser is sent to /es or
// /pt; English (and any other language) stays on the English root. It runs at
// most once per browser and never overrides an explicit choice, so it can't loop
// or fight a manual switch. Scoped to the homepage on purpose — the authed app is
// not language-prefixed, so redirecting deep paths is out of scope here.
//
// NOTE: this reads the BROWSER's language setting (navigator.languages), not the
// visitor's country. A computer in a Spanish-speaking country whose browser is
// set to English correctly stays English. Append ?langdebug to any URL to see the
// live detection and the exact reason it did or did not switch.
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

    let alreadyDetected = false;
    let explicitChoice = null;
    try {
      alreadyDetected = localStorage.getItem(AUTODETECT_KEY) === "1";
      explicitChoice = localStorage.getItem(LANG_CHOICE_KEY);
    } catch (_e) {
      /* storage blocked — treat as first visit, no explicit choice */
    }

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
    if (alreadyDetected) return undefined;
    try {
      localStorage.setItem(AUTODETECT_KEY, "1");
    } catch (_e) {
      /* storage blocked — detection just won't be remembered */
    }

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

  // ?langdebug — read-only diagnostic panel: shows what the browser reports and
  // exactly why the site did or did not auto-switch, on this device.
  const langs = browserLanguages();
  const primary = String(langs[0] || "")
    .slice(0, 2)
    .toLowerCase();
  let done = false;
  let choice = null;
  try {
    done = localStorage.getItem(AUTODETECT_KEY) === "1";
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
  } else if (done) {
    decision =
      "already auto-detected once on THIS browser (flag set) → no change on return visits";
  } else if (primary === "en") {
    decision = `browser language is "${langs[0] || "?"}" (English) → correctly stays English`;
  } else if (!SUPPORTED_CODES.includes(primary)) {
    decision = `browser language "${primary}" is not es/pt → stays English`;
  } else {
    decision = `browser language "${primary}" → WOULD auto-switch to /${primary}`;
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
        `autodetect_done flag: ${done}`,
        `explicit choice: ${choice || "(none)"}`,
        `→ ${decision}`,
      ].join("\n")}
    </div>
  );
}
