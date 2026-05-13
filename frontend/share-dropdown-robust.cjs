const fs = require("fs");

const file = "src/App.jsx";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");

let code = fs.readFileSync(file, "utf8");
fs.copyFileSync(file, `${file}.bak-share-dropdown-robust-${stamp}`);

function findMatchingSectionEnd(source, startIndex) {
  let position = startIndex;
  let depth = 0;

  while (position < source.length) {
    const nextOpen = source.indexOf("<section", position);
    const nextClose = source.indexOf("</section>", position);

    if (nextClose === -1) return -1;

    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      position = nextOpen + "<section".length;
    } else {
      depth--;
      position = nextClose + "</section>".length;

      if (depth === 0) return position;
    }
  }

  return -1;
}

const marker = "<h3>Share File Access</h3>";
const markerIndex = code.indexOf(marker);

if (markerIndex === -1) {
  throw new Error("Share File Access heading not found.");
}

const sectionStart = code.lastIndexOf("<section", markerIndex);
const sectionEnd = findMatchingSectionEnd(code, sectionStart);

if (sectionStart === -1 || sectionEnd === -1) {
  throw new Error("Could not safely locate Share File Access section.");
}

let section = code.slice(sectionStart, sectionEnd);

const shareFileIdIndex = section.indexOf("shareFileId");

if (shareFileIdIndex === -1) {
  throw new Error("shareFileId not found inside Share File Access section.");
}

const labelStart = section.lastIndexOf("<label", shareFileIdIndex);
const labelEnd = section.indexOf("</label>", shareFileIdIndex) + "</label>".length;

if (labelStart === -1 || labelEnd === -1) {
  throw new Error("Could not locate File ID label block.");
}

const dropdownBlock = `<label>
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

section = section.slice(0, labelStart) + dropdownBlock + section.slice(labelEnd);

code = code.slice(0, sectionStart) + section + code.slice(sectionEnd);

fs.writeFileSync(file, code);

console.log("Share File Access updated: File ID removed and File Name dropdown added.");
console.log("Backup created:", `${file}.bak-share-dropdown-robust-${stamp}`);
