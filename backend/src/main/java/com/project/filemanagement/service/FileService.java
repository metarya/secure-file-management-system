package com.project.filemanagement.service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.List;
import java.util.regex.Pattern;
import java.util.zip.GZIPInputStream;
import java.util.zip.GZIPOutputStream;

import org.apache.tika.Tika;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.project.filemanagement.dto.AdminFilePreviewResponse;
import com.project.filemanagement.dto.FileListResponse;
import com.project.filemanagement.dto.FileUploadResponse;
import com.project.filemanagement.dto.ShareFileRequest;
import com.project.filemanagement.dto.ShareFileResponse;
import com.project.filemanagement.dto.SharedWithMeFileResponse;
import com.project.filemanagement.entity.FileEntity;
import com.project.filemanagement.entity.FilePermission;
import com.project.filemanagement.entity.PermissionType;
import com.project.filemanagement.entity.User;
import com.project.filemanagement.repository.FilePermissionRepository;
import com.project.filemanagement.repository.FileRepository;
import com.project.filemanagement.repository.PermissionTypeRepository;
import com.project.filemanagement.repository.UserRepository;



@Service
@SuppressWarnings("null")
public class FileService {

    private final FileRepository fileRepository;
    private final UserRepository userRepository;
    private final FilePermissionRepository filePermissionRepository;
    private final PermissionTypeRepository permissionTypeRepository;
    private final AuditLogService auditLogService;
    private final Tika tika;

    public FileService(
            FileRepository fileRepository,
            UserRepository userRepository,
            FilePermissionRepository filePermissionRepository,
            PermissionTypeRepository permissionTypeRepository,
            AuditLogService auditLogService
    ) {
        this.fileRepository = fileRepository;
        this.userRepository = userRepository;
        this.filePermissionRepository = filePermissionRepository;
        this.permissionTypeRepository = permissionTypeRepository;
        this.auditLogService = auditLogService;
        this.tika = new Tika();
    }

    public FileUploadResponse uploadFile(MultipartFile file, Long ownerId) {
        return uploadFile(file, ownerId, null);
    }

    public FileUploadResponse uploadFile(MultipartFile file, Long ownerId, String description) {

        // 1. Verify that ownerId is provided and owner user exists.
        if (ownerId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Owner ID is required");
        }

        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Owner user not found"));

        // 2. Reject null or empty files.
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is empty");
        }

        // 3. Read original file name.
        String originalFileName = file.getOriginalFilename();

        if (originalFileName == null || originalFileName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File name is required");
        }

        // 4. Extract file extension.
        String fileType = getFileExtension(originalFileName);

        // 5. Allow only .txt extension.
        if (!isAllowedFileType(fileType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only .txt files are allowed");
        }

        // 6. Read actual uploaded bytes once.
        byte[] originalBytes;

        try {
            originalBytes = file.getBytes();
        } catch (IOException e) {
            throw new RuntimeException("Unable to read uploaded file content", e);
        }

        // 7. Use Apache Tika to detect real MIME/content type from bytes.
        String detectedMimeType = tika.detect(originalBytes, originalFileName);

        if (!isAllowedDetectedMimeType(detectedMimeType)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid file content. Only real plain text files are allowed. Detected type: " + detectedMimeType
            );
        }

        // 8. Convert bytes into text and scan suspicious patterns using Regex.
        String textContent = new String(originalBytes, StandardCharsets.UTF_8);

        if (containsSuspiciousContent(textContent)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Suspicious file content detected. Upload rejected"
            );
        }

        // 9. Generate SHA-256 hash from original file bytes for duplicate detection.
        String fileHash = generateSha256Hash(originalBytes);

        if (fileRepository.existsByOwnerAndFileHash(owner, fileHash)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Duplicate file detected. This file was already uploaded by the same user"
            );
        }

        // 10. Compress original file bytes before storing in MySQL.
        byte[] compressedBytes = compressBytes(originalBytes);

        Long originalFileSize = (long) originalBytes.length;
        Long compressedFileSize = (long) compressedBytes.length;

        // 11. Create FileEntity and store metadata + compressed file bytes.
        FileEntity fileEntity = new FileEntity();
        fileEntity.setOwner(owner);
        fileEntity.setFileName(originalFileName);
        fileEntity.setFileType(fileType);
        fileEntity.setDescription(cleanDescription(description));
        fileEntity.setFileSize(file.getSize());
        fileEntity.setFileHash(fileHash);
        fileEntity.setOriginalFileSize(originalFileSize);
        fileEntity.setCompressedFileSize(compressedFileSize);
        fileEntity.setCompressed(true);
        fileEntity.setVisibility("PRIVATE");
        fileEntity.setFileData(compressedBytes);

        // 12. Save to MySQL through repository.
        FileEntity savedFile = fileRepository.save(fileEntity);

        // 13. Return structured upload response.
        return new FileUploadResponse(
                "File uploaded successfully",
                savedFile.getId(),
                savedFile.getFileName(),
                savedFile.getFileType(),
                savedFile.getFileSize()
        );
    }

    public ShareFileResponse shareFile(ShareFileRequest request, String ownerEmail) {

        if (ownerEmail == null || ownerEmail.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user email is required");
        }

        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Share request is required");
        }

        if (request.getFileId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File ID is required");
        }

        if (request.getTargetUserEmail() == null || request.getTargetUserEmail().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Target user email is required");
        }

        if (request.getPermissionType() == null || request.getPermissionType().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Permission type is required");
        }

        User owner = userRepository.findByEmail(ownerEmail.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Authenticated owner not found"));

        FileEntity file = fileRepository.findById(request.getFileId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found"));

        boolean isOwner =
            file.getOwner().getId().equals(owner.getId());

        boolean canShare = hasSharedPermission(file, owner, "VIEWER", "EDITOR");

        if (!isOwner && !canShare){
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Only owner, viewer, or editor can share this file");
        }

        User targetUser = userRepository.findByEmail(request.getTargetUserEmail().trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Target user is not registered"));

        if (owner.getId().equals(targetUser.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Owner cannot share file with themselves");
        }

        String requestedPermissionCode = request.getPermissionType().trim().toUpperCase();

        if(!isOwner){
            boolean isViewer = hasSharedPermission(file, owner, "VIEWER");

            if (isViewer && "EDITOR".equalsIgnoreCase(requestedPermissionCode))
                {
                throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Viewer cannot grant editor permission"
                );
            }
        }

        PermissionType permissionType = permissionTypeRepository
                .findByCodeAndActiveTrue(requestedPermissionCode)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Invalid or inactive permission type"
                ));

        java.util.Optional<FilePermission> existingPermission =
                filePermissionRepository.findByFileAndSharedWithUser(file, targetUser);

        if (existingPermission.isPresent()) {
            FilePermission permission = existingPermission.get();
            String currentPermissionCode = permission.getPermissionType().getCode();

            if (currentPermissionCode != null && currentPermissionCode.equalsIgnoreCase(requestedPermissionCode)) {
                return new ShareFileResponse("Permission already set", permission.getId());
            }

            permission.setPermissionType(permissionType);
            FilePermission updatedPermission = filePermissionRepository.save(permission);

            return new ShareFileResponse("File permission updated successfully", updatedPermission.getId());
        }

        FilePermission permission = new FilePermission();
        permission.setFile(file);
        permission.setSharedWithUser(targetUser);
        permission.setPermissionType(permissionType);

        FilePermission savedPermission = filePermissionRepository.save(permission);

        return new ShareFileResponse("File shared successfully", savedPermission.getId());
    }

    public List<FileListResponse> getMyFiles(Long ownerId) {

        if (ownerId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Owner ID is required");
        }

        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Owner user not found"));

        return fileRepository.findByOwner(owner)
                .stream()
                .map(this::mapToFileListResponse)
                .toList();
    }

    public List<FileListResponse> searchMyFiles(Long ownerId, String name) {

        if (ownerId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Owner ID is required");
        }

        if (name == null || name.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Search keyword is required");
        }

        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Owner user not found"));

        return fileRepository.findByOwnerAndFileNameContainingIgnoreCase(owner, name)
                .stream()
                .map(this::mapToFileListResponse)
                .toList();
    }

    private FileListResponse mapToFileListResponse(FileEntity file) {

        return new FileListResponse(
                file.getId(),
                file.getFileName(),
                file.getDescription(),
                file.getFileType(),
                file.getFileSize(),
                file.getOriginalFileSize(),
                file.getCompressedFileSize(),
                file.getCompressed(),
                file.getVisibility(),
                file.getUploadedAt()
        );
    }

    public ResponseEntity<byte[]> previewFile(Long fileId, String userEmail) {
        return serveFileContent(fileId, userEmail, false);
    }

    public ResponseEntity<byte[]> downloadFile(Long fileId, String userEmail) {
        return serveFileContent(fileId, userEmail, true);
    }

    public ResponseEntity<byte[]> adminDownloadFile(Long fileId) {

    FileEntity file = fileRepository.findById(fileId)
            .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "File not found"
            ));

    byte[] storedBytes = file.getFileData();
    byte[] outputBytes;

    if (Boolean.TRUE.equals(file.getCompressed())) {
        outputBytes = decompressBytes(storedBytes);
    } else {
        outputBytes = storedBytes;
    }

    return ResponseEntity.ok()
            .header(
                    HttpHeaders.CONTENT_DISPOSITION,
                    "attachment; filename=\"" + file.getFileName() + "\""
            )
            .contentType(MediaType.TEXT_PLAIN)
            .body(outputBytes);
}
    
    public AdminFilePreviewResponse adminPreviewFile(Long fileId) {

    FileEntity file = fileRepository.findById(fileId)
            .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "File not found"
            ));

    byte[] storedBytes = file.getFileData();
    byte[] outputBytes;

    if (Boolean.TRUE.equals(file.getCompressed())) {
        outputBytes = decompressBytes(storedBytes);
    } else {
        outputBytes = storedBytes;
    }

    String content = new String(
            outputBytes,
            StandardCharsets.UTF_8
    );

    return new AdminFilePreviewResponse(
            file.getFileName(),
            file.getOwner().getFullName(),
            file.getOwner().getEmail(),
            content
    );
}

    public String adminDeleteFile(Long fileId) {

    if (fileId == null) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "File ID is required"
        );
    }

    FileEntity file = fileRepository.findById(fileId)
            .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "File not found"
            ));

    auditLogService.logAction(
            "FILE_DELETED",
            "ADMIN",
            "Deleted file "
                    + file.getFileName()
                    + " owned by "
                    + file.getOwner().getEmail()
    );

    file.setDeleted(true);
    fileRepository.save(file);

    return "File deleted successfully by admin";
}
    
    public String restoreFile(Long fileId) {

    if (fileId == null) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "File ID is required"
        );
    }

    FileEntity file = fileRepository.findById(fileId)
            .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "File not found"
            ));

    file.setDeleted(false);

    fileRepository.save(file);

    auditLogService.logAction(
            "FILE_RESTORED",
            "ADMIN",
            "Restored file "
                    + file.getFileName()
                    + " owned by "
                    + file.getOwner().getEmail()
    );

    return "File restored successfully";
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

        boolean hasViewPermission = hasSharedPermission(file, user, "VIEWER", "EDITOR");
        boolean hasDownloadPermission = hasSharedPermission(file, user, "VIEWER", "EDITOR");

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
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition + "; filename=\"" + file.getFileName() + "\"")
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

    public String deleteFile(Long fileId, Long userId) {

        if (fileId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File ID is required");
        }

        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User ID is required");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found"));

        if (!file.getOwner().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not allowed to delete this file");
        }

        fileRepository.delete(file);

        return "File deleted successfully";
    }

    public List<SharedWithMeFileResponse> getSharedWithMeFiles(String userEmail) {

        if (userEmail == null || userEmail.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user email is required");
        }

        User sharedUser = userRepository.findByEmail(userEmail.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Authenticated user not found"));

        return filePermissionRepository.findBySharedWithUser(sharedUser)
                .stream()
                .map(permission -> {
                    FileEntity file = permission.getFile();
                    User owner = file.getOwner();

                    return new SharedWithMeFileResponse(
                            file.getId(),
                            file.getFileName(),
                            file.getDescription(),
                            file.getFileType(),
                            file.getFileSize(),
                            file.getOriginalFileSize(),
                            file.getCompressedFileSize(),
                            file.getCompressed(),
                            file.getVisibility(),
                            file.getUploadedAt(),
                            owner.getId(),
                            owner.getFullName(),
                            owner.getEmail(),
                            permission.getId(),
                            permission.getPermissionType().getCode(),
                            permission.getCreatedAt()
                    );
                })
                .toList();
    }

    public String removeSharedFileFromMyList(Long fileId, String userEmail) {

        if (fileId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File ID is required");
        }

        if (userEmail == null || userEmail.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user email is required");
        }

        User sharedUser = userRepository.findByEmail(userEmail.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Authenticated user not found"));

        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found"));

        if (file.getOwner().getId().equals(sharedUser.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Owner cannot remove file as shared file. Use delete file instead."
            );
        }

        FilePermission permission = filePermissionRepository.findByFileAndSharedWithUser(file, sharedUser)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "This file is not shared with your account"
                ));

        filePermissionRepository.delete(permission);

        return "Shared file removed from your list";
    }

    public String removeSharedPermissionFromMyList(Long permissionId, String userEmail) {

        if (permissionId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Permission ID is required");
        }

        if (userEmail == null || userEmail.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user email is required");
        }

        User sharedUser = userRepository.findByEmail(userEmail.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Authenticated user not found"));

        FilePermission permission = filePermissionRepository.findById(permissionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shared permission not found"));

        if (!permission.getSharedWithUser().getId().equals(sharedUser.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You are not allowed to remove this shared file"
            );
        }

        filePermissionRepository.delete(permission);

        return "Shared file removed from your list";
    }

    public String removeSharedEntryFromMySide(Long fileId, String userEmail) {

        if (fileId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File ID is required");
        }

        if (userEmail == null || userEmail.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user email is required");
        }

        FilePermission permission = filePermissionRepository
                .findByFile_IdAndSharedWithUser_Email(fileId, userEmail.trim())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Shared file entry not found for this user"
                ));

        filePermissionRepository.delete(permission);

        return "Shared file removed from your list";
    }

    public FileListResponse updateFileVisibility(Long fileId, String visibility, String ownerEmail) {

        if (ownerEmail == null || ownerEmail.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user email is required");
        }

        Long requestFileId = fileId;

        if (requestFileId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File ID is required");
        }

        if (visibility == null || visibility.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Visibility is required");
        }

        String normalizedVisibility = visibility.trim().toUpperCase();

        if (!normalizedVisibility.equals("PUBLIC") && !normalizedVisibility.equals("PRIVATE")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Visibility must be PUBLIC or PRIVATE");
        }

        long safeFileId = requestFileId;

        User owner = userRepository.findByEmail(ownerEmail.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Authenticated owner user not found"));

        FileEntity file = fileRepository.findById(safeFileId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found"));

        if (!file.getOwner().getId().equals(owner.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the file owner can change visibility");
        }

        file.setVisibility(normalizedVisibility);

        FileEntity savedFile = fileRepository.save(file);

        return mapToFileListResponse(savedFile);
    }
    
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

    private String getFileExtension(String fileName) {

        int dotIndex = fileName.lastIndexOf('.');

        if (dotIndex == -1 || dotIndex == fileName.length() - 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File extension is required");
        }

        return fileName.substring(dotIndex + 1).toLowerCase();
    }

    private boolean isAllowedFileType(String fileType) {
        return switch (fileType.toLowerCase()){
            case "txt","md","pdf","mp3","mp4","wav","m4a","webm","mov","avi","mkv" -> true;
            default -> false;
        };
    }

    private boolean isAllowedDetectedMimeType(String detectedMimeType) {

        if (detectedMimeType == null || detectedMimeType.isBlank()) {
            return false;
        }

        return detectedMimeType.startsWith("video/")
            || detectedMimeType.startsWith("audio/")
            || detectedMimeType.equalsIgnoreCase("application/pdf")
            || detectedMimeType.equalsIgnoreCase("text/plain")
            || detectedMimeType.equalsIgnoreCase("text/markdown");
    }

    private boolean containsSuspiciousContent(String textContent) {

        if (textContent == null || textContent.isBlank()) {
            return false;
        }

        Pattern[] suspiciousPatterns = {
                Pattern.compile("<script\\b", Pattern.CASE_INSENSITIVE),
                Pattern.compile("</script\\s*>", Pattern.CASE_INSENSITIVE),
                Pattern.compile("javascript\\s*:", Pattern.CASE_INSENSITIVE),
                Pattern.compile("\\bcmd\\.exe\\b", Pattern.CASE_INSENSITIVE),
                Pattern.compile("\\bpowershell\\b", Pattern.CASE_INSENSITIVE),
                Pattern.compile("\\brm\\s+-rf\\b", Pattern.CASE_INSENSITIVE),
                Pattern.compile("\\bchmod\\s+\\+?x\\b", Pattern.CASE_INSENSITIVE),
                Pattern.compile("\\b(curl|wget)\\s+https?://", Pattern.CASE_INSENSITIVE),
                Pattern.compile("\\b(eval|exec)\\s*\\(", Pattern.CASE_INSENSITIVE),
                Pattern.compile("\\bbase64\\s+(-d|--decode)\\b", Pattern.CASE_INSENSITIVE),
                Pattern.compile("\\.(exe|bat|cmd|sh|ps1)\\b", Pattern.CASE_INSENSITIVE)
        };

        for (Pattern pattern : suspiciousPatterns) {
            if (pattern.matcher(textContent).find()) {
                return true;
            }
        }

        return false;
    }

    private String generateSha256Hash(byte[] fileBytes) {

        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(fileBytes);

            StringBuilder hexString = new StringBuilder();

            for (byte b : hashBytes) {
                hexString.append(String.format("%02x", b));
            }

            return hexString.toString();

        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    private byte[] compressBytes(byte[] originalBytes) {

        try (ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
             GZIPOutputStream gzipOutputStream = new GZIPOutputStream(byteArrayOutputStream)) {

            gzipOutputStream.write(originalBytes);
            gzipOutputStream.finish();

            return byteArrayOutputStream.toByteArray();

        } catch (IOException e) {
            throw new RuntimeException("Unable to compress uploaded file", e);
        }
    }

    private byte[] decompressBytes(byte[] compressedBytes) {

        try (ByteArrayInputStream byteArrayInputStream = new ByteArrayInputStream(compressedBytes);
             GZIPInputStream gzipInputStream = new GZIPInputStream(byteArrayInputStream);
             ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream()) {

            byte[] buffer = new byte[1024];
            int bytesRead;

            while ((bytesRead = gzipInputStream.read(buffer)) != -1) {
                byteArrayOutputStream.write(buffer, 0, bytesRead);
            }

            return byteArrayOutputStream.toByteArray();

        } catch (IOException e) {
            throw new RuntimeException("Unable to decompress stored file", e);
        }
    }
    
    public void updateFileContent(
        Long fileId,
        String userEmail,
        String content
) {

    FileEntity file = fileRepository.findById(fileId)
            .orElseThrow(() -> new RuntimeException("File not found"));


    User owner = userRepository.findByEmail(userEmail)
        .orElseThrow(() -> new RuntimeException("User not found"));

        boolean isOwner =
            file.getOwner().getId().equals(owner.getId()); 
        
        boolean isEditor = 
            filePermissionRepository
                .findByFileAndSharedWithUser(file, owner)
                .map(permission ->
                    "EDITOR".equalsIgnoreCase(
                        permission.getPermissionType().getCode()
                    )
                )
                .orElse(false);

    if (!isOwner && !isEditor) {
        throw new RuntimeException("Only Owner or Editor can edit this file");
    }

    if (!"txt".equalsIgnoreCase(file.getFileType())) {
        throw new RuntimeException("Only TXT files can be edited");
    };

if (content == null || content.isBlank()) {
    throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST,
            "File content cannot be empty"
    );
}

if (containsSuspiciousContent(content)) {
    throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST,
            "Suspicious file content detected"
    );
}

    byte[] updatedData = content.getBytes(StandardCharsets.UTF_8);

byte[] compressedData = compressBytes(updatedData);

file.setFileData(compressedData);

file.setFileSize((long) updatedData.length);
file.setOriginalFileSize((long) updatedData.length);
file.setCompressedFileSize((long) compressedData.length);
file.setCompressed(true);

fileRepository.save(file);

}

public void renameFile(
        Long fileId,
        String userEmail,
        String newFileName
) {

    if (fileId == null) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "File ID is required"
        );
    }

    if (newFileName == null || newFileName.isBlank()) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "New file name is required"
        );
    }

    FileEntity file = fileRepository.findById(fileId)
            .orElseThrow(() ->
                    new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "File not found"
                    ));

    User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() ->
                    new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "User not found"
                    ));

    boolean isOwner =
            file.getOwner().getId().equals(user.getId());

    boolean isEditor =
            filePermissionRepository
                    .findByFileAndSharedWithUser(file, user)
                    .map(permission ->
                            "EDITOR".equalsIgnoreCase(
                                    permission.getPermissionType().getCode()
                            ))
                    .orElse(false);

    if (!isOwner && !isEditor) {
        throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Only Owner or Editor can rename this file"
        );
    }

    String oldName = file.getFileName();

    String newName = newFileName.trim();

if (!newName.toLowerCase().endsWith(".txt")) {
    throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST,
            "File name must keep .txt extension"
    );
}

if (newName.length() > 255) {
    throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST,
            "File name is too long"
    );
}

if (!newName.matches("^[a-zA-Z0-9._ -]+\\.txt$")) {
    throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST,
            "Invalid file name"
    );
}

file.setFileName(newName);

    fileRepository.save(file);

    auditLogService.logAction(
            "FILE_RENAMED",
            user.getEmail(),
            "Renamed file from "
                    + oldName
                    + " to "
                    + newFileName
    );
}

public void updateFileDescription(
        Long fileId,
        String userEmail,
        String description
) {

    if (fileId == null) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "File ID is required"
        );
    }

    FileEntity file = fileRepository.findById(fileId)
            .orElseThrow(() ->
                    new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "File not found"
                    ));

    User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() ->
                    new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "User not found"
                    ));

    boolean isOwner =
            file.getOwner().getId().equals(user.getId());

    boolean isEditor =
            filePermissionRepository
                    .findByFileAndSharedWithUser(file, user)
                    .map(permission ->
                            "EDITOR".equalsIgnoreCase(
                                    permission.getPermissionType().getCode()
                            ))
                    .orElse(false);

    if (!isOwner && !isEditor) {
        throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Only Owner or Editor can update description"
        );
    }

    String cleanedDescription = cleanDescription(description);

    file.setDescription(cleanedDescription);

    fileRepository.save(file);

    auditLogService.logAction(
            "FILE_DESCRIPTION_UPDATED",
            user.getEmail(),
            "Updated description for file: "
                    + file.getFileName()
    );
    
}

}