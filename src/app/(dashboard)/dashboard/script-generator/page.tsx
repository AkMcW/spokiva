"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { SCRIPT_MENU_OPTIONS, ScriptMenuOption } from "@/data/scriptMenuOptions";
import ViewToggle, { useViewMode } from "@/components/ViewToggle";
import {
  Search, Star, Loader2, Copy, Mic, Download, Save,
  Link, FileText, AlertCircle, CheckCircle, Lightbulb,
  MessageSquare, Sparkles, ArrowLeft, ChevronDown,
} from "lucide-react";

type Stage = "menu" | "input" | "generating" | "result";

const SOURCE_FILTERS = ["All", "youtube", "website", "article", "pdf", "podcast", "product", "transcript", "notes", "multi"] as const;
const OUTPUT_FILTERS = ["All", "short-video", "long-video", "sales", "education", "linkedin", "webinar", "internal", "review"] as const;

const SOURCE_FILTER_LABELS: Record<string, string> = {
  All: "All Sources", youtube: "YouTube", website: "Website", article: "Article",
  pdf: "PDF / Doc", podcast: "Podcast", product: "Product", transcript: "Transcript",
  notes: "Notes", multi: "Multiple",
};

const OUTPUT_FILTER_LABELS: Record<string, string> = {
  All: "All Outputs", "short-video": "Short Video", "long-video": "Long Video",
  sales: "Sales", education: "Education", linkedin: "LinkedIn",
  webinar: "Webinar", internal: "Internal", review: "Review",
};

const INPUT_TYPE_COLORS: Record<string, string> = {
  youtube: "#ff0000", url: "#3b82f6", text: "#8b5cf6", "multi-url": "#f59e0b",
};

const DURATION_OPTIONS = [
  { value: "30s", label: "30 sec" }, { value: "1min", label: "1 min" },
  { value: "2min", label: "2 min" }, { value: "3min", label: "3 min" },
  { value: "5min", label: "5 min" }, { value: "10min", label: "10 min" },
];

const TONE_OPTIONS = ["conversational", "professional", "energetic", "formal", "humorous", "inspirational", "empathetic", "punchy"];
const AUDIENCE_OPTIONS = ["general audience", "professionals", "executives", "students", "beginners", "experts", "investors", "consumers"];

export default function ScriptGeneratorPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("menu");
  const [selected, setSelected] = useState<ScriptMenuOption | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [outputFilter, setOutputFilter] = useState("All");
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try { const s = localStorage.getItem("sf_fav_generators"); return s ? new Set(JSON.parse(s)) : new Set(); }
    catch { return new Set(); }
  });
  const [showFavs, setShowFavs] = useState(false);
  const [view, setView] = useViewMode("sf_view_script_generator");

  // Input state
  const [inputUrl, setInputUrl] = useState("");
  const [inputText, setInputText] = useState("");
  const [extractedContent, setExtractedContent] = useState("");
  const [extractedTitle, setExtractedTitle] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState("");
  const [duration, setDuration] = useState("2min");
  const [tone, setTone] = useState("conversational");
  const [audience, setAudience] = useState("general audience");

  // Result state
  const [script, setScript] = useState("");
  const [genError, setGenError] = useState("");
  const [copied, setCopied] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const filtered = useMemo(() => {
    let list = SCRIPT_MENU_OPTIONS;
    if (showFavs) list = list.filter(o => favorites.has(o.id));
    if (sourceFilter !== "All") list = list.filter(o => o.sourceFilter === sourceFilter);
    if (outputFilter !== "All") list = list.filter(o => o.outputFilter === outputFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        o.title.toLowerCase().includes(q) ||
        o.description.toLowerCase().includes(q) ||
        o.bestFor.some(b => b.toLowerCase().includes(q))
      );
    }
    return list;
  }, [search, sourceFilter, outputFilter, showFavs, favorites]);

  function toggleFav(id: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      try { localStorage.setItem("sf_fav_generators", JSON.stringify([...next])); } catch {}
      return next;
    });
  }

  function selectOption(opt: ScriptMenuOption) {
    setSelected(opt);
    setInputUrl("");
    setInputText("");
    setExtractedContent("");
    setExtractedTitle("");
    setExtractError("");
    setScript("");
    setGenError("");
    setTone(opt.defaultTone || "conversational");
    setStage("input");
  }

  async function handleExtract() {
    const url = inputUrl.trim();
    if (!url) return;
    setExtracting(true);
    setExtractError("");
    setExtractedContent("");
    try {
      const res = await fetch("/api/scripts/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Extraction failed");
      setExtractedContent(data.content || "");
      setExtractedTitle(data.title || "");
    } catch (err: unknown) {
      setExtractError(err instanceof Error ? err.message : "Failed to extract content");
    } finally {
      setExtracting(false);
    }
  }

  async function handleGenerate() {
    if (!selected) return;
    const isUrlBased = selected.inputType === "url" || selected.inputType === "youtube";
    const sourceContent = isUrlBased ? extractedContent : inputText;

    if (!sourceContent.trim()) {
      setGenError("Please provide content to generate from.");
      return;
    }

    setGenError("");
    setStage("generating");

    try {
      const res = await fetch("/api/scripts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceContent,
          promptTemplate: selected.promptTemplate,
          tone,
          duration,
          audience,
          platform: selected.defaultPlatform || "general",
          scriptStructure: selected.scriptStructure || [],
          outputMode: "standard",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setScript(data.script || "");
      setSaveState("idle");
      setStage("result");
    } catch (err: unknown) {
      setGenError(err instanceof Error ? err.message : "Generation failed");
      setStage("input");
    }
  }

  function copyScript() {
    navigator.clipboard.writeText(script).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function saveScript() {
    if (!script || saveState === "saving" || saveState === "saved") return;
    setSaveState("saving");
    try {
      const res = await fetch("/api/scripts/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: selected?.title || "Generated Script",
          scenario: selected?.title || "Script Generator",
          content: script,
          wordCount: script.trim().split(/\s+/).length,
          duration,
        }),
      });
      if (!res.ok) throw new Error("save failed");
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }

  function practiceScript() {
    sessionStorage.setItem("sf_practice_script", script);
    sessionStorage.setItem("sf_practice_scenario", selected?.title || "Script Generator");
    router.push("/dashboard/practice");
  }

  function downloadScript() {
    const blob = new Blob([script], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${(selected?.title || "script").replace(/[^a-z0-9]/gi, "_")}.txt`;
    a.click();
  }

  // ── Menu ──────────────────────────────────────────────────────────────────
  if (stage === "menu") {
    return (
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1rem" }}>
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
            Script Generator
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            Turn any content — YouTube videos, articles, ideas — into polished speaking scripts.
          </p>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.5rem", alignItems: "center" }}>
          <div style={{ position: "relative", flex: "1 1 200px", minWidth: 160 }}>
            <Search size={15} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search generators..."
              style={{ width: "100%", padding: "0.55rem 0.75rem 0.55rem 2rem", background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: "0.875rem" }} />
          </div>

          {[
            { value: sourceFilter, onChange: setSourceFilter, options: SOURCE_FILTERS, labels: SOURCE_FILTER_LABELS },
            { value: outputFilter, onChange: setOutputFilter, options: OUTPUT_FILTERS, labels: OUTPUT_FILTER_LABELS },
          ].map((sel, i) => (
            <div key={i} style={{ position: "relative" }}>
              <select value={sel.value} onChange={e => sel.onChange(e.target.value)}
                style={{ padding: "0.55rem 2rem 0.55rem 0.75rem", background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: "0.875rem", appearance: "none" }}>
                {sel.options.map(o => <option key={o} value={o}>{sel.labels[o]}</option>)}
              </select>
              <ChevronDown size={13} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-secondary)" }} />
            </div>
          ))}

          <button onClick={() => setShowFavs(f => !f)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "0.55rem 0.9rem", borderRadius: 8, background: showFavs ? "var(--accent)" : "var(--card-bg)", border: `1px solid ${showFavs ? "var(--accent)" : "var(--border)"}`, color: showFavs ? "#fff" : "var(--text-primary)", fontSize: "0.875rem", cursor: "pointer" }}>
            <Star size={14} fill={showFavs ? "#fff" : "none"} /> Favorites
          </button>
          <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginLeft: "auto" }}>{filtered.length} option{filtered.length !== 1 ? "s" : ""}</span>
          <ViewToggle mode={view} onChange={setView} />
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--text-secondary)" }}>
            <p>No options match your filters.</p>
            <button onClick={() => { setSearch(""); setSourceFilter("All"); setOutputFilter("All"); setShowFavs(false); }}
              style={{ marginTop: "0.75rem", color: "var(--accent)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Clear filters</button>
          </div>
        ) : view === "list" ? (
          <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
            {filtered.map((opt, i) => {
              const typeColor = INPUT_TYPE_COLORS[opt.inputType] || "#6366f1";
              return (
                <div key={opt.id} onClick={() => selectOption(opt)}
                  style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", cursor: "pointer", borderTop: i === 0 ? "none" : "1px solid var(--border)" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-hover)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                >
                  <button onClick={e => toggleFav(opt.id, e)} title={favorites.has(opt.id) ? "Remove from favorites" : "Add to favorites"}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 2, flexShrink: 0, color: favorites.has(opt.id) ? "#f59e0b" : "var(--text-secondary)" }}>
                    <Star size={15} fill={favorites.has(opt.id) ? "#f59e0b" : "none"} />
                  </button>
                  <span style={{ fontSize: "1.25rem", flexShrink: 0 }}>{opt.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{opt.title}</p>
                    <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{opt.description}</p>
                  </div>
                  <span style={{ fontSize: "0.7rem", padding: "2px 8px", borderRadius: 99, flexShrink: 0, background: `${typeColor}20`, color: typeColor, fontWeight: 600 }}>
                    {SOURCE_FILTER_LABELS[opt.sourceFilter] || opt.inputType}
                  </span>
                  <span className="hidden sm:inline" style={{ fontSize: "0.7rem", padding: "2px 8px", borderRadius: 99, flexShrink: 0, background: "var(--bg)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                    {OUTPUT_FILTER_LABELS[opt.outputFilter] || opt.outputFilter}
                  </span>
                  <span className="hidden md:inline" style={{ fontSize: "0.7rem", padding: "2px 8px", borderRadius: 99, flexShrink: 0, background: "var(--bg)", color: "var(--text-secondary)", border: "1px solid var(--border)", textTransform: "capitalize" }}>
                    {opt.difficulty}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: "1rem" }}>
            {filtered.map(opt => {
              const typeColor = INPUT_TYPE_COLORS[opt.inputType] || "#6366f1";
              return (
                <div key={opt.id} onClick={() => selectOption(opt)}
                  style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.25rem", cursor: "pointer", transition: "border-color 0.15s, box-shadow 0.15s", display: "flex", flexDirection: "column", gap: "0.5rem", position: "relative" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(99,102,241,0.1)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
                >
                  <button onClick={e => toggleFav(opt.id, e)}
                    style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", cursor: "pointer", color: favorites.has(opt.id) ? "#f59e0b" : "var(--text-secondary)", padding: 4 }}>
                    <Star size={15} fill={favorites.has(opt.id) ? "#f59e0b" : "none"} />
                  </button>

                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", paddingRight: 24 }}>
                    <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>{opt.emoji}</span>
                    <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3 }}>{opt.title}</h3>
                  </div>

                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>{opt.description}</p>

                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "auto" }}>
                    <span style={{ fontSize: "0.7rem", padding: "2px 8px", borderRadius: 99, background: `${typeColor}20`, color: typeColor, fontWeight: 600 }}>
                      {SOURCE_FILTER_LABELS[opt.sourceFilter] || opt.inputType}
                    </span>
                    <span style={{ fontSize: "0.7rem", padding: "2px 8px", borderRadius: 99, background: "var(--bg)", color: "var(--text-secondary)", border: "1px solid var(--border)", textTransform: "capitalize" }}>
                      {opt.difficulty}
                    </span>
                    <span style={{ fontSize: "0.7rem", padding: "2px 8px", borderRadius: 99, background: "var(--bg)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                      {OUTPUT_FILTER_LABELS[opt.outputFilter] || opt.outputFilter}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── Input ──────────────────────────────────────────────────────────────────
  if (stage === "input" && selected) {
    const isUrlBased = selected.inputType === "url" || selected.inputType === "youtube";
    const typeColor = INPUT_TYPE_COLORS[selected.inputType] || "#6366f1";
    const hasContent = isUrlBased ? !!extractedContent : !!inputText.trim();

    return (
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1rem" }}>
        <button onClick={() => setStage("menu")}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "0.85rem", marginBottom: "1.5rem", padding: 0 }}>
          <ArrowLeft size={15} /> Back to menu
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <span style={{ fontSize: "2rem" }}>{selected.emoji}</span>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)" }}>{selected.title}</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{selected.description}</p>
          </div>
        </div>

        {/* Best For */}
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
          {selected.bestFor.map(b => (
            <span key={b} style={{ fontSize: "0.75rem", padding: "3px 10px", borderRadius: 99, background: `${typeColor}15`, color: typeColor, border: `1px solid ${typeColor}30` }}>{b}</span>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Source Input */}
          <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.25rem" }}>
            <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: 6 }}>
              {isUrlBased ? <Link size={14} style={{ color: typeColor }} /> : <FileText size={14} style={{ color: typeColor }} />}
              {isUrlBased ? `Enter ${selected.inputSource}` : "Paste Your Content"}
            </h3>

            {isUrlBased && (
              <>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input value={inputUrl} onChange={e => setInputUrl(e.target.value)}
                    placeholder={selected.placeholderInput}
                    onKeyDown={e => { if (e.key === "Enter") handleExtract(); }}
                    style={{ flex: 1, padding: "0.6rem 0.75rem", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: "0.875rem" }} />
                  <button onClick={handleExtract} disabled={extracting || !inputUrl.trim()}
                    style={{ padding: "0.6rem 1rem", borderRadius: 8, background: "var(--accent)", color: "#fff", border: "none", cursor: extracting || !inputUrl.trim() ? "not-allowed" : "pointer", opacity: extracting || !inputUrl.trim() ? 0.6 : 1, fontSize: "0.875rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                    {extracting ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Extracting...</> : "Extract"}
                  </button>
                </div>
                {extractError && (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "0.75rem", background: "#ef444420", borderRadius: 8, color: "#ef4444", fontSize: "0.85rem", marginTop: "0.5rem" }}>
                    <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> {extractError}
                  </div>
                )}
                {extractedContent && (
                  <div style={{ marginTop: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: "0.5rem" }}>
                      <CheckCircle size={13} style={{ color: "#10b981" }} />
                      <span style={{ fontSize: "0.8rem", color: "#10b981", fontWeight: 600 }}>
                        Extracted{extractedTitle ? ` — ${extractedTitle}` : ""}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginLeft: "auto" }}>~{extractedContent.split(/\s+/).length} words</span>
                    </div>
                    <textarea value={extractedContent} onChange={e => setExtractedContent(e.target.value)} rows={5}
                      style={{ width: "100%", padding: "0.75rem", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: "0.8rem", lineHeight: 1.5, resize: "vertical", fontFamily: "inherit" }} />
                  </div>
                )}
              </>
            )}

            {!isUrlBased && (
              <textarea value={inputText} onChange={e => setInputText(e.target.value)} rows={8}
                placeholder={selected.placeholderInput}
                style={{ width: "100%", padding: "0.75rem", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: "0.875rem", lineHeight: 1.6, resize: "vertical", fontFamily: "inherit" }} />
            )}
          </div>

          {/* Script Structure preview */}
          {selected.scriptStructure.length > 0 && (
            <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.25rem" }}>
              <h3 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Script Structure</h3>
              <ol style={{ margin: 0, padding: "0 0 0 1.25rem", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                {selected.scriptStructure.map((step, i) => (
                  <li key={i} style={{ fontSize: "0.82rem", color: "var(--text-primary)", lineHeight: 1.5 }}>{step}</li>
                ))}
              </ol>
            </div>
          )}

          {/* Settings */}
          <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.25rem" }}>
            <h3 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Script Settings</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
              {[
                { label: "Duration", value: duration, onChange: setDuration, options: DURATION_OPTIONS.map(d => ({ value: d.value, label: d.label })) },
                { label: "Tone", value: tone, onChange: setTone, options: TONE_OPTIONS.map(t => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) })) },
                { label: "Audience", value: audience, onChange: setAudience, options: AUDIENCE_OPTIONS.map(a => ({ value: a, label: a.charAt(0).toUpperCase() + a.slice(1) })) },
              ].map(sel => (
                <div key={sel.label}>
                  <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>{sel.label}</label>
                  <div style={{ position: "relative" }}>
                    <select value={sel.value} onChange={e => sel.onChange(e.target.value)}
                      style={{ width: "100%", padding: "0.5rem 2rem 0.5rem 0.65rem", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: "0.85rem", appearance: "none" }}>
                      {sel.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <ChevronDown size={12} style={{ position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-secondary)" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {genError && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "0.75rem", background: "#ef444420", borderRadius: 8, color: "#ef4444", fontSize: "0.85rem" }}>
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> {genError}
            </div>
          )}

          <button onClick={handleGenerate} disabled={!hasContent}
            style={{ width: "100%", padding: "0.875rem", borderRadius: 10, background: hasContent ? "var(--accent)" : "var(--border)", color: hasContent ? "#fff" : "var(--text-secondary)", border: "none", cursor: hasContent ? "pointer" : "not-allowed", fontSize: "1rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Sparkles size={18} /> Generate Script
          </button>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Generating ─────────────────────────────────────────────────────────────
  if (stage === "generating") {
    return (
      <div style={{ maxWidth: 600, margin: "6rem auto", textAlign: "center", padding: "2rem 1rem" }}>
        <Loader2 size={48} style={{ color: "var(--accent)", animation: "spin 1s linear infinite", margin: "0 auto 1rem" }} />
        <h2 style={{ fontSize: "1.3rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.5rem" }}>Generating your script...</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          AI is crafting your {selected?.title?.toLowerCase()} with speaking notation.
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Result ─────────────────────────────────────────────────────────────────
  if (stage === "result" && script && selected) {
    return (
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1rem" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <button onClick={() => setStage("input")}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "0.85rem", padding: 0, marginBottom: "0.4rem" }}>
              <ArrowLeft size={15} /> Edit settings
            </button>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-primary)" }}>{selected.title}</h2>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={copyScript} style={{ display: "flex", alignItems: "center", gap: 6, padding: "0.6rem 0.9rem", borderRadius: 8, background: "var(--card-bg)", border: "1px solid var(--border)", color: "var(--text-primary)", cursor: "pointer", fontSize: "0.85rem" }}>
              {copied ? <CheckCircle size={14} style={{ color: "#10b981" }} /> : <Copy size={14} />}
              {copied ? "Copied!" : "Copy"}
            </button>
            <button onClick={saveScript} disabled={saveState === "saving" || saveState === "saved"}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "0.6rem 0.9rem", borderRadius: 8,
                background: saveState === "saved" ? "#10b98115" : "var(--card-bg)",
                border: `1px solid ${saveState === "saved" ? "#10b981" : "var(--border)"}`,
                color: saveState === "saved" ? "#10b981" : "var(--text-primary)",
                cursor: saveState === "saving" || saveState === "saved" ? "default" : "pointer", fontSize: "0.85rem" }}>
              {saveState === "saving" ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                : saveState === "saved" ? <CheckCircle size={14} style={{ color: "#10b981" }} />
                : <Save size={14} />}
              {saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved" : saveState === "error" ? "Retry Save" : "Save"}
            </button>
            <button onClick={downloadScript} style={{ display: "flex", alignItems: "center", gap: 6, padding: "0.6rem 0.9rem", borderRadius: 8, background: "var(--card-bg)", border: "1px solid var(--border)", color: "var(--text-primary)", cursor: "pointer", fontSize: "0.85rem" }}>
              <Download size={14} /> Download
            </button>
            <button onClick={practiceScript} style={{ display: "flex", alignItems: "center", gap: 6, padding: "0.6rem 1rem", borderRadius: 8, background: "var(--accent)", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}>
              <Mic size={14} /> Practice
            </button>
          </div>
        </div>

        {/* Script */}
        <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.5rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: "1rem" }}>
            <MessageSquare size={14} style={{ color: "var(--accent)" }} />
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Generated Script</span>
          </div>
          <div style={{ fontSize: "0.95rem", lineHeight: 1.9, color: "var(--text-primary)", whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
            {script}
          </div>
        </div>

        {/* Delivery hints from structure */}
        {selected.scriptStructure.length > 0 && (
          <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.25rem", marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: "0.75rem" }}>
              <Lightbulb size={14} style={{ color: "#f59e0b" }} />
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Intended Structure</span>
            </div>
            <ol style={{ margin: 0, padding: "0 0 0 1.25rem", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              {selected.scriptStructure.map((step, i) => (
                <li key={i} style={{ fontSize: "0.82rem", color: "var(--text-primary)", lineHeight: 1.5 }}>{step}</li>
              ))}
            </ol>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <button onClick={() => { setStage("menu"); setScript(""); }}
            style={{ padding: "0.75rem 1.5rem", borderRadius: 10, background: "var(--card-bg)", border: "1px solid var(--border)", color: "var(--text-primary)", cursor: "pointer", fontSize: "0.9rem", fontWeight: 600 }}>
            Generate Another Script
          </button>
        </div>
      </div>
    );
  }

  return null;
}
