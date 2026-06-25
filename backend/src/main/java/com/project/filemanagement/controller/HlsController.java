package com.project.filemanagement.controller;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.project.filemanagement.service.FileAccessService;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/files")
public class HlsController {

    private final FileAccessService fileAccessService;

    public HlsController(FileAccessService fileAccessService) {
        this.fileAccessService = fileAccessService;
    }

    @GetMapping("/{id}/master.m3u8")
    public ResponseEntity<?> getPlaylist(
            @PathVariable Long id,
            Authentication authentication) {

        // Object-level authorization (single source of truth). Runs before any
        // filesystem access and outside the try/catch, so an unauthorized caller
        // receives the proper status from FileAccessService rather than a 500.
        fileAccessService.authorize(id, authentication.getName());

        try {

            Path baseDir =
                    Paths.get("uploads", "hls", id.toString())
                            .toAbsolutePath()
                            .normalize();

            Path playlist = baseDir.resolve("master.m3u8").normalize();

            // Defence in depth: ensure the resolved path stays inside this
            // file's HLS directory before any filesystem access.
            if (!playlist.startsWith(baseDir)) {
                return ResponseEntity.notFound().build();
            }

            if (!Files.exists(playlist)) {
                return ResponseEntity.notFound().build();
            }

            ByteArrayResource resource =
                    new ByteArrayResource(Files.readAllBytes(playlist));

            return ResponseEntity.ok()
                    .header(
                            HttpHeaders.CONTENT_TYPE,
                            "application/vnd.apple.mpegurl"
                    )
                    .body(resource);

        } catch (Exception e) {

            log.error("Failed to serve HLS playlist for file {}", id, e);

            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}/{segment:.+\\.ts}")
    public ResponseEntity<?> getSegment(
            @PathVariable Long id,
            @PathVariable String segment,
            Authentication authentication) {

        // Object-level authorization (single source of truth). Runs before any
        // filesystem access and outside the try/catch, so an unauthorized caller
        // receives the proper status from FileAccessService rather than a 500.
        fileAccessService.authorize(id, authentication.getName());

        try {

            Path baseDir =
                    Paths.get("uploads", "hls", id.toString())
                            .toAbsolutePath()
                            .normalize();

            Path segmentFile = baseDir.resolve(segment).normalize();

            // Defence in depth: the .ts segment name is attacker-controlled, so
            // ensure the resolved path stays inside this file's HLS directory
            // before any filesystem access (blocks ../ traversal).
            if (!segmentFile.startsWith(baseDir)) {
                return ResponseEntity.notFound().build();
            }

            if (!Files.exists(segmentFile)) {
                return ResponseEntity.notFound().build();
            }

            ByteArrayResource resource =
                    new ByteArrayResource(Files.readAllBytes(segmentFile));

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType("video/mp2t"))
                    .body(resource);

        } catch (Exception e) {

            log.error("Failed to serve HLS segment {} for file {}", segment, id, e);

            return ResponseEntity.internalServerError().build();
        }
    }
}