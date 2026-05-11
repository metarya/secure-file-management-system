const fs = require("fs");

const file = "src/style.css";
let css = fs.readFileSync(file, "utf8");

css = css.replace(
  /\/\* Files page button START \*\/[\s\S]*?\/\* Files page button END \*\//g,
  ""
);

css += `

/* Files page button START */
.files-page-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  margin-right: 12px;
}
/* Files page button END */
`;

fs.writeFileSync(file, css);

console.log("Files button CSS added.");
