import { useEffect, useRef, useState, useCallback } from "react";
import { Box, Tooltip, Divider } from "@mui/material";
import FormatBoldRounded from "@mui/icons-material/FormatBoldRounded";
import FormatItalicRounded from "@mui/icons-material/FormatItalicRounded";
import FormatUnderlinedRounded from "@mui/icons-material/FormatUnderlinedRounded";
import FormatListBulletedRounded from "@mui/icons-material/FormatListBulletedRounded";
import FormatListNumberedRounded from "@mui/icons-material/FormatListNumberedRounded";
import FormatQuoteRounded from "@mui/icons-material/FormatQuoteRounded";
import CodeRounded from "@mui/icons-material/CodeRounded";
import UndoRounded from "@mui/icons-material/UndoRounded";
import RedoRounded from "@mui/icons-material/RedoRounded";

import FormatAlignLeftRounded from "@mui/icons-material/FormatAlignLeftRounded";
import FormatAlignCenterRounded from "@mui/icons-material/FormatAlignCenterRounded";
import FormatAlignRightRounded from "@mui/icons-material/FormatAlignRightRounded";
import FormatAlignJustifyRounded from "@mui/icons-material/FormatAlignJustifyRounded";

import StrikethroughSRounded from "@mui/icons-material/StrikethroughSRounded";
import { tokens } from "../../theme/theme";

// Commands whose result Markdown can't express (alignment, text/background
// colour). For these we switch the browser into CSS-styling mode so the result
// is an inline `style="..."` the sanitizer preserves — instead of legacy markup
// like <center>/<font> that varies by browser. Semantic commands (bold, italic,
// headings, lists…) keep CSS-mode OFF so they stay as <b>/<em>/<h1>/<ul> tags
// that convert cleanly to Markdown.
const CSS_STYLED_COMMANDS = new Set([
  "foreColor",
  "hiliteColor",
  "backColor",
  "justifyLeft",
  "justifyCenter",
  "justifyRight",
  "justifyFull",
]);

function ToolBtn({
  title,
  onClick,
  children,
  active = false,
}) {
  return (
    <Tooltip title={title} arrow>
      <Box
        component="button"
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          onClick?.();
        }}
        sx={{
          width: 36,
          height: 36,

          display: "grid",
          placeItems: "center",

          cursor: "pointer",

          borderRadius: "8px",

          border: active
            ? `1px solid ${tokens.accent}`
            : `1px solid transparent`,

          background: active
            ? "rgba(129,140,248,0.18)"
            : "transparent",

          color: active
            ? tokens.accent
            : tokens.textDim,

          transition:
            "all 0.18s ease",

          "&:hover": {
            background:
              "rgba(255,255,255,0.06)",

            color: tokens.text,

            borderColor:
              "rgba(255,255,255,0.08)",
          },

          "&:active": {
            transform: "scale(0.96)",
          },

          "& svg": {
            fontSize: 18,
          },
        }}
      >
        {children}
      </Box>
    </Tooltip>
  );
}

// Lightweight contentEditable editor. Stores HTML; exposes getHTML() via ref-less onChange.
export default function RichTextEditor({
  initialValue = "",
  onChange,
}) {
  const ref = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!ref.current || ready) return;

    // The document pipeline always hands the editor sanitized HTML (Markdown is
    // rendered to HTML before this point), so render it as live DOM. Never use
    // textContent here — that would display the tags as literal text, which is
    // the WYSIWYG bug this editor must avoid.
    ref.current.innerHTML = initialValue || "<p><br/></p>";

    setReady(true);
  }, [initialValue, ready]);

  // The colour swatches are real <input type="color"> elements: clicking one
  // moves focus to the native picker and collapses the editor's selection, so
  // execCommand would have nothing to colour. We snapshot the selection on the
  // swatch's mousedown (before focus shifts) and restore it inside exec.
  const savedRange = useRef(null);

  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (
      sel &&
      sel.rangeCount > 0 &&
      ref.current &&
      ref.current.contains(sel.anchorNode)
    ) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
  }, []);

  const exec = useCallback(
    (command, value = null) => {
      ref.current?.focus();

      // A snapshot is only present when a colour swatch stole focus and
      // collapsed the selection just before this call. Restoring it
      // unconditionally re-targets the original text — focus() alone would
      // otherwise leave a collapsed caret, so the colour would apply to nothing.
      if (savedRange.current) {
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(savedRange.current);
      }

      // Emit inline CSS for colour/alignment, semantic tags for everything else.
      document.execCommand("styleWithCSS", false, CSS_STYLED_COMMANDS.has(command));
      document.execCommand(command, false, value);

      savedRange.current = null;
      onChange?.(ref.current?.innerHTML || "");
    },
    [onChange]
  );

  const handleInput = () => {
    onChange?.(
      ref.current?.innerHTML || ""
    );
  };

  return (
    <Box
      sx={{
        border: `1px solid ${tokens.border}`,
        borderRadius: "14px",
        overflow: "hidden",
        background:
          "rgba(255,255,255,0.02)",
      }}
    >
      {/* Toolbar */}

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          p: 1,
          flexWrap: "wrap",

          borderBottom: `1px solid ${tokens.border}`,

          background:
            "rgba(255,255,255,0.03)",

          backdropFilter: "blur(10px)",
        }}
      >
        {/* Undo / Redo */}

        <ToolBtn
          title="Undo"
          onClick={() =>
            exec("undo")
          }
        >
          <UndoRounded />
        </ToolBtn>

        <ToolBtn
          title="Redo"
          onClick={() =>
            exec("redo")
          }
        >
          <RedoRounded />
        </ToolBtn>

        <Divider
          orientation="vertical"
          flexItem
        />

        {/* Headings */}

        <ToolBtn
          title="Heading 1"
          onClick={() =>
            exec(
              "formatBlock",
              "<h1>"
            )
          }
        >
          H1
        </ToolBtn>

        <ToolBtn
          title="Heading 2"
          onClick={() =>
            exec(
              "formatBlock",
              "<h2>"
            )
          }
        >
          H2
        </ToolBtn>

        <ToolBtn
          title="Heading 3"
          onClick={() =>
            exec(
              "formatBlock",
              "<h3>"
            )
          }
        >
          H3
        </ToolBtn>

        <Divider
          orientation="vertical"
          flexItem
        />

        {/* Text Style */}

        <ToolBtn
          title="Bold"
          onClick={() =>
            exec("bold")
          }
        >
          <FormatBoldRounded />
        </ToolBtn>

        <ToolBtn
          title="Italic"
          onClick={() =>
            exec("italic")
          }
        >
          <FormatItalicRounded />
        </ToolBtn>

        <ToolBtn
          title="Underline"
          onClick={() =>
            exec("underline")
          }
        >
          <FormatUnderlinedRounded />
        </ToolBtn>

        <ToolBtn
          title="Strikethrough"
          onClick={() =>
            exec("strikeThrough")
          }
        >
          <StrikethroughSRounded />
        </ToolBtn>

        <Divider
          orientation="vertical"
          flexItem
        />

        {/* Alignment */}

        <ToolBtn
          title="Align Left"
          onClick={() =>
            exec("justifyLeft")
          }
        >
          <FormatAlignLeftRounded />
        </ToolBtn>

        <ToolBtn
          title="Center"
          onClick={() =>
            exec("justifyCenter")
          }
        >
          <FormatAlignCenterRounded />
        </ToolBtn>

        <ToolBtn
          title="Align Right"
          onClick={() =>
            exec("justifyRight")
          }
        >
          <FormatAlignRightRounded />
        </ToolBtn>

        <ToolBtn
          title="Justify"
          onClick={() =>
            exec("justifyFull")
          }
        >
          <FormatAlignJustifyRounded />
        </ToolBtn>

        <Divider
          orientation="vertical"
          flexItem
        />

        {/* Lists */}

        <ToolBtn
          title="Bullet List"
          onClick={() =>
            exec(
              "insertUnorderedList"
            )
          }
        >
          <FormatListBulletedRounded />
        </ToolBtn>

        <ToolBtn
          title="Numbered List"
          onClick={() =>
            exec(
              "insertOrderedList"
            )
          }
        >
          <FormatListNumberedRounded />
        </ToolBtn>

        <Divider
          orientation="vertical"
          flexItem
        />

        {/* Quote & Code */}

        <ToolBtn
          title="Quote"
          onClick={() =>
            exec(
              "formatBlock",
              "<blockquote>"
            )
          }
        >
          <FormatQuoteRounded />
        </ToolBtn>

        <ToolBtn
          title="Code Block"
          onClick={() =>
            exec(
              "formatBlock",
              "<pre>"
            )
          }
        >
          <CodeRounded />
        </ToolBtn>

        <Divider
          orientation="vertical"
          flexItem
        />

        {/* Text Color */}

        <input
          type="color"
          title="Text Color"
          onMouseDown={saveSelection}
          onChange={(e) =>
            exec(
              "foreColor",
              e.target.value
            )
          }
          style={{
            width: 32,
            height: 32,
            border: "none",
            background:
              "transparent",
            cursor: "pointer",
          }}
        />

        {/* Highlight */}

        <input
          type="color"
          title="Highlight"
          onMouseDown={saveSelection}
          onChange={(e) =>
            exec(
              "hiliteColor",
              e.target.value
            )
          }
          style={{
            width: 32,
            height: 32,
            border: "none",
            background:
              "transparent",
            cursor: "pointer",
          }}
        />
      </Box>

      {/* Editor */}

      <Box
        ref={ref}
        className="fv-rich"
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onClick={(e) => e.stopPropagation()}
        sx={{
          minHeight: { xs: 300, sm: 500 },
          maxHeight: { xs: "58vh", sm: 700 },
          overflowY: "auto",

          // The editor works on HTML (Markdown is rendered to HTML on load), so
          // use normal whitespace handling — otherwise the newlines commonmark
          // emits between block tags would render as spurious blank lines.
          // Whitespace inside <pre>/<code> is still preserved by the UA style.
          // Long unbreakable tokens wrap instead of forcing horizontal scroll.
          overflowWrap: "anywhere",

          p: 3,

          outline: "none",

          color: tokens.text,

          // All document typography (headings, paragraphs, lists, quotes, code)
          // lives in the shared `.fv-rich` rules so the editor and the read-only
          // preview render identically. Only structural styles stay here.
        }}
      />
    </Box>
  );
}
