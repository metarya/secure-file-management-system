import { useEffect, useState, useMemo } from "react";
import {
  Box, Typography, IconButton, Menu, MenuItem, Dialog, DialogContent, Button, CircularProgress, Divider,
} from "@mui/material";
import MoreVertRounded from "@mui/icons-material/MoreVertRounded";
import VisibilityRounded from "@mui/icons-material/VisibilityRounded";
import DownloadRounded from "@mui/icons-material/DownloadRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import RestoreRounded from "@mui/icons-material/RestoreRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import InsertDriveFileRounded from "@mui/icons-material/InsertDriveFileRounded";

import AppShell from "../../components/ui/AppShell";
import PageHeader from "../../components/ui/PageHeader";
import DataTable from "../../components/ui/DataTable";
import StatusChip from "../../components/ui/StatusChip";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";
import { tokens } from "../../theme/theme";
import { formatBytes, formatDateShort, fileTypeLabel, initials, avatarColor } from "../../utils/format";
import { getAllFiles, adminPreviewFile, adminDownloadFile, adminDeleteFile, adminRestoreFile } from "../../api/adminApi";
import { getMyPermissions } from "../../api/rbacApi";

function triggerDownload(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = fileName;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

export default function FileManagementPage() {
  const toast = useToast();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [perms, setPerms] = useState([]);

  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuFile, setMenuFile] = useState(null);

  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const can = (code) => perms.length === 0 || perms.includes(code);

  async function fetchFiles() {
    setLoading(true);
    try {
      const data = await getAllFiles();
      setFiles(Array.isArray(data) ? data : []);
    } catch (e) {
      toast(e.message || "Couldn't load files.", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchFiles();
    getMyPermissions().then((p) => setPerms(Array.isArray(p) ? p : [])).catch(() => {});
  }, []); // eslint-disable-line

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return files.filter((f) =>
      (f.fileName || "").toLowerCase().includes(q) ||
      (f.ownerName || "").toLowerCase().includes(q) ||
      (f.ownerEmail || "").toLowerCase().includes(q));
  }, [files, query]);

  function openMenu(e, f) { setMenuAnchor(e.currentTarget); setMenuFile(f); }
  function closeMenu() { setMenuAnchor(null); setMenuFile(null); }

  async function handlePreview(f) {
    closeMenu();
    setPreview({ loading: true });
    setPreviewLoading(true);
    try {
      const data = await adminPreviewFile(f.fileId);
      setPreview({ ...data, fileId: f.fileId, visibility: f.visibility, fileSize: f.fileSize });
    } catch (e) {
      toast(e.message || "Couldn't preview the file.", "error");
      setPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleDownload(f) {
    closeMenu();
    try {
      const { blob, fileName } = await adminDownloadFile(f.fileId, f.fileName);
      triggerDownload(blob, fileName);
    } catch (e) {
      toast(e.message || "Download failed.", "error");
    }
  }

  async function confirmDelete() {
    setBusy(true);
    try {
      await adminDeleteFile(deleteTarget.fileId);
      toast("File deleted.", "success");
      setFiles((prev) => prev.filter((f) => f.fileId !== deleteTarget.fileId));
      setDeleteTarget(null);
    } catch (e) {
      toast(e.message || "Couldn't delete the file.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function confirmRestore() {
    setBusy(true);
    try {
      await adminRestoreFile(restoreTarget.fileId);
      toast("File restored.", "success");
      setRestoreTarget(null);
      await fetchFiles();
    } catch (e) {
      toast(e.message || "Couldn't restore the file.", "error");
    } finally {
      setBusy(false);
    }
  }

  const columns = [
    {
      key: "file", label: "File",
      render: (f) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ position: "relative", width: 34, height: 34, borderRadius: "10px", display: "grid", placeItems: "center", background: "rgba(129,140,248,0.14)", color: tokens.accent, flexShrink: 0 }}>
            <InsertDriveFileRounded sx={{ fontSize: 18 }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography noWrap sx={{ color: tokens.text, fontWeight: 600, fontSize: "0.9rem", maxWidth: 260 }}>{f.fileName}</Typography>
            <Typography noWrap sx={{ color: tokens.textFaint, fontSize: "0.76rem", maxWidth: 260 }}>{f.description || fileTypeLabel(f.fileName)}</Typography>
          </Box>
        </Box>
      ),
    },
    {
      key: "owner", label: "Owner",
      render: (f) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ width: 26, height: 26, borderRadius: "50%", bgcolor: avatarColor(f.ownerEmail), display: "grid", placeItems: "center", fontSize: "0.66rem", fontWeight: 700, color: "#fff" }}>
            {initials(f.ownerName, f.ownerEmail)}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography noWrap sx={{ color: tokens.text, fontSize: "0.84rem", maxWidth: 180 }}>{f.ownerName || "—"}</Typography>
            <Typography noWrap sx={{ color: tokens.textFaint, fontSize: "0.74rem", maxWidth: 180 }}>{f.ownerEmail}</Typography>
          </Box>
        </Box>
      ),
    },
    { key: "fileSize", label: "Size", render: (f) => <Typography className="tnum" sx={{ color: tokens.textDim, fontSize: "0.84rem" }}>{formatBytes(f.fileSize)}</Typography> },
    { key: "visibility", label: "Visibility", render: (f) => <StatusChip value={f.visibility} /> },
    { key: "uploadedAt", label: "Uploaded", render: (f) => <Typography sx={{ color: tokens.textDim, fontSize: "0.84rem" }}>{formatDateShort(f.uploadedAt)}</Typography> },
    {
      key: "actions", label: "", align: "right", width: 56,
      render: (f) => <IconButton size="small" onClick={(e) => openMenu(e, f)} sx={{ color: tokens.textFaint }}><MoreVertRounded fontSize="small" /></IconButton>,
    },
  ];

  return (
    <AppShell>
      <PageHeader eyebrow="Administration" title="Files" subtitle={loading ? "Loading…" : `${files.length} file${files.length === 1 ? "" : "s"} across all users`} />

      <DataTable
        columns={columns}
        rows={filtered}
        loading={loading}
        getRowKey={(f) => f.fileId}
        searchable
        searchPlaceholder="Search by file, owner, or email…"
        searchValue={query}
        onSearchChange={setQuery}
        empty={null}
      />

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}
        transformOrigin={{ horizontal: "right", vertical: "top" }} anchorOrigin={{ horizontal: "right", vertical: "bottom" }}>
        <MenuItem onClick={() => handlePreview(menuFile)} sx={{ gap: 1.25, fontSize: "0.86rem" }}><VisibilityRounded fontSize="small" /> Preview</MenuItem>
        <MenuItem onClick={() => handleDownload(menuFile)} sx={{ gap: 1.25, fontSize: "0.86rem" }}><DownloadRounded fontSize="small" /> Download</MenuItem>
        {can("FILE:RESTORE") && (
          <MenuItem onClick={() => { setRestoreTarget(menuFile); closeMenu(); }} sx={{ gap: 1.25, fontSize: "0.86rem", color: tokens.success }}><RestoreRounded fontSize="small" /> Restore</MenuItem>
        )}
        {can("FILE:DELETE_ANY") && (
          <MenuItem onClick={() => { setDeleteTarget(menuFile); closeMenu(); }} sx={{ gap: 1.25, fontSize: "0.86rem", color: tokens.danger }}><DeleteOutlineRounded fontSize="small" /> Delete</MenuItem>
        )}
      </Menu>

      {/* Admin preview */}
      <Dialog open={Boolean(preview)} onClose={() => setPreview(null)} maxWidth="md" fullWidth>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, p: 3, pb: 2, borderBottom: `1px solid ${tokens.border}` }}>
          <Box sx={{ width: 42, height: 42, borderRadius: "12px", display: "grid", placeItems: "center", background: "rgba(129,140,248,0.16)", color: tokens.accent, flexShrink: 0 }}><InsertDriveFileRounded /></Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography noWrap sx={{ color: tokens.text, fontWeight: 700, fontSize: "1.05rem" }}>{preview?.fileName || "Preview"}</Typography>
            <Typography sx={{ color: tokens.textFaint, fontSize: "0.8rem", mt: 0.5 }}>
              {preview?.ownerName ? `Owner: ${preview.ownerName} · ${preview.ownerEmail}` : ""}
            </Typography>
          </Box>
          <IconButton onClick={() => setPreview(null)} sx={{ color: tokens.textFaint }}><CloseRounded /></IconButton>
        </Box>
        <DialogContent sx={{ p: 3 }}>
          {previewLoading || preview?.loading ? (
            <Box sx={{ display: "grid", placeItems: "center", py: 8 }}><CircularProgress size={26} /></Box>
          ) : (
            <Box component="pre" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word", color: tokens.text, fontSize: "0.9rem", lineHeight: 1.7, fontFamily: "inherit", m: 0, maxHeight: 460, overflowY: "auto" }}>
              {preview?.content || "This file has no readable content."}
            </Box>
          )}
        </DialogContent>
        <Divider sx={{ borderColor: tokens.border }} />
        <Box sx={{ p: 2.5, display: "flex", justifyContent: "flex-end" }}>
          <Button variant="outlined" startIcon={<DownloadRounded />} onClick={() => preview?.fileId && handleDownload({ fileId: preview.fileId, fileName: preview.fileName })}>Download</Button>
        </Box>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete file"
        message={`"${deleteTarget?.fileName}" (owned by ${deleteTarget?.ownerName || deleteTarget?.ownerEmail}) will be removed.`}
        confirmLabel="Delete" destructive loading={busy} icon={<DeleteOutlineRounded />}
        onConfirm={confirmDelete} onClose={() => setDeleteTarget(null)}
      />
      <ConfirmDialog
        open={Boolean(restoreTarget)}
        title="Restore file"
        message={`Restore "${restoreTarget?.fileName}" for ${restoreTarget?.ownerName || restoreTarget?.ownerEmail}?`}
        confirmLabel="Restore" loading={busy} icon={<RestoreRounded />}
        onConfirm={confirmRestore} onClose={() => setRestoreTarget(null)}
      />
    </AppShell>
  );
}
