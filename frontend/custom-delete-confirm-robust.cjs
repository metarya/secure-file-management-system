const fs = require("fs");

const file = "src/pages/FilePage.jsx";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");

let code = fs.readFileSync(file, "utf8");
fs.copyFileSync(file, `${file}.bak-custom-delete-confirm-robust-${stamp}`);

function findFunctionEnd(source, functionStart) {
  const openBrace = source.indexOf("{", functionStart);

  if (openBrace === -1) {
    return -1;
  }

  let depth = 0;

  for (let i = openBrace; i < source.length; i++) {
    const char = source[i];

    if (char === "{") {
      depth++;
    }

    if (char === "}") {
      depth--;

      if (depth === 0) {
        return i + 1;
      }
    }
  }

  return -1;
}

// 1. Add delete modal states after previewLoading state.
if (!code.includes("const [deleteTarget, setDeleteTarget]")) {
  code = code.replace(
    /const \[previewLoading, setPreviewLoading\] = useState\(false\);/,
    `const [previewLoading, setPreviewLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);`
  );
}

// 2. Find deleteFile function whether it is async or normal.
const deleteMatch = code.match(/\n\s*(async\s+)?function\s+deleteFile\s*\(\s*file\s*\)\s*\{/);

if (!deleteMatch) {
  throw new Error("deleteFile(file) function not found. Run Select-String -Path src\\pages\\FilePage.jsx -Pattern \"deleteFile|confirm|Delete\" -Context 4,4 and send output.");
}

const deleteStart = deleteMatch.index;
const deleteEnd = findFunctionEnd(code, deleteStart);

if (deleteEnd === -1) {
  throw new Error("Could not find end of deleteFile function.");
}

const newDeleteFunctions = `
  function deleteFile(file) {
    setDeleteTarget(file);
  }

  function cancelDeleteFile() {
    if (!deleteLoading) {
      setDeleteTarget(null);
    }
  }

  async function confirmDeleteFile() {
    if (!deleteTarget) {
      return;
    }

    const file = deleteTarget;
    const fileId = file.fileId || file.id;
    const fileName = file.fileName || file.name || "this file";

    try {
      setDeleteLoading(true);

      const response = await fetch(\`\${API_BASE_URL}/files/\${fileId}?userId=\${user.userId}\`, {
        method: "DELETE",
        headers: authHeaders(),
      });

      if (response.ok) {
        setMessage(\`File deleted successfully: \${fileName}\`);
        setDeleteTarget(null);
        await refreshAllFiles();
      } else {
        const text = await response.text();
        setMessage(text || "Delete failed.");
      }
    } catch (error) {
      setMessage("Delete failed: " + error.message);
    } finally {
      setDeleteLoading(false);
    }
  }
`;

code = code.slice(0, deleteStart) + newDeleteFunctions + code.slice(deleteEnd);

// 3. Add modal before closing section/main.
if (!code.includes("delete-confirm-modal-overlay")) {
  const closePattern = /<\/section>\s*<\/main>/;
  const modalBlock = `
        {deleteTarget && (
          <div className="delete-confirm-modal-overlay">
            <div className="delete-confirm-modal">
              <h3>Delete File</h3>

              <p>
                Are you sure you want to delete
                <strong> {deleteTarget.fileName || deleteTarget.name || "this file"}</strong>?
              </p>

              <p className="muted">
                This action will remove the file from your account.
              </p>

              <div className="delete-confirm-actions">
                <button
                  className="btn secondary"
                  onClick={cancelDeleteFile}
                  disabled={deleteLoading}
                >
                  Cancel
                </button>

                <button
                  className="btn danger"
                  onClick={confirmDeleteFile}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? "Deleting..." : "Delete File"}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>`;

  if (!closePattern.test(code)) {
    throw new Error("Could not find </section></main> closing area for modal.");
  }

  code = code.replace(closePattern, modalBlock);
}

// 4. Remove any remaining browser confirm calls.
code = code.replace(/\b(?:window\.)?confirm\s*\([\s\S]*?\)\s*;?/g, "");

fs.writeFileSync(file, code);

console.log("Custom delete confirmation modal added.");
console.log("Backup created:", `${file}.bak-custom-delete-confirm-robust-${stamp}`);
