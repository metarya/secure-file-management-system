const fs = require("fs");

const file = "src/App.jsx";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");

let code = fs.readFileSync(file, "utf8");
fs.copyFileSync(file, `${file}.bak-hide-home-my-files-${stamp}`);

code = code.replace(
  /<section className="card wide-card">\s*\n\s*<div className="section-header">\s*\n\s*<div>\s*\n\s*<h3>My Files<\/h3>/,
  `<section className="card wide-card home-my-files-section">
          <div className="section-header">
            <div>
              <h3>My Files</h3>`
);

fs.writeFileSync(file, code);

console.log("Old Home My Files section marked for hiding.");
console.log("Backup created:", `${file}.bak-hide-home-my-files-${stamp}`);
