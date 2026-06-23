package com.project.filemanagement.controller;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/files")
public class HlsController {

    @GetMapping("/{id}/master.m3u8")
    public ResponseEntity<?> getPlaylist(@PathVariable Long id) {

        try {

            Path playlist =
                    Paths.get("uploads", "hls", id.toString(), "master.m3u8");

            System.out.println("=================================");
            System.out.println("Playlist path : " + playlist.toAbsolutePath());
            System.out.println("Exists        : " + Files.exists(playlist));
            System.out.println("=================================");

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

            e.printStackTrace();

            return ResponseEntity.internalServerError()
                    .body(e.getMessage());
        }
    }

    @GetMapping("/{id}/{segment:.+\\.ts}")
    public ResponseEntity<?> getSegment(
            @PathVariable Long id,
            @PathVariable String segment) {

        try {

            Path segmentFile =
                    Paths.get("uploads", "hls", id.toString(), segment);

            System.out.println("=================================");
            System.out.println("Segment path : " + segmentFile.toAbsolutePath());
            System.out.println("Exists       : " + Files.exists(segmentFile));
            System.out.println("=================================");

            if (!Files.exists(segmentFile)) {
                return ResponseEntity.notFound().build();
            }

            ByteArrayResource resource =
                    new ByteArrayResource(Files.readAllBytes(segmentFile));

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType("video/mp2t"))
                    .body(resource);

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity.internalServerError()
                    .body(e.getMessage());
        }
    }
}