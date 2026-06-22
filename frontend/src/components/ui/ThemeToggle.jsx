import { IconButton, Tooltip } from "@mui/material";
import LightModeRounded from "@mui/icons-material/LightModeRounded";
import DarkModeRounded from "@mui/icons-material/DarkModeRounded";

import { useColorMode } from "../../theme/ColorModeContext";
import { tokens } from "../../theme/theme";

// Toggles between the light and dark themes. Shows a sun when dark (tap to go
// light) and a moon when light (tap to go dark).
export default function ThemeToggle({ size = "small" }) {
  const { mode, toggle } = useColorMode();
  const isDark = mode === "dark";

  return (
    <Tooltip title={isDark ? "Switch to light mode" : "Switch to dark mode"}>
      <IconButton
        onClick={toggle}
        size={size}
        aria-label="Toggle light and dark theme"
        sx={{
          color: tokens.textDim,
          border: `1px solid ${tokens.border}`,
          borderRadius: "12px",
          "&:hover": {
            color: tokens.text,
            background: tokens.surfaceHover,
            borderColor: tokens.borderStrong,
          },
        }}
      >
        {isDark ? <LightModeRounded sx={{ fontSize: 19 }} /> : <DarkModeRounded sx={{ fontSize: 19 }} />}
      </IconButton>
    </Tooltip>
  );
}
