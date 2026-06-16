import { useRef, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, TextField, IconButton, LinearProgress } from "@mui/material";
import CloudUploadRounded from "@mui/icons-material/CloudUploadRounded";
import InsertDriveFileRounded from "@mui/icons-material/InsertDriveFileRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import DriveFileRenameOutlineRounded from "@mui/icons-material/DriveFileRenameOutlineRounded";
import { tokens } from "../../theme/theme";
import { formatBytes } from "../../utils/format";

// Keep the original file's extension on the chosen name, so renaming on upload
// never drops or changes the extension (the backend matches on it).
function ensureExtension(name, originalName) {
  const dot = originalName.lastIndexOf(".");
  if (dot === -1) return name; // original had no extension
  const ext = originalName.slice(dot); // e.g. ".txt"
  return name.toLowerCase().endsWith(ext.toLowerCase()) ? name : name + ext;
}

// Produce the file to actually upload: if the name was changed, wrap the bytes
// in a new File so the backend stores the chosen name (it reads the multipart
// filename). Strips any path separators for safety.
function buildUploadFile(originalFile, desiredName) {
  const trimmed = (desiredName || "").trim().replace(/[\\/]/g, "");
  if (!trimmed || trimmed === originalFile.name) return originalFile;
  const finalName = ensureExtension(trimmed, originalFile.name);
  if (finalName === originalFile.name) return originalFile;
  return new File([originalFile], finalName, {
    type: originalFile.type,
    lastModified: originalFile.lastModified,
  });
}

export default function UploadDialog({ open, onClose, onUpload, uploading }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0); // 0–100, reported by the upload call

  function pickFile(f) {
    setFile(f);
    setName(f ? f.name : ""); // prefill the name field with the file's name
  }

  function reset() { setFile(null); setName(""); setDescription(""); setDragging(false); setProgress(0); }
  function close() { if (!uploading) { reset(); onClose(); } }

  function handleDrop(e) {
    e.preventDefault(); setDragging(false);
    if (uploading) return; // don't swap the file out mid-upload
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) pickFile(dropped);
  }

  async function submit() {
    if (!file) return;
    setProgress(0);
    try {
      // The dialog owns the progress value and hands setProgress down as the
      // third argument, so the upload call can push 0–100 as the bytes go out.
      await onUpload(buildUploadFile(file, name), description.trim(), setProgress);
      reset();
    } catch {
      // The parent surfaces the failure (toast). Keep the chosen file so the
      // user can retry; just clear the progress indicator.
      setProgress(0);
    }
  }

  return (
    <Dialog open={open} onClose={close} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        Upload a file
        <IconButton onClick={close} disabled={uploading} sx={{ color: tokens.textFaint }}><CloseRounded /></IconButton>
      </DialogTitle>
      <DialogContent>
        <Box
          onClick={() => { if (!uploading) inputRef.current?.click(); }}
          onDragOver={(e) => { e.preventDefault(); if (!uploading) setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          sx={{
            cursor: uploading ? "default" : "pointer", borderRadius: "16px", p: 4, textAlign: "center",
            border: `2px dashed ${dragging ? tokens.accentFrom : tokens.border}`,
            background: dragging ? "rgba(99,102,241,0.08)" : tokens.surfaceHover,
            opacity: uploading ? 0.6 : 1,
            transition: "all 0.18s",
          }}
        >
          <input ref={inputRef} type="file" hidden accept=".txt,.pdf,text/plain,application/pdf" onChange={(e) => pickFile(e.target.files?.[0] || null)} />
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
              <Typography sx={{ color: tokens.textFaint, fontSize: "0.82rem", mt: 0.5 }}>Text (.txt) and PDF (.pdf) files — stored securely in your vault</Typography>
            </>
          )}
        </Box>

        {/* File name — prefilled from the selected file; locked while uploading */}
        {file && (
          <>
            <Typography sx={{ color: tokens.textDim, fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.03em", textTransform: "uppercase", mt: 3, mb: 0.8 }}>
              File name
            </Typography>
            <TextField
              fullWidth size="small" placeholder={file.name} disabled={uploading}
              value={name} onChange={(e) => setName(e.target.value)}
              slotProps={{ input: { startAdornment: <DriveFileRenameOutlineRounded sx={{ color: tokens.textFaint, fontSize: 18, mr: 1 }} /> } }}
              helperText="The file extension is kept automatically."
              FormHelperTextProps={{ sx: { color: tokens.textFaint, fontSize: "0.72rem", ml: 0.5 } }}
            />
          </>
        )}

        <Typography sx={{ color: tokens.textDim, fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.03em", textTransform: "uppercase", mt: 2.5, mb: 0.8 }}>
          Description (optional)
        </Typography>
        <TextField
          fullWidth multiline minRows={2} size="small" placeholder="What's in this file?" disabled={uploading}
          value={description} onChange={(e) => setDescription(e.target.value)}
        />

        {/* Upload progress — only while an upload is in flight */}
        {uploading && (
          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.7 }}>
              <Typography sx={{ color: tokens.textDim, fontSize: "0.8rem", fontWeight: 600 }}>
                {progress < 100 ? "Uploading…" : "Processing…"}
              </Typography>
              <Typography sx={{ color: tokens.textFaint, fontSize: "0.8rem", fontWeight: 700 }}>
                {progress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 8,
                borderRadius: 999,
                backgroundColor: tokens.surfaceHover,
                "& .MuiLinearProgress-bar": {
                  borderRadius: 999,
                  background: `linear-gradient(90deg, ${tokens.accentFrom}, ${tokens.accent})`,
                },
              }}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={close} disabled={uploading} variant="outlined">Cancel</Button>
        <Button onClick={submit} disabled={!file || uploading} variant="contained" startIcon={<CloudUploadRounded />}>
          {uploading ? (progress < 100 ? "Uploading…" : "Processing…") : "Upload"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}