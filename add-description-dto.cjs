const fs = require("fs");

const file = "backend/src/main/java/com/project/filemanagement/dto/FileListResponse.java";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");

let code = fs.readFileSync(file, "utf8");
fs.copyFileSync(file, `${file}.bak-description-dto-${stamp}`);

if (!code.includes("private String description;")) {
  code = code.replace(
    /private String fileName;\s*private String fileType;/,
    `private String fileName;
    private String description;
    private String fileType;`
  );
}

code = code.replace(
  /public FileListResponse\(Long fileId, String fileName, String fileType,/,
  `public FileListResponse(Long fileId, String fileName, String description, String fileType,`
);

code = code.replace(
  /this\.fileName = fileName;\s*this\.fileType = fileType;/,
  `this.fileName = fileName;
        this.description = description;
        this.fileType = fileType;`
);

if (!code.includes("public String getDescription()")) {
  code = code.replace(
    /public String getFileType\(\) \{\s*return fileType;\s*\}/,
    `public String getFileType() {
        return fileType;
    }

    public String getDescription() {
        return description;
    }`
  );
}

fs.writeFileSync(file, code);

console.log("FileListResponse description field added.");
console.log("Backup created:", `${file}.bak-description-dto-${stamp}`);
