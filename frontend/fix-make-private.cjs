const fs = require("fs");

const file = "src/pages/FilePage.jsx";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");

let code = fs.readFileSync(file, "utf8");
fs.copyFileSync(file, `${file}.bak-fix-make-private-${stamp}`);

const fixedToggle = `
  async function toggleVisibility(file) {
    const fileId = file.fileId || file.id;
    const currentVisibility = String(file.visibility || file.displayVisibility || "PRIVATE").toUpperCase();
    const nextVisibility = currentVisibility === "PUBLIC" ? "PRIVATE" : "PUBLIC";

    const requestsToTry = [
      {
        method: "PUT",
        url: \`\${API_BASE_URL}/files/\${fileId}/visibility?userId=\${user.userId}&visibility=\${nextVisibility}\`,
        body: null,
      },
      {
        method: "PUT",
        url: \`\${API_BASE_URL}/files/\${fileId}/visibility?visibility=\${nextVisibility}&userId=\${user.userId}\`,
        body: null,
      },
      {
        method: "PATCH",
        url: \`\${API_BASE_URL}/files/\${fileId}/visibility?userId=\${user.userId}&visibility=\${nextVisibility}\`,
        body: null,
      },
      {
        method: "PATCH",
        url: \`\${API_BASE_URL}/files/\${fileId}/visibility?visibility=\${nextVisibility}&userId=\${user.userId}\`,
        body: null,
      },
      {
        method: "PUT",
        url: \`\${API_BASE_URL}/files/\${fileId}/visibility\`,
        body: JSON.stringify({
          userId: user.userId,
          visibility: nextVisibility,
        }),
      },
      {
        method: "PATCH",
        url: \`\${API_BASE_URL}/files/\${fileId}/visibility\`,
        body: JSON.stringify({
          userId: user.userId,
          visibility: nextVisibility,
        }),
      },
    ];

    let finalError = "";

    for (const request of requestsToTry) {
      try {
        const headers = {
          ...authHeaders(),
        };

        if (request.body) {
          headers["Content-Type"] = "application/json";
        }

        const response = await fetch(request.url, {
          method: request.method,
          headers,
          body: request.body,
        });

        if (response.ok) {
          setMessage(\`File visibility changed to \${nextVisibility}.\`);
          await refreshAllFiles();
          return;
        }

        finalError = await response.text();
      } catch (error) {
        finalError = error.message;
      }
    }

    setMessage(finalError || "Visibility update failed.");
  }
`;

const start = code.indexOf("  async function toggleVisibility(file)");
if (start === -1) {
  throw new Error("toggleVisibility function not found in FilePage.jsx");
}

const nextFunctionStart = code.indexOf("\n  useEffect", start);
if (nextFunctionStart === -1) {
  throw new Error("Could not locate end of toggleVisibility function");
}

code = code.slice(0, start) + fixedToggle + code.slice(nextFunctionStart);

fs.writeFileSync(file, code);

console.log("Make PUBLIC / Make PRIVATE fixed in FilePage.jsx.");
console.log("Backup created:", `${file}.bak-fix-make-private-${stamp}`);
