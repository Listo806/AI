import { createContext, useContext, useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "crm-theme";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    const body = document.body;
    if (theme === "dark") {
      body.classList.add("crm-dark");
    } else {
      body.classList.remove("crm-dark");
    }
  }, [theme]);

  const setTheme = useCallback((valueOrUpdater) => {
    setThemeState((prev) => {
      const next = typeof valueOrUpdater === "function" ? valueOrUpdater(prev) : valueOrUpdater;
      localStorage.setItem(STORAGE_KEY, next); /* persist to localStorage on every change (including toggle) */
      return next;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, [setTheme]);

  const isDark = theme === "dark";

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
