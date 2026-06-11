import { Box, Container, Typography } from "@mui/material";
import FolderOpenRounded from "@mui/icons-material/FolderOpenRounded";
import { tokens } from "../../theme/theme";

// Shared centered scaffold for login / register / reset screens.
export default function AuthLayout({ title, subtitle, children, width = "xs" }) {
  return (
    <Box sx={{ minHeight: "100dvh", background: tokens.bgGradient, display: "flex", alignItems: "center", justifyContent: "center", px: 2, py: 5, position: "relative", overflow: "hidden" }}>
      <Box sx={{ position: "absolute", top: "-12%", right: "-6%", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.16), transparent 70%)", pointerEvents: "none" }} />
      <Box sx={{ position: "absolute", bottom: "-12%", left: "-6%", width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle, rgba(56,189,248,0.1), transparent 70%)", pointerEvents: "none" }} />

      <Container maxWidth={width} disableGutters sx={{ position: "relative" }}>
        <Box className="fv-rise" sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 4 }}>
          <Box sx={{ width: 58, height: 58, borderRadius: "16px", mb: 2, background: tokens.accentGradient, display: "grid", placeItems: "center", boxShadow: "0 10px 28px rgba(99,102,241,0.45)" }}>
            <FolderOpenRounded sx={{ color: "#fff", fontSize: 29 }} />
          </Box>
          <Typography sx={{ fontFamily: tokens.display, color: tokens.text, fontWeight: 700, fontSize: "1.55rem", letterSpacing: "-0.02em" }}>
            FileVault
          </Typography>
          <Typography sx={{ color: tokens.textFaint, fontSize: "0.85rem", mt: 0.5 }}>Secure file management</Typography>
        </Box>

        <Box className="fv-rise" sx={{ borderRadius: "24px", background: "rgba(255,255,255,0.04)", border: `1px solid ${tokens.border}`, backdropFilter: "blur(20px)", p: { xs: 3, sm: 4 }, animationDelay: "0.05s" }}>
          {title && <Typography sx={{ color: tokens.text, fontWeight: 700, fontSize: "1.4rem", mb: subtitle ? 0.5 : 3 }}>{title}</Typography>}
          {subtitle && <Typography sx={{ color: tokens.textFaint, fontSize: "0.9rem", mb: 3.5 }}>{subtitle}</Typography>}
          {children}
        </Box>
      </Container>
    </Box>
  );
}

// Shared label above inputs.
export function FieldLabel({ children, right }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.8 }}>
      <Typography sx={{ color: tokens.textDim, fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.03em", textTransform: "uppercase" }}>
        {children}
      </Typography>
      {right}
    </Box>
  );
}
