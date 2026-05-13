const fs = require("fs");

const serviceFile = "backend/src/main/java/com/project/filemanagement/service/FileService.java";
const controllerFile = "backend/src/main/java/com/project/filemanagement/controller/FileController.java";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");

let service = fs.readFileSync(serviceFile, "utf8");
let controller = fs.readFileSync(controllerFile, "utf8");

fs.copyFileSync(serviceFile, `${serviceFile}.bak-view-download-permissions-${stamp}`);
fs.copyFileSync(controllerFile, `${controllerFile}.bak-view-download-permissions-${stamp}`);

const start = service.indexOf("    public ResponseEntity<byte[]> downloadFile(Long fileId, String userEmail)");
const end = service.indexOf("    public String deleteFile(Long fileId, Long userId)", start);

if (start === -1 || end === -1) {
  throw new Error("Could not locate downloadFile method block.");
}

const newBlock = `    public ResponseEntity<byte[]> previewFile(Long fileId, String userEmail) {
        return serveFileContent(fileId, userEmail, false);
    }

    public ResponseEntity<byte[]> downloadFile(Long fileId, String userEmail) {
        return serveFileContent(fileId, userEmail, true);
    }

    private ResponseEntity<byte[]> serveFileContent(Long fileId, String userEmail, boolean downloadMode) {

        if (fileId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File ID is required");
        }

        if (userEmail == null || userEmail.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user email is required");
        }

        User user = userRepository.findByEmail(userEmail.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Authenticated user not found"));

        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found"));

        boolean isOwner = file.getOwner().getId().equals(user.getId());
        boolean isPublic = "PUBLIC".equalsIgnoreCase(file.getVisibility());

        boolean hasViewPermission = hasSharedPermission(file, user, "VIEW", "DOWNLOAD", "VIEW_DOWNLOAD");
        boolean hasDownloadPermission = hasSharedPermission(file, user, "DOWNLOAD", "VIEW_DOWNLOAD");

        boolean allowed = downloadMode
                ? (isOwner || isPublic || hasDownloadPermission)
                : (isOwner || isPublic || hasViewPermission);

        if (!allowed) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    downloadMode
                            ? "You only have view access. Download is not allowed."
                            : "You are not allowed to preview this file"
            );
        }

        byte[] storedBytes = file.getFileData();
        byte[] outputBytes;

        if (Boolean.TRUE.equals(file.getCompressed())) {
            outputBytes = decompressBytes(storedBytes);
        } else {
            outputBytes = storedBytes;
        }

        String disposition = downloadMode ? "attachment" : "inline";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition + "; filename=\\"" + file.getFileName() + "\\"")
                .contentType(java.util.Objects.requireNonNull(MediaType.TEXT_PLAIN))
                .body(outputBytes);
    }

    private boolean hasSharedPermission(FileEntity file, User user, String... allowedCodes) {
        return filePermissionRepository.findByFileAndSharedWithUser(file, user)
                .map(permission -> {
                    String code = permission.getPermissionType().getCode();

                    if (code == null) {
                        return false;
                    }

                    for (String allowedCode : allowedCodes) {
                        if (allowedCode.equalsIgnoreCase(code)) {
                            return true;
                        }
                    }

                    return false;
                })
                .orElse(false);
    }

`;

service = service.slice(0, start) + newBlock + service.slice(end);

// Add preview endpoint before download endpoint if missing.
if (!controller.includes('@GetMapping("/preview/{fileId}")')) {
  controller = controller.replace(
    /    @GetMapping\("\/download\/\{fileId\}"\)/,
    `    @GetMapping("/preview/{fileId}")
    public ResponseEntity<byte[]> previewFile(
            @PathVariable Long fileId,
            Authentication authentication
    ) {
        String userEmail = authentication.getName();

        return fileService.previewFile(fileId, userEmail);
    }

    @GetMapping("/download/{fileId}")`
  );
}

fs.writeFileSync(serviceFile, service);
fs.writeFileSync(controllerFile, controller);

console.log("Backend preview/download permission split added.");
console.log("Backups created:");
console.log(`${serviceFile}.bak-view-download-permissions-${stamp}`);
console.log(`${controllerFile}.bak-view-download-permissions-${stamp}`);
