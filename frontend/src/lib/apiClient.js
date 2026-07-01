// Thin fetch wrapper used by every api/* module.
// Centralizes the base URL, auth header, ngrok bypass header, and error handling
// so individual calls stay tiny and consistent.
import { API_BASE_URL } from "../config";
import { loadStoredUser, logout } from "../utils/auth";

function authHeaders() {
  const user = loadStoredUser();
  const headers = { "ngrok-skip-browser-warning": "true" };
  if (user?.token) headers.Authorization = `Bearer ${user.token}`;
  return headers;
}

// Turns a non-ok Response into a thrown Error carrying the server's message.
async function toError(response) {
  let message = `Request failed (${response.status})`;
  try {
    const text = await response.text();
    if (text) {
      try {
        const json = JSON.parse(text);
        message = json.message || json.error || text;
      } catch {
        message = text;
      }
    }
  } catch {
    /* keep default */
  }
  const err = new Error(message);
  err.status = response.status;
  return err;
}

// If the session has expired, clear storage and redirect to login.
// window.location.replace wipes the forward-history so Back can't return to
// a protected page after the session expires.
function handleAuthFailure(status) {
  if (status === 401) {
    logout();
    window.location.replace("/login");
  }
}

async function request(path, { method = "GET", body, json = true, raw = false } = {}) {
  const headers = authHeaders();
  let payload = body;

  if (body && json && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { method, headers, body: payload });

  if (!response.ok) {
    handleAuthFailure(response.status);
    throw await toError(response);
  }

  if (raw) return response; // caller wants the Response (e.g. blob downloads)

  // Some endpoints return plain strings, others JSON. Parse defensively.
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: "GET" }),
  post: (path, body, opts) => request(path, { ...opts, method: "POST", body }),
  put: (path, body, opts) => request(path, { ...opts, method: "PUT", body }),
  patch: (path, body, opts) => request(path, { ...opts, method: "PATCH", body }),
  del: (path, opts) => request(path, { ...opts, method: "DELETE" }),
  raw: (path, opts) => request(path, { ...opts, raw: true }),
  authHeaders,
};
