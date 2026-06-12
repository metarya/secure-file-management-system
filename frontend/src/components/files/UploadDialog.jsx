import { useRef, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, TextField, IconButton } from "@mui/material";
import CloudUploadRounded from "@mui/icons-material/CloudUploadRounded";
import InsertDriveFileRounded from "@mui/icons-material/InsertDriveFileRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import { tokens } from "../../theme/theme";
import { formatBytes } from "../../utils/format";

export default function UploadDialog({ open, onClose, onUpload, uploading }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState("");
  const [dragging, setDragging] = useState(false);

  function reset() { setFile(null); setDescription(""); setDragging(false); }
  function close() { if (!uploading) { reset(); onClose(); } }

  function handleDrop(e) {
    e.preventDefault(); setDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) setFile(dropped);
  }

  async function submit() {
    if (!file) return;
    await onUpload(file, description.trim());
    reset();
  }

  return (
    <Dialog open={open} onClose={close} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        Upload a file
        <IconButton onClick={close} disabled={uploading} sx={{ color: tokens.textFaint }}><CloseRounded /></IconButton>
      </DialogTitle>
      <DialogContent>
        <Box
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          sx={{
            cursor: "pointer", borderRadius: "16px", p: 4, textAlign: "center",
            border: `2px dashed ${dragging ? tokens.accentFrom : tokens.border}`,
            background: dragging ? "rgba(99,102,241,0.08)" : tokens.surfaceHover,
            transition: "all 0.18s",
          }}
        >
          <input ref={inputRef} type="file" hidden accept=".txt,text/plain" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          {file ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, justifyContent: "center" }}>
              <Box sx={{ width: 44, height: 44, borderRadius: "12px", display: "grid", placeItems: "center", background: "rgba(129,140,248,0.16)", color: tokens.accent }}>
                <InsertDriveFileRounded />
              </Box>
              <Box sx={{ textAlign: "left", minWidth: 0 }}>
                <Typography noWrap sx={{ color: tokens.text, fontWeight: 600, maxWidth: 320 }}>{file.name}</Typography>
                <Typography sx={{ color: tokens.textFaint, fontSize: "0.8rem" }}>{formatBytes(file.size)}</Typography>
              </Box>
            </Box>
          ) : (
            <>
              <CloudUploadRounded sx={{ fontSize: 40, color: tokens.textFaint, mb: 1 }} />
              <Typography sx={{ color: tokens.text, fontWeight: 600 }}>Drag a file here, or click to browse</Typography>
              <Typography sx={{ color: tokens.textFaint, fontSize: "0.82rem", mt: 0.5 }}>Plain text files (.txt) only — stored securely in your vault</Typography>
            </>
          )}
        </Box>

        <Typography sx={{ color: tokens.textDim, fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.03em", textTransform: "uppercase", mt: 3, mb: 0.8 }}>
          Description (optional)
        </Typography>
        <TextField
          fullWidth multiline minRows={2} size="small" placeholder="What's in this file?"
          value={description} onChange={(e) => setDescription(e.target.value)}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={close} disabled={uploading} variant="outlined">Cancel</Button>
        <Button onClick={submit} disabled={!file || uploading} variant="contained" startIcon={<CloudUploadRounded />}>
          {uploading ? "Uploading…" : "Upload"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
