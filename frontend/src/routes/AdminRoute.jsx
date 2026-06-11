import { Navigate } from "react-router-dom";
import { loadStoredUser, isAuthenticated, isAdmin } from "../utils/auth";

// Gate for admin-only routes:
//   not signed in        -> /login
//   signed in, not admin -> /dashboard
export default function AdminRoute({ children }) {
  const user = loadStoredUser();
  if (!isAuthenticated(user)) return <Navigate to="/login" replace />;
  if (!isAdmin(user)) return <Navigate to="/dashboard" replace />;
  return children;
}
