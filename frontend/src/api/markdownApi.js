// Markdown rendering — POST /api/markdown/render -> server-sanitized HTML.
//
// Rendering is intentionally separate from file operations so it can be reused
// for comments, README/doc previews, wikis, etc. The returned HTML is produced
// (and sanitized) by the backend MarkdownService; callers must render it as-is
// and must never build Markdown HTML on the client.
import { api } from "../lib/apiClient";

export const renderMarkdown = (content) =>
  api.post(`/markdown/render`, { content });
