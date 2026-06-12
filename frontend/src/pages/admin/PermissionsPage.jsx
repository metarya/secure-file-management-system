import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Box, Paper, Typography, Chip, Select, MenuItem, FormControl, CircularProgress,
  Avatar, Switch, Button, Divider, Tooltip,
} from "@mui/material";
import ShieldRounded from "@mui/icons-material/ShieldRounded";
import PersonSearchRounded from "@mui/icons-material/PersonSearchRounded";
import LockRounded from "@mui/icons-material/LockRounded";
import SaveRounded from "@mui/icons-material/SaveRounded";

import AppShell from "../../components/ui/AppShell";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";
import { useToast } from "../../components/ui/Toast";
import { tokens } from "../../theme/theme";
import { initials, avatarColor } from "../../utils/format";
import { getMyPermissions } from "../../api/rbacApi";
import {
  getAllUsers, getPermissionCatalog, getUserPermissionsDetail, updateUserPermissions,
} from "../../api/adminApi";

const DESCRIPTIONS = {
  "USER:VIEW": "View users and their details",
  "USER:ROLE_ASSIGN": "Assign roles to users",
  "USER:DISABLE": "Block or unblock accounts",
  "USER:RESET_PASSWORD": "Issue temporary passwords",
  "FILE:VIEW_ANY": "View any user's files",
  "FILE:DELETE_ANY": "Delete any user's files",
  "FILE:RESTORE": "Restore deleted files",
};

function groupByResource(codes) {
  const groups = {};
  codes.forEach((code) => {
    const [resource] = code.split(":");
    (groups[resource] = groups[resource] || []).push(code);
  });
  return groups;
}

const sameSet = (a, b) => a.size === b.size && [...a].every((x) => b.has(x));

// Chip colour is theme-aware: dark purple text on light bg, soft lavender on dark bg.
function PermissionChip({ code }) {
  const isDark = document.documentElement.getAttribute("data-theme") !== "light";
  const chipSx = isDark
    ? { bgcolor: "rgba(129,140,248,0.14)", color: "#c7d2fe", border: "1px solid rgba(129,140,248,0.32)" }
    : { bgcolor: "rgba(79,70,229,0.10)", color: "#3730a3", border: "1px solid rgba(79,70,229,0.28)" };

  return (
    <Chip
      label={code}
      title={DESCRIPTIONS[code] || code}
      sx={{ ...chipSx, fontWeight: 700, fontFamily: tokens.display, fontSize: "0.74rem", mb: 1, mr: 1 }}
    />
  );
}

export default function PermissionsPage() {
  const toast = useToast();
  const [searchParams] = useSearchParams();

  const [myPerms, setMyPerms] = useState([]);
  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState([]);
  const [catalog, setCatalog] = useState([]); // [{ code, description }]
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState(null); // { rolePermissions, directPermissions, effectivePermissions }
  const [selected, setSelected] = useState(new Set()); // editable direct grants
  const [lookupLoading, setLookupLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Any admin who can assign roles can manage permissions. Empty perms list =>
  // be permissive (mirrors the gating used elsewhere in the admin UI).
  const canManage = myPerms.length === 0 || myPerms.includes("USER:ROLE_ASSIGN");

  useEffect(() => {
    (async () => {
      try {
        const [mine, allUsers, cat] = await Promise.all([
          getMyPermissions(),
          getAllUsers().catch(() => []),
          getPermissionCatalog().catch(() => []),
        ]);
        setMyPerms(Array.isArray(mine) ? mine : []);
        setUsers(Array.isArray(allUsers) ? allUsers : []);
        setCatalog(Array.isArray(cat) ? cat : []);

        // Deep-link support: /admin/permissions?userId=123 preselects a user.
        const preselect = searchParams.get("userId");
        if (preselect) loadUser(preselect);
      } catch (e) {
        toast(e.message || "Couldn't load permissions.", "error");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadUser(id) {
    setSelectedId(String(id));
    setDetail(null);
    setSelected(new Set());
    if (!id) return;
    setLookupLoading(true);
    try {
      const data = await getUserPermissionsDetail(id);
      const direct = Array.isArray(data?.directPermissions) ? data.directPermissions : [];
      setDetail({
        rolePermissions: Array.isArray(data?.rolePermissions) ? data.rolePermissions : [],
        directPermissions: direct,
        effectivePermissions: Array.isArray(data?.effectivePermissions) ? data.effectivePermissions : [],
      });
      setSelected(new Set(direct));
    } catch (e) {
      toast(e.message || "Couldn't load that user's permissions.", "error");
    } finally {
      setLookupLoading(false);
    }
  }

  function toggle(code) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  async function save() {
    if (!selectedId) return;
    setSaving(true);
    try {
      await updateUserPermissions(selectedId, [...selected]);
      toast("Permissions updated.", "success");
      await loadUser(selectedId); // refresh from server to confirm the saved state
    } catch (e) {
      toast(e.message || "Couldn't update permissions.", "error");
    } finally {
      setSaving(false);
    }
  }

  const myGroups = useMemo(() => groupByResource(myPerms), [myPerms]);

  // Every known permission code: prefer the server catalog, fall back to the
  // built-in descriptions so the UI still works if the catalog call is empty.
  const allCodes = useMemo(() => {
    if (catalog.length) return catalog.map((c) => c.code);
    return Object.keys(DESCRIPTIONS);
  }, [catalog]);
  const descFor = (code) =>
    catalog.find((c) => c.code === code)?.description || DESCRIPTIONS[code] || code;
  const catalogGroups = useMemo(() => groupByResource(allCodes), [allCodes]);

  const roleSet = useMemo(
    () => new Set(detail?.rolePermissions || []),
    [detail]
  );
  const dirty = useMemo(
    () => detail && !sameSet(selected, new Set(detail.directPermissions)),
    [selected, detail]
  );

  const selectedUser = users.find((u) => String(u.id) === String(selectedId));

  const isDark = document.documentElement.getAttribute("data-theme") !== "light";
  const iconBg = isDark ? "rgba(129,140,248,0.16)" : "rgba(79,70,229,0.12)";
  const infoBg = isDark ? "rgba(56,189,248,0.14)" : "rgba(2,132,199,0.10)";

  return (
    <AppShell>
      <PageHeader eyebrow="Administration" title="Permissions" subtitle="Role-based access control across the system" />

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
        {/* Your access */}
        <Paper sx={{ p: 3, borderRadius: "18px" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 2.5 }}>
            <Box sx={{ width: 38, height: 38, borderRadius: "11px", display: "grid", placeItems: "center", background: iconBg, color: tokens.accent }}>
              <ShieldRounded sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ color: tokens.text, lineHeight: 1.1 }}>Your access</Typography>
              <Typography sx={{ color: tokens.textFaint, fontSize: "0.8rem" }}>Authorities granted to your session</Typography>
            </Box>
          </Box>

          {loading ? (
            <Box sx={{ display: "grid", placeItems: "center", py: 4 }}><CircularProgress size={24} /></Box>
          ) : myPerms.length === 0 ? (
            <Typography sx={{ color: tokens.textFaint, fontSize: "0.88rem" }}>No special permissions on this account.</Typography>
          ) : (
            Object.entries(myGroups).map(([resource, codes]) => (
              <Box key={resource} sx={{ mb: 2 }}>
                <Typography sx={{ color: tokens.textFaint, fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", mb: 1 }}>{resource}</Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap" }}>{codes.map((c) => <PermissionChip key={c} code={c} />)}</Box>
              </Box>
            ))
          )}
        </Paper>

        {/* Manage a user's permissions */}
        <Paper sx={{ p: 3, borderRadius: "18px" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 2.5 }}>
            <Box sx={{ width: 38, height: 38, borderRadius: "11px", display: "grid", placeItems: "center", background: infoBg, color: tokens.info }}>
              <PersonSearchRounded sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ color: tokens.text, lineHeight: 1.1 }}>Manage user permissions</Typography>
              <Typography sx={{ color: tokens.textFaint, fontSize: "0.8rem" }}>Grant or revoke access for a single account</Typography>
            </Box>
          </Box>

          <FormControl fullWidth size="small" sx={{ mb: 2.5 }}>
            <Select
              displayEmpty value={selectedId} onChange={(e) => loadUser(e.target.value)}
              renderValue={(v) => {
                if (!v) return <Typography sx={{ color: tokens.textFaint }}>Choose a user…</Typography>;
                const u = users.find((x) => String(x.id) === String(v));
                return u ? `${u.fullName} · ${u.email}` : v;
              }}
            >
              <MenuItem value=""><em>Choose a user…</em></MenuItem>
              {users.map((u) => <MenuItem key={u.id} value={u.id}>{u.fullName} · {u.email}</MenuItem>)}
            </Select>
          </FormControl>

          {lookupLoading ? (
            <Box sx={{ display: "grid", placeItems: "center", py: 4 }}><CircularProgress size={24} /></Box>
          ) : !selectedId ? (
            <EmptyState title="No user selected" description="Pick a user above to view and edit their permissions." />
          ) : (
            <>
              {selectedUser && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 2, p: 1.5, borderRadius: "12px", border: `1px solid ${tokens.border}`, background: tokens.surface }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: avatarColor(selectedUser.email), fontSize: "0.74rem", fontWeight: 700 }}>{initials(selectedUser.fullName, selectedUser.email)}</Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography noWrap sx={{ color: tokens.text, fontWeight: 600, fontSize: "0.86rem" }}>{selectedUser.fullName}</Typography>
                    <Typography noWrap sx={{ color: tokens.textFaint, fontSize: "0.76rem" }}>{selectedUser.role} · {selectedUser.email}</Typography>
                  </Box>
                </Box>
              )}

              <Typography sx={{ color: tokens.textFaint, fontSize: "0.78rem", mb: 2 }}>
                Toggles control permissions granted <b>directly</b> to this user. Greyed-out rows with a lock are inherited from their role — change the role to adjust those.
              </Typography>

              {Object.entries(catalogGroups).map(([resource, codes]) => (
                <Box key={resource} sx={{ mb: 2 }}>
                  <Typography sx={{ color: tokens.textFaint, fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", mb: 0.5 }}>{resource}</Typography>
                  {codes.map((code) => {
                    const inherited = roleSet.has(code);
                    const checked = inherited || selected.has(code);
                    return (
                      <Box
                        key={code}
                        sx={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          gap: 1, py: 0.75, borderBottom: `1px solid ${tokens.border}`,
                          opacity: inherited ? 0.7 : 1,
                        }}
                      >
                        <Box sx={{ minWidth: 0, pr: 1 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                            <Typography sx={{ color: tokens.text, fontWeight: 600, fontSize: "0.84rem", fontFamily: tokens.display }}>{code}</Typography>
                            {inherited && (
                              <Tooltip title="Inherited from the user's role">
                                <Chip
                                  size="small" icon={<LockRounded sx={{ fontSize: "0.8rem !important" }} />} label="Role"
                                  sx={{ height: 18, fontSize: "0.62rem", fontWeight: 700, bgcolor: tokens.surfaceHover, color: tokens.textFaint, "& .MuiChip-icon": { color: tokens.textFaint, ml: "4px" } }}
                                />
                              </Tooltip>
                            )}
                          </Box>
                          <Typography sx={{ color: tokens.textFaint, fontSize: "0.74rem" }}>{descFor(code)}</Typography>
                        </Box>
                        <Switch
                          checked={checked}
                          disabled={inherited || !canManage || saving}
                          onChange={() => toggle(code)}
                          size="small"
                        />
                      </Box>
                    );
                  })}
                </Box>
              ))}

              <Divider sx={{ borderColor: tokens.border, my: 2 }} />

              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, flexWrap: "wrap" }}>
                <Typography sx={{ color: tokens.textFaint, fontSize: "0.76rem" }}>
                  {canManage
                    ? (dirty ? "Unsaved changes" : "All changes saved")
                    : "You don't have permission to edit these."}
                </Typography>
                <Button
                  variant="contained" startIcon={<SaveRounded />}
                  onClick={save} disabled={!canManage || !dirty || saving}
                >
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </Box>
            </>
          )}
        </Paper>
      </Box>
    </AppShell>
  );
}
