import { Chip } from "@mui/material";
import { useColorMode } from "../../theme/ColorModeContext";

// Dark palette: soft pastel text on faint tints (reads well on dark surfaces).
const darkMap = {
  ADMIN:   { label: "Admin",   bg: "rgba(129,140,248,0.16)", fg: "#a5b4fc", bd: "rgba(129,140,248,0.4)" },
  USER:    { label: "User",    bg: "rgba(56,189,248,0.14)",  fg: "#7dd3fc", bd: "rgba(56,189,248,0.35)" },
  ACTIVE:  { label: "Active",  bg: "rgba(52,211,153,0.14)",  fg: "#6ee7b7", bd: "rgba(52,211,153,0.35)" },
  BLOCKED: { label: "Blocked", bg: "rgba(248,113,113,0.14)", fg: "#fca5a5", bd: "rgba(248,113,113,0.35)" },
  PUBLIC:  { label: "Public",  bg: "rgba(52,211,153,0.12)",  fg: "#6ee7b7", bd: "rgba(52,211,153,0.3)" },
  PRIVATE: { label: "Private", bg: "rgba(255,255,255,0.06)", fg: "#cbd5e1", bd: "rgba(255,255,255,0.16)" },
};

// Light palette: deeper saturated text on light tints (reads well on white cards).
const lightMap = {
  ADMIN:   { label: "Admin",   bg: "rgba(99,102,241,0.12)",  fg: "#4338ca", bd: "rgba(99,102,241,0.32)" },
  USER:    { label: "User",    bg: "rgba(2,132,199,0.10)",   fg: "#0369a1", bd: "rgba(2,132,199,0.30)" },
  ACTIVE:  { label: "Active",  bg: "rgba(5,150,105,0.12)",   fg: "#047857", bd: "rgba(5,150,105,0.30)" },
  BLOCKED: { label: "Blocked", bg: "rgba(220,38,38,0.10)",   fg: "#b91c1c", bd: "rgba(220,38,38,0.30)" },
  PUBLIC:  { label: "Public",  bg: "rgba(5,150,105,0.11)",   fg: "#047857", bd: "rgba(5,150,105,0.28)" },
  PRIVATE: { label: "Private", bg: "rgba(15,23,42,0.05)",    fg: "#475569", bd: "rgba(15,23,42,0.15)" },
};

const fallback = {
  dark:  { bg: "rgba(255,255,255,0.06)", fg: "#cbd5e1", bd: "rgba(255,255,255,0.16)" },
  light: { bg: "rgba(15,23,42,0.05)",    fg: "#475569", bd: "rgba(15,23,42,0.15)" },
};

export default function StatusChip({ value, size = "small" }) {
  const { mode } = useColorMode();
  const map = mode === "light" ? lightMap : darkMap;
  const key = String(value || "").toUpperCase();
  const s = map[key] || { label: value || "—", ...fallback[mode === "light" ? "light" : "dark"] };
  return (
    <Chip
      label={s.label}
      size={size}
      sx={{
        bgcolor: s.bg, color: s.fg, border: `1px solid ${s.bd}`,
        fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.02em", height: 24,
      }}
    />
  );
}
