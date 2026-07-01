import { Box, Typography, Chip } from "@mui/material";
import { useColorMode } from "../../theme/ColorModeContext";
import { tokens } from "../../theme/theme";
import { formatBytes } from "../../utils/format";

// GitHub-ish line backgrounds for both themes.
function lineColors(mode) {
  const dark = mode !== "light";
  return {
    added: {
      bg: dark ? "rgba(46,160,67,0.18)" : "rgba(46,160,67,0.14)",
      gutter: dark ? "rgba(46,160,67,0.28)" : "rgba(46,160,67,0.22)",
      sign: dark ? "#3fb950" : "#1a7f37",
    },
    removed: {
      bg: dark ? "rgba(248,81,73,0.18)" : "rgba(248,81,73,0.12)",
      gutter: dark ? "rgba(248,81,73,0.28)" : "rgba(248,81,73,0.20)",
      sign: dark ? "#f85149" : "#cf222e",
    },
  };
}

function MetaCard({ diff }) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
      {[
        ["Previous Version", diff.previousVersionNumber != null ? `v${diff.previousVersionNumber}` : "—"],
        ["Current Version", diff.currentVersionNumber != null ? `v${diff.currentVersionNumber}` : "—"],
        ["Previous Size", diff.previousSize != null ? formatBytes(diff.previousSize) : "—"],
        ["Current Size", diff.currentSize != null ? formatBytes(diff.currentSize) : "—"],
        ["Previous Checksum", diff.previousChecksum || "—"],
        ["Current Checksum", diff.currentChecksum || "—"],
      ].map(([label, value]) => (
        <Box key={label}>
          <Typography sx={{ color: tokens.textFaint, fontSize: "0.66rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            {label}
          </Typography>
          <Typography sx={{ color: tokens.text, fontSize: "0.82rem", fontFamily: "monospace", wordBreak: "break-all" }}>
            {value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

/**
 * Renders the backend-generated diff. The frontend only presents what the
 * backend computed — TEXT_DIFF (line-by-line, GitHub-style) or BINARY_METADATA
 * (a version/size/checksum comparison card).
 */
export default function DiffViewer({ diff }) {
  const { mode } = useColorMode();

  if (!diff) return null;

  if (diff.mode === "BINARY_METADATA") {
    return (
      <Box sx={{ mt: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
          <Chip size="small" label="Binary file modified" sx={{ fontWeight: 700, fontSize: "0.68rem" }} />
        </Box>
        <MetaCard diff={diff} />
      </Box>
    );
  }

  if (diff.mode !== "TEXT_DIFF") {
    return (
      <Typography sx={{ color: tokens.textDim, fontSize: "0.85rem", mt: 1 }}>
        {diff.message || "No changes to display."}
      </Typography>
    );
  }

  const c = lineColors(mode);
  const lines = diff.lines || [];

  return (
    <Box sx={{ mt: 1 }}>
      {/* Summary */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
        <Typography sx={{ color: c.added.sign, fontSize: "0.8rem", fontWeight: 700 }}>
          +{diff.totalAdditions ?? 0} addition{(diff.totalAdditions ?? 0) === 1 ? "" : "s"}
        </Typography>
        <Typography sx={{ color: c.removed.sign, fontSize: "0.8rem", fontWeight: 700 }}>
          −{diff.totalDeletions ?? 0} deletion{(diff.totalDeletions ?? 0) === 1 ? "" : "s"}
        </Typography>
      </Box>

      {/* Diff body */}
      <Box
        sx={{
          border: `1px solid ${tokens.border}`, borderRadius: "12px", overflow: "hidden",
          fontFamily: "monospace", fontSize: "0.8rem", lineHeight: 1.55,
          maxHeight: 360, overflowY: "auto", background: tokens.surface,
        }}
      >
        {lines.map((ln, idx) => {
          const isAdded = ln.type === "added";
          const isRemoved = ln.type === "removed";
          const bg = isAdded ? c.added.bg : isRemoved ? c.removed.bg : "transparent";
          const gutterBg = isAdded ? c.added.gutter : isRemoved ? c.removed.gutter : "transparent";
          const sign = isAdded ? "+" : isRemoved ? "−" : " ";
          const signColor = isAdded ? c.added.sign : isRemoved ? c.removed.sign : tokens.textFaint;
          return (
            <Box key={idx} sx={{ display: "flex", background: bg, whiteSpace: "pre" }}>
              <Box sx={{ width: 44, flexShrink: 0, textAlign: "right", pr: 1, color: tokens.textFaint, background: gutterBg, userSelect: "none" }}>
                {ln.oldLineNumber ?? ""}
              </Box>
              <Box sx={{ width: 44, flexShrink: 0, textAlign: "right", pr: 1, color: tokens.textFaint, background: gutterBg, userSelect: "none" }}>
                {ln.newLineNumber ?? ""}
              </Box>
              <Box sx={{ width: 18, flexShrink: 0, textAlign: "center", color: signColor, userSelect: "none" }}>
                {sign}
              </Box>
              <Box sx={{ flex: 1, pr: 1, color: tokens.text, overflowX: "auto" }}>
                {ln.content === "" ? " " : ln.content}
              </Box>
            </Box>
          );
        })}
        {lines.length === 0 && (
          <Typography sx={{ p: 2, color: tokens.textDim, fontSize: "0.82rem", fontFamily: "inherit" }}>
            No line changes detected.
          </Typography>
        )}
      </Box>
    </Box>
  );
}
