import { Box, Typography } from "@mui/material";
import { tokens } from "../../theme/theme";

export default function EmptyState({ icon, title, description, action }) {
  return (
    <Box sx={{ textAlign: "center", py: 8, px: 3 }}>
      {icon && (
        <Box
          sx={{
            width: 64, height: 64, borderRadius: "18px", mx: "auto", mb: 2.5,
            display: "grid", placeItems: "center",
            background: "rgba(255,255,255,0.04)", border: `1px solid ${tokens.border}`,
            color: tokens.textFaint,
          }}
        >
          {icon}
        </Box>
      )}
      <Typography variant="h6" sx={{ color: tokens.text, mb: 0.5 }}>{title}</Typography>
      {description && (
        <Typography sx={{ color: tokens.textFaint, fontSize: "0.9rem", maxWidth: 380, mx: "auto" }}>
          {description}
        </Typography>
      )}
      {action && <Box sx={{ mt: 3 }}>{action}</Box>}
    </Box>
  );
}
