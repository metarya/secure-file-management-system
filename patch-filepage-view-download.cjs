const fs = require("fs");

const file = "frontend/src/pages/FilePage.jsx";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");

let code = fs.readFileSync(file, "utf8");
fs.copyFileSync(file, `${file}.bak-view-download-filepage-${stamp}`);

// Preview must use preview endpoint, not download endpoint.
code = code.replace(
  /`\$\{API_BASE_URL\}\/files\/download\/\$\{fileId\}\?userId=\$\{user\.userId\}`/g,
  "`${API_BASE_URL}/files/preview/${fileId}?userId=${user.userId}`"
);

// But the real downloadFile function must continue using download endpoint.
// Fix accidental replacement inside downloadFile by targeting its block.
const downloadStart = code.indexOf("  async function downloadFile(file)");
const deleteStart = code.indexOf("  async function deleteFile(file)", downloadStart);

if (downloadStart !== -1 && deleteStart !== -1) {
  let before = code.slice(0, downloadStart);
  let block = code.slice(downloadStart, deleteStart);
  let after = code.slice(deleteStart);

  block = block.replace(
    /`\$\{API_BASE_URL\}\/files\/preview\/\$\{fileId\}\?userId=\$\{user\.userId\}`/g,
    "`${API_BASE_URL}/files/download/${fileId}?userId=${user.userId}`"
  );

  code = before + block + after;
}

// Show shared permission inside visibility badge.
code = code.replace(
  /displayVisibility: "SHARED",/,
  `displayVisibility: String(file.permissionType || "").toUpperCase() === "DOWNLOAD" || String(file.permissionType || "").toUpperCase() === "VIEW_DOWNLOAD"
        ? "SHARED DOWNLOAD"
        : "SHARED VIEW",`
);

// Add canDownload calculation after dateValue.
if (!code.includes("const permissionCode = String(file.permissionType ||")) {
  code = code.replace(
    /const dateValue =\s*file\.sourceType === "SHARED"\s*\?\s*file\.sharedAt \|\| file\.createdAt \|\| "-"\s*:\s*file\.uploadedAt \|\| "-";/,
    `const dateValue =
              file.sourceType === "SHARED"
                ? file.sharedAt || file.createdAt || "-"
                : file.uploadedAt || "-";

            const permissionCode = String(file.permissionType || "").toUpperCase();
            const canDownload =
              file.sourceType !== "SHARED" ||
              permissionCode === "DOWNLOAD" ||
              permissionCode === "VIEW_DOWNLOAD";`
  );
}

// Wrap Download button with canDownload.
code = code.replace(
  /<button className="btn secondary" onClick=\{\(\) => downloadFile\(file\)\}>\s*Download\s*<\/button>/,
  `{canDownload && (
                    <button className="btn secondary" onClick={() => downloadFile(file)}>
                      Download
                    </button>
                  )}`
);

fs.writeFileSync(file, code);

console.log("/files page updated for VIEW vs DOWNLOAD shared permissions.");
console.log("Backup created:", `${file}.bak-view-download-filepage-${stamp}`);
