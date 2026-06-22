import { Box, Typography, TextField, Button, Stack, MenuItem, Alert } from "@mui/material";
import ShareRoundedIcon from "@mui/icons-material/ShareRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";

export default function ShareFile({
  files, shareFileId, setShareFileId, targetUserEmail, setTargetUserEmail,
  permissionType, setPermissionType, shareFileAccess, shareMessage,
}) {
  const inputSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "10px",
      "& fieldset": { borderColor: "#e2e8f0" },
      "&:hover fieldset": { borderColor: "#c7d2fe" },
      "&.Mui-focused fieldset": { borderColor: "#6366f1" },
    }
  };

  return (
    <Box>
      <Typography sx={{ fontWeight: 700, fontSize: "1.1rem", color: "#0f172a", mb: 0.5 }}>Share file access</Typography>
      <Typography sx={{ fontSize: "0.8rem", color: "#94a3b8", mb: 3 }}>Grant another user access to one of your files</Typography>

      <Stack spacing={2.5}>
        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: "0.8rem", color: "#374151", mb: 0.8 }}>Select file</Typography>
          <TextField select fullWidth size="small" value={shareFileId} onChange={e => setShareFileId(e.target.value)} sx={inputSx}>
            <MenuItem value=""><span style={{ color: "#94a3b8" }}>Choose a file…</span></MenuItem>
            {files.map(file => {
              const id = file.fileId || file.id;
              return <MenuItem key={id} value={id}>{file.fileName || file.name}</MenuItem>;
            })}
          </TextField>
        </Box>

        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: "0.8rem", color: "#374151", mb: 0.8 }}>Recipient email</Typography>
          <TextField fullWidth size="small" type="email" placeholder="colleague@example.com"
            value={targetUserEmail} onChange={e => setTargetUserEmail(e.target.value)} sx={inputSx} />
        </Box>

        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: "0.8rem", color: "#374151", mb: 0.8 }}>Permission</Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            {[
              { value: "VIEW", label: "Viewer", icon: <VisibilityRoundedIcon sx={{ fontSize: 16 }} />, desc: "Can view" },
              { value: "EDITOR", label: "Editor", icon: <EditRoundedIcon sx={{ fontSize: 16 }} />, desc: "Can edit" },
            ].map(opt => {
              const active = permissionType === opt.value;
              return (
                <Box key={opt.value} onClick={() => setPermissionType(opt.value)} sx={{
                  flex: 1, p: 1.5, borderRadius: "12px", cursor: "pointer",
                  border: `2px solid ${active ? "#6366f1" : "#e2e8f0"}`,
                  background: active ? "rgba(99,102,241,0.06)" : "#fff",
                  transition: "all 0.15s ease",
                  "&:hover": { borderColor: active ? "#6366f1" : "#c7d2fe" },
                }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, color: active ? "#6366f1" : "#64748b" }}>
                    {opt.icon}
                    <Typography sx={{ fontWeight: 700, fontSize: "0.82rem", color: active ? "#6366f1" : "#374151" }}>{opt.label}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: "0.72rem", color: "#94a3b8", mt: 0.3 }}>{opt.desc}</Typography>
                </Box>
              );
            })}
          </Box>
        </Box>

        {shareMessage && (
          <Alert severity={shareMessage.toLowerCase().includes("fail") || shareMessage.toLowerCase().includes("error") ? "error" : "success"}
            sx={{ borderRadius: "12px", fontSize: "0.85rem", py: 0.5 }}>
            {shareMessage}
          </Alert>
        )}

        <Button variant="contained" onClick={shareFileAccess} startIcon={<ShareRoundedIcon />}
          sx={{
            height: 46, borderRadius: "12px", fontWeight: 700, textTransform: "none", fontSize: "0.9rem",
            background: "linear-gradient(135deg, #6366f1, #3b82f6)",
            boxShadow: "0 4px 16px rgba(99,102,241,0.3)",
            "&:hover": { background: "linear-gradient(135deg, #4f46e5, #2563eb)", boxShadow: "0 6px 20px rgba(99,102,241,0.4)" },
          }}>
          Share access
        </Button>
      </Stack>
    </Box>
  );
}
