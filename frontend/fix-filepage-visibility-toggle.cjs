const fs = require("fs");

const file = "src/pages/FilePage.jsx";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");

let code = fs.readFileSync(file, "utf8");
fs.copyFileSync(file, `${file}.bak-fix-visibility-toggle-${stamp}`);

const newToggleFunction = `
  async function toggleVisibility(file) {
    const fileId = file.fileId || file.id;
    const currentVisibility = String(file.visibility || "PRIVATE").toUpperCase();
    const nextVisibility = currentVisibility === "PUBLIC" ? "PRIVATE" : "PUBLIC";

    const possibleRequests = [
      {
        method: "PUT",
        url: \`\${API_BASE_URL}/files/\${fileId}/visibility?userId=\${user.userId}&visibility=\${nextVisibility}\`,
      },
      {
        method: "PUT",
        url: \`\${API_BASE_URL}/files/\${fileId}/visibility?visibility=\${nextVisibility}&userId=\${user.userId}\`,
      },
      {
        method: "PATCH",
        url: \`\${API_BASE_URL}/files/\${fileId}/visibility?userId=\${user.userId}&visibility=\${nextVisibility}\`,
      },
      {
        method: "PATCH",
        url: \`\${API_BASE_URL}/files/\${fileId}/visibility?visibility=\${nextVisibility}&userId=\${user.userId}\`,
      },
    ];

    let lastError = "";

    for (const request of possibleRequests) {
      try {
        const response = await fetch(request.url, {
          method: request.method,
          headers: authHeaders(),
        });

        if (response.ok) {
          setMessage(\`File visibility changed to \${nextVisibility}.\`);
          await loadMyFiles();
          return;
        }

        lastError = await response.text();
      } catch (error) {
        lastError = error.message;
      }
    }

    setMessage(lastError || "Visibility update failed.");
  }
`;

// Replace existing toggleVisibility function.
const start = code.indexOf("  async function toggleVisibility(file)");
if (start === -1) {
  throw new Error("Could not find toggleVisibility function in FilePage.jsx");
}

const nextFunctionStart = code.indexOf("\n  useEffect", start);
if (nextFunctionStart === -1) {
  throw new Error("Could not find useEffect after toggleVisibility function");
}

code = code.slice(0, start) + newToggleFunction + code.slice(nextFunctionStart);

fs.writeFileSync(file, code);

console.log("Visibility toggle fixed in FilePage.jsx.");
console.log("Backup created:", `${file}.bak-fix-visibility-toggle-${stamp}`);
