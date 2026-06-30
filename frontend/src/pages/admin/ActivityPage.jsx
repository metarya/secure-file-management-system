import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Typography, Avatar, LinearProgress } from "@mui/material";
import InsertDriveFileRounded from "@mui/icons-material/InsertDriveFileRounded";
import StorageRounded from "@mui/icons-material/StorageRounded";
import GroupRounded from "@mui/icons-material/GroupRounded";

import AppShell from "../../components/ui/AppShell";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import DataTable from "../../components/ui/DataTable";
import Pagination from "../../components/ui/Pagination";
import { useToast } from "../../components/ui/Toast";
import usePaginatedQuery from "../../hooks/usePaginatedQuery";
import { tokens } from "../../theme/theme";
import { initials, avatarColor, formatBytes, timeAgo } from "../../utils/format";
import { getUserActivity, getSystemHealth } from "../../api/adminApi";

export default function ActivityPage() {
  const toast = useToast();

  // Server-side paginated activity rows. Aggregates are computed per page by the
  // backend; sortable by name/email/joined (file-count etc. are derived values).
  const fetchActivity = useCallback((params) => getUserActivity(params), []);
  const {
    rows, meta, loading,
    sort, search, handleSort, setSearch, goToPage,
  } = usePaginatedQuery(fetchActivity, {
    initialSort: "createdAt",
    initialDirection: "desc",
    size: 10, // 10 users per page (server-side LIMIT)
    onError: (e) => toast(e.message || "Couldn't load activity.", "error"),
  });

  // Global headline totals come from the system-health endpoint so they stay
  // correct regardless of which page of users is currently shown.
  const [health, setHealth] = useState(null);
  useEffect(() => {
    getSystemHealth().then(setHealth).catch(() => {});
  }, []);

  const totals = useMemo(() => {
    // Storage bars are normalized against the largest value on the current page.
    const maxStorage = Math.max(1, ...rows.map((r) => r.storageUsedBytes || 0));
    return {
      files: health?.totalFiles ?? 0,
      storage: health?.totalStorageBytes ?? 0,
      users: meta.totalElements,
      maxStorage,
    };
  }, [rows, health, meta.totalElements]);

  const columns = [
    {
      key: "user", label: "User", sortKey: "fullName",
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
    { key: "totalFiles", label: "Files", align: "right", sortKey: "totalFiles", render: (r) => <Typography className="tnum" sx={{ color: tokens.text, fontWeight: 600, fontSize: "0.9rem" }}>{r.totalFiles ?? 0}</Typography> },
    {
      key: "storageUsedBytes", label: "Storage used", width: 220, sortKey: "storageUsed",
      render: (r) => (
        <Box>
          <Typography className="tnum" sx={{ color: tokens.textDim, fontSize: "0.82rem", mb: 0.5 }}>{formatBytes(r.storageUsedBytes)}</Typography>
          <LinearProgress variant="determinate" value={Math.round(((r.storageUsedBytes || 0) / totals.maxStorage) * 100)}
            sx={{ height: 6, "& .MuiLinearProgress-bar": { background: tokens.accentGradient, borderRadius: 99 } }} />
        </Box>
      ),
    },
    { key: "lastUploadDate", label: "Last upload", sortKey: "latestUpload", render: (r) => <Typography sx={{ color: tokens.textDim, fontSize: "0.84rem" }}>{r.lastUploadDate ? timeAgo(r.lastUploadDate) : "No uploads"}</Typography> },
  ];

  return (
    <AppShell>
      <PageHeader eyebrow="Administration" title="Activity" subtitle="How storage and files break down across your users" />

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2, mb: 3 }} className="fv-rise">
        <StatCard label="Total files" value={!health ? "—" : totals.files} loading={!health} icon={<InsertDriveFileRounded />} accent="#6366f1" />
        <StatCard label="Total storage" value={!health ? "—" : formatBytes(totals.storage)} loading={!health} icon={<StorageRounded />} accent="#14b8a6" />
        <StatCard label="Users" value={loading ? "—" : totals.users} loading={loading} icon={<GroupRounded />} accent="#3b82f6" hint="registered accounts" />
      </Box>

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        getRowKey={(r) => r.userId}
        searchable
        searchPlaceholder="Search users…"
        searchValue={search}
        onSearchChange={setSearch}
        sortField={sort.field}
        sortDirection={sort.direction}
        onSortChange={handleSort}
        serverMode
        empty={null}
      />
      <Pagination {...meta} onPageChange={goToPage} />
    </AppShell>
  );
}
