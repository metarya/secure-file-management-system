import { Navigate, useLocation } from "react-router-dom";
import { loadStoredUser, isAuthenticated } from "../utils/auth";

// Gate for any route that requires a signed-in user.
export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const user = loadStoredUser();
  if (!isAuthenticated(user)) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}
