const fs = require("fs");

const file = "src/App.jsx";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");

let code = fs.readFileSync(file, "utf8");
fs.copyFileSync(file, `${file}.bak-remove-upload-alert-${stamp}`);

// Locate uploadSingleFile block.
const uploadStart = code.indexOf("async function uploadSingleFile()");
let uploadEnd = code.indexOf("\n  async function", uploadStart + 1);

if (uploadStart === -1 || uploadEnd === -1) {
  throw new Error("Could not locate uploadSingleFile function.");
}

let before = code.slice(0, uploadStart);
let uploadBlock = code.slice(uploadStart, uploadEnd);
let after = code.slice(uploadEnd);

// Remove browser alert lines related to upload success.
uploadBlock = uploadBlock.replace(
  /^\s*(window\.)?alert\(\s*["'`]File uploaded successfully\.?["'`]\s*\);\s*$/gm,
  ""
);

uploadBlock = uploadBlock.replace(
  /^\s*(window\.)?alert\([^;\n]*(uploaded|Upload)[^;\n]*\);\s*$/gm,
  ""
);

// Make sure custom notification still exists on successful upload.
if (!uploadBlock.includes("setUploadNotification(")) {
  uploadBlock = uploadBlock.replace(
    /if \(response\.ok\) \{/,
    `if (response.ok) {
        const uploadedName =
          typeof finalFileName !== "undefined"
            ? finalFileName
            : singleFile?.name || "file";

        setUploadNotification(\`File uploaded successfully: \${uploadedName}\`);`
  );
}

code = before + uploadBlock + after;

fs.writeFileSync(file, code);

console.log("Browser upload alert removed. Custom notification remains.");
console.log("Backup created:", `${file}.bak-remove-upload-alert-${stamp}`);
