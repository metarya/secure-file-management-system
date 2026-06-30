// Conversion + sanitization helpers for the document editing pipeline.
//
//   Upload (.txt)  ──read text──▶  Markdown ──(backend commonmark)──▶ HTML ──▶ editor
//   Editor (HTML)  ──Save────────▶  stored HTML (sanitized)
//   Stored HTML    ──Preview─────▶  rendered inline (sanitized)
//   Stored HTML    ──Download────▶  HTML → Markdown (Turndown) ──▶ <name>.md
//
// HTML is the single working/storage format. Markdown only appears at the two
// edges: loading a freshly-uploaded .txt, and exporting on download.

import DOMPurify from "dompurify";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

// Deterministic storage-format marker.
//
// A .txt file holds Markdown when freshly uploaded, but HTML once it has been
// edited and saved. We must know which on load — and we cannot *guess* from the
// content, because real editor HTML often starts with a text node
// (e.g. "Hello <b>world</b>") which no "starts-with-a-tag" heuristic detects.
// Guessing wrong sends stored HTML back through the Markdown renderer, which
// escapes the tags and shows them as literal text.
//
// So every saved document is prefixed with this invisible HTML comment. Its
// presence is an unambiguous "this is already HTML" signal; its absence means
// "freshly uploaded Markdown". The marker is added *after* sanitization and
// stripped *before* rendering, so it never reaches the editor or the converter.
export const HTML_DOC_MARKER = "<!--sfms:html-->";

/** True when stored content is editor HTML (carries the marker). */
export const isStoredHtml = (s = "") =>
  (s || "").trimStart().startsWith(HTML_DOC_MARKER);

/** Prefix sanitized HTML with the storage marker for persistence. */
export const markStoredHtml = (sanitized = "") => HTML_DOC_MARKER + sanitized;

/** Remove the storage marker, returning the bare HTML body. */
export const stripStoredHtmlMarker = (s = "") => {
  const t = s || "";
  const i = t.indexOf(HTML_DOC_MARKER);
  return i === -1 ? t : t.slice(i + HTML_DOC_MARKER.length);
};

// The tag/attribute surface the rich-text editor can produce (execCommand for
// bold/italic/underline/strike/color/align/lists/quote/code, plus headings and
// commonmark's tables/links/images). Anything outside this is dropped, which is
// what makes it safe to render stored HTML inline in the preview.
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    "p", "br", "span", "div",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "strong", "b", "em", "i", "u", "s", "strike", "del", "mark", "sub", "sup",
    "ul", "ol", "li",
    "blockquote", "pre", "code",
    "a", "img",
    "table", "thead", "tbody", "tr", "th", "td",
    "hr", "font",
  ],
  ALLOWED_ATTR: [
    "href", "title", "target", "rel",
    "src", "alt", "width", "height",
    "colspan", "rowspan", "align",
    "style", "color",
  ],
  // Block javascript:/data: URIs while permitting http(s), mailto, tel and
  // relative links.
  ALLOWED_URI_REGEXP:
    /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  ADD_ATTR: ["target"],
};

/** Strip anything outside the editor's safe formatting surface. */
export function sanitizeHtml(html = "") {
  if (!html) return "";
  return DOMPurify.sanitize(html, SANITIZE_CONFIG);
}

let turndownService;

function getTurndown() {
  if (!turndownService) {
    turndownService = new TurndownService({
      headingStyle: "atx",          // # H1 instead of underlines
      codeBlockStyle: "fenced",     // ``` fences instead of indentation
      bulletListMarker: "-",
      emDelimiter: "*",
      linkStyle: "inlined",
    });
    // GFM: tables, strikethrough, task lists, fenced code.
    turndownService.use(gfm);

    // Markdown can't express alignment, text/background color, or underline.
    // Rather than silently dropping that formatting, keep those elements as
    // embedded HTML (valid inside Markdown) so the download stays faithful.
    // This must be addRule (not keep): keep() is consulted only after the
    // built-in rules, so a styled block like <p style="text-align:center"> would
    // be claimed by the paragraph rule first. addRule is prepended → checked
    // first → it can override the built-ins for the styled nodes only.
    const CARRIES_VISUAL_STYLE = /text-align|color|background/i;
    const carriesStyle = (node) => {
      if (!node || node.nodeType !== 1 || !node.getAttribute) return false;
      const tag = node.nodeName.toLowerCase();
      if (tag === "u" || tag === "font") return true;
      const style = node.getAttribute("style");
      if (style && CARRIES_VISUAL_STYLE.test(style)) return true;
      return Boolean(node.getAttribute("align") || node.getAttribute("color"));
    };
    turndownService.addRule("keepVisualFormatting", {
      filter: carriesStyle,
      replacement: (_content, node) =>
        node.isBlock ? "\n\n" + node.outerHTML + "\n\n" : node.outerHTML,
    });
  }
  return turndownService;
}

/**
 * Convert stored HTML back to Markdown for download. Sanitizes first so the
 * exported Markdown can never carry script/handler payloads, then trims to a
 * single trailing newline (POSIX-friendly text file).
 */
export function htmlToMarkdown(html = "") {
  if (!html) return "";
  const clean = sanitizeHtml(html);
  return getTurndown().turndown(clean).replace(/\s+$/g, "") + "\n";
}

/** Replace the extension of a filename with `.md` (adds one if missing). */
export function toMarkdownFileName(fileName = "document") {
  const dot = fileName.lastIndexOf(".");
  const base = dot > 0 ? fileName.slice(0, dot) : fileName;
  return `${base}.md`;
}
