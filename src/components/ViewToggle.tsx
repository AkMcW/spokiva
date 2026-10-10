"use client";
import { useEffect, useState } from "react";
import { LayoutGrid, List } from "lucide-react";

export type ViewMode = "grid" | "list";

// Remembers the chosen layout per page (key) in localStorage.
// Read after mount so server and client render the same first frame.
export function useViewMode(key: string): [ViewMode, (v: ViewMode) => void] {
  const [mode, setMode] = useState<ViewMode>("grid");
  useEffect(() => {
    try {
      const v = localStorage.getItem(key);
      if (v === "grid" || v === "list") setMode(v);
    } catch { /* storage unavailable */ }
  }, [key]);
  function update(v: ViewMode) {
    setMode(v);
    try { localStorage.setItem(key, v); } catch { /* ignore */ }
  }
  return [mode, update];
}

export default function ViewToggle({ mode, onChange }: { mode: ViewMode; onChange: (v: ViewMode) => void }) {
  const btn = (v: ViewMode, Icon: typeof List, label: string) => (
    <button
      onClick={() => onChange(v)}
      title={label}
      aria-label={label}
      aria-pressed={mode === v}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 34, height: 34, border: "none", cursor: "pointer",
        background: mode === v ? "var(--accent)" : "transparent",
        color: mode === v ? "#fff" : "var(--text-secondary)",
      }}
    >
      <Icon size={15} />
    </button>
  );
  return (
    <div style={{ display: "flex", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden", background: "var(--card-bg)" }}>
      {btn("grid", LayoutGrid, "Grid view")}
      {btn("list", List, "List view")}
    </div>
  );
}
