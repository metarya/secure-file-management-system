import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Button,
  CircularProgress,
  TextField,
  Tooltip,
  Divider,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import CloseRounded from "@mui/icons-material/CloseRounded";
import DownloadRounded from "@mui/icons-material/DownloadRounded";
import EditRounded from "@mui/icons-material/EditRounded";
import SaveRounded from "@mui/icons-material/SaveRounded";
import DriveFileRenameOutlineRounded from "@mui/icons-material/DriveFileRenameOutlineRounded";
import InsertDriveFileRounded from "@mui/icons-material/InsertDriveFileRounded";

import FileEditor, { isEditableType } from "./editors/FileEditor";
import StatusChip from "../ui/StatusChip";
import HlsVideoPlayer from "./HlsVideoPlayer";
import { loadStoredUser } from "../../utils/auth";
import { renderMarkdown } from "../../api/markdownApi";

import { tokens } from "../../theme/theme";
import {
  formatBytes,
  formatDate,
  initials,
  avatarColor,
} from "../../utils/format";


export default function FilePreviewDialog({
  open,
  file,
  onClose,

  loadContent,

  canEdit = false,
  canRename = false,

  onDownload,
  onSaveContent,
  onRename,

  sharedMeta,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [content, setContent] = useState("");
  const [draft, setDraft] = useState("");

  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  const [saving, setSaving] = useState(false);

  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [previewData, setPreviewData] = useState(null);
  const [renderedMd, setRenderedMd] = useState("");

  useEffect(() => {
    if (!open || !file) return;

    setEditing(false);
    setRenaming(false);

    setNameDraft(file.fileName || "");

    let cancelled = false;

    (async () => {
      setLoading(true);

      try {
        // Pass fileName so loadContent (previewFile) can pick a correct MIME
        // when the server's Content-Type is generic.
        const result = await loadContent(file.fileId, file.fileName);

        if (result?.type === "text") {
          setContent(result.content || "");
          setDraft(result.content || "");
        }

        if (!cancelled) {
          setPreviewData(result);
        }
      } catch {
        if (!cancelled) {
          setContent("Couldn't load this file.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, file, loadContent]);

  // Markdown read-mode preview: render the stored Markdown to sanitized HTML via
  // the backend MarkdownService (never client-rendered). Only runs for .md while
  // not editing.
  useEffect(() => {
    const isMd = (file?.fileType || "").toLowerCase() === "md";
    if (!open || !file || editing || !isMd || previewData?.type !== "text") {
      setRenderedMd("");
      return;
    }
    let cancelled = false;
    renderMarkdown(content)
      .then((html) => {
        if (!cancelled) setRenderedMd(typeof html === "string" ? html : "");
      })
      .catch(() => {
        if (!cancelled) setRenderedMd("");
      });
    return () => {
      cancelled = true;
    };
  }, [open, file, editing, content, previewData]);

  if (!file) return null;

  async function saveContent() {
    setSaving(true);

    try {
      await onSaveContent(file.fileId, draft);

      setContent(draft);
      setEditing(false);
    } catch {
      // The parent already surfaced the error via a toast — keep the editor
      // open so the user's draft isn't lost.
    } finally {
      setSaving(false);
    }
  }


  async function commitRename() {
    const next = nameDraft.trim();

    if (!next || next === file.fileName) {
      setRenaming(false);
      return;
    }

    setSaving(true);

    try {
      await onRename(file.fileId, next);
      setRenaming(false);
    } catch {
      // The parent already surfaced the error via a toast — keep the rename
      // field open so the user can retry.
    } finally {
      setSaving(false);
    }
  }

  // Detect the media kind from the content type, falling back to the file's
  // extension (file.fileType) when the server sent a generic type.
  const fileExt = (file.fileType || file.fileName?.split(".").pop() || "").toLowerCase();
  const previewType = previewData?.contentType || "";
  const isMarkdownFile = fileExt === "md";

  const isAudio =
    previewType.startsWith("audio/") || ["mp3", "wav", "m4a"].includes(fileExt);
  const isVideo =
    previewType.startsWith("video/") ||
    ["mp4", "webm", "mov", "avi", "mkv"].includes(fileExt);
  const isPdf = previewType === "application/pdf" || fileExt === "pdf";

  return (
    <Dialog
      open={open}
  maxWidth="md"
  fullWidth
  fullScreen={isMobile}
  onClose={(event, reason) => {
    if (
      reason === "backdropClick" ||
      reason === "escapeKeyDown"
    ) {
      return;
    }

    onClose?.();
  }}
  slotProps={{
    paper: {
      sx: {
        backdropFilter: "blur(24px)",
        background: tokens.surfaceSolid,
        border: `1px solid ${tokens.border}`,
        borderRadius: "18px",
      },
    },
    backdrop: {
      sx: {
        backdropFilter: "blur(12px)",
        backgroundColor: "rgba(0,0,0,0.45)",
      },
    },
  }}
    >
      {/* Header */}

      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: 2,
          p: 3,
          pb: 2,
          borderBottom: `1px solid ${tokens.border}`,
        }}
      >
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: "12px",
            display: "grid",
            placeItems: "center",
            background: "rgba(129,140,248,0.16)",
            color: tokens.accent,
            flexShrink: 0,
          }}
        >
          <InsertDriveFileRounded />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          {renaming ? (
            <Box
              sx={{
                display: "flex",
                gap: 1,
                alignItems: "center",
              }}
            >
              <TextField
                size="small"
                autoFocus
                value={nameDraft}
                onChange={(e) =>
                  setNameDraft(e.target.value)
                }
                sx={{ flex: 1 }}
              />

              <Button
                size="small"
                variant="contained"
                onClick={commitRename}
              >
                Save
              </Button>
            </Box>
          ) : (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Typography
                noWrap
                sx={{
                  color: tokens.text,
                  fontWeight: 700,
                  fontSize: "1.1rem",
                }}
              >
                {file.fileName}
              </Typography>

              {canRename && (
                <Tooltip title="Rename">
                  <IconButton
                    size="small"
                    onClick={() =>
                      setRenaming(true)
                    }
                  >
                    <DriveFileRenameOutlineRounded
                      sx={{ fontSize: 17 }}
                    />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          )}

          <Box
            sx={{
              display: "flex",
              gap: 1.5,
              mt: 1,
              flexWrap: "wrap",
            }}
          >
            <StatusChip value={file.visibility} />

            <Typography
              sx={{
                color: tokens.textFaint,
                fontSize: "0.8rem",
              }}
            >
              {formatBytes(file.fileSize)}
            </Typography>

            <Typography
              sx={{
                color: tokens.textFaint,
                fontSize: "0.8rem",
              }}
            >
              · {formatDate(file.uploadedAt)}
            </Typography>
          </Box>

          {sharedMeta && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mt: 1,
              }}
            >
              <Box
                sx={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  bgcolor: avatarColor(
                    sharedMeta.ownerEmail
                  ),
                  display: "grid",
                  placeItems: "center",
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                {initials(
                  sharedMeta.ownerName,
                  sharedMeta.ownerEmail
                )}
              </Box>

              <Typography
                sx={{
                  color: tokens.textFaint,
                  fontSize: "0.8rem",
                }}
              >
                Shared by {sharedMeta.ownerName}
              </Typography>
            </Box>
          )}
        </Box>

        <IconButton onClick={onClose}>
          <CloseRounded />
        </IconButton>
      </Box>

      {/* Content */}

      <DialogContent sx={{ p: 3 }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        >
        {loading ? (
          <Box
            sx={{
              display: "grid",
              placeItems: "center",
              py: 8,
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <>
            {previewData?.type === "binary" ? (
              <>
                {isAudio && (
                  <audio
                    controls
                    controlsList="nodownload"
                    style={{
                      width: "100%",
                    }}
                  >
                    <source
                      src={previewData.url}
                      type={previewData.contentType}
                    />
                  </audio>
                )}
                {isVideo && (
                  <HlsVideoPlayer
                  fileId={file.fileId}
                  token={loadStoredUser()?.token}
                  />
                )}
                {isPdf && (
                  <iframe
                    title="PDF Preview"
                    src={previewData.url}
                    width="100%"
                    height="600"
                    style={{
                      border: "none",
                    }}
                  />
                )}
                {!isAudio && !isVideo && !isPdf && (
                  <Typography
                    sx={{
                      color: tokens.textFaint,
                      fontSize: "0.9rem",
                      py: 4,
                      textAlign: "center",
                    }}
                  >
                    Preview isn't available for this file type. Use Download to open it.
                  </Typography>
                )}
              </>
            ) : editing ? (
              <FileEditor
                fileType={file.fileType}
                value={draft}
                onChange={setDraft}
              />
            ) : isMarkdownFile ? (
              <Box
                className="fv-rich"
                // Trusted, server-sanitized HTML from MarkdownService only.
                dangerouslySetInnerHTML={{ __html: renderedMd }}
                sx={{
                  color: tokens.text,
                  fontSize: "0.95rem",
                  lineHeight: 1.7,
                  minHeight: 160,
                  maxHeight: 460,
                  overflowY: "auto",
                  overflowWrap: "anywhere",
                  p: 0.5,
                }}
              />
            ) : (
              <Box
                className="fv-rich"
                sx={{
                  color: tokens.text,
                  fontSize: "0.95rem",
                  lineHeight: 1.7,
                  minHeight: 160,
                  maxHeight: 460,
                  overflowY: "auto",
                  p: 0.5,
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                  minWidth: 0,
                  maxWidth: "100%",
                  fontFamily: "inherit",
                }}
              >
                {content}
              </Box>
            )}
          </>
        )}
      </DialogContent>

      {/* Footer */}

      <Divider sx={{ borderColor: tokens.border }} />

      <Box
        sx={{
          display: "flex",
          gap: 1,
          p: 2.5,
          justifyContent: "flex-end",
          flexWrap: "wrap",
        }}
      >
        <Button
          variant="outlined"
          startIcon={<DownloadRounded />}
          onClick={() => onDownload(file)}
        >
          Download
        </Button>

        {canEdit && isEditableType(file?.fileType) && !editing && (
          <Button
            variant="contained"
            startIcon={<EditRounded />}
            onClick={() => {
              setDraft(content);
              setEditing(true);
            }}
          >
            Edit Content
          </Button>
        )}

        {canEdit && isEditableType(file?.fileType) && editing && (
          <>
            <Button
              variant="outlined"
              onClick={() => {
                setEditing(false);
                setDraft(content);
              }}
            >
              Cancel
            </Button>

            <Button
              variant="contained"
              startIcon={<SaveRounded />}
              onClick={saveContent}
            >
              Save Content
            </Button>
          </>
        )}
      </Box>
    </Dialog>
  );
}