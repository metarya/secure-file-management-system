// Admin endpoints — /api/admin/*  (full AdminController coverage)
import { api } from "../lib/apiClient";
import { htmlToText } from "../utils/htmlToText";

// --- dashboards / stats -------------------------------------------------
export const getAdminStats = () => api.get(`/admin/stats`);
export const getFileStats = () => api.get(`/admin/file-stats`);
export const getSystemHealth = () => api.get(`/admin/system-health`);
export const adminTest = () => api.get(`/admin/test`);

// --- users --------------------------------------------------------------
export const getAllUsers = () => api.get(`/admin/users`);

export const updateUserRole = (userId, role) =>
  api.patch(`/admin/users/${userId}/role`, { role });

export const updateUserStatus = (userId, status) =>
  api.patch(`/admin/users/${userId}/status`, { status });

export const resetUserPassword = (email) =>
  api.post(`/admin/users/reset-password?email=${encodeURIComponent(email)}`);

export const deleteUser = (userId) =>
  api.del(`/admin/users/${userId}`);

// --- activity / summaries ----------------------------------------------
export const getUserFileSummary = () =>
  api.get(`/admin/user-file-summary`);

export const getUserActivity = () =>
  api.get(`/admin/user-activity`);

// --- files --------------------------------------------------------------
export const getAllFiles = () =>
  api.get(`/admin/files`);

export const adminPreviewFile = (fileId) =>
  api.get(`/admin/files/${fileId}/preview`);

export const adminDeleteFile = (fileId) =>
  api.del(`/admin/files/${fileId}`);

export const adminRestoreFile = (fileId) =>
  api.patch(`/admin/files/${fileId}/restore`);

function guessMediaMime(name = "") {
  const ext = name.toLowerCase().split(".").pop();

  return {
    mp4: "video/mp4",
    webm: "video/webm",
    mov: "video/quicktime",
    avi: "video/x-msvideo",
    mkv: "video/x-matroska",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    m4a: "audio/mp4",
    pdf: "application/pdf",
  }[ext] || "";
}

export async function adminPreviewMedia(fileId, fileName) {
  const res = await api.raw(`/admin/files/${fileId}/download`);

  const buf = await res.arrayBuffer();

  const mime =
    guessMediaMime(fileName) ||
    res.headers.get("Content-Type") ||
    "application/octet-stream";

  return {
    type: "binary",
    contentType: mime,
    url: URL.createObjectURL(
      new Blob([buf], { type: mime })
    ),
  };
}

export async function adminDownloadFile(fileId, fallbackName) {
  const res = await api.raw(`/admin/files/${fileId}/download`);

  let fileName = fallbackName || `file-${fileId}`;

  const disposition = res.headers.get("Content-Disposition");

  if (disposition) {
    const match = disposition.match(/filename="?([^"]+)"?/);

    if (match?.[1]) {
      fileName = match[1];
    }
  }

  // Convert only TXT files from stored HTML to readable text
  if (/\.txt$/i.test(fileName)) {
    const html = await res.text();

    const text = htmlToText(html);

    return {
      blob: new Blob([text], {
        type: "text/plain;charset=utf-8",
      }),
      fileName,
    };
  }

  // Leave every other file untouched
  const blob = await res.blob();

  return {
    blob,
    fileName,
  };
}

// --- audit --------------------------------------------------------------
export const getAuditLogs = () =>
  api.get(`/admin/audit-logs`);

// --- permissions --------------------------------------------------------
export const getPermissionCatalog = () =>
  api.get(`/admin/permissions`);

export const getUserPermissionsDetail = (userId) =>
  api.get(`/admin/users/${userId}/permissions`);

export const updateUserPermissions = (userId, permissions) =>
  api.put(`/admin/users/${userId}/permissions`, {
    permissions,
  });