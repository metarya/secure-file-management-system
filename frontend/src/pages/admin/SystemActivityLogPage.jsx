import { useCallback, useState } from "react";
import { Box, Typography, Avatar, Chip } from "@mui/material";

import AppShell from "../../components/ui/AppShell";
import PageHeader from "../../components/ui/PageHeader";
import DataTable from "../../components/ui/DataTable";
import Pagination from "../../components/ui/Pagination";
import StatusChip from "../../components/ui/StatusChip";
import { useToast } from "../../components/ui/Toast";
import usePaginatedQuery from "../../hooks/usePaginatedQuery";
import ActivityDetailDialog from "../../components/admin/ActivityDetailDialog";
import { tokens } from "../../theme/theme";
import { formatDate, initials, avatarColor } from "../../utils/format";
import { getActivityLogs } from "../../api/adminApi";

// Theme-aware action colours, mirrored from the audit-log palette so the two
// admin views read consistently in both light and dark.
function actionStyle(action = "") {
  const a = action.toUpperCase();
  const isDark = document.documentElement.getAttribute("data-theme") !== "light";

  if (a.includes("FAIL") || a.includes("DELETE") || a.includes("DISABLED")) return isDark
    ? { bg: "rgba(248,113,113,0.18)", fg: "#fca5a5", border: "rgba(248,113,113,0.35)" }
    : { bg: "rgba(220,38,38,0.10)", fg: "#b91c1c", border: "rgba(220,38,38,0.30)" };

  if (a.includes("ROLE") || a.includes("PERMISSION") || a.includes("SHARE")) return isDark
    ? { bg: "rgba(129,140,248,0.18)", fg: "#a5b4fc", border: "rgba(129,140,248,0.35)" }
    : { bg: "rgba(79,70,229,0.10)", fg: "#3730a3", border: "rgba(79,70,229,0.30)" };

  if (a.includes("RESTORE") || a.includes("ENABLED") || a.includes("CREATED") || a.includes("UPLOAD") || a === "LOGIN") return isDark
    ? { bg: "rgba(52,211,153,0.16)", fg: "#6ee7b7", border: "rgba(52,211,153,0.30)" }
    : { bg: "rgba(5,150,105,0.10)", fg: "#065f46", border: "rgba(5,150,105,0.28)" };

  if (a.includes("EDIT") || a.includes("RESET") || a.includes("PREVIEW") || a.includes("DOWNLOAD")) return isDark
    ? { bg: "rgba(251,191,36,0.16)", fg: "#fcd34d", border: "rgba(251,191,36,0.30)" }
    : { bg: "rgba(217,119,6,0.10)", fg: "#92400e", border: "rgba(217,119,6,0.28)" };

  return isDark
    ? { bg: "rgba(255,255,255,0.07)", fg: "#cbd5e1", border: "rgba(255,255,255,0.12)" }
    : { bg: "rgba(15,23,42,0.07)", fg: "#334155", border: "rgba(15,23,42,0.18)" };
}

export default function SystemActivityLogPage() {
  const toast = useToast();

  // Server-side pagination + sort + search. Default: newest events first,
  // 10 records per page — reusing the shared paginated-query infrastructure.
  const fetchLogs = useCallback((params) => getActivityLogs(params), []);
  const {
    rows: logs, meta, loading,
    sort, search, handleSort, setSearch, goToPage,
  } = usePaginatedQuery(fetchLogs, {
    initialSort: "timestamp",
    initialDirection: "desc",
    size: 10,
    onError: (e) => toast(e.message || "Couldn't load system activity.", "error"),
  });

  const [selectedId, setSelectedId] = useState(null);

  const columns = [
    {
      key: "timestamp", label: "Timestamp", width: 190, sortKey: "timestamp",
      render: (l) => <Typography className="tnum" sx={{ color: tokens.textFaint, fontSize: "0.82rem" }}>{formatDate(l.timestamp)}</Typography>,
    },
    {
      key: "user", label: "User", sortKey: "actorName",
      render: (l) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <Avatar sx={{ width: 30, height: 30, bgcolor: avatarColor(l.actorEmail || ""), fontSize: "0.72rem", fontWeight: 700 }}>
            {initials(l.actorName, l.actorEmail)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography noWrap sx={{ color: tokens.text, fontWeight: 600, fontSize: "0.85rem" }}>{l.actorName || l.actorEmail || "—"}</Typography>
            {l.actorName && l.actorEmail && (
              <Typography noWrap sx={{ color: tokens.textFaint, fontSize: "0.74rem" }}>{l.actorEmail}</Typography>
            )}
          </Box>
        </Box>
      ),
    },
    {
      key: "action", label: "Action", width: 180, sortKey: "action",
      render: (l) => {
        const s = actionStyle(l.action);
        return (
          <Chip
            label={(l.action || "—").replace(/_/g, " ")}
            size="small"
            sx={{ bgcolor: s.bg, color: s.fg, border: `1px solid ${s.border}`, fontWeight: 700, fontSize: "0.68rem", letterSpacing: "0.02em" }}
          />
        );
      },
    },
    {
      key: "resource", label: "Resource", sortKey: "resourceName",
      render: (l) => (
        <Box sx={{ minWidth: 0 }}>
          <Typography noWrap sx={{ color: tokens.text, fontSize: "0.85rem" }}>{l.resourceName || "—"}</Typography>
          {l.resourceType && (
            <Typography noWrap sx={{ color: tokens.textFaint, fontSize: "0.72rem", letterSpacing: "0.04em" }}>{l.resourceType}</Typography>
          )}
        </Box>
      ),
    },
    {
      key: "status", label: "Status", width: 120, sortKey: "status",
      render: (l) => <StatusChip value={l.status} />,
    },
  ];

  return (
    <AppShell>
      <PageHeader
        eyebrow="Administration"
        title="Activity Logs"
        subtitle={loading ? "Loading…" : `${meta.totalElements} recorded event${meta.totalElements === 1 ? "" : "s"} across all users`}
      />
      <DataTable
        columns={columns}
        rows={logs}
        loading={loading}
        getRowKey={(l) => l.id}
        searchable
        searchPlaceholder="Search users, actions, resources, or status…"
        searchValue={search}
        onSearchChange={setSearch}
        sortField={sort.field}
        sortDirection={sort.direction}
        onSortChange={handleSort}
        onRowClick={(l) => setSelectedId(l.id)}
        serverMode
        empty={null}
      />
      <Pagination {...meta} onPageChange={goToPage} />

      <ActivityDetailDialog
        id={selectedId}
        open={selectedId != null}
        onClose={() => setSelectedId(null)}
      />
    </AppShell>
  );
}
