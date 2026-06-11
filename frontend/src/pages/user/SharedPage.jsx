import { useCallback, useEffect, useState } from "react";
import { Box, CircularProgress } from "@mui/material";
import OpenInFullRounded from "@mui/icons-material/OpenInFullRounded";
import DownloadRounded from "@mui/icons-material/DownloadRounded";
import RemoveCircleOutlineRounded from "@mui/icons-material/RemoveCircleOutlineRounded";
import ShareRounded from "@mui/icons-material/ShareRounded";

import AppShell from "../../components/ui/AppShell";
import PageHeader from "../../components/ui/PageHeader";
import FileCard from "../../components/files/FileCard";
import EmptyState from "../../components/ui/EmptyState";
import FilePreviewDialog from "../../components/files/FilePreviewDialog";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/Toast";
import {
  getSharedWithMe, downloadFile, previewFile, updateFileContent, removeSharedFileFromMyList,
} from "../../api/fileApi";

function triggerDownload(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = fileName;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

export default function SharedPage() {
  const toast = useToast();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewTarget, setPreviewTarget] = useState(null);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removing, setRemoving] = useState(false);

  const fetchShared = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSharedWithMe();
      setFiles(Array.isArray(data) ? data : []);
    } catch (e) {
      toast(e.message || "Couldn't load shared files.", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchShared(); }, [fetchShared]);

  async function handleDownload(file) {
    try {
      const { blob, fileName } = await downloadFile(file.fileId, file.fileName);
      triggerDownload(blob, fileName);
    } catch (e) {
      toast(e.message || "Download failed. You may only have view access.", "error");
    }
  }

  async function handleSaveContent(fileId, html) {
    await updateFileContent(fileId, html);
    toast("Changes saved.", "success");
  }

  async function confirmRemove() {
    setRemoving(true);
    try {
      await removeSharedFileFromMyList(removeTarget.fileId);
      toast("Removed from your shared list.", "success");
      setFiles((prev) => prev.filter((f) => f.fileId !== removeTarget.fileId));
      setRemoveTarget(null);
    } catch (e) {
      toast(e.message || "Couldn't remove the file.", "error");
    } finally {
      setRemoving(false);
    }
  }

  const cardActions = (file) => {
    const isEditor = String(file.permissionType || "").toUpperCase() === "EDITOR";
    return [
      { label: isEditor ? "Open & edit" : "Open", icon: <OpenInFullRounded />, onClick: () => setPreviewTarget(file) },
      { label: "Download", icon: <DownloadRounded />, onClick: () => handleDownload(file) },
      { label: "Remove from my list", icon: <RemoveCircleOutlineRounded />, onClick: () => setRemoveTarget(file), danger: true },
    ];
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Collaboration"
        title="Shared with me"
        subtitle={loading ? "Loading…" : `${files.length} file${files.length === 1 ? "" : "s"} shared with you`}
      />

      {loading ? (
        <Box sx={{ display: "grid", placeItems: "center", py: 10 }}><CircularProgress /></Box>
      ) : files.length === 0 ? (
        <EmptyState
          icon={<ShareRounded sx={{ fontSize: 30 }} />}
          title="Nothing shared yet"
          description="When someone shares a file with you, it'll show up here."
        />
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(244px, 1fr))", gap: 2 }} className="fv-rise">
          {files.map((file) => (
            <FileCard
              key={file.permissionId || file.fileId}
              file={file}
              onOpen={() => setPreviewTarget(file)}
              actions={cardActions(file)}
              meta={`Shared by ${file.ownerName || file.ownerEmail}`}
            />
          ))}
        </Box>
      )}

      <FilePreviewDialog
        open={Boolean(previewTarget)}
        file={previewTarget}
        onClose={() => setPreviewTarget(null)}
        loadContent={previewFile}
        canEdit={String(previewTarget?.permissionType || "").toUpperCase() === "EDITOR"}
        canRename={false}
        onDownload={handleDownload}
        onSaveContent={handleSaveContent}
        sharedMeta={previewTarget ? {
          ownerName: previewTarget.ownerName,
          ownerEmail: previewTarget.ownerEmail,
          permissionType: previewTarget.permissionType,
        } : undefined}
      />
      <ConfirmDialog
        open={Boolean(removeTarget)}
        title="Remove shared file"
        message={`"${removeTarget?.fileName}" will be removed from your shared list. The owner keeps the original.`}
        confirmLabel="Remove"
        destructive
        loading={removing}
        icon={<RemoveCircleOutlineRounded />}
        onConfirm={confirmRemove}
        onClose={() => setRemoveTarget(null)}
      />
    </AppShell>
  );
}
