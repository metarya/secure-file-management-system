import { createTheme } from "@mui/material/styles";

// FileVault design tokens.
// Every color is exposed as a CSS variable (defined for both light + dark in
// styles/app.css). Because the whole app styles via these tokens, flipping the
// <html data-theme> attribute re-themes everything instantly — no component
// changes needed. Fonts stay as literal strings.
export const tokens = {
  bg: "var(--fv-bg)",
  bgGradient: "var(--fv-bg-gradient)",
  surface: "var(--fv-surface)",
  surfaceHover: "var(--fv-surface-hover)",
  surfaceSolid: "var(--fv-surface-solid)",
  card: "var(--fv-card)",
  sidebar: "var(--fv-sidebar)",
  topbar: "var(--fv-topbar)",
  input: "var(--fv-input)",
  border: "var(--fv-border)",
  borderStrong: "var(--fv-border-strong)",
  accent: "var(--fv-accent)",
  accentFrom: "var(--fv-accent-from)",
  accentTo: "var(--fv-accent-to)",
  accentGradient: "var(--fv-accent-gradient)",
  text: "var(--fv-text)",
  textDim: "var(--fv-text-dim)",
  textFaint: "var(--fv-text-faint)",
  success: "var(--fv-success)",
  warning: "var(--fv-warning)",
  danger: "var(--fv-danger)",
  info: "var(--fv-info)",
  shadow: "var(--fv-shadow)",
  shadowHover: "var(--fv-shadow-hover)",
  display: '"Space Grotesk", "Inter", system-ui, sans-serif',
  body: '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
};

// MUI derives light/dark/contrast variants from these, so they must be real
// colors (not CSS variables). One set per mode.
const palettes = {
  dark: {
    accent: "#818cf8", accentFrom: "#6366f1", info: "#38bdf8",
    success: "#34d399", warning: "#fbbf24", danger: "#f87171",
    bg: "#0b1120", surfaceSolid: "#121a2c",
    text: "#f1f5f9", textDim: "rgba(241,245,249,0.62)", border: "rgba(255,255,255,0.09)",
  },
  light: {
    accent: "#4f46e5", accentFrom: "#6366f1", info: "#0284c7",
    success: "#059669", warning: "#d97706", danger: "#dc2626",
    bg: "#eef2f9", surfaceSolid: "#ffffff",
    text: "#0f172a", textDim: "rgba(15,23,42,0.62)", border: "rgba(15,23,42,0.10)",
  },
};

export function makeTheme(mode = "dark") {
  const p = palettes[mode] || palettes.dark;
  return createTheme({
    palette: {
      mode,
      primary: { main: p.accentFrom, light: p.accent },
      secondary: { main: p.info },
      success: { main: p.success },
      warning: { main: p.warning },
      error: { main: p.danger },
      background: { default: p.bg, paper: p.surfaceSolid },
      text: { primary: p.text, secondary: p.textDim },
      divider: p.border,
    },
    shape: { borderRadius: 14 },
    typography: {
      fontFamily: tokens.body,
      h1: { fontFamily: tokens.display, fontWeight: 700, letterSpacing: "-0.03em" },
      h2: { fontFamily: tokens.display, fontWeight: 700, letterSpacing: "-0.03em" },
      h3: { fontFamily: tokens.display, fontWeight: 700, letterSpacing: "-0.02em" },
      h4: { fontFamily: tokens.display, fontWeight: 700, letterSpacing: "-0.02em" },
      h5: { fontFamily: tokens.display, fontWeight: 600, letterSpacing: "-0.01em" },
      h6: { fontWeight: 700, letterSpacing: "-0.01em" },
      button: { textTransform: "none", fontWeight: 600 },
      overline: { letterSpacing: "0.12em", fontWeight: 700 },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            backgroundColor: tokens.surface,
            border: `1px solid ${tokens.border}`,
            backdropFilter: "blur(16px)",
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 12, paddingInline: 18, height: 42 },
          containedPrimary: {
            background: tokens.accentGradient,
            boxShadow: "0 6px 20px rgba(99,102,241,0.35)",
            "&:hover": { background: "linear-gradient(135deg,#4f46e5,#2563eb)" },
          },
          outlined: {
            borderColor: tokens.border,
            color: tokens.text,
            "&:hover": { borderColor: tokens.borderStrong, background: tokens.surfaceHover },
          },
          text: { color: tokens.textDim, "&:hover": { background: tokens.surfaceHover, color: tokens.text } },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            backgroundColor: tokens.input,
            "& fieldset": { borderColor: tokens.border },
            "&:hover fieldset": { borderColor: tokens.borderStrong },
            "&.Mui-focused fieldset": { borderColor: tokens.accentFrom },
          },
          input: { "::placeholder": { color: tokens.textFaint, opacity: 1 } },
        },
      },
      MuiInputLabel: { styleOverrides: { root: { color: tokens.textDim } } },
      MuiChip: { styleOverrides: { root: { fontWeight: 600, borderRadius: 8 } } },
      MuiTableCell: {
        styleOverrides: {
          root: { borderColor: tokens.border },
          head: { color: tokens.textFaint, fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.06em", textTransform: "uppercase" },
        },
      },
      MuiTableRow: {
        styleOverrides: { root: { "&:hover": { backgroundColor: tokens.surfaceHover } } },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: { background: "#1e293b", border: `1px solid ${tokens.border}`, fontSize: "0.75rem", borderRadius: 8 },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: { borderRadius: 22, backgroundColor: tokens.surfaceSolid, border: `1px solid ${tokens.border}`, backgroundImage: "none", boxShadow: tokens.shadowHover },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: { backgroundColor: tokens.surfaceSolid, border: `1px solid ${tokens.border}`, borderRadius: 12, backgroundImage: "none", boxShadow: tokens.shadowHover },
        },
      },
      MuiLinearProgress: {
        styleOverrides: { root: { borderRadius: 99, backgroundColor: tokens.surfaceHover, height: 8 } },
      },
    },
  });
}

// Flip the active theme. Updates the <html data-theme> attribute, which swaps
// every --fv-* CSS variable (and therefore every tokens.* usage) via app.css.
export function applyColorMode(mode) {
  const root = document.documentElement;
  root.setAttribute("data-theme", mode);
  root.style.colorScheme = mode;
}

// Default dark theme, kept for any direct import.
const theme = makeTheme("dark");
export default theme;
