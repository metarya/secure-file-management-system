import { useEffect, useMemo, useState } from "react";import { Navigate } from "react-router-dom";
import { toggleVisibility } from "../api/fileApi";
import useFiles from "../hooks/useFile";
import authHeaders from "../utils/authHeaders";
import FileTable from "../components/tables/FileTable";

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
    <main className="dashboard">
      <section className="card wide-card">
        <div className="section-header">
          <div>
            <h3>Files</h3>
          </div>

          <div className="file-page-actions">
            <a className="btn secondary back-home-button" href="/">
              Back to Home
            </a>

            <button className="btn secondary" onClick={refreshAllFiles}>
              Refresh
            </button>
          </div>
        </div>

        <div className="search-row">
          <input
            type="text"
            placeholder="Search by file name"
            value={searchName}
            onChange={(event) => setSearchName(event.target.value)}
          />
        </div>

        {message && <div className="message">{message}</div>}

        <FileTable
          files={displayedFiles}
          previewFile={previewFile}
          downloadFile={downloadFile}
          deleteFile={deleteFile}
          toggleVisibility={handleToggleVisibility}
        />
      

        {previewOpen && (
          <div className="preview-modal-overlay">
            <div className="preview-modal">
              <div className="preview-header">
                <div>
                  <h3>{previewFileName}</h3>
                  <p className="muted">Text file preview</p>
                </div>

                <button
                  className="btn secondary"
                  onClick={() => setPreviewOpen(false)}
                >
                  Close
                </button>
              </div>

              <pre className="preview-content">
                {previewLoading ? "Loading preview..." : previewText}
              </pre>
            </div>
          </div>
        )}
                {deleteTarget && (
          <div className="delete-confirm-modal-overlay">
            <div className="delete-confirm-modal">
              <h3>
                {deleteTarget?.sourceType === "SHARED" ? "Remove Shared File" : "Delete File"}
              </h3>

              <p>
                {deleteTarget?.sourceType === "SHARED"
                  ? "Remove this shared file from your list?"
                  : "Are you sure you want to delete"}
                <strong> {deleteTarget.fileName || deleteTarget.name || "this file"}</strong>?
              </p>

              <p className="muted">
                {deleteTarget?.sourceType === "SHARED"
                  ? "This will only remove your access. The owner's original file will not be deleted."
                  : "This action will permanently remove the file from your account."}
              </p>

              <div className="delete-confirm-actions">
                <button
                  className="btn secondary"
                  onClick={cancelDeleteFile}
                  disabled={deleteLoading}
                >
                  Cancel
                </button>

                <button
                  className="btn danger"
                  onClick={confirmDeleteFile}
                  disabled={deleteLoading}
                >
                  {deleteLoading
                    ? "Processing..."
                    : deleteTarget?.sourceType === "SHARED"
                    ? "Remove Shared File"
                    : "Delete File"}
                </button>
              </div>
            </div>
          </div>
        )}
</section>
    </main>
  );
}

export default FilePage;
