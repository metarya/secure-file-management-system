const fs = require("fs");

const file = "src/App.jsx";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");

let code = fs.readFileSync(file, "utf8");
fs.copyFileSync(file, `${file}.bak-simple-file-page-${stamp}`);

// Add FilePage import only.
if (!code.includes('import FilePage from "./pages/FilePage.jsx";')) {
  code = code.replace(
    /import\s+["']\.\/style\.css["'];?/,
    `import "./style.css";\nimport FilePage from "./pages/FilePage.jsx";`
  );
}

// Add simple path-based file page.
// This avoids moving/wrapping the old dashboard.
if (!code.includes("window.location.pathname === \"/files\"")) {
  code = code.replace(
    /function\s+App\s*\(\)\s*\{/,
    `function App() {
  if (window.location.pathname === "/files") {
    return <FilePage />;
  }`
  );
}

// Add simple nav link before dashboard main only.
if (!code.includes('href="/files"')) {
  code = code.replace(
    /<main className="dashboard">/,
    `<nav className="page-nav">
        <a className="nav-link" href="/">Home</a>
        <a className="nav-link" href="/files">Files</a>
      </nav>

      <main className="dashboard">`
  );
}

fs.writeFileSync(file, code);

console.log("Simple /files page connected safely.");
console.log("Backup created:", `${file}.bak-simple-file-page-${stamp}`);
