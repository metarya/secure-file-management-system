export function htmlToText(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");

  function walk(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || "";
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }

    const tag = node.tagName.toLowerCase();
    const children = [...node.childNodes].map(walk).join("");

    switch (tag) {
      case "h1":
        return `# ${children.trim()}\n\n`;

      case "h2":
        return `## ${children.trim()}\n\n`;

      case "h3":
        return `### ${children.trim()}\n\n`;

      case "h4":
        return `#### ${children.trim()}\n\n`;

      case "h5":
        return `##### ${children.trim()}\n\n`;

      case "h6":
        return `###### ${children.trim()}\n\n`;

      case "p": {
        const text = children.trim();

        if (!text) return "\n";

        // Treat short bold paragraphs as headings
        const isHeading =
          node.querySelector("b, strong") &&
          text.length < 80 &&
          !text.endsWith(".") &&
          !text.startsWith("-");

        if (isHeading) {
          return `${text}\n${"-".repeat(text.length)}\n\n`;
        }

        return `${text}\n\n`;
      }

      case "br":
        return "\n";

      // Remove formatting markers for TXT export
      case "strong":
      case "b":
      case "em":
      case "i":
      case "u":
        return children;

      case "blockquote":
        return `> ${children.trim()}\n\n`;

      case "code":
        return `\`${children}\``;

      case "pre":
        return `\`\`\`\n${children.trim()}\n\`\`\`\n\n`;

      case "hr":
        return "\n--------------------------------------------------\n\n";

      case "ul":
      case "ol":
        return children + "\n";

      case "li": {
        const parent = node.parentElement?.tagName.toLowerCase();

        if (parent === "ol") {
          const index =
            [...node.parentElement.children].indexOf(node) + 1;
          return `${index}. ${children.trim()}\n`;
        }

        return `- ${children.trim()}\n`;
      }

      case "a": {
        const href = node.getAttribute("href");

        if (href) {
          return `${children} (${href})`;
        }

        return children;
      }

      case "table":
        return "\n" + children + "\n";

      case "tr":
        return children + "\n";

      case "td":
      case "th":
        return children.trim() + "\t";

      default:
        return children;
    }
  }

  return walk(doc.body)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\t+/g, "\t")
    .trim();
}