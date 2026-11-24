"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Copy, Save, CheckCircle, Mic, Undo2, Redo2, RotateCcw, Eye, EyeOff, Pencil, ChevronDown,
  Loader2, AlertCircle, Info, BookOpen,
} from "lucide-react";
import { REWRITES, formatSpokenLength } from "@/lib/scriptOptions";

// ─── Undo/redo history for the script text ─────────────────────────────────────
export function useScriptHistory(initial = "") {
  const [state, setState] = useState<{ stack: string[]; index: number }>({ stack: [initial], index: 0 });
  const value = state.stack[state.index];

  // `push` records a new version (generate, AI rewrite). Typing uses `replace`
  // so each keystroke doesn't become its own undo step.
  const push = useCallback((text: string) => {
    setState((s) => ({ stack: [...s.stack.slice(0, s.index + 1), text].slice(-30), index: Math.min(s.index + 1, 29) }));
  }, []);
  const replace = useCallback((text: string) => {
    setState((s) => { const stack = [...s.stack]; stack[s.index] = text; return { ...s, stack }; });
  }, []);
  const reset = useCallback((text = "") => setState({ stack: [text], index: 0 }), []);
  const undo = useCallback(() => setState((s) => ({ ...s, index: Math.max(0, s.index - 1) })), []);
  const redo = useCallback(() => setState((s) => ({ ...s, index: Math.min(s.stack.length - 1, s.index + 1) })), []);

  return { value, push, replace, reset, undo, redo, canUndo: state.index > 0, canRedo: state.index < state.stack.length - 1 };
}

// ─── Delivery marks ────────────────────────────────────────────────────────────
const CUES: Record<string, { label: string; meaning: string; bg: string; fg: string }> = {
  SLOW: { label: "Slow", meaning: "Slow down here for impact", bg: "var(--info-bg)", fg: "var(--accent)" },
  FAST: { label: "Faster", meaning: "Pick up the energy", bg: "var(--warning-bg)", fg: "var(--warning-text)" },
  QUIET: { label: "Softer", meaning: "Lower your voice a little", bg: "var(--bg-secondary)", fg: "var(--text-secondary)" },
  STRONG: { label: "Strong", meaning: "Speak with authority", bg: "var(--danger-bg)", fg: "#E53935" },
  SMILE: { label: "Smile", meaning: "Smile — sound warm", bg: "var(--success-bg)", fg: "var(--success-text)" },
  "STEP FORWARD": { label: "Step forward", meaning: "Step forward for emphasis", bg: "var(--accent-bg)", fg: "var(--accent)" },
  "LOOK LEFT": { label: "Look left", meaning: "Make eye contact to your left", bg: "var(--accent-bg)", fg: "var(--accent)" },
  "LOOK RIGHT": { label: "Look right", meaning: "Make eye contact to your right", bg: "var(--accent-bg)", fg: "var(--accent)" },
};
const CUE_RE = new RegExp(`\\[(${Object.keys(CUES).join("|")})\\]|\\*\\*(.+?)\\*\\*|(\\/{1,3})`, "g");

export function stripMarks(text: string): string {
  return text
    .replace(new RegExp(`\\[(?:${Object.keys(CUES).join("|")})\\]`, "g"), "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\/{1,3}/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/ ([,.!?;:])/g, "$1")
    .split("\n").map((l) => l.trim()).join("\n")
    .trim();
}

function PauseDots({ n }: { n: number }) {
  const title = n >= 3 ? "Long pause (1 second)" : n === 2 ? "Medium pause (half a second)" : "Short pause";
  return (
    <span className="inline-flex items-center gap-0.5 mx-1 align-middle" title={title} aria-label={title}>
      {Array.from({ length: Math.min(n, 3) }).map((_, i) => (
        <span key={i} className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "#F5A623" }} />
      ))}
    </span>
  );
}

function CoachedLine({ line }: { line: string }) {
  const out: React.ReactNode[] = [];
  let last = 0;
  for (const m of line.matchAll(CUE_RE)) {
    if (m.index! > last) out.push(line.slice(last, m.index));
    if (m[1]) {
      const c = CUES[m[1]];
      out.push(
        <span key={m.index} title={c.meaning} className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded text-[10px] font-bold align-middle"
          style={{ background: c.bg, color: c.fg }}>{c.label}</span>,
      );
    } else if (m[2]) {
      out.push(<strong key={m.index} className="underline decoration-dotted underline-offset-4" style={{ color: "var(--accent)" }} title="Stress this word">{m[2]}</strong>);
    } else if (m[3]) {
      out.push(<PauseDots key={m.index} n={m[3].length} />);
    }
    last = m.index! + m[0].length;
  }
  if (last < line.length) out.push(line.slice(last));
  return <>{out}</>;
}

function Legend() {
  return (
    <div className="rounded-lg p-3 mb-3 text-xs grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5" style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}>
      <span className="flex items-center gap-1"><PauseDots n={1} /> short pause · <PauseDots n={2} /> medium · <PauseDots n={3} /> long</span>
      <span><strong className="underline decoration-dotted underline-offset-4" style={{ color: "var(--accent)" }}>word</strong> — stress this word</span>
      {Object.entries(CUES).slice(0, 5).map(([k, c]) => (
        <span key={k}><span className="inline-flex px-1.5 py-0.5 mr-1 rounded text-[10px] font-bold" style={{ background: c.bg, color: c.fg }}>{c.label}</span>{c.meaning}</span>
      ))}
      <span><span className="inline-flex px-1.5 py-0.5 mr-1 rounded text-[10px] font-bold" style={{ background: "var(--accent-bg)", color: "var(--accent)" }}>Look left</span>Body language hints</span>
    </div>
  );
}

// ─── Result panel ──────────────────────────────────────────────────────────────
type View = "coached" | "clean" | "edit";
const VIEW_KEY = "spokiva_script_view";

export default function ScriptResult({
  history, targetWords, onSave, onPractice, onStartOver,
}: {
  history: ReturnType<typeof useScriptHistory>;
  targetWords?: number;
  onSave: () => Promise<void>;
  onPractice: () => void;
  onStartOver: () => void;
}) {
  const script = history.value;
  const [view, setView] = useState<View>("coached");
  const [showLegend, setShowLegend] = useState(true);
  const [rewriting, setRewriting] = useState<string | null>(null);
  const [rewriteError, setRewriteError] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rawSaveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [savedText, setSavedText] = useState<string | null>(null);
  // "Saved" only while the script is unchanged since the last save.
  const saveState = rawSaveState === "saved" && savedText !== script ? "idle" : rawSaveState;
  const [saveError, setSaveError] = useState("");
  const [practised, setPractised] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { const v = localStorage.getItem(VIEW_KEY) as View | null; if (v === "coached" || v === "clean") setView(v); } catch {}
  }, []);
  useEffect(() => { try { if (view !== "edit") localStorage.setItem(VIEW_KEY, view); } catch {} }, [view]);
  useEffect(() => {
    if (!moreOpen) return;
    const close = (e: MouseEvent) => { if (!moreRef.current?.contains(e.target as Node)) setMoreOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [moreOpen]);

  const words = stripMarks(script).split(/\s+/).filter(Boolean).length;

  async function rewrite(r: typeof REWRITES[number]) {
    setMoreOpen(false);
    setRewriting(r.label);
    setRewriteError("");
    try {
      const res = await fetch("/api/scripts/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script, instruction: r.instruction }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.script) throw new Error(data.error ?? "The AI couldn't rewrite the script.");
      history.push(data.script.trim());
    } catch (e) {
      setRewriteError(`${e instanceof Error ? e.message : "Rewrite failed"} Your script hasn't changed — please try again.`);
    } finally {
      setRewriting(null);
    }
  }

  async function save() {
    setSaveState("saving");
    setSaveError("");
    try { await onSave(); setSavedText(script); setSaveState("saved"); }
    catch (e) { setSaveState("error"); setSaveError(e instanceof Error ? e.message : "Couldn't save"); }
  }

  function copy() {
    navigator.clipboard.writeText(view === "clean" ? stripMarks(script) : script).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const btn = "flex items-center gap-1 text-xs px-2.5 py-1.5 rounded border transition-colors disabled:opacity-40";
  const quiet = { borderColor: "var(--border)", color: "var(--text-secondary)" };

  return (
    <div className="flex flex-col gap-4">
      {/* Next steps */}
      <ol className="grid grid-cols-1 sm:grid-cols-3 gap-2" aria-label="What to do next">
        {[
          { n: 1, title: "Read it through", text: "Edit anything that doesn't sound like you.", done: true },
          { n: 2, title: "Practise out loud", text: "Get scored on how you speak.", done: practised },
          { n: 3, title: "Save it", text: "Find it later in My scripts.", done: saveState === "saved" },
        ].map((s) => (
          <li key={s.n} className="rounded-lg p-3 flex gap-2.5" style={{ background: "var(--bg-secondary)" }}>
            <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={s.done ? { background: "var(--accent)", color: "var(--on-accent, #fff)" } : { border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
              {s.n}
            </span>
            <span>
              <span className="block text-xs font-bold" style={{ color: "var(--text-primary)" }}>{s.title}</span>
              <span className="block text-[11px]" style={{ color: "var(--text-secondary)" }}>{s.text}</span>
            </span>
          </li>
        ))}
      </ol>

      {/* Main actions */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => { setPractised(true); onPractice(); }}
          className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded text-white transition-colors"
          style={{ background: "#00B37D" }}>
          <Mic size={15} /> Practise this script
        </button>
        <button onClick={save} disabled={saveState === "saving" || saveState === "saved"}
          className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded transition-colors border disabled:opacity-80"
          style={saveState === "saved" ? { borderColor: "#00B37D", color: "#00B37D", background: "var(--success-bg)" } : { borderColor: "var(--accent)", color: "var(--accent)" }}>
          {saveState === "saving" ? <Loader2 size={15} className="animate-spin" /> : saveState === "saved" ? <CheckCircle size={15} /> : <Save size={15} />}
          {saveState === "saved" ? "Saved to My scripts" : saveState === "saving" ? "Saving…" : "Save"}
        </button>
        <button onClick={copy} className={btn} style={quiet}><Copy size={12} /> {copied ? "Copied!" : "Copy text"}</button>
      </div>
      {saveState === "error" && <p className="text-xs" style={{ color: "#E53935" }}>{saveError}</p>}

      {/* View switcher + undo */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-lg p-0.5" style={{ background: "var(--bg-secondary)" }} role="tablist" aria-label="How to show the script">
          {([
            { id: "coached", label: "With coaching marks", icon: Eye },
            { id: "clean", label: "Plain text", icon: EyeOff },
            { id: "edit", label: "Edit", icon: Pencil },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button key={id} role="tab" aria-selected={view === id} onClick={() => setView(id)}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-md transition-colors"
              style={view === id ? { background: "var(--bg-card)", color: "var(--text-primary)", boxShadow: "0 1px 2px rgba(0,0,0,.08)" } : { color: "var(--text-secondary)" }}>
              <Icon size={12} /> {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={history.undo} disabled={!history.canUndo} className={btn} style={quiet} title="Undo the last change"><Undo2 size={12} /> Undo</button>
          <button onClick={history.redo} disabled={!history.canRedo} className={btn} style={quiet} title="Redo"><Redo2 size={12} /> Redo</button>
        </div>
      </div>

      <p className="text-xs -mt-2" style={{ color: "var(--text-secondary)" }}>
        {words} words · {formatSpokenLength(words)} when spoken
        {targetWords && words > targetWords * 1.35 ? " · longer than you asked for — try “Make it shorter”" : ""}
        {targetWords && words < targetWords * 0.65 ? " · shorter than you asked for — try “Make it longer”" : ""}
      </p>

      {/* Script body */}
      {view === "coached" && (
        <>
          <button onClick={() => setShowLegend((v) => !v)} className="self-start flex items-center gap-1 text-xs font-semibold -mt-2" style={{ color: "var(--accent)" }}>
            <Info size={12} /> {showLegend ? "Hide" : "What do the marks mean?"}
          </button>
          {showLegend && <Legend />}
        </>
      )}
      {view === "edit" ? (
        <div>
          <textarea value={script} onChange={(e) => history.replace(e.target.value)} rows={16}
            className="w-full rounded-lg p-4 text-sm leading-relaxed resize-y"
            style={{ background: "var(--bg-secondary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
            aria-label="Edit your script" />
          <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>
            Tip: <code>/</code> <code>{"//"}</code> <code>{"///"}</code> are pauses, <code>**word**</code> stresses a word. You can delete them if you prefer.
          </p>
        </div>
      ) : (
        <div className="rounded-lg p-4 overflow-y-auto max-h-[28rem] text-[15px] leading-8" style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}>
          {(view === "clean" ? stripMarks(script) : script).split("\n").map((line, i) =>
            line.trim() ? <p key={i} className="mb-3">{view === "clean" ? line : <CoachedLine line={line} />}</p> : null,
          )}
        </div>
      )}

      {/* AI rewrite */}
      <div>
        <p className="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
          <BookOpen size={13} style={{ color: "var(--accent)" }} /> Not quite right? Ask the AI to change it
        </p>
        <div className="flex flex-wrap gap-2 items-start">
          {REWRITES.slice(0, 4).map((r) => (
            <button key={r.label} onClick={() => rewrite(r)} disabled={!!rewriting} title={r.hint}
              className="text-xs border px-3 py-1.5 rounded transition-colors font-medium disabled:opacity-50 flex items-center gap-1"
              style={{ borderColor: "var(--accent)", color: "var(--accent)", background: rewriting === r.label ? "var(--accent-bg)" : undefined }}>
              {rewriting === r.label && <Loader2 size={12} className="animate-spin" />}{r.label}
            </button>
          ))}
          <div className="relative" ref={moreRef}>
            <button onClick={() => setMoreOpen((v) => !v)} disabled={!!rewriting} aria-expanded={moreOpen}
              className="text-xs border px-3 py-1.5 rounded transition-colors font-medium disabled:opacity-50 flex items-center gap-1"
              style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
              {rewriting && !REWRITES.slice(0, 4).some((r) => r.label === rewriting) ? <><Loader2 size={12} className="animate-spin" /> {rewriting}</> : <>More <ChevronDown size={12} /></>}
            </button>
            {moreOpen && (
              <div className="absolute z-20 mt-1 left-0 w-64 rounded-lg p-1 shadow-lg" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                {REWRITES.slice(4).map((r) => (
                  <button key={r.label} onClick={() => rewrite(r)} className="w-full text-left px-3 py-2 rounded hover:bg-[var(--bg-hover)]">
                    <span className="block text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{r.label}</span>
                    <span className="block text-[11px]" style={{ color: "var(--text-secondary)" }}>{r.hint}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {rewriting && <p className="text-xs mt-2" style={{ color: "var(--text-secondary)" }}>Rewriting… this usually takes 10–20 seconds.</p>}
        {rewriteError && (
          <p className="text-xs mt-2 flex items-center gap-1" style={{ color: "#E53935" }}><AlertCircle size={12} /> {rewriteError}</p>
        )}
        {history.canUndo && !rewriting && !rewriteError && (
          <p className="text-[11px] mt-2" style={{ color: "var(--text-muted)" }}>Don&apos;t like a change? Press Undo to go back.</p>
        )}
      </div>

      {/* Start over */}
      <div className="pt-2 border-t" style={{ borderColor: "var(--border)" }}>
        {confirmReset ? (
          <div className="flex flex-wrap items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
            Start a new script? {saveState !== "saved" && "This one isn't saved yet."}
            <button onClick={onStartOver} className="px-3 py-1.5 rounded font-semibold text-white" style={{ background: "#E53935" }}>Yes, start over</button>
            <button onClick={() => setConfirmReset(false)} className="px-3 py-1.5 rounded border" style={quiet}>Keep this script</button>
          </div>
        ) : (
          <button onClick={() => setConfirmReset(true)} className={btn} style={quiet}><RotateCcw size={12} /> Start a new script</button>
        )}
      </div>
    </div>
  );
}
