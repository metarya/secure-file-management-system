// Single source of truth for the logged-in user (kept compatible with the
// previous app: same localStorage keys and the same role-resolution logic).
const STORAGE_KEYS = [
  "sfmsUser", "sfms_user", "user", "loggedInUser",
  "currentUser", "authUser", "secureFileUser", "fileManagementUser",
];

function resolveRole(parsed) {
  const raw =
    parsed.role ??
    parsed.userRole ??
    parsed.user?.role ??
    (Array.isArray(parsed.roles) ? parsed.roles[0] : parsed.roles) ??
    (Array.isArray(parsed.authorities)
      ? (typeof parsed.authorities[0] === "string"
          ? parsed.authorities[0]
          : parsed.authorities[0]?.authority)
      : undefined) ??
    parsed.user?.roles?.[0] ??
    "";
  return String(raw || "").toUpperCase().replace(/^ROLE_/, "");
}

export function loadStoredUser() {
  for (const key of STORAGE_KEYS) {
    const saved = localStorage.getItem(key);
    if (!saved) continue;
    try {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        userId:   parsed.userId   ?? parsed.id   ?? parsed.user?.userId ?? parsed.user?.id,
        email:    parsed.email    ?? parsed.user?.email,
        fullName: parsed.fullName ?? parsed.name ?? parsed.user?.fullName,
        token:    parsed.token    ?? parsed.jwt  ?? parsed.accessToken  ?? parsed.user?.token,
        role:     resolveRole(parsed),
      };
    } catch {
      continue;
    }
  }
  return null;
}

export function storeUser(data) {
  // Mirror to both keys the old app used so nothing else breaks.
  localStorage.setItem("sfmsUser", JSON.stringify(data));
  localStorage.setItem("sfms_user", JSON.stringify(data));
}

// Decode the JWT payload (base64url middle segment) and check the exp claim
// without any library. Returns true if the token is expired or unparseable.
function isTokenExpiredLocally(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true; // treat unparseable tokens as expired
  }
}

export const isAuthenticated = (user) =>
  Boolean(user?.userId && user?.token && !isTokenExpiredLocally(user.token));
export const isAdmin = (user) => user?.role === "ADMIN";

export function logout() {
  STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));
}

export const homeRouteForUser = (user) => (isAdmin(user) ? "/admin/dashboard" : "/dashboard");
