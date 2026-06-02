import { BrowserRouter, Route, Routes } from "react-router-dom";

import DashboardPage from "../App";
import FilePage from "../pages/FilePage";

import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import UserManagementPage from "../pages/admin/UserManagementPage";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/files" element={<FilePage />} />

        <Route
          path="/admin/dashboard"
          element={<AdminDashboardPage />}
        />

        <Route
          path="/admin/users"
          element={<UserManagementPage />}
        />
      </Routes>
    </BrowserRouter>
  );
}