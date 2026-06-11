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

const looksLikeHtml = (s = "") => /<[a-z][\s\S]*>/i.test(s);

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

    const html = looksLikeHtml(initialValue)
      ? initialValue
      : `<p>${(initialValue || "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/\n/g, "<br/>")}</p>`;

    ref.current.innerHTML =
      html || "<p><br/></p>";

    setReady(true);
  }, [initialValue, ready]);

  const exec = useCallback(
    (command, value = null) => {
      document.execCommand(
        command,
        false,
        value
      );

      ref.current?.focus();

      onChange?.(
        ref.current?.innerHTML || ""
      );
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
          minHeight: 500,
          maxHeight: 700,
          overflowY: "auto",

          p: 3,

          outline: "none",

          color: tokens.text,

          fontFamily:
            '"Segoe UI", Arial, sans-serif',

          fontSize: "1rem",

          lineHeight: 1.8,

          "& h1": {
            fontSize: "2rem",
            fontWeight: 700,
            marginBottom: 1,
          },

          "& h2": {
            fontSize: "1.6rem",
            fontWeight: 700,
            marginBottom: 1,
          },

          "& h3": {
            fontSize: "1.3rem",
            fontWeight: 700,
            marginBottom: 1,
          },

          "& p": {
            marginBottom: "0.9em",
          },

          "& blockquote": {
            borderLeft: `4px solid ${tokens.accent}`,
            paddingLeft: "12px",
            marginLeft: 0,
            opacity: 0.9,
          },

          "& pre": {
            background:
              "rgba(0,0,0,0.35)",
            padding: "12px 14px",
            borderRadius: "10px",
            fontFamily:
              "Consolas, monospace",
            overflowX: "auto",
          },
        }}
      />
    </Box>
  );
}
