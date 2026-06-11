// File endpoints — /api/files/*  (every endpoint the FileController exposes)
import { api } from "../lib/apiClient";
import { API_BASE_URL } from "../config";

// --- listing / search ---------------------------------------------------
export const getMyFiles = (ownerId) => api.get(`/files/my-files?ownerId=${ownerId}`);
export const searchMyFiles = (ownerId, name) =>
  api.get(`/files/search?ownerId=${ownerId}&name=${encodeURIComponent(name)}`);
export const getSharedWithMe = () => api.get(`/files/shared-with-me`);

// --- upload -------------------------------------------------------------
export function uploadFile(file, ownerId, description) {
  const form = new FormData();
  form.append("file", file);
  form.append("ownerId", ownerId);
  if (description) form.append("description", description);
  return api.post(`/files/upload`, form);
}

// --- preview / download (return raw bytes) ------------------------------
// Preview returns the file body; for the text files this app manages we read it as text.
export async function previewFile(fileId) {
  const res = await api.raw(`/files/preview/${fileId}`);
  return res.text();
}

export async function downloadFile(fileId, fallbackName) {
  const res = await api.raw(`/files/download/${fileId}`);
  const blob = await res.blob();
  let fileName = fallbackName || `file-${fileId}`;
  const disposition = res.headers.get("Content-Disposition");
  if (disposition) {
    const match = disposition.match(/filename="?([^"]+)"?/);
    if (match?.[1]) fileName = match[1];
  }
  return { blob, fileName };
}

// --- mutations ----------------------------------------------------------
export const deleteFile = (fileId, userId) => api.del(`/files/${fileId}?userId=${userId}`);

export const updateVisibility = (fileId, visibility) =>
  api.patch(`/files/${fileId}/visibility?visibility=${visibility}`);

export const updateFileContent = (fileId, content) =>
  api.put(`/files/${fileId}/content`, { content });

export const renameFile = (fileId, newFileName) =>
  api.put(`/files/${fileId}/rename`, { newFileName });

export const updateFileDescription = (fileId, description) =>
  api.put(`/files/${fileId}/description`, { description });

// --- sharing ------------------------------------------------------------
// permissionType is one of the codes in the backend (e.g. VIEW / EDIT / DOWNLOAD)
export const shareFile = (fileId, targetUserEmail, permissionType) =>
  api.post(`/files/share`, { fileId, targetUserEmail, permissionType });

export const removeSharedFileFromMyList = (fileId) =>
  api.del(`/files/shared-with-me/${fileId}`);

export const removeSharedPermission = (permissionId) =>
  api.del(`/files/shared-with-me/permission/${permissionId}`);

export const removeSharedEntry = (fileId) =>
  api.del(`/files/remove-shared-entry/${fileId}`);

export { API_BASE_URL };
