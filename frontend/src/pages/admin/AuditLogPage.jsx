import { useEffect, useState, useMemo } from "react";
import { Box, Typography, Chip } from "@mui/material";
import AppShell from "../../components/ui/AppShell";
import PageHeader from "../../components/ui/PageHeader";
import DataTable from "../../components/ui/DataTable";
import { useToast } from "../../components/ui/Toast";
import { tokens } from "../../theme/theme";
import { formatDate } from "../../utils/format";
import { getAuditLogs } from "../../api/adminApi";

// Colour-code actions by what they touch.
function actionStyle(action = "") {
  const a = action.toUpperCase();
  if (a.includes("DELETE") || a.includes("BLOCK")) return { bg: "rgba(248,113,113,0.14)", fg: "#fca5a5" };
  if (a.includes("ROLE") || a.includes("PERMISSION")) return { bg: "rgba(129,140,248,0.16)", fg: "#a5b4fc" };
  if (a.includes("RESTORE") || a.includes("ACTIVE") || a.includes("CREATE") || a.includes("UPLOAD")) return { bg: "rgba(52,211,153,0.14)", fg: "#6ee7b7" };
  if (a.includes("STATUS") || a.includes("UPDATE") || a.includes("RESET")) return { bg: "rgba(251,191,36,0.14)", fg: "#fcd34d" };
  return { bg: "rgba(255,255,255,0.06)", fg: "#cbd5e1" };
}

export default function AuditLogPage() {
  const toast = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await getAuditLogs();
        const list = Array.isArray(data) ? data : [];
        // newest first
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setLogs(list);
      } catch (e) {
        toast(e.message || "Couldn't load audit logs.", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return logs.filter((l) =>
      (l.action || "").toLowerCase().includes(q) ||
      (l.performedBy || "").toLowerCase().includes(q) ||
      (l.details || "").toLowerCase().includes(q));
  }, [logs, query]);

  const columns = [
    {
      key: "action", label: "Action", width: 200,
      render: (l) => {
        const s = actionStyle(l.action);
        return <Chip label={(l.action || "—").replace(/_/g, " ")} size="small" sx={{ bgcolor: s.bg, color: s.fg, fontWeight: 700, fontSize: "0.7rem", letterSpacing: "0.02em" }} />;
      },
    },
    { key: "performedBy", label: "By", render: (l) => <Typography sx={{ color: tokens.text, fontSize: "0.85rem", fontWeight: 500 }}>{l.performedBy || "—"}</Typography> },
    { key: "details", label: "Details", render: (l) => <Typography sx={{ color: tokens.textDim, fontSize: "0.85rem" }}>{l.details || "—"}</Typography> },
    { key: "createdAt", label: "When", width: 190, render: (l) => <Typography className="tnum" sx={{ color: tokens.textFaint, fontSize: "0.82rem" }}>{formatDate(l.createdAt)}</Typography> },
  ];

  return (
    <AppShell>
      <PageHeader eyebrow="Administration" title="Audit Log" subtitle={loading ? "Loading…" : `${logs.length} recorded event${logs.length === 1 ? "" : "s"}`} />
      <DataTable
        columns={columns}
        rows={filtered}
        loading={loading}
        getRowKey={(l) => l.id}
        searchable
        searchPlaceholder="Search actions, users, or details…"
        searchValue={query}
        onSearchChange={setQuery}
        empty={null}
      />
    </AppShell>
  );
}
