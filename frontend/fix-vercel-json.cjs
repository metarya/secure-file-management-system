const fs = require("fs");

const config = {
  rewrites: [
    {
      source: "/(.*)",
      destination: "/index.html"
    }
  ]
};

fs.writeFileSync("vercel.json", JSON.stringify(config, null, 2), "utf8");

console.log("vercel.json created successfully.");
console.log(fs.readFileSync("vercel.json", "utf8"));
