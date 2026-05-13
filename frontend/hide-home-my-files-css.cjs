const fs = require("fs");

const file = "src/style.css";
let css = fs.readFileSync(file, "utf8");

css = css.replace(
  /\/\* Hide home my files START \*\/[\s\S]*?\/\* Hide home my files END \*\//g,
  ""
);

css += `

/* Hide home my files START */
.home-my-files-section {
  display: none !important;
}

.file-page-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.back-home-button {
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
/* Hide home my files END */
`;

fs.writeFileSync(file, css);

console.log("Old Home My Files section hidden.");
