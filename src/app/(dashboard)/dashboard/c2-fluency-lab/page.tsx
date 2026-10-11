"use client";
import { useState, useRef, useEffect } from "react";
import {
  Mic, Square, Loader2, GraduationCap, ArrowLeft, RotateCcw, Sparkles,
  CheckCircle, AlertCircle, TrendingUp, BookOpen, Volume2, Music, Zap,
  MessageSquare, Target, Repeat, Lightbulb, Printer, Play, Pause,
  CalendarDays, Flame, ListChecks,
} from "lucide-react";

// ─── Scenarios ────────────────────────────────────────────────────────────────
interface Scenario {
  id: string;
  label: string;
  emoji: string;
  desc: string;
  prompts: string[];
}

const SCENARIOS: Scenario[] = [
  { id: "executive", label: "Executive Meeting", emoji: "👔", desc: "Speak with authority to leadership",
    prompts: ["Summarize this quarter's performance and your top priority for next quarter.", "Convince the leadership team to invest in a new initiative.", "Explain a setback and your recovery plan."] },
  { id: "investor", label: "Investor Pitch", emoji: "💰", desc: "Persuade investors with clarity",
    prompts: ["Pitch your company in 90 seconds.", "Explain why now is the right time for your product.", "Answer: 'What stops a big competitor from copying you?'"] },
  { id: "interview", label: "Job Interview", emoji: "💼", desc: "Sound sharp and confident",
    prompts: ["Tell me about yourself.", "Describe a time you led through ambiguity.", "Why should we hire you over other strong candidates?"] },
  { id: "academic", label: "Academic Discussion", emoji: "🎓", desc: "Discuss complex ideas precisely",
    prompts: ["Explain a concept from your field to a smart non-expert.", "Defend a position on a debated topic in your discipline.", "Critique a common assumption in your field."] },
  { id: "debate", label: "Debate", emoji: "⚖️", desc: "Argue under pressure",
    prompts: ["Argue that remote work harms innovation.", "Defend strict AI regulation.", "Argue both sides of: social media does more harm than good."] },
  { id: "sales", label: "Sales Presentation", emoji: "🤝", desc: "Win the customer",
    prompts: ["Present your product's value to a skeptical buyer.", "Handle the objection: 'It's too expensive.'", "Explain your differentiator in one minute."] },
  { id: "conference", label: "Conference Talk", emoji: "🎤", desc: "Engage a large audience",
    prompts: ["Open a talk with a hook about your topic.", "Explain your big idea worth spreading.", "Close your talk with a memorable call to action."] },
  { id: "difficult", label: "Difficult Conversation", emoji: "🌡️", desc: "Stay calm and tactful",
    prompts: ["Give critical feedback to an underperforming colleague.", "Decline a request from your manager diplomatically.", "Address a conflict between two team members."] },
  { id: "networking", label: "Networking", emoji: "🥂", desc: "Connect naturally",
    prompts: ["Introduce yourself and what you do at an event.", "Explain what makes your work interesting.", "Follow up after meeting someone you'd like to work with."] },
  { id: "podcast", label: "Podcast Guest", emoji: "🎙️", desc: "Speak naturally and engagingly",
    prompts: ["Answer: 'What's a belief you've changed your mind about?'", "Tell a story that shaped your career.", "Give your hot take on a trend in your industry."] },
  { id: "c2-exam", label: "C2 Exam-Style", emoji: "📝", desc: "Exam-style long turn",
    prompts: ["Speak for 2 minutes on: does technology bring people together or push them apart?", "Discuss the advantages and disadvantages of globalization.", "To what extent should governments fund the arts?"] },
];

// ─── Challenge modes ──────────────────────────────────────────────────────────
interface Challenge {
  id: string;
  label: string;
  emoji: string;
  desc: string;
  task: string;         // what the user sees / speaks to
  instruction: string;  // sent to the analyzer to weight scoring
}

const CHALLENGES: Challenge[] = [
  { id: "abstract", label: "Abstract Topic", emoji: "🧠", desc: "Speak about complex ideas",
    task: "Speak for 90 seconds: “What does it really mean to live a good life?”",
    instruction: "Evaluate how well the speaker handles an abstract, intellectual topic with depth, nuance, and clear structure." },
  { id: "nuance", label: "Nuance Challenge", emoji: "⚖️", desc: "Explain both sides fairly",
    task: "Pick a debated topic and explain BOTH sides fairly before giving your view.",
    instruction: "Evaluate balance, fairness, and the ability to express nuance and concession ('admittedly', 'that said', 'on the other hand')." },
  { id: "precision", label: "Precision Challenge", emoji: "🎯", desc: "No vague words allowed",
    task: "Explain your work WITHOUT using vague words like 'thing', 'stuff', 'good', 'important', 'very', 'a lot'.",
    instruction: "Penalize any vague or filler vocabulary heavily. Reward precise, specific word choice." },
  { id: "debate", label: "Debate Under Pressure", emoji: "🔥", desc: "Defend an argument",
    task: "Defend this: “Remote work harms long-term innovation.” Make your strongest case.",
    instruction: "Evaluate persuasiveness, rebuttal strength, confidence, and rhetorical control under pressure." },
  { id: "executive", label: "Executive Summary", emoji: "⏱️", desc: "Complex idea in 60s",
    task: "Explain a complex topic you know well in 60 seconds, as if to a busy executive.",
    instruction: "Evaluate concision, prioritization, and clarity. Reward leading with the key point and cutting filler." },
  { id: "idiom", label: "Idiom Challenge", emoji: "💬", desc: "Use natural expressions",
    task: "Tell a short story and naturally use at least 3 idioms or phrasal verbs.",
    instruction: "Evaluate idiomatic control — natural, correct use of idioms, collocations, and phrasal verbs. Flag any forced or misused expressions." },
  { id: "story", label: "Storytelling", emoji: "📖", desc: "Tell a compelling story",
    task: "Tell a 2-minute story about a turning point in your life, with emotion and a clear arc.",
    instruction: "Evaluate narrative structure, emotional engagement, pacing, and vivid, natural language." },
  { id: "formal-natural", label: "Formal → Natural", emoji: "🔁", desc: "Sound spoken, not written",
    task: "Explain a formal/technical topic in natural, spoken English — like talking to a friend.",
    instruction: "Evaluate how spoken and natural the delivery is vs. textbook/written style. Reward contractions, rhythm, and conversational flow." },
  { id: "hostile-qa", label: "Hostile Q&A", emoji: "🛡️", desc: "Stay calm under fire",
    task: "Answer calmly: “Honestly, why should anyone trust your judgment on this?”",
    instruction: "Evaluate composure, diplomacy, confidence, and the ability to reframe a hostile question gracefully." },
  { id: "spontaneous", label: "Spontaneous Speaking", emoji: "⚡", desc: "No preparation",
    task: "Speak for 60 seconds on a random topic: “Should cities ban cars from their centers?”",
    instruction: "Evaluate fluency and coherence with no preparation — flag hesitation, restarts, and loss of structure." },
];

// ─── Think in English prompts ─────────────────────────────────────────────────
const THINK_PROMPTS: string[] = [
  "Explain your opinion on remote work in 30 seconds.",
  "Give three reasons people procrastinate.",
  "Respond politely to someone who disagrees with you.",
  "Summarize what you did last weekend in one sentence.",
  "Describe your city without using the words 'nice', 'good', or 'big'.",
  "Argue why reading is better than watching videos.",
  "Explain how to make your favorite meal.",
  "What's the most important skill for the next 10 years? Why?",
  "Persuade me to visit your country.",
  "Describe your job to a 10-year-old.",
  "What would you change about your morning routine?",
  "Give your honest opinion on social media in 20 seconds.",
  "Explain a difficult concept from your field simply.",
  "React to this: 'Money can't buy happiness.'",
  "Tell me about a goal you have and your first step toward it.",
];

// ─── Score config ─────────────────────────────────────────────────────────────
const SCORE_META: { key: string; label: string; color: string }[] = [
  { key: "fluency", label: "Fluency", color: "var(--accent)" },
  { key: "precision", label: "Precision", color: "#7B61FF" },
  { key: "complexity", label: "Complexity", color: "var(--accent)" },
  { key: "naturalness", label: "Naturalness", color: "#00B37D" },
  { key: "pronunciationClarity", label: "Pronunciation Clarity", color: "var(--accent)" },
  { key: "intonation", label: "Intonation", color: "#F5A623" },
  { key: "rhythm", label: "Rhythm", color: "#F5A623" },
  { key: "vocabularyRange", label: "Vocabulary Range", color: "#7B61FF" },
  { key: "idiomaticControl", label: "Idiomatic Control", color: "#E53935" },
  { key: "discourseControl", label: "Discourse Control", color: "#00B37D" },
  { key: "confidence", label: "Confidence", color: "#00B37D" },
  { key: "culturalAppropriateness", label: "Cultural Appropriateness", color: "#7B61FF" },
];

// Maps a weak score dimension to the drill that best targets it.
const DIMENSION_FIX: Record<string, { challengeId?: string; tip: string }> = {
  fluency: { challengeId: "spontaneous", tip: "Build flow with spontaneous, unprepared speaking." },
  precision: { challengeId: "precision", tip: "Ban vague words — force specific, accurate vocabulary." },
  complexity: { challengeId: "abstract", tip: "Stretch your sentence structure on abstract topics." },
  naturalness: { challengeId: "formal-natural", tip: "Convert textbook English into natural spoken English." },
  pronunciationClarity: { tip: "Practice scenarios and use the shadowing playback to sharpen clarity." },
  intonation: { tip: "Shadow the C2 sentences and exaggerate stress on key words." },
  rhythm: { tip: "Shadow at natural speed to internalize native-like timing." },
  vocabularyRange: { challengeId: "precision", tip: "Review your vocabulary upgrades and reuse them aloud." },
  idiomaticControl: { challengeId: "idiom", tip: "Run the Idiom Challenge to use expressions naturally." },
  discourseControl: { challengeId: "executive", tip: "Use the Executive Summary drill for tight structure." },
  confidence: { challengeId: "hostile-qa", tip: "Build composure with the Hostile Q&A challenge." },
  culturalAppropriateness: { challengeId: "difficult", tip: "Practice tactful Difficult Conversations." },
};

interface C2SessionRow {
  id: number;
  scenario: string;
  challenge: string;
  current_level: string;
  c2_readiness: number;
  scores: Record<string, number>;
  keeps_below: string[];
  created_at: string;
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface C2Result {
  currentLevel: string;
  targetLevel: string;
  c2Readiness: number;
  scores: Record<string, number>;
  fillerWords: { count: number; words: string[] };
  wpm: number;
  nativeRewrite: { original: string; c2Version: string; whyBetter: string[] };
  vocabularyUpgrades: { basic: string; upgrade: string; note: string }[];
  collocationFixes: { instead: string; use: string; note: string }[];
  fluencyGaps: string[];
  intonationCoaching: string;
  pronunciationFeedback: string;
  didWell: string[];
  keepsBelowC2: string[];
  practiceAssignment: string;
  shadowingSentence: string;
}

type Flow =
  | "scenario" | "ready" | "recording" | "transcribing" | "analyzing" | "report"
  | "think-intro" | "think-prompt" | "think-recording" | "think-transcribing" | "think-feedback";

type LandingTab = "scenarios" | "challenges" | "think" | "plan";

interface ThinkFeedback {
  naturalness: number;
  speed: number;
  hesitation: number;
  verdict: string;
  betterAnswer: string;
  oneFix: string;
  responseDelaySec: number | null;
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, "0")}`;
}
function readinessColor(v: number) {
  if (v >= 85) return "#00B37D";
  if (v >= 70) return "#0056D2";
  if (v >= 55) return "#F5A623";
  return "#E53935";
}

function dayKey(iso: string) { return new Date(iso).toISOString().slice(0, 10); }

interface FluencyPlan {
  total: number;
  weekCount: number;
  latest: number;
  avgReadiness: number;
  trend: number;
  streak: number;
  weakAreas: { key: string; label: string; avg: number; tip: string; challengeId?: string }[];
  recent: { value: number; date: string }[];
}

function computePlan(sessions: C2SessionRow[]): FluencyPlan {
  const now = Date.now();
  const weekAgo = now - 7 * 86400000;
  const week = sessions.filter((s) => new Date(s.created_at).getTime() >= weekAgo);
  const recentN = sessions.slice(0, 8);
  const avgReadiness = recentN.length
    ? Math.round(recentN.reduce((a, s) => a + (s.c2_readiness || 0), 0) / recentN.length) : 0;

  // Trend: last 3 vs previous 3
  const last3 = sessions.slice(0, 3);
  const prev3 = sessions.slice(3, 6);
  const avg = (arr: C2SessionRow[]) => arr.length ? arr.reduce((a, s) => a + (s.c2_readiness || 0), 0) / arr.length : 0;
  const trend = last3.length && prev3.length ? Math.round(avg(last3) - avg(prev3)) : 0;

  // Streak of consecutive days ending today or yesterday
  const days = new Set(sessions.map((s) => dayKey(s.created_at)));
  let streak = 0;
  const d = new Date();
  if (!days.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1);
  while (days.has(d.toISOString().slice(0, 10))) { streak++; d.setDate(d.getDate() - 1); }

  // Weakest dimensions averaged across recent sessions
  const sums: Record<string, { total: number; n: number }> = {};
  for (const s of recentN) {
    for (const m of SCORE_META) {
      const v = s.scores?.[m.key];
      if (typeof v === "number") {
        sums[m.key] = sums[m.key] || { total: 0, n: 0 };
        sums[m.key].total += v; sums[m.key].n += 1;
      }
    }
  }
  const weakAreas = SCORE_META
    .filter((m) => sums[m.key]?.n)
    .map((m) => ({ key: m.key, label: m.label, avg: Math.round(sums[m.key].total / sums[m.key].n) }))
    .sort((a, b) => a.avg - b.avg)
    .slice(0, 3)
    .map((w) => ({ ...w, tip: DIMENSION_FIX[w.key]?.tip ?? "Keep practicing this area.", challengeId: DIMENSION_FIX[w.key]?.challengeId }));

  const recent = sessions.slice(0, 8).reverse().map((s) => ({ value: s.c2_readiness || 0, date: s.created_at }));

  return { total: sessions.length, weekCount: week.length, latest: sessions[0]?.c2_readiness ?? 0, avgReadiness, trend, streak, weakAreas, recent };
}

function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
  const v = Math.max(0, Math.min(100, score || 0));
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{label}</span>
        <span className="text-xs font-bold" style={{ color }}>{v}</span>
      </div>
      <div className="h-2 rounded-full" style={{ background: "var(--border)" }}>
        <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${v}%`, background: color }} />
      </div>
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl p-5 ${className}`} style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      {children}
    </div>
  );
}

// Fetches AI voice for a line and plays it — for shadowing practice.
function ListenButton({ text, label = "Listen", filled = false }: { text: string; label?: string; filled?: boolean }) {
  const [state, setState] = useState<"idle" | "loading" | "playing">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cacheRef = useRef<string | null>(null);

  async function play() {
    if (state === "playing") { audioRef.current?.pause(); setState("idle"); return; }
    try {
      let b64 = cacheRef.current;
      if (!b64) {
        setState("loading");
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        const data = await res.json();
        if (!res.ok || !data.audio) throw new Error(data.error || "TTS failed");
        b64 = data.audio as string;
        cacheRef.current = b64;
      }
      const audio = new Audio(`data:audio/mpeg;base64,${b64}`);
      audioRef.current = audio;
      audio.onended = () => setState("idle");
      audio.onerror = () => setState("idle");
      setState("playing");
      await audio.play().catch(() => setState("idle"));
    } catch {
      setState("idle");
    }
  }

  const baseStyle = filled
    ? { background: "var(--accent)", color: "#fff", border: "none" }
    : { background: "var(--bg-card)", color: "var(--accent)", border: "1px solid var(--accent)" };

  return (
    <button onClick={play} disabled={state === "loading"}
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
      style={baseStyle}>
      {state === "loading" ? <Loader2 size={13} className="animate-spin" />
        : state === "playing" ? <Pause size={13} />
        : <Play size={13} />}
      {state === "loading" ? "Loading…" : state === "playing" ? "Stop" : label}
    </button>
  );
}

export default function C2FluencyLabPage() {
  const [flow, setFlow] = useState<Flow>("scenario");
  const [tab, setTab] = useState<LandingTab>("scenarios");
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [prompt, setPrompt] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState<C2Result | null>(null);
  const [error, setError] = useState("");

  // Think in English
  const [thinkPrompt, setThinkPrompt] = useState("");
  const [thinkRound, setThinkRound] = useState(0);
  const [thinkFeedback, setThinkFeedback] = useState<ThinkFeedback | null>(null);
  const promptShownAtRef = useRef<number>(0);
  const recordStartedAtRef = useRef<number>(0);

  // Weekly fluency plan
  const [planSessions, setPlanSessions] = useState<C2SessionRow[] | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Refresh saved sessions whenever we land back on the hub.
  useEffect(() => {
    if (flow !== "scenario") return;
    let active = true;
    fetch("/api/c2/sessions")
      .then((r) => r.json())
      .then((d) => { if (active) setPlanSessions(Array.isArray(d.sessions) ? d.sessions : []); })
      .catch(() => { if (active) setPlanSessions([]); });
    return () => { active = false; };
  }, [flow]);

  function pickScenario(s: Scenario) {
    setScenario(s);
    setChallenge(null);
    setPrompt(s.prompts[0]);
    setError("");
    setResult(null);
    setTranscript("");
    setFlow("ready");
  }

  function pickChallenge(c: Challenge) {
    // Reuse the record→analyze flow; render the challenge as a pseudo-scenario.
    setScenario({ id: c.id, label: c.label, emoji: c.emoji, desc: c.desc, prompts: [c.task] });
    setChallenge(c);
    setPrompt(c.task);
    setError("");
    setResult(null);
    setTranscript("");
    setFlow("ready");
  }

  async function startRecording() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = ["audio/webm", "audio/mp4", "audio/ogg"].find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
      const mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
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
    const mimeType = mr.mimeType || "audio/webm";
    const blob = new Blob(chunksRef.current, { type: mimeType });
    const fd = new FormData();
    fd.append("audio", blob, "c2.webm");

    try {
      const txRes = await fetch("/api/practice/transcribe", { method: "POST", body: fd });
      const txData = await txRes.json();
      if (!txRes.ok || !txData.transcript?.trim()) throw new Error(txData.error ?? "Transcription failed");
      setTranscript(txData.transcript);
      setFlow("analyzing");
      await analyze(txData.transcript);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setFlow("ready");
    }
  }

  async function analyze(tx: string) {
    try {
      const res = await fetch("/api/c2/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: tx, scenario: scenario?.label, prompt, challenge: challenge?.instruction }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");
      setResult(data);
      setFlow("report");
      // Persist for the weekly fluency plan (non-blocking)
      fetch("/api/c2/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario: scenario?.label ?? "",
          challenge: challenge?.label ?? "",
          currentLevel: data.currentLevel ?? "",
          c2Readiness: data.c2Readiness ?? 0,
          scores: data.scores ?? {},
          keepsBelowC2: data.keepsBelowC2 ?? [],
        }),
      }).catch(() => {});
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Analysis failed");
      setFlow("ready");
    }
  }

  function reset() {
    setFlow("ready");
    setResult(null);
    setTranscript("");
    setSeconds(0);
    setError("");
  }

  // ── Think in English ──
  function nextThinkPrompt() {
    const i = Math.floor((thinkRound + Date.now()) % THINK_PROMPTS.length);
    setThinkPrompt(THINK_PROMPTS[i]);
    setThinkFeedback(null);
    setTranscript("");
    setError("");
    promptShownAtRef.current = Date.now();
    setFlow("think-prompt");
  }

  function startThinkDrill() {
    setThinkRound(0);
    nextThinkPrompt();
  }

  async function startThinkRecording() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = ["audio/webm", "audio/mp4", "audio/ogg"].find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
      const mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.start(250);
      mediaRecorderRef.current = mr;
      recordStartedAtRef.current = Date.now();
      setSeconds(0);
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
      setFlow("think-recording");
    } catch {
      setError("Microphone access denied. Please allow microphone access and try again.");
    }
  }

  async function stopThinkRecording() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    const delayMs = recordStartedAtRef.current - promptShownAtRef.current;
    mr.stop();
    mr.stream.getTracks().forEach((t) => t.stop());
    setFlow("think-transcribing");

    await new Promise<void>((res) => { mr.onstop = () => res(); });
    const mimeType = mr.mimeType || "audio/webm";
    const blob = new Blob(chunksRef.current, { type: mimeType });
    const fd = new FormData();
    fd.append("audio", blob, "think.webm");

    try {
      const txRes = await fetch("/api/practice/transcribe", { method: "POST", body: fd });
      const txData = await txRes.json();
      if (!txRes.ok || !txData.transcript?.trim()) throw new Error(txData.error ?? "No speech detected — answer right away next time.");
      setTranscript(txData.transcript);
      const res = await fetch("/api/c2/think", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: txData.transcript, prompt: thinkPrompt, responseDelayMs: delayMs }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Feedback failed");
      setThinkFeedback(data);
      setThinkRound((n) => n + 1);
      setFlow("think-feedback");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setFlow("think-prompt");
    }
  }

  // ── Scenario selection ──
  if (flow === "scenario") {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <GraduationCap size={24} style={{ color: "var(--accent)" }} /> C2 Fluency Lab
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Move from “good English” to C2-level confident, natural, precise speaking. Your accent stays — your clarity, rhythm, and impact level up.
          </p>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-2 flex-wrap">
          {([
            { id: "scenarios", label: "Scenario Practice", icon: Target },
            { id: "challenges", label: "Challenge Modes", icon: Zap },
            { id: "think", label: "Think in English", icon: Sparkles },
            { id: "plan", label: "My Plan", icon: ListChecks },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full border transition-colors"
              style={tab === id
                ? { background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" }
                : { background: "var(--bg-card)", color: "var(--text-secondary)", borderColor: "var(--border)" }}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {tab === "scenarios" && (
          <div>
            <p className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Choose a speaking scenario</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {SCENARIOS.map((s) => (
                <button key={s.id} onClick={() => pickScenario(s)}
                  className="text-left rounded-xl p-4 transition-all hover:shadow-md"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{s.emoji}</span>
                    <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{s.label}</span>
                  </div>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{s.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === "challenges" && (
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Advanced speaking challenges</p>
            <p className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>Focused drills that push one specific C2 skill. Scoring weighs heavily toward the challenge goal.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {CHALLENGES.map((c) => (
                <button key={c.id} onClick={() => pickChallenge(c)}
                  className="text-left rounded-xl p-4 transition-all hover:shadow-md"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{c.emoji}</span>
                    <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{c.label}</span>
                  </div>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{c.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === "think" && (
          <Card>
            <div className="flex items-start gap-3 mb-4">
              <span className="text-3xl">⚡</span>
              <div>
                <h2 className="font-bold" style={{ color: "var(--text-primary)" }}>Think in English Mode</h2>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Stop translating. See a prompt, then answer immediately. We measure your response speed, hesitation, and how natural you sound — then give a crisp upgrade.
                </p>
              </div>
            </div>
            <ul className="text-xs space-y-1.5 mb-4" style={{ color: "var(--text-secondary)" }}>
              <li className="flex items-center gap-2"><CheckCircle size={13} style={{ color: "#00B37D" }} /> Rapid prompts, one at a time</li>
              <li className="flex items-center gap-2"><CheckCircle size={13} style={{ color: "#00B37D" }} /> Answer the moment you're ready — your delay is timed</li>
              <li className="flex items-center gap-2"><CheckCircle size={13} style={{ color: "#00B37D" }} /> Instant model answer and one fix per round</li>
            </ul>
            <button onClick={startThinkDrill}
              className="flex items-center gap-2 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors"
              style={{ background: "var(--accent)" }}>
              <Sparkles size={16} /> Start Drill
            </button>
          </Card>
        )}

        {tab === "plan" && (() => {
          if (planSessions === null) {
            return (
              <div className="flex flex-col items-center py-16" style={{ color: "var(--text-secondary)" }}>
                <Loader2 size={28} className="animate-spin mb-2" style={{ color: "var(--accent)" }} />
                <p className="text-sm">Loading your plan…</p>
              </div>
            );
          }
          if (planSessions.length === 0) {
            return (
              <Card className="text-center">
                <ListChecks size={36} className="mx-auto mb-3" style={{ color: "var(--accent)", opacity: 0.5 }} />
                <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>No data yet</p>
                <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>Complete a few C2 sessions and your personalized weekly plan will appear here.</p>
                <button onClick={() => setTab("scenarios")}
                  className="text-white font-semibold px-5 py-2.5 rounded-lg" style={{ background: "var(--accent)" }}>
                  Start a session
                </button>
              </Card>
            );
          }
          const plan = computePlan(planSessions);
          const maxBar = Math.max(100, ...plan.recent.map((r) => r.value));
          return (
            <div className="space-y-5">
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card className="text-center">
                  <p className="text-2xl font-bold" style={{ color: readinessColor(plan.latest) }}>{plan.latest}</p>
                  <p className="text-[10px]" style={{ color: "var(--text-secondary)" }}>Latest readiness</p>
                </Card>
                <Card className="text-center">
                  <p className="text-2xl font-bold flex items-center justify-center gap-1" style={{ color: "var(--text-primary)" }}>
                    {plan.avgReadiness}
                    {plan.trend !== 0 && (
                      <span className="text-xs font-bold" style={{ color: plan.trend > 0 ? "#00B37D" : "#E53935" }}>
                        {plan.trend > 0 ? "▲" : "▼"}{Math.abs(plan.trend)}
                      </span>
                    )}
                  </p>
                  <p className="text-[10px]" style={{ color: "var(--text-secondary)" }}>Avg (recent)</p>
                </Card>
                <Card className="text-center">
                  <p className="text-2xl font-bold flex items-center justify-center gap-1" style={{ color: "var(--text-primary)" }}>
                    <Flame size={18} style={{ color: "#F5A623" }} /> {plan.streak}
                  </p>
                  <p className="text-[10px]" style={{ color: "var(--text-secondary)" }}>Day streak</p>
                </Card>
                <Card className="text-center">
                  <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{plan.weekCount}</p>
                  <p className="text-[10px]" style={{ color: "var(--text-secondary)" }}>Sessions this week</p>
                </Card>
              </div>

              {/* Trend */}
              {plan.recent.length > 1 && (
                <Card>
                  <h2 className="font-bold mb-3 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                    <TrendingUp size={16} style={{ color: "var(--accent)" }} /> C2 Readiness Trend
                  </h2>
                  <div className="flex items-end gap-2 h-28">
                    {plan.recent.map((r, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full rounded-t" style={{ height: `${(r.value / maxBar) * 100}%`, background: readinessColor(r.value), minHeight: 4 }} title={`${r.value}`} />
                        <span className="text-[9px]" style={{ color: "var(--text-secondary)" }}>{new Date(r.date).toLocaleDateString("en-US", { month: "numeric", day: "numeric" })}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* This week's plan */}
              <Card>
                <h2 className="font-bold mb-1 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                  <CalendarDays size={16} style={{ color: "var(--accent)" }} /> This Week's Plan
                </h2>
                <p className="text-xs mb-4" style={{ color: "var(--text-secondary)" }}>
                  Personalized from your weakest areas. Aim for {Math.max(3, plan.weakAreas.length + 1)} sessions this week.
                </p>
                <div className="space-y-3">
                  {plan.weakAreas.map((w, i) => {
                    const ch = w.challengeId ? CHALLENGES.find((c) => c.id === w.challengeId) : null;
                    return (
                      <div key={w.key} className="flex items-start gap-3 rounded-lg p-3" style={{ background: "var(--bg-secondary)" }}>
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: "var(--accent)" }}>{i + 1}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{w.label}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: `${readinessColor(w.avg)}20`, color: readinessColor(w.avg) }}>avg {w.avg}</span>
                          </div>
                          <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{w.tip}</p>
                        </div>
                        {ch && (
                          <button onClick={() => pickChallenge(ch)}
                            className="text-xs font-semibold px-3 py-1.5 rounded-full shrink-0 transition-colors"
                            style={{ background: "var(--accent)", color: "#fff" }}>
                            Start
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {plan.weakAreas.length === 0 && (
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Strong across the board — keep practicing scenarios to stay sharp.</p>
                  )}
                </div>
              </Card>
            </div>
          );
        })()}
      </div>
    );
  }

  // ── Think in English flow ──
  if (flow === "think-prompt" || flow === "think-recording" || flow === "think-transcribing" || flow === "think-feedback") {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <button onClick={() => setFlow("scenario")} className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
            <ArrowLeft size={15} /> Exit drill
          </button>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "var(--accent-bg)", color: "var(--accent)" }}>
            Round {thinkRound + (flow === "think-feedback" ? 0 : 1)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Think in English</h1>
        </div>

        {/* Prompt */}
        <Card className="text-center !py-7">
          <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-secondary)" }}>Answer immediately</p>
          <p className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{thinkPrompt}</p>
        </Card>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg text-sm" style={{ background: "var(--danger-bg)", border: "1px solid #FFCDD2", color: "#E53935" }}>
            <AlertCircle size={15} className="shrink-0" /> {error}
          </div>
        )}

        {flow === "think-prompt" && (
          <Card className="flex flex-col items-center gap-3 text-center">
            <button onClick={startThinkRecording}
              className="w-16 h-16 rounded-full text-white flex items-center justify-center shadow-lg pulse-ring transition-colors"
              style={{ background: "var(--accent)" }}>
              <Mic size={28} />
            </button>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Tap and start talking right away</p>
          </Card>
        )}

        {flow === "think-recording" && (
          <Card className="flex flex-col items-center gap-3 text-center">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-bold text-red-500 uppercase tracking-wider">Recording — {fmt(seconds)}</span>
            </div>
            <button onClick={stopThinkRecording}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-2.5 rounded-full transition-colors">
              <Square size={16} /> Done
            </button>
          </Card>
        )}

        {flow === "think-transcribing" && (
          <Card className="flex flex-col items-center gap-3 py-6">
            <Loader2 size={32} className="animate-spin" style={{ color: "var(--accent)" }} />
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Scoring your answer…</p>
          </Card>
        )}

        {flow === "think-feedback" && thinkFeedback && (
          <>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Naturalness", v: thinkFeedback.naturalness },
                { label: "Speed", v: thinkFeedback.speed },
                { label: "No Hesitation", v: thinkFeedback.hesitation },
              ].map((m) => (
                <Card key={m.label} className="text-center">
                  <p className="text-2xl font-bold" style={{ color: readinessColor(m.v) }}>{m.v}</p>
                  <p className="text-[10px]" style={{ color: "var(--text-secondary)" }}>{m.label}</p>
                </Card>
              ))}
            </div>

            {thinkFeedback.responseDelaySec != null && (
              <p className="text-xs text-center" style={{ color: "var(--text-secondary)" }}>
                You started speaking after <strong style={{ color: "var(--text-primary)" }}>{thinkFeedback.responseDelaySec}s</strong>
                {thinkFeedback.responseDelaySec <= 2 ? " — excellent, that's native-like speed." : thinkFeedback.responseDelaySec <= 4 ? " — good, aim for under 2s." : " — try to start faster; don't translate first."}
              </p>
            )}

            <Card>
              <p className="text-sm" style={{ color: "var(--text-primary)" }}>{thinkFeedback.verdict}</p>
            </Card>

            <Card>
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--success-text)" }}>C2 model answer</p>
                <ListenButton text={thinkFeedback.betterAnswer} label="Listen" />
              </div>
              <p className="text-sm font-medium mb-3" style={{ color: "var(--text-primary)" }}>“{thinkFeedback.betterAnswer}”</p>
              <p className="text-xs flex items-start gap-1.5" style={{ color: "var(--text-secondary)" }}>
                <Lightbulb size={13} className="mt-0.5 shrink-0" style={{ color: "#F5A623" }} /> {thinkFeedback.oneFix}
              </p>
            </Card>

            <div className="flex gap-3 justify-center pb-4">
              <button onClick={() => setFlow("scenario")}
                className="text-sm font-semibold px-5 py-2.5 rounded-lg border transition-colors"
                style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                Finish
              </button>
              <button onClick={nextThinkPrompt}
                className="flex items-center gap-2 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors"
                style={{ background: "var(--accent)" }}>
                Next Prompt <ArrowLeft size={15} className="rotate-180" />
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // ── Ready / recording ──
  if (flow === "ready" || flow === "recording" || flow === "transcribing" || flow === "analyzing") {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <button onClick={() => setFlow("scenario")} className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
          <ArrowLeft size={15} /> Change scenario
        </button>

        <div className="flex items-center gap-3">
          <span className="text-2xl">{scenario?.emoji}</span>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{scenario?.label}</h1>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{scenario?.desc}</p>
          </div>
        </div>

        {/* Prompt picker */}
        <Card>
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-secondary)" }}>Speaking prompt</p>
          <div className="space-y-2 mb-3">
            {scenario?.prompts.map((p) => (
              <button key={p} onClick={() => setPrompt(p)}
                className="w-full text-left text-sm rounded-lg px-3 py-2 transition-colors"
                style={prompt === p
                  ? { background: "var(--accent-bg)", border: "1px solid var(--accent)", color: "var(--accent)" }
                  : { background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
                {p}
              </button>
            ))}
          </div>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={2}
            placeholder="Or write your own prompt…"
            className="w-full rounded-lg px-3 py-2 text-sm"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
        </Card>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg text-sm" style={{ background: "var(--danger-bg)", border: "1px solid #FFCDD2", color: "#E53935" }}>
            <AlertCircle size={15} className="shrink-0" /> {error}
          </div>
        )}

        {/* Recorder */}
        <Card className="flex flex-col items-center gap-4 text-center">
          {flow === "ready" && (
            <>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Speak for 1–5 minutes. Aim for natural, structured, precise delivery.</p>
              <button onClick={startRecording}
                className="w-20 h-20 rounded-full text-white flex items-center justify-center shadow-lg pulse-ring transition-colors"
                style={{ background: "var(--accent)" }}>
                <Mic size={34} />
              </button>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Tap to start recording</p>
            </>
          )}
          {flow === "recording" && (
            <>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-bold text-red-500 uppercase tracking-wider">Recording — {fmt(seconds)}</span>
              </div>
              <div className="flex items-end gap-0.5 h-10">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={i} className="wave-bar w-1 rounded-full" style={{ height: "28px", background: "var(--accent)" }} />
                ))}
              </div>
              <button onClick={stopRecording}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-3 rounded-full transition-colors">
                <Square size={18} /> Stop & Analyze
              </button>
            </>
          )}
          {(flow === "transcribing" || flow === "analyzing") && (
            <div className="flex flex-col items-center gap-3 py-4">
              <Loader2 size={36} className="animate-spin" style={{ color: "var(--accent)" }} />
              <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                {flow === "transcribing" ? "Transcribing your speech…" : "Running C2-level analysis…"}
              </p>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {flow === "transcribing" ? "Converting audio to text" : "Scoring fluency, naturalness, rhythm, and more"}
              </p>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // ── Report ──
  if (flow === "report" && result) {
    const r = result;
    return (
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{scenario?.emoji}</span>
            <div>
              <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>C2 Fluency Report</h1>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{scenario?.label}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => window.print()}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded border transition-colors"
              style={{ color: "var(--text-secondary)", borderColor: "var(--border)" }}>
              <Printer size={13} /> Print
            </button>
            <button onClick={reset}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded text-white transition-colors"
              style={{ background: "var(--accent)" }}>
              <RotateCcw size={13} /> Try Again
            </button>
          </div>
        </div>

        {/* Readiness + levels */}
        <Card>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative shrink-0" style={{ width: 130, height: 130 }}>
              <svg width="130" height="130" viewBox="0 0 130 130" className="-rotate-90">
                <circle cx="65" cy="65" r="58" fill="none" stroke="var(--border)" strokeWidth="10" />
                <circle cx="65" cy="65" r="58" fill="none" stroke={readinessColor(r.c2Readiness)} strokeWidth="10"
                  strokeLinecap="round" strokeDasharray={2 * Math.PI * 58}
                  strokeDashoffset={(2 * Math.PI * 58) * (1 - (r.c2Readiness || 0) / 100)}
                  style={{ transition: "stroke-dashoffset 1s ease-out" }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{r.c2Readiness}</span>
                <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>C2 Readiness</span>
              </div>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
                <div>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Current level</p>
                  <p className="text-2xl font-bold" style={{ color: "var(--accent)" }}>{r.currentLevel}</p>
                </div>
                <TrendingUp size={20} style={{ color: "var(--text-secondary)" }} />
                <div>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Target</p>
                  <p className="text-2xl font-bold" style={{ color: "#00B37D" }}>{r.targetLevel}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 justify-center sm:justify-start text-xs" style={{ color: "var(--text-secondary)" }}>
                {r.wpm > 0 && <span>{r.wpm} wpm</span>}
                {r.fillerWords?.count > 0 && (
                  <span>{r.fillerWords.count} filler{r.fillerWords.count !== 1 ? "s" : ""}{r.fillerWords.words?.length ? ` — ${r.fillerWords.words.map((w) => `"${w}"`).join(", ")}` : ""}</span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Scores */}
        <Card>
          <h2 className="font-bold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Target size={16} style={{ color: "var(--accent)" }} /> C2 Score Breakdown
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            {SCORE_META.map((m) => (
              <ScoreBar key={m.key} label={m.label} score={r.scores?.[m.key] ?? 0} color={m.color} />
            ))}
          </div>
        </Card>

        {/* Native-like rewrite */}
        {r.nativeRewrite && (
          <Card>
            <h2 className="font-bold mb-3 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <Sparkles size={16} style={{ color: "var(--accent)" }} /> Native-Like Rewrite
            </h2>
            <div className="space-y-3">
              <div className="rounded-lg p-3" style={{ background: "var(--bg-secondary)" }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-secondary)" }}>You said</p>
                <p className="text-sm italic" style={{ color: "var(--text-secondary)" }}>“{r.nativeRewrite.original}”</p>
              </div>
              <div className="rounded-lg p-3" style={{ background: "var(--success-bg)", border: "1px solid #00B37D" }}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--success-text)" }}>C2-level version</p>
                  <ListenButton text={r.nativeRewrite.c2Version} label="Listen" />
                </div>
                <p className="text-sm font-medium" style={{ color: "var(--success-text)" }}>“{r.nativeRewrite.c2Version}”</p>
              </div>
              {r.nativeRewrite.whyBetter?.length > 0 && (
                <ul className="space-y-1">
                  {r.nativeRewrite.whyBetter.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                      <CheckCircle size={13} className="mt-0.5 shrink-0" style={{ color: "#00B37D" }} /> {w}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        )}

        {/* Vocabulary upgrades */}
        {r.vocabularyUpgrades?.length > 0 && (
          <Card>
            <h2 className="font-bold mb-3 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <BookOpen size={16} style={{ color: "#7B61FF" }} /> C2 Vocabulary Upgrade
            </h2>
            <div className="space-y-2">
              {r.vocabularyUpgrades.map((v, i) => (
                <div key={i} className="rounded-lg p-3" style={{ background: "var(--bg-secondary)" }}>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-sm line-through" style={{ color: "var(--text-secondary)" }}>{v.basic}</span>
                    <ArrowLeft size={12} className="rotate-180" style={{ color: "#7B61FF" }} />
                    <span className="text-sm font-bold" style={{ color: "#7B61FF" }}>{v.upgrade}</span>
                  </div>
                  {v.note && <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{v.note}</p>}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Collocation coach */}
        {r.collocationFixes?.length > 0 && (
          <Card>
            <h2 className="font-bold mb-3 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <MessageSquare size={16} style={{ color: "var(--accent)" }} /> Collocation Coach
            </h2>
            <div className="space-y-2">
              {r.collocationFixes.map((c, i) => (
                <div key={i} className="text-sm flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded" style={{ background: "var(--danger-bg)", color: "#E53935" }}>{c.instead}</span>
                  <span style={{ color: "var(--text-secondary)" }}>→</span>
                  <span className="px-2 py-0.5 rounded font-semibold" style={{ background: "var(--success-bg)", color: "var(--success-text)" }}>{c.use}</span>
                  {c.note && <span className="text-xs" style={{ color: "var(--text-secondary)" }}>· {c.note}</span>}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Fluency gaps */}
        {r.fluencyGaps?.length > 0 && (
          <Card>
            <h2 className="font-bold mb-3 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <Zap size={16} style={{ color: "#F5A623" }} /> Fluency Gap Detector
            </h2>
            <ul className="space-y-2">
              {r.fluencyGaps.map((g, i) => (
                <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#F5A623" }} /> {g}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Intonation + pronunciation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {r.intonationCoaching && (
            <Card>
              <h2 className="font-bold mb-2 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <Music size={16} style={{ color: "#F5A623" }} /> Intonation & Rhythm
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{r.intonationCoaching}</p>
            </Card>
          )}
          {r.pronunciationFeedback && (
            <Card>
              <h2 className="font-bold mb-2 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <Volume2 size={16} style={{ color: "var(--accent)" }} /> Pronunciation Clarity
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{r.pronunciationFeedback}</p>
            </Card>
          )}
        </div>

        {/* Did well / keeps below C2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {r.didWell?.length > 0 && (
            <Card>
              <h2 className="font-bold mb-3 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <CheckCircle size={16} style={{ color: "#00B37D" }} /> What You Did Well
              </h2>
              <ul className="space-y-2">
                {r.didWell.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                    <CheckCircle size={13} className="mt-0.5 shrink-0" style={{ color: "#00B37D" }} /> {s}
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {r.keepsBelowC2?.length > 0 && (
            <Card>
              <h2 className="font-bold mb-3 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <AlertCircle size={16} style={{ color: "#F5A623" }} /> What Keeps You Below C2
              </h2>
              <ul className="space-y-2">
                {r.keepsBelowC2.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                    <AlertCircle size={13} className="mt-0.5 shrink-0" style={{ color: "#F5A623" }} /> {s}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        {/* Shadowing sentence */}
        {r.shadowingSentence && (
          <Card className="!p-0 overflow-hidden">
            <div className="p-5" style={{ background: "var(--accent-bg)" }}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <h2 className="font-bold flex items-center gap-2" style={{ color: "var(--accent)" }}>
                  <Repeat size={16} /> Shadow This Sentence
                </h2>
                <ListenButton text={r.shadowingSentence} label="Play & shadow" filled />
              </div>
              <p className="text-base font-medium mb-1" style={{ color: "var(--text-primary)" }}>“{r.shadowingSentence}”</p>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Press play, listen to the rhythm, then repeat it 3× — match the stress and melody, not the accent.</p>
            </div>
          </Card>
        )}

        {/* Practice assignment */}
        {r.practiceAssignment && (
          <Card>
            <h2 className="font-bold mb-2 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <Lightbulb size={16} style={{ color: "#F5A623" }} /> Practice Assignment
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{r.practiceAssignment}</p>
          </Card>
        )}

        {/* Transcript */}
        {transcript && (
          <Card>
            <h2 className="font-bold mb-2 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <Mic size={16} style={{ color: "var(--accent)" }} /> Your Transcript
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{transcript}</p>
          </Card>
        )}

        <div className="flex justify-center pb-4">
          <button onClick={reset}
            className="flex items-center gap-2 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
            style={{ background: "var(--accent)" }}>
            <RotateCcw size={15} /> Practice Again
          </button>
        </div>
      </div>
    );
  }

  return null;
}
