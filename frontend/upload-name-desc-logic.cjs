const fs = require("fs");

const file = "src/App.jsx";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");

let code = fs.readFileSync(file, "utf8");
fs.copyFileSync(file, `${file}.bak-upload-name-desc-logic-${stamp}`);

const start = code.indexOf("async function uploadSingleFile()");
if (start === -1) {
  throw new Error("uploadSingleFile function not found.");
}

let end = code.indexOf("\n  async function", start + 1);
if (end === -1) {
  end = code.indexOf("\n  function", start + 1);
}
if (end === -1) {
  throw new Error("Could not locate end of uploadSingleFile function.");
}

const newFunction = `async function uploadSingleFile() {
    if (!singleFile) {
      setSingleMessage("Please select one .txt file.");
      return;
    }

    const enteredFileName = singleFileName.trim();

    if (!enteredFileName) {
      setSingleMessage("Please enter a file name.");
      return;
    }

    const safeFileName = enteredFileName
      .replace(/[\\\\/:*?"<>|]/g, "-")
      .replace(/\\s+/g, " ")
      .trim();

    const finalFileName = safeFileName.toLowerCase().endsWith(".txt")
      ? safeFileName
      : \`\${safeFileName}.txt\`;

    const renamedFile = new File([singleFile], finalFileName, {
      type: singleFile.type || "text/plain",
      lastModified: singleFile.lastModified,
    });

    const formData = new FormData();
    formData.append("file", renamedFile);
    formData.append("ownerId", user.userId);
    formData.append("description", singleFileDescription.trim());

    try {
      const response = await fetch(\`\${API_BASE_URL}/files/upload\`, {
        method: "POST",
        headers: authHeaders(user),
        body: formData,
      });

      const text = await response.text();
      setSingleMessage(response.ok ? "File uploaded successfully." : text);

      if (response.ok) {
        setSingleFile(null);
        setSingleFileName("");
        setSingleFileDescription("");
        loadMyFiles();

        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) {
          fileInput.value = "";
        }
      }
    } catch (error) {
      setSingleMessage("Upload failed: " + error.message);
    }
  }
`;

code = code.slice(0, start) + newFunction + code.slice(end);

fs.writeFileSync(file, code);

console.log("Upload logic updated for custom file name and description.");
console.log("Backup created:", `${file}.bak-upload-name-desc-logic-${stamp}`);
