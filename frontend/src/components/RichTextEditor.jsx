import { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";

/* ─── helpers ──────────────────────────────────────────────────────────────── */

const looksLikeHtml = (s) => /<[a-z][\s\S]*>/i.test(s);

const saveRange = () => {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  return sel.getRangeAt(0).cloneRange();
};
const restoreRange = (range) => {
  if (!range) return;
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
};

/* ─── main component ────────────────────────────────────────────────────────── */

export default function RichTextEditor({
  initialContent = "",
  onSave,
  onCancel,
  saving      = false,
  saveError   = "",
  saveSuccess = "",
}) {
  const editorRef  = useRef(null);
  const savedRange = useRef(null);


  /* ── Seed on mount ── */
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (looksLikeHtml(initialContent)) {
      el.innerHTML = initialContent;
    } else {
      el.innerHTML = initialContent
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br>");
    }
    const range = document.createRange();
    const sel   = window.getSelection();
    range.selectNodeContents(el);
    range.collapse(false);
    sel?.removeAllRanges();
    sel?.addRange(range);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Cursor save/restore ── */
  useEffect(() => {
    if (saving) {
      savedRange.current = saveRange();
    } else if (savedRange.current) {
      editorRef.current?.focus();
      restoreRange(savedRange.current);
      savedRange.current = null;
    }
  }, [saving]);

  /* ── execCommand ── */
  const exec = useCallback((cmd, value = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
  }, []);

  /* ── Save: send innerHTML ── */
const handleSave = useCallback(async () => {
  if (!editorRef.current || !onSave) return;

  const html = editorRef.current.innerHTML;

  console.log("EDITOR HTML:", html);

  await onSave(html);
}, [onSave]);

  /* ── Font size — capture range BEFORE focus() ── */

  const qState = (cmd) => { try { return document.queryCommandState(cmd); } catch { return false; } };

  /* ── Render ── */
  return (
    <Box sx={{ border: "1px solid #e5e7eb", borderRadius: "12px"}}>

      {/* Feedback banners */}
      {saveSuccess && (
        <Box sx={{ px: 2, py: 1, backgroundColor: "#d1fae5" }}>
          <Typography sx={{ color: "#065f46", fontSize: "0.875rem", fontWeight: 600 }}>{saveSuccess}</Typography>
        </Box>
      )}
      {saveError && (
        <Box sx={{ px: 2, py: 1, backgroundColor: "#fce7e7" }}>
          <Typography sx={{ color: "#991b1b", fontSize: "0.875rem", fontWeight: 600 }}>{saveError}</Typography>
        </Box>
      )}

      {/* ── Toolbar wrapper ── */}
      <Box sx={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb", px: 1, py: 0.5 }}>

        {/* ROW 1 — text controls */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.3, flexWrap: "nowrap", py: 0.4 }}>

          {/* Undo / Redo */}
          <Btn title="Undo (Ctrl+Z)" onClick={() => exec("undo")} disabled={saving}>{ICO.undo}</Btn>
          <Btn title="Redo (Ctrl+Y)" onClick={() => exec("redo")} disabled={saving}>{ICO.redo}</Btn>
          <Sep />

          <Sep />

          {/* Headings */}
          {["h1","h2","h3"].map((tag) => (
            <Tooltip key={tag} title={tag.toUpperCase()} placement="top" arrow>
              <IconButton
                size="small"
                disabled={saving}
                onMouseDown={(e) => { e.preventDefault(); exec("formatBlock", tag); }}
                sx={{ width: 30, height: 28, borderRadius: "6px", fontSize: "0.63rem", fontWeight: 800, color: "#374151", "&:hover": { backgroundColor: "#f3f4f6" } }}
              >
                {tag.toUpperCase()}
              </IconButton>
            </Tooltip>
          ))}
          <Sep />

          {/* Bold / Italic / Underline */}
          <Btn title="Bold (Ctrl+B)"      onClick={() => exec("bold")}      active={qState("bold")}      disabled={saving}>{ICO.bold}</Btn>
          <Btn title="Italic (Ctrl+I)"    onClick={() => exec("italic")}    active={qState("italic")}    disabled={saving}>{ICO.italic}</Btn>
          <Btn title="Underline (Ctrl+U)" onClick={() => exec("underline")} active={qState("underline")} disabled={saving}>{ICO.underline}</Btn>
          <Sep />

          {/* Colors */}
          <ColorPicker colors={TEXT_COLORS}      onPick={(c) => exec("foreColor",   c)} label="Text color"      disabled={saving}>{ICO.textColor}</ColorPicker>
          <ColorPicker colors={HIGHLIGHT_COLORS} onPick={(c) => exec("hiliteColor", c)} label="Highlight color" disabled={saving}>{ICO.highlight}</ColorPicker>
          <Sep />

          {/* Lists */}
          <Btn title="Bullet list"   onClick={() => exec("insertUnorderedList")} active={qState("insertUnorderedList")} disabled={saving}>{ICO.ul}</Btn>
          <Btn title="Numbered list" onClick={() => exec("insertOrderedList")}   active={qState("insertOrderedList")}   disabled={saving}>{ICO.ol}</Btn>
        </Box>

        {/* ROW 2 — alignment */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.3, flexWrap: "nowrap", pb: 0.4 }}>
          <Btn title="Align left"   onClick={() => exec("justifyLeft")}   active={qState("justifyLeft")}   disabled={saving}>{ICO.alignLeft}</Btn>
          <Btn title="Align center" onClick={() => exec("justifyCenter")} active={qState("justifyCenter")} disabled={saving}>{ICO.alignCenter}</Btn>
          <Btn title="Align right"  onClick={() => exec("justifyRight")}  active={qState("justifyRight")}  disabled={saving}>{ICO.alignRight}</Btn>
          <Btn title="Justify"      onClick={() => exec("justifyFull")}   active={qState("justifyFull")}   disabled={saving}>{ICO.justify}</Btn>
        </Box>
      </Box>

      {/* ── Editable area ── */}
      <Box
        ref={editorRef}
        contentEditable={saving ? "false" : "true"}
        suppressContentEditableWarning
        onKeyUp={() => {
          savedRange.current = saveRange();
        }}
        onMouseUp={() => {
          savedRange.current = saveRange();
        }}
        sx={{
          minHeight: 280, maxHeight: 440, overflowY: "auto",
          p: "16px 20px",
          backgroundColor: saving ? "#f9fafb" : "#fff",
          fontSize: "0.9rem", lineHeight: 1.75,
          outline: "none", fontFamily: "inherit",
          cursor: saving ? "not-allowed" : "text",
          wordBreak: "break-word",
          "&:focus": { boxShadow: "inset 0 0 0 2px rgba(37,99,235,0.18)" },
          "& h1": { fontSize: "1.6rem", fontWeight: 700, margin: "0.3em 0" },
          "& h2": { fontSize: "1.3rem", fontWeight: 700, margin: "0.3em 0" },
          "& h3": { fontSize: "1.1rem", fontWeight: 700, margin: "0.3em 0" },
          "& ul, & ol": { paddingLeft: "1.5em", margin: "0.3em 0" },
          "& li": { marginBottom: "0.15em" },
          "& p":  { margin: "0.2em 0" },
        }}
      />

      {/* ── Bottom action row ── */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, px: 2, py: 1.25, backgroundColor: "#f9fafb", borderTop: "1px solid #e5e7eb" }}>
        {onCancel && (
          <Button size="small" variant="outlined" disabled={saving} onClick={onCancel}
            sx={{ textTransform: "none", borderRadius: "8px", borderColor: "#d1d5db", color: "#374151", fontWeight: 600, "&:hover": { borderColor: "#9ca3af", backgroundColor: "#f3f4f6" } }}>
            Cancel
          </Button>
        )}
        <Button size="small" variant="contained" disabled={saving} onClick={handleSave}
          startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
          sx={{ textTransform: "none", borderRadius: "8px", fontWeight: 700, backgroundColor: "#2563eb", "&:hover": { backgroundColor: "#1d4ed8" }, "&:disabled": { backgroundColor: "#93c5fd", color: "#fff" } }}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </Box>
    </Box>
  );
}

/* ─── sub-components ────────────────────────────────────────────────────────── */

function Sep() {
  return <Divider orientation="vertical" flexItem sx={{ mx: 0.4, borderColor: "#e5e7eb", height: 20, alignSelf: "center" }} />;
}

function Btn({ title, onClick, active = false, children, disabled = false }) {
  return (
    <Tooltip title={title} placement="top" arrow>
      <span>
        <IconButton size="small" disabled={disabled}
          onMouseDown={(e) => { e.preventDefault(); onClick(e); }}
          sx={{
            width: 28, height: 28, borderRadius: "6px",
            color: active ? "#2563eb" : "#374151",
            backgroundColor: active ? "#dbeafe" : "transparent",
            "&:hover": { backgroundColor: active ? "#bfdbfe" : "#f3f4f6" },
            transition: "all 0.1s",
          }}>
          {children}
        </IconButton>
      </span>
    </Tooltip>
  );
}

/**
 * DDL — controlled dropdown with placeholder support.
 * `displayEmpty` + `renderValue` make MUI show the placeholder string
 * when value is "" instead of rendering a blank box.
 */
function ColorPicker({ colors, onPick, label, children, disabled = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <Box ref={ref} sx={{ position: "relative", display: "inline-block" }}>
      <Tooltip title={label} placement="top" arrow>
        <span>
          <IconButton size="small" disabled={disabled}
            onMouseDown={(e) => { e.preventDefault(); if (!disabled) setOpen((o) => !o); }}
            sx={{ width: 28, height: 28, borderRadius: "6px", color: "#374151", "&:hover": { backgroundColor: "#f3f4f6" } }}>
            {children}
          </IconButton>
        </span>
      </Tooltip>
      {open && (
        <Box sx={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 10000,
          backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)", p: 1,
          display: "grid", gridTemplateColumns: "repeat(5, 22px)", gap: "4px",
        }}>
          {colors.map((c) => (
            <Box key={c}
              onMouseDown={(e) => { e.preventDefault(); onPick(c); setOpen(false); }}
              sx={{
                width: 22, height: 22, borderRadius: "4px",
                backgroundColor: c === "transparent" ? "#fff" : c,
                border: c === "transparent" ? "1px dashed #9ca3af" : "1px solid rgba(0,0,0,0.12)",
                cursor: "pointer",
                "&:hover": { transform: "scale(1.2)", transition: "transform 0.1s" },
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

/* ─── constants ─────────────────────────────────────────────────────────────── */

const TEXT_COLORS = [
  "#111827","#374151","#6b7280",
  "#ef4444","#f97316","#eab308",
  "#22c55e","#3b82f6","#8b5cf6","#ec4899",
];

const HIGHLIGHT_COLORS = [
  "transparent",
  "#fef08a","#bbf7d0","#bfdbfe","#fecaca",
  "#e9d5ff","#fed7aa","#fbcfe8","#d1fae5","#cffafe",
];

/* ─── inline SVG icons ──────────────────────────────────────────────────────── */
const ICO = {
  bold:        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/></svg>,
  italic:      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/></svg>,
  underline:   <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"/></svg>,
  ul:          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/></svg>,
  ol:          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-7v2h14V4H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"/></svg>,
  alignLeft:   <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z"/></svg>,
  alignCenter: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z"/></svg>,
  alignRight:  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z"/></svg>,
  justify:     <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 21h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18V7H3v2zm0-6v2h18V3H3z"/></svg>,
  undo:        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg>,
  redo:        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z"/></svg>,
  textColor:   <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M11.33 4l-6.99 18H7l1.54-4h7.92L18 22h2.67L13.67 4h-2.34zm-2.11 12L12 7.67 14.78 16H9.22z"/><rect x="2" y="20" width="20" height="3" fill="#2563eb"/></svg>,
  highlight:   <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 21a2 2 0 01-2-2v-2l9-9 4 4-9 9H7zm13.7-11.3a1 1 0 000-1.4l-2.6-2.6a1 1 0 00-1.4 0L15 8l4 4 1.7-2.3z"/><rect x="2" y="20" width="20" height="3" fill="#fef08a"/></svg>,
};