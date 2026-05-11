const fs = require("fs");

const file = "src/App.jsx";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");

let code = fs.readFileSync(file, "utf8");
fs.copyFileSync(file, `${file}.bak-upload-name-desc-state-${stamp}`);

if (!code.includes("singleFileName")) {
  code = code.replace(
    /const\s+\[singleFile,\s*setSingleFile\]\s*=\s*useState\([^)]*\);/,
    (match) => `${match}
  const [singleFileName, setSingleFileName] = useState("");
  const [singleFileDescription, setSingleFileDescription] = useState("");`
  );
}

fs.writeFileSync(file, code);

console.log("Upload file name and description states added.");
console.log("Backup created:", `${file}.bak-upload-name-desc-state-${stamp}`);
