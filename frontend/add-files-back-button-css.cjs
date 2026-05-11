const fs = require("fs");

const file = "src/style.css";
let css = fs.readFileSync(file, "utf8");

css = css.replace(
  /\/\* Back home button START \*\/[\s\S]*?\/\* Back home button END \*\//g,
  ""
);

css += `

/* Back home button START */
.back-home-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  margin-right: 12px;
}
/* Back home button END */
`;

fs.writeFileSync(file, css);

console.log("Back to Home button CSS added.");
