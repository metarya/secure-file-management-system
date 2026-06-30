// Single source of truth for turning stored content into "what the Preview
// dialog shows".
//
// The rich-text editor stores content as HTML internally (unchanged). The
// Preview dialog injects toPreviewHtml() via dangerouslySetInnerHTML; the
// download reads htmlToReadableText() — the innerText of that very same render.
// Because both go through this one module and the browser's renderer, a
// downloaded text file matches the Preview byte-for-byte (minus visual styling).

// Does the stored content contain HTML tags? (The heuristic Preview uses.)
export const looksLikeHtml = (s = "") => /<[a-z][\s\S]*>/i.test(s);

// The exact HTML string the Preview dialog renders for text content.
export function toPreviewHtml(content = "") {
  if (looksLikeHtml(content)) return content;
  // Plain (non-HTML) content is shown verbatim inside a <pre>.
  return `<pre style="white-space:pre-wrap;font-family:inherit;margin:0">${(content || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")}</pre>`;
}

// Render the same HTML Preview shows and read back its innerText — the browser's
// own layout-aware text, i.e. exactly what the user sees (without bold/italic).
// Browser-only: innerText needs the node laid out, so we attach it off-screen.
// If there is no DOM (e.g. SSR), fall back to returning the content unchanged.
export function htmlToReadableText(content = "") {
  if (!content) return "";
  if (typeof document === "undefined") return content;

  const host = document.createElement("div");
  host.className = "fv-rich";
  host.setAttribute("aria-hidden", "true");
  // Off-screen but still laid out, so innerText reflects real line breaks.
  host.style.cssText = "position:absolute;left:-99999px;top:0";
  host.innerHTML = toPreviewHtml(content);

  document.body.appendChild(host);
  const text = host.innerText;
  document.body.removeChild(host);

  return text == null ? "" : text;
}
