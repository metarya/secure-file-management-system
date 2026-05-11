const fs = require("fs");

const file = "frontend/src/App.jsx";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");

let code = fs.readFileSync(file, "utf8");
fs.copyFileSync(file, `${file}.bak-view-download-share-ui-${stamp}`);

// Default permission becomes VIEW.
code = code.replace(
  /const \[permissionType, setPermissionType\] = useState\("VIEW_DOWNLOAD"\);/,
  `const [permissionType, setPermissionType] = useState("VIEW");`
);

// Replace old one-option dropdown.
code = code.replace(
  /<option value="VIEW_DOWNLOAD">VIEW_DOWNLOAD<\/option>/,
  `<option value="VIEW">View Only</option>
            <option value="DOWNLOAD">View + Download</option>`
);

fs.writeFileSync(file, code);

console.log("Share permission dropdown changed to View Only / View + Download.");
console.log("Backup created:", `${file}.bak-view-download-share-ui-${stamp}`);
