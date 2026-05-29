import { useState, lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));

function DashboardWrapper() {
  const [user, setUser] = useState(() => {
    const savedUser =
      localStorage.getItem("sfmsUser") ||
      localStorage.getItem("sfms_user");

    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [page, setPage] = useState(() => {
    const savedUser =
      localStorage.getItem("sfmsUser") ||
      localStorage.getItem("sfms_user");

    return savedUser ? "dashboard" : "login";
  });

  function logout() {
    localStorage.removeItem("sfmsUser");
    localStorage.removeItem("sfms_user");

    setUser(null);
    setPage("login");
  }

  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1rem"
          }}
        >
          Loading...
        </div>
      }
    >
      <div>
        {!user && page === "login" && (
          <LoginPage
            setUser={setUser}
            setPage={setPage}
          />
        )}

        {!user && page === "register" && (
          <RegisterPage
            setPage={setPage}
          />
        )}

        {!user && page === "reset-password" && (
          <ResetPasswordPage
            setPage={setPage}
          />
        )}

        {user && (
          <DashboardPage
            user={user}
            logout={logout}
          />
        )}
      </div>
    </Suspense>
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