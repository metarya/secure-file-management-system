import { useEffect, useState } from "react";
import { Box, Typography, Avatar, Chip } from "@mui/material";

import AppShell from "../../components/ui/AppShell";
import PageHeader from "../../components/ui/PageHeader";
import DataTable from "../../components/ui/DataTable";
import { useToast } from "../../components/ui/Toast";
import { tokens } from "../../theme/theme";
import { initials, avatarColor } from "../../utils/format";
import { getAdminUserStorage } from "../../api/storageApi";

const PROVIDER_LABELS = {
  LOCAL: "Local",
  S3: "Amazon S3",
  GOOGLE_DRIVE: "Google Drive",
  ONEDRIVE: "OneDrive",
};

const PROVIDER_COLORS = {
  LOCAL: "default",
  S3: "warning",
  GOOGLE_DRIVE: "success",
  ONEDRIVE: "info",
};

// Read-only: administrators may VIEW each user's provider but never change it.
export default function AdminStoragePage() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminUserStorage()
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch((e) => toast(e.message || "Couldn't load storage overview.", "error"))
      .finally(() => setLoading(false));
  }, [toast]);

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
        <Chip size="small" color={PROVIDER_COLORS[r.storageProvider] || "default"}
          label={PROVIDER_LABELS[r.storageProvider] || r.storageProvider} sx={{ fontWeight: 700, fontSize: "0.72rem" }} />
      ),
    },
  ];

  return (
    <AppShell>
      <PageHeader eyebrow="Administration" title="Storage" subtitle="Storage provider each user has chosen (read-only)." />
      <DataTable columns={columns} rows={rows} loading={loading} getRowKey={(r) => r.userId} empty={null} />
    </AppShell>
  );
}
