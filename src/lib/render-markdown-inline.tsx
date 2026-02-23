import type { ReactNode } from "react";

/**
 * Renders inline markdown: **bold** and *italic*. No block elements.
 * Escapes HTML to avoid XSS.
 */
export function renderMarkdownInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    const italicMatch = remaining.match(/\*(.+?)\*/);

    let match: RegExpMatchArray | null = null;
    let type: "bold" | "italic" = "bold";
    if (boldMatch && (!italicMatch || boldMatch.index! <= italicMatch.index!)) {
      match = boldMatch;
      type = "bold";
    } else if (italicMatch) {
      match = italicMatch;
      type = "italic";
    }

    if (!match || match.index === undefined) {
      parts.push(remaining);
      break;
    }

    const before = remaining.slice(0, match.index);
    if (before) parts.push(before);

    const inner = match[1];
    if (type === "bold") {
      parts.push(<strong key={parts.length} className="font-semibold">{inner}</strong>);
    } else {
      parts.push(<em key={parts.length} className="italic">{inner}</em>);
    }

    remaining = remaining.slice(match.index + match[0].length);
  }

  return parts;
}
