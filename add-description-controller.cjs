const fs = require("fs");

const file = "backend/src/main/java/com/project/filemanagement/controller/FileController.java";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");

let code = fs.readFileSync(file, "utf8");
fs.copyFileSync(file, `${file}.bak-description-controller-${stamp}`);

code = code.replace(
  /@RequestParam\("file"\) MultipartFile file,\s*@RequestParam\("ownerId"\) Long ownerId\) \{/,
  `@RequestParam("file") MultipartFile file,
            @RequestParam("ownerId") Long ownerId,
            @RequestParam(value = "description", required = false) String description) {`
);

code = code.replace(
  /return ResponseEntity\.ok\(fileService\.uploadFile\(file, ownerId\)\);/,
  `return ResponseEntity.ok(fileService.uploadFile(file, ownerId, description));`
);

fs.writeFileSync(file, code);

console.log("FileController upload endpoint now accepts description.");
console.log("Backup created:", `${file}.bak-description-controller-${stamp}`);
