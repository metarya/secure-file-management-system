const fs = require("fs");

const file = "backend/src/main/java/com/project/filemanagement/entity/FileEntity.java";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");

let code = fs.readFileSync(file, "utf8");
fs.copyFileSync(file, `${file}.bak-description-entity-${stamp}`);

if (!code.includes("private String description;")) {
  code = code.replace(
    /(\s*@Column\(name = "file_type", nullable = false, length = 20\)\s*private String fileType;\s*)/,
    `$1

    @Column(name = "description", length = 1000)
    private String description;
`
  );
}

if (!code.includes("public String getDescription()")) {
  code = code.replace(
    /(\s*public String getFileType\(\) \{\s*return fileType;\s*\}\s*)/,
    `$1

    public String getDescription() {
        return description;
    }
`
  );
}

if (!code.includes("public void setDescription(String description)")) {
  code = code.replace(
    /(\s*public void setFileType\(String fileType\) \{\s*this\.fileType = fileType;\s*\}\s*)/,
    `$1

    public void setDescription(String description) {
        this.description = description;
    }
`
  );
}

fs.writeFileSync(file, code);

console.log("FileEntity description field added.");
console.log("Backup created:", `${file}.bak-description-entity-${stamp}`);
