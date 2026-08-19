"use client";

import { Database, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { AdditionalDataItem } from "@/lib/api";

interface AdditionalDataPanelProps {
  item: AdditionalDataItem | null;
  onAddMore: () => void;
  onUpdate: (id: number, content: string) => Promise<void>;
  onDelete: (id: number) => void;
  onEditingChange?: (editing: boolean) => void;
}

export function AdditionalDataPanel({
  item,
  onAddMore,
  onUpdate,
  onDelete,
  onEditingChange,
}: AdditionalDataPanelProps) {
  const [editing, setEditing] = useState(false);
  const [draftContent, setDraftContent] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEditing(false);
    setDraftContent("");
    setSaving(false);
  }, [item?.id]);

  useEffect(() => {
    onEditingChange?.(editing);
  }, [editing, onEditingChange]);

  if (!item) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{
            background: "linear-gradient(135deg, var(--accent-from), var(--accent-to))",
            boxShadow: "var(--shadow-btn)",
          }}
        >
          <Database size={24} className="text-white" />
        </div>
        <p className="text-sm font-medium" style={{ color: "var(--fg-secondary)" }}>
          Select additional data or create a new one
        </p>
      </div>
    );
  }

  const isDirty = draftContent !== item.content;
  const actionsDisabled = editing || saving;

  const startEditing = () => {
    setDraftContent(item.content);
    setEditing(true);
  };

  const cancelEditing = () => {
    if (!confirm("Cancel editing? Unsaved changes will be lost.")) return;
    setEditing(false);
    setDraftContent("");
  };

  const saveEditing = async () => {
    if (!isDirty) return;
    if (!confirm("Save changes to this additional data?")) return;

    setSaving(true);
    try {
      await onUpdate(item.id, draftContent.trim());
      setEditing(false);
      setDraftContent("");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (actionsDisabled) return;
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    onDelete(item.id);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className="flex items-center justify-between gap-3 px-5 py-4"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <div>
          <h1 className="text-sm font-semibold tracking-tight" style={{ color: "var(--fg-primary)" }}>
            {item.name}
          </h1>
          <p className="mt-1 text-xs" style={{ color: "var(--fg-muted)" }}>
            Used in RAG when you chat
          </p>
        </div>
        <button
          type="button"
          disabled={actionsDisabled}
          onClick={handleDelete}
          className="btn-ghost flex items-center gap-1.5 px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-40"
          style={{ color: "var(--fg-muted)" }}
        >
          <Trash2 size={14} />
          Delete
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        {editing ? (
          <textarea
            value={draftContent}
            onChange={(e) => setDraftContent(e.target.value)}
            disabled={saving}
            className="input-field min-h-full w-full resize-none px-4 py-3 text-[0.9375rem] leading-relaxed"
            style={{ minHeight: "100%" }}
          />
        ) : (
          <div
            className="message-assistant message-bubble whitespace-pre-wrap text-[0.9375rem] leading-relaxed"
            style={{ minHeight: "100%" }}
          >
            {item.content || (
              <span style={{ color: "var(--fg-muted)" }}>No content yet. Add data below.</span>
            )}
          </div>
        )}
      </div>

      <div
        className="flex items-center justify-between gap-3 p-4 pt-2"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
        <button
          type="button"
          disabled={actionsDisabled}
          onClick={onAddMore}
          className="btn-primary flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus size={16} />
          Add more data
        </button>

        {editing ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={cancelEditing}
              className="btn-ghost rounded-xl px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!isDirty || saving}
              onClick={saveEditing}
              className="btn-primary rounded-xl px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={startEditing}
            className="btn-ghost flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm"
          >
            <Pencil size={16} />
            Edit Data
          </button>
        )}
      </div>
    </div>
  );
}
