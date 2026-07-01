// Storage-provider endpoints.
// User settings — /api/storage/*  (each user manages only their own config).
// Admin read-only view — /api/admin/user-storage.
import { api } from "../lib/apiClient";

// Current user's storage settings (no secrets are ever returned).
export const getStorageSettings = () => api.get(`/storage/settings`);

// Persist the current user's storage settings. Secret fields left blank are
// preserved server-side, so the UI never round-trips secrets.
export const updateStorageSettings = (settings) =>
  api.put(`/storage/settings`, settings);

// Test a provider connection before saving. Returns { success, message }.
export const testStorageConnection = (settings) =>
  api.post(`/storage/test`, settings);

// Admin: which provider each user uses (read-only; no credentials).
export const getAdminUserStorage = () => api.get(`/admin/user-storage`);

// Admin: change the storage provider assigned to any user.
export const adminChangeUserStorageProvider = (userId, storageProvider) =>
  api.put(`/admin/users/${userId}/storage-provider`, { storageProvider });
