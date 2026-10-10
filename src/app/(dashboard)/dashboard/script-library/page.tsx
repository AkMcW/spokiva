"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PRACTICE_SCRIPTS, PracticeScript } from "@/data/practiceScripts";
import ViewToggle, { useViewMode } from "@/components/ViewToggle";
import { Search, Mic, Star, Filter, ChevronDown } from "lucide-react";

const CATEGORIES = [
  "All",
  "motivation",
  "business",
  "interview",
  "ielts",
  "sales",
  "leadership",
  "tech",
  "story",
  "public",
];

const CATEGORY_LABELS: Record<string, string> = {
  All: "All",
  motivation: "Motivation",
  business: "Business",
  interview: "Interview",
  ielts: "IELTS",
  sales: "Sales",
  leadership: "Leadership",
  tech: "Tech",
  story: "Storytelling",
  public: "Public Speaking",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "var(--accent-green, #10b981)",
  intermediate: "var(--accent, #6366f1)",
  advanced: "var(--accent-red, #ef4444)",
};

export default function ScriptLibraryPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [difficulty, setDifficulty] = useState("All");
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const saved = localStorage.getItem("sf_fav_scripts");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });
  const [showFavs, setShowFavs] = useState(false);
  const [view, setView] = useViewMode("sf_view_script_library");
  const [selected, setSelected] = useState<PracticeScript | null>(null);

  const filtered = useMemo(() => {
    let list = PRACTICE_SCRIPTS;
    if (showFavs) list = list.filter(s => favorites.has(s.id));
    if (category !== "All") list = list.filter(s => s.category === category);
    if (difficulty !== "All") list = list.filter(s => s.difficulty === difficulty);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [search, category, difficulty, showFavs, favorites]);

  function toggleFav(id: string) {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      try { localStorage.setItem("sf_fav_scripts", JSON.stringify([...next])); } catch {}
      return next;
    });
  }

  function practiceScript(script: PracticeScript) {
    sessionStorage.setItem("sf_practice_script", script.content);
    sessionStorage.setItem("sf_practice_scenario", script.title);
    router.push("/dashboard/practice");
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
          Script Library
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
          {PRACTICE_SCRIPTS.length} ready-to-use practice scripts — pick one and start speaking.
        </p>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.5rem", alignItems: "center" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 220px", minWidth: 180 }}>
          <Search size={15} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search scripts..."
            style={{
              width: "100%", padding: "0.55rem 0.75rem 0.55rem 2rem",
              background: "var(--card-bg)", border: "1px solid var(--border)",
              borderRadius: 8, color: "var(--text-primary)", fontSize: "0.875rem",
            }}
          />
        </div>

        {/* Category */}
        <div style={{ position: "relative" }}>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            style={{
              padding: "0.55rem 2rem 0.55rem 0.75rem", background: "var(--card-bg)",
              border: "1px solid var(--border)", borderRadius: 8,
              color: "var(--text-primary)", fontSize: "0.875rem", appearance: "none",
            }}
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{CATEGORY_LABELS[c] || c}</option>
            ))}
          </select>
          <ChevronDown size={13} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-secondary)" }} />
        </div>

        {/* Difficulty */}
        <div style={{ position: "relative" }}>
          <select
            value={difficulty}
            onChange={e => setDifficulty(e.target.value)}
            style={{
              padding: "0.55rem 2rem 0.55rem 0.75rem", background: "var(--card-bg)",
              border: "1px solid var(--border)", borderRadius: 8,
              color: "var(--text-primary)", fontSize: "0.875rem", appearance: "none",
            }}
          >
            <option value="All">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <ChevronDown size={13} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-secondary)" }} />
        </div>

        {/* Favorites toggle */}
        <button
          onClick={() => setShowFavs(f => !f)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "0.55rem 0.9rem", borderRadius: 8,
            background: showFavs ? "var(--accent)" : "var(--card-bg)",
            border: `1px solid ${showFavs ? "var(--accent)" : "var(--border)"}`,
            color: showFavs ? "#fff" : "var(--text-primary)",
            fontSize: "0.875rem", cursor: "pointer",
          }}
        >
          <Star size={14} fill={showFavs ? "#fff" : "none"} />
          Favorites
        </button>

        <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginLeft: "auto" }}>
          {filtered.length} script{filtered.length !== 1 ? "s" : ""}
        </span>
        <ViewToggle mode={view} onChange={setView} />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--text-secondary)" }}>
          <Filter size={40} style={{ opacity: 0.3, marginBottom: "1rem" }} />
          <p>No scripts match your filters.</p>
          <button onClick={() => { setSearch(""); setCategory("All"); setDifficulty("All"); setShowFavs(false); }}
            style={{ marginTop: "0.75rem", color: "var(--accent)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
            Clear filters
          </button>
        </div>
      ) : view === "list" ? (
        <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
          {filtered.map((script, i) => (
            <div
              key={script.id}
              onClick={() => setSelected(script)}
              style={{
                display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", cursor: "pointer",
                borderTop: i === 0 ? "none" : "1px solid var(--border)",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-hover)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
            >
              <button
                onClick={e => { e.stopPropagation(); toggleFav(script.id); }}
                title={favorites.has(script.id) ? "Remove from favorites" : "Add to favorites"}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 2, flexShrink: 0, color: favorites.has(script.id) ? "#f59e0b" : "var(--text-secondary)" }}
              >
                <Star size={15} fill={favorites.has(script.id) ? "#f59e0b" : "none"} />
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{script.title}</p>
                <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{script.description}</p>
              </div>
              <span className="hidden sm:inline" style={{ fontSize: "0.7rem", padding: "2px 8px", borderRadius: 99, flexShrink: 0, background: "var(--bg)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                {CATEGORY_LABELS[script.category] || script.category}
              </span>
              <span style={{ fontSize: "0.7rem", padding: "2px 8px", borderRadius: 99, flexShrink: 0, background: `${DIFFICULTY_COLORS[script.difficulty]}20`, color: DIFFICULTY_COLORS[script.difficulty], fontWeight: 600, textTransform: "capitalize" }}>
                {script.difficulty}
              </span>
              <button
                onClick={e => { e.stopPropagation(); practiceScript(script); }}
                title="Practice this script"
                style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0, padding: "0.4rem 0.7rem", borderRadius: 7, background: "var(--accent)", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}
              >
                <Mic size={13} /> <span className="hidden sm:inline">Practice</span>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
          {filtered.map(script => (
            <div
              key={script.id}
              onClick={() => setSelected(script)}
              style={{
                background: "var(--card-bg)", border: "1px solid var(--border)",
                borderRadius: 12, padding: "1.25rem",
                cursor: "pointer", transition: "border-color 0.15s, box-shadow 0.15s",
                display: "flex", flexDirection: "column", gap: "0.6rem",
                position: "relative",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(99,102,241,0.1)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
            >
              {/* Favorite button */}
              <button
                onClick={e => { e.stopPropagation(); toggleFav(script.id); }}
                style={{
                  position: "absolute", top: 12, right: 12, background: "none",
                  border: "none", cursor: "pointer", color: favorites.has(script.id) ? "#f59e0b" : "var(--text-secondary)",
                  padding: 4,
                }}
                title={favorites.has(script.id) ? "Remove from favorites" : "Add to favorites"}
              >
                <Star size={16} fill={favorites.has(script.id) ? "#f59e0b" : "none"} />
              </button>

              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", paddingRight: 28 }}>
                <div>
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3 }}>
                    {script.title}
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 4, lineHeight: 1.4 }}>
                    {script.description}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "auto" }}>
                <span style={{
                  fontSize: "0.7rem", padding: "2px 8px", borderRadius: 99,
                  background: `${DIFFICULTY_COLORS[script.difficulty]}20`,
                  color: DIFFICULTY_COLORS[script.difficulty], fontWeight: 600, textTransform: "capitalize",
                }}>
                  {script.difficulty}
                </span>
                <span style={{
                  fontSize: "0.7rem", padding: "2px 8px", borderRadius: 99,
                  background: "var(--bg)", color: "var(--text-secondary)",
                  border: "1px solid var(--border)", textTransform: "capitalize",
                }}>
                  {CATEGORY_LABELS[script.category] || script.category}
                </span>
                {script.tags.slice(0, 2).map(tag => (
                  <span key={tag} style={{
                    fontSize: "0.7rem", padding: "2px 8px", borderRadius: 99,
                    background: "var(--bg)", color: "var(--text-secondary)",
                    border: "1px solid var(--border)",
                  }}>
                    #{tag}
                  </span>
                ))}
              </div>

              <button
                onClick={e => { e.stopPropagation(); practiceScript(script); }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  width: "100%", padding: "0.55rem", borderRadius: 8,
                  background: "var(--accent)", color: "#fff", border: "none",
                  cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, marginTop: 4,
                }}
              >
                <Mic size={14} /> Practice This Script
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Preview modal */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
            zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "var(--card-bg)", border: "1px solid var(--border)",
              borderRadius: 16, padding: "2rem", maxWidth: 680, width: "100%",
              maxHeight: "85vh", overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <div>
                <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)" }}>{selected.title}</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: 4 }}>{selected.description}</p>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", fontSize: "1.5rem", lineHeight: 1 }}>×</button>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
              <span style={{ fontSize: "0.75rem", padding: "3px 10px", borderRadius: 99, background: `${DIFFICULTY_COLORS[selected.difficulty]}20`, color: DIFFICULTY_COLORS[selected.difficulty], fontWeight: 600, textTransform: "capitalize" }}>
                {selected.difficulty}
              </span>
              <span style={{ fontSize: "0.75rem", padding: "3px 10px", borderRadius: 99, background: "var(--bg)", color: "var(--text-secondary)", border: "1px solid var(--border)", textTransform: "capitalize" }}>
                {CATEGORY_LABELS[selected.category] || selected.category}
              </span>
            </div>

            <div style={{
              background: "var(--bg)", borderRadius: 10, padding: "1.25rem",
              fontSize: "0.9rem", lineHeight: 1.8, color: "var(--text-primary)",
              whiteSpace: "pre-wrap", fontFamily: "inherit", marginBottom: "1.5rem",
              maxHeight: "50vh", overflowY: "auto",
            }}>
              {selected.content}
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={() => practiceScript(selected)}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "0.75rem", borderRadius: 10, background: "var(--accent)",
                  color: "#fff", border: "none", cursor: "pointer", fontSize: "0.95rem", fontWeight: 600,
                }}
              >
                <Mic size={16} /> Practice This Script
              </button>
              <button
                onClick={() => toggleFav(selected.id)}
                style={{
                  padding: "0.75rem 1rem", borderRadius: 10,
                  background: favorites.has(selected.id) ? "#f59e0b20" : "var(--bg)",
                  border: `1px solid ${favorites.has(selected.id) ? "#f59e0b" : "var(--border)"}`,
                  color: favorites.has(selected.id) ? "#f59e0b" : "var(--text-secondary)",
                  cursor: "pointer", fontSize: "0.9rem",
                }}
              >
                <Star size={16} fill={favorites.has(selected.id) ? "#f59e0b" : "none"} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
