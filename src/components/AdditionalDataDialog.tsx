"use client";

import { Loader2, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { formatApiError } from "@/lib/formatError";

interface AdditionalDataDialogProps {
  open: boolean;
  mode: "create" | "append";
  initialName?: string;
  onClose: () => void;
  onSave: (payload: { name?: string; content: string }) => Promise<void>;
}

export function AdditionalDataDialog({
  open,
  mode,
  initialName = "",
  onClose,
  onSave,
}: AdditionalDataDialogProps) {
  const [name, setName] = useState(initialName || "Untitled");
  const [content, setContent] = useState("");
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setContent("");
      setError("");
      setName(initialName || "Untitled");
    }
  }, [open, initialName]);

  if (!open) return null;

  const resetAndClose = () => {
    setContent("");
    setError("");
    setName(initialName || "Untitled");
    onClose();
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setParsing(true);
    setError("");
    try {
      const result = await api.parseFiles(Array.from(files));
      setContent((prev) => (prev.trim() ? `${prev.trim()}\n\n${result.text}` : result.text));
    } catch (err) {
      setError(err instanceof Error ? formatApiError(err.message) : "Failed to parse files");
    } finally {
      setParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleOk = async () => {
    const trimmed = content.trim();
    if (!trimmed) {
      setError("Enter text or import files before saving.");
      return;
    }
    if (mode === "create" && !name.trim()) {
      setError("Name is required.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await onSave({
        name: mode === "create" ? name.trim() : undefined,
        content: trimmed,
      });
      setContent("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? formatApiError(err.message) : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="surface-3d flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl">
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <h2 className="text-lg font-semibold tracking-tight">
            {mode === "create" ? "Add additional data" : "Add more data"}
          </h2>
          <button onClick={resetAndClose} className="btn-icon h-9 w-9" type="button">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
          {mode === "create" && (
            <div>
              <label className="mb-2 block text-sm font-medium" style={{ color: "var(--fg-secondary)" }}>
                Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field px-3 py-2.5 text-sm"
                placeholder="Data name"
              />
            </div>
          )}

          <div className="flex flex-1 flex-col">
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="text-sm font-medium" style={{ color: "var(--fg-secondary)" }}>
                Text
              </label>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".txt,.pdf,.doc,.docx,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
                <button
                  type="button"
                  disabled={parsing || saving}
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-ghost flex items-center gap-2 px-3 py-2 text-sm"
                >
                  {parsing ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                  From PC
                </button>
              </div>
            </div>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={parsing || saving}
              placeholder="Enter text or import .txt, .pdf, or .docx files..."
              className="input-field min-h-[280px] flex-1 resize-y px-4 py-3 text-sm leading-relaxed"
            />
          </div>

          {parsing && (
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--fg-muted)" }}>
              <Loader2 size={16} className="animate-spin" />
              Parsing files...
            </div>
          )}

          {error && (
            <p className="text-sm" style={{ color: "#ef4444" }}>
              {error}
            </p>
          )}
        </div>

        <div
          className="flex justify-end gap-2 px-6 py-4"
          style={{ borderTop: "1px solid var(--border-subtle)" }}
        >
          <button type="button" onClick={resetAndClose} className="btn-ghost px-4 py-2 text-sm">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleOk}
            disabled={parsing || saving}
            className="btn-primary px-4 py-2 text-sm"
          >
            {saving ? "Saving..." : "OK"}
          </button>
        </div>
      </div>
    </div>
  );
}
