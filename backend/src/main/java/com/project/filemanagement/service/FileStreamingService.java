package com.project.filemanagement.service;


import java.io.File;
import java.io.IOException;
import java.nio.file.Files;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.project.filemanagement.entity.FileEntity;
import com.project.filemanagement.service.compression.CompressorFactory;
import com.project.filemanagement.service.compression.FileCompressor;

/**
 * Streams audio/video with HTTP Range support so players can seek/scrub.
 *
 * Bytes live in MySQL (and may be gzip-compressed), so the full payload is
 * loaded and decompressed once, then the requested byte range is sliced out.
 * Returns 206 Partial Content for range requests and advertises Accept-Ranges
 * on full responses.
 *
 * Object-level access is delegated to FileAccessService so the rule lives in
 * exactly one place.
 */
@Service
public class FileStreamingService {

    private final FileAccessService fileAccessService;
    private final CompressorFactory compressorFactory;

    public FileStreamingService(
            FileAccessService fileAccessService,
            CompressorFactory compressorFactory
    ) {
        this.fileAccessService = fileAccessService;
        this.compressorFactory = compressorFactory;
    }

    public ResponseEntity<byte[]> streamFile(Long fileId, String userEmail, String rangeHeader) {

        FileEntity file = fileAccessService.authorize(fileId, userEmail);

        byte[] data = loadStreamingBytes(file);

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


    private byte[] loadStreamingBytes(FileEntity file) {

    byte[] storedBytes = file.getFileData();

    if (storedBytes == null) {
        return new byte[0];
    }

    if (!Boolean.TRUE.equals(file.getRequiresDecompression())) {
        return storedBytes;
    }

    File tempCompressedFile = null;
    File decompressedFile = null;

    try {

        tempCompressedFile =
                File.createTempFile(
                        "sfms-stream-",
                        "." + file.getFileType()
                );

        Files.write(
                tempCompressedFile.toPath(),
                storedBytes
        );

        FileCompressor compressor =
                compressorFactory.getCompressor(
                        file.getFileType()
                );

        decompressedFile =
                compressor.decompress(tempCompressedFile);

        return Files.readAllBytes(
                decompressedFile.toPath()
        );

    } catch (IOException e) {

        throw new RuntimeException(
                "Unable to stream file",
                e
        );

    } finally {

        try {

            if (tempCompressedFile != null) {
                Files.deleteIfExists(
                        tempCompressedFile.toPath()
                );
            }

            if (decompressedFile != null) {
                Files.deleteIfExists(
                        decompressedFile.toPath()
                );
            }

        } catch (IOException ignored) {
        }
    }
}
}
