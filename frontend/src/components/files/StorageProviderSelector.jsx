import { useState } from "react";
import {
  Box, Button, Menu, MenuItem, Chip, CircularProgress,
  ListItemIcon, ListItemText, Tooltip,
} from "@mui/material";
import StorageRounded from "@mui/icons-material/StorageRounded";
import CloudRounded from "@mui/icons-material/CloudRounded";
import CheckRounded from "@mui/icons-material/CheckRounded";
import KeyboardArrowDownRounded from "@mui/icons-material/KeyboardArrowDownRounded";

const PROVIDER_LABELS = {
  LOCAL: "Local Storage",
  S3: "Amazon S3",
  GOOGLE_DRIVE: "Google Drive",
  ONEDRIVE: "Microsoft OneDrive",
  SFTP: "SFTP",
};

const PROVIDER_COLORS = {
  LOCAL: "default",
  S3: "warning",
  GOOGLE_DRIVE: "success",
  ONEDRIVE: "info",
  SFTP: "secondary",
};

function ProviderIcon({ provider, sx }) {
  if (provider === "LOCAL") return <StorageRounded sx={sx} />;
  return <CloudRounded sx={sx} />;
}

/**
 * Dropdown selector that lets the user switch between their configured storage
 * providers. Calls onSwitch(providerKey) when a new provider is chosen;
 * the parent owns loading state and disables this component while switching.
 */
export default function StorageProviderSelector({
  activeProvider,
  availableProviders = [],
  switching = false,
  onSwitch,
}) {
  const [anchor, setAnchor] = useState(null);

  const label = PROVIDER_LABELS[activeProvider] ?? activeProvider ?? "Storage";
  const color = PROVIDER_COLORS[activeProvider] ?? "default";

  function handleSelect(provider) {
    setAnchor(null);
    if (provider !== activeProvider) {
      onSwitch?.(provider);
    }
  }

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Tooltip title="Switch storage provider">
        <span>
          <Button
            size="small"
            variant="outlined"
            disabled={switching}
            onClick={(e) => setAnchor(e.currentTarget)}
            startIcon={
              switching ? (
                <CircularProgress size={14} />
              ) : (
                <ProviderIcon provider={activeProvider} sx={{ fontSize: 16 }} />
              )
            }
            endIcon={<KeyboardArrowDownRounded />}
            aria-label="Select storage provider"
            data-testid="provider-selector-button"
          >
            {label}
          </Button>
        </span>
      </Tooltip>

      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        slotProps={{ paper: { sx: { minWidth: 200 } } }}
      >
        {availableProviders.map((p) => (
          <MenuItem
            key={p}
            selected={p === activeProvider}
            onClick={() => handleSelect(p)}
            data-testid={`provider-option-${p}`}
          >
            <ListItemIcon>
              {p === activeProvider ? (
                <CheckRounded fontSize="small" color="primary" />
              ) : (
                <ProviderIcon provider={p} sx={{ fontSize: 18, color: "text.secondary" }} />
              )}
            </ListItemIcon>
            <ListItemText primary={PROVIDER_LABELS[p] ?? p} />
          </MenuItem>
        ))}
      </Menu>

      <Chip
        label={label}
        color={color}
        size="small"
        icon={<ProviderIcon provider={activeProvider} sx={{ fontSize: 14 }} />}
        sx={{ display: { xs: "none", sm: "flex" } }}
        data-testid="active-provider-chip"
      />
    </Box>
  );
}
