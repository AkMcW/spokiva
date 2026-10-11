"use client";
import { useEffect, useRef, useState } from "react";
import { Palette, Check } from "lucide-react";
import { THEMES, useTheme } from "@/context/ThemeContext";

function Swatch({ colors, size = 18 }: { colors: [string, string, string]; size?: number }) {
  const [bg, ink, accent] = colors;
  return (
    <span
      aria-hidden="true"
      style={{
        width: size, height: size, borderRadius: "50%", flexShrink: 0, display: "inline-block",
        background: `linear-gradient(135deg, ${bg} 0 50%, ${ink} 50% 75%, ${accent} 75% 100%)`,
        boxShadow: "0 0 0 1px var(--border)",
      }}
    />
  );
}

// Compact dropdown for headers/navbars.
export default function ThemePicker({ align = "right" }: { align?: "left" | "right" }) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Reading theme"
        className="p-2 rounded-lg transition-colors"
        style={{ color: "var(--text-secondary)", background: open ? "var(--bg-hover)" : "transparent" }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = "transparent"; }}
      >
        <Palette size={17} />
      </button>
      {open && (
        <div
          role="menu"
          className={`absolute ${align === "right" ? "right-0" : "left-0"} top-full mt-2 z-50 w-64 rounded-xl border p-1.5 shadow-xl`}
          style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest px-2.5 pt-1.5 pb-1" style={{ color: "var(--text-muted)" }}>
            Reading theme
          </p>
          {THEMES.map((t) => {
            const active = t.id === theme;
            return (
              <button
                key={t.id}
                role="menuitemradio"
                aria-checked={active}
                onClick={() => { setTheme(t.id); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors"
                style={{ background: active ? "var(--bg-active)" : "transparent" }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--bg-hover)"; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                <Swatch colors={t.swatch} />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{t.name}</span>
                  <span className="block text-[11px] truncate" style={{ color: "var(--text-secondary)" }}>{t.desc}</span>
                </span>
                {active && <Check size={15} style={{ color: "var(--accent)" }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Larger card grid for the Settings page.
export function ThemeGrid() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {THEMES.map((t) => {
        const active = t.id === theme;
        const [bg, ink, accent] = t.swatch;
        return (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            aria-pressed={active}
            className="text-left rounded-xl border-2 overflow-hidden transition-colors"
            style={{ borderColor: active ? "var(--accent)" : "var(--border)", background: "var(--bg-card)" }}
          >
            {/* Mini preview of a page in this theme */}
            <div style={{ background: bg, padding: "14px 14px 12px" }}>
              <div style={{ height: 8, width: "55%", borderRadius: 4, background: ink, opacity: 0.85 }} />
              <div style={{ height: 6, width: "85%", borderRadius: 3, background: ink, opacity: 0.35, marginTop: 8 }} />
              <div style={{ height: 6, width: "70%", borderRadius: 3, background: ink, opacity: 0.35, marginTop: 5 }} />
              <div style={{ height: 14, width: 52, borderRadius: 4, background: accent, marginTop: 10 }} />
            </div>
            <div className="flex items-center gap-2 px-3 py-2.5">
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {t.name}{t.dark ? " · dark" : ""}
                </span>
                <span className="block text-xs" style={{ color: "var(--text-secondary)" }}>{t.desc}</span>
              </span>
              {active && <Check size={16} style={{ color: "var(--accent)" }} />}
            </div>
          </button>
        );
      })}
    </div>
  );
}
