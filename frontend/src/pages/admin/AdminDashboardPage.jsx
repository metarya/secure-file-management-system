import { useEffect, useState } from "react";
import { Box, Paper, Typography, LinearProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import PeopleRounded from "@mui/icons-material/PeopleRounded";
import InsertDriveFileRounded from "@mui/icons-material/InsertDriveFileRounded";
import StorageRounded from "@mui/icons-material/StorageRounded";
import VerifiedUserRounded from "@mui/icons-material/VerifiedUserRounded";

import AppShell from "../../components/ui/AppShell";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import { useToast } from "../../components/ui/Toast";
import { tokens } from "../../theme/theme";
import { loadStoredUser } from "../../utils/auth";
import { formatBytes } from "../../utils/format";
import { getAdminStats, getFileStats, getSystemHealth } from "../../api/adminApi";

function Bar({ label, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.6 }}>
        <Typography sx={{ color: tokens.textDim, fontSize: "0.85rem" }}>{label}</Typography>
        <Typography className="tnum" sx={{ color: tokens.text, fontSize: "0.85rem", fontWeight: 600 }}>{value} · {pct}%</Typography>
      </Box>
      <LinearProgress variant="determinate" value={pct} sx={{ "& .MuiLinearProgress-bar": { background: color, borderRadius: 99 } }} />
    </Box>
  );
}

export default function AdminDashboardPage() {
  const user = loadStoredUser();
  const toast = useToast();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [fileStats, setFileStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, f, h] = await Promise.all([getAdminStats(), getFileStats(), getSystemHealth()]);
        setStats(s); setFileStats(f); setHealth(h);
      } catch (e) {
        toast(e.message || "Couldn't load dashboard data.", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Administration"
        title={`Welcome back, ${user?.fullName?.split(" ")[0] || "Admin"}`}
        subtitle="System overview and health at a glance"
      />

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2, mb: 3 }} className="fv-rise">
        <StatCard
          label="Total users" value={stats?.totalUsers ?? "—"} loading={loading}
          icon={<PeopleRounded />} accent="#6366f1"
          hint={`${stats?.totalAdmins ?? 0} admins · ${stats?.totalRegularUsers ?? 0} members`}
          onClick={() => navigate("/admin/users")}
        />
        <StatCard
          label="Files" value={fileStats?.totalFiles ?? "—"} loading={loading}
          icon={<InsertDriveFileRounded />} accent="#3b82f6"
          hint={`${fileStats?.publicFiles ?? 0} public · ${fileStats?.privateFiles ?? 0} private`}
          onClick={() => navigate("/admin/files")}
        />
        <StatCard
          label="Storage used" value={loading ? "—" : formatBytes(fileStats?.totalStorageBytes)}
          loading={loading} icon={<StorageRounded />} accent="#14b8a6"
        />
        <StatCard
          label="Active users" value={health?.activeUsers ?? "—"} loading={loading}
          icon={<VerifiedUserRounded />} accent="#22c55e"
          hint={`${health?.blockedUsers ?? 0} blocked`}
          onClick={() => navigate("/admin/users")}
        />
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
        <Paper sx={{ p: 3, borderRadius: "18px" }}>
          <Typography variant="h6" sx={{ color: tokens.text, mb: 2.5 }}>People</Typography>
          <Bar label="Active accounts" value={health?.activeUsers ?? 0} total={health?.totalUsers ?? 0} color={tokens.success} />
          <Bar label="Blocked accounts" value={health?.blockedUsers ?? 0} total={health?.totalUsers ?? 0} color={tokens.danger} />
          <Bar label="Administrators" value={stats?.totalAdmins ?? 0} total={stats?.totalUsers ?? 0} color={tokens.accent} />
        </Paper>

        <Paper sx={{ p: 3, borderRadius: "18px" }}>
          <Typography variant="h6" sx={{ color: tokens.text, mb: 2.5 }}>Files & storage</Typography>
          <Bar label="Public files" value={fileStats?.publicFiles ?? 0} total={fileStats?.totalFiles ?? 0} color={tokens.success} />
          <Bar label="Private files" value={fileStats?.privateFiles ?? 0} total={fileStats?.totalFiles ?? 0} color={tokens.info} />
          <Box sx={{ mt: 3, pt: 2.5, borderTop: `1px solid ${tokens.border}`, display: "flex", justifyContent: "space-between" }}>
            <Typography sx={{ color: tokens.textDim, fontSize: "0.9rem" }}>Total storage</Typography>
            <Typography className="tnum" sx={{ color: tokens.text, fontWeight: 700 }}>
              {loading ? "—" : formatBytes(fileStats?.totalStorageBytes)}
            </Typography>
          </Box>
        </Paper>
      </Box>
    </AppShell>
  );
}
