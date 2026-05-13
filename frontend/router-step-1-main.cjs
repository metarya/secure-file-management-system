const fs = require("fs");

const file = "src/main.jsx";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");

let code = fs.readFileSync(file, "utf8");
fs.copyFileSync(file, `${file}.bak-router-step-1-${stamp}`);

// Add BrowserRouter import if missing
if (!code.includes("BrowserRouter")) {
  code = code.replace(
    /import\s+React\s+from\s+["']react["'];?/,
    `import React from "react";\nimport { BrowserRouter } from "react-router-dom";`
  );
}

// Wrap <App /> with <BrowserRouter>
if (!code.includes("<BrowserRouter>")) {
  code = code.replace(
    /<App\s*\/>/,
    `<BrowserRouter>\n      <App />\n    </BrowserRouter>`
  );
}

fs.writeFileSync(file, code);

console.log("Routing Step 1 done: BrowserRouter added to main.jsx");
console.log("Backup created:", `${file}.bak-router-step-1-${stamp}`);
