const fs = require("fs");

const file = "src/pages/FilePage.jsx";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");

let code = fs.readFileSync(file, "utf8");
fs.copyFileSync(file, `${file}.bak-file-preview-${stamp}`);

// 1. Add preview states after searchName state.
if (!code.includes("previewText")) {
  code = code.replace(
    /const \[searchName, setSearchName\] = useState\(""\);/,
    `const [searchName, setSearchName] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFileName, setPreviewFileName] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);`
  );
}

// 2. Add previewFile function before downloadFile.
if (!code.includes("async function previewFile(file)")) {
  code = code.replace(
    /async function downloadFile\(file\) \{/,
    `async function previewFile(file) {
    const fileId = file.fileId || file.id;
    const fileName = file.fileName || file.name || "Preview file";

    try {
      setPreviewOpen(true);
      setPreviewFileName(fileName);
      setPreviewText("");
      setPreviewLoading(true);

      const response = await fetch(\`\${API_BASE_URL}/files/download/\${fileId}?userId=\${user.userId}\`, {
        headers: authHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Preview failed.");
      }

      const text = await response.text();
      setPreviewText(text || "File is empty.");
      setMessage("File preview loaded successfully.");
    } catch (error) {
      setPreviewText("Preview failed: " + error.message);
      setMessage("Preview failed: " + error.message);
    } finally {
      setPreviewLoading(false);
    }
  }

  async function downloadFile(file) {`
  );
}

// 3. Pass previewFile to FileTable.
code = code.replace(
  /<FileTable\s+files=\{displayedFiles\}\s+downloadFile=\{downloadFile\}\s+deleteFile=\{deleteFile\}\s+toggleVisibility=\{toggleVisibility\}\s*\/>/,
  `<FileTable
          files={displayedFiles}
          previewFile={previewFile}
          downloadFile={downloadFile}
          deleteFile={deleteFile}
          toggleVisibility={toggleVisibility}
        />`
);

// 4. Add Preview modal before section closes, after FileTable block.
if (!code.includes("preview-modal-overlay")) {
  code = code.replace(
    /(<FileTable[\s\S]*?toggleVisibility=\{toggleVisibility\}\s*\/>\s*)<\/section>/,
    `$1

        {previewOpen && (
          <div className="preview-modal-overlay">
            <div className="preview-modal">
              <div className="preview-header">
                <div>
                  <h3>{previewFileName}</h3>
                  <p className="muted">Text file preview</p>
                </div>

                <button
                  className="btn secondary"
                  onClick={() => setPreviewOpen(false)}
                >
                  Close
                </button>
              </div>

              <pre className="preview-content">
                {previewLoading ? "Loading preview..." : previewText}
              </pre>
            </div>
          </div>
        )}
      </section>`
  );
}

// 5. Update FileTable function signature.
code = code.replace(
  /function FileTable\(\{ files, downloadFile, deleteFile, toggleVisibility \}\)/,
  `function FileTable({ files, previewFile, downloadFile, deleteFile, toggleVisibility })`
);

// 6. Make file name clickable.
code = code.replace(
  /<td>\{fileName\}<\/td>/,
  `<td>
                  <button
                    type="button"
                    className="file-preview-link"
                    onClick={() => previewFile(file)}
                    title="Click to preview file"
                  >
                    {fileName}
                  </button>
                </td>`
);

fs.writeFileSync(file, code);

console.log("File preview added to /files page.");
console.log("Backup created:", `${file}.bak-file-preview-${stamp}`);
