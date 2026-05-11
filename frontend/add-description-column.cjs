const fs = require("fs");

const file = "src/pages/FilePage.jsx";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");

let code = fs.readFileSync(file, "utf8");
fs.copyFileSync(file, `${file}.bak-add-description-column-${stamp}`);

// Add Description header after File Name.
code = code.replace(
  /<th>File Name<\/th>\s*<th>Type<\/th>/,
  `<th>File Name</th>
            <th>Description</th>
            <th>Type</th>`
);

// Add description variable after fileName variable.
code = code.replace(
  /const fileName = file\.fileName \|\| file\.name \|\| "Unnamed file";/,
  `const fileName = file.fileName || file.name || "Unnamed file";
            const description =
              file.description ||
              file.fileDescription ||
              file.file_description ||
              file.details ||
              "-";`
);

// Add description cell after file name cell.
code = code.replace(
  /<td>\{fileName\}<\/td>\s*<td>\{fileType\}<\/td>/,
  `<td>{fileName}</td>
                <td className="description-cell">{description}</td>
                <td>{fileType}</td>`
);

fs.writeFileSync(file, code);

console.log("Description column added to /files page.");
console.log("Backup created:", `${file}.bak-add-description-column-${stamp}`);
