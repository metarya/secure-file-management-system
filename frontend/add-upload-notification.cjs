const fs = require("fs");

const file = "src/App.jsx";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");

let code = fs.readFileSync(file, "utf8");
fs.copyFileSync(file, `${file}.bak-upload-notification-${stamp}`);

// Make sure useEffect is imported.
code = code.replace(
  /import React, \{ useState \} from "react";/,
  `import React, { useEffect, useState } from "react";`
);

// Add upload notification state after singleMessage state.
if (!code.includes("uploadNotification")) {
  code = code.replace(
    /const \[singleMessage, setSingleMessage\] = useState\(""\);/,
    `const [singleMessage, setSingleMessage] = useState("");
  const [uploadNotification, setUploadNotification] = useState("");`
  );
}

// Add auto-clear effect.
if (!code.includes("Upload notification auto clear")) {
  code = code.replace(
    /const \[uploadNotification, setUploadNotification\] = useState\(""\);/,
    `const [uploadNotification, setUploadNotification] = useState("");

  // Upload notification auto clear
  useEffect(() => {
    if (!uploadNotification) {
      return;
    }

    const timer = setTimeout(() => {
      setUploadNotification("");
    }, 4000);

    return () => clearTimeout(timer);
  }, [uploadNotification]);`
  );
}

// Add notification component inside dashboard main area.
if (!code.includes("upload-notification")) {
  code = code.replace(
    /<main className="dashboard">/,
    `<main className="dashboard">
        {uploadNotification && (
          <div className="upload-notification">
            {uploadNotification}
          </div>
        )}`
  );
}

// Add notification inside uploadSingleFile success block.
const uploadStart = code.indexOf("async function uploadSingleFile()");
let uploadEnd = code.indexOf("\n  async function", uploadStart + 1);

if (uploadStart === -1 || uploadEnd === -1) {
  throw new Error("Could not locate uploadSingleFile function.");
}

let before = code.slice(0, uploadStart);
let uploadBlock = code.slice(uploadStart, uploadEnd);
let after = code.slice(uploadEnd);

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

console.log("Upload notification added.");
console.log("Backup created:", `${file}.bak-upload-notification-${stamp}`);
