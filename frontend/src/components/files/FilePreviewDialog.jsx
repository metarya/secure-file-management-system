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
} from "@mui/material";

import CloseRounded from "@mui/icons-material/CloseRounded";
import DownloadRounded from "@mui/icons-material/DownloadRounded";
import EditRounded from "@mui/icons-material/EditRounded";
import SaveRounded from "@mui/icons-material/SaveRounded";
import DriveFileRenameOutlineRounded from "@mui/icons-material/DriveFileRenameOutlineRounded";
import InsertDriveFileRounded from "@mui/icons-material/InsertDriveFileRounded";

import RichTextEditor from "./RichTextEditor";
import StatusChip from "../ui/StatusChip";

import { tokens } from "../../theme/theme";
import {
  formatBytes,
  formatDate,
  initials,
  avatarColor,
} from "../../utils/format";

const looksLikeHtml = (s = "") => /<[a-z][\s\S]*>/i.test(s);


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
  const [content, setContent] = useState("");
  const [draft, setDraft] = useState("");

  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  const [saving, setSaving] = useState(false);

  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  useEffect(() => {
    if (!open || !file) return;

    setEditing(false);
    setRenaming(false);

    setNameDraft(file.fileName || "");

    let cancelled = false;

    (async () => {
      setLoading(true);

      try {
        const text = await loadContent(file.fileId);

        if (!cancelled) {
          setContent(text || "");
          setDraft(text || "");
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

  if (!file) return null;

  async function saveContent() {
    setSaving(true);

    try {
      await onSaveContent(file.fileId, draft);

      setContent(draft);
      setEditing(false);
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
    } finally {
      setSaving(false);
    }
  }

  const renderedHtml = looksLikeHtml(content)
    ? content
    : `<pre style="white-space:pre-wrap;font-family:inherit;margin:0">${(
        content || ""
      )
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")}</pre>`;

  return (
    <Dialog
      open={open}
  maxWidth="md"
  fullWidth
  PaperProps={{
  sx: {
    backdropFilter: "blur(24px)",
    background:
      "rgba(15,23,42,0.92)",
    border: `1px solid ${tokens.border}`,
    borderRadius: "18px",
  },
}}
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
            {editing ? (
              <RichTextEditor
                initialValue={content}
                onChange={setDraft}
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
                }}
                dangerouslySetInnerHTML={{
                  __html: renderedHtml,
                }}
              />
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

        {canEdit && !editing && (
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

        {canEdit && editing && (
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