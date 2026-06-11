import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";

import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";

import DashboardPage from "../pages/user/DashboardPage";
import SharedPage from "../pages/user/SharedPage";

import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import UserManagementPage from "../pages/admin/UserManagementPage";
import FileManagementPage from "../pages/admin/FileManagementPage";
import ActivityPage from "../pages/admin/ActivityPage";
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
        {/* Back-compat: the old /files route now lives at /dashboard */}
        <Route path="/files" element={<Navigate to="/dashboard" replace />} />

        {/* Admin */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><UserManagementPage /></AdminRoute>} />
        <Route path="/admin/files" element={<AdminRoute><FileManagementPage /></AdminRoute>} />
        <Route path="/admin/activity" element={<AdminRoute><ActivityPage /></AdminRoute>} />
        <Route path="/admin/audit" element={<AdminRoute><AuditLogPage /></AdminRoute>} />
        <Route path="/admin/permissions" element={<AdminRoute><PermissionsPage /></AdminRoute>} />

        {/* Defaults */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
