import { createTheme } from "@mui/material/styles";

// FileVault design tokens — slate canvas, indigo→blue accent, frosted surfaces.
export const tokens = {
  bg: "#0b1120",
  bgGradient:
    "radial-gradient(1200px 600px at 85% -10%, rgba(99,102,241,0.10), transparent 60%)," +
    "radial-gradient(900px 500px at -10% 110%, rgba(56,189,248,0.08), transparent 55%)," +
    "linear-gradient(180deg, #0b1120 0%, #0e1526 100%)",
  surface: "rgba(255,255,255,0.035)",
  surfaceHover: "rgba(255,255,255,0.06)",
  surfaceSolid: "#121a2c",
  border: "rgba(255,255,255,0.09)",
  borderStrong: "rgba(255,255,255,0.16)",
  accent: "#818cf8",
  accentFrom: "#6366f1",
  accentTo: "#3b82f6",
  accentGradient: "linear-gradient(135deg, #6366f1, #3b82f6)",
  text: "#f1f5f9",
  textDim: "rgba(241,245,249,0.62)",
  textFaint: "rgba(241,245,249,0.40)",
  success: "#34d399",
  warning: "#fbbf24",
  danger: "#f87171",
  info: "#38bdf8",
  display: '"Space Grotesk", "Inter", system-ui, sans-serif',
  body: '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
};

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: tokens.accentFrom, light: tokens.accent },
    secondary: { main: tokens.info },
    success: { main: tokens.success },
    warning: { main: tokens.warning },
    error: { main: tokens.danger },
    background: { default: tokens.bg, paper: tokens.surfaceSolid },
    text: { primary: tokens.text, secondary: tokens.textDim },
    divider: tokens.border,
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
          backgroundColor: "rgba(255,255,255,0.04)",
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
        paper: { borderRadius: 22, backgroundColor: tokens.surfaceSolid, border: `1px solid ${tokens.border}`, backgroundImage: "none" },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: { backgroundColor: tokens.surfaceSolid, border: `1px solid ${tokens.border}`, borderRadius: 12, backgroundImage: "none" },
      },
    },
    MuiLinearProgress: {
      styleOverrides: { root: { borderRadius: 99, backgroundColor: "rgba(255,255,255,0.08)", height: 8 } },
    },
  },
});

export default theme;
