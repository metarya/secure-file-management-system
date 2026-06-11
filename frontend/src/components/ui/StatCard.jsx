import { Box, Typography, Skeleton } from "@mui/material";
import { tokens } from "../../theme/theme";

// Compact metric card. The number uses the display face (tabular numerals).
export default function StatCard({ label, value, icon, accent = tokens.accentFrom, hint, loading }) {
  return (
    <Box
      sx={{
        position: "relative", overflow: "hidden",
        p: 2.5, borderRadius: "18px", height: "100%",
        background: tokens.surface, border: `1px solid ${tokens.border}`,
        backdropFilter: "blur(16px)",
        transition: "border-color 0.2s, transform 0.2s",
        "&:hover": { borderColor: tokens.borderStrong, transform: "translateY(-2px)" },
      }}
    >
      <Box
        sx={{
          position: "absolute", top: -28, right: -28, width: 110, height: 110, borderRadius: "50%",
          background: `radial-gradient(circle, ${accent}22, transparent 70%)`, pointerEvents: "none",
        }}
      />
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
        <Typography sx={{ color: tokens.textFaint, fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>
          {label}
        </Typography>
        {icon && (
          <Box sx={{ width: 38, height: 38, borderRadius: "11px", display: "grid", placeItems: "center", color: accent, background: `${accent}1f` }}>
            {icon}
          </Box>
        )}
      </Box>
      {loading ? (
        <Skeleton variant="text" width={80} height={44} sx={{ bgcolor: "rgba(255,255,255,0.06)" }} />
      ) : (
        <Typography className="tnum" sx={{ color: tokens.text, fontWeight: 700, fontSize: "2rem", lineHeight: 1, fontFamily: tokens.display }}>
          {value}
        </Typography>
      )}
      {hint && <Typography sx={{ color: tokens.textFaint, fontSize: "0.78rem", mt: 1 }}>{hint}</Typography>}
    </Box>
  );
}
