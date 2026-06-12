import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Avatar, IconButton, Menu, MenuItem, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, ToggleButtonGroup, ToggleButton, Tooltip,
} from "@mui/material";
import MoreVertRounded from "@mui/icons-material/MoreVertRounded";
import AdminPanelSettingsRounded from "@mui/icons-material/AdminPanelSettingsRounded";
import BlockRounded from "@mui/icons-material/BlockRounded";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import LockResetRounded from "@mui/icons-material/LockResetRounded";
import TuneRounded from "@mui/icons-material/TuneRounded";
import ContentCopyRounded from "@mui/icons-material/ContentCopyRounded";
import RefreshRounded from "@mui/icons-material/RefreshRounded";

import AppShell from "../../components/ui/AppShell";
import PageHeader from "../../components/ui/PageHeader";
import DataTable from "../../components/ui/DataTable";
import StatusChip from "../../components/ui/StatusChip";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";
import { tokens } from "../../theme/theme";
import { initials, avatarColor, formatDateShort } from "../../utils/format";
import { getAllUsers, updateUserRole, updateUserStatus, resetUserPassword } from "../../api/adminApi";
import { getMyPermissions } from "../../api/rbacApi";
import { loadStoredUser, storeUser } from "../../utils/auth";

export default function UserManagementPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [perms, setPerms] = useState([]);

  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuUser, setMenuUser] = useState(null);

  const [roleDialog, setRoleDialog] = useState(null);
  const [roleDraft, setRoleDraft] = useState("USER");
  const [statusDialog, setStatusDialog] = useState(null);
  const [busy, setBusy] = useState(false);
  const [tempPassword, setTempPassword] = useState(null);

  const can = (code) => perms.length === 0 || perms.includes(code);

  const fetchUsers = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await getAllUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      toast(e.message || "Couldn't load users.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => {
    fetchUsers();
    getMyPermissions().then((p) => setPerms(Array.isArray(p) ? p : [])).catch(() => {});
  }, [fetchUsers]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return users.filter((u) => (u.fullName || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q));
  }, [users, query]);

  function openMenu(e, u) { setMenuAnchor(e.currentTarget); setMenuUser(u); }
  function closeMenu() { setMenuAnchor(null); setMenuUser(null); }

  async function confirmRole() {
    setBusy(true);
    try {
      await updateUserRole(roleDialog.id, roleDraft);
      toast(`Role updated to ${roleDraft}.`, "success");
      setRoleDialog(null);

      // If the changed user is the currently logged-in user, update their
      // localStorage immediately so their session reflects the new role
      // without needing a logout/login cycle.
      const me = loadStoredUser();
      if (String(me?.userId) === String(roleDialog.id)) {
        storeUser({ ...me, role: roleDraft });
        // If they were just demoted from ADMIN, redirect them out of admin panel
        if (roleDraft !== "ADMIN") {
          navigate("/dashboard", { replace: true });
          return;
        }
      }

      await fetchUsers(true);
    } catch (e) {
      toast(e.message || "Couldn't update the role.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function confirmStatus() {
    const next = statusDialog.status === "ACTIVE" ? "BLOCKED" : "ACTIVE";
    setBusy(true);
    try {
      await updateUserStatus(statusDialog.id, next);
      toast(`User ${next === "BLOCKED" ? "blocked" : "unblocked"}.`, "success");
      setStatusDialog(null);
      // Re-fetch from server immediately to confirm the real saved state
      await fetchUsers(true);
    } catch (e) {
      toast(e.message || "Couldn't update status.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleResetPassword(u) {
    closeMenu();
    try {
      const res = await resetUserPassword(u.email);
      setTempPassword({ email: res?.email || u.email, password: res?.temporaryPassword });
    } catch (e) {
      toast(e.message || "Couldn't reset the password.", "error");
    }
  }

  const columns = [
    {
      key: "user", label: "User",
      render: (u) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: avatarColor(u.email), fontSize: "0.8rem", fontWeight: 700 }}>{initials(u.fullName, u.email)}</Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography noWrap sx={{ color: tokens.text, fontWeight: 600, fontSize: "0.9rem" }}>{u.fullName || "—"}</Typography>
            <Typography noWrap sx={{ color: tokens.textFaint, fontSize: "0.78rem" }}>{u.email}</Typography>
          </Box>
        </Box>
      ),
    },
    { key: "role", label: "Role", render: (u) => <StatusChip value={u.role} /> },
    { key: "status", label: "Status", render: (u) => <StatusChip value={u.status} /> },
    { key: "createdAt", label: "Joined", render: (u) => <Typography sx={{ color: tokens.textDim, fontSize: "0.85rem" }}>{formatDateShort(u.createdAt)}</Typography> },
    {
      key: "actions", label: "", align: "right", width: 56,
      render: (u) => (
        <IconButton size="small" onClick={(e) => openMenu(e, u)} sx={{ color: tokens.textFaint }}><MoreVertRounded fontSize="small" /></IconButton>
      ),
    },
  ];

  const refreshButton = (
    <Tooltip title="Refresh table">
      <IconButton
        onClick={() => fetchUsers(true)}
        disabled={refreshing || loading}
        sx={{
          color: tokens.textDim,
          border: `1px solid ${tokens.border}`,
          borderRadius: "10px",
          "&:hover": { borderColor: tokens.borderStrong, color: tokens.text },
          animation: refreshing ? "spin 0.7s linear infinite" : "none",
          "@keyframes spin": { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } },
        }}
      >
        <RefreshRounded fontSize="small" />
      </IconButton>
    </Tooltip>
  );

  return (
    <AppShell>
      <PageHeader
        eyebrow="Administration" title="Users"
        subtitle={loading ? "Loading…" : `${users.length} registered ${users.length === 1 ? "account" : "accounts"}`}
        actions={refreshButton}
      />

      <DataTable
        columns={columns}
        rows={filtered}
        loading={loading}
        getRowKey={(u) => u.id}
        searchable
        searchPlaceholder="Search by name or email…"
        searchValue={query}
        onSearchChange={setQuery}
        empty={null}
      />

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}
        transformOrigin={{ horizontal: "right", vertical: "top" }} anchorOrigin={{ horizontal: "right", vertical: "bottom" }}>
        {can("USER:ROLE_ASSIGN") && (
          <MenuItem onClick={() => { setRoleDialog(menuUser); setRoleDraft(menuUser?.role === "ADMIN" ? "ADMIN" : "USER"); closeMenu(); }} sx={{ gap: 1.25, fontSize: "0.86rem" }}>
            <AdminPanelSettingsRounded fontSize="small" /> Change role
          </MenuItem>
        )}
        {can("USER:ROLE_ASSIGN") && (
          <MenuItem onClick={() => { const id = menuUser?.id; closeMenu(); navigate(`/admin/permissions?userId=${id}`); }} sx={{ gap: 1.25, fontSize: "0.86rem" }}>
            <TuneRounded fontSize="small" /> Manage permissions
          </MenuItem>
        )}
        {can("USER:DISABLE") && (
          <MenuItem onClick={() => { setStatusDialog(menuUser); closeMenu(); }} sx={{ gap: 1.25, fontSize: "0.86rem", color: menuUser?.status === "ACTIVE" ? tokens.danger : tokens.success }}>
            {menuUser?.status === "ACTIVE" ? <><BlockRounded fontSize="small" /> Block user</> : <><CheckCircleRounded fontSize="small" /> Unblock user</>}
          </MenuItem>
        )}
        {can("USER:RESET_PASSWORD") && (
          <MenuItem onClick={() => handleResetPassword(menuUser)} sx={{ gap: 1.25, fontSize: "0.86rem" }}>
            <LockResetRounded fontSize="small" /> Reset password
          </MenuItem>
        )}
      </Menu>

      {/* Change role */}
      <Dialog open={Boolean(roleDialog)} onClose={busy ? undefined : () => setRoleDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Change role</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: tokens.textDim, fontSize: "0.88rem", mb: 2.5 }}>
            Set the role for <Box component="span" sx={{ color: tokens.text, fontWeight: 600 }}>{roleDialog?.fullName || roleDialog?.email}</Box>.
          </Typography>
          <ToggleButtonGroup exclusive fullWidth value={roleDraft} onChange={(_e, v) => v && setRoleDraft(v)}
            sx={{ "& .MuiToggleButton-root": { textTransform: "none", borderColor: tokens.border, color: tokens.textDim, py: 1.25 }, "& .Mui-selected": { background: "rgba(129,140,248,0.16) !important", color: `${tokens.accent} !important` } }}>
            <ToggleButton value="USER">Member</ToggleButton>
            <ToggleButton value="ADMIN">Administrator</ToggleButton>
          </ToggleButtonGroup>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button variant="outlined" onClick={() => setRoleDialog(null)} disabled={busy}>Cancel</Button>
          <Button variant="contained" onClick={confirmRole} disabled={busy}>{busy ? "Saving…" : "Save role"}</Button>
        </DialogActions>
      </Dialog>

      {/* Block / unblock */}
      <ConfirmDialog
        open={Boolean(statusDialog)}
        title={statusDialog?.status === "ACTIVE" ? "Block user" : "Unblock user"}
        message={statusDialog?.status === "ACTIVE"
          ? `${statusDialog?.fullName || statusDialog?.email} won't be able to sign in until unblocked.`
          : `${statusDialog?.fullName || statusDialog?.email} will regain access to their account.`}
        confirmLabel={statusDialog?.status === "ACTIVE" ? "Block" : "Unblock"}
        destructive={statusDialog?.status === "ACTIVE"}
        loading={busy}
        icon={statusDialog?.status === "ACTIVE" ? <BlockRounded /> : <CheckCircleRounded />}
        onConfirm={confirmStatus}
        onClose={() => setStatusDialog(null)}
      />

      {/* Temporary password reveal */}
      <Dialog open={Boolean(tempPassword)} onClose={() => setTempPassword(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Temporary password</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: tokens.textDim, fontSize: "0.88rem", mb: 2 }}>
            Share this one-time password with <Box component="span" sx={{ color: tokens.text, fontWeight: 600 }}>{tempPassword?.email}</Box>. They should change it after signing in.
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, p: 1.5, borderRadius: "12px", border: `1px solid ${tokens.border}`, background: "rgba(255,255,255,0.03)" }}>
            <Typography className="tnum" sx={{ color: tokens.text, fontWeight: 700, fontSize: "1rem", letterSpacing: "0.04em", wordBreak: "break-all" }}>
              {tempPassword?.password || "—"}
            </Typography>
            <IconButton size="small" onClick={() => { navigator.clipboard?.writeText(tempPassword?.password || ""); toast("Copied to clipboard.", "success"); }} sx={{ color: tokens.accent }}>
              <ContentCopyRounded fontSize="small" />
            </IconButton>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button variant="contained" onClick={() => setTempPassword(null)}>Done</Button>
        </DialogActions>
      </Dialog>
    </AppShell>
  );
}
