package com.project.filemanagement.service;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.project.filemanagement.entity.FileEntity;
import com.project.filemanagement.repository.FileRepository;
import com.project.filemanagement.service.compression.CompressionResult;

import lombok.extern.slf4j.Slf4j;

/**
 * One-time, self-healing migration of legacy ".txt" files whose stored content is
 * HTML (produced by the old rich-text editor). The first time such a file is read
 * (preview/download), its content is converted to plain text and persisted back,
 * so every later read — and the raw download bytes — are native plain text.
 *
 * <p>Idempotent: after conversion the content is no longer HTML, so subsequent
 * reads skip the migration.
 */
@Slf4j
@Service
public class LegacyTextMigrationService {

    private final FileRepository fileRepository;
    private final FileCompressionService fileCompressionService;
    private final HtmlTextService htmlTextService;

    public LegacyTextMigrationService(
            FileRepository fileRepository,
            FileCompressionService fileCompressionService,
            HtmlTextService htmlTextService
    ) {
        this.fileRepository = fileRepository;
        this.fileCompressionService = fileCompressionService;
        this.htmlTextService = htmlTextService;
    }

    /**
     * If {@code file} is a .txt whose decompressed content is HTML, convert it to
     * plain text, persist the plain text back, and return the plain-text bytes.
     * Otherwise returns the input bytes unchanged.
     */
    /** Summary of a batch migration run. */
    public record MigrationStats(int scanned, int migrated, int skipped, int failed) {}

    /**
     * One-time batch migration over every .txt file: decompress, log the actual
     * stored content (evidence), and convert+persist any that are HTML. Idempotent
     * — already-plain files are detected and skipped, never rewritten.
     */
    public MigrationStats migrateAllLegacyTxt() {

        List<FileEntity> txtFiles = fileRepository.findAll().stream()
                .filter(f -> "txt".equalsIgnoreCase(f.getFileType()))
                .toList();

        int migrated = 0, skipped = 0, failed = 0;

        for (FileEntity file : txtFiles) {
            try {
                byte[] decompressed = decompressStoredText(file);
                String original = new String(decompressed, StandardCharsets.UTF_8);
                boolean html = htmlTextService.isHtml(original);

                log.info("[legacy-txt] id={} name=\"{}\" visibility={} bytes={} isHtml={} original[0:500]=<<{}>>",
                        file.getId(), file.getFileName(), file.getVisibility(),
                        decompressed.length, html, head(original, 500));

                if (html) {
                    byte[] result = migrateTxtIfHtml(file, decompressed);
                    log.info("[legacy-txt] id={} CONVERTED converted[0:500]=<<{}>>",
                            file.getId(), head(new String(result, StandardCharsets.UTF_8), 500));
                    migrated++;
                } else {
                    skipped++;
                }
            } catch (Exception e) {
                failed++;
                log.error("[legacy-txt] id={} migration failed", file.getId(), e);
            }
        }

        return new MigrationStats(txtFiles.size(), migrated, skipped, failed);
    }

    /** Decompress a file's stored bytes back to its native text (handles GZIP). */
    private byte[] decompressStoredText(FileEntity file) throws IOException {

        byte[] stored = file.getFileData();
        if (stored == null) {
            return new byte[0];
        }

        boolean compressed = Boolean.TRUE.equals(file.getRequiresDecompression())
                || Boolean.TRUE.equals(file.getCompressed())
                || "GZIP".equalsIgnoreCase(file.getCompressionAlgorithm());

        if (!compressed) {
            return stored;
        }

        Path tempInput = Files.createTempFile("sfms-mig-in-", ".txt");
        File decompressedFile = null;
        try {
            Files.write(tempInput, stored);
            decompressedFile = fileCompressionService.decompress(tempInput.toFile(), "txt");
            return Files.readAllBytes(decompressedFile.toPath());
        } finally {
            try {
                Files.deleteIfExists(tempInput);
            } catch (IOException ignored) {
            }
            try {
                if (decompressedFile != null) {
                    Files.deleteIfExists(decompressedFile.toPath());
                }
            } catch (IOException ignored) {
            }
        }
    }

    private static String head(String s, int n) {
        if (s == null) {
            return "";
        }
        String oneLine = s.replace("\n", "\\n").replace("\r", "");
        return oneLine.length() <= n ? oneLine : oneLine.substring(0, n);
    }

    @Transactional
    public byte[] migrateTxtIfHtml(FileEntity file, byte[] decompressed) {

        if (file == null || decompressed == null) {
            return decompressed;
        }
        if (!"txt".equalsIgnoreCase(file.getFileType())) {
            return decompressed;
        }

        String text = new String(decompressed, StandardCharsets.UTF_8);
        if (!htmlTextService.isHtml(text)) {
            return decompressed;
        }

        String plain = htmlTextService.htmlToPlainText(text);
        byte[] plainBytes = plain.getBytes(StandardCharsets.UTF_8);

        Path tempInput = null;
        File compressedFile = null;
        try {
            tempInput = Files.createTempFile("sfms-migrate-", ".txt");
            Files.write(tempInput, plainBytes);

            CompressionResult result = fileCompressionService.compress(tempInput.toFile(), "txt");
            compressedFile = result.getCompressedFile();
            byte[] stored = Files.readAllBytes(compressedFile.toPath());

            file.setFileData(stored);
            file.setFileSize((long) plainBytes.length);
            file.setOriginalFileSize(result.getOriginalSize());
            file.setCompressedFileSize(result.getCompressedSize());
            file.setCompressed(result.getCompressedSize() < result.getOriginalSize());
            file.setCompressionAlgorithm(result.getAlgorithm());
            file.setRequiresDecompression(result.isRequiresDecompression());
            // Content is now plain text — keep the stored MIME consistent.
            file.setContentType("text/plain;charset=UTF-8");

            fileRepository.save(file);

            log.info("Migrated legacy HTML .txt to plain text (file id {})", file.getId());
            return plainBytes;

        } catch (IOException e) {
            // Even if persistence fails, serve the converted text so the response
            // is correct; the next read will retry the migration.
            log.error("Legacy .txt migration failed to persist for file {}", file.getId(), e);
            return plainBytes;
        } finally {
            try {
                if (tempInput != null) {
                    Files.deleteIfExists(tempInput);
                }
            } catch (IOException ignored) {
            }
            try {
                if (compressedFile != null) {
                    Files.deleteIfExists(compressedFile.toPath());
                }
            } catch (IOException ignored) {
            }
        }
    }
}
