const fs = require("fs");

const file = "src/App.jsx";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");

let code = fs.readFileSync(file, "utf8");
fs.copyFileSync(file, `${file}.bak-add-files-button-${stamp}`);

const filesButton = `
        <a className="btn secondary files-page-button" href="/files">
          Files
        </a>
`;

// Add Files button before Logout button if it is not already present.
if (!code.includes('href="/files"')) {
  const logoutButtonPattern = /(\s*<button[^>]*>\s*Logout\s*<\/button>)/;

  if (logoutButtonPattern.test(code)) {
    code = code.replace(logoutButtonPattern, `${filesButton}$1`);
  } else {
    throw new Error("Could not find Logout button. Send header section of App.jsx.");
  }
}

fs.writeFileSync(file, code);

console.log("Files button added to Home dashboard.");
console.log("Backup created:", `${file}.bak-add-files-button-${stamp}`);
