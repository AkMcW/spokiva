"use client";
import { useState, useEffect, useRef } from "react";
import { Mic, Square, BarChart2, Clock, ChevronRight, Info } from "lucide-react";

// ─── PTE Speaking task definitions ────────────────────────────────────────────

type TaskType = "read-aloud" | "repeat-sentence" | "describe-image" | "retell-lecture" | "answer-short";
type RecordState = "idle" | "prep" | "recording" | "transcribing" | "analyzing" | "done";

interface PTEResult {
  content: number | null;       // 0–5
  pronunciation: number | null; // 0–90 scaled
  fluency: number | null;       // 0–90 scaled
  overall: number | null;       // 0–90
  feedback: string;
}

const TASKS: { id: TaskType; label: string; badge: string; time: string; desc: string }[] = [
  { id: "read-aloud",       label: "Read Aloud",         badge: "RA",  time: "30–40s",  desc: "Read the text aloud clearly and naturally. Scored on pronunciation and oral fluency." },
  { id: "repeat-sentence",  label: "Repeat Sentence",    badge: "RS",  time: "15s",     desc: "Listen, then repeat the sentence exactly. Tests both listening and speaking." },
  { id: "describe-image",   label: "Describe Image",     badge: "DI",  time: "40s",     desc: "Describe the image in detail. You have 25 seconds preparation time." },
  { id: "retell-lecture",   label: "Re-tell Lecture",    badge: "RL",  time: "40s",     desc: "Listen to a short lecture, then re-tell it in your own words." },
  { id: "answer-short",     label: "Answer Short Question", badge: "ASQ", time: "10s", desc: "Give a one or two word answer to a general knowledge question." },
];

// ─── Content per task ─────────────────────────────────────────────────────────

const RA_PASSAGES = [
  "Climate change refers to long-term shifts in global temperatures and weather patterns. While some of these changes are natural, since the mid-20th century, human activities have been the main driver, particularly the burning of fossil fuels.",
  "The internet has transformed the way people communicate, work, and access information. It has enabled global connectivity and created new economic opportunities, but it has also raised concerns about privacy, misinformation, and digital inequality.",
  "Biodiversity is the variety of life on Earth, including the diversity within species, between species, and of ecosystems. It is essential for ecosystem health and provides resources critical for human survival.",
  "Artificial intelligence is the simulation of human intelligence processes by machines. It encompasses machine learning, natural language processing, and computer vision, and is increasingly applied across medicine, finance, and education.",
];

const RS_SENTENCES = [
  "The committee will review the proposals submitted before the end of the fiscal year.",
  "Students who complete the online module will receive a certificate of participation.",
  "The laboratory results confirmed what the researchers had hypothesized about the compound.",
  "Urban planning must balance economic development with environmental sustainability.",
  "The conference attracted scholars from over forty countries to discuss the latest findings.",
];

const DI_IMAGES = [
  { title: "Bar Chart — Energy Sources", prompt: "The bar chart shows the percentage of electricity generated from different energy sources in four countries: coal, gas, nuclear, and renewables. Describe the key trends and notable differences between countries." },
  { title: "Line Graph — Global Temperature Rise", prompt: "The line graph illustrates the average global temperature anomaly from 1880 to 2020. Describe the overall trend, any notable fluctuations, and what the data implies." },
  { title: "Pie Chart — University Budget Allocation", prompt: "The pie chart shows how a university allocates its annual budget across departments: Teaching (40%), Research (25%), Administration (20%), Facilities (10%), and Other (5%). Describe the distribution and highlight the most significant areas." },
  { title: "Table — Population Data by Region", prompt: "The table compares population, GDP per capita, and life expectancy across six world regions. Describe the key data points and any striking relationships between the variables." },
];

const RL_LECTURES = [
  { title: "Lecture: The Role of Sleep in Memory", text: "During deep sleep, the brain replays and consolidates memories from the day. Research shows that students who sleep after studying retain significantly more information than those who stay awake. This process, called memory consolidation, is thought to involve the transfer of information from the hippocampus to the neocortex. Re-tell this lecture in your own words." },
  { title: "Lecture: Urban Heat Islands", text: "Urban areas tend to be warmer than surrounding rural areas due to human activity and the concentration of buildings, roads, and other infrastructure. This phenomenon is called the urban heat island effect. Strategies such as green roofs, tree planting, and reflective surfaces can help mitigate it. Re-tell this lecture in your own words." },
  { title: "Lecture: The Gig Economy", text: "The gig economy refers to a labour market characterised by short-term contracts and freelance work rather than permanent employment. While it offers flexibility for workers, it also raises concerns about job security, benefits, and income stability. Policymakers are debating how to regulate this rapidly growing sector. Re-tell this lecture in your own words." },
];

const ASQ_QUESTIONS = [
  "What is the chemical symbol for water?",
  "What instrument measures atmospheric pressure?",
  "Who wrote the play Hamlet?",
  "What is the capital city of Australia?",
  "How many sides does a hexagon have?",
  "What is the main function of red blood cells?",
  "What planet is closest to the Sun?",
  "What term describes a word that sounds like the thing it represents?",
];

// ─── Scoring helper ───────────────────────────────────────────────────────────

function scaleTo90(score: number | null | undefined) {
  // Scores are 0–100; PTE speaking subscores are 0–90. Unmeasured stays null.
  return score == null ? null : Math.round((score / 100) * 90);
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PTEPage() {
  const [activeTask, setActiveTask] = useState<TaskType>("read-aloud");
  const [recordState, setRecordState] = useState<RecordState>("idle");
  const [prepTimer, setPrepTimer] = useState(0);
  const [speakTimer, setSpeakTimer] = useState(0);
  const [result, setResult] = useState<PTEResult | null>(null);
  const [error, setError] = useState("");

  // Content indices
  const [raIdx, setRaIdx] = useState(0);
  const [rsIdx, setRsIdx] = useState(0);
  const [diIdx, setDiIdx] = useState(0);
  const [rlIdx, setRlIdx] = useState(0);
  const [asqIdx, setAsqIdx] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  function clearTimer() { if (intervalRef.current) clearInterval(intervalRef.current); }

  function reset() {
    clearTimer();
    setRecordState("idle");
    setPrepTimer(0);
    setSpeakTimer(0);
    setResult(null);
    setError("");
    try { mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop()); } catch { /* ignore */ }
  }

  useEffect(() => { reset(); }, [activeTask]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => clearTimer(), []);

  async function startRecording() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = ["audio/webm", "audio/mp4", "audio/ogg"].find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.start(100);
      setSpeakTimer(0);
      setRecordState("recording");
      intervalRef.current = setInterval(() => setSpeakTimer((s) => s + 1), 1000);
    } catch {
      setError("Microphone access denied. Please allow microphone access.");
    }
  }

  function startWithPrep(seconds: number) {
    setError("");
    setPrepTimer(seconds);
    setRecordState("prep");
    intervalRef.current = setInterval(() => {
      setPrepTimer((t) => {
        if (t <= 1) {
          clearTimer();
          startRecording();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  async function stopRecording() {
    clearTimer();
    const recorder = mediaRecorderRef.current;
    if (!recorder) { setRecordState("idle"); return; }
    recorder.stop();
    recorder.stream.getTracks().forEach((t) => t.stop());
    setRecordState("transcribing");

    recorder.onstop = async () => {
      const mimeType = recorder.mimeType || "audio/webm";
      const blob = new Blob(chunksRef.current, { type: mimeType });
      let transcript = "";
      let speechMetrics: unknown = null;

      try {
        const form = new FormData();
        const ext = mimeType.includes("mp4") ? "m4a" : mimeType.includes("ogg") ? "ogg" : "webm";
        form.append("audio", new File([blob], `rec.${ext}`, { type: mimeType }));
        const res = await fetch("/api/practice/transcribe", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error ?? "Transcription failed");
        transcript = data.transcript ?? "";
        speechMetrics = data.metrics ?? null;
        if (!transcript.trim()) throw new Error("No speech detected — please speak clearly and try again");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Transcription failed");
        setRecordState("idle");
        return;
      }

      setRecordState("analyzing");
      const taskLabel = TASKS.find((t) => t.id === activeTask)?.label ?? activeTask;
      try {
        const res = await fetch("/api/practice/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript, metrics: speechMetrics, scenario: `PTE Academic Speaking — ${taskLabel}` }),
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error ?? "Analysis failed");
        setResult({
          content: data.scores?.structure == null ? null : Math.round((data.scores.structure / 100) * 5 * 10) / 10,
          pronunciation: scaleTo90(data.scores?.pronunciation),
          fluency: scaleTo90(data.scores?.fluency),
          overall: scaleTo90(data.scores?.overall),
          feedback: data.aiFeedback ?? "",
        });
        setRecordState("done");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Analysis failed");
        setRecordState("idle");
      }
    };
  }

  const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>PTE Academic Speaking</h1>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--accent-bg)", color: "var(--accent)" }}>Exam Practice</span>
        </div>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Practice all five PTE Speaking tasks with AI scoring on pronunciation, fluency, and content.</p>
      </div>

      {/* PTE Band explanation */}
      <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: "var(--accent-bg)" }}>
        <Info size={16} style={{ color: "var(--accent)" }} className="mt-0.5 shrink-0" />
        <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
          <span className="font-bold" style={{ color: "var(--accent)" }}>PTE Score scale: 10–90.</span>
          {" "}Each task is scored on Oral Fluency (0–90), Pronunciation (0–90), and Content (0–5 where applicable).
          A score of 79+ is considered test-ready for most universities.
        </div>
      </div>

      {/* Task tabs */}
      <div className="flex flex-wrap gap-1.5">
        {TASKS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTask(t.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: activeTask === t.id ? "var(--accent)" : "var(--bg-card)",
              color: activeTask === t.id ? "#fff" : "var(--text-secondary)",
              border: `1px solid ${activeTask === t.id ? "var(--accent)" : "var(--border)"}`,
            }}
          >
            <span className="font-mono">{t.badge}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg p-3 text-xs text-red-600 bg-[var(--danger-bg)] border border-[var(--danger-border)]">{error}</div>
      )}

      {/* Task content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left: task prompt */}
        <div className="card-flat rounded-xl p-6">
          {activeTask === "read-aloud" && (
            <>
              <TaskHeader badge="RA" label="Read Aloud" time="30–40s" />
              <p className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>Read the text below aloud naturally. You have 30–40 seconds.</p>
              <div className="rounded-lg p-4 mb-4" style={{ background: "var(--bg-secondary)" }}>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{RA_PASSAGES[raIdx]}</p>
              </div>
              <button onClick={() => { reset(); setRaIdx((i) => (i + 1) % RA_PASSAGES.length); }} className="text-xs font-semibold hover:underline" style={{ color: "var(--accent)" }}>
                Next passage <ChevronRight size={11} className="inline" />
              </button>
            </>
          )}

          {activeTask === "repeat-sentence" && (
            <>
              <TaskHeader badge="RS" label="Repeat Sentence" time="15s" />
              <p className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>Listen, then repeat the sentence exactly as heard.</p>
              <div className="rounded-lg p-4 mb-3" style={{ background: "var(--bg-secondary)" }}>
                <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-muted)" }}>Target sentence (in exam this is audio only):</p>
                <p className="text-sm italic leading-relaxed" style={{ color: "var(--text-primary)" }}>&ldquo;{RS_SENTENCES[rsIdx]}&rdquo;</p>
              </div>
              <button onClick={() => { reset(); setRsIdx((i) => (i + 1) % RS_SENTENCES.length); }} className="text-xs font-semibold hover:underline" style={{ color: "var(--accent)" }}>
                Next sentence <ChevronRight size={11} className="inline" />
              </button>
            </>
          )}

          {activeTask === "describe-image" && (
            <>
              <TaskHeader badge="DI" label="Describe Image" time="40s + 25s prep" />
              <p className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>Study the image description, then describe it in detail. 25s prep → 40s speaking.</p>
              <div className="rounded-lg p-4 mb-3" style={{ background: "var(--bg-secondary)" }}>
                <p className="text-xs font-bold mb-1" style={{ color: "var(--accent)" }}>{DI_IMAGES[diIdx].title}</p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{DI_IMAGES[diIdx].prompt}</p>
              </div>
              <button onClick={() => { reset(); setDiIdx((i) => (i + 1) % DI_IMAGES.length); }} className="text-xs font-semibold hover:underline" style={{ color: "var(--accent)" }}>
                Next image <ChevronRight size={11} className="inline" />
              </button>
            </>
          )}

          {activeTask === "retell-lecture" && (
            <>
              <TaskHeader badge="RL" label="Re-tell Lecture" time="40s + 10s prep" />
              <p className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>Read the lecture summary, then re-tell it in your own words. 10s prep → 40s speaking.</p>
              <div className="rounded-lg p-4 mb-3" style={{ background: "var(--bg-secondary)" }}>
                <p className="text-xs font-bold mb-1" style={{ color: "var(--accent)" }}>{RL_LECTURES[rlIdx].title}</p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{RL_LECTURES[rlIdx].text}</p>
              </div>
              <button onClick={() => { reset(); setRlIdx((i) => (i + 1) % RL_LECTURES.length); }} className="text-xs font-semibold hover:underline" style={{ color: "var(--accent)" }}>
                Next lecture <ChevronRight size={11} className="inline" />
              </button>
            </>
          )}

          {activeTask === "answer-short" && (
            <>
              <TaskHeader badge="ASQ" label="Answer Short Question" time="10s" />
              <p className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>Answer the question with one or two words. Scored on correct content only.</p>
              <div className="rounded-lg p-4 mb-3" style={{ background: "var(--bg-secondary)" }}>
                <p className="text-sm font-semibold italic" style={{ color: "var(--text-primary)" }}>&ldquo;{ASQ_QUESTIONS[asqIdx]}&rdquo;</p>
              </div>
              <button onClick={() => { reset(); setAsqIdx((i) => (i + 1) % ASQ_QUESTIONS.length); }} className="text-xs font-semibold hover:underline" style={{ color: "var(--accent)" }}>
                Next question <ChevronRight size={11} className="inline" />
              </button>
            </>
          )}
        </div>

        {/* Right: record panel */}
        <RecordPanel
          state={recordState}
          timer={fmtTime(speakTimer)}
          prepTimer={fmtTime(prepTimer)}
          onStart={() => {
            if (activeTask === "describe-image") startWithPrep(25);
            else if (activeTask === "retell-lecture") startWithPrep(10);
            else startRecording();
          }}
          onStop={stopRecording}
          onReset={reset}
          taskTime={TASKS.find((t) => t.id === activeTask)?.time ?? ""}
        />
      </div>

      {/* Results */}
      {recordState === "done" && result && (
        <div className="card-flat rounded-xl p-6">
          <h2 className="font-bold mb-4" style={{ color: "var(--text-primary)" }}>PTE Score Estimate</h2>
          <div className="grid grid-cols-3 gap-4 mb-5">
            {[
              { label: "Oral Fluency", val: result.fluency, unit: "/90" },
              { label: "Pronunciation", val: result.pronunciation, unit: "/90" },
              { label: "Overall", val: result.overall, unit: "/90" },
            ].map(({ label, val, unit }) => (
              <div key={label} className="rounded-xl p-4 text-center" style={{ background: "var(--bg-secondary)" }}>
                <p className="text-3xl font-bold" style={{ color: "var(--accent)" }}>{val ?? "—"}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{unit}</p>
                <p className="text-xs font-semibold mt-1" style={{ color: "var(--text-secondary)" }}>{label}</p>
              </div>
            ))}
          </div>
          {(activeTask === "read-aloud" || activeTask === "describe-image" || activeTask === "retell-lecture") && (
            <div className="rounded-lg p-3 mb-4 flex items-center gap-3" style={{ background: "var(--bg-secondary)" }}>
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: "var(--accent)" }}>{result.content == null ? "—" : result.content.toFixed(1)}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>/5</p>
                <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Content</p>
              </div>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Content score measures how accurately you covered the required information.
              </p>
            </div>
          )}
          {/* Score band */}
          <div className="rounded-lg p-4 mb-4" style={{ background: "var(--accent-bg)" }}>
            <p className="text-xs font-bold mb-1" style={{ color: "var(--accent)" }}>
              {result.overall == null ? "Not enough speech to estimate a score" : result.overall >= 79 ? "✓ Test-ready range (79+)" : result.overall >= 65 ? "⚡ Approaching test-ready" : "↑ More practice needed"}
            </p>
            {result.feedback && <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{result.feedback}</p>}
          </div>
          {/* Score scale reference */}
          <div className="grid grid-cols-4 gap-2 text-center text-[10px] mb-4">
            {[
              { range: "10–42", label: "Below Average", color: "#E53935" },
              { range: "43–64", label: "Developing", color: "#F5A623" },
              { range: "65–78", label: "Competent", color: "var(--accent)" },
              { range: "79–90", label: "Expert", color: "#00B37D" },
            ].map((b) => (
              <div key={b.range} className="rounded-lg p-2" style={{ background: "var(--bg-secondary)" }}>
                <p className="font-bold" style={{ color: b.color }}>{b.range}</p>
                <p style={{ color: "var(--text-muted)" }}>{b.label}</p>
              </div>
            ))}
          </div>
          <button
            onClick={reset}
            className="text-xs font-semibold px-4 py-1.5 rounded-lg border transition-colors"
            style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
          >
            Practice Again
          </button>
        </div>
      )}

      {/* Tips */}
      <div className="card-flat rounded-xl p-5">
        <p className="text-sm font-bold mb-3" style={{ color: "var(--text-primary)" }}>PTE Speaking Tips</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs" style={{ color: "var(--text-secondary)" }}>
          {[
            ["Read Aloud", "Speak at a steady pace. Do not pause mid-word. Stress content words."],
            ["Repeat Sentence", "Focus on exact wording. Length matters — do not skip words."],
            ["Describe Image", "Use a structure: overview → key data → conclusion. Keep speaking the full 40 seconds."],
            ["Re-tell Lecture", "Include main idea, key points, and conclusion. Use your own words."],
          ].map(([task, tip]) => (
            <div key={task} className="flex items-start gap-2">
              <span className="font-bold shrink-0" style={{ color: "var(--accent)" }}>{task}:</span>
              <span>{tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function TaskHeader({ badge, label, time }: { badge: string; label: string; time: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded" style={{ background: "var(--accent)", color: "#fff" }}>{badge}</span>
      <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{label}</span>
      <span className="ml-auto text-xs" style={{ color: "var(--text-muted)" }}>
        <Clock size={11} className="inline mr-0.5" />{time}
      </span>
    </div>
  );
}

function RecordPanel({
  state, timer, prepTimer, onStart, onStop, onReset, taskTime,
}: {
  state: RecordState; timer: string; prepTimer: string;
  onStart: () => void; onStop: () => void; onReset: () => void; taskTime: string;
}) {
  return (
    <div className="card-flat rounded-xl p-6 flex flex-col items-center justify-center min-h-52">
      {state === "idle" && (
        <div className="text-center">
          <button
            onClick={onStart}
            className="w-20 h-20 rounded-full text-white flex items-center justify-center mx-auto mb-4 transition-all pulse-ring"
            style={{ background: "var(--accent)" }}
          >
            <Mic size={30} />
          </button>
          <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Start Speaking</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Target: {taskTime}</p>
        </div>
      )}

      {state === "prep" && (
        <div className="text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "var(--bg-secondary)" }}>
            <Clock size={28} style={{ color: "#F5A623" }} />
          </div>
          <p className="text-3xl font-bold font-mono mb-1" style={{ color: "#F5A623" }}>{prepTimer}</p>
          <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Preparation time</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Recording starts automatically</p>
        </div>
      )}

      {state === "recording" && (
        <div className="text-center">
          <div className="flex items-center gap-1.5 justify-center mb-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-bold text-red-500 uppercase tracking-wide">Recording</span>
          </div>
          <p className="text-3xl font-bold font-mono mb-4" style={{ color: "var(--text-primary)" }}>{timer}</p>
          <div className="flex items-end gap-1 justify-center h-10 mb-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="wave-bar w-1.5 rounded-full" style={{ height: "24px", background: "var(--accent)" }} />
            ))}
          </div>
          <button
            onClick={onStop}
            className="flex items-center gap-2 text-white font-semibold px-5 py-2 rounded-lg transition-colors bg-red-500 hover:bg-red-600"
          >
            <Square size={14} /> Stop & Score
          </button>
        </div>
      )}

      {(state === "transcribing" || state === "analyzing") && (
        <div className="text-center">
          <BarChart2 size={36} className="mx-auto mb-3 spin-slow" style={{ color: "var(--accent)" }} />
          <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
            {state === "transcribing" ? "Transcribing…" : "Scoring with AI…"}
          </p>
          <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
            {state === "transcribing" ? "Converting speech to text" : "Evaluating fluency, pronunciation & content"}
          </p>
          <div className="flex justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ background: "var(--accent)", animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      )}

      {state === "done" && (
        <div className="text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "var(--bg-secondary)" }}>
            <BarChart2 size={26} style={{ color: "#00B37D" }} />
          </div>
          <p className="font-bold mb-1" style={{ color: "#00B37D" }}>Scoring complete!</p>
          <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>Scroll down to see your PTE scores.</p>
          <button
            onClick={onReset}
            className="text-xs font-semibold px-4 py-1.5 rounded-lg border transition-colors"
            style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
