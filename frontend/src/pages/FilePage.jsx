import React, { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";

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
  const [user] = useState(loadStoredUser);
  const [ownedFiles, setOwnedFiles] = useState([]);
  const [sharedFiles, setSharedFiles] = useState([]);
  const [message, setMessage] = useState("");
  const [searchName, setSearchName] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFileName, setPreviewFileName] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);

  function authHeaders() {
    return {
      Authorization: `Bearer ${user?.token}`,
      "ngrok-skip-browser-warning": "true",
    };
  }

  async function loadMyFiles() {
    if (!user?.userId || !user?.token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/files/my-files?ownerId=${user.userId}`, {
        headers: authHeaders(),
      });

      const data = await response.json();

      if (response.ok) {
        setOwnedFiles(Array.isArray(data) ? data : []);
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
          headers: authHeaders(),
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

  async function refreshAllFiles() {
    await loadMyFiles();
    await loadSharedFiles();
    setMessage("Files refreshed successfully.");
  }

  async function previewFile(file) {
    const fileId = file.fileId || file.id;
    const fileName = file.fileName || file.name || "Preview file";

    try {
      setPreviewOpen(true);
      setPreviewFileName(fileName);
      setPreviewText("");
      setPreviewLoading(true);

      const response = await fetch(`${API_BASE_URL}/files/preview/${fileId}?userId=${user.userId}`, {
        headers: authHeaders(),
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
        headers: authHeaders(),
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

  async function deleteFile(file) {
    const fileId = file.fileId || file.id;

    if (!window.confirm(`Delete ${file.fileName || file.name}?`)) return;

    try {
      const response = await fetch(`${API_BASE_URL}/files/${fileId}?userId=${user.userId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });

      if (response.ok) {
        setMessage("File deleted successfully.");
        refreshAllFiles();
      } else {
        const text = await response.text();
        setMessage(text || "Delete failed.");
      }
    } catch (error) {
      setMessage("Delete failed: " + error.message);
    }
  }


  async function toggleVisibility(file) {
    const fileId = file.fileId || file.id;
    const currentVisibility = String(file.visibility || file.displayVisibility || "PRIVATE").toUpperCase();
    const nextVisibility = currentVisibility === "PUBLIC" ? "PRIVATE" : "PUBLIC";

    const requestsToTry = [
      {
        method: "PUT",
        url: `${API_BASE_URL}/files/${fileId}/visibility?userId=${user.userId}&visibility=${nextVisibility}`,
        body: null,
      },
      {
        method: "PUT",
        url: `${API_BASE_URL}/files/${fileId}/visibility?visibility=${nextVisibility}&userId=${user.userId}`,
        body: null,
      },
      {
        method: "PATCH",
        url: `${API_BASE_URL}/files/${fileId}/visibility?userId=${user.userId}&visibility=${nextVisibility}`,
        body: null,
      },
      {
        method: "PATCH",
        url: `${API_BASE_URL}/files/${fileId}/visibility?visibility=${nextVisibility}&userId=${user.userId}`,
        body: null,
      },
      {
        method: "PUT",
        url: `${API_BASE_URL}/files/${fileId}/visibility`,
        body: JSON.stringify({
          userId: user.userId,
          visibility: nextVisibility,
        }),
      },
      {
        method: "PATCH",
        url: `${API_BASE_URL}/files/${fileId}/visibility`,
        body: JSON.stringify({
          userId: user.userId,
          visibility: nextVisibility,
        }),
      },
    ];

    let finalError = "";

    for (const request of requestsToTry) {
      try {
        const headers = {
          ...authHeaders(),
        };

        if (request.body) {
          headers["Content-Type"] = "application/json";
        }

        const response = await fetch(request.url, {
          method: request.method,
          headers,
          body: request.body,
        });

        if (response.ok) {
          setMessage(`File visibility changed to ${nextVisibility}.`);
          await refreshAllFiles();
          return;
        }

        finalError = await response.text();
      } catch (error) {
        finalError = error.message;
      }
    }

    setMessage(finalError || "Visibility update failed.");
  }

  useEffect(() => {
    refreshAllFiles();
  }, []);

  const combinedFiles = useMemo(() => {
    const owned = ownedFiles.map((file) => ({
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
  }, [ownedFiles, sharedFiles]);

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
          toggleVisibility={toggleVisibility}
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
      </section>
    </main>
  );
}

function FileTable({ files, previewFile, downloadFile, deleteFile, toggleVisibility }) {
  if (!files || files.length === 0) {
    return <div className="empty-state">No files found.</div>;
  }

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>File Name</th>
            <th>Description</th>
            <th>Type</th>
            <th>Visibility</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {files.map((file) => {
            const fileId = file.fileId || file.id;
            const fileName = file.fileName || file.name || "Unnamed file";
            const description =
              file.description ||
              file.fileDescription ||
              file.file_description ||
              file.details ||
              "-";
            const fileType = file.fileType || file.type || "txt";
            const visibility = file.displayVisibility;
            const dateValue =
              file.sourceType === "SHARED"
                ? file.sharedAt || file.createdAt || "-"
                : file.uploadedAt || "-";

            const permissionCode = String(file.permissionType || "").toUpperCase();
            const canDownload =
              file.sourceType !== "SHARED" ||
              permissionCode === "DOWNLOAD" ||
              permissionCode === "VIEW_DOWNLOAD";

            return (
              <tr key={`${file.sourceType}-${fileId}-${fileName}`}>
                <td>
                  <button
                    type="button"
                    className="file-preview-link"
                    onClick={() => previewFile(file)}
                    title="Click to preview file"
                  >
                    {fileName}
                  </button>
                </td>
                <td className="description-cell">{description}</td>
                <td>{fileType}</td>
                <td>
                  <span className={`status-badge ${String(visibility).toLowerCase()}`}>
                    {visibility}
                  </span>
                </td>
                <td>{dateValue}</td>
                <td>
                  {canDownload && (
                    <button className="btn secondary" onClick={() => downloadFile(file)}>
                      Download
                    </button>
                  )}

                  {file.sourceType !== "SHARED" && (
                    <>
                      <button className="btn secondary" onClick={() => toggleVisibility(file)}>
                        Make {String(file.visibility).toUpperCase() === "PUBLIC" ? "PRIVATE" : "PUBLIC"}
                      </button>

                      <button className="btn danger" onClick={() => deleteFile(file)}>
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default FilePage;
