const fs = require("fs");

const file = "src/style.css";
let css = fs.readFileSync(file, "utf8");

css = css.replace(
  /\/\* Upload description textarea START \*\/[\s\S]*?\/\* Upload description textarea END \*\//g,
  ""
);

css += `

/* Upload description textarea START */
textarea {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 12px 14px;
  outline: none;
  background: #ffffff;
  font: inherit;
  resize: vertical;
}

textarea:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.16);
}
/* Upload description textarea END */
`;

fs.writeFileSync(file, css);

console.log("Textarea CSS added.");
