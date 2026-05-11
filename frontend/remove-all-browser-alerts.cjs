const fs = require("fs");

const files = [
  "src/App.jsx",
  "src/pages/FilePage.jsx"
];

const stamp = new Date().toISOString().replace(/[:.]/g, "-");

for (const file of files) {
  if (!fs.existsSync(file)) continue;

  let code = fs.readFileSync(file, "utf8");
  fs.copyFileSync(file, `${file}.bak-remove-all-alerts-${stamp}`);

  // Remove all browser alert(...) and window.alert(...) calls.
  code = code.replace(/\b(?:window\.)?alert\s*\([\s\S]*?\)\s*;?/g, "");

  fs.writeFileSync(file, code);

  console.log(`Removed browser alerts from ${file}`);
  console.log(`Backup created: ${file}.bak-remove-all-alerts-${stamp}`);
}
