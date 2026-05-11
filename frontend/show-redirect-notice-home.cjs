const fs = require("fs");

const file = "src/App.jsx";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");

let code = fs.readFileSync(file, "utf8");
fs.copyFileSync(file, `${file}.bak-show-redirect-notice-${stamp}`);

const marker = "Show redirect notice from protected pages";

if (!code.includes(marker)) {
  code = code.replace(
    /(const\s+\[dashboardMessage,\s*setDashboardMessage\]\s*=\s*useState\([^)]*\);)/,
    `$1

  // ${marker}
  useEffect(() => {
    const notice = sessionStorage.getItem("sfms_redirect_notice");

    if (notice) {
      setDashboardMessage(notice);
      sessionStorage.removeItem("sfms_redirect_notice");
    }
  }, []);`
  );
}

fs.writeFileSync(file, code);

console.log("Home page now shows protected-page notice inline.");
console.log("Backup created:", `${file}.bak-show-redirect-notice-${stamp}`);
