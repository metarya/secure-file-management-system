import { useEffect, useState, useCallback } from "react";
import {
  Box, Typography, IconButton, Menu, MenuItem, Dialog, DialogContent, Button, CircularProgress, Divider, Tooltip, useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import MoreVertRounded from "@mui/icons-material/MoreVertRounded";
import VisibilityRounded from "@mui/icons-material/VisibilityRounded";
import DownloadRounded from "@mui/icons-material/DownloadRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import RestoreRounded from "@mui/icons-material/RestoreRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import InsertDriveFileRounded from "@mui/icons-material/InsertDriveFileRounded";
import RefreshRounded from "@mui/icons-material/RefreshRounded";

import AppShell from "../../components/ui/AppShell";
import PageHeader from "../../components/ui/PageHeader";
import DataTable from "../../components/ui/DataTable";
import Pagination from "../../components/ui/Pagination";
import StatusChip from "../../components/ui/StatusChip";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";
import usePaginatedQuery from "../../hooks/usePaginatedQuery";
import { tokens } from "../../theme/theme";
import { formatBytes, formatDateShort, fileTypeLabel, initials, avatarColor } from "../../utils/format";
import { getAllFiles, adminPreviewFile, adminPreviewMedia, adminDownloadFile, adminDeleteFile, adminRestoreFile } from "../../api/adminApi";
import { getMyPermissions } from "../../api/rbacApi";
import { htmlToText } from "../../utils/htmlToText";

// TXT/MD files are authored in the rich-text editor and stored as HTML markup,
// so the raw preview body for a .txt file is HTML — not plain text. Detect that
// (same heuristic the user-facing preview uses) so we can normalize it back to
// readable plain text instead of dumping raw tags. Genuine plain-text uploads
// contain no markup and are shown verbatim, preserving spacing/indentation.
const looksLikeHtml = (s = "") => /<[a-z][\s\S]*>/i.test(s);

function triggerDownload(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = fileName;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

export default function FileManagementPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const toast = useToast();
  const [perms, setPerms] = useState([]);

  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuFile, setMenuFile] = useState(null);

  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const can = (code) => perms.length === 0 || perms.includes(code);

  // Server-side pagination + sort + search. Default matches the backend: newest
  // uploads first. The hook resets to page 1 whenever the sort or search changes.
  const fetchFiles = useCallback((params) => getAllFiles(params), []);
  const {
    rows: files, meta, loading, refreshing,
    sort, search, handleSort, setSearch, goToPage, refresh,
  } = usePaginatedQuery(fetchFiles, {
    initialSort: "uploadedAt",
    initialDirection: "desc",
    size: 10, // 10 files per page (server-side LIMIT)
    onError: (e) => toast(e.message || "Couldn't load files.", "error"),
  });

  useEffect(() => {
    getMyPermissions().then((p) => setPerms(Array.isArray(p) ? p : [])).catch(() => {});
  }, []);

  function openMenu(e, f) { setMenuAnchor(e.currentTarget); setMenuFile(f); }
  function closeMenu() { setMenuAnchor(null); setMenuFile(null); }

  async function handlePreview(f) {
    closeMenu();
    setPreview({ loading: true });
    setPreviewLoading(true);
    try {
      const name = (f.fileName || "").toLowerCase();
      const isBinary = /\.(mp4|webm|mov|avi|mkv|mp3|wav|m4a|pdf)$/.test(name);
      // The admin preview endpoint is text-only JSON, so audio/video/pdf gets
      // its bytes from the download endpoint (wrapped in an object URL);
      // everything else uses the text preview.
      const data = isBinary
        ? await adminPreviewMedia(f.fileId, f.fileName)
        : await adminPreviewFile(f.fileId);
      // Spread the row first so fileName/owner/etc. are always present (the
      // header and the media detection rely on fileName); the API payload
      // (type/contentType/url/content) overrides where they overlap.
      setPreview({ ...f, ...data, fileId: f.fileId, visibility: f.visibility, fileSize: f.fileSize });
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
      setDeleteTarget(null);
      // Server-side pagination: re-fetch the current page so counts stay correct.
      refresh();
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
      refresh();
    } catch (e) {
      toast(e.message || "Couldn't restore the file.", "error");
    } finally {
      setBusy(false);
    }
  }

  const columns = [
    {
      key: "file", label: "File", sortKey: "fileName",
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
      key: "owner", label: "Owner", sortKey: "ownerName",
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
    { key: "fileSize", label: "Size", sortKey: "fileSize", render: (f) => <Typography className="tnum" sx={{ color: tokens.textDim, fontSize: "0.84rem" }}>{formatBytes(f.fileSize)}</Typography> },
    { key: "visibility", label: "Visibility", render: (f) => <StatusChip value={f.visibility} /> },
    { key: "uploadedAt", label: "Uploaded", sortKey: "uploadedAt", render: (f) => <Typography sx={{ color: tokens.textDim, fontSize: "0.84rem" }}>{formatDateShort(f.uploadedAt)}</Typography> },
    {
      key: "actions", label: "", align: "right", width: 56,
      render: (f) => <IconButton size="small" onClick={(e) => openMenu(e, f)} sx={{ color: tokens.textFaint }}><MoreVertRounded fontSize="small" /></IconButton>,
    },
  ];

  const refreshButton = (
    <Tooltip title="Refresh table">
      <IconButton
        onClick={refresh}
        disabled={refreshing || loading}
        sx={{
          color: tokens.textDim,
          border: `1px solid ${tokens.border}`,
          borderRadius: "10px",
          "&:hover": { borderColor: tokens.borderStrong, color: tokens.text },
          animation: refreshing ? "spin 0.7s linear infinite" : "none",
          "@keyframes spin": { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } },
        }}
      >
        <RefreshRounded fontSize="small" />
      </IconButton>
    </Tooltip>
  );

  // Detect media by content type when the API provides it, falling back to the
  // filename extension. Either signal is enough.
  const previewFileName = preview?.fileName?.toLowerCase() || "";
  const previewType = preview?.contentType || "";

  const isVideo =
    previewType.startsWith("video/") ||
    previewFileName.endsWith(".mp4") ||
    previewFileName.endsWith(".webm") ||
    previewFileName.endsWith(".mov") ||
    previewFileName.endsWith(".avi") ||
    previewFileName.endsWith(".mkv");

  const isAudio =
    previewType.startsWith("audio/") ||
    previewFileName.endsWith(".mp3") ||
    previewFileName.endsWith(".wav") ||
    previewFileName.endsWith(".m4a");

  const isPdf =
    previewType === "application/pdf" ||
    previewFileName.endsWith(".pdf");

  // Plain-text branch (anything that isn't audio/video/pdf). For .txt files the
  // stored body is HTML from the rich-text editor, so strip it back to plain
  // text; everything else is shown exactly as received. The result renders in a
  // <pre> with white-space: pre-wrap, so line breaks and indentation survive and
  // nothing is ever interpreted as HTML or Markdown.
  const rawPreviewBody = preview?.content ?? "";
  const previewText =
    previewFileName.endsWith(".txt") && looksLikeHtml(rawPreviewBody)
      ? htmlToText(rawPreviewBody)
      : rawPreviewBody;
  const isEmptyPreview = previewText.trim().length === 0;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Administration" title="Files"
        subtitle={loading ? "Loading…" : `${meta.totalElements} file${meta.totalElements === 1 ? "" : "s"} across all users`}
        actions={refreshButton}
      />

      <DataTable
        columns={columns}
        rows={files}
        loading={loading}
        getRowKey={(f) => f.fileId}
        searchable
        searchPlaceholder="Search by file, owner, or email…"
        searchValue={search}
        onSearchChange={setSearch}
        sortField={sort.field}
        sortDirection={sort.direction}
        onSortChange={handleSort}
        serverMode
        empty={null}
      />
      <Pagination {...meta} onPageChange={goToPage} />

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
      <Dialog open={Boolean(preview)} onClose={() => setPreview(null)} maxWidth="md" fullWidth fullScreen={isMobile}>
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
          ) : isAudio ? (
            <audio controls controlsList="nodownload" style={{ width: "100%" }}>
              <source src={preview?.url} type={preview?.contentType} />
            </audio>
          ) : isVideo ? (
            <video controls controlsList="nodownload" style={{ width: "100%", maxHeight: 500 }}>
              <source src={preview?.url} type={preview?.contentType} />
            </video>
          ) : isPdf ? (
            <iframe
              title="PDF preview"
              src={preview?.url}
              style={{ width: "100%", height: isMobile ? "70vh" : 600, border: "none", borderRadius: 8 }}
            />
          ) : isEmptyPreview ? (
            <Typography sx={{ color: tokens.textFaint, fontSize: "0.9rem", py: 4, textAlign: "center" }}>
              Empty file
            </Typography>
          ) : (
            <Box component="pre" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word", color: tokens.text, fontSize: "0.9rem", lineHeight: 1.7, fontFamily: "inherit", m: 0, maxHeight: 460, overflowY: "auto" }}>
              {previewText}
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