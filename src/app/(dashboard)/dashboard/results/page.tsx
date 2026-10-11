"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import ScoreRing from "@/components/ScoreRing";
import { toScore, type SpeechMetrics } from "@/lib/speechMetrics";
import {
  CheckCircle, Flag, ArrowRight, RotateCcw, Mic, Share2,
  TrendingUp, TrendingDown, Minus, AlertCircle, BookOpen, Zap,
  Save, Loader2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WordError {
  word: string;
  userSaid: string;
  issue: "skipped" | "substituted" | "filler_added" | "repeated";
  ipa: string;
  howToSay: string;
  drill: string;
}

interface PronunciationNote {
  sound: string;
  exampleWords: string[];
  ipa: string;
  howTo: string;
  commonMistake: string;
  nativeExample: string;
}

interface ScriptComparison {
  wordsInScript: number;
  wordsCovered: number;
  accuracyPercent: number;
  missedWords: string[];
  addedWords: string[];
}

interface Analysis {
  scores: {
    pronunciation: number | null;
    fluency: number | null;
    confidence: number | null;
    structure: number | null;
    vocabulary: number | null;
    pace: number | null;
    overall: number | null;
  };
  scoreBasis?: Record<string, string>;
  metrics?: SpeechMetrics | null;
  fillerWords: { count: number; words: string[] };
  wpm: number;
  strengths: string[];
  improvements: string[];
  aiFeedback: string;
  nativeTip?: string;
  wordErrors?: WordError[];
  pronunciationNotes?: PronunciationNote[];
  scriptComparison?: ScriptComparison | null;
  bandScore?: number | null;
  transcript?: string;
}

// ─── Fallback ─────────────────────────────────────────────────────────────────

const FALLBACK: Analysis = {
  scores: { pronunciation: 72, fluency: 80, confidence: 68, structure: 75, vocabulary: 71, pace: 83, overall: 75 },
  fillerWords: { count: 3, words: ["um", "uh", "like"] },
  wpm: 128,
  strengths: [
    "Strong opening — you committed to the first sentence without hesitation.",
    "Natural linking between words — \"completed the\" flowed well, not choppy.",
    "Good projection — your voice carried clearly throughout.",
  ],
  improvements: [
    "The /θ/ sound in \"the\", \"that\", \"three\" is being replaced with /d/ — this is your most noticeable non-native pattern.",
    "Filler words (um, uh) appeared 3 times — replace each with a deliberate half-second pause.",
    "Confidence dropped in the closing sentence — your volume fell and pace rushed. Practice the last 2 lines separately.",
  ],
  aiFeedback: "Your delivery has a solid foundation but the /th/ substitution is pulling your pronunciation score down significantly. A native speaker will immediately notice this. Spend 10 minutes daily on tongue-between-teeth drills. The filler words are fixable fast — record yourself and pause wherever you hear an 'um'. Your pace and fluency are genuine strengths; don't sacrifice them as you fix the above.",
  nativeTip: "Record yourself reading one paragraph aloud, then listen back on 1.5x speed — your ear will catch patterns you miss in real time.",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseAnalysis(raw: string | null): Analysis | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const scores = parsed.scores ?? {};
    parsed.scores = {
      // Missing = not measured. Keep it null so it shows as "—", not a false 0.
      pronunciation: toScore(scores.pronunciation),
      fluency: toScore(scores.fluency),
      confidence: toScore(scores.confidence),
      structure: toScore(scores.structure),
      vocabulary: toScore(scores.vocabulary),
      pace: toScore(scores.pace),
      overall: toScore(scores.overall),
    };
    parsed.fillerWords = parsed.fillerWords ?? { count: 0, words: [] };
    parsed.strengths = Array.isArray(parsed.strengths) ? parsed.strengths : [];
    parsed.improvements = Array.isArray(parsed.improvements) ? parsed.improvements : [];
    parsed.wordErrors = Array.isArray(parsed.wordErrors) ? parsed.wordErrors : [];
    parsed.pronunciationNotes = Array.isArray(parsed.pronunciationNotes) ? parsed.pronunciationNotes : [];
    parsed.wpm = Number(parsed.wpm) || 0;
    return parsed;
  } catch { return null; }
}

function scoreColor(score: number | null) {
  if (score == null) return "text-[var(--text-muted)]";
  if (score >= 80) return "text-[#00B37D]";
  if (score >= 60) return "text-[#F5A623]";
  return "text-red-500";
}

function scoreLabel(score: number | null) {
  if (score == null) return "Not enough speech to score";
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Great";
  if (score >= 70) return "Good";
  if (score >= 60) return "Fair";
  return "Needs Work";
}

function Delta({ cur, prev }: { cur: number | null; prev: number | null }) {
  if (cur == null || prev == null) return <Minus size={12} className="text-[var(--text-muted)]" />;
  const diff = cur - prev;
  if (Math.abs(diff) < 1) return <Minus size={12} className="text-[var(--text-muted)]" />;
  if (diff > 0) return <span className="flex items-center gap-0.5 text-[#00B37D] text-xs font-bold"><TrendingUp size={12} />+{Math.round(diff)}</span>;
  return <span className="flex items-center gap-0.5 text-red-400 text-xs font-bold"><TrendingDown size={12} />{Math.round(diff)}</span>;
}

const ISSUE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  skipped:     { label: "Skipped",     color: "#E53935", bg: "var(--danger-bg)" },
  substituted: { label: "Wrong word",  color: "#F5A623", bg: "var(--warning-bg)" },
  filler_added:{ label: "Filler added",color: "#7B61FF", bg: "var(--info-bg)" },
  repeated:    { label: "Repeated",    color: "var(--text-secondary)", bg: "var(--bg-secondary)" },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ResultsPage() {
  const [data, setData] = useState<Analysis | null>(null);
  const [prev, setPrev] = useState<Analysis | null>(null);
  const [showCompare, setShowCompare] = useState(false);
  const [scenario, setScenario] = useState("Practice Session");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    setData(parseAnalysis(sessionStorage.getItem("spokiva_analysis")));
    setPrev(parseAnalysis(sessionStorage.getItem("spokiva_analysis_prev")));
    const sc = sessionStorage.getItem("spokiva_analysis_scenario");
    if (sc) setScenario(sc);
  }, []);

  async function saveResult() {
    if (!data || saveState === "saving" || saveState === "saved") return;
    setSaveState("saving");
    try {
      const res = await fetch("/api/practice/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario,
          transcript: data.transcript ?? "",
          scores: data.scores,
          fillerWords: data.fillerWords,
          wpm: data.wpm,
          durationSeconds: 0,
          strengths: data.strengths,
          improvements: data.improvements,
          aiFeedback: data.aiFeedback,
          analysis: {
            wordErrors: data.wordErrors ?? [],
            pronunciationNotes: data.pronunciationNotes ?? [],
            scriptComparison: data.scriptComparison ?? null,
            nativeTip: data.nativeTip ?? "",
            bandScore: data.bandScore ?? null,
          },
        }),
      });
      if (!res.ok) throw new Error("save failed");
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }

  const analysis = data ?? FALLBACK;
  const isFallback = !data;

  const scoreRows: { label: keyof Analysis["scores"]; display: string }[] = [
    { label: "pronunciation", display: "Pronunciation" },
    { label: "fluency", display: "Fluency" },
    { label: "confidence", display: "Confidence" },
    { label: "structure", display: "Structure" },
    { label: "vocabulary", display: "Vocabulary" },
    { label: "pace", display: "Pace" },
  ];

  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const sc = analysis.scriptComparison;
  const wordErrors = analysis.wordErrors ?? [];
  const pronunciationNotes = analysis.pronunciationNotes ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Session Results</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>{today}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {analysis.wpm > 0 && (
            <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ background: "var(--accent-bg)", color: "var(--accent)" }}>
              {analysis.wpm} wpm
            </span>
          )}
          {prev && (
            <button
              onClick={() => setShowCompare((v) => !v)}
              className={`text-xs font-semibold px-3 py-1 rounded-full border transition-colors`}
              style={showCompare
                ? { background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" }
                : { background: "transparent", color: "var(--accent)", borderColor: "var(--accent)" }}
            >
              {showCompare ? "Hide Compare" : "Compare to Last"}
            </button>
          )}
          {!isFallback && (
            <button
              onClick={saveResult}
              disabled={saveState === "saving" || saveState === "saved"}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded border transition-colors disabled:opacity-80"
              style={saveState === "saved"
                ? { background: "var(--success-bg)", color: "#00B37D", borderColor: "#00B37D" }
                : { background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" }}
            >
              {saveState === "saving" ? <><Loader2 size={13} className="animate-spin" /> Saving...</>
                : saveState === "saved" ? <><CheckCircle size={13} /> Saved</>
                : saveState === "error" ? <><AlertCircle size={13} /> Retry Save</>
                : <><Save size={13} /> Save Result</>}
            </button>
          )}
          <button
            onClick={() => window.open("/report", "_blank")}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded border transition-colors"
            style={{ color: "var(--text-secondary)", borderColor: "var(--border)" }}
          >
            <Share2 size={13} /> Share / Print
          </button>
        </div>
      </div>

      {isFallback && (
        <div className="flex items-center gap-2 p-3 rounded-lg text-sm" style={{ background: "var(--warning-bg)", border: "1px solid #F5A623", color: "var(--warning-text)" }}>
          <Mic size={14} className="shrink-0" />
          No recent session found — showing sample results. Complete a practice session to see your real scores.
        </div>
      )}

      {/* Overall Score */}
      <div className="rounded-lg p-6 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "var(--text-secondary)" }}>Overall Score</p>
        <div className="flex items-center justify-center gap-4 mb-2">
          <span className="text-6xl font-bold" style={{ color: "var(--text-primary)" }}>{analysis.scores.overall ?? "—"}</span>
          <span className="text-2xl font-light" style={{ color: "var(--text-secondary)" }}>/100</span>
          {showCompare && prev && (
            <div className="ml-4">
              <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>vs last ({prev.scores.overall ?? "—"})</p>
              <Delta cur={analysis.scores.overall} prev={prev.scores.overall} />
            </div>
          )}
        </div>
        <p className={`text-sm font-semibold ${scoreColor(analysis.scores.overall)}`}>{scoreLabel(analysis.scores.overall)}</p>
        <div className="flex flex-wrap justify-center gap-4 mt-3">
          {analysis.fillerWords.count > 0 && (
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {analysis.fillerWords.count} filler word{analysis.fillerWords.count !== 1 ? "s" : ""}
              {analysis.fillerWords.words.length > 0 && <> — {analysis.fillerWords.words.map(w => `"${w}"`).join(", ")}</>}
            </p>
          )}
          {analysis.bandScore != null && (
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>IELTS Band est. <strong>{analysis.bandScore}</strong></p>
          )}
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="rounded-lg p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <h2 className="font-bold mb-5" style={{ color: "var(--text-primary)" }}>Score Breakdown</h2>
        {showCompare && prev ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs border-b" style={{ color: "var(--text-secondary)", borderColor: "var(--border)" }}>
                  <th className="text-left pb-2">Dimension</th>
                  <th className="text-center pb-2">Last</th>
                  <th className="text-center pb-2">Now</th>
                  <th className="text-center pb-2">Change</th>
                </tr>
              </thead>
              <tbody>
                {scoreRows.map(({ label, display }) => (
                  <tr key={label} className="border-b" style={{ borderColor: "var(--border)" }}>
                    <td className="py-2 font-medium" style={{ color: "var(--text-primary)" }}>{display}</td>
                    <td className="py-2 text-center" style={{ color: "var(--text-secondary)" }}>{prev.scores[label] ?? "—"}</td>
                    <td className={`py-2 text-center font-bold ${scoreColor(analysis.scores[label])}`}>{analysis.scores[label] ?? "—"}</td>
                    <td className="py-2 text-center"><div className="flex justify-center"><Delta cur={analysis.scores[label]} prev={prev.scores[label]} /></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 justify-items-center">
            {scoreRows.map(({ label, display }) => (
              <ScoreRing key={label} score={analysis.scores[label]} label={display} size={80} strokeWidth={7} />
            ))}
          </div>
        )}
      </div>

      {/* How the scores were produced */}
      {analysis.scoreBasis && (
        <p className="text-xs -mt-3 px-1" style={{ color: "var(--text-muted)" }}>
          Pronunciation, fluency, confidence and pace are measured from your audio (timing, pauses, hesitations and how clearly each word was recognised).
          Structure and vocabulary are judged by AI from your transcript. Overall is a weighted average of the available scores; &ldquo;—&rdquo; means there wasn&apos;t enough speech to measure it.
        </p>
      )}

      {/* Delivery metrics */}
      {analysis.metrics && (
        <div className="rounded-lg p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h2 className="font-bold mb-4" style={{ color: "var(--text-primary)" }}>Delivery Metrics</h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Pace", value: analysis.metrics.wpm != null ? `${analysis.metrics.wpm} wpm` : "—", hint: "Aim for 130–160" },
              { label: "Pauses", value: analysis.metrics.pauseCount ?? "—", hint: analysis.metrics.longPauseCount != null ? `${analysis.metrics.longPauseCount} over 1.2 s` : "" },
              { label: "Longest pause", value: analysis.metrics.longestPauseSec != null ? `${analysis.metrics.longestPauseSec} s` : "—", hint: "" },
              { label: "Fillers", value: analysis.metrics.fillerCount, hint: analysis.metrics.repetitionCount ? `${analysis.metrics.repetitionCount} repeat${analysis.metrics.repetitionCount !== 1 ? "s" : ""}` : "" },
              { label: "Clarity", value: analysis.metrics.clarity != null ? `${Math.round(analysis.metrics.clarity * 100)}%` : "—", hint: "Words recognised clearly" },
            ].map(({ label, value, hint }) => (
              <div key={label} className="rounded-lg p-3 text-center" style={{ background: "var(--bg-secondary)" }}>
                <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{value}</p>
                <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>{label}</p>
                {hint && <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>{hint}</p>}
              </div>
            ))}
          </div>
          {analysis.metrics.unclearWords.length > 0 && (
            <p className="text-xs mt-4" style={{ color: "var(--text-secondary)" }}>
              <strong>Hard to recognise:</strong> {analysis.metrics.unclearWords.join(", ")} — practise these words slowly and clearly.
            </p>
          )}
        </div>
      )}

      {/* Script accuracy */}
      {sc && (
        <div className="rounded-lg p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h2 className="font-bold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <BookOpen size={16} style={{ color: "var(--accent)" }} /> Script Accuracy
          </h2>
          <div className="flex flex-wrap gap-6 mb-4">
            <div className="text-center">
              <p className="text-3xl font-bold" style={{ color: sc.accuracyPercent >= 85 ? "#00B37D" : sc.accuracyPercent >= 70 ? "#F5A623" : "#E53935" }}>
                {sc.accuracyPercent}%
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>Accuracy</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{sc.wordsCovered}<span className="text-base font-normal" style={{ color: "var(--text-secondary)" }}>/{sc.wordsInScript}</span></p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>Words covered</p>
            </div>
          </div>
          {sc.missedWords.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Words missed from script</p>
              <div className="flex flex-wrap gap-1.5">
                {sc.missedWords.map((w, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "var(--danger-bg)", color: "#E53935" }}>{w}</span>
                ))}
              </div>
            </div>
          )}
          {sc.addedWords.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Words added (not in script)</p>
              <div className="flex flex-wrap gap-1.5">
                {sc.addedWords.map((w, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "var(--info-bg)", color: "#7B61FF" }}>{w}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Word-by-word errors */}
      {wordErrors.length > 0 && (
        <div className="rounded-lg overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
            <h2 className="font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <AlertCircle size={16} style={{ color: "#F5A623" }} /> Word-by-Word Errors ({wordErrors.length})
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>Every deviation from the script, with native-speaker corrections</p>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {wordErrors.map((err, i) => {
              const tag = ISSUE_LABELS[err.issue] ?? { label: err.issue, color: "var(--text-secondary)", bg: "var(--bg-secondary)" };
              return (
                <div key={i} className="px-5 py-4">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-sm font-bold font-mono" style={{ color: "var(--text-primary)" }}>"{err.word}"</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: tag.bg, color: tag.color }}>{tag.label}</span>
                    {err.userSaid && err.userSaid !== "skipped" && (
                      <span className="text-xs" style={{ color: "var(--text-secondary)" }}>→ you said: <em>"{err.userSaid}"</em></span>
                    )}
                    {err.ipa && (
                      <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: "var(--bg-secondary)", color: "var(--accent)" }}>{err.ipa}</span>
                    )}
                  </div>
                  {err.howToSay && (
                    <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}><strong style={{ color: "var(--text-primary)" }}>How to say it:</strong> {err.howToSay}</p>
                  )}
                  {err.drill && (
                    <p className="text-xs italic" style={{ color: "var(--accent)" }}>Drill: {err.drill}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pronunciation Notes */}
      {pronunciationNotes.length > 0 && (
        <div className="rounded-lg overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
            <h2 className="font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <Mic size={16} style={{ color: "var(--accent)" }} /> Pronunciation Patterns to Fix
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>Recurring sound patterns with native-speaker guidance</p>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {pronunciationNotes.map((note, i) => (
              <div key={i} className="px-5 py-4">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>/{note.sound}/ sound</span>
                  {note.ipa && (
                    <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: "var(--accent-bg)", color: "var(--accent)" }}>{note.ipa}</span>
                  )}
                  {note.exampleWords?.length > 0 && (
                    <span className="text-xs" style={{ color: "var(--text-secondary)" }}>in: {note.exampleWords.slice(0, 4).map(w => `"${w}"`).join(", ")}</span>
                  )}
                </div>
                <div className="space-y-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                  {note.howTo && <p><strong style={{ color: "var(--text-primary)" }}>How to produce it:</strong> {note.howTo}</p>}
                  {note.commonMistake && <p><strong style={{ color: "#E53935" }}>Common mistake:</strong> {note.commonMistake}</p>}
                  {note.nativeExample && <p><strong style={{ color: "#00B37D" }}>Native speech:</strong> {note.nativeExample}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-lg p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h2 className="font-bold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <CheckCircle size={16} style={{ color: "#00B37D" }} /> Strengths
          </h2>
          <ul className="space-y-3">
            {analysis.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                <CheckCircle size={14} className="mt-0.5 shrink-0" style={{ color: "#00B37D" }} /> {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h2 className="font-bold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Flag size={16} style={{ color: "#F5A623" }} /> What to Fix
          </h2>
          <ul className="space-y-3">
            {analysis.improvements.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                <Flag size={14} className="mt-0.5 shrink-0" style={{ color: "#F5A623" }} /> {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* AI Coach Feedback */}
      <div className="rounded-lg p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: "var(--accent)" }}>
            <span className="text-white text-xs font-bold">AI</span>
          </div>
          <h2 className="font-bold" style={{ color: "var(--text-primary)" }}>Coach Feedback</h2>
        </div>
        <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--text-secondary)" }}>{analysis.aiFeedback}</p>
      </div>

      {/* Native tip */}
      {analysis.nativeTip && (
        <div className="rounded-lg p-4 flex items-start gap-3" style={{ background: "var(--accent-bg)", border: "1px solid var(--accent)" }}>
          <Zap size={16} className="shrink-0 mt-0.5" style={{ color: "var(--accent)" }} />
          <div>
            <p className="text-xs font-bold mb-0.5" style={{ color: "var(--accent)" }}>Native Speaker Tip</p>
            <p className="text-sm" style={{ color: "var(--text-primary)" }}>{analysis.nativeTip}</p>
          </div>
        </div>
      )}

      {/* Transcript */}
      {analysis.transcript && (
        <div className="rounded-lg p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h2 className="font-bold mb-3 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Mic size={16} style={{ color: "var(--accent)" }} /> Your Transcript
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{analysis.transcript}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard/practice"
          className="flex items-center justify-center gap-2 text-white font-semibold px-6 py-2.5 rounded text-sm transition-colors"
          style={{ background: "var(--accent)" }}>
          <RotateCcw size={14} /> Practice Again
        </Link>
        <Link href="/dashboard/script-writer"
          className="flex items-center justify-center gap-2 font-semibold px-6 py-2.5 rounded text-sm border transition-colors"
          style={{ borderColor: "var(--accent)", color: "var(--accent)" }}>
          Try Different Script <ArrowRight size={14} />
        </Link>
        <Link href="/dashboard/progress"
          className="flex items-center justify-center gap-2 font-semibold px-6 py-2.5 rounded text-sm border transition-colors"
          style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
          View Progress
        </Link>
        <button onClick={() => window.open("/report", "_blank")}
          className="flex items-center justify-center gap-2 font-semibold px-6 py-2.5 rounded text-sm border transition-colors"
          style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
          <Share2 size={14} /> Share Report
        </button>
      </div>
    </div>
  );
}
