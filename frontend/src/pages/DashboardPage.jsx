import { useEffect, useState } from "react";
import authHeaders from "../utils/authHeaders";
import ShareErrorMessage from "../utils/shareErrorMessage";
import Upload from "../components/upload/Upload";
import ShareFile from "../components/share/ShareFile";
import {loadMyFiles, 
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
  Grid
} from "@mui/material";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8080/api";



export default function Dashboard({ user, logout }) {
  const [File, setFile] = useState(null);
  const [FileName, setFileName] = useState("");
  const [FileDescription, setFileDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [, setSharedFiles] = useState([]);
  const [sharedMessage, setSharedMessage] = useState("");

  useEffect(() => {
    if (!sharedMessage) return;

    const toastTimer = setTimeout(() => {
      setSharedMessage("");
    }, 3500);

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
        fetchMyFilesData()
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchName, user?.userId]);
  const [singleMessage, setSingleMessage] = useState("");
  const [uploadNotification, setUploadNotification] = useState("");

  useEffect(() => {
    if (!uploadNotification) {
      return;
    }

    const timer = setTimeout(() => {
      setUploadNotification("");
    }, 4000);

    return () => clearTimeout(timer);
  }, [uploadNotification]);
  
  useEffect(() => {
    if (!singleMessage) return;

    const toastTimer = setTimeout(() => {
      setSingleMessage("");
    }, 3500);

    return () => clearTimeout(toastTimer);
  }, [singleMessage]);
  const [multiMessage, setMultiMessage] = useState("");

  // Day 6 floating-toast auto-clear: multiMessage:setMultiMessage
  useEffect(() => {
    if (!multiMessage) return;

    const toastTimer = setTimeout(() => {
      setMultiMessage("");
    }, 3500);

    return () => clearTimeout(toastTimer);
  }, [multiMessage]);
  const [shareFileId, setShareFileId] = useState("");
  const [targetUserEmail, setTargetUserEmail] = useState("");
  const [permissionType, setPermissionType] = useState("VIEW");
  const [shareMessage, setShareMessage] = useState("");

  // Day 6 floating-toast auto-clear: shareMessage:setShareMessage
  useEffect(() => {
    if (!shareMessage) return;

    const toastTimer = setTimeout(() => {
      setShareMessage("");
    }, 3500);

    return () => clearTimeout(toastTimer);
  }, [shareMessage]);
  const [dashboardMessage, setDashboardMessage] = useState("");

  useEffect(() => {
    if (!dashboardMessage) return;

    const toastTimer = setTimeout(() => {
      setDashboardMessage("");
    }, 3500);

    return () => clearTimeout(toastTimer);
  }, [dashboardMessage]);

  useEffect(() => {
    fetchMyFilesData()
    fetchSharedFilesData()
  }, []);


  async function fetchMyFilesData() {
  try {
    const result = await loadMyFiles(user);

    if (result.ok) {
      setFiles(result.data);

      setDashboardMessage(
        result.data.length === 0
          ? "No owned files found."
          : "My Files refreshed successfully."
      );
    } else {
      setDashboardMessage(
        result.data?.message ||
        "Failed to load my files."
      );
    }
  } catch (error) {
    setDashboardMessage(
      "Failed to load files: " + error.message
    );
  }
  }
  
  async function fetchSharedFilesData() {
  try {
    const result = await loadSharedWithMe(user);

    if (result.ok) {
      setSharedFiles(result.data);

      setSharedMessage(
        result.data.length === 0
          ? "No files have been shared with you yet."
          : ""
      );
    } else {
      setSharedMessage(
        result.data?.message ||
        "Failed to load shared files."
      );
    }
  } catch (error) {
    setSharedMessage(
      "Failed to load shared files: " + error.message
    );
  }
  }

  async function searchFilesData() {
    if (!searchName.trim()) {
      fetchMyFilesData()
      return;
    }

    try {
      const result = await searchFiles(user, searchName);

      const data = await result.json();

      if (result.ok) {
        setFiles(data);
        setDashboardMessage(data.length === 0 ? "No owned files found." : "My Files refreshed successfully.");
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
          typeof finalFileName !== "undefined"
            ? finalFileName
            : File?.name || "file";

        setUploadNotification(`File uploaded successfully: ${uploadedName}`);
        setFile(null);
        setFileName("");
        setFileDescription("");
        fetchMyFilesData()

        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) {
          fileInput.value = "";
        }
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
          ...authHeaders(user?.token)
        },
        body: JSON.stringify({
          fileId: Number(shareFileId),
          targetUserEmail: targetUserEmail.trim(),
          permissionType
        })
      });

      const data = await response.json().catch(() => null);

      if (response.ok) {
        setShareMessage(response.ok ? (data?.message || "File shared successfully") : ShareErrorMessage(data?.message || data?.error, response.status));
        setDashboardMessage("Sharing permission updated successfully.");
        setShareFileId("");
        setTargetUserEmail("");
        fetchMyFilesData()
      } else {
        setShareMessage(response.ok ? (data?.message || "Share failed") : ShareErrorMessage(data?.message || data?.error, response.status));
      }
    } catch (error) {
      setShareMessage(ShareErrorMessage(error.message));
    }
  }

return (

  <Box
    sx={{
      backgroundColor: "#eef2f7",
      minHeight: "100vh"
    }}
  >

    {/* Navbar */}

    <AppBar
      position="static"
      sx={{
        background:
          "linear-gradient(90deg, #0b1020 0%, #16213e 100%)",

        boxShadow:
          "0 4px 20px rgba(0,0,0,0.15)"
      }}
    >

      <Toolbar
        sx={{
          minHeight:
            "90px !important",

          px: {
            xs: 2,
            sm: 4,
            md: 8
          },

          py: 4
        }}
      >

        <Typography
          variant="h2"
          sx={{
            flexGrow: 1,
            fontWeight: 600,

            fontSize: {
              xs: "2.5rem",
              md: "4rem"
            }
          }}
        >
          File Management System
        </Typography>

        <Button
          variant="contained"
          href="/files"
          sx={{
            mr: 2,
            backgroundColor: "#ffffff",
            color: "#111827",
            fontWeight: 700,
            px: 3,
            py: 1.2,
            borderRadius: 3,

            "&:hover": {
              backgroundColor: "#f3f4f6"
            }
          }}
        >
          Files
        </Button>

        <Button
          variant="contained"
          color="error"
          onClick={logout}
          sx={{
            fontWeight: 700,
            px: 3,
            py: 1.2,
            borderRadius: 3
          }}
        >
          Logout
        </Button>

      </Toolbar>

    </AppBar>

    {/* Main Dashboard */}

    <Container
      maxWidth={false}
      sx={{
        py: 5,

        px: {
          xs: 2,
          sm: 4,
          md: 6
        }
      }}
    >

      {/* Upload Notification */}

      {uploadNotification && (

        <Alert
          severity="success"
          sx={{
            mb: 4,
            borderRadius: 3
          }}
        >
          {uploadNotification}
        </Alert>

      )}

      {/* Top Cards */}

      <Grid
        container
        spacing={4}
        alignItems="stretch"
      >

        {/* Upload Card */}

        <Grid
          item
          xs={12}
          md={7}
          lg={6}
        >

          <Paper
            elevation={0}
            sx={{
              p: 5,
              borderRadius: 5,
              backgroundColor: "#ffffff",

              border:
                "1px solid #dbe2ea",

              height: "100%",

              boxShadow:
                "0 6px 18px rgba(15, 23, 42, 0.05)"
            }}
          >

            <Upload
              FileName={FileName}
              setFileName={setFileName}
              FileDescription={FileDescription}
              setFileDescription={setFileDescription}
              setFile={setFile}
              uploadFile={uploadFile}
            />

          </Paper>

        </Grid>

        {/* Share Card */}

        <Grid
          item
          xs={12}
          md={5}
          lg={4}
        >

          <Paper
            elevation={0}
            sx={{
              p: 5,
              borderRadius: 5,
              backgroundColor: "#ffffff",

              border:
                "1px solid #dbe2ea",

              height: "100%",

              boxShadow:
                "0 6px 18px rgba(15, 23, 42, 0.05)"
            }}
          >

            <ShareFile
              files={files}
              shareFileId={shareFileId}
              setShareFileId={setShareFileId}
              targetUserEmail={targetUserEmail}
              setTargetUserEmail={setTargetUserEmail}
              permissionType={permissionType}
              setPermissionType={setPermissionType}
              shareFileAccess={shareFileAccess}
              shareMessage={shareMessage}
            />

          </Paper>

        </Grid>

      </Grid>

    </Container>

  </Box>
);

}