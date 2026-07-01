import { useEffect, useRef, useState } from "react";
import {
  Box, Typography, Avatar, Chip,
  IconButton, Menu, MenuItem, ListItemIcon, ListItemText,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Divider, CircularProgress,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CheckIcon from "@mui/icons-material/Check";
import StorageIcon from "@mui/icons-material/Storage";

import AppShell from "../../components/ui/AppShell";
import PageHeader from "../../components/ui/PageHeader";
import DataTable from "../../components/ui/DataTable";
import { useToast } from "../../components/ui/Toast";
import { tokens } from "../../theme/theme";
import { initials, avatarColor } from "../../utils/format";
import { getAdminUserStorage, adminChangeUserStorageProvider } from "../../api/storageApi";

const PROVIDER_LABELS = {
  LOCAL: "Local",
  S3: "Amazon S3",
  GOOGLE_DRIVE: "Google Drive",
  ONEDRIVE: "OneDrive",
  SFTP: "SFTP",
};

const PROVIDER_COLORS = {
  LOCAL: "default",
  S3: "warning",
  GOOGLE_DRIVE: "success",
  ONEDRIVE: "info",
  SFTP: "secondary",
};

const ALL_PROVIDERS = ["LOCAL", "S3", "GOOGLE_DRIVE", "ONEDRIVE", "SFTP"];

export default function AdminStoragePage() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Three-dots menu state
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [activeRow, setActiveRow] = useState(null);

  // Confirmation dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingProvider, setPendingProvider] = useState(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    getAdminUserStorage()
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch((e) => toast(e.message || "Couldn't load storage overview.", "error"))
      .finally(() => setLoading(false));
  }, [toast]);

  const handleMenuOpen = (event, row) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setActiveRow(row);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleProviderSelect = (provider) => {
    handleMenuClose();
    if (provider === activeRow?.storageProvider) return;
    setPendingProvider(provider);
    setConfirmOpen(true);
  };

  const handleConfirmClose = () => {
    if (confirming) return;
    setConfirmOpen(false);
    setPendingProvider(null);
    setActiveRow(null);
  };

  const handleConfirmChange = async () => {
    if (!activeRow || !pendingProvider) return;
    setConfirming(true);
    try {
      const updated = await adminChangeUserStorageProvider(activeRow.userId, pendingProvider);
      setRows((prev) =>
        prev.map((r) =>
          r.userId === updated.userId ? { ...r, storageProvider: updated.storageProvider } : r
        )
      );
      toast("Storage provider updated successfully.", "success");
    } catch (e) {
      toast(e.message || "Failed to update storage provider.", "error");
    } finally {
      setConfirming(false);
      setConfirmOpen(false);
      setPendingProvider(null);
      setActiveRow(null);
    }
  };

  const columns = [
    {
      key: "user", label: "User",
      render: (r) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <Avatar sx={{ width: 30, height: 30, bgcolor: avatarColor(r.email || ""), fontSize: "0.72rem", fontWeight: 700 }}>
            {initials(r.fullName, r.email)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography noWrap sx={{ color: tokens.text, fontWeight: 600, fontSize: "0.85rem" }}>{r.fullName || "—"}</Typography>
            <Typography noWrap sx={{ color: tokens.textFaint, fontSize: "0.74rem" }}>{r.email}</Typography>
          </Box>
        </Box>
      ),
    },
    {
      key: "storageProvider", label: "Storage Provider",
      render: (r) => (
        <Chip
          size="small"
          color={PROVIDER_COLORS[r.storageProvider] || "default"}
          label={PROVIDER_LABELS[r.storageProvider] || r.storageProvider}
          sx={{ fontWeight: 700, fontSize: "0.72rem" }}
        />
      ),
    },
    {
      key: "actions", label: "",
      align: "right",
      render: (r) => (
        <IconButton
          size="small"
          onClick={(e) => handleMenuOpen(e, r)}
          sx={{ color: tokens.textFaint, "&:hover": { color: tokens.text } }}
          aria-label="Change storage provider"
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  return (
    <AppShell>
      <PageHeader eyebrow="Administration" title="Storage" subtitle="Storage provider assigned to each user." />

      <DataTable columns={columns} rows={rows} loading={loading} getRowKey={(r) => r.userId} empty={null} />

      {/* Three-dots dropdown menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              minWidth: 200,
              borderRadius: "12px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
              border: "1px solid",
              borderColor: "divider",
              mt: 0.5,
            },
          },
        }}
      >
        <Typography
          sx={{ px: 2, py: 1, fontSize: "0.72rem", fontWeight: 700, color: tokens.textFaint, letterSpacing: "0.06em", textTransform: "uppercase" }}
        >
          Change Storage Provider
        </Typography>
        <Divider />
        {ALL_PROVIDERS.map((p) => {
          const isCurrent = activeRow?.storageProvider === p;
          return (
            <MenuItem
              key={p}
              onClick={() => handleProviderSelect(p)}
              selected={isCurrent}
              sx={{ gap: 1, fontSize: "0.85rem" }}
            >
              <ListItemText primary={PROVIDER_LABELS[p]} />
              {isCurrent && (
                <ListItemIcon sx={{ minWidth: "auto", color: "primary.main" }}>
                  <CheckIcon fontSize="small" />
                </ListItemIcon>
              )}
            </MenuItem>
          );
        })}
      </Menu>

      {/* Confirmation dialog */}
      <Dialog
        open={confirmOpen}
        onClose={confirming ? undefined : handleConfirmClose}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1 }}>
          <Box sx={{
            width: 40, height: 40, borderRadius: "12px", display: "grid", placeItems: "center",
            bgcolor: "rgba(129,140,248,0.14)", color: tokens.accent,
          }}>
            <StorageIcon fontSize="small" />
          </Box>
          Change Storage Provider
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <Typography sx={{ color: tokens.textDim, fontSize: "0.9rem", mb: 2 }}>
            Are you sure you want to change the storage provider for{" "}
            <strong style={{ color: tokens.text }}>&ldquo;{activeRow?.fullName}&rdquo;</strong>?
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Typography sx={{ color: tokens.textFaint, fontSize: "0.82rem", width: 120 }}>Current Provider:</Typography>
              <Chip
                size="small"
                color={PROVIDER_COLORS[activeRow?.storageProvider] || "default"}
                label={PROVIDER_LABELS[activeRow?.storageProvider] || activeRow?.storageProvider}
                sx={{ fontWeight: 700, fontSize: "0.72rem" }}
              />
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Typography sx={{ color: tokens.textFaint, fontSize: "0.82rem", width: 120 }}>New Provider:</Typography>
              <Chip
                size="small"
                color={PROVIDER_COLORS[pendingProvider] || "default"}
                label={PROVIDER_LABELS[pendingProvider] || pendingProvider}
                sx={{ fontWeight: 700, fontSize: "0.72rem" }}
              />
            </Box>
          </Box>

          <Box sx={{ mt: 2, p: 1.5, borderRadius: "8px", bgcolor: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.25)" }}>
            <Typography sx={{ fontSize: "0.8rem", color: "warning.main", fontWeight: 600 }}>Important</Typography>
            <Typography sx={{ fontSize: "0.8rem", color: tokens.textDim, mt: 0.25 }}>
              Only future uploads will use the new storage provider. Existing files will remain in their current storage location.
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={handleConfirmClose} disabled={confirming} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmChange}
            disabled={confirming}
            variant="contained"
            startIcon={confirming ? <CircularProgress size={14} color="inherit" /> : undefined}
          >
            {confirming ? "Updating…" : "Change Provider"}
          </Button>
        </DialogActions>
      </Dialog>
    </AppShell>
  );
}
