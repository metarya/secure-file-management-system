import { useState } from "react";
import { Box, Typography, TextField, Button, Stack, LinearProgress } from "@mui/material";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

export default function Upload({ FileName, setFileName, FileDescription, setFileDescription, setFile, uploadFile }) {
  const [selectedFileName, setSelectedFileName] = useState("");
  const [dragging, setDragging] = useState(false);

  function handleFileChange(file) {
    if (!file) return;
    setFile(file);
    setSelectedFileName(file.name);
    if (!FileName) setFileName(file.name.replace(/\.txt$/i, ""));
  }

  function handleDrop(e) {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileChange(file);
  }

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
      <Typography sx={{ fontWeight: 700, fontSize: "1.1rem", color: "#0f172a", mb: 0.5 }}>Upload a file</Typography>
      <Typography sx={{ fontSize: "0.8rem", color: "#94a3b8", mb: 3 }}>Only .txt files are supported</Typography>

      <Stack spacing={2.5}>
        {/* Drop zone */}
        <Box
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          sx={{
            border: `2px dashed ${dragging ? "#6366f1" : "#e2e8f0"}`,
            borderRadius: "14px",
            p: 3, textAlign: "center",
            background: dragging ? "rgba(99,102,241,0.04)" : "#fafafa",
            transition: "all 0.2s ease",
            cursor: "pointer",
          }}
          onClick={() => document.getElementById("file-input-hidden").click()}
        >
          {selectedFileName ? (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1.5 }}>
              <InsertDriveFileOutlinedIcon sx={{ color: "#6366f1", fontSize: 28 }} />
              <Box sx={{ textAlign: "left" }}>
                <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: "#0f172a" }}>{selectedFileName}</Typography>
                <Typography sx={{ fontSize: "0.75rem", color: "#94a3b8" }}>Ready to upload</Typography>
              </Box>
              <Button size="small" onClick={e => { e.stopPropagation(); setFile(null); setSelectedFileName(""); }}
                sx={{ minWidth: 0, color: "#94a3b8", "&:hover": { color: "#ef4444" } }}>
                <CloseRoundedIcon sx={{ fontSize: 18 }} />
              </Button>
            </Box>
          ) : (
            <Box>
              <CloudUploadRoundedIcon sx={{ color: "#cbd5e1", fontSize: 36, mb: 1 }} />
              <Typography sx={{ fontWeight: 600, fontSize: "0.875rem", color: "#64748b" }}>
                Drag & drop or <span style={{ color: "#6366f1" }}>browse</span>
              </Typography>
              <Typography sx={{ fontSize: "0.75rem", color: "#cbd5e1", mt: 0.5 }}>.txt files only</Typography>
            </Box>
          )}
          <input id="file-input-hidden" hidden type="file" accept=".txt"
            onChange={e => handleFileChange(e.target.files[0])} />
        </Box>

        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: "0.8rem", color: "#374151", mb: 0.8 }}>File name</Typography>
          <TextField fullWidth size="small" placeholder="e.g. project-notes" value={FileName}
            onChange={e => setFileName(e.target.value)} sx={inputSx} />
        </Box>

        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: "0.8rem", color: "#374151", mb: 0.8 }}>Description <span style={{ color: "#94a3b8", fontWeight: 400 }}>(optional)</span></Typography>
          <TextField fullWidth multiline rows={2} placeholder="What's in this file?" value={FileDescription}
            onChange={e => setFileDescription(e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", "& fieldset": { borderColor: "#e2e8f0" }, "&:hover fieldset": { borderColor: "#c7d2fe" }, "&.Mui-focused fieldset": { borderColor: "#6366f1" } } }} />
        </Box>

        <Button variant="contained" onClick={uploadFile} startIcon={<CloudUploadRoundedIcon />}
          sx={{
            height: 46, borderRadius: "12px", fontWeight: 700, textTransform: "none", fontSize: "0.9rem",
            background: "linear-gradient(135deg, #6366f1, #3b82f6)",
            boxShadow: "0 4px 16px rgba(99,102,241,0.3)",
            "&:hover": { background: "linear-gradient(135deg, #4f46e5, #2563eb)", boxShadow: "0 6px 20px rgba(99,102,241,0.4)" },
          }}>
          Upload file
        </Button>
      </Stack>
    </Box>
  );
}
