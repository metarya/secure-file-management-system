package com.project.filemanagement.service;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import org.apache.tika.Tika;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.project.filemanagement.dto.FileUploadResponse;
import com.project.filemanagement.entity.FileEntity;
import com.project.filemanagement.entity.User;
import com.project.filemanagement.repository.FileRepository;
import com.project.filemanagement.repository.UserRepository;
import com.project.filemanagement.service.compression.CompressionResult;
import com.project.filemanagement.service.streaming.HlsService;
import com.project.filemanagement.storage.StorageContext;
import com.project.filemanagement.storage.StorageProviderRegistry;
import com.project.filemanagement.storage.StorageProviderType;

import lombok.extern.slf4j.Slf4j;

/**
 * Handles the full file-upload pipeline: validation, MIME detection,
 * compression, storage routing, HLS generation, versioning, and audit logging.
 */
@Slf4j
@Service
public class FileUploadService {

    private final FileRepository fileRepository;
    private final UserRepository userRepository;
    private final FileValidationService fileValidationService;
    private final FileCompressionService fileCompressionService;
    private final FileHashService fileHashService;
    private final FileVersionService fileVersionService;
    private final ActivityLogService activityLogService;
    private final UserStorageSettingsService storageSettingsService;
    private final StorageProviderRegistry storageRegistry;
    private final HlsService hlsService;
    private final Tika tika;

    public FileUploadService(
            FileRepository fileRepository,
            UserRepository userRepository,
            FileValidationService fileValidationService,
            FileCompressionService fileCompressionService,
            FileHashService fileHashService,
            FileVersionService fileVersionService,
            ActivityLogService activityLogService,
            UserStorageSettingsService storageSettingsService,
            StorageProviderRegistry storageRegistry,
            HlsService hlsService
    ) {
        this.fileRepository = fileRepository;
        this.userRepository = userRepository;
        this.fileValidationService = fileValidationService;
        this.fileCompressionService = fileCompressionService;
        this.fileHashService = fileHashService;
        this.fileVersionService = fileVersionService;
        this.activityLogService = activityLogService;
        this.storageSettingsService = storageSettingsService;
        this.storageRegistry = storageRegistry;
        this.hlsService = hlsService;
        this.tika = new Tika();
    }

    public FileUploadResponse uploadFile(MultipartFile file, Long ownerId) {
        return uploadFile(file, ownerId, null);
    }

    public FileUploadResponse uploadFile(MultipartFile file, Long ownerId, String description) {

        if (ownerId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Owner ID is required");
        }

        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Owner user not found"));

        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is empty");
        }

        String originalFileName = file.getOriginalFilename();
        if (originalFileName == null || originalFileName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File name is required");
        }

        String fileType = fileValidationService.getFileExtension(originalFileName);
        if (!fileValidationService.isAllowedFileType(fileType)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "File type not supported: ." + fileType);
        }

        byte[] originalBytes;
        try {
            originalBytes = file.getBytes();
        } catch (IOException e) {
            throw new RuntimeException("Unable to read uploaded file content", e);
        }

        String detectedMimeType = tika.detect(originalBytes, originalFileName);
        if (!fileValidationService.isAllowedDetectedMimeType(detectedMimeType)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid file content. Detected type: " + detectedMimeType);
        }

        boolean isText = detectedMimeType.toLowerCase().startsWith("text/");
        if (isText) {
            String textContent = new String(originalBytes, StandardCharsets.UTF_8);
            if (fileValidationService.containsSuspiciousContent(textContent)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Suspicious file content detected. Upload rejected");
            }
        }

        String fileHash = fileHashService.generateSha256Hash(originalBytes);
        if (fileRepository.existsByOwnerAndFileHashAndDeletedFalse(owner, fileHash)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Duplicate file detected. This file was already uploaded by the same user");
        }

        Path tempInputPath = null;
        File compressedFile = null;
        byte[] storedBytes;
        CompressionResult compressionResult;

        try {
            tempInputPath = Files.createTempFile("sfms-upload-", "-" + originalFileName);
            Files.write(tempInputPath, originalBytes);
            compressionResult = fileCompressionService.compress(tempInputPath.toFile(), fileType);
            compressedFile = compressionResult.getCompressedFile();
            storedBytes = Files.readAllBytes(compressionResult.getCompressedFile().toPath());
        } catch (IOException e) {
            throw new RuntimeException("Unable to compress uploaded file", e);
        } finally {
            try {
                if (tempInputPath != null) {
                    Files.deleteIfExists(tempInputPath);
                }
            } catch (IOException ignored) {
            }
        }

        FileEntity fileEntity = new FileEntity();
        fileEntity.setOwner(owner);
        fileEntity.setFileName(originalFileName);
        fileEntity.setFileType(fileType);
        fileEntity.setContentType(detectedMimeType);
        fileEntity.setDescription(fileValidationService.cleanDescription(description));
        fileEntity.setFileSize(file.getSize());
        fileEntity.setFileHash(fileHash);
        fileEntity.setOriginalFileSize(compressionResult.getOriginalSize());
        fileEntity.setCompressedFileSize(compressionResult.getCompressedSize());
        fileEntity.setCompressed(compressionResult.getCompressedSize() < compressionResult.getOriginalSize());
        fileEntity.setCompressionAlgorithm(compressionResult.getAlgorithm());
        fileEntity.setRequiresDecompression(compressionResult.isRequiresDecompression());
        fileEntity.setVisibility("PRIVATE");

        StorageProviderType providerType = storageSettingsService.resolveProviderType(owner);
        if (providerType == StorageProviderType.LOCAL) {
            fileEntity.setFileData(storedBytes);
            fileEntity.setStorageProvider(StorageProviderType.LOCAL.name());
            fileEntity.setStorageKey(null);
        } else {
            StorageContext ctx = storageSettingsService.contextFor(owner, providerType);
            String key = storageRegistry.get(providerType)
                    .upload(ctx, originalFileName, originalBytes, detectedMimeType);
            fileEntity.setFileData(null);
            fileEntity.setStorageProvider(providerType.name());
            fileEntity.setStorageKey(key);
        }

        FileEntity savedFile = fileRepository.save(fileEntity);

        try {
            if ("FFMPEG_VIDEO".equals(compressionResult.getAlgorithm())) {
                hlsService.generateHls(compressionResult.getCompressedFile(), savedFile.getId());
                savedFile.setHlsFolder("uploads/hls/" + savedFile.getId());
                savedFile.setHlsPlaylist("uploads/hls/" + savedFile.getId() + "/master.m3u8");
                savedFile.setHlsGenerated(true);
                fileRepository.save(savedFile);
            }
        } catch (Exception e) {
            log.error("HLS generation failed for file {}", savedFile.getId(), e);
        } finally {
            try {
                if (compressedFile != null) {
                    Files.deleteIfExists(compressedFile.toPath());
                }
            } catch (IOException ignored) {
            }
        }

        var initialVersion = fileVersionService.createInitialVersion(
                savedFile,
                originalBytes,
                fileHash,
                detectedMimeType,
                owner.getEmail(),
                "Initial upload");

        activityLogService.log(
                owner,
                "FILE_UPLOAD",
                ActivityLogService.RESOURCE_FILE,
                savedFile.getId(),
                savedFile.getFileName(),
                ActivityLogService.SUCCESS,
                null,
                versionRef(savedFile.getFileHash(), savedFile.getFileSize()),
                null,
                initialVersion.getId(),
                "Uploaded file " + savedFile.getFileName());

        return new FileUploadResponse(
                "File uploaded successfully",
                savedFile.getId(),
                savedFile.getFileName(),
                savedFile.getFileType(),
                savedFile.getFileSize()
        );
    }

    static String versionRef(String hash, Long sizeBytes) {
        String shortHash = (hash == null || hash.isBlank())
                ? "no-hash"
                : (hash.length() > 12 ? hash.substring(0, 12) : hash);
        return shortHash + " · " + (sizeBytes == null ? 0 : sizeBytes) + " bytes";
    }
}
