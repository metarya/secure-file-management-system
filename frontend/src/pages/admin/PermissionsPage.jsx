import { useEffect, useMemo, useState } from "react";
import { Box, Paper, Typography, Chip, Select, MenuItem, FormControl, CircularProgress, Avatar } from "@mui/material";
import ShieldRounded from "@mui/icons-material/ShieldRounded";
import PersonSearchRounded from "@mui/icons-material/PersonSearchRounded";

import AppShell from "../../components/ui/AppShell";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";
import { useToast } from "../../components/ui/Toast";
import { tokens } from "../../theme/theme";
import { initials, avatarColor } from "../../utils/format";
import { getMyPermissions, getUserPermissions } from "../../api/rbacApi";
import { getAllUsers } from "../../api/adminApi";

// Friendly descriptions for known permission codes.
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

function PermissionChip({ code }) {
  return (
    <Chip
      label={code}
      title={DESCRIPTIONS[code] || code}
      sx={{ bgcolor: "rgba(129,140,248,0.12)", color: "#c7d2fe", border: "1px solid rgba(129,140,248,0.3)", fontWeight: 600, fontFamily: tokens.display, fontSize: "0.74rem", mb: 1, mr: 1 }}
    />
  );
}

export default function PermissionsPage() {
  const toast = useToast();
  const [myPerms, setMyPerms] = useState([]);
  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [userPerms, setUserPerms] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [mine, allUsers] = await Promise.all([getMyPermissions(), getAllUsers().catch(() => [])]);
        setMyPerms(Array.isArray(mine) ? mine : []);
        setUsers(Array.isArray(allUsers) ? allUsers : []);
      } catch (e) {
        toast(e.message || "Couldn't load permissions.", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  async function handleSelect(id) {
    setSelectedId(id);
    setUserPerms(null);
    if (!id) return;
    setLookupLoading(true);
    try {
      const data = await getUserPermissions(id);
      setUserPerms(Array.isArray(data) ? data : []);
    } catch (e) {
      toast(e.message || "Couldn't load that user's permissions.", "error");
    } finally {
      setLookupLoading(false);
    }
  }

  const myGroups = useMemo(() => groupByResource(myPerms), [myPerms]);
  const userGroups = useMemo(() => (userPerms ? groupByResource(userPerms) : {}), [userPerms]);
  const selectedUser = users.find((u) => String(u.id) === String(selectedId));

  return (
    <AppShell>
      <PageHeader eyebrow="Administration" title="Permissions" subtitle="Role-based access control across the system" />

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
        {/* Your access */}
        <Paper sx={{ p: 3, borderRadius: "18px" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 2.5 }}>
            <Box sx={{ width: 38, height: 38, borderRadius: "11px", display: "grid", placeItems: "center", background: "rgba(129,140,248,0.16)", color: tokens.accent }}><ShieldRounded sx={{ fontSize: 20 }} /></Box>
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

        {/* Inspect a user */}
        <Paper sx={{ p: 3, borderRadius: "18px" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 2.5 }}>
            <Box sx={{ width: 38, height: 38, borderRadius: "11px", display: "grid", placeItems: "center", background: "rgba(56,189,248,0.14)", color: tokens.info }}><PersonSearchRounded sx={{ fontSize: 20 }} /></Box>
            <Box>
              <Typography variant="h6" sx={{ color: tokens.text, lineHeight: 1.1 }}>Inspect a user</Typography>
              <Typography sx={{ color: tokens.textFaint, fontSize: "0.8rem" }}>See what another account can do</Typography>
            </Box>
          </Box>

          <FormControl fullWidth size="small" sx={{ mb: 2.5 }}>
            <Select
              displayEmpty value={selectedId} onChange={(e) => handleSelect(e.target.value)}
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
            <EmptyState title="No user selected" description="Pick a user above to view their effective permissions." />
          ) : (
            <>
              {selectedUser && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 2, p: 1.5, borderRadius: "12px", border: `1px solid ${tokens.border}`, background: "rgba(255,255,255,0.02)" }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: avatarColor(selectedUser.email), fontSize: "0.74rem", fontWeight: 700 }}>{initials(selectedUser.fullName, selectedUser.email)}</Avatar>
                  <Box>
                    <Typography sx={{ color: tokens.text, fontWeight: 600, fontSize: "0.86rem" }}>{selectedUser.fullName}</Typography>
                    <Typography sx={{ color: tokens.textFaint, fontSize: "0.76rem" }}>{selectedUser.role} · {selectedUser.email}</Typography>
                  </Box>
                </Box>
              )}
              {userPerms && userPerms.length === 0 ? (
                <Typography sx={{ color: tokens.textFaint, fontSize: "0.88rem" }}>This user has no special permissions.</Typography>
              ) : (
                Object.entries(userGroups).map(([resource, codes]) => (
                  <Box key={resource} sx={{ mb: 2 }}>
                    <Typography sx={{ color: tokens.textFaint, fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", mb: 1 }}>{resource}</Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap" }}>{codes.map((c) => <PermissionChip key={c} code={c} />)}</Box>
                  </Box>
                ))
              )}
            </>
          )}
        </Paper>
      </Box>
    </AppShell>
  );
}
