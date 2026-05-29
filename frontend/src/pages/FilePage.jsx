import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { toggleVisibility } from "../api/fileApi";
import useFiles from "../hooks/useFile";
import authHeaders from "../utils/authHeaders";
import {
  Box,
  Button,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Stack,
  Link,
  useMediaQuery,
  useTheme,
  Divider,
} from "@mui/material";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

function loadStoredUser() {
  const possibleKeys = [
    "sfmsUser",
    "sfms_user",
    "user",
    "loggedInUser",
    "currentUser",
    "authUser",
    "secureFileUser",
    "fileManagementUser",
  ];

  for (const key of possibleKeys) {
    const savedValue = localStorage.getItem(key);
    if (!savedValue) continue;

    try {
      const parsed = JSON.parse(savedValue);
      return {
        ...parsed,
        userId: parsed.userId ?? parsed.id ?? parsed.user?.userId ?? parsed.user?.id,
        email: parsed.email ?? parsed.user?.email,
        fullName: parsed.fullName ?? parsed.name ?? parsed.user?.fullName,
        token: parsed.token ?? parsed.jwt ?? parsed.accessToken ?? parsed.user?.token,
      };
    } catch {
      continue;
    }
  }

  return null;
}

/* ─── Visibility chip helper ─── */
function VisibilityChip({ visibility }) {
  const bg =
    visibility === "PUBLIC"
      ? "#d1fae5"
      : visibility === "PRIVATE"
      ? "#fce7e7"
      : "#dbeafe";
  const color =
    visibility === "PUBLIC"
      ? "#065f46"
      : visibility === "PRIVATE"
      ? "#991b1b"
      : "#1e3a8a";

  return (
    <Chip
      label={visibility}
      size="small"
      sx={{
        fontWeight: 700,
        borderRadius: "999px",
        px: 0.5,
        backgroundColor: bg,
        color,
        fontSize: "0.72rem",
      }}
    />
  );
}

/* ─── Mobile card for a single file ─── */
function FileCard({ file, onPreview, onDownload, onDelete, onToggleVisibility }) {
  const visibility = file.displayVisibility;

  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        p: 2,
        mb: 1.5,
        backgroundColor: "#fff",
      }}
    >
      {/* Name + badge row */}
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1, mb: 1 }}>
        <Link
          component="button"
          underline="hover"
          onClick={() => onPreview(file)}
          sx={{
            fontWeight: 700,
            color: "#2563eb",
            cursor: "pointer",
            textAlign: "left",
            fontSize: "0.95rem",
            wordBreak: "break-word",
            flex: 1,
          }}
        >
          {file.fileName || file.name}
        </Link>
        <VisibilityChip visibility={visibility} />
      </Box>

      {/* Description */}
      {file.description && (
        <Typography sx={{ fontSize: "0.82rem", color: "#6b7280", mb: 0.5 }}>
          {file.description}
        </Typography>
      )}

      {/* Uploaded date */}
      <Typography sx={{ fontSize: "0.78rem", color: "#9ca3af", mb: 1.5 }}>
        {file.uploadedAt || file.createdAt || "—"}
      </Typography>

      <Divider sx={{ mb: 1.5 }} />

      {/* Action buttons */}
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Button
          variant="contained"
          disableElevation
          size="small"
          onClick={() => onDownload(file)}
          sx={btnStyle()}
        >
          Download
        </Button>

        {file.sourceType !== "SHARED" && (
          <Button
            variant="contained"
            disableElevation
            size="small"
            onClick={() => onToggleVisibility(file)}
            sx={btnStyle()}
          >
            {visibility === "PUBLIC" ? "Make PRIVATE" : "Make PUBLIC"}
          </Button>
        )}

        <Button
          variant="contained"
          disableElevation
          size="small"
          onClick={() => onDelete(file)}
          sx={btnStyle("#dc2626", "#b91c1c", "#fff")}
        >
          {file.sourceType === "SHARED" ? "Remove" : "Delete"}
        </Button>
      </Stack>
    </Paper>
  );
}

function btnStyle(bg = "#e5e7eb", hover = "#d1d5db", color = "#111827") {
  return {
    backgroundColor: bg,
    color,
    borderRadius: "8px",
    textTransform: "none",
    fontWeight: 700,
    fontSize: "0.78rem",
    px: 1.5,
    py: 0.6,
    "&:hover": { backgroundColor: hover },
  };
}

/* ─── Main component ─── */
function FilePage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md")); // < 768 px → cards

  const [searchName, setSearchName] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFileName, setPreviewFileName] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [user] = useState(loadStoredUser);
  const { files, setFiles, sharedFiles, setSharedFiles, message, setMessage, refreshAllFiles } =
    useFiles();

  /* ── Data fetchers ── */
  async function loadMyFiles() {
    if (!user?.userId || !user?.token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/files/my-files?ownerId=${user.userId}`, {
        headers: authHeaders(user?.token),
      });
      const data = await response.json();
      if (response.ok) {
        setFiles(Array.isArray(data) ? data : []);
      } else {
        setMessage(data?.message || "Failed to load my files.");
      }
    } catch (error) {
      setMessage("Failed to load my files: " + error.message);
    }
  }

  async function loadSharedFiles() {
    if (!user?.userId || !user?.token) return;
    const possibleUrls = [
      `${API_BASE_URL}/files/shared-with-me`,
      `${API_BASE_URL}/files/shared-with-me?userId=${user.userId}`,
    ];
    for (const url of possibleUrls) {
      try {
        const response = await fetch(url, { headers: authHeaders(user?.token) });
        if (response.ok) {
          const data = await response.json();
          setSharedFiles(Array.isArray(data) ? data : []);
          return;
        }
      } catch {
        // Try next endpoint.
      }
    }
    setSharedFiles([]);
  }

  useEffect(() => {
    refreshAllFiles(loadMyFiles, loadSharedFiles, setMessage);
  }, []);

  /* ── Actions ── */
  async function previewFile(file) {
    const fileId = file.fileId || file.id;
    const fileName = file.fileName || file.name || "Preview file";
    try {
      setPreviewOpen(true);
      setPreviewFileName(fileName);
      setPreviewText("");
      setPreviewLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/files/preview/${fileId}?userId=${user.userId}`,
        { headers: authHeaders(user?.token) }
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Preview failed.");
      }
      const text = await response.text();
      setPreviewText(text || "File is empty.");
      setMessage("File preview loaded successfully.");
    } catch (error) {
      setPreviewText("Preview failed: " + error.message);
      setMessage("Preview failed: " + error.message);
    } finally {
      setPreviewLoading(false);
    }
  }

  async function downloadFile(file) {
    const fileId = file.fileId || file.id;
    try {
      const response = await fetch(
        `${API_BASE_URL}/files/download/${fileId}?userId=${user.userId}`,
        { headers: authHeaders(user?.token) }
      );
      if (!response.ok) throw new Error("Download failed.");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.fileName || file.name || "downloaded-file.txt";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setMessage("Download started successfully.");
    } catch (error) {
      setMessage("Download failed: " + error.message);
    }
  }

  function deleteFile(file) {
    setDeleteTarget(file);
  }

  function cancelDeleteFile() {
    if (!deleteLoading) setDeleteTarget(null);
  }

  async function confirmDeleteFile() {
    if (!deleteTarget) return;
    const file = deleteTarget;
    const fileId = file.fileId || file.id;
    const fileName = file.fileName || file.name || "this file";
    const isSharedFile = file.sourceType === "SHARED";
    const deleteUrl = isSharedFile
      ? `${API_BASE_URL}/files/remove-shared-entry/${fileId}`
      : `${API_BASE_URL}/files/${fileId}?userId=${user.userId}`;

    try {
      setDeleteLoading(true);
      const response = await fetch(deleteUrl, {
        method: "DELETE",
        headers: authHeaders(user?.token),
      });
      const responseText = await response.text();
      if (response.ok) {
        if (isSharedFile) {
          setSharedFiles((prev) =>
            prev.filter((f) => String(f.fileId || f.id) !== String(fileId))
          );
          setMessage(`Shared file removed from your list: ${fileName}`);
        } else {
          setFiles((prev) =>
            prev.filter((f) => String(f.fileId || f.id) !== String(fileId))
          );
          setMessage(`File deleted successfully: ${fileName}`);
        }
        setDeleteTarget(null);
        await refreshAllFiles(loadMyFiles, loadSharedFiles, setMessage);
      } else {
        setMessage(
          `Remove failed. Status: ${response.status}. URL: ${deleteUrl}. Response: ${responseText || "No response text"}`
        );
      }
    } catch (error) {
      setMessage("Delete failed: " + error.message);
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleToggleVisibility(file) {
    try {
      const result = await toggleVisibility(user, file);
      if (result.response.ok) {
        await refreshAllFiles(loadMyFiles, loadSharedFiles, setMessage);
      } else {
        console.error(result.data?.message || "Visibility update failed");
      }
    } catch (error) {
      console.error(error);
    }
  }

  /* ── Derived data ── */
  const combinedFiles = useMemo(() => {
    const owned = files.map((file) => ({
      ...file,
      sourceType: "OWNED",
      displayVisibility: String(file.visibility || "PRIVATE").toUpperCase(),
    }));
    const shared = sharedFiles.map((file) => ({
      ...file,
      sourceType: "SHARED",
      displayVisibility: "SHARED",
    }));
    return [...owned, ...shared];
  }, [files, sharedFiles]);

  const displayedFiles = useMemo(() => {
    const keyword = searchName.trim().toLowerCase();
    if (!keyword) return combinedFiles;
    return combinedFiles.filter((file) =>
      String(file.fileName || file.name || "").toLowerCase().includes(keyword)
    );
  }, [combinedFiles, searchName]);

  /* ── Auth guard ── */
  if (!user?.userId || !user?.token) {
    sessionStorage.setItem("sfms_redirect_notice", "Please login first to access Files page.");
    return <Navigate to="/" replace />;
  }

  /* ── Shared modal overlay sx ── */
  const overlayStyle = {
    position: "fixed",
    inset: 0,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    p: 2,
    backgroundColor: "rgba(0,0,0,0.45)",
    backdropFilter: "blur(4px)",
    zIndex: 9999,
  };

  /* ── Render ── */
  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#f3f4f6",
        px: { xs: 1, sm: 2, md: 3 },
        py: { xs: 2, sm: 3, md: 4 },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          maxWidth: "1250px",
          mx: "auto",
          borderRadius: { xs: "14px", sm: "18px", md: "22px" },
          p: { xs: 2, sm: 3, md: 4 },
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
        }}
      >
        {/* ── Header ── */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "stretch", sm: "center" },
            gap: 2,
            mb: 3,
          }}
        >
          <Typography
            sx={{
              fontSize: { xs: "1.7rem", sm: "2rem" },
              fontWeight: 700,
              color: "#111827",
              textAlign: { xs: "center", sm: "left" },
            }}
          >
            Files
          </Typography>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            <Button
              href="/"
              variant="contained"
              disableElevation
              sx={{
                width: { xs: "100%", sm: "auto" },
                backgroundColor: "#e5e7eb",
                color: "#111827",
                borderRadius: "12px",
                px: 3,
                py: 1.2,
                fontWeight: 700,
                textTransform: "none",
                "&:hover": { backgroundColor: "#d1d5db" },
              }}
            >
              Back to Home
            </Button>

            <Button
              variant="contained"
              disableElevation
              onClick={() => refreshAllFiles(loadMyFiles, loadSharedFiles, setMessage)}
              sx={{
                width: { xs: "100%", sm: "auto" },
                backgroundColor: "#e5e7eb",
                color: "#111827",
                borderRadius: "12px",
                px: 3,
                py: 1.2,
                fontWeight: 700,
                textTransform: "none",
                "&:hover": { backgroundColor: "#d1d5db" },
              }}
            >
              Refresh
            </Button>
          </Stack>
        </Box>

        {/* ── Search ── */}
        <TextField
          fullWidth
          size="small"
          placeholder="Search by file name"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          variant="outlined"
          sx={{
            mb: 2.5,
            "& .MuiOutlinedInput-root": {
              borderRadius: { xs: "10px", sm: "14px" },
              backgroundColor: "#fafafa",
            },
          }}
        />

        {/* ── Message ── */}
        {message && (
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ color: "#374151", fontSize: "14px", wordBreak: "break-word" }}>
              {message}
            </Typography>
          </Box>
        )}

        {/* ── MOBILE: Card list ── */}
        {isMobile ? (
          <Box>
            {displayedFiles.length === 0 ? (
              <Typography
                sx={{ textAlign: "center", color: "#9ca3af", py: 6, fontSize: "0.9rem" }}
              >
                No files found.
              </Typography>
            ) : (
              displayedFiles.map((file, index) => (
                <FileCard
                  key={file.fileId || file.id || index}
                  file={file}
                  onPreview={previewFile}
                  onDownload={downloadFile}
                  onDelete={deleteFile}
                  onToggleVisibility={handleToggleVisibility}
                />
              ))
            )}
          </Box>
        ) : (
          /* ── DESKTOP: Table ── */
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              borderRadius: "18px",
              overflowX: "auto",
              border: "1px solid #e5e7eb",
            }}
          >
            <Table sx={{ minWidth: 700 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f3f4f6" }}>
                  <TableCell sx={{ fontWeight: 700 }}>File Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Visibility</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Uploaded At</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {displayedFiles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6, color: "#9ca3af" }}>
                      No files found.
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedFiles.map((file, index) => {
                    const visibility = file.displayVisibility;
                    return (
                      <TableRow key={file.fileId || file.id || index} hover>
                        {/* File name */}
                        <TableCell sx={{ minWidth: 180, maxWidth: 300 }}>
                          <Link
                            component="button"
                            underline="hover"
                            onClick={() => previewFile(file)}
                            sx={{
                              fontWeight: 700,
                              color: "#2563eb",
                              cursor: "pointer",
                              display: "block",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {file.fileName || file.name}
                          </Link>
                        </TableCell>

                        {/* Description */}
                        <TableCell sx={{ maxWidth: 240 }}>
                          <Typography
                            sx={{
                              fontSize: "0.875rem",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: 240,
                            }}
                          >
                            {file.description || "—"}
                          </Typography>
                        </TableCell>

                        {/* Visibility chip */}
                        <TableCell>
                          <VisibilityChip visibility={visibility} />
                        </TableCell>

                        {/* Date */}
                        <TableCell sx={{ whiteSpace: "nowrap", fontSize: "0.875rem" }}>
                          {file.uploadedAt || file.createdAt || "—"}
                        </TableCell>

                        {/* Actions */}
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <Button
                              variant="contained"
                              disableElevation
                              size="small"
                              onClick={() => downloadFile(file)}
                              sx={btnStyle()}
                            >
                              Download
                            </Button>

                            {file.sourceType !== "SHARED" && (
                              <Button
                                variant="contained"
                                disableElevation
                                size="small"
                                onClick={() => handleToggleVisibility(file)}
                                sx={btnStyle()}
                              >
                                {visibility === "PUBLIC" ? "Make PRIVATE" : "Make PUBLIC"}
                              </Button>
                            )}

                            <Button
                              variant="contained"
                              disableElevation
                              size="small"
                              onClick={() => deleteFile(file)}
                              sx={btnStyle("#dc2626", "#b91c1c", "#fff")}
                            >
                              {file.sourceType === "SHARED" ? "Remove" : "Delete"}
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* ── Preview Modal ── */}
        {previewOpen && (
          <Box sx={overlayStyle}>
            <Paper
              sx={{
                width: { xs: "100%", sm: "90%", md: "700px" },
                maxWidth: "95vw",
                maxHeight: "90vh",
                overflow: "auto",
                p: { xs: 2, sm: 3 },
                borderRadius: { xs: "14px", sm: "20px" },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  justifyContent: "space-between",
                  alignItems: { xs: "stretch", sm: "center" },
                  gap: 2,
                  mb: 2,
                }}
              >
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    {previewFileName}
                  </Typography>
                  <Typography sx={{ color: "#6b7280", fontSize: "14px" }}>
                    Text file preview
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  disableElevation
                  onClick={() => setPreviewOpen(false)}
                  sx={{
                    width: { xs: "100%", sm: "auto" },
                    backgroundColor: "#e5e7eb",
                    color: "#111827",
                    borderRadius: "10px",
                    textTransform: "none",
                    fontWeight: 700,
                  }}
                >
                  Close
                </Button>
              </Box>

              <Box
                component="pre"
                sx={{
                  backgroundColor: "#f9fafb",
                  p: 2,
                  borderRadius: "12px",
                  overflowX: "auto",
                  maxHeight: "400px",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontSize: { xs: "0.78rem", sm: "0.875rem" },
                }}
              >
                {previewLoading ? "Loading preview..." : previewText}
              </Box>
            </Paper>
          </Box>
        )}

        {/* ── Delete / Remove Modal ── */}
        {deleteTarget && (
          <Box sx={overlayStyle}>
            <Paper
              sx={{
                width: { xs: "100%", sm: "450px" },
                maxWidth: "95vw",
                p: { xs: 2.5, sm: 4 },
                borderRadius: { xs: "14px", sm: "20px" },
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                {deleteTarget?.sourceType === "SHARED" ? "Remove Shared File" : "Delete File"}
              </Typography>

              <Typography sx={{ mb: 2 }}>
                {deleteTarget?.sourceType === "SHARED"
                  ? "Remove this shared file from your list?"
                  : "Are you sure you want to delete "}
                <strong>
                  {" "}
                  {deleteTarget.fileName || deleteTarget.name || "this file"}
                </strong>
                ?
              </Typography>

              <Typography sx={{ color: "#6b7280", fontSize: "14px", mb: 3 }}>
                {deleteTarget?.sourceType === "SHARED"
                  ? "This will only remove your access. The owner's original file will not be deleted."
                  : "This action will permanently remove the file from your account."}
              </Typography>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                justifyContent="flex-end"
              >
                <Button
                  variant="contained"
                  disableElevation
                  onClick={cancelDeleteFile}
                  disabled={deleteLoading}
                  sx={{
                    width: { xs: "100%", sm: "auto" },
                    backgroundColor: "#e5e7eb",
                    color: "#111827",
                    borderRadius: "10px",
                    textTransform: "none",
                    fontWeight: 700,
                  }}
                >
                  Cancel
                </Button>

                <Button
                  variant="contained"
                  disableElevation
                  onClick={confirmDeleteFile}
                  disabled={deleteLoading}
                  sx={{
                    width: { xs: "100%", sm: "auto" },
                    backgroundColor: "#dc2626",
                    color: "#ffffff",
                    borderRadius: "10px",
                    textTransform: "none",
                    fontWeight: 700,
                  }}
                >
                  {deleteLoading
                    ? "Processing..."
                    : deleteTarget?.sourceType === "SHARED"
                    ? "Remove Shared File"
                    : "Delete File"}
                </Button>
              </Stack>
            </Paper>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

export default FilePage;