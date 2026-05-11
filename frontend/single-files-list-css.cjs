const fs = require("fs");

const file = "src/style.css";
let css = fs.readFileSync(file, "utf8");

css = css.replace(
  /\/\* Single files list CSS START \*\/[\s\S]*?\/\* Single files list CSS END \*\//g,
  ""
);

css += `

/* Single files list CSS START */
.status-badge.shared {
  background: #dbeafe;
  color: #1d4ed8;
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
/* Single files list CSS END */
`;

fs.writeFileSync(file, css);

console.log("Single files list CSS added.");
