export function splitUserMessageContent(content: string): {
  text: string;
  attachmentName?: string;
} {
  const marker = "\n\n---\nAttached PDF (";
  const idx = content.indexOf(marker);
  if (idx === -1) return { text: content };

  const text = content.slice(0, idx).trimEnd();
  const rest = content.slice(idx + marker.length);
  const end = rest.indexOf("):\n");
  if (end === -1) return { text: content };

  return { text, attachmentName: rest.slice(0, end) };
}
