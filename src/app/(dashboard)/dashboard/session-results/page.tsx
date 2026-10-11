"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  History, Search, ChevronDown, Trash2, AlertCircle, BookOpen, Mic,
  CheckCircle, Flag, Zap, Calendar, Clock, Loader2, Inbox,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────
interface WordError {
  word: string; userSaid: string;
  issue: "skipped" | "substituted" | "filler_added" | "repeated";
  ipa: string; howToSay: string; drill: string;
}
interface PronunciationNote {
  sound: string; exampleWords: string[]; ipa: string;
  howTo: string; commonMistake: string; nativeExample: string;
}
interface ScriptComparison {
  wordsInScript: number; wordsCovered: number; accuracyPercent: number;
  missedWords: string[]; addedWords: string[];
}
interface SessionRow {
  id: number;
  scenario: string;
  transcript: string;
  scores: Record<string, number | null>;
  filler_words: { count?: number; words?: string[] };
  wpm: number;
  duration_seconds: number;
  strengths: string[];
  improvements: string[];
  ai_feedback: string;
  analysis: {
    wordErrors?: WordError[];
    pronunciationNotes?: PronunciationNote[];
    scriptComparison?: ScriptComparison | null;
    nativeTip?: string;
    bandScore?: number | null;
  };
  created_at: string;
}

const ISSUE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  skipped:      { label: "Skipped",      color: "#E53935", bg: "var(--danger-bg)" },
  substituted:  { label: "Wrong word",   color: "#F5A623", bg: "var(--warning-bg)" },
  filler_added: { label: "Filler added", color: "#7B61FF", bg: "var(--info-bg)" },
  repeated:     { label: "Repeated",     color: "var(--text-secondary)", bg: "var(--bg-secondary)" },
};

function scoreColor(score: number | null) {
  if (score == null) return "#8A8F98";
  if (score >= 80) return "#00B37D";
  if (score >= 60) return "#F5A623";
  return "#E53935";
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
    " · " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function fmtDuration(s: number) {
  if (!s) return "—";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

export default function SessionResultsPage() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/practice/sessions");
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        const rows: SessionRow[] = (data.sessions ?? []).map((r: SessionRow) => ({
          ...r,
          scores: r.scores ?? {},
          filler_words: r.filler_words ?? {},
          strengths: Array.isArray(r.strengths) ? r.strengths : [],
          improvements: Array.isArray(r.improvements) ? r.improvements : [],
          analysis: r.analysis ?? {},
        }));
        setSessions(rows);
      } catch {
        setError("Could not load your session history. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return sessions;
    const q = search.toLowerCase();
    return sessions.filter(s =>
      (s.scenario || "").toLowerCase().includes(q) ||
      (s.transcript || "").toLowerCase().includes(q)
    );
  }, [sessions, search]);

  async function deleteSession(id: number) {
    setDeleting(id);
    try {
      const res = await fetch("/api/practice/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      setSessions(prev => prev.filter(s => s.id !== id));
      if (expanded === id) setExpanded(null);
    } catch {
      setError("Failed to delete session.");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
          <History size={24} style={{ color: "var(--accent)" }} /> Session Results
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Review your previous practice records — scores, word-by-word errors, and pronunciation patterns to fix.
        </p>
      </div>

      {/* Search */}
      {sessions.length > 0 && (
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-secondary)" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by scenario or transcript..."
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
          />
        </div>
      )}

      {/* States */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20" style={{ color: "var(--text-secondary)" }}>
          <Loader2 size={32} className="animate-spin mb-3" style={{ color: "var(--accent)" }} />
          <p className="text-sm">Loading your sessions...</p>
        </div>
      )}

      {!loading && error && (
        <div className="flex items-center gap-2 p-4 rounded-lg text-sm" style={{ background: "var(--danger-bg)", border: "1px solid #FFCDD2", color: "#E53935" }}>
          <AlertCircle size={16} className="shrink-0" /> {error}
        </div>
      )}

      {!loading && !error && sessions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center" style={{ color: "var(--text-secondary)" }}>
          <Inbox size={40} className="mb-3 opacity-40" />
          <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>No saved sessions yet</p>
          <p className="text-sm mb-4">Complete a practice session and hit “Save Result” to see it here.</p>
          <Link href="/dashboard/practice"
            className="inline-flex items-center gap-2 text-white font-semibold px-5 py-2 rounded text-sm"
            style={{ background: "var(--accent)" }}>
            <Mic size={14} /> Start Practicing
          </Link>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && sessions.length > 0 && (
        <p className="text-sm py-10 text-center" style={{ color: "var(--text-secondary)" }}>No sessions match your search.</p>
      )}

      {/* Session list */}
      {!loading && filtered.map(session => {
        const isOpen = expanded === session.id;
        const overall = session.scores?.overall ?? null;
        const wordErrors = session.analysis?.wordErrors ?? [];
        const pronNotes = session.analysis?.pronunciationNotes ?? [];
        const sc = session.analysis?.scriptComparison;
        return (
          <div key={session.id} className="rounded-lg overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            {/* Summary row */}
            <div className="w-full flex items-center gap-2 pr-3">
              <button
                onClick={() => setExpanded(isOpen ? null : session.id)}
                className="flex items-center gap-4 px-5 py-4 text-left transition-colors hover:opacity-90 flex-1 min-w-0"
              >
                {/* Score badge */}
                <div className="flex flex-col items-center justify-center w-14 h-14 rounded-full shrink-0"
                  style={{ background: `${scoreColor(overall)}1A`, border: `2px solid ${scoreColor(overall)}` }}>
                  <span className="text-lg font-bold leading-none" style={{ color: scoreColor(overall) }}>{overall ?? "—"}</span>
                  <span className="text-[9px] mt-0.5" style={{ color: "var(--text-secondary)" }}>/100</span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate" style={{ color: "var(--text-primary)" }}>{session.scenario || "Practice Session"}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                    <span className="flex items-center gap-1"><Calendar size={11} /> {fmtDate(session.created_at)}</span>
                    <span className="flex items-center gap-1"><Clock size={11} /> {fmtDuration(session.duration_seconds)}</span>
                    {session.wpm > 0 && <span>{session.wpm} wpm</span>}
                    {wordErrors.length > 0 && <span style={{ color: "#F5A623" }}>{wordErrors.length} word errors</span>}
                  </div>
                </div>

                <ChevronDown size={18} className="shrink-0 transition-transform" style={{ color: "var(--text-secondary)", transform: isOpen ? "rotate(180deg)" : "none" }} />
              </button>
              <button
                onClick={() => deleteSession(session.id)}
                disabled={deleting === session.id}
                title="Delete this session"
                className="shrink-0 p-2 rounded-lg border transition-colors disabled:opacity-60"
                style={{ borderColor: "var(--danger-border)", color: "#E53935" }}
              >
                {deleting === session.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
              </button>
            </div>

            {/* Expanded detail */}
            {isOpen && (
              <div className="px-5 pb-5 pt-1 space-y-5 border-t" style={{ borderColor: "var(--border)" }}>
                {/* Score breakdown */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 pt-4">
                  {["pronunciation", "fluency", "confidence", "structure", "vocabulary", "pace"].map(key => {
                    const v = session.scores?.[key] ?? null;
                    return (
                      <div key={key} className="text-center">
                        <p className="text-lg font-bold" style={{ color: scoreColor(v) }}>{v ?? "—"}</p>
                        <p className="text-[10px] capitalize" style={{ color: "var(--text-secondary)" }}>{key}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Script accuracy */}
                {sc && (
                  <div className="rounded-lg p-4" style={{ background: "var(--bg-secondary)" }}>
                    <p className="font-bold text-sm mb-2 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                      <BookOpen size={14} style={{ color: "var(--accent)" }} /> Script Accuracy
                    </p>
                    <div className="flex flex-wrap gap-6">
                      <div><span className="text-xl font-bold" style={{ color: scoreColor(sc.accuracyPercent) }}>{sc.accuracyPercent}%</span> <span className="text-xs" style={{ color: "var(--text-secondary)" }}>accuracy</span></div>
                      <div><span className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{sc.wordsCovered}/{sc.wordsInScript}</span> <span className="text-xs" style={{ color: "var(--text-secondary)" }}>words</span></div>
                    </div>
                  </div>
                )}

                {/* Word-by-word errors */}
                {wordErrors.length > 0 && (
                  <div>
                    <p className="font-bold text-sm mb-2 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                      <AlertCircle size={14} style={{ color: "#F5A623" }} /> Word-by-Word Errors ({wordErrors.length})
                    </p>
                    <div className="space-y-2">
                      {wordErrors.map((err, i) => {
                        const tag = ISSUE_LABELS[err.issue] ?? { label: err.issue, color: "var(--text-secondary)", bg: "var(--bg-secondary)" };
                        return (
                          <div key={i} className="rounded-lg p-3" style={{ background: "var(--bg-secondary)" }}>
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="text-sm font-bold font-mono" style={{ color: "var(--text-primary)" }}>"{err.word}"</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: tag.bg, color: tag.color }}>{tag.label}</span>
                              {err.userSaid && err.userSaid !== "skipped" && (
                                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>→ <em>"{err.userSaid}"</em></span>
                              )}
                              {err.ipa && <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: "var(--accent-bg)", color: "var(--accent)" }}>{err.ipa}</span>}
                            </div>
                            {err.howToSay && <p className="text-xs" style={{ color: "var(--text-secondary)" }}><strong style={{ color: "var(--text-primary)" }}>How:</strong> {err.howToSay}</p>}
                            {err.drill && <p className="text-xs italic mt-0.5" style={{ color: "var(--accent)" }}>Drill: {err.drill}</p>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Pronunciation patterns */}
                {pronNotes.length > 0 && (
                  <div>
                    <p className="font-bold text-sm mb-2 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                      <Mic size={14} style={{ color: "var(--accent)" }} /> Pronunciation Patterns to Fix
                    </p>
                    <div className="space-y-2">
                      {pronNotes.map((note, i) => (
                        <div key={i} className="rounded-lg p-3" style={{ background: "var(--bg-secondary)" }}>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>/{note.sound}/ sound</span>
                            {note.ipa && <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: "var(--accent-bg)", color: "var(--accent)" }}>{note.ipa}</span>}
                            {note.exampleWords?.length > 0 && (
                              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>in: {note.exampleWords.slice(0, 4).map(w => `"${w}"`).join(", ")}</span>
                            )}
                          </div>
                          <div className="space-y-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                            {note.howTo && <p><strong style={{ color: "var(--text-primary)" }}>How to produce:</strong> {note.howTo}</p>}
                            {note.commonMistake && <p><strong style={{ color: "#E53935" }}>Common mistake:</strong> {note.commonMistake}</p>}
                            {note.nativeExample && <p><strong style={{ color: "#00B37D" }}>Native speech:</strong> {note.nativeExample}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strengths & improvements */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {session.strengths.length > 0 && (
                    <div>
                      <p className="font-bold text-sm mb-2 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                        <CheckCircle size={14} style={{ color: "#00B37D" }} /> Strengths
                      </p>
                      <ul className="space-y-1.5">
                        {session.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                            <CheckCircle size={12} className="mt-0.5 shrink-0" style={{ color: "#00B37D" }} /> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {session.improvements.length > 0 && (
                    <div>
                      <p className="font-bold text-sm mb-2 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                        <Flag size={14} style={{ color: "#F5A623" }} /> What to Fix
                      </p>
                      <ul className="space-y-1.5">
                        {session.improvements.map((s, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                            <Flag size={12} className="mt-0.5 shrink-0" style={{ color: "#F5A623" }} /> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* AI feedback */}
                {session.ai_feedback && (
                  <div className="rounded-lg p-4" style={{ background: "var(--bg-secondary)" }}>
                    <p className="font-bold text-sm mb-2" style={{ color: "var(--text-primary)" }}>Coach Feedback</p>
                    <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: "var(--text-secondary)" }}>{session.ai_feedback}</p>
                  </div>
                )}

                {/* Native tip */}
                {session.analysis?.nativeTip && (
                  <div className="rounded-lg p-3 flex items-start gap-2" style={{ background: "var(--accent-bg)", border: "1px solid var(--accent)" }}>
                    <Zap size={14} className="shrink-0 mt-0.5" style={{ color: "var(--accent)" }} />
                    <div>
                      <p className="text-[10px] font-bold mb-0.5" style={{ color: "var(--accent)" }}>Native Speaker Tip</p>
                      <p className="text-xs" style={{ color: "var(--text-primary)" }}>{session.analysis.nativeTip}</p>
                    </div>
                  </div>
                )}

                {/* Transcript */}
                {session.transcript && (
                  <div className="rounded-lg p-4" style={{ background: "var(--bg-secondary)" }}>
                    <p className="font-bold text-sm mb-2 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                      <Mic size={14} style={{ color: "var(--accent)" }} /> Your Transcript
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{session.transcript}</p>
                  </div>
                )}

                {/* Delete */}
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => deleteSession(session.id)}
                    disabled={deleting === session.id}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded border transition-colors disabled:opacity-60"
                    style={{ borderColor: "var(--danger-border)", color: "#E53935" }}
                  >
                    {deleting === session.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
