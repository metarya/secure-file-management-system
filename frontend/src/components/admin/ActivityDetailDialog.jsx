import { useEffect, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography,
  Button, Chip, Divider, CircularProgress, Alert,
} from "@mui/material";
import HistoryRounded from "@mui/icons-material/HistoryRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";

import StatusChip from "../ui/StatusChip";
import { tokens } from "../../theme/theme";
import { formatDate } from "../../utils/format";
import { getActivityDetail, getActivityChanges } from "../../api/adminApi";

// One label/value line in the detail grid.
function Field({ label, value, mono = false }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
      <Typography sx={{ color: tokens.textFaint, fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {label}
      </Typography>
      <Typography
        sx={{ color: tokens.text, fontSize: "0.9rem", fontWeight: 500, wordBreak: "break-word", fontFamily: mono ? "monospace" : "inherit" }}
      >
        {value === null || value === undefined || value === "" ? "—" : value}
      </Typography>
    </Box>
  );
}

/**
 * Shows the full detail for a single system-activity record and, for file-edit
 * events, a "View Changes" action that loads the recorded version references.
 *
 * Phase 1: file versioning is not yet implemented, so "View Changes" surfaces
 * the version-before / version-after references and a status message rather than
 * a rendered diff (which arrives in Phase 2).
 */
export default function ActivityDetailDialog({ id, open, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [changes, setChanges] = useState(null);
  const [changesLoading, setChangesLoading] = useState(false);

  // Load the record whenever the dialog opens for a new id.
  useEffect(() => {
    if (!open || id == null) return;
    let active = true;
    setLoading(true);
    setError("");
    setDetail(null);
    setChanges(null);
    getActivityDetail(id)
      .then((d) => { if (active) setDetail(d); })
      .catch((e) => { if (active) setError(e.message || "Couldn't load this activity."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [open, id]);

  function loadChanges() {
    setChangesLoading(true);
    getActivityChanges(id)
      .then(setChanges)
      .catch((e) => setChanges({ mode: "UNAVAILABLE", message: e.message || "Couldn't load changes." }))
      .finally(() => setChangesLoading(false));
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      slotProps={{ paper: { sx: { borderRadius: "18px", background: tokens.surface, backgroundImage: "none" } } }}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pr: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "1.05rem", color: tokens.text }}>Activity detail</Typography>
          {detail && <Chip size="small" label={(detail.action || "—").replace(/_/g, " ")} sx={{ fontWeight: 700, fontSize: "0.68rem" }} />}
        </Box>
        <Button onClick={onClose} sx={{ minWidth: 0, color: tokens.textFaint }}><CloseRounded fontSize="small" /></Button>
      </DialogTitle>

      <DialogContent dividers sx={{ borderColor: tokens.border }}>
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress size={28} /></Box>
        )}

        {error && !loading && <Alert severity="error">{error}</Alert>}

        {detail && !loading && (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            <Field label="User" value={detail.actorName} />
            <Field label="Email" value={detail.actorEmail} />
            <Field label="Role" value={detail.actorRole} />
            <Field label="Timestamp" value={formatDate(detail.timestamp)} />
            <Field label="Action" value={(detail.action || "—").replace(/_/g, " ")} />
            <Field label="Resource Type" value={detail.resourceType} />
            <Field label="Resource Name" value={detail.resourceName} />
            <Field label="Resource ID" value={detail.resourceId} mono />
            <Box>
              <Typography sx={{ color: tokens.textFaint, fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", mb: 0.5 }}>
                Status
              </Typography>
              <StatusChip value={detail.status} />
            </Box>
            <Box sx={{ gridColumn: { xs: "1", sm: "1 / -1" } }}>
              <Field label="Details" value={detail.details} />
            </Box>

            {detail.hasVersions && (
              <Box sx={{ gridColumn: { xs: "1", sm: "1 / -1" } }}>
                <Divider sx={{ borderColor: tokens.border, my: 1 }} />
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
                  <Typography sx={{ color: tokens.textDim, fontSize: "0.85rem", fontWeight: 600 }}>
                    File edit — version references recorded
                  </Typography>
                  <Button size="small" variant="outlined" startIcon={<HistoryRounded />} onClick={loadChanges} disabled={changesLoading}>
                    {changesLoading ? "Loading…" : "View Changes"}
                  </Button>
                </Box>

                {changes && (
                  <Box sx={{ mt: 1.5, p: 1.5, borderRadius: "12px", border: `1px solid ${tokens.border}`, background: tokens.surfaceHover }}>
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5, mb: 1 }}>
                      <Field label="Previous Version" value={changes.versionBefore} mono />
                      <Field label="Current Version" value={changes.versionAfter} mono />
                    </Box>
                    <Alert severity="info" sx={{ fontSize: "0.82rem" }}>{changes.message}</Alert>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="contained">Close</Button>
      </DialogActions>
    </Dialog>
  );
}
