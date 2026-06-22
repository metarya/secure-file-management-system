import { useEffect, useState, useMemo } from "react";
import { Box, Typography, Avatar, LinearProgress } from "@mui/material";
import InsertDriveFileRounded from "@mui/icons-material/InsertDriveFileRounded";
import StorageRounded from "@mui/icons-material/StorageRounded";
import GroupRounded from "@mui/icons-material/GroupRounded";

import AppShell from "../../components/ui/AppShell";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import DataTable from "../../components/ui/DataTable";
import { useToast } from "../../components/ui/Toast";
import { tokens } from "../../theme/theme";
import { initials, avatarColor, formatBytes, timeAgo } from "../../utils/format";
import { getUserActivity } from "../../api/adminApi";

export default function ActivityPage() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await getUserActivity();
        const list = Array.isArray(data) ? [...data].sort((a, b) => (b.totalFiles || 0) - (a.totalFiles || 0)) : [];
        setRows(list);
      } catch (e) {
        toast(e.message || "Couldn't load activity.", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const totals = useMemo(() => {
    const files = rows.reduce((s, r) => s + (r.totalFiles || 0), 0);
    const storage = rows.reduce((s, r) => s + (r.storageUsedBytes || 0), 0);
    const contributors = rows.filter((r) => (r.totalFiles || 0) > 0).length;
    const maxStorage = Math.max(1, ...rows.map((r) => r.storageUsedBytes || 0));
    return { files, storage, contributors, maxStorage };
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return rows.filter((r) => (r.fullName || "").toLowerCase().includes(q) || (r.email || "").toLowerCase().includes(q));
  }, [rows, query]);

  const columns = [
    {
      key: "user", label: "User",
      render: (r) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar sx={{ width: 34, height: 34, bgcolor: avatarColor(r.email), fontSize: "0.78rem", fontWeight: 700 }}>{initials(r.fullName, r.email)}</Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography noWrap sx={{ color: tokens.text, fontWeight: 600, fontSize: "0.9rem" }}>{r.fullName || "—"}</Typography>
            <Typography noWrap sx={{ color: tokens.textFaint, fontSize: "0.76rem" }}>{r.email}</Typography>
          </Box>
        </Box>
      ),
    },
    { key: "totalFiles", label: "Files", align: "right", render: (r) => <Typography className="tnum" sx={{ color: tokens.text, fontWeight: 600, fontSize: "0.9rem" }}>{r.totalFiles ?? 0}</Typography> },
    {
      key: "storageUsedBytes", label: "Storage used", width: 220,
      render: (r) => (
        <Box>
          <Typography className="tnum" sx={{ color: tokens.textDim, fontSize: "0.82rem", mb: 0.5 }}>{formatBytes(r.storageUsedBytes)}</Typography>
          <LinearProgress variant="determinate" value={Math.round(((r.storageUsedBytes || 0) / totals.maxStorage) * 100)}
            sx={{ height: 6, "& .MuiLinearProgress-bar": { background: tokens.accentGradient, borderRadius: 99 } }} />
        </Box>
      ),
    },
    { key: "lastUploadDate", label: "Last upload", render: (r) => <Typography sx={{ color: tokens.textDim, fontSize: "0.84rem" }}>{r.lastUploadDate ? timeAgo(r.lastUploadDate) : "No uploads"}</Typography> },
  ];

  return (
    <AppShell>
      <PageHeader eyebrow="Administration" title="Activity" subtitle="How storage and files break down across your users" />

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2, mb: 3 }} className="fv-rise">
        <StatCard label="Total files" value={loading ? "—" : totals.files} loading={loading} icon={<InsertDriveFileRounded />} accent="#6366f1" />
        <StatCard label="Total storage" value={loading ? "—" : formatBytes(totals.storage)} loading={loading} icon={<StorageRounded />} accent="#14b8a6" />
        <StatCard label="Contributors" value={loading ? "—" : totals.contributors} loading={loading} icon={<GroupRounded />} accent="#3b82f6" hint="users who have uploaded" />
      </Box>

      <DataTable
        columns={columns}
        rows={filtered}
        loading={loading}
        getRowKey={(r) => r.userId}
        searchable
        searchPlaceholder="Search users…"
        searchValue={query}
        onSearchChange={setQuery}
        empty={null}
      />
    </AppShell>
  );
}
