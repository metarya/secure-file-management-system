package com.project.filemanagement.service;

import com.project.filemanagement.dto.FileUploadResponse;
import com.project.filemanagement.entity.FileEntity;
import com.project.filemanagement.entity.User;
import com.project.filemanagement.repository.FileRepository;
import com.project.filemanagement.repository.UserRepository;
import org.apache.tika.Tika;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

import java.nio.charset.StandardCharsets;
import java.util.regex.Pattern;
@Service
public class FileService {

    private final FileRepository fileRepository;
    private final UserRepository userRepository;
    private final Tika tika;

    public FileService(FileRepository fileRepository, UserRepository userRepository) {
        this.fileRepository = fileRepository;
        this.userRepository = userRepository;
        this.tika = new Tika();
    }

    public FileUploadResponse uploadFile(MultipartFile file, Long ownerId) {

        // 1. Verify that ownerId is provided and the owner user exists.
        if (ownerId == null) {
            throw new RuntimeException("Owner ID is required");
        }

        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new RuntimeException("Owner user not found"));

        // 2. Reject null or empty files.
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File is empty");
        }

        // 3. Read original file name.
        String originalFileName = file.getOriginalFilename();

        if (originalFileName == null || originalFileName.isBlank()) {
            throw new RuntimeException("File name is required");
        }

        // 4. Extract file extension.
        String fileType = getFileExtension(originalFileName);

        // 5. Allow only .txt extension.
        if (!isAllowedFileType(fileType)) {
            throw new RuntimeException("Only .txt files are allowed");
        }

        // 6. Read actual uploaded bytes once.
        byte[] originalBytes;

        try {
            originalBytes = file.getBytes();
        } catch (Exception e) {
            throw new RuntimeException("Unable to read uploaded file content", e);
        }

        // 7. Use Apache Tika to detect real MIME/content type from bytes.
        String detectedMimeType = tika.detect(originalBytes, originalFileName);

        if (!isAllowedDetectedMimeType(detectedMimeType)) {
            throw new RuntimeException(
                    "Invalid file content. Only real plain text files are allowed. Detected type: "
                            + detectedMimeType
            );
        }

        // 8. Convert bytes into text and scan suspicious patterns using Regex.
        String textContent = new String(originalBytes, StandardCharsets.UTF_8);

        if (containsSuspiciousContent(textContent)) {
            throw new RuntimeException("Suspicious file content detected. Upload rejected");
        }


        // Generate SHA-256 hash from original file bytes for duplicate detection.
        String fileHash = generateSha256Hash(originalBytes);

        if (fileRepository.existsByOwnerAndFileHash(owner, fileHash)) {
            throw new RuntimeException("Duplicate file detected. This file was already uploaded by the same user");
        }

        // 8. Create FileEntity and store metadata + file bytes.
        FileEntity fileEntity = new FileEntity();
        fileEntity.setOwner(owner);
        fileEntity.setFileName(originalFileName);
        fileEntity.setFileType(fileType);
        fileEntity.setFileSize(file.getSize());
        fileEntity.setFileHash(fileHash);
        fileEntity.setVisibility("PRIVATE");
        fileEntity.setFileData(originalBytes);

        // 9. Save to MySQL through repository.
        FileEntity savedFile = fileRepository.save(fileEntity);

        // 10. Return structured upload response.
        return new FileUploadResponse(
                "File uploaded successfully",
                savedFile.getId(),
                savedFile.getFileName(),
                savedFile.getFileType(),
                savedFile.getFileSize()
        );
    }

    private String getFileExtension(String fileName) {

        int dotIndex = fileName.lastIndexOf('.');

        if (dotIndex == -1 || dotIndex == fileName.length() - 1) {
            throw new RuntimeException("File extension is required");
        }

        return fileName.substring(dotIndex + 1).toLowerCase();
    }

    private boolean isAllowedFileType(String fileType) {
        return fileType.equals("txt");
    }

    private boolean isAllowedDetectedMimeType(String detectedMimeType) {

        if (detectedMimeType == null || detectedMimeType.isBlank()) {
            return false;
        }

        return detectedMimeType.equalsIgnoreCase("text/plain");
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

}
