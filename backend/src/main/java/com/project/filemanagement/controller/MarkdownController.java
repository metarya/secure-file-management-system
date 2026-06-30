package com.project.filemanagement.controller;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.project.filemanagement.dto.MarkdownRenderRequest;
import com.project.filemanagement.service.MarkdownService;

/**
 * Generic, file-agnostic Markdown rendering endpoint.
 *
 * <p>Kept separate from file operations so it can be reused for comments,
 * README/doc previews, wikis, release notes, etc. It only accepts Markdown text
 * and returns the HTML produced by {@link MarkdownService}, which escapes raw
 * inline HTML (server-side sanitization). Callers must render the returned HTML
 * as-is and never substitute client-built HTML.
 */
@RestController
@RequestMapping("/api/markdown")
public class MarkdownController {

    private final MarkdownService markdownService;

    public MarkdownController(MarkdownService markdownService) {
        this.markdownService = markdownService;
    }

    @PostMapping("/render")
    public ResponseEntity<String> render(@RequestBody(required = false) MarkdownRenderRequest request) {

        String markdown = request == null ? null : request.getContent();
        String html = markdownService.renderToHtml(markdown);

        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_HTML)
                .body(html);
    }
}
