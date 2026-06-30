import { useEffect } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { loadStoredUser, storeUser, isAuthenticated } from "../utils/auth";
import { getAllUsers } from "../api/adminApi";

// On mount, silently re-validate the current user's role from the server.
// This handles the case where an admin changed this user's role in another
// session — the stored token is still valid but the role in localStorage is stale.
function useRoleSync() {
  const navigate = useNavigate();

  useEffect(() => {
    const me = loadStoredUser();
    if (!me?.userId || !me?.token) return;

    // We use getAllUsers (admin) only if the current user is admin.
    // For regular users, we can't easily fetch their own role without a /me endpoint,
    // so we try getAllUsers as admin — if it 403s we skip silently.
    getAllUsers()
      .then((users) => {
        if (!Array.isArray(users)) return;
        const fresh = users.find((u) => String(u.id) === String(me.userId));
        if (!fresh) return;
        const freshRole = String(fresh.role || "").toUpperCase();
        if (freshRole && freshRole !== me.role) {
          // Role changed — update localStorage
          storeUser({ ...me, role: freshRole });
          // Navigate to the right home for the new role
          if (freshRole === "ADMIN") {
            navigate("/admin/dashboard", { replace: true });
          } else {
            navigate("/dashboard", { replace: true });
          }
        }
      })
      .catch(() => {
        // Not an admin or endpoint unavailable — skip silently
      });
  }, []); // eslint-disable-line
}

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const user = loadStoredUser();

  useRoleSync();

  if (!isAuthenticated(user)) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}
