const fs = require("fs");

const file = "src/App.jsx";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");

let code = fs.readFileSync(file, "utf8");
fs.copyFileSync(file, `${file}.bak-share-file-name-dropdown-${stamp}`);

const replacement = `<label>
            File Name
            <select
              value={shareFileId}
              onChange={(e) => setShareFileId(e.target.value)}
              required
            >
              <option value="">Select file to share</option>
              {files.map((file) => {
                const optionFileId = file.fileId || file.id;

                return (
                  <option key={optionFileId} value={optionFileId}>
                    {file.fileName}
                  </option>
                );
              })}
            </select>
          </label>`;

// Replace the File ID label/input block inside Share File Access.
let replaced = false;

const patterns = [
  /<label>\s*File ID\s*<input[\s\S]*?value=\{shareFileId\}[\s\S]*?onChange=\{\(e\)\s*=>\s*setShareFileId\(e\.target\.value\)\}[\s\S]*?\/>\s*<\/label>/,
  /<label>\s*File ID\s*<input[\s\S]*?onChange=\{\(e\)\s*=>\s*setShareFileId\(e\.target\.value\)\}[\s\S]*?\/>\s*<\/label>/,
  /<label>\s*File ID\s*<input[\s\S]*?placeholder="Enter file ID"[\s\S]*?\/>\s*<\/label>/
];

for (const pattern of patterns) {
  if (pattern.test(code)) {
    code = code.replace(pattern, replacement);
    replaced = true;
    break;
  }
}

if (!replaced) {
  throw new Error("Could not find the Share File ID input block. Send the Share File Access section from App.jsx.");
}

fs.writeFileSync(file, code);

console.log("Share File Access updated: File ID removed, File Name dropdown added.");
console.log("Backup created:", `${file}.bak-share-file-name-dropdown-${stamp}`);
