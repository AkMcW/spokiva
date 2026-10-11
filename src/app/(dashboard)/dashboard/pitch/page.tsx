"use client";
import { useState, useRef } from "react";
import {
  Mic, Square, ChevronRight, ChevronLeft, BarChart2,
  MessageSquare, Clock, Target, CheckCircle, AlertCircle,
  RotateCcw, Printer, Lightbulb, Zap, ArrowRight,
} from "lucide-react";

// ─── Constants ───────────────────────────────────────────────────────────────

const PITCH_TYPES = [
  { id: "investor", label: "Investor Pitch", emoji: "💰", desc: "Startup funding round" },
  { id: "sales", label: "Sales Pitch", emoji: "🤝", desc: "Win a new customer" },
  { id: "product-demo", label: "Product Demo", emoji: "🖥️", desc: "Show your product" },
  { id: "executive", label: "Executive Approval", emoji: "👔", desc: "Get leadership buy-in" },
  { id: "job-interview", label: "Job Interview", emoji: "💼", desc: "Land the role" },
  { id: "partnership", label: "Partnership Pitch", emoji: "🔗", desc: "Propose collaboration" },
  { id: "internal", label: "Internal Proposal", emoji: "📋", desc: "Get team or org approval" },
  { id: "elevator", label: "Elevator Pitch", emoji: "⚡", desc: "60-second impression" },
  { id: "competition", label: "Competition Pitch", emoji: "🏆", desc: "Win a pitch contest" },
  { id: "fundraising", label: "Fundraising", emoji: "🎯", desc: "Nonprofit or community" },
];

const DURATIONS = [
  { value: "30s", label: "30 seconds", seconds: 30 },
  { value: "1m", label: "1 minute", seconds: 60 },
  { value: "3m", label: "3 minutes", seconds: 180 },
  { value: "5m", label: "5 minutes", seconds: 300 },
  { value: "10m", label: "10 minutes", seconds: 600 },
];

const MODES = [
  { value: "beginner", label: "Beginner", desc: "Supportive feedback, encouraging tone" },
  { value: "normal", label: "Normal", desc: "Balanced coaching" },
  { value: "pressure", label: "Pressure", desc: "Strict scoring, tough questions" },
] as const;

const SCORE_LABELS: Record<string, string> = {
  clarity: "Clarity",
  structure: "Structure",
  confidence: "Confidence",
  timing: "Timing",
  persuasiveness: "Persuasiveness",
  ctaStrength: "CTA Strength",
  overall: "Overall Readiness",
};

const SCORE_COLORS: Record<string, string> = {
  clarity: "#0056D2",
  structure: "#7B61FF",
  confidence: "#00B37D",
  timing: "#F5A623",
  persuasiveness: "#E53935",
  ctaStrength: "#00B37D",
  overall: "#0056D2",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type FlowState =
  | "type-select"
  | "setup"
  | "one-sentence"
  | "one-sentence-eval"
  | "ready"
  | "recording"
  | "transcribing"
  | "analyzing"
  | "qa"
  | "done";

interface Setup {
  pitchType: string;
  pitchTypeLabel: string;
  audience: string;
  goal: string;
  ask: string;
  duration: string;
  mode: "beginner" | "normal" | "pressure";
}

interface PitchScores {
  clarity: number;
  structure: number;
  confidence: number;
  timing: number;
  persuasiveness: number;
  ctaStrength: number;
  overall: number;
}

interface PitchResult {
  scores: PitchScores;
  fillerWords: { count: number; words: string[] };
  wpm: number;
  strengths: string[];
  improvements: string[];
  aiFeedback: string;
  practiceAssignment: string;
  suggestedRewrite?: string;
}

interface QAQuestion {
  q: string;
  hint: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function scoreColor(score: number) {
  if (score >= 80) return "#00B37D";
  if (score >= 60) return "#F5A623";
  return "#E53935";
}

function scoreLabel(score: number) {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 55) return "Developing";
  return "Needs Work";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{label}</span>
        <span className="text-xs font-bold" style={{ color }}>{score}/100</span>
      </div>
      <div className="h-2 rounded-full" style={{ background: "var(--border)" }}>
        <div
          className="h-2 rounded-full transition-all duration-700"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PitchCoachPage() {
  const [flow, setFlow] = useState<FlowState>("type-select");
  const [setup, setSetup] = useState<Setup>({
    pitchType: "",
    pitchTypeLabel: "",
    audience: "",
    goal: "",
    ask: "",
    duration: "3m",
    mode: "normal",
  });

  // One-sentence
  const [oneSentence, setOneSentence] = useState("");
  const [oneSentenceEval, setOneSentenceEval] = useState("");
  const [oneSentenceLoading, setOneSentenceLoading] = useState(false);

  // Recording
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState<PitchResult | null>(null);

  // Q&A
  const [qaQuestions, setQaQuestions] = useState<QAQuestion[]>([]);
  const [qaAnswers, setQaAnswers] = useState<string[]>(["", "", ""]);
  const [qaIndex, setQaIndex] = useState(0);
  const [qaLoading, setQaLoading] = useState(false);

  const [error, setError] = useState("");

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // ── Recording logic ──
  async function startRecording() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.start(250);
      mediaRecorderRef.current = mr;
      setSeconds(0);
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
      setFlow("recording");
    } catch {
      setError("Microphone access denied. Please allow microphone access and try again.");
    }
  }

  async function stopRecording() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    mr.stop();
    mr.stream.getTracks().forEach((t) => t.stop());
    setFlow("transcribing");

    await new Promise<void>((res) => { mr.onstop = () => res(); });

    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    const fd = new FormData();
    fd.append("audio", blob, "pitch.webm");

    try {
      const txRes = await fetch("/api/practice/transcribe", { method: "POST", body: fd });
      const txData = await txRes.json();
      if (!txRes.ok || !txData.transcript) throw new Error(txData.error ?? "Transcription failed");
      setTranscript(txData.transcript);
      setFlow("analyzing");
      await analyzeTranscript(txData.transcript);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setFlow("ready");
    }
  }

  async function analyzeTranscript(tx: string) {
    try {
      const res = await fetch("/api/pitch/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: tx,
          pitchType: setup.pitchTypeLabel,
          audience: setup.audience,
          ask: setup.ask,
          mode: setup.mode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");
      setResult(data);
      await loadQA(tx);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Analysis failed");
      setFlow("ready");
    }
  }

  async function loadQA(tx: string) {
    setQaLoading(true);
    setFlow("qa");
    try {
      const res = await fetch("/api/pitch/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: tx,
          pitchType: setup.pitchTypeLabel,
          audience: setup.audience,
          ask: setup.ask,
          mode: setup.mode,
        }),
      });
      const data = await res.json();
      setQaQuestions(data.questions ?? []);
    } catch {
      setQaQuestions([]);
    } finally {
      setQaLoading(false);
      setQaIndex(0);
      setQaAnswers(["", "", ""]);
    }
  }

  async function evaluateOneSentence() {
    if (!oneSentence.trim()) return;
    setOneSentenceLoading(true);
    try {
      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: `Evaluate this one-sentence pitch: "${oneSentence}"` }],
          voiceId: null,
          systemOverride: `You are a pitch coach evaluating a one-sentence pitch summary.
Evaluate: Is the idea clear? Is the audience obvious? Is the value proposition strong? Is it memorable? Is it too long?
Give 2-3 sentences of honest, specific feedback. Start with what works, then what to improve. Be direct and concise.`,
        }),
      });
      const data = await res.json();
      setOneSentenceEval(data.text ?? "");
      setFlow("one-sentence-eval");
    } catch {
      setOneSentenceEval("Could not evaluate. Please continue to full rehearsal.");
      setFlow("one-sentence-eval");
    } finally {
      setOneSentenceLoading(false);
    }
  }

  function reset() {
    setFlow("type-select");
    setSetup({ pitchType: "", pitchTypeLabel: "", audience: "", goal: "", ask: "", duration: "3m", mode: "normal" });
    setOneSentence("");
    setOneSentenceEval("");
    setTranscript("");
    setResult(null);
    setQaQuestions([]);
    setQaAnswers(["", "", ""]);
    setQaIndex(0);
    setSeconds(0);
    setError("");
  }

  const targetDuration = DURATIONS.find((d) => d.value === setup.duration);

  // ── Render ──
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Pitch Rehearsal Coach</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Practice, improve, and stress-test your pitch with AI feedback.
        </p>
      </div>

      {/* Progress bar */}
      {flow !== "type-select" && flow !== "done" && (
        <div className="flex items-center gap-2">
          {["setup", "one-sentence", "ready", "recording", "qa"].map((step, i) => {
            const order = ["type-select", "setup", "one-sentence", "one-sentence-eval", "ready", "recording", "transcribing", "analyzing", "qa", "done"];
            const current = order.indexOf(flow);
            const stepOrder = order.indexOf(step);
            const done = current > stepOrder;
            const active = current === stepOrder || (step === "recording" && (flow === "transcribing" || flow === "analyzing"));
            return (
              <div key={step} className={`h-1.5 flex-1 rounded-full transition-all duration-300`}
                style={{ background: done || active ? "var(--accent)" : "var(--border)" }} />
            );
          })}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg text-sm" style={{ background: "var(--danger-bg)", color: "#E53935", border: "1px solid #FFD0D0" }}>
          <AlertCircle size={16} className="shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {/* ── Step 1: Pitch Type ── */}
      {flow === "type-select" && (
        <div>
          <p className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>What type of pitch are you rehearsing?</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PITCH_TYPES.map((pt) => (
              <button
                key={pt.id}
                onClick={() => {
                  setSetup((s) => ({ ...s, pitchType: pt.id, pitchTypeLabel: pt.label }));
                  setFlow("setup");
                }}
                className="flex flex-col items-start gap-1 p-4 rounded-xl border text-left transition-all hover:border-[var(--accent)] hover:bg-[var(--accent-bg)]"
                style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
              >
                <span className="text-2xl">{pt.emoji}</span>
                <span className="text-sm font-semibold mt-1" style={{ color: "var(--text-primary)" }}>{pt.label}</span>
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{pt.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 2: Setup ── */}
      {flow === "setup" && (
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <button onClick={() => setFlow("type-select")} className="text-sm flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>
              <ChevronLeft size={14} /> Back
            </button>
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {setup.pitchTypeLabel} — Tell us more
            </span>
          </div>

          <div className="rounded-xl p-5 space-y-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-secondary)" }}>Who is your audience?</label>
                <input
                  value={setup.audience}
                  onChange={(e) => setSetup((s) => ({ ...s, audience: e.target.value }))}
                  placeholder="e.g. Series A investors, enterprise buyers"
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-secondary)" }}>What is your main ask?</label>
                <input
                  value={setup.ask}
                  onChange={(e) => setSetup((s) => ({ ...s, ask: e.target.value }))}
                  placeholder="e.g. $500K seed funding, pilot project"
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-secondary)" }}>What is the goal of this pitch?</label>
              <input
                value={setup.goal}
                onChange={(e) => setSetup((s) => ({ ...s, goal: e.target.value }))}
                placeholder="e.g. Get a follow-up meeting, close the deal"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-secondary)" }}>Target pitch length</label>
                <select
                  value={setup.duration}
                  onChange={(e) => setSetup((s) => ({ ...s, duration: e.target.value }))}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                >
                  {DURATIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-secondary)" }}>Practice mode</label>
                <select
                  value={setup.mode}
                  onChange={(e) => setSetup((s) => ({ ...s, mode: e.target.value as Setup["mode"] }))}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                >
                  {MODES.map((m) => <option key={m.value} value={m.value}>{m.label} — {m.desc}</option>)}
                </select>
              </div>
            </div>
          </div>

          <button
            onClick={() => setFlow("one-sentence")}
            className="flex items-center gap-2 font-semibold px-6 py-2.5 rounded-lg text-sm text-white transition-colors"
            style={{ background: "var(--accent)" }}
          >
            Continue <ChevronRight size={15} />
          </button>
        </div>
      )}

      {/* ── Step 3: One-sentence check ── */}
      {(flow === "one-sentence" || flow === "one-sentence-eval") && (
        <div className="space-y-5">
          <div className="rounded-xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={16} style={{ color: "var(--accent)" }} />
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Before we begin — the one-sentence test</p>
            </div>
            <p className="text-xs mb-4" style={{ color: "var(--text-secondary)" }}>
              The strongest pitches start with a crystal-clear core idea. Explain your pitch in <strong>one sentence</strong>. No jargon. No filler.
            </p>
            <textarea
              value={oneSentence}
              onChange={(e) => setOneSentence(e.target.value)}
              placeholder={`e.g. "We help ${setup.audience || "small businesses"} ${setup.goal || "grow faster"} by ${setup.pitchTypeLabel === "Investor Pitch" ? "building the only AI tool that..." : "..."}"`}
              rows={3}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            />

            {flow === "one-sentence-eval" && oneSentenceEval && (
              <div className="mt-4 p-3 rounded-lg" style={{ background: "var(--accent-bg)", border: "1px solid var(--accent)" }}>
                <p className="text-xs font-bold mb-1" style={{ color: "var(--accent)" }}>AI Feedback</p>
                <p className="text-sm" style={{ color: "var(--text-primary)" }}>{oneSentenceEval}</p>
              </div>
            )}

            <div className="flex gap-3 mt-4">
              {flow === "one-sentence" ? (
                <>
                  <button
                    onClick={evaluateOneSentence}
                    disabled={!oneSentence.trim() || oneSentenceLoading}
                    className="flex items-center gap-2 font-semibold px-5 py-2 rounded-lg text-sm text-white transition-colors disabled:opacity-50"
                    style={{ background: "var(--accent)" }}
                  >
                    {oneSentenceLoading ? "Evaluating..." : "Evaluate"} {!oneSentenceLoading && <ArrowRight size={14} />}
                  </button>
                  <button
                    onClick={() => setFlow("ready")}
                    className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                    style={{ color: "var(--text-secondary)", border: "1px solid var(--border)" }}
                  >
                    Skip
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setFlow("ready")}
                  className="flex items-center gap-2 font-semibold px-5 py-2 rounded-lg text-sm text-white transition-colors"
                  style={{ background: "var(--accent)" }}
                >
                  Continue to Full Pitch <ChevronRight size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Step 4: Ready ── */}
      {flow === "ready" && (
        <div className="space-y-4">
          <div className="rounded-xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--accent-bg)" }}>
                <Mic size={22} style={{ color: "var(--accent)" }} />
              </div>
              <div>
                <p className="font-bold text-base mb-1" style={{ color: "var(--text-primary)" }}>Ready to rehearse</p>
                <div className="flex flex-wrap gap-3 text-xs mt-2">
                  <span className="flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>
                    <Clock size={12} /> Target: {targetDuration?.label}
                  </span>
                  <span className="flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>
                    <Target size={12} /> Mode: {MODES.find((m) => m.value === setup.mode)?.label}
                  </span>
                  <span className="flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>
                    <MessageSquare size={12} /> Ask: {setup.ask || "not set"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {setup.mode === "pressure" && (
            <div className="rounded-lg p-4 text-sm" style={{ background: "var(--warning-bg)", border: "1px solid #F5A623" }}>
              <p className="font-bold mb-1" style={{ color: "var(--warning-text)" }}>Pressure Mode Active</p>
              <p style={{ color: "var(--warning-text)" }}>After your pitch, you&apos;ll face 3 tough questions. Answer as if it&apos;s real. The AI will score strictly.</p>
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            onClick={startRecording}
            className="flex items-center gap-2 font-bold px-8 py-3 rounded-xl text-sm text-white transition-all"
            style={{ background: "var(--accent)" }}
          >
            <Mic size={16} /> Start Recording
          </button>
        </div>
      )}

      {/* ── Step 5: Recording ── */}
      {flow === "recording" && (
        <div className="rounded-xl p-6 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse" style={{ background: "var(--danger-bg)" }}>
            <Mic size={32} style={{ color: "#E53935" }} />
          </div>
          <p className="text-3xl font-mono font-bold mb-1" style={{ color: "var(--text-primary)" }}>{fmt(seconds)}</p>
          <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>
            Target: {targetDuration?.label}
            {targetDuration && seconds > targetDuration.seconds && (
              <span className="ml-2 font-semibold" style={{ color: "#F5A623" }}>Over time</span>
            )}
          </p>
          <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>Recording in progress — deliver your pitch naturally</p>
          <button
            onClick={stopRecording}
            className="flex items-center gap-2 mx-auto font-bold px-8 py-3 rounded-xl text-sm text-white"
            style={{ background: "#E53935" }}
          >
            <Square size={14} fill="white" /> Stop Recording
          </button>
        </div>
      )}

      {/* ── Loading states ── */}
      {(flow === "transcribing" || flow === "analyzing") && (
        <div className="rounded-xl p-8 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div className="flex gap-1.5 justify-center mb-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-2.5 h-2.5 rounded-full animate-bounce" style={{ background: "var(--accent)", animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
          <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
            {flow === "transcribing" ? "Transcribing your pitch..." : "Analyzing with AI..."}
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            {flow === "transcribing" ? "Converting speech to text via Whisper" : "Scoring clarity, structure, confidence, and more"}
          </p>
        </div>
      )}

      {/* ── Step 6: Q&A ── */}
      {flow === "qa" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} style={{ color: "var(--accent)" }} />
            <h2 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>Tough Q&amp;A Round</h2>
          </div>

          {qaLoading ? (
            <div className="rounded-xl p-6 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="flex gap-1.5 justify-center mb-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ background: "var(--accent)", animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Generating tough questions based on your pitch...</p>
            </div>
          ) : qaQuestions.length > 0 ? (
            <div className="rounded-xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "var(--accent-bg)", color: "var(--accent)" }}>
                  Question {qaIndex + 1} of {qaQuestions.length}
                </span>
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Answer as you would in the real moment</span>
              </div>

              <p className="font-semibold text-base mb-1" style={{ color: "var(--text-primary)" }}>
                {qaQuestions[qaIndex]?.q}
              </p>
              {qaQuestions[qaIndex]?.hint && (
                <p className="text-xs mb-4 italic" style={{ color: "var(--text-secondary)" }}>
                  Tip: {qaQuestions[qaIndex].hint}
                </p>
              )}

              <textarea
                value={qaAnswers[qaIndex]}
                onChange={(e) => setQaAnswers((prev) => { const a = [...prev]; a[qaIndex] = e.target.value; return a; })}
                placeholder="Type your answer here..."
                rows={4}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
                style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              />

              <div className="flex gap-3 mt-4">
                {qaIndex < qaQuestions.length - 1 ? (
                  <button
                    onClick={() => setQaIndex((i) => i + 1)}
                    className="flex items-center gap-2 font-semibold px-5 py-2 rounded-lg text-sm text-white"
                    style={{ background: "var(--accent)" }}
                  >
                    Next Question <ChevronRight size={14} />
                  </button>
                ) : (
                  <button
                    onClick={() => setFlow("done")}
                    className="flex items-center gap-2 font-semibold px-5 py-2 rounded-lg text-sm text-white"
                    style={{ background: "#00B37D" }}
                  >
                    <CheckCircle size={14} /> View Full Report
                  </button>
                )}
                <button
                  onClick={() => setFlow("done")}
                  className="text-sm px-4 py-2 rounded-lg"
                  style={{ color: "var(--text-secondary)", border: "1px solid var(--border)" }}
                >
                  Skip to Report
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl p-5 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Could not generate questions. Proceeding to report.</p>
              <button onClick={() => setFlow("done")} className="mt-3 text-sm font-semibold px-4 py-2 rounded-lg text-white" style={{ background: "var(--accent)" }}>
                View Report
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Step 7: Done — Full Report ── */}
      {flow === "done" && result && (
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>Pitch Rehearsal Report</h2>
            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors"
                style={{ color: "var(--text-secondary)", borderColor: "var(--border)" }}
              >
                <Printer size={13} /> Print
              </button>
              <button
                onClick={reset}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors"
                style={{ color: "var(--text-secondary)", borderColor: "var(--border)" }}
              >
                <RotateCcw size={13} /> Start Over
              </button>
            </div>
          </div>

          {/* Overall score ring */}
          <div className="rounded-xl p-6 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="w-28 h-28 rounded-full flex flex-col items-center justify-center mx-auto mb-3"
              style={{ border: `6px solid ${scoreColor(result.scores.overall)}`, background: "var(--bg-secondary)" }}>
              <span className="text-3xl font-black" style={{ color: scoreColor(result.scores.overall) }}>{result.scores.overall}</span>
              <span className="text-[10px] font-semibold" style={{ color: "var(--text-secondary)" }}>/100</span>
            </div>
            <p className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>
              Pitch Readiness: <span style={{ color: scoreColor(result.scores.overall) }}>{scoreLabel(result.scores.overall)}</span>
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>{setup.pitchTypeLabel} · {setup.audience || "General audience"} · {MODES.find((m) => m.value === setup.mode)?.label} mode</p>
            {result.wpm > 0 && (
              <div className="flex gap-6 justify-center mt-3">
                <div>
                  <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{result.wpm}</p>
                  <p className="text-[10px]" style={{ color: "var(--text-secondary)" }}>words/min</p>
                </div>
                <div>
                  <p className="text-lg font-bold" style={{ color: result.fillerWords.count > 5 ? "#E53935" : "#00B37D" }}>{result.fillerWords.count}</p>
                  <p className="text-[10px]" style={{ color: "var(--text-secondary)" }}>filler words</p>
                </div>
                <div>
                  <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{fmt(seconds)}</p>
                  <p className="text-[10px]" style={{ color: "var(--text-secondary)" }}>recorded</p>
                </div>
              </div>
            )}
          </div>

          {/* Score breakdown */}
          <div className="rounded-xl p-5 space-y-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-secondary)" }}>Score Breakdown</p>
            {Object.entries(result.scores).filter(([k]) => k !== "overall").map(([key, val]) => (
              <ScoreBar key={key} label={SCORE_LABELS[key] ?? key} score={val as number} color={SCORE_COLORS[key] ?? "var(--accent)"} />
            ))}
          </div>

          {/* Strengths & Improvements */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl p-4" style={{ background: "var(--success-bg)", border: "1px solid #B2E8D6" }}>
              <p className="text-xs font-bold mb-3" style={{ color: "#00B37D" }}>What Works</p>
              <ul className="space-y-2">
                {result.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--success-text)" }}>
                    <CheckCircle size={14} className="shrink-0 mt-0.5" style={{ color: "#00B37D" }} /> {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl p-4" style={{ background: "var(--warning-bg)", border: "1px solid #FFE4A0" }}>
              <p className="text-xs font-bold mb-3" style={{ color: "var(--warning-text)" }}>Improve These</p>
              <ul className="space-y-2">
                {result.improvements.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--warning-text)" }}>
                    <AlertCircle size={14} className="shrink-0 mt-0.5" style={{ color: "#F5A623" }} /> {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* AI Feedback */}
          <div className="rounded-xl p-4" style={{ background: "var(--accent-bg)", border: "1px solid var(--accent)" }}>
            <p className="text-xs font-bold mb-2" style={{ color: "var(--accent)" }}>Coach Feedback</p>
            <p className="text-sm" style={{ color: "var(--text-primary)" }}>{result.aiFeedback}</p>
          </div>

          {/* Suggested rewrite */}
          {result.suggestedRewrite && (
            <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <p className="text-xs font-bold mb-2" style={{ color: "var(--text-secondary)" }}>Suggested Rewrite — Weakest Section</p>
              <p className="text-sm italic" style={{ color: "var(--text-primary)" }}>&ldquo;{result.suggestedRewrite}&rdquo;</p>
            </div>
          )}

          {/* Filler words */}
          {result.fillerWords.words.length > 0 && (
            <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <p className="text-xs font-bold mb-2" style={{ color: "var(--text-secondary)" }}>Filler Words Detected ({result.fillerWords.count})</p>
              <div className="flex flex-wrap gap-2">
                {result.fillerWords.words.map((w, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "var(--danger-bg)", color: "#E53935" }}>{w}</span>
                ))}
              </div>
            </div>
          )}

          {/* Q&A review */}
          {qaQuestions.length > 0 && (
            <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <p className="text-xs font-bold mb-3" style={{ color: "var(--text-secondary)" }}>Tough Q&amp;A Review</p>
              <div className="space-y-4">
                {qaQuestions.map((qa, i) => (
                  <div key={i}>
                    <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Q{i + 1}: {qa.q}</p>
                    {qaAnswers[i] && (
                      <p className="text-xs p-2 rounded-lg" style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}>
                        {qaAnswers[i]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Practice assignment */}
          <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 mb-2">
              <Zap size={14} style={{ color: "var(--accent)" }} />
              <p className="text-xs font-bold" style={{ color: "var(--accent)" }}>Your Practice Assignment</p>
            </div>
            <p className="text-sm" style={{ color: "var(--text-primary)" }}>{result.practiceAssignment}</p>
          </div>

          {/* Transcript */}
          {transcript && (
            <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <p className="text-xs font-bold mb-2" style={{ color: "var(--text-secondary)" }}>Transcript</p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-primary)" }}>{transcript}</p>
            </div>
          )}

          {/* Retry */}
          <div className="flex gap-3">
            <button
              onClick={() => { setFlow("ready"); setResult(null); setTranscript(""); setSeconds(0); }}
              className="flex items-center gap-2 font-semibold px-6 py-2.5 rounded-lg text-sm text-white"
              style={{ background: "var(--accent)" }}
            >
              <Mic size={14} /> Rehearse Again
            </button>
            <button
              onClick={reset}
              className="flex items-center gap-2 font-medium px-5 py-2.5 rounded-lg text-sm border"
              style={{ color: "var(--text-secondary)", borderColor: "var(--border)" }}
            >
              <RotateCcw size={14} /> New Pitch
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
