"use client";

import { Tooltip } from "./Tooltip";

interface ThreadHeaderProps {
  name: string;
  tokenUsed: number;
  tokenLimit: number;
}

export function ThreadHeader({ name, tokenUsed, tokenLimit }: ThreadHeaderProps) {
  const remain = Math.max(0, tokenLimit - tokenUsed);
  const percent = tokenLimit > 0 ? Math.min(100, Math.round((tokenUsed / tokenLimit) * 100)) : 0;

  return (
    <div
      className="glass-panel flex items-center gap-4 px-5 py-3.5"
      style={{ borderTop: "none", borderLeft: "none", borderRight: "none", borderRadius: 0 }}
    >
      <h1
        className="min-w-0 flex-1 truncate text-sm font-semibold tracking-tight"
        style={{ color: "var(--fg-primary)" }}
      >
        {name}
      </h1>
      <Tooltip
        content={`${tokenUsed} / ${remain}`}
        delay={300}
        placement="bottom"
        className="min-w-[140px] sm:min-w-[240px]"
      >
        <div className="flex w-full cursor-default items-center gap-3">
          <div className="progress-track flex-1">
            <div className="progress-fill" style={{ width: `${percent}%` }} />
          </div>
          <span
            className="w-10 shrink-0 text-right text-xs font-medium tabular-nums"
            style={{ color: "var(--fg-secondary)" }}
          >
            {percent}%
          </span>
        </div>
      </Tooltip>
    </div>
  );
}
