const fs = require("fs");

const file = "src/pages/FilePage.jsx";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");

let code = fs.readFileSync(file, "utf8");
fs.copyFileSync(file, `${file}.bak-add-back-button-${stamp}`);

const backButton = `
          <a className="btn secondary back-home-button" href="/">
            Back to Home
          </a>
`;

if (!code.includes('href="/"')) {
  code = code.replace(
    /(<button className="btn secondary" onClick=\{loadMyFiles\}>\s*Refresh\s*<\/button>)/,
    `${backButton}
          $1`
  );
}

fs.writeFileSync(file, code);

console.log("Back to Home button added on /files page.");
console.log("Backup created:", `${file}.bak-add-back-button-${stamp}`);
