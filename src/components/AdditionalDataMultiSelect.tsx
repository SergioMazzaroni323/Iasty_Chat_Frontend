"use client";

import { Check, ChevronDown, Database } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AdditionalDataItem } from "@/lib/api";

interface AdditionalDataMultiSelectProps {
  items: Pick<AdditionalDataItem, "id" | "name">[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  disabled?: boolean;
}

export function AdditionalDataMultiSelect({
  items,
  selectedIds,
  onChange,
  disabled,
}: AdditionalDataMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleId = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((entry) => entry !== id));
      return;
    }
    onChange([...selectedIds, id]);
  };

  const selectedNames = items
    .filter((item) => selectedIds.includes(item.id))
    .map((item) => item.name);

  let label = "Additional data";
  if (selectedNames.length === 1) {
    label = selectedNames[0];
  } else if (selectedNames.length > 1) {
    label = `${selectedNames.length} selected`;
  }

  return (
    <div className="relative min-w-0 flex-1 sm:flex-none" ref={rootRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
        className="input-field flex h-9 w-full min-w-0 cursor-pointer items-center gap-2 truncate px-3 text-sm disabled:cursor-not-allowed disabled:opacity-40 sm:max-w-[220px]"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Database size={14} className="shrink-0" style={{ color: "var(--accent-from)" }} />
        <span className="min-w-0 flex-1 truncate text-left">{label}</span>
        <ChevronDown size={14} className="shrink-0" style={{ color: "var(--fg-muted)" }} />
      </button>

      {open && (
        <div
          className="dropdown-menu absolute bottom-full left-0 z-20 mb-2 max-h-56 w-full min-w-[220px] overflow-y-auto py-1 sm:w-64"
          role="listbox"
          aria-multiselectable
        >
          {items.length === 0 ? (
            <p className="px-3 py-2 text-xs" style={{ color: "var(--fg-muted)" }}>
              No additional data yet
            </p>
          ) : (
            items.map((item) => {
              const checked = selectedIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  role="option"
                  aria-selected={checked}
                  onClick={() => toggleId(item.id)}
                  className={`dropdown-item ${checked ? "active" : ""}`}
                >
                  <span
                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded border"
                    style={{
                      borderColor: checked
                        ? "var(--accent-from)"
                        : "var(--border-subtle)",
                      background: checked
                        ? "color-mix(in srgb, var(--accent-from) 15%, transparent)"
                        : "transparent",
                      color: "var(--accent-from)",
                    }}
                  >
                    {checked && <Check size={12} />}
                  </span>
                  <span className="min-w-0 truncate">{item.name}</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
