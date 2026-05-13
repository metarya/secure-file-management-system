const fs = require("fs");

const file = "src/pages/FilePage.jsx";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");

let code = fs.readFileSync(file, "utf8");
fs.copyFileSync(file, `${file}.bak-custom-delete-confirm-${stamp}`);

// 1. Add delete modal states after previewLoading state.
if (!code.includes("deleteTarget")) {
  code = code.replace(
    /const \[previewLoading, setPreviewLoading\] = useState\(false\);/,
    `const [previewLoading, setPreviewLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);`
  );
}

// 2. Replace old deleteFile function with custom modal flow.
const deleteStart = code.indexOf("  async function deleteFile(file)");
const toggleStart = code.indexOf("  async function toggleVisibility(file)", deleteStart);

if (deleteStart === -1 || toggleStart === -1) {
  throw new Error("Could not locate deleteFile/toggleVisibility block.");
}

const newDeleteBlock = `  function deleteFile(file) {
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
        refreshAllFiles();
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

code = code.slice(0, deleteStart) + newDeleteBlock + code.slice(toggleStart);

// 3. Add delete confirmation modal before section closes.
if (!code.includes("delete-confirm-modal-overlay")) {
  code = code.replace(
    /(\s*)<\/section>\s*<\/main>/,
    `
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
    </main>`
  );
}

fs.writeFileSync(file, code);

console.log("Custom delete confirmation modal added.");
console.log("Backup created:", `${file}.bak-custom-delete-confirm-${stamp}`);
