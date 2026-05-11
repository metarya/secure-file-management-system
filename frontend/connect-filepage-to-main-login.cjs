const fs = require("fs");

const appFile = "src/App.jsx";
const filePageFile = "src/pages/FilePage.jsx";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");

const appCode = fs.readFileSync(appFile, "utf8");
let pageCode = fs.readFileSync(filePageFile, "utf8");

fs.copyFileSync(filePageFile, `${filePageFile}.bak-connect-main-login-${stamp}`);

// Read localStorage keys used in App.jsx.
const detectedKeys = [
  ...new Set(
    [...appCode.matchAll(/localStorage\.(?:getItem|setItem)\(\s*["'`]([^"'`]+)["'`]/g)]
      .map((match) => match[1])
  ),
];

const fallbackKeys = [
  "sfms_user",
  "sfmsUser",
  "user",
  "loggedInUser",
  "currentUser",
  "authUser",
  "secureFileUser",
  "fileManagementUser"
];

const allKeys = [...new Set([...detectedKeys, ...fallbackKeys])];

const helperCode = `
function loadStoredUser() {
  const possibleKeys = ${JSON.stringify(allKeys, null, 2)};

  for (const key of possibleKeys) {
    const savedValue = localStorage.getItem(key);

    if (!savedValue) {
      continue;
    }

    try {
      const parsed = JSON.parse(savedValue);

      const normalizedUser = {
        ...parsed,
        userId: parsed.userId ?? parsed.id ?? parsed.user?.userId ?? parsed.user?.id,
        email: parsed.email ?? parsed.user?.email,
        fullName: parsed.fullName ?? parsed.name ?? parsed.user?.fullName,
        token: parsed.token ?? parsed.jwt ?? parsed.accessToken ?? parsed.user?.token,
      };

      if (normalizedUser.userId || normalizedUser.token) {
        return normalizedUser;
      }
    } catch {
      // Ignore non-JSON localStorage values here.
    }
  }

  const directToken =
    localStorage.getItem("token") ||
    localStorage.getItem("jwt") ||
    localStorage.getItem("accessToken");

  const directUserId =
    localStorage.getItem("userId") ||
    localStorage.getItem("id");

  const directEmail =
    localStorage.getItem("email");

  if (directToken || directUserId) {
    return {
      userId: directUserId ? Number(directUserId) : undefined,
      email: directEmail || "",
      token: directToken || "",
    };
  }

  return null;
}
`;

// Insert helper after API_BASE_URL if missing.
if (!pageCode.includes("function loadStoredUser()")) {
  pageCode = pageCode.replace(
    /const API_BASE_URL = import\.meta\.env\.VITE_API_BASE_URL \|\| "http:\/\/localhost:8080\/api";/,
    `const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";\n${helperCode}`
  );
}

// Replace old user state block safely.
const userStateStart = pageCode.indexOf("  const [user] = useState");
const nextStateStart = pageCode.indexOf("  const [files", userStateStart);

if (userStateStart === -1 || nextStateStart === -1) {
  throw new Error("Could not locate user state block in FilePage.jsx");
}

pageCode =
  pageCode.slice(0, userStateStart) +
  `  const [user] = useState(loadStoredUser);\n\n` +
  pageCode.slice(nextStateStart);

// Add user info display once.
if (!pageCode.includes("Connected user:")) {
  pageCode = pageCode.replace(
    /<p className="muted">\s*Metadata only\. fileData and fileHash are not shown\.\s*<\/p>/,
    `<p className="muted">
              Metadata only. fileData and fileHash are not shown.
            </p>

            <p className="muted">
              Connected user: {user?.email || "Not connected"} | User ID: {user?.userId || "Missing"}
            </p>`
  );
}

fs.writeFileSync(filePageFile, pageCode);

console.log("FilePage connected to Home page login storage.");
console.log("Detected App.jsx localStorage keys:", detectedKeys.length ? detectedKeys.join(", ") : "none");
console.log("Backup created:", `${filePageFile}.bak-connect-main-login-${stamp}`);
