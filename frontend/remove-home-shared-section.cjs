const fs = require("fs");

const file = "src/App.jsx";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");

let code = fs.readFileSync(file, "utf8");
fs.copyFileSync(file, `${file}.bak-remove-home-shared-${stamp}`);

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

const marker = "<h3>Shared With Me</h3>";
const markerIndex = code.indexOf(marker);

if (markerIndex === -1) {
  console.log("Shared With Me section not found. It may already be removed.");
} else {
  const sectionStart = code.lastIndexOf("<section", markerIndex);
  const sectionEnd = findMatchingSectionEnd(code, sectionStart);

  if (sectionStart === -1 || sectionEnd === -1) {
    throw new Error("Could not safely locate full Shared With Me section.");
  }

  code = code.slice(0, sectionStart) + code.slice(sectionEnd);

  fs.writeFileSync(file, code);

  console.log("Home page Shared With Me section removed.");
  console.log("Backup created:", `${file}.bak-remove-home-shared-${stamp}`);
}
