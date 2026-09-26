import { useNavigate, useLocation } from "react-router-dom";
import { stripLocaleFromPath, buildLocalizedPath } from "./locales";
import { LANG_CHOICE_KEY } from "./funnelLocale";

// Returns a function that switches the site language by navigating to the same
// page under the target locale's URL (e.g. /pricing -> /es/pricing). The URL is
// the single source of truth for language, so switching means navigating.
export function useLocaleSwitch() {
  const navigate = useNavigate();
  const location = useLocation();
  return (code) => {
    // An explicit switch is a choice: remember it so the homepage browser-language
    // redirect (LanguageAutoDetect) never bounces the visitor back.
    try {
      localStorage.setItem(LANG_CHOICE_KEY, code);
    } catch (_e) {
      /* storage blocked: the switch still works for this visit */
    }
    const base = stripLocaleFromPath(location.pathname);
    const target = buildLocalizedPath(base, code);
    navigate(target + location.search + location.hash);
  };
}
