const fs = require("fs");

const file = "src/style.css";
let css = fs.readFileSync(file, "utf8");

css = css.replace(
  /\/\* Router nav from main START \*\/[\s\S]*?\/\* Router nav from main END \*\//g,
  ""
);

css += `

/* Router nav from main START */
.page-nav {
  width: min(1180px, calc(100% - 32px));
  margin: 18px auto 0;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
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
/* Router nav from main END */
`;

fs.writeFileSync(file, css);

console.log("Router nav CSS added from main.jsx method.");
