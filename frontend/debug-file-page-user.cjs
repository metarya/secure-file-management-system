const fs = require("fs");

const file = "src/pages/FilePage.jsx";
let code = fs.readFileSync(file, "utf8");

if (!code.includes("Logged user debug")) {
  code = code.replace(
    /<p className="muted">\s*Metadata only\. fileData and fileHash are not shown\.\s*<\/p>/,
    `<p className="muted">
              Metadata only. fileData and fileHash are not shown.
            </p>

            <p className="muted">
              Logged user debug: {user?.userId || "No userId"} | {user?.email || "No email"}
            </p>`
  );
}

fs.writeFileSync(file, code);

console.log("Added logged user debug to FilePage.");
