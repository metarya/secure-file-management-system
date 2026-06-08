import { useEffect, useState } from "react";
import authHeaders from "../utils/authHeaders";
import ShareErrorMessage from "../utils/shareErrorMessage";
import Upload from "../components/upload/Upload";
import ShareFile from "../components/share/ShareFile";
import {
  loadMyFiles,
  loadSharedWithMe,
  searchFiles,
} from "../api/fileApi";

import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Paper,
  Box,
  Alert,
  useMediaQuery,
  useTheme,
} from "@mui/material";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

export default function Dashboard({ user, logout }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm")); // < 600px
  const [activeTab, setActiveTab] = useState("upload"); // "upload" | "share"

  const [File, setFile] = useState(null);
  const [FileName, setFileName] = useState("");
  const [FileDescription, setFileDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [sharedFiles, setSharedFiles] = useState([]);
  const [sharedMessage, setSharedMessage] = useState("");

  useEffect(() => {
    if (!sharedMessage) return;
    const toastTimer = setTimeout(() => setSharedMessage(""), 3500);
    return () => clearTimeout(toastTimer);
  }, [sharedMessage]);

  const [searchName] = useState("");

  useEffect(() => {
    if (!user?.userId) return;
    const timer = setTimeout(() => {
      const keyword = (searchName || "").trim();
      if (keyword) {
        searchFilesData();
      } else {
        fetchMyFilesData();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchName, user?.userId]);

  const [singleMessage, setSingleMessage] = useState("");
  const [uploadNotification, setUploadNotification] = useState("");

  useEffect(() => {
    if (!uploadNotification) return;
    const timer = setTimeout(() => setUploadNotification(""), 4000);
    return () => clearTimeout(timer);
  }, [uploadNotification]);

  useEffect(() => {
    if (!singleMessage) return;
    const toastTimer = setTimeout(() => setSingleMessage(""), 3500);
    return () => clearTimeout(toastTimer);
  }, [singleMessage]);

  const [multiMessage, setMultiMessage] = useState("");

  useEffect(() => {
    if (!multiMessage) return;
    const toastTimer = setTimeout(() => setMultiMessage(""), 3500);
    return () => clearTimeout(toastTimer);
  }, [multiMessage]);

  const [shareFileId, setShareFileId] = useState("");
  const [targetUserEmail, setTargetUserEmail] = useState("");
  const [permissionType, setPermissionType] = useState("VIEW");
  const [shareMessage, setShareMessage] = useState("");

  useEffect(() => {
    if (!shareMessage) return;
    const toastTimer = setTimeout(() => setShareMessage(""), 3500);
    return () => clearTimeout(toastTimer);
  }, [shareMessage]);

  const [dashboardMessage, setDashboardMessage] = useState("");

  useEffect(() => {
    if (!dashboardMessage) return;
    const toastTimer = setTimeout(() => setDashboardMessage(""), 3500);
    return () => clearTimeout(toastTimer);
  }, [dashboardMessage]);

  useEffect(() => {
    fetchMyFilesData();
    fetchSharedFilesData();
  }, []);

  async function fetchMyFilesData() {
    try {
      const result = await loadMyFiles(user);
      if (result.ok) {
        setFiles(result.data);
        if (result.data.length === 0) {
          setDashboardMessage("No owned files found.");
        }
      } else {
        setDashboardMessage(result.data?.message || "Failed to load my files.");
      }
    } catch (error) {
      setDashboardMessage("Failed to load files: " + error.message);
    }
  }

  async function fetchSharedFilesData() {
    try {
      const result = await loadSharedWithMe(user);
      if (result.ok) {
        setSharedFiles(result.data);
        setSharedMessage(
          result.data.length === 0 ? "No files have been shared with you yet." : ""
        );
      } else {
        setSharedMessage(result.data?.message || "Failed to load shared files.");
      }
    } catch (error) {
      setSharedMessage("Failed to load shared files: " + error.message);
    }
  }

  async function searchFilesData() {
    if (!searchName.trim()) {
      fetchMyFilesData();
      return;
    }
    try {
      const result = await searchFiles(user, searchName);
      const data = await result.json();
      if (result.ok) {
        setFiles(data);
        if (data.length === 0) setDashboardMessage("No owned files found.");
      } else {
        setDashboardMessage(data?.message || "Failed to load my files.");
      }
    } catch (error) {
      setDashboardMessage("Search failed: " + error.message);
    }
  }

  async function uploadFile() {
    if (!File) {
      setSingleMessage("Please select one .txt file.");
      return;
    }

    const enteredFileName = FileName.trim();
    if (!enteredFileName) {
      setSingleMessage("Please enter a file name.");
      return;
    }

    const safeFileName = enteredFileName
      .replace(/[\\/:*?"<>|]/g, "-")
      .replace(/\s+/g, " ")
      .trim();

    const finalFileName = safeFileName.toLowerCase().endsWith(".txt")
      ? safeFileName
      : `${safeFileName}.txt`;

    const renamedFile = new window.File([File], finalFileName, {
      type: File.type || "text/plain",
      lastModified: File.lastModified,
    });

    const formData = new FormData();
    formData.append("file", renamedFile);
    formData.append("ownerId", user.userId);
    formData.append("description", FileDescription.trim());

    try {
      const response = await fetch(`${API_BASE_URL}/files/upload`, {
        method: "POST",
        headers: authHeaders(user?.token),
        body: formData,
      });

      const text = await response.text();
      setSingleMessage(response.ok ? "File uploaded successfully." : text);

      if (response.ok) {
        const uploadedName =
          typeof finalFileName !== "undefined" ? finalFileName : File?.name || "file";
        setUploadNotification(`File uploaded successfully: ${uploadedName}`);
        setFile(null);
        setFileName("");
        setFileDescription("");
        fetchMyFilesData();

        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = "";
      }
    } catch (error) {
      setSingleMessage("Upload failed: " + error.message);
    }
  }

  async function shareFileAccess() {
    if (!targetUserEmail.trim()) {
      setShareMessage("Please enter target user email.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/files/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(user?.token),
        },
        body: JSON.stringify({
          fileId: Number(shareFileId),
          targetUserEmail: targetUserEmail.trim(),
          permissionType,
        }),
      });

      const data = await response.json().catch(() => null);

      if (response.ok) {
        setShareMessage(
          data?.message ||
            ShareErrorMessage(data?.message || data?.error, response.status)
        );
        setDashboardMessage("Sharing permission updated successfully.");
        setShareFileId("");
        setTargetUserEmail("");
        fetchMyFilesData();
      } else {
        setShareMessage(
          ShareErrorMessage(data?.message || data?.error, response.status)
        );
      }
    } catch (error) {
      setShareMessage(ShareErrorMessage(error.message));
    }
  }

  /* ─── Toggle button style helper ─── */
  function tabBtn(tab) {
    const active = activeTab === tab;
    return {
      flex: 1,
      fontWeight: 700,
      fontSize: { xs: "0.85rem", sm: "0.95rem" },
      textTransform: "none",
      borderRadius: "10px",
      py: 1.1,
      transition: "all 0.2s ease",
      backgroundColor: active ? "#3b5bdb" : "transparent",
      color: active ? "#fff" : "#6b7280",
      boxShadow: active ? "0 2px 10px rgba(59,91,219,0.3)" : "none",
      "&:hover": {
        backgroundColor: active ? "#3451c7" : "#f3f4f6",
      },
    };
  }

  return (
    <Box sx={{ backgroundColor: "#eef2f7", minHeight: "100dvh" }}>
      {/* ── AppBar ── */}
      <AppBar
        position="static"
        sx={{
          background: "linear-gradient(90deg, #0b1020 0%, #16213e 100%)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        }}
      >
        <Toolbar
          sx={{
            minHeight: { xs: "auto", md: "90px" },
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "stretch", md: "center" },
            gap: { xs: 1.5, md: 0 },
            px: { xs: 2, sm: 3, md: 8 },
            py: { xs: 2, md: 0 },
          }}
        >
          <Typography
            variant="h2"
            sx={{
              flexGrow: 1,
              fontWeight: 600,
              fontSize: { xs: "1.35rem", sm: "1.75rem", md: "2.8rem" },
              textAlign: { xs: "center", md: "left" },
              lineHeight: 1.2,
              letterSpacing: "-0.01em",
            }}
          >
            File Management System
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              width: { xs: "100%", md: "auto" },
              gap: { xs: 1, sm: 2 },
            }}
          >
            <Button
              variant="contained"
              href="/files"
              fullWidth={isMobile}
              sx={{
                backgroundColor: "#ffffff",
                color: "#111827",
                fontWeight: 700,
                px: { xs: 2, sm: 3 },
                py: { xs: 1, sm: 1.2 },
                borderRadius: 3,
                fontSize: { xs: "0.82rem", sm: "0.9rem" },
                "&:hover": { backgroundColor: "#f3f4f6" },
              }}
            >
              Files
            </Button>

            <Button
              variant="contained"
              color="error"
              onClick={logout}
              fullWidth={isMobile}
              sx={{
                fontWeight: 700,
                px: { xs: 2, sm: 3 },
                py: { xs: 1, sm: 1.2 },
                borderRadius: 3,
                fontSize: { xs: "0.82rem", sm: "0.9rem" },
              }}
            >
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* ── Main content ── */}
      <Container
        maxWidth={false}
        sx={{
          py: { xs: 3, md: 6 },
          px: { xs: 1.5, sm: 3, md: 6 },
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Alerts */}
        <Box sx={{ width: "100%", maxWidth: "520px", mb: 2 }}>
          {uploadNotification && (
            <Alert severity="success" sx={{ mb: 1.5, borderRadius: 3 }}>
              {uploadNotification}
            </Alert>
          )}
          {dashboardMessage && (
            <Alert severity="info" sx={{ mb: 1.5, borderRadius: 3 }}>
              {dashboardMessage}
            </Alert>
          )}
        </Box>

        {/* ── Single centered card ── */}
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: "520px",
            borderRadius: { xs: "20px", sm: "24px" },
            border: "1px solid #dbe2ea",
            boxShadow: "0 8px 32px rgba(15, 23, 42, 0.08)",
            overflow: "hidden",
          }}
        >
          {/* Toggle strip */}
          <Box
            sx={{
              display: "flex",
              gap: 0.5,
              p: 1,
              backgroundColor: "#f3f4f6",
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            <Button
              disableElevation
              onClick={() => setActiveTab("upload")}
              sx={tabBtn("upload")}
            >
              📤 File Upload
            </Button>
            <Button
              disableElevation
              onClick={() => setActiveTab("share")}
              sx={tabBtn("share")}
            >
              🔗 Share File
            </Button>
          </Box>

          {/* Panel */}
          <Box sx={{ p: { xs: 3, sm: 4 } }}>
            {activeTab === "upload" ? (
              <Upload
                FileName={FileName}
                setFileName={setFileName}
                FileDescription={FileDescription}
                setFileDescription={setFileDescription}
                setFile={setFile}
                uploadFile={uploadFile}
              />
            ) : (
              <ShareFile
                files={[...files, ...sharedFiles]}
                shareFileId={shareFileId}
                setShareFileId={setShareFileId}
                targetUserEmail={targetUserEmail}
                setTargetUserEmail={setTargetUserEmail}
                permissionType={permissionType}
                setPermissionType={setPermissionType}
                shareFileAccess={shareFileAccess}
                shareMessage={shareMessage}
              />
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}