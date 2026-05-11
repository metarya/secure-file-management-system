const fs = require("fs");

const appFile = "src/App.jsx";
const filePageFile = "src/pages/FilePage.jsx";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");

let app = fs.readFileSync(appFile, "utf8");
let filePage = fs.readFileSync(filePageFile, "utf8");

fs.copyFileSync(appFile, `${appFile}.bak-login-persist-${stamp}`);
fs.copyFileSync(filePageFile, `${filePageFile}.bak-login-persist-${stamp}`);

// Make App.jsx read either sfmsUser or sfms_user.
app = app.replace(
  /const savedUser = localStorage\.getItem\("sfmsUser"\);/g,
  `const savedUser = localStorage.getItem("sfmsUser") || localStorage.getItem("sfms_user");`
);

// Store login user under both keys.
app = app.replace(
  /localStorage\.setItem\("sfmsUser", JSON\.stringify\(data\)\);/g,
  `localStorage.setItem("sfmsUser", JSON.stringify(data));
        localStorage.setItem("sfms_user", JSON.stringify(data));`
);

// Remove both keys during logout.
app = app.replace(
  /localStorage\.removeItem\("sfmsUser"\);/g,
  `localStorage.removeItem("sfmsUser");
    localStorage.removeItem("sfms_user");`
);

// Ensure FilePage checks sfmsUser first.
filePage = filePage.replace(
  /const possibleKeys = \[[\s\S]*?\];/,
  `const possibleKeys = [
    "sfmsUser",
    "sfms_user",
    "user",
    "loggedInUser",
    "currentUser",
    "authUser",
    "secureFileUser",
    "fileManagementUser"
  ];`
);

fs.writeFileSync(appFile, app);
fs.writeFileSync(filePageFile, filePage);

console.log("Login persistence patched.");
console.log("Backups created:");
console.log(`${appFile}.bak-login-persist-${stamp}`);
console.log(`${filePageFile}.bak-login-persist-${stamp}`);
