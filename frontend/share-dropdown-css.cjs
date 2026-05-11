const fs = require("fs");

const file = "src/style.css";
let css = fs.readFileSync(file, "utf8");

css = css.replace(
  /\/\* Share dropdown CSS START \*\/[\s\S]*?\/\* Share dropdown CSS END \*\//g,
  ""
);

css += `

/* Share dropdown CSS START */
select {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 12px 14px;
  outline: none;
  background: #ffffff;
  font: inherit;
}

select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.16);
}
/* Share dropdown CSS END */
`;

fs.writeFileSync(file, css);

console.log("Share dropdown CSS added.");
