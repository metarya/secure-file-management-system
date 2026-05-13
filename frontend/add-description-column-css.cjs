const fs = require("fs");

const file = "src/style.css";
let css = fs.readFileSync(file, "utf8");

css = css.replace(
  /\/\* File description column START \*\/[\s\S]*?\/\* File description column END \*\//g,
  ""
);

css += `

/* File description column START */
.description-cell {
  max-width: 260px;
  white-space: normal;
  line-height: 1.4;
  color: #475569;
}
/* File description column END */
`;

fs.writeFileSync(file, css);

console.log("Description column CSS added.");
