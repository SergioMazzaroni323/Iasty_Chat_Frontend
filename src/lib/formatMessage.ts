export function splitUserMessageContent(content: string): {
  text: string;
  attachmentName?: string;
  attachmentKind?: "pdf" | "image";
} {
  const markers: { marker: string; kind: "pdf" | "image" }[] = [
    { marker: "\n\n---\nAttached PDF (", kind: "pdf" },
    { marker: "\n\n---\nAttached Image (", kind: "image" },
  ];

  for (const { marker, kind } of markers) {
    const idx = content.indexOf(marker);
    if (idx === -1) continue;

    const text = content.slice(0, idx).trimEnd();
    const rest = content.slice(idx + marker.length);
    const end = rest.indexOf("):\n");
    if (end === -1) return { text: content };

    return { text, attachmentName: rest.slice(0, end), attachmentKind: kind };
  }

  return { text: content };
}
