package com.project.filemanagement.service;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.project.filemanagement.entity.FileEntity;
import com.project.filemanagement.entity.User;
import com.project.filemanagement.repository.FileRepository;
import com.project.filemanagement.repository.UserRepository;

/**
 * Streams audio/video with HTTP Range support so players can seek/scrub.
 *
 * Bytes live in MySQL (and may be gzip-compressed), so the full payload is
 * loaded and decompressed once, then the requested byte range is sliced out.
 * Returns 206 Partial Content for range requests and advertises Accept-Ranges
 * on full responses.
 */
@Service
public class FileStreamingService {

    private final FileRepository fileRepository;
    private final UserRepository userRepository;
    private final FileCompressionService fileCompressionService;
    private final FileSharingService fileSharingService;

    public FileStreamingService(
            FileRepository fileRepository,
            UserRepository userRepository,
            FileCompressionService fileCompressionService,
            FileSharingService fileSharingService
    ) {
        this.fileRepository = fileRepository;
        this.userRepository = userRepository;
        this.fileCompressionService = fileCompressionService;
        this.fileSharingService = fileSharingService;
    }

    public ResponseEntity<byte[]> streamFile(Long fileId, String userEmail, String rangeHeader) {

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

        if (Boolean.TRUE.equals(file.getDeleted())) {
    throw new ResponseStatusException(
            HttpStatus.NOT_FOUND,
            "File not found"
    );

        }

        boolean isOwner = file.getOwner().getId().equals(user.getId());
        boolean isPublic = "PUBLIC".equalsIgnoreCase(file.getVisibility());
        boolean hasViewPermission = fileSharingService.hasSharedPermission(file, user, "VIEWER", "EDITOR");

        if (!(isOwner || isPublic || hasViewPermission)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not allowed to stream this file");
        }
byte[] storedBytes = file.getFileData();

if (storedBytes == null) {
    storedBytes = new byte[0];
}

byte[] data = Boolean.TRUE.equals(file.getCompressed())
        ? fileCompressionService.decompressBytes(storedBytes)
        : storedBytes;

        

        long fileLength = data.length;
        MediaType mediaType = FileContentService.resolveMediaType(file.getContentType(), file.getFileType());
        String inlineName = "inline; filename=\"" + file.getFileName() + "\"";

        // No Range header -> return the whole body, but advertise range support.
        if (rangeHeader == null || rangeHeader.isBlank() || !rangeHeader.startsWith("bytes=")) {
            return ResponseEntity.ok()
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .header(HttpHeaders.CONTENT_DISPOSITION, inlineName)
                    .contentType(mediaType)
                    .contentLength(fileLength)
                    .body(data);
        }

        long start;
        long end;

        try {
            String spec = rangeHeader.substring("bytes=".length()).trim();

            // Only the first range is honoured (single-range requests).
            int commaIndex = spec.indexOf(',');
            if (commaIndex != -1) {
                spec = spec.substring(0, commaIndex).trim();
            }

            int dashIndex = spec.indexOf('-');
            if (dashIndex == -1) {
                return rangeNotSatisfiable(fileLength);
            }

            String startText = spec.substring(0, dashIndex).trim();
            String endText = spec.substring(dashIndex + 1).trim();

            if (startText.isEmpty()) {
                // Suffix range: "bytes=-N" -> last N bytes.
                if (endText.isEmpty()) {
                    return rangeNotSatisfiable(fileLength);
                }
                long suffixLength = Long.parseLong(endText);
                start = Math.max(0, fileLength - suffixLength);
                end = fileLength - 1;
            } else {
                start = Long.parseLong(startText);
                end = endText.isEmpty() ? fileLength - 1 : Long.parseLong(endText);
            }
        } catch (NumberFormatException e) {
            return rangeNotSatisfiable(fileLength);
        }

        if (fileLength == 0 || start > end || start >= fileLength) {
            return rangeNotSatisfiable(fileLength);
        }

        end = Math.min(end, fileLength - 1);

        int chunkLength = (int) (end - start + 1);
        byte[] chunk = new byte[chunkLength];
        System.arraycopy(data, (int) start, chunk, 0, chunkLength);

        return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                .header(HttpHeaders.CONTENT_RANGE, "bytes " + start + "-" + end + "/" + fileLength)
                .header(HttpHeaders.CONTENT_DISPOSITION, inlineName)
                .contentType(mediaType)
                .contentLength(chunkLength)
                .body(chunk);
    }

    private ResponseEntity<byte[]> rangeNotSatisfiable(long fileLength) {
        return ResponseEntity.status(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE)
                .header(HttpHeaders.CONTENT_RANGE, "bytes */" + fileLength)
                .build();
    }
}
