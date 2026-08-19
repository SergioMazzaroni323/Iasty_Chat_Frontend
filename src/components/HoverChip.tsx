"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface HoverChipProps {
  label: string;
  icon?: ReactNode;
  children: ReactNode;
  delay?: number;
  placement?: "top" | "bottom";
}

export function HoverChip({
  label,
  icon,
  children,
  delay = 200,
  placement = "top",
}: HoverChipProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateCoords = () => {
    const el = wrapperRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setCoords({
      x: rect.left + rect.width / 2,
      y: placement === "bottom" ? rect.bottom + 8 : rect.top - 8,
    });
  };

  const show = () => {
    timeoutRef.current = setTimeout(() => {
      updateCoords();
      setVisible(true);
    }, delay);
  };

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  };

  useEffect(() => {
    if (!visible) return;
    const reposition = () => updateCoords();
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [visible, placement]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="relative flex items-center"
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {children}
      {visible && (
        <div
          className="hover-chip pointer-events-none fixed z-[200]"
          style={{
            left: coords.x,
            top: coords.y,
            transform:
              placement === "bottom" ? "translateX(-50%)" : "translate(-50%, calc(-100% - 0px))",
          }}
        >
          {icon && <span className="hover-chip-icon">{icon}</span>}
          <span>{label}</span>
        </div>
      )}
    </div>
  );
}
