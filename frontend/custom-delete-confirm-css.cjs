const fs = require("fs");

const file = "src/style.css";
let css = fs.readFileSync(file, "utf8");

css = css.replace(
  /\/\* Custom delete confirm START \*\/[\s\S]*?\/\* Custom delete confirm END \*\//g,
  ""
);

css += `

/* Custom delete confirm START */
.delete-confirm-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1300;
  background: rgba(15, 23, 42, 0.62);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.delete-confirm-modal {
  width: min(460px, 100%);
  background: #ffffff;
  border-radius: 18px;
  padding: 24px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.28);
}

.delete-confirm-modal h3 {
  margin: 0 0 12px;
  color: #0f172a;
}

.delete-confirm-modal p {
  margin: 0 0 12px;
  color: #334155;
  line-height: 1.5;
}

.delete-confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}
/* Custom delete confirm END */
`;

fs.writeFileSync(file, css);

console.log("Custom delete confirmation CSS added.");
