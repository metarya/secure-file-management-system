const fs = require("fs");

const file = "src/pages/FilePage.jsx";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");

let code = fs.readFileSync(file, "utf8");
fs.copyFileSync(file, `${file}.bak-fix-filepage-localstorage-${stamp}`);

// Replace the current user state block with a safer reader.
// It checks common keys used during the project.
code = code.replace(
  /const \[user\] = useState\(\(\) => \{\s*const savedUser = localStorage\.getItem\("sfms_user"\);\s*return savedUser \? JSON\.parse\(savedUser\) : null;\s*\}\);/s,
  `const [user] = useState(() => {
    const possibleKeys = ["sfms_user", "user", "loggedInUser", "currentUser"];

    for (const key of possibleKeys) {
      const savedUser = localStorage.getItem(key);

      if (savedUser) {
        try {
          return JSON.parse(savedUser);
        } catch {
          continue;
        }
      }
    }

    return null;
  });`
);

// Remove debug line if it was added earlier.
code = code.replace(
  /\s*<p className="muted">\s*Logged user debug:[\s\S]*?<\/p>/,
  ""
);

fs.writeFileSync(file, code);

console.log("FilePage localStorage user reader fixed.");
console.log("Backup created:", `${file}.bak-fix-filepage-localstorage-${stamp}`);
