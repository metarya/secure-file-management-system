import { useState, useEffect, useRef, useCallback } from "react";
import { Box, CircularProgress } from "@mui/material";

import RestoreRounded from "@mui/icons-material/RestoreRounded";
import DeleteForeverRounded from "@mui/icons-material/DeleteForeverRounded";
import RestoreFromTrashRounded from "@mui/icons-material/RestoreFromTrashRounded";

import AppShell from "../../components/ui/AppShell";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";
import FileCard from "../../components/files/FileCard";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";

import { loadStoredUser } from "../../utils/auth";
import {
  getDeletedFiles,
  restoreFile,
  permanentlyDeleteFile,
} from "../../api/fileApi";

/**
 * Recycle bin — the user's own soft-deleted files.
 *
 * Deleting a file from "My Files" soft-deletes it (sets is_deleted = true); the
 * row still exists, so it lands here. From this screen the owner can either
 * restore a file (back to My Files) or permanently delete it (row removed for
 * good — this is the only place a regular user can hard-delete their own file).
 *
 * Deleted files can't be previewed (the content endpoints reject them), so the
 * cards are intentionally not openable — only Restore / Delete forever.
 */
export default function RecycleBinPage() {
  const toast = useToast();

  // The owner id lives inside the stored user object (the same single source of
  // truth the rest of the app uses). Held in a ref so the async handlers always
  // read a stable value, mirroring DashboardPage.
  const userIdRef = useRef(loadStoredUser()?.userId);

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [restoreTarget, setRestoreTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const fetchFiles = useCallback(async () => {
    const ownerId = userIdRef.current;
    if (!ownerId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getDeletedFiles(ownerId);
      setFiles(Array.isArray(data) ? data : []);
    } catch (e) {
      toast(e.message || "Couldn't load the recycle bin.", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  async function confirmRestore() {
    setBusy(true);
    try {
      await restoreFile(restoreTarget.fileId, userIdRef.current);
      toast("File restored.", "success");
      // It's no longer deleted, so drop it from the recycle-bin list.
      setFiles((prev) => prev.filter((f) => f.fileId !== restoreTarget.fileId));
      setRestoreTarget(null);
    } catch (e) {
      toast(e.message || "Couldn't restore the file.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    setBusy(true);
    try {
      await permanentlyDeleteFile(deleteTarget.fileId, userIdRef.current);
      toast("File permanently deleted.", "success");
      setFiles((prev) => prev.filter((f) => f.fileId !== deleteTarget.fileId));
      setDeleteTarget(null);
    } catch (e) {
      toast(e.message || "Couldn't delete the file.", "error");
    } finally {
      setBusy(false);
    }
  }

  const cardActions = (file) => [
    {
      label: "Restore",
      icon: <RestoreRounded />,
      onClick: () => setRestoreTarget(file),
    },
    {
      label: "Delete forever",
      icon: <DeleteForeverRounded />,
      onClick: () => setDeleteTarget(file),
      danger: true,
    },
  ];

  return (
    <AppShell>
      <PageHeader
        eyebrow="Storage"
        title="Recycle bin"
        subtitle={
          loading
            ? "Loading…"
            : `${files.length} deleted file${files.length === 1 ? "" : "s"}`
        }
      />

      {loading ? (
        <Box sx={{ display: "grid", placeItems: "center", py: 10 }}>
          <CircularProgress />
        </Box>
      ) : files.length === 0 ? (
        <EmptyState
          icon={<RestoreFromTrashRounded sx={{ fontSize: 30 }} />}
          title="Recycle bin is empty"
          description="Files you delete land here. From here you can restore them or remove them for good."
        />
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(244px, 1fr))",
            gap: 2,
          }}
          className="fv-rise"
        >
          {files.map((file) => (
            <FileCard key={file.fileId} file={file} actions={cardActions(file)} />
          ))}
        </Box>
      )}

      {/* Restore — non-destructive */}
      <ConfirmDialog
        open={Boolean(restoreTarget)}
        title="Restore file"
        message={`"${restoreTarget?.fileName}" will be moved back to My Files.`}
        confirmLabel="Restore"
        loading={busy}
        icon={<RestoreRounded />}
        onConfirm={confirmRestore}
        onClose={() => setRestoreTarget(null)}
      />

      {/* Permanent delete — destructive, irreversible */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete forever"
        message={`"${deleteTarget?.fileName}" will be permanently deleted. This can't be undone.`}
        confirmLabel="Delete forever"
        destructive
        loading={busy}
        icon={<DeleteForeverRounded />}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </AppShell>
  );
}
