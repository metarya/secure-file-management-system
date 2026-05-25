import { useState } from "react";
import { Routes, Route } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import DashboardPage from "./pages/DashboardPage";

function DashboardWrapper() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("sfmsUser") || localStorage.getItem("sfms_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [page, setPage] = useState(() => {
    const savedUser = localStorage.getItem("sfmsUser") || localStorage.getItem("sfms_user");
    return savedUser ? "dashboard" : "login";
  });

  function logout() {
    localStorage.removeItem("sfmsUser");
    localStorage.removeItem("sfms_user");
    setUser(null);
    setPage("login");
  }

  return (
    <div>
      {!user && page === "login" && (
        <LoginPage setUser={setUser} setPage={setPage} />
      )}

      {!user && page === "register" && (
        <RegisterPage setPage={setPage} />
      )}

      {user && (
        <DashboardPage user={user} logout={logout} />
      )}

      {!user && page === "reset-password" && (
        <ResetPasswordPage setPage={setPage} />
      )}
    </div>
  );
}


export default function App() {
  return (
      <Routes>

        <Route
          path="/"
          element={<DashboardWrapper />}
        />

      </Routes>
  );
}