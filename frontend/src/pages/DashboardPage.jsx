import { useEffect, useState } from "react";
import FileTable from "../components/tables/FileTable";
import authHeaders from "../utils/authHeaders";
import ShareErrorMessage from "../utils/shareErrorMessage";
import Upload from "../components/upload/Upload";
import ShareFile from "../components/share/ShareFile";
import {loadMyFiles, 
  loadSharedWithMe, 
  searchFiles, 
  downloadFile, 
  deleteFile, 
  toggleVisibility
} from "../api/fileApi";

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
  const [searchName, setSearchName] = useState("");

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

    const renamedFile = new File([File], finalFileName, {
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
        headers: authHeaders(user),
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
    if (!shareFileId.trim()) {
      setShareMessage("Please enter a file ID.");
      return;
    }

    if (!targetUserEmail.trim()) {
      setShareMessage("Please enter target user email.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/files/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(user)
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

  async function handledownloadFile(fileId) {
  try {
    const result = await downloadFile(
      user,
      fileId
    );

    const downloadUrl =
      window.URL.createObjectURL(result.blob);

    const link =
      document.createElement("a");

    link.href = downloadUrl;
    link.download = result.fileName;

    document.body.appendChild(link);

    link.click();

    link.remove();

    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    setDashboardMessage(
      "Download failed: " + error.message
    );
  }
  }

  async function handleDeleteFile(fileId) {
  const confirmed = window.confirm(
    "Are you sure you want to delete this file?"
  );

  if (!confirmed) return;

  try {
    const response = await deleteFile(
      user,
      fileId
    );

    if (response.ok) {
      fetchMyFilesData();
    } else {
      setDashboardMessage(
        "Delete failed."
      );
    }
  } catch (error) {
    setDashboardMessage(
      "Delete failed: " + error.message
    );
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
      fetchMyFilesData();
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

  return (
    <div>
      <header className="topbar">
        
        <h1 className="dashboard-title">File Management System</h1>
        <a className="btn secondary files-page-button" href="/files">
          Files
        </a>

        <button className="btn danger" onClick={logout}>Logout</button>
      </header>

      

      <main className="dashboard">
        {uploadNotification && (
          <div className="upload-notification">
            {uploadNotification}
          </div>
        )}

          <Upload
            FileName={FileName}
            setFileName={setFileName}
            FileDescription={FileDescription}
            setFileDescription={setFileDescription}
            setFile={setFile}
            uploadFile={uploadFile}
          />

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


        <section className="card wide-card home-my-files-section">
          <div className="section-header">
            <div>
              <h3>My Files</h3>
              <p className="muted">
                Metadata only. fileData and fileHash are not shown.
              </p>
            </div>
            <button className="btn secondary" onClick={loadMyFiles}>
              Refresh
            </button>
          </div>

          <div className="search-row">
            <input
              type="text"
              placeholder="Search by file name"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
            />
            
            
          </div>

          <FileTable
            files={files}
            downloadFile={handledownloadFile}
            deleteFile={handleDeleteFile}
            toggleVisibility={handleToggleVisibility}
          />
        </section>

      </main>
    </div>
  );
}