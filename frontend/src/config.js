// Central configuration.
// Set VITE_API_BASE_URL in your .env to point at the backend.
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
