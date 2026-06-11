// Auth endpoints — /api/auth/*  (all public)
import { API_BASE_URL } from "../config";

const headers = { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" };

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

// POST /api/auth/register -> plain string message
export async function register(fullName, email, password) {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers,
    body: JSON.stringify({ fullName, email, password }),
  });
  const message = await res.text();
  return { ok: res.ok, message };
}

// POST /api/auth/forgot-password -> plain string message (sends OTP)
export async function forgotPassword(email) {
  const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email }),
  });
  const message = await res.text();
  return { ok: res.ok, message };
}

// POST /api/auth/reset-password -> plain string message
export async function resetPassword(otp, newPassword) {
  const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: "POST",
    headers,
    body: JSON.stringify({ otp, newPassword }),
  });
  const message = await res.text();
  return { ok: res.ok, message };
}
