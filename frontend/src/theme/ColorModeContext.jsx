import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";

import { makeTheme, applyColorMode } from "./theme";

const STORAGE_KEY = "fv-theme";

const ColorModeContext = createContext({
  mode: "dark",
  toggle: () => {},
  setMode: () => {},
});

// Usage: const { mode, toggle } = useColorMode();
export function useColorMode() {
  return useContext(ColorModeContext);
}

function readInitialMode() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    /* localStorage unavailable — fall back to default */
  }
  return "dark";
}

export function ColorModeProvider({ children }) {
  const [mode, setMode] = useState(readInitialMode);

  useEffect(() => {
    applyColorMode(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* ignore persistence failures */
    }
  }, [mode]);

  const theme = useMemo(() => makeTheme(mode), [mode]);

  const value = useMemo(
    () => ({
      mode,
      setMode,
      toggle: () => setMode((m) => (m === "dark" ? "light" : "dark")),
    }),
    [mode]
  );

  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
