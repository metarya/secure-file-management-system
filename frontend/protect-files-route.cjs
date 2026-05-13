const fs = require("fs");

const file = "src/pages/FilePage.jsx";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");

let code = fs.readFileSync(file, "utf8");
fs.copyFileSync(file, `${file}.bak-protect-files-route-${stamp}`);

// Add Navigate import if missing.
if (!code.includes("Navigate")) {
  code = code.replace(
    /import React, \{ useEffect, useState \} from "react";/,
    `import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";`
  );
}

// Stop showing login warning message inside /files.
code = code.replace(
  /setMessage\("Please login first from Home page\."\);\s*return;/g,
  `return;`
);

// Add redirect after hooks but before JSX return.
if (!code.includes("<Navigate to=\"/\" replace />")) {
  code = code.replace(
    /useEffect\(\(\) => \{\s*loadMyFiles\(\);\s*\}, \[\]\);\s*return \(/,
    `useEffect(() => {
    loadMyFiles();
  }, []);

  if (!user?.userId || !user?.token) {
    return <Navigate to="/" replace />;
  }

  return (`
  );
}

fs.writeFileSync(file, code);

console.log("/files route protected. Logged-out users redirect to Home/Login.");
console.log("Backup created:", `${file}.bak-protect-files-route-${stamp}`);
