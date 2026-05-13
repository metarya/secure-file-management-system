const fs = require("fs");

const file = "src/App.jsx";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");

let code = fs.readFileSync(file, "utf8");
fs.copyFileSync(file, `${file}.bak-real-router-files-${stamp}`);

// Remove old accidental router imports if any.
code = code.replace(/import\s+\{[^}]*Routes[^}]*\}\s+from\s+["']react-router-dom["'];?\r?\n/g, "");
code = code.replace(/import\s+FilePage\s+from\s+["']\.\/pages\/FilePage\.jsx["'];?\r?\n/g, "");

// Add proper router imports after CSS import.
code = code.replace(
  /import\s+["']\.\/style\.css["'];?/,
  `import "./style.css";
import { Routes, Route, Link } from "react-router-dom";
import FilePage from "./pages/FilePage.jsx";`
);

// Rename old App component to DashboardPage.
if (!code.includes("function DashboardPage(")) {
  code = code.replace(/function\s+App\s*\(/, "function DashboardPage(");
}

// Replace default export with new router App wrapper.
code = code.replace(
  /export\s+default\s+App\s*;?/,
  `
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
`
);

fs.writeFileSync(file, code);

console.log("Real router /files page connected.");
console.log("Backup created:", `${file}.bak-real-router-files-${stamp}`);
