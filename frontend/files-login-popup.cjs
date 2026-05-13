const fs = require("fs");

const file = "src/pages/FilePage.jsx";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");

let code = fs.readFileSync(file, "utf8");
fs.copyFileSync(file, `${file}.bak-files-login-popup-${stamp}`);

// Remove old inline login message if present.
code = code.replace(
  /setMessage\("Please login first from Home page\."\);\s*return;/g,
  "return;"
);

// Replace silent redirect with popup + redirect.
code = code.replace(
  /if\s*\(!user\?\.userId\s*\|\|\s*!user\?\.token\)\s*\{\s*return\s*<Navigate\s+to="\/"\s+replace\s*\/>;\s*\}/,
  `if (!user?.userId || !user?.token) {
    const alertKey = "sfms_files_access_login_alert";

    if (!sessionStorage.getItem(alertKey)) {
      sessionStorage.setItem(alertKey, "shown");
      window.alert("Please login first to access Files page.");
    }

    return <Navigate to="/" replace />;
  }`
);

fs.writeFileSync(file, code);

console.log("Files page login popup added.");
console.log("Backup created:", `${file}.bak-files-login-popup-${stamp}`);
