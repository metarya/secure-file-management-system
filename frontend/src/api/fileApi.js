// File endpoints — /api/files/*  (every endpoint the FileController exposes)
import { api } from "../lib/apiClient";
import { API_BASE_URL } from "../config";
import { loadStoredUser } from "../utils/auth";
import { htmlToText } from "../utils/htmlToText";

// --- listing / search ---------------------------------------------------
// The backend derives the owner from the JWT; no ownerId is sent.
export const getMyFiles = () => api.get(`/files/my-files`);
export const searchMyFiles = (name) =>
  api.get(`/files/search?name=${encodeURIComponent(name)}`);
export const getSharedWithMe = () => api.get(`/files/shared-with-me`);

// --- upload -------------------------------------------------------------
export function uploadFile(file, description) {
  const form = new FormData();
  form.append("file", file);
  if (description) form.append("description", description);
  return api.post(`/files/upload`, form);
}

// Same as uploadFile, but reports upload progress. fetch() has no upload
// progress event, so this uses XMLHttpRequest, which fires upload.onprogress
// as the request body is sent. `onProgress` receives an integer 0–100.
export function uploadFileWithProgress(file, description, onProgress) {
  const form = new FormData();
  form.append("file", file);
  if (description) form.append("description", description);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    // NOTE: this must hit the same URL api.post builds. If your `api` client
    // prefixes something extra (e.g. an "/api" segment) on top of API_BASE_URL,
    // mirror it here so the path matches `/files/upload`.
    xhr.open("POST", `${API_BASE_URL}/files/upload`);

    // --- AUTH ------------------------------------------------------------
    // The token is NOT a top-level localStorage key — it lives inside the
    // stored user object. Reuse loadStoredUser() (the app's single source of
    // truth) so we send the same normalized token the api client uses.
    const token = loadStoredUser()?.token;
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    // ---------------------------------------------------------------------
    // Do NOT set Content-Type — the browser sets the multipart boundary itself.

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress?.(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        // Resolve with parsed JSON when possible, else the raw text. If your
        // api.post resolves a specific shape that the caller relies on, mirror
        // it here.
        let data = xhr.responseText;
        try { data = JSON.parse(xhr.responseText); } catch { /* not JSON */ }
        resolve(data);
      } else {
        reject(new Error(`Upload failed (${xhr.status})`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.onabort = () => reject(new Error("Upload aborted"));

    xhr.send(form);
  });
}

// Map a filename to a MIME type. Used when the server sends a generic
// Content-Type (e.g. application/octet-stream) so <iframe>/<video>/<audio>
// still recognize the bytes — an <iframe> in particular needs application/pdf
// to render a PDF inline instead of downloading it.
function guessMime(name = "") {
  const ext = (name.split(".").pop() || "").toLowerCase();
  return {
    pdf: "application/pdf",
    mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime",
    avi: "video/x-msvideo", mkv: "video/x-matroska",
    mp3: "audio/mpeg", wav: "audio/wav", m4a: "audio/mp4",
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
    gif: "image/gif", webp: "image/webp",
  }[ext] || "";
}

// --- preview / download (return raw bytes) ------------------------------
// Preview returns the file body; text files are read as text, everything else
// is wrapped in an object URL. Pass fileName so a correct MIME can be chosen
// when the server's Content-Type is generic.
export async function previewFile(fileId, fileName) {
  const res = await api.raw(`/files/preview/${fileId}`);

  const headerType = res.headers.get("Content-Type") || "";

  if (headerType.startsWith("text/")) {
    return {
      type: "text",
      content: await res.text(),
    };
  }

  const buf = await res.arrayBuffer();
  const mime =
    headerType && !headerType.includes("octet-stream")
      ? headerType
      : guessMime(fileName) || headerType || "application/octet-stream";

  return {
    type: "binary",
    contentType: mime,
    url: URL.createObjectURL(new Blob([buf], { type: mime })),
  };
}

export async function downloadFile(fileId, fallbackName) {
  const res = await api.raw(`/files/download/${fileId}`);

  let fileName = fallbackName || `file-${fileId}`;

  const disposition = res.headers.get("Content-Disposition");
  if (disposition) {
    const match = disposition.match(/filename="?([^"]+)"?/);
    if (match?.[1]) {
      fileName = match[1];
    }
  }

  // Convert only .txt files from stored HTML to plain text
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

  // All other files remain unchanged
  const blob = await res.blob();

  return {
    blob,
    fileName,
  };
}

// --- mutations ----------------------------------------------------------
export const deleteFile = (fileId) => api.del(`/files/${fileId}`);

// --- recycle bin --------------------------------------------------------
// The owner's soft-deleted files (the recycle bin view). Owner is JWT-derived.
export const getDeletedFiles = () => api.get(`/files/recycle-bin`);

// Restore a soft-deleted file back to "My Files".
export const restoreFile = (fileId) =>
  api.patch(`/files/${fileId}/restore`);

// Permanently remove a file that is already in the recycle bin (irreversible).
export const permanentlyDeleteFile = (fileId) =>
  api.del(`/files/${fileId}/permanent`);

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
