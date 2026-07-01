// Auth endpoints — /api/auth/*  (all public)
import { API_BASE_URL } from "../config";

const headers = { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" };

// Success responses are a plain string; error responses are JSON
// ({status, error, message, path}). This returns a clean string either way.
async function readMessage(res) {
  const text = await res.text();
  if (!text) return "";
  try {
    const json = JSON.parse(text);
    return json.message || json.error || text;
  } catch {
    return text;
  }
}

// POST /api/auth/login -> { message, userId, fullName, email, token, role }
export async function login(email, password) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

// POST /api/auth/register -> plain string message (or JSON error)
export async function register(fullName, email, password) {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers,
    body: JSON.stringify({ fullName, email, password }),
  });
  return { ok: res.ok, message: await readMessage(res) };
}

// POST /api/auth/logout -> records the sign-out in the system activity log.
// Best-effort: the JWT is stateless, so a failure here must not block sign-out.
export async function logoutServer() {
  try {
    const user = JSON.parse(localStorage.getItem("sfmsUser") || "{}");
    const token = user?.token || user?.jwt || user?.accessToken;
    if (!token) return;
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      headers: { ...headers, Authorization: `Bearer ${token}` },
    });
  } catch {
    /* sign-out proceeds regardless */
  }
}

// POST /api/auth/forgot-password -> plain string message (sends OTP), or JSON error
export async function forgotPassword(email) {
  const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email }),
  });
  return { ok: res.ok, message: await readMessage(res) };
}

// POST /api/auth/reset-password -> plain string message (or JSON error)
export async function resetPassword(email, otp, newPassword) {
  const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email, otp, newPassword }),
  });
  return { ok: res.ok, message: await readMessage(res) };
}