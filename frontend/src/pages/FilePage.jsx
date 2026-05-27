import { useEffect, useMemo, useState } from "react";import { Navigate } from "react-router-dom";
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
  Link
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
    "fileManagementUser"
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

function FilePage() {
  const [searchName, setSearchName] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFileName, setPreviewFileName] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [user] = useState(loadStoredUser);
  const {files, setFiles, sharedFiles, setSharedFiles, message, setMessage, refreshAllFiles} = useFiles();

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
        const response = await fetch(url, {
          headers: authHeaders(user?.token),
        });

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
    refreshAllFiles(
      loadMyFiles,
      loadSharedFiles,
      setMessage
    );
  }, []);

  async function previewFile(file) {
    const fileId = file.fileId || file.id;
    const fileName = file.fileName || file.name || "Preview file";

    try {
      setPreviewOpen(true);
      setPreviewFileName(fileName);
      setPreviewText("");
      setPreviewLoading(true);

      const response = await fetch(`${API_BASE_URL}/files/preview/${fileId}?userId=${user.userId}`, {
        headers: authHeaders(user?.token),
      });

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
      const response = await fetch(`${API_BASE_URL}/files/download/${fileId}?userId=${user.userId}`, {
        headers: authHeaders(user?.token),
      });

      if (!response.ok) {
        throw new Error("Download failed.");
      }

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
    if (!deleteLoading) {
      setDeleteTarget(null);
    }
  }
  async function confirmDeleteFile() {
    if (!deleteTarget) {
      return;
    }

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
          setSharedFiles((previousFiles) =>
            previousFiles.filter((sharedFile) => {
              const sharedFileId = sharedFile.fileId || sharedFile.id;
              return String(sharedFileId) !== String(fileId);
            })
          );

          setMessage(`Shared file removed from your list: ${fileName}`);
        } else {
          setFiles((previousFiles) =>
            previousFiles.filter((ownedFile) => {
              const ownedFileId = ownedFile.fileId || ownedFile.id;
              return String(ownedFileId) !== String(fileId);
            })
          );

          setMessage(`File deleted successfully: ${fileName}`);
        }

        setDeleteTarget(null);
        await refreshAllFiles(
          loadMyFiles,
          loadSharedFiles,
          setMessage,
        );
      } else {
        setMessage(`Remove failed. Status: ${response.status}. URL: ${deleteUrl}. Response: ${responseText || "No response text"}`);
      }
    } catch (error) {
      setMessage("Delete failed: " + error.message);
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleToggleVisibility(file) {
  try {
    const result =
      await toggleVisibility(
        user,
        file
      );

    if (result.response.ok) {
      await refreshAllFiles(
        loadMyFiles,
        loadSharedFiles,
        setMessage,
      );
    } else {
      console.error(
        result.data?.message ||
        "Visibility update failed"
      );
    }
  } catch (error) {
    console.error(error);
  }
  }

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

    if (!keyword) {
      return combinedFiles;
    }

    return combinedFiles.filter((file) =>
      String(file.fileName || file.name || "").toLowerCase().includes(keyword)
    );
  }, [combinedFiles, searchName]);

  if (!user?.userId || !user?.token) {
    sessionStorage.setItem("sfms_redirect_notice", "Please login first to access Files page.");
    return <Navigate to="/" replace />;
  }

  return (
    <Box
    sx={{
      minHeight: "100vh",
      backgroundColor: "#f3f4f6",
      p: 4,
    }}
  >
    <Paper
      elevation={0}
      sx={{
        maxWidth: "1250px",
        margin: "0 auto",
        borderRadius: "22px",
        p: 4,
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: "#111827",
          }}
        >
          Files
        </Typography>

        <Stack direction="row" spacing={2}>
          <Button
            href="/"
            variant="contained"
            disableElevation
            sx={{
              backgroundColor: "#e5e7eb",
              color: "#111827",
              borderRadius: "12px",
              px: 3,
              py: 1.2,
              fontWeight: 700,
              textTransform: "none",
              "&:hover": {
                backgroundColor: "#d1d5db",
              },
            }}
          >
            Back to Home
          </Button>

          <Button
            variant="contained"
            disableElevation
            onClick={() =>
              refreshAllFiles(
                loadMyFiles,
                loadSharedFiles,
                setMessage
              )
            }
            sx={{
              backgroundColor: "#e5e7eb",
              color: "#111827",
              borderRadius: "12px",
              px: 3,
              py: 1.2,
              fontWeight: 700,
              textTransform: "none",
              "&:hover": {
                backgroundColor: "#d1d5db",
              },
            }}
          >
            Refresh
          </Button>
        </Stack>
      </Box>

      {/* Search */}
      <TextField
        fullWidth
        placeholder="Search by file name"
        value={searchName}
        onChange={(event) => setSearchName(event.target.value)}
        variant="outlined"
        sx={{
          mb: 3,
          "& .MuiOutlinedInput-root": {
            borderRadius: "14px",
            backgroundColor: "#fafafa",
          },
        }}
      />

      {/* Message */}
      {message && (
        <Box sx={{ mb: 2 }}>
          <Typography
            sx={{
              color: "#374151",
              fontSize: "14px",
            }}
          >
            {message}
          </Typography>
        </Box>
      )}

      {/* Table */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: "18px",
          overflow: "hidden",
          border: "1px solid #e5e7eb",
        }}
      >
        <Table>
          <TableHead>
            <TableRow
              sx={{
                backgroundColor: "#f3f4f6",
              }}
            >
              <TableCell sx={{ fontWeight: 700 }}>File Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Visibility</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Uploaded At</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {displayedFiles.map((file, index) => {
              const visibility = file.displayVisibility;

              return (
                <TableRow
                  key={file.fileId || file.id || index}
                  hover
                >
                  <TableCell>
                    <Link
                      component="button"
                      underline="hover"
                      onClick={() => previewFile(file)}
                      sx={{
                        fontWeight: 700,
                        color: "#2563eb",
                        cursor: "pointer",
                      }}
                    >
                      {file.fileName || file.name}
                    </Link>
                  </TableCell>

                  <TableCell>
                    {file.description || "-"}
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={visibility}
                      sx={{
                        fontWeight: 700,
                        borderRadius: "999px",
                        px: 1,
                        backgroundColor:
                          visibility === "PUBLIC"
                            ? "#d1fae5"
                            : visibility === "PRIVATE"
                            ? "#fce7e7"
                            : "#dbeafe",
                        color:
                          visibility === "PUBLIC"
                            ? "#065f46"
                            : visibility === "PRIVATE"
                            ? "#991b1b"
                            : "#1e3a8a",
                      }}
                    />
                  </TableCell>

                  <TableCell>
                    {file.uploadedAt || file.createdAt || "-"}
                  </TableCell>

                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="contained"
                        disableElevation
                        onClick={() => downloadFile(file)}
                        sx={{
                          backgroundColor: "#e5e7eb",
                          color: "#111827",
                          borderRadius: "10px",
                          textTransform: "none",
                          fontWeight: 700,
                          "&:hover": {
                            backgroundColor: "#d1d5db",
                          },
                        }}
                      >
                        Download
                      </Button>

                      {file.sourceType !== "SHARED" ? (
                        <Button
                          variant="contained"
                          disableElevation
                          onClick={() =>
                            handleToggleVisibility(file)
                          }
                          sx={{
                            backgroundColor: "#e5e7eb",
                            color: "#111827",
                            borderRadius: "10px",
                            textTransform: "none",
                            fontWeight: 700,
                            "&:hover": {
                              backgroundColor: "#d1d5db",
                            },
                          }}
                        >
                          {visibility === "PUBLIC"
                            ? "Make PRIVATE"
                            : "Make PUBLIC"}
                        </Button>
                      ) : null}

                      <Button
                        variant="contained"
                        disableElevation
                        onClick={() => deleteFile(file)}
                        sx={{
                          backgroundColor: "#dc2626",
                          color: "#ffffff",
                          borderRadius: "10px",
                          textTransform: "none",
                          fontWeight: 700,
                          "&:hover": {
                            backgroundColor: "#b91c1c",
                          },
                        }}
                      >
                        {file.sourceType === "SHARED"
                          ? "Remove"
                          : "Delete"}
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Preview Modal */}
      {previewOpen && (
        <Box className="preview-modal-overlay">
          <Paper
            sx={{
              width: "700px",
              maxWidth: "95%",
              p: 3,
              borderRadius: "20px",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  {previewFileName}
                </Typography>

                <Typography
                  sx={{
                    color: "#6b7280",
                    fontSize: "14px",
                  }}
                >
                  Text file preview
                </Typography>
              </Box>

              <Button
                variant="contained"
                disableElevation
                onClick={() => setPreviewOpen(false)}
                sx={{
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
              }}
            >
              {previewLoading
                ? "Loading preview..."
                : previewText}
            </Box>
          </Paper>
        </Box>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <Box className="delete-confirm-modal-overlay">
          <Paper
            sx={{
              width: "450px",
              maxWidth: "95%",
              p: 4,
              borderRadius: "20px",
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, mb: 2 }}
            >
              {deleteTarget?.sourceType === "SHARED"
                ? "Remove Shared File"
                : "Delete File"}
            </Typography>

            <Typography sx={{ mb: 2 }}>
              {deleteTarget?.sourceType === "SHARED"
                ? "Remove this shared file from your list?"
                : "Are you sure you want to delete"}
              <strong>
                {" "}
                {deleteTarget.fileName ||
                  deleteTarget.name ||
                  "this file"}
              </strong>
              ?
            </Typography>

            <Typography
              sx={{
                color: "#6b7280",
                fontSize: "14px",
                mb: 3,
              }}
            >
              {deleteTarget?.sourceType === "SHARED"
                ? "This will only remove your access. The owner's original file will not be deleted."
                : "This action will permanently remove the file from your account."}
            </Typography>

            <Stack
              direction="row"
              spacing={2}
              justifyContent="flex-end"
            >
              <Button
                variant="contained"
                disableElevation
                onClick={cancelDeleteFile}
                disabled={deleteLoading}
                sx={{
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
