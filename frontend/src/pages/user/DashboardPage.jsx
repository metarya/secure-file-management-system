import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, CircularProgress } from "@mui/material";
import CloudUploadRounded from "@mui/icons-material/CloudUploadRounded";
import FolderRounded from "@mui/icons-material/FolderRounded";
import OpenInFullRounded from "@mui/icons-material/OpenInFullRounded";
import DownloadRounded from "@mui/icons-material/DownloadRounded";
import ShareRounded from "@mui/icons-material/ShareRounded";
import VisibilityRounded from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRounded from "@mui/icons-material/VisibilityOffRounded";
import DriveFileRenameOutlineRounded from "@mui/icons-material/DriveFileRenameOutlineRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import SearchRounded from "@mui/icons-material/SearchRounded";

import AppShell from "../../components/ui/AppShell";
import PageHeader from "../../components/ui/PageHeader";
import FileCard from "../../components/files/FileCard";
import EmptyState from "../../components/ui/EmptyState";
import UploadDialog from "../../components/files/UploadDialog";
import ShareDialog from "../../components/files/ShareDialog";
import FilePreviewDialog from "../../components/files/FilePreviewDialog";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";
import { TextField, InputAdornment } from "@mui/material";
import { tokens } from "../../theme/theme";
import {
  getMyFiles,
  searchMyFiles,
  uploadFileWithProgress,
  downloadFile,
  deleteFile,
  updateVisibility,
  updateFileContent,
  updateFileDescription,
  renameFile,
  previewFile,
  shareFile,
} from "../../api/fileApi";

function triggerDownload(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = fileName;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

export default function DashboardPage() {
  const toast = useToast();

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [shareTarget, setShareTarget] = useState(null);
  const [sharing, setSharing] = useState(false);

  const [previewTarget, setPreviewTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const debounceRef = useRef();
  const toastRef = useRef(toast);
  useEffect(() => { toastRef.current = toast; }, [toast]);

  // fetchFiles is stable (no deps that change on re-render) — called only once on mount
  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyFiles();
      setFiles(Array.isArray(data) ? data : []);
    } catch (e) {
      toastRef.current(e.message || "Couldn't load your files.", "error");
    } finally {
      setLoading(false);
    }
  }, []); // empty deps — intentionally stable

  // Mount-only fetch
  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  // Debounced search — only runs when query changes
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) {
      // Query cleared: reload full list (but only if we aren't already loading)
      fetchFiles();
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchMyFiles(query.trim());
        setFiles(Array.isArray(data) ? data : []);
      } catch (e) {
        toastRef.current(e.message || "Search failed.", "error");
      }
    }, 320);
    return () => clearTimeout(debounceRef.current);
  }, [query, fetchFiles]);

  // The dialog calls onUpload(file, description, onProgress). onProgress is the
  // dialog's setProgress — forward it as the 4th arg so the bar can move.
  async function handleUpload(file, description, onProgress) {
    setUploading(true);
    try {
      await uploadFileWithProgress(file, description, onProgress);
      toast("File uploaded.", "success");
      setUploadOpen(false);
      await fetchFiles();
    } catch (e) {
      toast(e.message || "Upload failed.", "error");
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(file) {
    try {
      const { blob, fileName } = await downloadFile(file.fileId, file.fileName);
      triggerDownload(blob, fileName);
    } catch (e) {
      toast(e.message || "Download failed.", "error");
    }
  }

  async function handleToggleVisibility(file) {
    const next = file.visibility === "PUBLIC" ? "PRIVATE" : "PUBLIC";
    try {
      await updateVisibility(file.fileId, next);
      toast(`File is now ${next.toLowerCase()}.`, "success");
      setFiles((prev) => prev.map((f) => (f.fileId === file.fileId ? { ...f, visibility: next } : f)));
    } catch (e) {
      toast(e.message || "Couldn't change visibility.", "error");
    }
  }

  async function handleShare(email, permission) {
    setSharing(true);
    try {
      await shareFile(shareTarget.fileId, email, permission);
      toast(`Shared with ${email}.`, "success");
      setShareTarget(null);
    } catch (e) {
      toast(e.message || "Couldn't share the file.", "error");
    } finally {
      setSharing(false);
    }
  }

  async function handleRename(fileId, newName) {
    try {
      await renameFile(fileId, newName);
      toast("File renamed.", "success");
      setFiles((prev) => prev.map((f) => (f.fileId === fileId ? { ...f, fileName: newName } : f)));
      setPreviewTarget((p) => (p && p.fileId === fileId ? { ...p, fileName: newName } : p));
    } catch (e) {
      toast(e.message || "Couldn't rename the file.", "error");
      throw e; // let the dialog keep the rename field open
    }
  }

  async function handleSaveContent(fileId, html) {
    try {
      await updateFileContent(fileId, html);
      toast("Changes saved.", "success");
    } catch (e) {
      toast(e.message || "Couldn't save your changes.", "error");
      throw e; // let the editor stay open with the draft intact
    }
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await deleteFile(deleteTarget.fileId);
      toast("File deleted.", "success");
      setFiles((prev) => prev.filter((f) => f.fileId !== deleteTarget.fileId));
      setDeleteTarget(null);
    } catch (e) {
      toast(e.message || "Couldn't delete the file.", "error");
    } finally {
      setDeleting(false);
    }
  }

  async function handleUpdateDescription(fileId, description) {
    try {
      await updateFileDescription(fileId, description);
      toast("Description updated.", "success");
      setFiles((prev) =>
        prev.map((f) => (f.fileId === fileId ? { ...f, description } : f))
      );
      setPreviewTarget((prev) =>
        prev && prev.fileId === fileId ? { ...prev, description } : prev
      );
    } catch (e) {
      toast(e.message || "Couldn't update the description.", "error");
      throw e; // let the description popover stay open
    }
  }

  const cardActions = (file) => [
    { label: "Open", icon: <OpenInFullRounded />, onClick: () => setPreviewTarget(file) },
    { label: "Download", icon: <DownloadRounded />, onClick: () => handleDownload(file) },
    { label: "Share", icon: <ShareRounded />, onClick: () => setShareTarget(file) },
    {
      label: file.visibility === "PUBLIC" ? "Make private" : "Make public",
      icon: file.visibility === "PUBLIC" ? <VisibilityOffRounded /> : <VisibilityRounded />,
      onClick: () => handleToggleVisibility(file),
    },
    { label: "Rename", icon: <DriveFileRenameOutlineRounded />, onClick: () => setPreviewTarget(file) },
    { label: "Delete", icon: <DeleteOutlineRounded />, onClick: () => setDeleteTarget(file), danger: true },
  ];

  const totalSize = useMemo(() => files.reduce((s, f) => s + (f.fileSize || 0), 0), [files]);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Your vault"
        title="My Files"
        subtitle={loading ? "Loading…" : `${files.length} file${files.length === 1 ? "" : "s"}`}
        actions={
          <Button variant="contained" startIcon={<CloudUploadRounded />} onClick={() => setUploadOpen(true)}>
            Upload file
          </Button>
        }
      />

      <Box sx={{ mb: 3, maxWidth: 420 }}>
        <TextField
          fullWidth size="small" placeholder="Search your files…" value={query}
          onChange={(e) => setQuery(e.target.value)}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRounded sx={{ color: tokens.textFaint, fontSize: 19 }} /></InputAdornment> } }}
        />
      </Box>

      {loading ? (
        <Box sx={{ display: "grid", placeItems: "center", py: 10 }}><CircularProgress /></Box>
      ) : files.length === 0 ? (
        <EmptyState
          icon={<FolderRounded sx={{ fontSize: 30 }} />}
          title={query ? "No files match your search" : "Your vault is empty"}
          description={query ? "Try a different search term." : "Upload your first file to get started."}
          action={!query && <Button variant="contained" startIcon={<CloudUploadRounded />} onClick={() => setUploadOpen(true)}>Upload file</Button>}
        />
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(244px, 1fr))", gap: 2 }} className="fv-rise">
          {files.map((file) => (
            <FileCard key={file.fileId} file={file} onOpen={() => setPreviewTarget(file)} actions={cardActions(file)} onUpdateDescription={handleUpdateDescription} />
          ))}
        </Box>
      )}

      <UploadDialog open={uploadOpen} onClose={() => setUploadOpen(false)} onUpload={handleUpload} uploading={uploading} />
      <ShareDialog open={Boolean(shareTarget)} file={shareTarget} onClose={() => setShareTarget(null)} onShare={handleShare} sharing={sharing} />
      <FilePreviewDialog
        open={Boolean(previewTarget)}
        file={previewTarget}
        onClose={() => setPreviewTarget(null)}
        loadContent={previewFile}
        canEdit
        canRename
        onDownload={handleDownload}
        onSaveContent={handleSaveContent}
        onRename={handleRename}
      />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete file"
        message={`"${deleteTarget?.fileName}" will be permanently removed. This can't be undone.`}
        confirmLabel="Delete"
        destructive
        loading={deleting}
        icon={<DeleteOutlineRounded />}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </AppShell>
  );
}