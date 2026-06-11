import { Box, Typography, Stack } from "@mui/material";
import { tokens } from "../../theme/theme";

// Standard page heading: eyebrow + title + optional subtitle, with a right-aligned action slot.
export default function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      justifyContent="space-between"
      alignItems={{ xs: "flex-start", sm: "flex-end" }}
      spacing={2}
      sx={{ mb: 3.5 }}
    >
      <Box>
        {eyebrow && (
          <Typography sx={{ color: tokens.accent, fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.14em", textTransform: "uppercase", mb: 0.75 }}>
            {eyebrow}
          </Typography>
        )}
        <Typography variant="h4" sx={{ color: tokens.text, fontSize: { xs: "1.5rem", sm: "1.9rem" }, lineHeight: 1.1 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography sx={{ color: tokens.textFaint, mt: 0.75, fontSize: "0.92rem" }}>{subtitle}</Typography>
        )}
      </Box>
      {actions && <Box sx={{ display: "flex", gap: 1.25, flexWrap: "wrap" }}>{actions}</Box>}
    </Stack>
  );
}
