import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";

import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";

import DashboardPage from "../pages/user/DashboardPage";
import SharedPage from "../pages/user/SharedPage";
import RecycleBinPage from "../pages/user/RecycleBinPage";

import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import UserManagementPage from "../pages/admin/UserManagementPage";
import FileManagementPage from "../pages/admin/FileManagementPage";
import SystemActivityLogPage from "../pages/admin/SystemActivityLogPage";
import AuditLogPage from "../pages/admin/AuditLogPage";
import PermissionsPage from "../pages/admin/PermissionsPage";

import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/reset-password" element={<ForgotPasswordPage />} />

        {/* User (protected) */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/shared" element={<ProtectedRoute><SharedPage /></ProtectedRoute>} />
        <Route path="/recycle-bin" element={<ProtectedRoute><RecycleBinPage /></ProtectedRoute>} />
        {/* Back-compat: the old /files route now lives at /dashboard */}
        <Route path="/files" element={<Navigate to="/dashboard" replace />} />

        {/* Admin */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><UserManagementPage /></AdminRoute>} />
        <Route path="/admin/files" element={<AdminRoute><FileManagementPage /></AdminRoute>} />
        {/* System Activity Log (replaces the old per-user Activity page) */}
        <Route path="/admin/activity" element={<AdminRoute><SystemActivityLogPage /></AdminRoute>} />
        {/* Legacy audit-log view kept for back-compat; no longer in the nav. */}
        <Route path="/admin/audit" element={<AdminRoute><AuditLogPage /></AdminRoute>} />
        <Route path="/admin/permissions" element={<AdminRoute><PermissionsPage /></AdminRoute>} />

        {/* Defaults — the app's front door is the login page.
            LoginPage forwards an already-signed-in user to their home,
            so signed-in users still skip straight to the dashboard. */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}