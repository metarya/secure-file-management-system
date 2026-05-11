const fs = require("fs");

const file = "src/style.css";
let css = fs.readFileSync(file, "utf8");

css = css.replace(
  /\/\* File preview modal START \*\/[\s\S]*?\/\* File preview modal END \*\//g,
  ""
);

css += `

/* File preview modal START */
.file-preview-link {
  border: none;
  background: transparent;
  color: #2563eb;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
  text-align: left;
  text-decoration: underline;
}

.file-preview-link:hover {
  color: #1d4ed8;
}

.preview-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(15, 23, 42, 0.62);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.preview-modal {
  width: min(900px, 100%);
  max-height: 82vh;
  overflow: hidden;
  background: #ffffff;
  border-radius: 18px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.28);
  display: flex;
  flex-direction: column;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  padding: 18px 20px;
  border-bottom: 1px solid #e2e8f0;
}

.preview-header h3 {
  margin: 0;
  color: #0f172a;
}

.preview-content {
  margin: 0;
  padding: 20px;
  overflow: auto;
  max-height: 62vh;
  white-space: pre-wrap;
  word-break: break-word;
  color: #0f172a;
  background: #f8fafc;
  font-family: Consolas, Monaco, "Courier New", monospace;
  font-size: 14px;
  line-height: 1.6;
}
/* File preview modal END */
`;

fs.writeFileSync(file, css);

console.log("File preview CSS added.");
