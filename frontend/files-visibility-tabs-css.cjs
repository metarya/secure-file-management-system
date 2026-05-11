const fs = require("fs");

const file = "src/style.css";
let css = fs.readFileSync(file, "utf8");

css = css.replace(
  /\/\* Files page visibility tabs START \*\/[\s\S]*?\/\* Files page visibility tabs END \*\//g,
  ""
);

css += `

/* Files page visibility tabs START */
.home-shared-files-section {
  display: none !important;
}

.visibility-tabs {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin: 18px 0;
}

.visibility-tabs .active-tab {
  background: #2563eb;
  color: #ffffff;
}

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
/* Files page visibility tabs END */
`;

fs.writeFileSync(file, css);

console.log("Files page visibility tabs CSS added.");
