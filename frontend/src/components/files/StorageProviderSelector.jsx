import { useState } from "react";
import {
  Box, Button, Menu, MenuItem, CircularProgress,
  ListItemIcon, ListItemText, Tooltip,
} from "@mui/material";
import StorageRounded from "@mui/icons-material/StorageRounded";
import CloudQueueRounded from "@mui/icons-material/CloudQueueRounded";
import AddToDriveRounded from "@mui/icons-material/AddToDriveRounded";
import CloudRounded from "@mui/icons-material/CloudRounded";
import RouterRounded from "@mui/icons-material/RouterRounded";
import CheckRounded from "@mui/icons-material/CheckRounded";
import KeyboardArrowDownRounded from "@mui/icons-material/KeyboardArrowDownRounded";

/**
 * Centralized provider metadata — single source of truth for labels, brand
 * colors, and icons. Add a new provider here and the entire UI picks it up.
 */
export const PROVIDER_META = {
  LOCAL:        { label: "Local Storage",      color: "#64748b", Icon: StorageRounded },
  S3:           { label: "Amazon S3",          color: "#ff9900", Icon: CloudQueueRounded },
  GOOGLE_DRIVE: { label: "Google Drive",       color: "#4285F4", Icon: AddToDriveRounded },
  ONEDRIVE:     { label: "Microsoft OneDrive", color: "#0078D4", Icon: CloudRounded },
  SFTP:         { label: "SFTP",               color: "#10b981", Icon: RouterRounded },
};

function meta(provider) {
  return PROVIDER_META[provider] ?? { label: provider ?? "Storage", color: "#64748b", Icon: CloudRounded };
}

/**
 * Dropdown selector that lets the user switch between their configured
 * (connected) storage providers. Each provider is rendered with its brand
 * color and icon.
 *
 * When only one provider is available the dropdown arrow is hidden and the
 * button is non-interactive (no point switching when there is nothing to
 * switch to).
 *
 * The `availableProviders` list comes from the backend and contains ONLY
 * providers the user has actually configured — never hardcoded here.
 */
export default function StorageProviderSelector({
  activeProvider,
  availableProviders = [],
  switching = false,
  onSwitch,
}) {
  const [anchor, setAnchor] = useState(null);

  const { label, color, Icon } = meta(activeProvider);
  const isSingle = availableProviders.length <= 1;

  function handleSelect(provider) {
    setAnchor(null);
    if (provider !== activeProvider) {
      onSwitch?.(provider);
    }
  }

  const buttonSx = {
    borderColor: color,
    color,
    backgroundColor: `${color}14`, // ~8 % alpha
    "&:hover": {
      borderColor: color,
      backgroundColor: `${color}26`, // ~15 % alpha
    },
    "&:disabled": {
      borderColor: `${color}60`,
      color: `${color}80`,
      backgroundColor: `${color}0a`,
    },
    transition: "background-color 200ms ease, border-color 200ms ease",
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <Tooltip title={isSingle ? label : "Switch storage provider"}>
        <span>
          <Button
            size="small"
            variant="outlined"
            disabled={switching || isSingle}
            onClick={(e) => !isSingle && setAnchor(e.currentTarget)}
            startIcon={
              switching ? (
                <CircularProgress size={14} sx={{ color }} />
              ) : (
                <Icon sx={{ fontSize: 16, color }} />
              )
            }
            endIcon={
              !isSingle && (
                <KeyboardArrowDownRounded
                  sx={{
                    fontSize: 16,
                    color,
                    transition: "transform 200ms ease",
                    transform: anchor ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                />
              )
            }
            aria-label="Select storage provider"
            data-testid="provider-selector-button"
            sx={buttonSx}
          >
            {label}
          </Button>
        </span>
      </Tooltip>

      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        slotProps={{
          paper: {
            sx: {
              minWidth: 220,
              mt: 0.5,
            },
          },
        }}
        transformOrigin={{ horizontal: "left", vertical: "top" }}
        anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
      >
        {availableProviders.map((p) => {
          const { label: pLabel, color: pColor, Icon: PIcon } = meta(p);
          const isActive = p === activeProvider;
          return (
            <MenuItem
              key={p}
              onClick={() => handleSelect(p)}
              data-testid={`provider-option-${p}`}
              sx={{
                borderRadius: 1.5,
                mx: 0.5,
                mb: 0.25,
                backgroundColor: isActive ? `${pColor}18` : "transparent",
                "&:hover": { backgroundColor: `${pColor}22` },
                transition: "background-color 150ms ease",
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 34,
                  "& svg": { fontSize: 18, color: pColor },
                }}
              >
                {isActive ? (
                  <CheckRounded sx={{ fontSize: 18, color: pColor }} />
                ) : (
                  <PIcon />
                )}
              </ListItemIcon>
              <ListItemText
                primary={pLabel}
                slotProps={{
                  primary: {
                    sx: {
                      fontSize: "0.875rem",
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? pColor : "text.primary",
                    },
                  },
                }}
              />
            </MenuItem>
          );
        })}
      </Menu>
    </Box>
  );
}
