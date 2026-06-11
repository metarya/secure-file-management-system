import { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, TextField, IconButton, Alert } from "@mui/material";
import CloseRounded from "@mui/icons-material/CloseRounded";
import VisibilityRounded from "@mui/icons-material/VisibilityRounded";
import EditRounded from "@mui/icons-material/EditRounded";
import ShareRounded from "@mui/icons-material/ShareRounded";
import { tokens } from "../../theme/theme";

// Backend accepts permission codes VIEWER and EDITOR.
const PERMISSIONS = [
  { value: "VIEWER", label: "Viewer", desc: "Can view & download", icon: <VisibilityRounded sx={{ fontSize: 18 }} /> },
  { value: "EDITOR", label: "Editor", desc: "Can view & edit", icon: <EditRounded sx={{ fontSize: 18 }} /> },
];

export default function ShareDialog({ open, onClose, file, onShare, sharing }) {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState("VIEWER");
  const [error, setError] = useState("");

  useEffect(() => { if (open) { setEmail(""); setPermission("VIEWER"); setError(""); } }, [open]);

  async function submit() {
    if (!email.trim()) { setError("Enter the recipient's email."); return; }
    setError("");
    await onShare(email.trim(), permission);
  }

  return (
    <Dialog open={open} onClose={sharing ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        Share file
        <IconButton onClick={onClose} disabled={sharing} sx={{ color: tokens.textFaint }}><CloseRounded /></IconButton>
      </DialogTitle>
      <DialogContent>
        {file && (
          <Typography sx={{ color: tokens.textDim, fontSize: "0.88rem", mb: 2.5 }}>
            Sharing <Box component="span" sx={{ color: tokens.text, fontWeight: 600 }}>{file.fileName}</Box>
          </Typography>
        )}

        <Typography sx={{ color: tokens.textDim, fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.03em", textTransform: "uppercase", mb: 0.8 }}>
          Recipient email
        </Typography>
        <TextField fullWidth size="small" type="email" placeholder="colleague@example.com" value={email} onChange={(e) => setEmail(e.target.value)} sx={{ mb: 3 }} />

        <Typography sx={{ color: tokens.textDim, fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.03em", textTransform: "uppercase", mb: 1 }}>
          Permission
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
          {PERMISSIONS.map((opt) => {
            const active = permission === opt.value;
            return (
              <Box
                key={opt.value}
                onClick={() => setPermission(opt.value)}
                sx={{
                  cursor: "pointer", p: 2, borderRadius: "14px",
                  border: `1px solid ${active ? "rgba(129,140,248,0.5)" : tokens.border}`,
                  background: active ? "rgba(129,140,248,0.1)" : "rgba(255,255,255,0.02)",
                  transition: "all 0.15s",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: active ? tokens.accent : tokens.textDim, mb: 0.5 }}>
                  {opt.icon}
                  <Typography sx={{ fontWeight: 700, fontSize: "0.88rem", color: active ? tokens.accent : tokens.text }}>{opt.label}</Typography>
                </Box>
                <Typography sx={{ fontSize: "0.74rem", color: tokens.textFaint }}>{opt.desc}</Typography>
              </Box>
            );
          })}
        </Box>

        {error && <Alert severity="error" sx={{ borderRadius: "12px", mt: 2.5, fontSize: "0.85rem", py: 0.5 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} disabled={sharing} variant="outlined">Cancel</Button>
        <Button onClick={submit} disabled={sharing} variant="contained" startIcon={<ShareRounded />}>
          {sharing ? "Sharing…" : "Share"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
