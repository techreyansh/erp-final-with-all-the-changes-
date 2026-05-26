import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "reyansh-theme-mode";

const ThemeModeContext = createContext({
  mode: "light",
  toggleMode: () => {},
  setMode: () => {},
});

function readStoredMode() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s === "dark" || s === "light") return s;
  } catch (_) {
    /* ignore */
  }
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

export function ThemeModeProvider({ children }) {
  const [mode, setModeState] = useState(readStoredMode);

  const setMode = useCallback((next) => {
    const m = next === "dark" ? "dark" : "light";
    setModeState(m);
    try {
      localStorage.setItem(STORAGE_KEY, m);
    } catch (_) {
      /* ignore */
    }
  }, []);

  const toggleMode = useCallback(() => {
    setMode(mode === "light" ? "dark" : "light");
  }, [mode, setMode]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
    document.documentElement.style.colorScheme = mode;
  }, [mode]);

  const value = useMemo(() => ({ mode, setMode, toggleMode }), [mode, setMode, toggleMode]);

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
}

export function useThemeMode() {
  return useContext(ThemeModeContext);
}
