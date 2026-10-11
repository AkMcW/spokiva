"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FilePlus2, Save, Loader2, CheckCircle, Sparkles, Mic, AlertCircle,
  Wand2, ArrowRight,
} from "lucide-react";

export default function AddScriptPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [scenario, setScenario] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Review / enhance
  const [addNotation, setAddNotation] = useState(true);
  const [addIPA, setAddIPA] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [enhanced, setEnhanced] = useState("");
  const [changes, setChanges] = useState<string[]>([]);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  async function save(text: string) {
    if (!text.trim()) { setError("Please paste or write a script first."); return; }
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/scripts/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || scenario.trim() || "My Script",
          scenario: scenario.trim() || "Custom",
          content: text,
          wordCount: text.trim().split(/\s+/).length,
          duration: "",
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Save failed");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save script");
    } finally {
      setSaving(false);
    }
  }

  async function review() {
    if (!content.trim()) { setError("Please paste or write a script first."); return; }
    if (!addNotation && !addIPA) { setError("Choose at least one option to review with."); return; }
    setReviewing(true);
    setError("");
    setEnhanced("");
    setChanges([]);
    try {
      const res = await fetch("/api/scripts/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: content, addNotation, addIPA }),
      });
      const data = await res.json();
      if (!res.ok || !data.enhanced) throw new Error(data.error ?? "Review failed");
      setEnhanced(data.enhanced);
      setChanges(Array.isArray(data.changes) ? data.changes : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to review the script");
    } finally {
      setReviewing(false);
    }
  }

  function useEnhanced() {
    setContent(enhanced);
    setEnhanced("");
    setChanges([]);
  }

  function practice(text: string) {
    if (!text.trim()) return;
    sessionStorage.setItem("sf_practice_script", text);
    sessionStorage.setItem("sf_practice_scenario", title.trim() || scenario.trim() || "My Script");
    router.push("/dashboard/practice");
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
          <FilePlus2 size={24} style={{ color: "var(--accent)" }} /> Add Your Own Script
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Paste a script from anywhere and save it to your library. Optionally, let AI review it — correcting the writing and adding speaking notation and pronunciation (IPA) hints.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg text-sm" style={{ background: "var(--danger-bg)", border: "1px solid #FFCDD2", color: "#E53935" }}>
          <AlertCircle size={15} className="shrink-0" /> {error}
        </div>
      )}

      {/* Meta */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. My Conference Opening"
            className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>Scenario / category <span className="font-normal">(optional)</span></label>
          <input value={scenario} onChange={(e) => setScenario(e.target.value)} placeholder="e.g. Presentation"
            className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
        </div>
      </div>

      {/* Raw script */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Your script</label>
          <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{wordCount} words</span>
        </div>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={12}
          placeholder="Paste your raw script here — from a doc, an email, notes, anywhere…"
          className="w-full px-3 py-3 rounded-lg text-sm leading-relaxed" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)", resize: "vertical" }} />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => save(content)} disabled={saving || !content.trim()}
          className="flex items-center gap-2 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors disabled:opacity-60"
          style={{ background: saved ? "#00B37D" : "var(--accent)" }}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <CheckCircle size={16} /> : <Save size={16} />}
          {saved ? "Saved to library" : "Save to Saved Scripts"}
        </button>
        <button onClick={() => practice(content)} disabled={!content.trim()}
          className="flex items-center gap-2 font-semibold px-4 py-2.5 rounded-lg border transition-colors disabled:opacity-60"
          style={{ borderColor: "var(--accent)", color: "var(--accent)" }}>
          <Mic size={15} /> Practice now
        </button>
      </div>

      {/* Optional AI review */}
      <div className="rounded-xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <h2 className="font-bold flex items-center gap-2 mb-1" style={{ color: "var(--text-primary)" }}>
          <Wand2 size={17} style={{ color: "var(--accent)" }} /> Optional: AI review &amp; polish
        </h2>
        <p className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>
          Corrects the writing (keeping your meaning) and adds delivery aids. Choose what to include:
        </p>
        <div className="flex flex-wrap gap-4 mb-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "var(--text-primary)" }}>
            <input type="checkbox" checked={addNotation} onChange={(e) => setAddNotation(e.target.checked)} /> Speaking notation (pauses, emphasis, cues)
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "var(--text-primary)" }}>
            <input type="checkbox" checked={addIPA} onChange={(e) => setAddIPA(e.target.checked)} /> IPA pronunciation hints
          </label>
        </div>
        <button onClick={review} disabled={reviewing || !content.trim()}
          className="flex items-center gap-2 font-semibold px-4 py-2 rounded-lg text-white transition-colors disabled:opacity-60"
          style={{ background: "var(--accent)" }}>
          {reviewing ? <><Loader2 size={15} className="animate-spin" /> Reviewing…</> : <><Sparkles size={15} /> Review, correct &amp; annotate</>}
        </button>

        {/* Enhanced result */}
        {enhanced && (
          <div className="mt-5 space-y-3">
            {changes.length > 0 && (
              <div>
                <p className="text-xs font-bold mb-1" style={{ color: "var(--text-primary)" }}>What changed</p>
                <ul className="space-y-1">
                  {changes.map((c, i) => (
                    <li key={i} className="text-xs flex items-start gap-1.5" style={{ color: "var(--text-secondary)" }}>
                      <CheckCircle size={12} className="mt-0.5 shrink-0" style={{ color: "#00B37D" }} /> {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="rounded-lg p-4" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--accent)" }}>Reviewed version</p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-primary)" }}>{enhanced}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={useEnhanced}
                className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg border transition-colors"
                style={{ borderColor: "var(--accent)", color: "var(--accent)" }}>
                <ArrowRight size={14} /> Use this version
              </button>
              <button onClick={() => save(enhanced)} disabled={saving}
                className="flex items-center gap-1.5 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
                style={{ background: "var(--accent)" }}>
                <Save size={14} /> Save reviewed version
              </button>
              <button onClick={() => practice(enhanced)}
                className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg border transition-colors"
                style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                <Mic size={14} /> Practice this
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
