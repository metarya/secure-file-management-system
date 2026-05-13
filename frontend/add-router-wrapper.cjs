const fs = require("fs");

const file = "src/App.jsx";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");

let code = fs.readFileSync(file, "utf8");
fs.copyFileSync(file, `${file}.bak-add-router-wrapper-${stamp}`);

// 1. Add router imports if missing
if (!code.includes('from "react-router-dom"')) {
  code = code.replace(
    /import React[\s\S]*?from "react";/,
    (match) => `${match}\nimport { Routes, Route, Link } from "react-router-dom";`
  );
}

// 2. Add FilePage import if missing
if (!code.includes('FilePage from "./pages/FilePage.jsx"')) {
  code = code.replace(
    /import "\.\/style\.css";/,
    `import "./style.css";\nimport FilePage from "./pages/FilePage.jsx";`
  );
}

// 3. Convert current default export dashboard into normal component
code = code.replace(
  /export\s+default\s+function\s+DashboardPage\s*\(/,
  "function DashboardPage("
);

// 4. Remove accidental old default exports if present
code = code.replace(/\nexport\s+default\s+DashboardPage\s*;?\s*$/g, "");

// 5. Append real App router wrapper if missing
if (!code.includes("function App()")) {
  code += `

function App() {
  return (
    <>
      <nav className="page-nav">
        <Link className="nav-link" to="/">
          Home
        </Link>

        <Link className="nav-link" to="/files">
          Files
        </Link>
      </nav>

      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/files" element={<FilePage />} />
      </Routes>
    </>
  );
}

export default App;
`;
}

fs.writeFileSync(file, code);

console.log("Router wrapper added.");
console.log("Backup created:", `${file}.bak-add-router-wrapper-${stamp}`);
