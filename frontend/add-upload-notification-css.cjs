const fs = require("fs");

const file = "src/style.css";
let css = fs.readFileSync(file, "utf8");

css = css.replace(
  /\/\* Upload notification START \*\/[\s\S]*?\/\* Upload notification END \*\//g,
  ""
);

css += `

/* Upload notification START */
.upload-notification {
  position: fixed;
  top: 22px;
  right: 22px;
  z-index: 1200;
  max-width: 360px;
  background: #dcfce7;
  color: #166534;
  border: 1px solid #86efac;
  border-radius: 14px;
  padding: 14px 16px;
  font-weight: 700;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.18);
}
/* Upload notification END */
`;

fs.writeFileSync(file, css);

console.log("Upload notification CSS added.");
