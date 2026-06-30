import { Box } from "@mui/material";
import { tokens } from "../../../theme/theme";

// Plain UTF-8 text editor. A controlled <textarea>: it preserves line breaks,
// tabs and whitespace exactly, and emits precisely the text the user typed — no
// HTML is ever produced, so the stored .txt bytes are native plain text.
export default function PlainTextEditor({ value, onChange }) {
  return (
    <Box
      component="textarea"
      value={value || ""}
      onChange={(e) => onChange?.(e.target.value)}
      spellCheck={false}
      onClick={(e) => e.stopPropagation()}
      sx={{
        width: "100%",
        boxSizing: "border-box",
        minHeight: { xs: 300, sm: 480 },
        maxHeight: { xs: "58vh", sm: 640 },
        resize: "vertical",
        p: 2,
        border: `1px solid ${tokens.border}`,
        borderRadius: "12px",
        background: "rgba(255,255,255,0.02)",
        color: tokens.text,
        fontFamily: '"Consolas","SFMono-Regular",monospace',
        fontSize: "0.92rem",
        lineHeight: 1.6,
        outline: "none",
        whiteSpace: "pre",
        overflow: "auto",
        tabSize: 4,
      }}
    />
  );
}
