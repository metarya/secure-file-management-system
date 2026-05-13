const fs = require("fs");

const file = "src/App.jsx";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");

let code = fs.readFileSync(file, "utf8");
fs.copyFileSync(file, `${file}.bak-direct-files-page-${stamp}`);

const directFilesPage = `function App() {
  if (window.location.pathname === "/files") {
    return (
      <main className="dashboard">
        <section className="card wide-card">
          <div className="section-header">
            <div>
              <h3>Files Page</h3>
              <p className="muted">
                Blank file page connected successfully.
              </p>
            </div>
          </div>

          <div className="empty-state">
            File page is working.
          </div>

          <a className="btn secondary" href="/">
            Back to Home
          </a>
        </section>
      </main>
    );
  }`;

// Insert only if this direct files page is not already present.
if (!code.includes('window.location.pathname === "/files"')) {
  code = code.replace(/function\s+App\s*\(\)\s*\{/, directFilesPage);
}

// Add nav before dashboard if missing.
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

console.log("Direct /files page added.");
console.log("Backup created:", `${file}.bak-direct-files-page-${stamp}`);
