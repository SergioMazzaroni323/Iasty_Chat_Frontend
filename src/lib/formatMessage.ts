export function splitUserMessageContent(content: string): {
  text: string;
  attachmentName?: string;
  attachmentKind?: "pdf" | "image";
} {
  // Storage may strip leading newlines when the message is attachment-only.
  const markers: { kind: "pdf" | "image"; marker: string }[] = [
    { kind: "pdf", marker: "---\nAttached PDF (" },
    { kind: "image", marker: "---\nAttached Image (" },
  ];

  for (const { kind, marker } of markers) {
    const idx = content.indexOf(marker);
    if (idx === -1) continue;

    const text = content.slice(0, idx).replace(/\n+$/, "").trimEnd();
    const rest = content.slice(idx + marker.length);
    const end = rest.indexOf("):\n");
    if (end === -1) return { text: content };

    return { text, attachmentName: rest.slice(0, end), attachmentKind: kind };
  }

  return { text: content };
}
