package com.project.filemanagement.service;

import com.project.filemanagement.dto.FileUploadResponse;
import com.project.filemanagement.entity.FileEntity;
import com.project.filemanagement.entity.User;
import com.project.filemanagement.repository.FileRepository;
import com.project.filemanagement.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Optional;

@Service
public class FileService {

    private final FileRepository fileRepository;
    private final UserRepository userRepository;

    public FileService(FileRepository fileRepository, UserRepository userRepository) {
        this.fileRepository = fileRepository;
        this.userRepository = userRepository;
    }

    public FileUploadResponse uploadFile(MultipartFile file, Long ownerId) {

        if (ownerId == null) {
            return new FileUploadResponse("Owner ID is required", null, null, null, null);
        }

        Optional<User> ownerOptional = userRepository.findById(ownerId);

        if (ownerOptional.isEmpty()) {
            return new FileUploadResponse("Owner user not found", null, null, null, null);
        }

        if (file == null || file.isEmpty()) {
            return new FileUploadResponse("File is empty", null, null, null, null);
        }

        String originalFileName = file.getOriginalFilename();

        if (originalFileName == null || originalFileName.isBlank()) {
            return new FileUploadResponse("File name is invalid", null, null, null, null);
        }

        String fileType = getFileExtension(originalFileName);

        if (!isAllowedFileType(fileType)) {
            return new FileUploadResponse("Only .txt and .doc files are allowed", null, originalFileName, fileType, file.getSize());
        }

        try {
            User owner = ownerOptional.get();

            FileEntity fileEntity = new FileEntity();
            fileEntity.setOwner(owner);
            fileEntity.setFileName(originalFileName);
            fileEntity.setFileType(fileType);
            fileEntity.setFileSize(file.getSize());
            fileEntity.setVisibility("PRIVATE");
            fileEntity.setFileData(file.getBytes());

            FileEntity savedFile = fileRepository.save(fileEntity);

            return new FileUploadResponse(
                    "File uploaded successfully",
                    savedFile.getId(),
                    savedFile.getFileName(),
                    savedFile.getFileType(),
                    savedFile.getFileSize()
            );

        } catch (Exception e) {
            return new FileUploadResponse("File upload failed: " + e.getMessage(), null, originalFileName, fileType, file.getSize());
        }
    }

    private String getFileExtension(String fileName) {
        int lastDotIndex = fileName.lastIndexOf('.');

        if (lastDotIndex == -1 || lastDotIndex == fileName.length() - 1) {
            return "";
        }

        return fileName.substring(lastDotIndex + 1).toLowerCase();
    }

    private boolean isAllowedFileType(String fileType) {
        return fileType.equals("txt") || fileType.equals("doc");
    }
}
