const fs = require("fs");

const file = "src/App.jsx";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");

let code = fs.readFileSync(file, "utf8");
fs.copyFileSync(file, `${file}.bak-share-email-error-${stamp}`);

// Remove subtitle under Share File Access.
code = code.replace(
  /\s*<p className="muted">\s*Share one of your files with another registered user\.\s*<\/p>/,
  ""
);

// Add friendly share error helper after API_BASE_URL if missing.
if (!code.includes("function getFriendlyShareErrorMessage")) {
  code = code.replace(
    /(const API_BASE_URL = .*?;\s*)/,
    `$1

function getFriendlyShareErrorMessage(message, status) {
  const text = String(message || "").toLowerCase();

  if (
    status === 404 ||
    text.includes("target user") ||
    text.includes("user not found") ||
    text.includes("email not found") ||
    text.includes("not registered") ||
    text.includes("target email")
  ) {
    return "Wrong mail ID. User is not registered.";
  }

  return message || "Share failed.";
}
`
  );
}

// Patch only inside shareFileAccess function.
const start = code.indexOf("async function shareFileAccess()");
if (start === -1) {
  throw new Error("shareFileAccess function not found.");
}

let end = code.indexOf("\n  async function", start + 1);
if (end === -1) {
  end = code.indexOf("\n  function", start + 1);
}
if (end === -1) {
  throw new Error("Could not find end of shareFileAccess function.");
}

let before = code.slice(0, start);
let block = code.slice(start, end);
let after = code.slice(end);

// Convert backend unregistered-user errors into friendly message.
block = block.replace(
  /setShareMessage\(\s*data\?\.message\s*\|\|\s*["'`]([^"'`]+)["'`]\s*\);/g,
  `setShareMessage(response.ok ? (data?.message || "$1") : getFriendlyShareErrorMessage(data?.message || data?.error, response.status));`
);

block = block.replace(
  /setShareMessage\(\s*["'`]Share failed:\s*["'`]\s*\+\s*error\.message\s*\);/g,
  `setShareMessage(getFriendlyShareErrorMessage(error.message));`
);

code = before + block + after;

fs.writeFileSync(file, code);

console.log("Share subtitle removed and unregistered email error improved.");
console.log("Backup created:", `${file}.bak-share-email-error-${stamp}`);
