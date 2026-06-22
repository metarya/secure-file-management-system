import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Box } from "@mui/material";
import { tokens } from "../../theme/theme";

// Generic confirm/destructive-action dialog.
export default function ConfirmDialog({
  open, title, message, confirmLabel = "Confirm", cancelLabel = "Cancel",
  destructive = false, loading = false, icon, onConfirm, onClose,
}) {
  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1 }}>
        {icon && (
          <Box sx={{
            width: 40, height: 40, borderRadius: "12px", display: "grid", placeItems: "center",
            bgcolor: destructive ? "rgba(248,113,113,0.14)" : "rgba(129,140,248,0.14)",
            color: destructive ? tokens.danger : tokens.accent,
          }}>
            {icon}
          </Box>
        )}
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ color: tokens.textDim }}>{message}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} disabled={loading} variant="outlined">{cancelLabel}</Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          variant="contained"
          color={destructive ? "error" : "primary"}
          sx={destructive ? { background: "linear-gradient(135deg,#ef4444,#dc2626)", boxShadow: "0 6px 20px rgba(239,68,68,0.3)" } : undefined}
        >
          {loading ? "Working…" : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
