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
// returns { fileName, ownerName, ownerEmail, content }
export const adminPreviewFile = (fileId) => api.get(`/admin/files/${fileId}/preview`);
export const adminDeleteFile = (fileId) => api.del(`/admin/files/${fileId}`);
export const adminRestoreFile = (fileId) => api.patch(`/admin/files/${fileId}/restore`);

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
