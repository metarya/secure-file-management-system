const fs = require("fs");

const file = "src/App.jsx";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");

let code = fs.readFileSync(file, "utf8");
fs.copyFileSync(file, `${file}.bak-upload-name-desc-ui-${stamp}`);

const customInputs = `
          <label>
            File Name
            <input
              type="text"
              placeholder="Enter file name"
              value={singleFileName}
              onChange={(e) => setSingleFileName(e.target.value)}
              required
            />
          </label>

          <label>
            Description
            <textarea
              placeholder="Enter file description"
              value={singleFileDescription}
              onChange={(e) => setSingleFileDescription(e.target.value)}
              rows="3"
            />
          </label>
`;

// Insert before the first file input inside File Upload section.
if (!code.includes("singleFileDescription")) {
  throw new Error("State was not added correctly. Run Step 1 first.");
}

if (!code.includes('placeholder="Enter file description"')) {
  const uploadMarker = "<h3>File Upload</h3>";
  const markerIndex = code.indexOf(uploadMarker);

  if (markerIndex === -1) {
    throw new Error("File Upload section not found.");
  }

  const inputIndex = code.indexOf("<input", markerIndex);

  if (inputIndex === -1) {
    throw new Error("File input not found after File Upload heading.");
  }

  code = code.slice(0, inputIndex) + customInputs + code.slice(inputIndex);
}

fs.writeFileSync(file, code);

console.log("File name and description inputs added to Upload File card.");
console.log("Backup created:", `${file}.bak-upload-name-desc-ui-${stamp}`);
