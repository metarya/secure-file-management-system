// Admin endpoints — /api/admin/*  (full AdminController coverage)
import { api } from "../lib/apiClient";

// --- dashboards / stats -------------------------------------------------
export const getAdminStats = () => api.get(`/admin/stats`);              // users / admins / regular
export const getFileStats = () => api.get(`/admin/file-stats`);          // counts + storage
export const getSystemHealth = () => api.get(`/admin/system-health`);    // active / blocked / files / storage
export const adminTest = () => api.get(`/admin/test`);

// --- users --------------------------------------------------------------
export const getAllUsers = () => api.get(`/admin/users`);
export const updateUserRole = (userId, role) =>
  api.patch(`/admin/users/${userId}/role`, { role });
export const updateUserStatus = (userId, status) =>
  api.patch(`/admin/users/${userId}/status`, { status });
// returns { email, temporaryPassword }
export const resetUserPassword = (email) =>
  api.post(`/admin/users/reset-password?email=${encodeURIComponent(email)}`);

// --- activity / summaries ----------------------------------------------
export const getUserFileSummary = () => api.get(`/admin/user-file-summary`);
export const getUserActivity = () => api.get(`/admin/user-activity`);

// --- files (admin oversight) -------------------------------------------
export const getAllFiles = () => api.get(`/admin/files`);
// returns { fileName, ownerName, ownerEmail, content } — TEXT ONLY (JSON).
export const adminPreviewFile = (fileId) => api.get(`/admin/files/${fileId}/preview`);
export const adminDeleteFile = (fileId) => api.del(`/admin/files/${fileId}`);
export const adminRestoreFile = (fileId) => api.patch(`/admin/files/${fileId}/restore`);

// Map a media filename to a MIME type. Download responses are commonly served
// as application/octet-stream, which some browsers won't play, so we prefer a
// type derived from the extension.
function guessMediaMime(name = "") {
  const ext = name.toLowerCase().split(".").pop();
  return {
    mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime",
    avi: "video/x-msvideo", mkv: "video/x-matroska",
    mp3: "audio/mpeg", wav: "audio/wav", m4a: "audio/mp4",
    pdf: "application/pdf",
  }[ext] || "";
}

// The preview endpoint is text-only, so for audio/video/pdf we fetch the raw
// bytes from the download endpoint and wrap them in an object URL the player or
// <iframe> can render. The whole file loads into the blob, so playback and
// seeking work without server-side range requests. Returns the same shape the
// user-side previewFile uses for binary: { type, contentType, url }.
export async function adminPreviewMedia(fileId, fileName) {
  const res = await api.raw(`/admin/files/${fileId}/download`);
  const buf = await res.arrayBuffer();
  const mime =
    guessMediaMime(fileName) ||
    res.headers.get("Content-Type") ||
    "application/octet-stream";
  return { type: "binary", contentType: mime, url: URL.createObjectURL(new Blob([buf], { type: mime })) };
}

export async function adminDownloadFile(fileId, fallbackName) {
  const res = await api.raw(`/admin/files/${fileId}/download`);
  const blob = await res.blob();
  let fileName = fallbackName || `file-${fileId}`;
  const disposition = res.headers.get("Content-Disposition");
  if (disposition) {
    const match = disposition.match(/filename="?([^"]+)"?/);
    if (match?.[1]) fileName = match[1];
  }
  return { blob, fileName };
}

// --- audit --------------------------------------------------------------
export const getAuditLogs = () => api.get(`/admin/audit-logs`);

// --- per-user permissions (RBAC) ---------------------------------------
// Catalog of every permission that exists, so the UI can render each as a toggle.
export const getPermissionCatalog = () => api.get(`/admin/permissions`);
// One user's permissions, split into role-inherited vs. directly granted.
export const getUserPermissionsDetail = (userId) =>
  api.get(`/admin/users/${userId}/permissions`);
// Replace a user's direct permission grants with exactly this set of codes.
export const updateUserPermissions = (userId, permissions) =>
  api.put(`/admin/users/${userId}/permissions`, { permissions });