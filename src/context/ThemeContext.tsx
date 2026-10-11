"use client";
import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "paper" | "sepia" | "sage" | "slate" | "ember";

export const THEMES: { id: Theme; name: string; desc: string; dark: boolean; swatch: [string, string, string] }[] = [
  { id: "paper", name: "Paper", desc: "Warm off-white, the default", dark: false, swatch: ["#F7F5F0", "#2A2824", "#2F66A8"] },
  { id: "sepia", name: "Sepia", desc: "Book-page tones for long reading", dark: false, swatch: ["#F3EAD7", "#3E3326", "#8A5A2B"] },
  { id: "sage", name: "Sage", desc: "Calm green, easy on the eyes", dark: false, swatch: ["#EEF2EB", "#263028", "#3D6E54"] },
  { id: "slate", name: "Slate", desc: "Soft cool dark, low glare", dark: true, swatch: ["#232833", "#D9DEE7", "#6690C8"] },
  { id: "ember", name: "Ember", desc: "Warm dark, less blue light at night", dark: true, swatch: ["#221E1A", "#E5DDD0", "#C08350"] },
];

export const THEME_STORAGE_KEY = "spokiva_theme";
const DEFAULT: Theme = "paper";

// Older builds stored "light"/"dark"; map them onto the new palettes.
function normalize(v: string | null): Theme {
  if (v === "dark") return "slate";
  if (THEMES.some((t) => t.id === v)) return v as Theme;
  return DEFAULT;
}

// Inline script for <head>: applies the saved theme before first paint so
// pages never flash the default palette.
export const THEME_PREPAINT = `(function(){try{var v=localStorage.getItem('${THEME_STORAGE_KEY}');var ok=['paper','sepia','sage','slate','ember'];if(v==='dark')v='slate';if(ok.indexOf(v)<0)v='${DEFAULT}';document.documentElement.setAttribute('data-theme',v)}catch(e){document.documentElement.setAttribute('data-theme','${DEFAULT}')}})();`;

type Ctx = { theme: Theme; setTheme: (t: Theme) => void; toggle: () => void };
const ThemeContext = createContext<Ctx>({ theme: DEFAULT, setTheme: () => {}, toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(DEFAULT);

  useEffect(() => {
    let stored: string | null = null;
    try { stored = localStorage.getItem(THEME_STORAGE_KEY); } catch { /* storage blocked */ }
    const initial = normalize(stored);
    setThemeState(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  function setTheme(next: Theme) {
    setThemeState(next);
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem(THEME_STORAGE_KEY, next); } catch { /* ignore */ }
  }

  // Cycle through the five themes (kept for anything that still calls toggle).
  function toggle() {
    const i = THEMES.findIndex((t) => t.id === theme);
    setTheme(THEMES[(i + 1) % THEMES.length].id);
  }

  return <ThemeContext.Provider value={{ theme, setTheme, toggle }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
