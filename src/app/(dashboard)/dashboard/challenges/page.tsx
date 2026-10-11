"use client";
import { useState, useRef, useEffect } from "react";
import {
  Zap, Briefcase, AlertTriangle, TrendingUp, MessageSquare,
  BarChart2 as BarChart, Users, Mic, Square, Clock, ChevronRight,
  RotateCcw, Target, Flame, Shield, ArrowLeft, Save, CheckCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ChallengeId =
  | "hostile-qa"
  | "exec-briefing"
  | "crisis-comms"
  | "difficult-convo"
  | "debate"
  | "sales-objection"
  | "data-storytelling";

type Difficulty = "Medium" | "High" | "Very High";
type Phase = "idle" | "prep" | "recording" | "transcribing" | "ai-thinking" | "round2-prep" | "round2-rec" | "round2-tx" | "analyzing" | "done";

interface ChallengeResult {
  scores: Record<string, number | null>;
  overall: number | null;
  strengths: string[];
  improvements: string[];
  feedback: string;
  aiChallenge?: string; // the hostile question / counterargument
  round2Feedback?: string;
}

// ─── Challenge definitions ────────────────────────────────────────────────────

interface Challenge {
  id: ChallengeId;
  label: string;
  tagline: string;
  difficulty: Difficulty;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  twoPhase: boolean; // requires AI counter-response between rounds
  prepTime: number;  // seconds
  speakTime: string; // display only
  scoreLabels: string[];
  scenarios: { title: string; prompt: string }[];
}

const CHALLENGES: Challenge[] = [
  {
    id: "hostile-qa",
    label: "Hostile Q&A",
    tagline: "Pitch, then defend under fire",
    difficulty: "Very High",
    icon: Flame,
    color: "#E53935",
    bgColor: "var(--danger-bg)",
    twoPhase: true,
    prepTime: 15,
    speakTime: "60s pitch + 45s response",
    scoreLabels: ["Confidence", "Evidence", "Clarity", "Composure"],
    scenarios: [
      { title: "Startup Pitch", prompt: "Present your startup idea in 60 seconds — business model, market, traction, and ask. Be compelling and specific." },
      { title: "Project Proposal", prompt: "Propose a new initiative to your management team in 60 seconds. Cover the problem, your solution, cost, and expected outcome." },
      { title: "Policy Defence", prompt: "Defend a controversial company policy change in 60 seconds. Acknowledge concerns and explain the rationale clearly." },
      { title: "Research Presentation", prompt: "Summarise your research findings in 60 seconds and explain why they matter to this audience." },
    ],
  },
  {
    id: "exec-briefing",
    label: "Executive Briefing",
    tagline: "90 seconds. Key points only.",
    difficulty: "High",
    icon: Briefcase,
    color: "#7B61FF",
    bgColor: "var(--info-bg)",
    twoPhase: false,
    prepTime: 20,
    speakTime: "90s hard limit",
    scoreLabels: ["Conciseness", "Priority", "Business Impact", "Action Request"],
    scenarios: [
      { title: "Q3 Performance Update", prompt: "Brief the CEO on Q3 results. Cover what happened, what drove it, what concerns you, and what decision you need from them. You have 90 seconds." },
      { title: "Risk Escalation", prompt: "Escalate a critical risk to the executive team. State the risk clearly, impact, likelihood, and what you need them to approve. You have 90 seconds." },
      { title: "Product Launch Readiness", prompt: "Brief senior leadership on whether the product launch is ready. Cover status, blockers, go/no-go recommendation, and next steps. You have 90 seconds." },
      { title: "Budget Overrun", prompt: "Explain a budget overrun to the CFO. State the variance, root cause, corrective action, and revised forecast. You have 90 seconds." },
      { title: "Vendor Issue", prompt: "Report a critical vendor failure to the COO. Cover what failed, customer impact, temporary fix, and long-term plan. You have 90 seconds." },
    ],
  },
  {
    id: "crisis-comms",
    label: "Crisis Communication",
    tagline: "Calm, structured, accountable",
    difficulty: "High",
    icon: AlertTriangle,
    color: "#F5A623",
    bgColor: "var(--warning-bg)",
    twoPhase: false,
    prepTime: 15,
    speakTime: "60–90s",
    scoreLabels: ["Calmness", "Structure", "Accountability", "Solution Focus"],
    scenarios: [
      { title: "Project Delay", prompt: "Your project is 3 weeks behind schedule and the client just found out. Address the client directly. Acknowledge the delay, explain what happened, take responsibility, and present a recovery plan." },
      { title: "Product Defect", prompt: "A product defect has affected 200 customers. Speak to the affected customers. Apologise sincerely, explain what happened, what you're doing to fix it, and what compensation you're offering." },
      { title: "Data Breach", prompt: "Your company experienced a data breach. Address your customers publicly. Be transparent, explain what was exposed, what you've done to contain it, and how you're protecting them going forward." },
      { title: "Team Mistake", prompt: "Your team made an error that caused a major client to lose confidence. Address your leadership team. Own the mistake, explain the root cause, and present a clear remediation plan." },
      { title: "Service Outage", prompt: "Your platform was down for 4 hours during peak hours. Address your users. Acknowledge the disruption, explain the cause, confirm the fix, and outline how you'll prevent recurrence." },
    ],
  },
  {
    id: "difficult-convo",
    label: "Difficult Conversation",
    tagline: "Sensitive topics. Real stakes.",
    difficulty: "Very High",
    icon: MessageSquare,
    color: "var(--accent)",
    bgColor: "var(--accent-bg)",
    twoPhase: false,
    prepTime: 20,
    speakTime: "60–90s",
    scoreLabels: ["Empathy", "Clarity", "Professionalism", "Outcome Focus"],
    scenarios: [
      { title: "Performance Feedback", prompt: "You need to tell a team member that their performance has been below expectations for two months. Be honest but constructive. Address the issue, give specific examples, and agree a path forward." },
      { title: "Salary Negotiation", prompt: "You are negotiating a salary increase with your manager. You believe you deserve 20% more based on your results. Make your case confidently but professionally." },
      { title: "Scope Creep Pushback", prompt: "A client keeps adding out-of-scope requests without budget approval. Have the conversation to reset boundaries respectfully but firmly." },
      { title: "Conflict Resolution", prompt: "Two team members have had a conflict that is affecting team performance. You are the manager mediating. Address both sides, acknowledge both perspectives, and agree next steps." },
      { title: "Rejection Without Damage", prompt: "You need to decline a business partnership proposal without damaging the relationship. Be honest about why and leave the door open for the future." },
    ],
  },
  {
    id: "debate",
    label: "Debate Mode",
    tagline: "State your position. Defend it.",
    difficulty: "Very High",
    icon: Users,
    color: "#00B37D",
    bgColor: "var(--success-bg)",
    twoPhase: true,
    prepTime: 20,
    speakTime: "60s argument + 45s rebuttal",
    scoreLabels: ["Logic", "Evidence", "Confidence", "Rebuttals"],
    scenarios: [
      { title: "Remote Work", prompt: "Argue FOR remote work: it increases productivity and should be the default for knowledge workers. Present your strongest case in 60 seconds." },
      { title: "AI in Education", prompt: "Argue FOR AI tools in schools: students should be taught to use AI as a tool, not banned from it. Present your strongest case in 60 seconds." },
      { title: "Four-Day Work Week", prompt: "Argue FOR a four-day work week: it improves wellbeing without reducing output. Present your strongest case in 60 seconds." },
      { title: "Leadership Style", prompt: "Argue that coaching leadership is MORE effective than directive leadership in modern organisations. Present your case with examples in 60 seconds." },
      { title: "ESG Investment", prompt: "Argue FOR mandatory ESG reporting for all public companies. Make the business and ethical case in 60 seconds." },
    ],
  },
  {
    id: "sales-objection",
    label: "Sales Objection",
    tagline: "Handle price, trust, and timing",
    difficulty: "High",
    icon: Shield,
    color: "#009688",
    bgColor: "var(--success-bg)",
    twoPhase: true,
    prepTime: 10,
    speakTime: "30s intro + 45s objection response",
    scoreLabels: ["Empathy", "Reframe", "Evidence", "Close"],
    scenarios: [
      { title: "Price Objection", prompt: "Introduce your product/service briefly (30 seconds), then you'll face an objection about price being too high." },
      { title: "Trust / Track Record", prompt: "Introduce your company to a new prospect (30 seconds), then you'll face a question about your track record." },
      { title: "Timing / Not Now", prompt: "Pitch a solution to a prospect (30 seconds), then you'll face pushback that 'now isn't the right time'." },
      { title: "Competitor Preference", prompt: "Present your key differentiators (30 seconds), then you'll hear 'we already use your competitor'." },
      { title: "Internal Buy-in", prompt: "Make your case to a champion (30 seconds), then face 'I like it but I can't get leadership to approve'." },
    ],
  },
  {
    id: "data-storytelling",
    label: "Data Storytelling",
    tagline: "Explain insight, not just numbers",
    difficulty: "High",
    icon: BarChart,
    color: "#0288D1",
    bgColor: "var(--info-bg)",
    twoPhase: false,
    prepTime: 25,
    speakTime: "60–90s",
    scoreLabels: ["Insight", "Context", "Recommendation", "Clarity"],
    scenarios: [
      { title: "Sales Decline", prompt: "The chart shows monthly sales dropped 18% over the last quarter after a competitor launched. Present this to the sales team: what happened, why, what the risk is, and what you recommend. 60–90 seconds." },
      { title: "User Retention Drop", prompt: "User retention fell from 68% to 54% over 6 months. Walk the product team through what this means, what you suspect caused it, and what experiments you propose. 60–90 seconds." },
      { title: "NPS Score Trend", prompt: "NPS improved from 22 to 47 over the year. Present this to leadership: what drove the improvement, where gaps remain, and how to sustain it. 60–90 seconds." },
      { title: "Cost Overrun Report", prompt: "OpEx is 23% above budget. Explain this to the CFO: which categories overspent, what drove it, and your plan to rebalance. 60–90 seconds." },
      { title: "Market Share Analysis", prompt: "Your market share grew from 8% to 12% in one year while the top competitor dropped from 35% to 29%. Tell the executive team what this means and what to do next. 60–90 seconds." },
    ],
  },
];

const DIFF_COLOR: Record<Difficulty, { text: string; bg: string }> = {
  Medium: { text: "#00B37D", bg: "var(--success-bg)" },
  High: { text: "#F5A623", bg: "var(--warning-bg)" },
  "Very High": { text: "#E53935", bg: "var(--danger-bg)" },
};

// ─── Helper ───────────────────────────────────────────────────────────────────

async function transcribeBlob(blob: Blob, mimeType: string): Promise<{ text: string; metrics: unknown }> {
  const ext = mimeType.includes("mp4") ? "m4a" : mimeType.includes("ogg") ? "ogg" : "webm";
  const form = new FormData();
  form.append("audio", new File([blob], `rec.${ext}`, { type: mimeType }));
  const res = await fetch("/api/practice/transcribe", { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error ?? "Transcription failed");
  if (!data.transcript?.trim()) throw new Error("No speech detected — please speak clearly");
  return { text: data.transcript, metrics: data.metrics ?? null };
}

async function analyzeTranscript(transcript: string, scenario: string, metrics: unknown) {
  const res = await fetch("/api/practice/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript, scenario, metrics }),
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error ?? "Analysis failed");
  return data;
}

async function getAIChallenge(challengeId: ChallengeId, transcript: string, scenario: string): Promise<string> {
  const systemPrompts: Record<string, string> = {
    "hostile-qa": `You are a tough, skeptical audience member or investor. The speaker just gave a pitch. Ask ONE sharp, challenging follow-up question in 1–2 sentences. Be direct and skeptical. Focus on weak points: evidence, feasibility, or assumptions. Do NOT be polite. Start directly with the question.`,
    debate: `You are a skilled debater on the OPPOSITE side. The speaker just argued their position. Respond with a strong 2–3 sentence counterargument that challenges their core logic. Then end with "Now rebut this." Be sharp and specific.`,
    "sales-objection": `You are a skeptical prospect. The salesperson just made their intro pitch. Voice ONE objection in 1–2 sentences. Make it realistic and challenging. Examples: "Your price is too high", "We already use a competitor", "We don't have budget right now". Pick the most relevant one based on what they said.`,
  };

  const prompt = systemPrompts[challengeId] ?? systemPrompts["hostile-qa"];

  const res = await fetch("/api/ai-coach", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        { role: "user", content: `Context: ${scenario}\n\nSpeaker said: "${transcript}"\n\nYour response:` },
      ],
      voiceId: null,
      systemOverride: prompt,
    }),
  });
  const data = await res.json();
  return data.text ?? "Can you defend that more specifically?";
}

// ─── Recording hook ───────────────────────────────────────────────────────────

function useRecorder() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeRef = useRef<string>("audio/webm");

  async function start() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = ["audio/webm", "audio/mp4", "audio/ogg"].find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
    mimeRef.current = mimeType || "audio/webm";
    const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    chunksRef.current = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.start(100);
    return recorder;
  }

  function stop(): Promise<Blob> {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder) { resolve(new Blob()); return; }
      recorder.onstop = () => resolve(new Blob(chunksRef.current, { type: mimeRef.current }));
      recorder.stop();
      recorder.stream.getTracks().forEach((t) => t.stop());
    });
  }

  function getMime() { return mimeRef.current; }

  return { start, stop, getMime };
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ChallengesPage() {
  const [selected, setSelected] = useState<Challenge | null>(null);
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [timer, setTimer] = useState(0);
  const [prepLeft, setPrepLeft] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ChallengeResult | null>(null);
  const [aiChallenge, setAiChallenge] = useState("");
  const [round1Transcript, setRound1Transcript] = useState("");
  // Delivery metrics from round 1 (the uninterrupted answer)
  const round1MetricsRef = useRef<unknown>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recorder = useRecorder();

  function clearTimer() { if (intervalRef.current) clearInterval(intervalRef.current); }

  function reset() {
    clearTimer();
    setPhase("idle");
    setTimer(0);
    setPrepLeft(0);
    setError("");
    setResult(null);
    setAiChallenge("");
    setRound1Transcript("");
    setSaved(false);
  }

  useEffect(() => { reset(); }, [selected, scenarioIdx]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => clearTimer(), []);

  const challenge = selected!;
  const scenario = selected ? selected.scenarios[scenarioIdx] : null;

  async function saveResult() {
    if (!result || !challenge || saving || saved) return;
    setSaving(true);
    try {
      await fetch("/api/practice/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario: `Challenge: ${challenge.label} — ${scenario?.title ?? ""}`,
          transcript: round1Transcript,
          scores: {
            overall: result.overall,
            ...Object.fromEntries(
              Object.entries(result.scores).map(([k, v]) => [k.toLowerCase().replace(/\s+/g, "_"), v])
            ),
          },
          fillerWords: { count: 0, words: [] },
          wpm: 0,
          durationSeconds: 0,
          strengths: result.strengths,
          improvements: result.improvements,
          aiFeedback: result.feedback ?? "",
        }),
      });
      setSaved(true);
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }

  // ── Start prep countdown → auto-start recording ──
  function startPrep() {
    setError("");
    setPrepLeft(challenge.prepTime);
    setPhase("prep");
    intervalRef.current = setInterval(() => {
      setPrepLeft((t) => {
        if (t <= 1) { clearTimer(); beginRecording(); return 0; }
        return t - 1;
      });
    }, 1000);
  }

  async function beginRecording(isRound2 = false) {
    setError("");
    try {
      await recorder.start();
      setTimer(0);
      setPhase(isRound2 ? "round2-rec" : "recording");
      intervalRef.current = setInterval(() => setTimer((s) => s + 1), 1000);
    } catch {
      setError("Microphone access denied.");
      setPhase("idle");
    }
  }

  async function stopRound1() {
    clearTimer();
    setPhase("transcribing");
    const blob = await recorder.stop();
    try {
      const { text: tx, metrics } = await transcribeBlob(blob, recorder.getMime());
      round1MetricsRef.current = metrics;
      setRound1Transcript(tx);

      if (challenge.twoPhase) {
        setPhase("ai-thinking");
        const scenarioCtx = `${challenge.label} — ${scenario!.title}: ${scenario!.prompt}`;
        const q = await getAIChallenge(challenge.id, tx, scenarioCtx);
        setAiChallenge(q);
        setPhase("round2-prep");
      } else {
        await runAnalysis(tx, "");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setPhase("idle");
    }
  }

  async function stopRound2() {
    clearTimer();
    setPhase("round2-tx");
    const blob = await recorder.stop();
    try {
      const { text: tx2 } = await transcribeBlob(blob, recorder.getMime());
      await runAnalysis(round1Transcript, tx2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setPhase("idle");
    }
  }

  async function runAnalysis(tx1: string, tx2: string) {
    setPhase("analyzing");
    const fullTranscript = tx2 ? `Round 1: ${tx1}\n\nChallenge: "${aiChallenge}"\n\nRound 2 Response: ${tx2}` : tx1;
    const scenarioCtx = `${challenge.label} — ${scenario!.title}. ${scenario!.prompt}`;
    try {
      const data = await analyzeTranscript(fullTranscript, scenarioCtx, round1MetricsRef.current);
      const s = data.scores ?? {};
      // Map generic scores to challenge-specific labels
      const labels = challenge.scoreLabels;
      const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
      const vals = [
        num(s.confidence) ?? num(s.fluency),
        num(s.structure) ?? num(s.vocabulary),
        num(s.pronunciation),
        num(s.pace),
      ];
      const mapped: Record<string, number | null> = {};
      labels.forEach((l, i) => { mapped[l] = vals[i] ?? null; });
      setResult({
        scores: mapped,
        overall: num(s.overall),
        strengths: Array.isArray(data.strengths) ? data.strengths : [],
        improvements: Array.isArray(data.improvements) ? data.improvements : [],
        feedback: data.aiFeedback ?? "",
        aiChallenge: aiChallenge || undefined,
        round2Feedback: tx2 ? "Round 2 response included in overall scoring." : undefined,
      });
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
      setPhase("idle");
    }
  }

  const fmtTimer = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const diffStyle = selected ? DIFF_COLOR[challenge.difficulty] : DIFF_COLOR.High;

  // ─── Hub view ─────────────────────────────────────────────────────────────────
  if (!selected) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Challenge Modes</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            High-pressure speaking drills that go beyond public speaking — for professionals, leaders, and exam candidates.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CHALLENGES.map((c) => {
            const Icon = c.icon;
            const diff = DIFF_COLOR[c.difficulty];
            return (
              <button
                key={c.id}
                onClick={() => { setSelected(c); setScenarioIdx(0); }}
                className="card text-left p-5 rounded-xl transition-all group"
                style={{ background: "var(--bg-card)" }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: c.bgColor }}>
                    <Icon size={20} style={{ color: c.color }} />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: diff.bg, color: diff.text }}>
                      {c.difficulty}
                    </span>
                    {c.twoPhase && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}>
                        2-ROUND
                      </span>
                    )}
                  </div>
                </div>
                <h3 className="font-bold text-sm mb-1" style={{ color: "var(--text-primary)" }}>{c.label}</h3>
                <p className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>{c.tagline}</p>
                <div className="flex items-center justify-between">
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                    {c.scenarios.length} scenarios
                  </p>
                  <span className="text-[10px] font-semibold" style={{ color: "var(--accent)" }}>
                    Start <ChevronRight size={11} className="inline" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Tips */}
        <div className="card-flat rounded-xl p-5">
          <p className="text-sm font-bold mb-2" style={{ color: "var(--text-primary)" }}>
            <Target size={14} className="inline mr-1.5" style={{ color: "var(--accent)" }} />
            How Challenge Modes work
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs" style={{ color: "var(--text-secondary)" }}>
            <div><span className="font-bold" style={{ color: "var(--accent)" }}>1. Pick a challenge</span> — choose a scenario relevant to your work or goals.</div>
            <div><span className="font-bold" style={{ color: "var(--accent)" }}>2. Speak under pressure</span> — 2-round challenges fire back with a real AI counter-response.</div>
            <div><span className="font-bold" style={{ color: "var(--accent)" }}>3. Get scored</span> — AI evaluates you on challenge-specific dimensions, not just general speech quality.</div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Practice view ────────────────────────────────────────────────────────────
  const Icon = challenge.icon;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg transition-colors" style={{ color: "var(--text-muted)" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <ArrowLeft size={16} />
        </button>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: challenge.bgColor }}>
          <Icon size={16} style={{ color: challenge.color }} />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold leading-tight" style={{ color: "var(--text-primary)" }}>{challenge.label}</h1>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{challenge.tagline}</p>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: diffStyle.bg, color: diffStyle.text }}>
          {challenge.difficulty}
        </span>
      </div>

      {error && <div className="rounded-lg p-3 text-xs text-red-600 bg-[var(--danger-bg)] border border-[var(--danger-border)]">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Scenario card */}
        <div className="card-flat rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Scenario {scenarioIdx + 1} / {challenge.scenarios.length}
            </p>
            <button
              onClick={() => { reset(); setScenarioIdx((i) => (i + 1) % challenge.scenarios.length); }}
              className="text-xs font-semibold hover:underline"
              style={{ color: "var(--accent)" }}
            >
              Next <ChevronRight size={11} className="inline" />
            </button>
          </div>

          <h3 className="font-bold mb-2" style={{ color: "var(--text-primary)" }}>{scenario!.title}</h3>
          <div className="rounded-lg p-4 mb-4" style={{ background: "var(--bg-secondary)" }}>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{scenario!.prompt}</p>
          </div>

          {/* Scoring labels */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-muted)" }}>You'll be scored on:</p>
            <div className="flex flex-wrap gap-1.5">
              {challenge.scoreLabels.map((l) => (
                <span key={l} className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--accent-bg)", color: "var(--accent)" }}>{l}</span>
              ))}
            </div>
          </div>

          {/* 2-phase note */}
          {challenge.twoPhase && (
            <div className="mt-4 rounded-lg p-3 text-xs" style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}>
              <span className="font-bold" style={{ color: challenge.color }}>2-Round challenge:</span>
              {" "}After your first response, the AI will fire back with a challenge. You get 45 seconds to respond.
            </div>
          )}

          {/* Prep time info */}
          <p className="mt-3 text-[10px]" style={{ color: "var(--text-muted)" }}>
            <Clock size={10} className="inline mr-1" />{challenge.prepTime}s prep · {challenge.speakTime}
          </p>
        </div>

        {/* Record panel */}
        <div className="card-flat rounded-xl p-6 flex flex-col items-center justify-center min-h-60">
          {/* IDLE */}
          {phase === "idle" && (
            <div className="text-center">
              <button
                onClick={startPrep}
                className="w-20 h-20 rounded-full text-white flex items-center justify-center mx-auto mb-4 pulse-ring transition-all"
                style={{ background: "var(--accent)" }}
              >
                <Mic size={30} />
              </button>
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Start Challenge</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{challenge.prepTime}s prep, then speak</p>
            </div>
          )}

          {/* PREP */}
          {phase === "prep" && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "var(--bg-secondary)" }}>
                <Clock size={28} style={{ color: "#F5A623" }} />
              </div>
              <p className="text-3xl font-bold font-mono mb-1" style={{ color: "#F5A623" }}>{fmtTimer(prepLeft)}</p>
              <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Preparation time</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Recording starts automatically</p>
            </div>
          )}

          {/* RECORDING (round 1) */}
          {phase === "recording" && (
            <div className="text-center">
              <div className="flex items-center gap-1.5 justify-center mb-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-bold text-red-500 uppercase tracking-wide">
                  {challenge.twoPhase ? "Round 1 · Speaking" : "Recording"}
                </span>
              </div>
              <p className="text-3xl font-bold font-mono mb-4" style={{ color: "var(--text-primary)" }}>{fmtTimer(timer)}</p>
              <div className="flex items-end gap-1 justify-center h-10 mb-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="wave-bar w-1.5 rounded-full" style={{ height: "24px", background: "var(--accent)" }} />
                ))}
              </div>
              <button onClick={stopRound1} className="flex items-center gap-2 text-white font-semibold px-5 py-2 rounded-lg bg-red-500 hover:bg-red-600 transition-colors">
                <Square size={14} /> {challenge.twoPhase ? "Done — Get Challenge" : "Stop & Analyze"}
              </button>
            </div>
          )}

          {/* AI THINKING */}
          {phase === "ai-thinking" && (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: challenge.bgColor }}>
                <Icon size={24} style={{ color: challenge.color }} className="spin-slow" />
              </div>
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>AI is crafting a challenge…</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Generating a sharp follow-up</p>
              <div className="flex justify-center gap-1 mt-3">
                {[0, 1, 2].map((i) => <div key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ background: "var(--accent)", animationDelay: `${i * 0.15}s` }} />)}
              </div>
            </div>
          )}

          {/* ROUND 2 PREP */}
          {phase === "round2-prep" && (
            <div className="text-center w-full">
              <div className="rounded-xl p-4 mb-4 text-left" style={{ background: challenge.bgColor, border: `1px solid ${challenge.color}30` }}>
                <p className="text-xs font-bold mb-1" style={{ color: challenge.color }}>
                  {challenge.id === "debate" ? "AI Counterargument:" : challenge.id === "sales-objection" ? "Customer Objection:" : "Hostile Follow-up:"}
                </p>
                <p className="text-sm font-semibold leading-relaxed" style={{ color: "var(--text-primary)" }}>&ldquo;{aiChallenge}&rdquo;</p>
              </div>
              <button
                onClick={() => beginRecording(true)}
                className="flex items-center gap-2 text-white font-semibold px-5 py-2.5 rounded-lg pulse-ring transition-all mx-auto"
                style={{ background: challenge.color }}
              >
                <Mic size={16} /> Respond Now
              </button>
              <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>45 seconds to respond</p>
            </div>
          )}

          {/* ROUND 2 RECORDING */}
          {phase === "round2-rec" && (
            <div className="text-center w-full">
              <div className="rounded-lg p-3 mb-4 text-left text-xs" style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}>
                <span className="font-bold" style={{ color: challenge.color }}>Challenge: </span>
                &ldquo;{aiChallenge}&rdquo;
              </div>
              <div className="flex items-center gap-1.5 justify-center mb-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-bold text-red-500 uppercase tracking-wide">Round 2 · Responding</span>
              </div>
              <p className="text-3xl font-bold font-mono mb-4" style={{ color: "var(--text-primary)" }}>{fmtTimer(timer)}</p>
              <div className="flex items-end gap-1 justify-center h-10 mb-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="wave-bar w-1.5 rounded-full" style={{ height: "24px", background: challenge.color }} />
                ))}
              </div>
              <button onClick={stopRound2} className="flex items-center gap-2 text-white font-semibold px-5 py-2 rounded-lg bg-red-500 hover:bg-red-600 transition-colors">
                <Square size={14} /> Finish & Score
              </button>
            </div>
          )}

          {/* TRANSCRIBING / ANALYZING */}
          {(phase === "transcribing" || phase === "round2-tx" || phase === "analyzing") && (
            <div className="text-center">
              <BarChart size={36} className="mx-auto mb-3 spin-slow" style={{ color: "var(--accent)" }} />
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                {phase === "analyzing" ? "Scoring your performance…" : "Processing…"}
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {phase === "analyzing" ? `Evaluating ${challenge.scoreLabels.join(", ")}` : "Converting speech to text"}
              </p>
              <div className="flex justify-center gap-1 mt-3">
                {[0, 1, 2].map((i) => <div key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ background: "var(--accent)", animationDelay: `${i * 0.15}s` }} />)}
              </div>
            </div>
          )}

          {/* DONE */}
          {phase === "done" && (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "var(--bg-secondary)" }}>
                <BarChart size={24} style={{ color: "#00B37D" }} />
              </div>
              <p className="font-bold mb-1" style={{ color: "#00B37D" }}>Challenge complete!</p>
              <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>Scroll down to see your scores.</p>
              <button onClick={reset} className="text-xs font-semibold px-4 py-1.5 rounded-lg border transition-colors" style={{ borderColor: "var(--accent)", color: "var(--accent)" }}>
                <RotateCcw size={11} className="inline mr-1" /> Retry
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {phase === "done" && result && (
        <div className="card-flat rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold" style={{ color: "var(--text-primary)" }}>Your Challenge Score</h2>
            <div className="text-center">
              <span className="text-3xl font-bold" style={{ color: challenge.color }}>{result.overall ?? "—"}</span>
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>/100</span>
            </div>
          </div>

          {/* Dimension scores */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(result.scores).map(([label, val]) => (
              <div key={label} className="rounded-xl p-3 text-center" style={{ background: "var(--bg-secondary)" }}>
                <p className="text-2xl font-bold" style={{ color: challenge.color }}>{val ?? "—"}</p>
                <p className="text-[10px] mt-0.5 font-semibold" style={{ color: "var(--text-secondary)" }}>{label}</p>
                <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                  <div className="h-full rounded-full" style={{ width: `${val ?? 0}%`, background: challenge.color }} />
                </div>
              </div>
            ))}
          </div>

          {/* AI challenge shown */}
          {result.aiChallenge && (
            <div className="rounded-xl p-4" style={{ background: challenge.bgColor, border: `1px solid ${challenge.color}25` }}>
              <p className="text-xs font-bold mb-1" style={{ color: challenge.color }}>The challenge you faced:</p>
              <p className="text-sm italic" style={{ color: "var(--text-primary)" }}>&ldquo;{result.aiChallenge}&rdquo;</p>
            </div>
          )}

          {/* Feedback grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {result.strengths.length > 0 && (
              <div>
                <p className="text-xs font-bold mb-2" style={{ color: "#00B37D" }}>✓ Strengths</p>
                <ul className="space-y-1.5">
                  {result.strengths.map((s, i) => (
                    <li key={i} className="text-xs flex items-start gap-1.5" style={{ color: "var(--text-secondary)" }}>
                      <span style={{ color: "#00B37D" }} className="shrink-0 mt-0.5">•</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.improvements.length > 0 && (
              <div>
                <p className="text-xs font-bold mb-2" style={{ color: "#F5A623" }}>↑ To improve</p>
                <ul className="space-y-1.5">
                  {result.improvements.map((s, i) => (
                    <li key={i} className="text-xs flex items-start gap-1.5" style={{ color: "var(--text-secondary)" }}>
                      <span style={{ color: "#F5A623" }} className="shrink-0 mt-0.5">•</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* AI feedback */}
          {result.feedback && (
            <div className="rounded-xl p-4" style={{ background: "var(--accent-bg)" }}>
              <p className="text-xs font-bold mb-1" style={{ color: "var(--accent)" }}>AI Coach</p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{result.feedback}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button onClick={reset} className="flex items-center gap-2 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors" style={{ background: "var(--accent)" }}>
              <RotateCcw size={12} /> Try Again
            </button>
            <button
              onClick={() => { reset(); setScenarioIdx((i) => (i + 1) % challenge.scenarios.length); }}
              className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg border transition-colors"
              style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
            >
              Next Scenario
            </button>
            <button
              onClick={saveResult}
              disabled={saving || saved}
              className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg border transition-colors disabled:opacity-60"
              style={{ borderColor: saved ? "#00B37D" : "var(--border)", color: saved ? "#00B37D" : "var(--text-secondary)" }}
            >
              {saved ? <><CheckCircle size={12} /> Saved</> : saving ? "Saving..." : <><Save size={12} /> Save Result</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
