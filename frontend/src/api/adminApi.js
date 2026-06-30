// Admin endpoints — /api/admin/*  (full AdminController coverage)
import { api } from "../lib/apiClient";
import { htmlToText } from "../utils/htmlToText";
import { pageQuery } from "../utils/pageQuery";

// --- dashboards / stats -------------------------------------------------
export const getAdminStats = () => api.get(`/admin/stats`);
export const getFileStats = () => api.get(`/admin/file-stats`);
export const getSystemHealth = () => api.get(`/admin/system-health`);
export const adminTest = () => api.get(`/admin/test`);

// --- users --------------------------------------------------------------
// Paginated user list (the Users table). Returns a PageResponse envelope.
export const getUsersPage = (params) => api.get(`/admin/users${pageQuery(params)}`);

// Full (unpaginated-feeling) user list for consumers that need every user —
// the permissions user-picker and the admin role-sync probe. Backed by the
// same paginated endpoint with a large page size, unwrapped to a plain array
// so the historic array contract is preserved.
export const getAllUsers = () =>
  api.get(`/admin/users?size=1000`).then((r) =>
    Array.isArray(r) ? r : (r?.content ?? []));

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

// Paginated user activity (the Activity table). Aggregates (file count,
// storage, last upload) are computed per page; sortable by name/email/joined.
export const getUserActivity = (params) =>
  api.get(`/admin/user-activity${pageQuery(params)}`);

// --- files --------------------------------------------------------------
// Paginated admin file list. `sort` is an allowlisted field (fileName,
// uploadedAt, fileSize, fileType, ownerName), `direction` is asc|desc, and
// `search` matches file name / owner name / owner email. Returns a
// PageResponse envelope; the backend defaults to uploadedAt desc.
export const getAllFiles = (params) =>
  api.get(`/admin/files${pageQuery(params)}`);

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
// Paginated audit log (the Audit Log table). Sortable by createdAt/action/
// performedBy; `search` matches action / actor / details. Returns PageResponse.
export const getAuditLogs = (params) =>
  api.get(`/admin/audit-logs${pageQuery(params)}`);

// --- permissions --------------------------------------------------------
export const getPermissionCatalog = () =>
  api.get(`/admin/permissions`);

export const getUserPermissionsDetail = (userId) =>
  api.get(`/admin/users/${userId}/permissions`);

export const updateUserPermissions = (userId, permissions) =>
  api.put(`/admin/users/${userId}/permissions`, {
    permissions,
  });