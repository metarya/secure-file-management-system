package com.project.filemanagement.service;

import java.util.regex.Pattern;

import org.springframework.stereotype.Service;

/**
 * Detects HTML-in-text (left behind by the legacy rich-text editor) and converts
 * it to plain UTF-8 text that reads like Notepad would show it: block elements
 * and &lt;br&gt; become line breaks, list items get a "- " prefix, all tags are
 * stripped, and common entities are decoded.
 */
@Service
public class HtmlTextService {

    // Structural tags the legacy contentEditable editor emits. Requiring a known
    // tag (rather than any "<...>") avoids misclassifying plain text that merely
    // contains an angle bracket (e.g. "a < b").
    private static final Pattern HTML_MARKER = Pattern.compile(
            "</?(p|div|br|h[1-6]|ul|ol|li|blockquote|pre|span|b|i|u|strong|em|a|table|tr|td)\\b[^>]*>",
            Pattern.CASE_INSENSITIVE);

    public boolean isHtml(String content) {
        if (content == null || content.isBlank()) {
            return false;
        }
        return HTML_MARKER.matcher(content).find();
    }

    public String htmlToPlainText(String html) {
        if (html == null) {
            return "";
        }

        String s = html;
        s = s.replaceAll("(?i)<\\s*br\\s*/?>", "\n");
        s = s.replaceAll("(?i)<\\s*/\\s*(p|div|h[1-6]|li|blockquote|pre|tr)\\s*>", "\n");
        s = s.replaceAll("(?i)<\\s*li\\b[^>]*>", "- ");
        s = s.replaceAll("(?s)<[^>]+>", ""); // strip any remaining tags
        s = decodeEntities(s);
        s = s.replaceAll("[ \\t]+\\n", "\n");
        s = s.replaceAll("\\n{3,}", "\n\n");
        return s.strip();
    }

    private String decodeEntities(String s) {
        return s.replace("&nbsp;", " ")
                .replace("&lt;", "<")
                .replace("&gt;", ">")
                .replace("&quot;", "\"")
                .replace("&#39;", "'")
                .replace("&apos;", "'")
                .replace("&amp;", "&"); // decode &amp; last to avoid double-decoding
    }
}
