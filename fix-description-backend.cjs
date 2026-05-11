const fs = require("fs");

const serviceFile = "backend/src/main/java/com/project/filemanagement/service/FileService.java";
const controllerFile = "backend/src/main/java/com/project/filemanagement/controller/FileController.java";

const stamp = new Date().toISOString().replace(/[:.]/g, "-");

let service = fs.readFileSync(serviceFile, "utf8");
let controller = fs.readFileSync(controllerFile, "utf8");

fs.copyFileSync(serviceFile, `${serviceFile}.bak-fix-description-${stamp}`);
fs.copyFileSync(controllerFile, `${controllerFile}.bak-fix-description-${stamp}`);

// 1. Add uploadFile overload with description support.
// Old code: public FileUploadResponse uploadFile(MultipartFile file, Long ownerId) {
if (!service.includes("public FileUploadResponse uploadFile(MultipartFile file, Long ownerId, String description)")) {
  service = service.replace(
    /public FileUploadResponse uploadFile\(MultipartFile file, Long ownerId\) \{/,
    `public FileUploadResponse uploadFile(MultipartFile file, Long ownerId) {
        return uploadFile(file, ownerId, null);
    }

    public FileUploadResponse uploadFile(MultipartFile file, Long ownerId, String description) {`
  );
}

// 2. Save description into FileEntity.
if (!service.includes("fileEntity.setDescription(cleanDescription(description));")) {
  service = service.replace(
    /fileEntity\.setFileType\(fileType\);/,
    `fileEntity.setFileType(fileType);
        fileEntity.setDescription(cleanDescription(description));`
  );
}

// 3. Fix FileListResponse constructor call.
// Required order now:
// fileId, fileName, description, fileType, fileSize, originalFileSize, compressedFileSize, compressed, visibility, uploadedAt
if (!service.includes("file.getDescription(),")) {
  service = service.replace(
    /file\.getFileName\(\),\s*\r?\n\s*file\.getFileType\(\),/,
    `file.getFileName(),
                file.getDescription(),
                file.getFileType(),`
  );
}

// 4. Add helper to clean/truncate description.
if (!service.includes("private String cleanDescription(String description)")) {
  service = service.replace(
    /(\s*private String getFileExtension\(String fileName\) \{)/,
    `
    private String cleanDescription(String description) {
        if (description == null) {
            return null;
        }

        String cleaned = description.trim();

        if (cleaned.isEmpty()) {
            return null;
        }

        if (cleaned.length() > 1000) {
            return cleaned.substring(0, 1000);
        }

        return cleaned;
    }

$1`
  );
}

// 5. Make controller accept optional description in upload API.
if (!controller.includes('@RequestParam(value = "description", required = false) String description')) {
  controller = controller.replace(
    /@RequestParam\("file"\) MultipartFile file,\s*\r?\n\s*@RequestParam\("ownerId"\) Long ownerId\) \{/,
    `@RequestParam("file") MultipartFile file,
            @RequestParam("ownerId") Long ownerId,
            @RequestParam(value = "description", required = false) String description) {`
  );
}

// 6. Controller should call uploadFile with description.
controller = controller.replace(
  /return ResponseEntity\.ok\(fileService\.uploadFile\(file, ownerId\)\);/,
  `return ResponseEntity.ok(fileService.uploadFile(file, ownerId, description));`
);

fs.writeFileSync(serviceFile, service);
fs.writeFileSync(controllerFile, controller);

console.log("Description support fixed in FileService and FileController.");
console.log("Backups created:");
console.log(`${serviceFile}.bak-fix-description-${stamp}`);
console.log(`${controllerFile}.bak-fix-description-${stamp}`);
