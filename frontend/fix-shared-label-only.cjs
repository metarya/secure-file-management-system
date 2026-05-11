const fs = require("fs");

const file = "src/pages/FilePage.jsx";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");

let code = fs.readFileSync(file, "utf8");
fs.copyFileSync(file, `${file}.bak-shared-label-only-${stamp}`);

// Replace shared display label logic with simple SHARED label.
// Permission logic for Download button remains unchanged.
code = code.replace(
  /displayVisibility:\s*String\(file\.permissionType \|\| ""\)\.toUpperCase\(\) === "DOWNLOAD" \|\| String\(file\.permissionType \|\| ""\)\.toUpperCase\(\) === "VIEW_DOWNLOAD"\s*\?\s*"SHARED DOWNLOAD"\s*:\s*"SHARED VIEW",/,
  `displayVisibility: "SHARED",`
);

fs.writeFileSync(file, code);

console.log("Shared visibility label changed to SHARED only.");
console.log("Backup created:", `${file}.bak-shared-label-only-${stamp}`);
