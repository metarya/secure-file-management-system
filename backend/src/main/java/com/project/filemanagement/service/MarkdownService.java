package com.project.filemanagement.service;

import java.util.List;

import org.commonmark.Extension;
import org.commonmark.ext.gfm.tables.TablesExtension;
import org.commonmark.node.Node;
import org.commonmark.parser.Parser;
import org.commonmark.renderer.html.HtmlRenderer;
import org.springframework.stereotype.Service;

/**
 * Renders Markdown to HTML for the in-app preview.
 *
 * GFM tables are enabled. Raw inline HTML is escaped (escapeHtml = true) so a
 * stored .md file cannot inject <script> or other active markup into the
 * preview — server-side XSS protection for rendered content.
 */
@Service
public class MarkdownService {

    private final Parser parser;
    private final HtmlRenderer renderer;

    public MarkdownService() {
        List<Extension> extensions = List.of(TablesExtension.create());

        this.parser = Parser.builder()
                .extensions(extensions)
                .build();

        this.renderer = HtmlRenderer.builder()
                .extensions(extensions)
                .escapeHtml(true)
                .build();
    }

    public String renderToHtml(String markdown) {

        if (markdown == null || markdown.isBlank()) {
            return "";
        }

        Node document = parser.parse(markdown);
        return renderer.render(document);
    }
}
