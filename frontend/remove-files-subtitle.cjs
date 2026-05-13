const fs = require("fs");

const file = "src/pages/FilePage.jsx";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");

let code = fs.readFileSync(file, "utf8");
fs.copyFileSync(file, `${file}.bak-remove-files-subtitle-${stamp}`);

code = code.replace(
  /\s*<p className="muted">\s*Single list of private, public, and shared files\.\s*<\/p>/,
  ""
);

fs.writeFileSync(file, code);

console.log("Removed subtitle from /files page.");
console.log("Backup created:", `${file}.bak-remove-files-subtitle-${stamp}`);
