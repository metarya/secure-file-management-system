const fs = require("fs");

const file = "src/pages/FilePage.jsx";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");

let code = fs.readFileSync(file, "utf8");
fs.copyFileSync(file, `${file}.bak-inline-login-message-${stamp}`);

// Remove browser alert logic and use sessionStorage notice instead.
code = code.replace(
  /const alertKey = "sfms_files_access_login_alert";[\s\S]*?return <Navigate to="\/" replace \/>;/,
  `sessionStorage.setItem("sfms_redirect_notice", "Please login first to access Files page.");
    return <Navigate to="/" replace />;`
);

fs.writeFileSync(file, code);

console.log("Files page now redirects with inline notice instead of browser alert.");
console.log("Backup created:", `${file}.bak-inline-login-message-${stamp}`);
