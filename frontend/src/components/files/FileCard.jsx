import { useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Popover,
  TextField,
  Button,
} from "@mui/material";

import MoreVertRounded from "@mui/icons-material/MoreVertRounded";
import InsertDriveFileRounded from "@mui/icons-material/InsertDriveFileRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import StatusChip from "../ui/StatusChip";
import { tokens } from "../../theme/theme";
import {
  formatBytes,
  formatDateShort,
  fileTypeLabel,
} from "../../utils/format";

/**
 * actions: [{ label, icon, onClick, danger }]
 * meta: optional small line (e.g. "Shared by Jane")
 */
export default function FileCard({
  file,
  onOpen,
  actions = [],
  meta,
  onUpdateDescription,
}) {
  const [anchor, setAnchor] = useState(null);

  const [descAnchor, setDescAnchor] = useState(null);

  const [description, setDescription] = useState(
    file.description || ""
  );

  const [savingDescription, setSavingDescription] =
    useState(false);

  async function handleSaveDescription() {
    if (!onUpdateDescription) return;

    try {
      setSavingDescription(true);

      await onUpdateDescription(
        file.fileId,
        description
      );

      setDescAnchor(null);
    } finally {
      setSavingDescription(false);
    }
  }

  return (
    <Box
      sx={{
        position: "relative",
        borderRadius: "16px",
        p: 2.25,
        height: "100%",
        background: tokens.surface,
        border: `1px solid ${tokens.border}`,
        backdropFilter: "blur(14px)",
        boxShadow: tokens.shadow,
        transition:
          "border-color 0.18s, transform 0.18s, box-shadow 0.18s",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",

        "&:hover": {
          borderColor: tokens.borderStrong,
          transform: "translateY(-2px)",
          boxShadow: tokens.shadowHover,
        },
      }}
      onClick={() => onOpen?.(file)}
    >
      {/* Header */}

      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          mb: 1.5,
        }}
      >
        <Box
          sx={{
            position: "relative",
            width: 42,
            height: 42,
            borderRadius: "12px",
            display: "grid",
            placeItems: "center",
            background:
              "rgba(129,140,248,0.14)",
            color: tokens.accent,
          }}
        >
          <InsertDriveFileRounded
            sx={{ fontSize: 22 }}
          />

          <Box
            className="tnum"
            sx={{
              position: "absolute",
              bottom: -7,
              right: -7,
              fontSize: "0.56rem",
              fontWeight: 700,
              px: 0.5,
              py: 0.1,
              borderRadius: "5px",
              background: "rgba(99,102,241,0.16)",
              border: "1px solid rgba(99,102,241,0.30)",
              color: tokens.accent,
            }}
          >
            {fileTypeLabel(file.fileName)}
          </Box>
        </Box>

        {actions.length > 0 && (
          <>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setAnchor(e.currentTarget);
              }}
              sx={{
                color: tokens.textFaint,
                mt: -0.5,
                mr: -0.5,
              }}
            >
              <MoreVertRounded fontSize="small" />
            </IconButton>

            <Menu
              anchorEl={anchor}
              open={Boolean(anchor)}
              onClose={(e) => {
                e?.stopPropagation?.();
                setAnchor(null);
              }}
              onClick={(e) =>
                e.stopPropagation()
              }
              transformOrigin={{
                horizontal: "right",
                vertical: "top",
              }}
              anchorOrigin={{
                horizontal: "right",
                vertical: "bottom",
              }}
            >
              {actions.map((action) => (
                <MenuItem
                  key={action.label}
                  onClick={() => {
                    setAnchor(null);
                    action.onClick(file);
                  }}
                  sx={{
                    gap: 1.25,
                    fontSize: "0.86rem",
                    color: action.danger
                      ? tokens.danger
                      : tokens.text,
                  }}
                >
                  <Box
                    sx={{
                      display: "grid",
                      placeItems: "center",

                      "& svg": {
                        fontSize: 18,
                      },
                    }}
                  >
                    {action.icon}
                  </Box>

                  {action.label}
                </MenuItem>
              ))}
            </Menu>
          </>
        )}
      </Box>

      {/* File Name */}

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          mb: 1.5,
        }}
      >
        <Tooltip title={file.fileName}>
          <Typography
            noWrap
            sx={{
              color: tokens.text,
              fontWeight: 600,
              fontSize: "0.95rem",
              flex: 1,
            }}
          >
            {file.fileName}
          </Typography>
        </Tooltip>

        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            setDescAnchor(e.currentTarget);
          }}
          sx={{
            color: tokens.textFaint,

            "&:hover": {
              color: tokens.accent,
            },
          }}
        >
          <InfoOutlinedIcon
            sx={{ fontSize: 16 }}
          />
        </IconButton>
      </Box>

      {/* Footer */}

      <Box
        sx={{
          mt: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <StatusChip value={file.visibility} />

        <Typography
          className="tnum"
          sx={{
            color: tokens.textFaint,
            fontSize: "0.74rem",
          }}
        >
          {formatBytes(file.fileSize)} ·{" "}
          {formatDateShort(file.uploadedAt)}
        </Typography>
      </Box>

      {meta && (
        <Typography
          sx={{
            color: tokens.textFaint,
            fontSize: "0.72rem",
            mt: 1,
          }}
        >
          {meta}
        </Typography>
      )}

      {/* Description Popover */}

      <Popover
        open={Boolean(descAnchor)}
        anchorEl={descAnchor}
        onClose={() => setDescAnchor(null)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
      >
        <Box
          sx={{
            p: 2,
            width: 320,
          }}
          onClick={(e) =>
            e.stopPropagation()
          }
        >
          <Typography
            sx={{
              mb: 1,
              fontWeight: 700,
              color: tokens.text,
            }}
          >
            Description
          </Typography>

          <TextField
            fullWidth
            multiline
            minRows={4}
            value={description}
            onChange={(e) =>
              setDescription(
                e.target.value
              )
            }
            placeholder="Enter file description..."
          />

          <Button
            sx={{ mt: 1.5 }}
            variant="contained"
            onClick={
              handleSaveDescription
            }
            disabled={
              savingDescription
            }
          >
            {savingDescription
              ? "Saving..."
              : "Save Description"}
          </Button>
        </Box>
      </Popover>
    </Box>
  );
}