const fs = require("fs");

const file = "src/style.css";
let css = fs.readFileSync(file, "utf8");

css = css.replace(
  /\/\* Simple file page nav START \*\/[\s\S]*?\/\* Simple file page nav END \*\//g,
  ""
);

css += `

/* Simple file page nav START */
.page-nav {
  display: flex;
  gap: 12px;
  margin: 18px 0 24px;
}

.nav-link {
  text-decoration: none;
  border-radius: 12px;
  padding: 12px 18px;
  background: rgba(255, 255, 255, 0.14);
  color: #ffffff;
  font-weight: 700;
  border: 1px solid rgba(255, 255, 255, 0.28);
}

.nav-link:hover {
  opacity: 0.92;
}
/* Simple file page nav END */
`;

fs.writeFileSync(file, css);

console.log("Simple file page nav CSS added.");
