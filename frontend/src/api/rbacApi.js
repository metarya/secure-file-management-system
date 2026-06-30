// RBAC endpoints — used to make the admin UI permission-aware.
import { api } from "../lib/apiClient";

// GET /api/rbac/me -> ["USER:VIEW", "FILE:VIEW_ANY", ...] for the current token
export const getMyPermissions = () => api.get(`/rbac/me`);
