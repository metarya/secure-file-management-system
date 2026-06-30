import { useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
import { tokens } from "../../../theme/theme";
import { renderMarkdown } from "../../../api/markdownApi";

// Markdown editor: raw Markdown on the left, live preview on the right.
//
// Storage is always Markdown (the textarea value). The preview HTML comes ONLY
// from the backend MarkdownService via /api/markdown/render (which escapes raw
// inline HTML), so dangerouslySetInnerHTML here only ever renders trusted,
// server-sanitized output — never client-built or raw user HTML.
export default function MarkdownEditor({ value, onChange }) {
  const [html, setHtml] = useState("");
  const debounceRef = useRef();

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      renderMarkdown(value || "")
        .then((res) => setHtml(typeof res === "string" ? res : ""))
        .catch(() => setHtml(""));
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [value]);

  const paneSx = {
    flex: 1,
    minWidth: 0,
    boxSizing: "border-box",
    minHeight: { xs: 220, md: 460 },
    maxHeight: { xs: "42vh", md: 620 },
    overflow: "auto",
    p: 2,
    border: `1px solid ${tokens.border}`,
    borderRadius: "12px",
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        gap: 1.5,
      }}
    >
      <Box
        component="textarea"
        value={value || ""}
        onChange={(e) => onChange?.(e.target.value)}
        spellCheck={false}
        onClick={(e) => e.stopPropagation()}
        sx={{
          ...paneSx,
          resize: "vertical",
          background: "rgba(255,255,255,0.02)",
          color: tokens.text,
          fontFamily: '"Consolas","SFMono-Regular",monospace',
          fontSize: "0.9rem",
          lineHeight: 1.6,
          outline: "none",
          whiteSpace: "pre",
          tabSize: 4,
        }}
      />

      <Box
        className="fv-rich"
        // Trusted, server-sanitized HTML from MarkdownService only.
        dangerouslySetInnerHTML={{ __html: html }}
        sx={{
          ...paneSx,
          color: tokens.text,
          fontSize: "0.92rem",
          lineHeight: 1.7,
          overflowWrap: "anywhere",
        }}
      />
    </Box>
  );
}
