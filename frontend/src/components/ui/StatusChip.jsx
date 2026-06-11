import { Chip } from "@mui/material";

const map = {
  // roles
  ADMIN:   { label: "Admin",   bg: "rgba(129,140,248,0.16)", fg: "#a5b4fc", bd: "rgba(129,140,248,0.4)" },
  USER:    { label: "User",    bg: "rgba(56,189,248,0.14)",  fg: "#7dd3fc", bd: "rgba(56,189,248,0.35)" },
  // status
  ACTIVE:  { label: "Active",  bg: "rgba(52,211,153,0.14)",  fg: "#6ee7b7", bd: "rgba(52,211,153,0.35)" },
  BLOCKED: { label: "Blocked", bg: "rgba(248,113,113,0.14)", fg: "#fca5a5", bd: "rgba(248,113,113,0.35)" },
  // visibility
  PUBLIC:  { label: "Public",  bg: "rgba(52,211,153,0.12)",  fg: "#6ee7b7", bd: "rgba(52,211,153,0.3)" },
  PRIVATE: { label: "Private", bg: "rgba(255,255,255,0.06)", fg: "#cbd5e1", bd: "rgba(255,255,255,0.16)" },
};

export default function StatusChip({ value, size = "small" }) {
  const key = String(value || "").toUpperCase();
  const s = map[key] || { label: value || "—", bg: "rgba(255,255,255,0.06)", fg: "#cbd5e1", bd: "rgba(255,255,255,0.16)" };
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
