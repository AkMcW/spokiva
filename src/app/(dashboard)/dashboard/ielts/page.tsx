"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Mic, Square, Clock, BarChart2, Sparkles, Save, CheckCircle, Loader2, Mic2, Lightbulb } from "lucide-react";
import { toBand } from "@/lib/speechMetrics";

type Part = "1" | "2" | "3";
type RecordState = "idle" | "prep" | "recording" | "transcribing" | "analyzing" | "done";

const part1Questions = [
  "Do you enjoy cooking? Why or why not?",
  "How often do you use public transport?",
  "What do you usually do in your free time?",
  "Do you prefer living in a house or an apartment?",
  "How important is it to you to keep up with the news?",
  "Describe your hometown.",
  "Do you prefer spending time indoors or outdoors?",
  "How do you usually travel to work or school?",
];

const part2Cards = [
  {
    topic: "Describe a memorable journey you have taken.",
    points: ["Where you went", "Who you went with", "What you did there", "Why it was memorable"],
  },
  {
    topic: "Describe a person who has influenced you greatly.",
    points: ["Who this person is", "How you know them", "What they did", "Why they influenced you"],
  },
  {
    topic: "Describe a book or film that you enjoyed.",
    points: ["What it was about", "When you read/watched it", "What you liked about it", "Why you recommend it"],
  },
];

const part3Questions = [
  "Why do you think people enjoy travelling to foreign countries?",
  "How has tourism changed in recent years?",
  "What are the advantages and disadvantages of international travel?",
  "Do you think travel broadens the mind? Why?",
  "How important is it for young people to travel abroad?",
];

interface BandResult {
  fluency: number | null;
  lexical: number | null;
  grammar: number | null;
  pronunciation: number | null;
  overall: number | null;
  feedback: string;
}

export default function IELTSPage() {
  const [activePart, setActivePart] = useState<Part>("1");
  const [recordState, setRecordState] = useState<RecordState>("idle");
  const [prepTimer, setPrepTimer] = useState(60);
  const [speakTimer, setSpeakTimer] = useState(0);
  const [q1Index, setQ1Index] = useState(0);
  const [q3Index, setQ3Index] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [result, setResult] = useState<BandResult | null>(null);
  const [error, setError] = useState("");
  const [userTranscript, setUserTranscript] = useState("");
  const [rewrite, setRewrite] = useState<{ rewrite: string; tips: string[] } | null>(null);
  const [rewriteLoading, setRewriteLoading] = useState(false);
  const [savedRewrite, setSavedRewrite] = useState(false);
  const router = useRouter();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  function clearTimer() {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  function startTimer() {
    intervalRef.current = setInterval(() => setSpeakTimer((s) => s + 1), 1000);
  }

  async function startRecording() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.start(100);
      setSpeakTimer(0);
      setRecordState("recording");
      startTimer();
    } catch {
      setError("Microphone access denied.");
    }
  }

  function startPart2Prep() {
    setError("");
    setPrepTimer(60);
    setRecordState("prep");
    intervalRef.current = setInterval(() => {
      setPrepTimer((t) => {
        if (t <= 1) {
          clearTimer();
          navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            chunksRef.current = [];
            recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
            recorder.start(100);
            setSpeakTimer(0);
            setRecordState("recording");
            startTimer();
          }).catch(() => setError("Microphone access denied."));
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
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      let transcript = "";
      let speechMetrics: unknown = null;

      try {
        const form = new FormData();
        form.append("audio", blob, "recording.webm");
        const res = await fetch("/api/practice/transcribe", { method: "POST", body: form });
        const data = await res.json();
        transcript = data.transcript || "";
        speechMetrics = data.metrics ?? null;
      } catch {
        setError("Transcription failed.");
        setRecordState("idle");
        return;
      }

      setRecordState("analyzing");
      const partLabel = activePart === "1" ? "Part 1" : activePart === "2" ? "Part 2 cue card" : "Part 3";
      try {
        const res = await fetch("/api/practice/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript,
            metrics: speechMetrics,
            scenario: `IELTS Speaking ${partLabel}`,
          }),
        });
        const data = await res.json();
        setResult({
          // Scores arrive on a 0–100 scale; convert each to an IELTS band.
          fluency: toBand(data.scores?.fluency),
          lexical: toBand(data.scores?.vocabulary),
          grammar: toBand(data.scores?.structure),
          pronunciation: toBand(data.scores?.pronunciation),
          overall: data.bandScore ?? toBand(data.scores?.overall),
          feedback: data.aiFeedback ?? "",
        });
        setUserTranscript(transcript);
        setRecordState("done");
        fetchRewrite(transcript);
      } catch {
        setError("Analysis failed.");
        setRecordState("idle");
      }
    };
  }

  function currentPromptText() {
    if (activePart === "1") return part1Questions[q1Index];
    if (activePart === "2") {
      const c = part2Cards[cardIndex];
      return `${c.topic} You should say: ${c.points.join("; ")}.`;
    }
    return part3Questions[q3Index];
  }

  async function fetchRewrite(transcript: string) {
    setRewrite(null);
    setSavedRewrite(false);
    setRewriteLoading(true);
    const partLabel = activePart === "1" ? "Part 1" : activePart === "2" ? "Part 2 (cue card long turn)" : "Part 3";
    try {
      const res = await fetch("/api/ielts/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, part: partLabel, prompt: currentPromptText() }),
      });
      const data = await res.json();
      if (res.ok && data.rewrite) setRewrite({ rewrite: data.rewrite, tips: Array.isArray(data.tips) ? data.tips : [] });
    } catch {
      /* rewrite is best-effort */
    } finally {
      setRewriteLoading(false);
    }
  }

  async function saveRewriteScript() {
    if (!rewrite?.rewrite) return;
    try {
      const res = await fetch("/api/scripts/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `IELTS ${activePart === "1" ? "Part 1" : activePart === "2" ? "Part 2" : "Part 3"} — Model Answer`,
          scenario: `IELTS Speaking Part ${activePart}`,
          content: rewrite.rewrite,
          wordCount: rewrite.rewrite.split(/\s+/).filter(Boolean).length,
          duration: activePart === "2" ? "2min" : "1min",
        }),
      });
      if (res.ok) { setSavedRewrite(true); setTimeout(() => setSavedRewrite(false), 3000); }
    } catch { /* ignore */ }
  }

  function practiceRewrite() {
    if (!rewrite?.rewrite) return;
    sessionStorage.setItem("sf_practice_script", rewrite.rewrite);
    sessionStorage.setItem("sf_practice_scenario", `IELTS Speaking Part ${activePart}`);
    router.push("/dashboard/practice");
  }

  function reset() {
    clearTimer();
    setRecordState("idle");
    setPrepTimer(60);
    setSpeakTimer(0);
    setResult(null);
    setError("");
    setUserTranscript("");
    setRewrite(null);
    setRewriteLoading(false);
    setSavedRewrite(false);
    if (mediaRecorderRef.current) {
      try { mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop()); } catch { /* ignore */ }
    }
  }

  useEffect(() => { reset(); }, [activePart]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => clearTimer(), []);

  const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const currentCard = part2Cards[cardIndex];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">IELTS Speaking Practice</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Practice all three parts with real AI band score estimates.</p>
      </div>

      <div className="flex gap-1 bg-[var(--bg-secondary)] rounded-lg p-1 w-fit">
        {(["1", "2", "3"] as Part[]).map((p) => (
          <button
            key={p}
            onClick={() => setActivePart(p)}
            className={`px-5 py-2 rounded text-sm font-semibold transition-colors ${
              activePart === p ? "bg-[var(--bg-card)] text-[var(--accent)] shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Part {p}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-[var(--danger-bg)] border border-[var(--danger-border)] rounded-lg p-3 text-xs text-[#E53935]">{error}</div>
      )}

      {activePart === "1" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6">
            <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Part 1 · Personal Questions · 4–5 min</p>
            <p className="text-sm text-[var(--text-secondary)] mb-4">Answer naturally. Aim for 2–3 sentences per answer.</p>
            <div className="bg-[var(--accent-bg)] rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-[var(--text-primary)] italic">&ldquo;{part1Questions[q1Index]}&rdquo;</p>
            </div>
            <button onClick={() => setQ1Index((i) => (i + 1) % part1Questions.length)} className="text-xs text-[var(--accent)] font-semibold hover:underline">
              Next question →
            </button>
          </div>
          <RecordPanel state={recordState} timer={fmtTime(speakTimer)} onStart={startRecording} onStop={stopRecording} onReset={reset} />
        </div>
      )}

      {activePart === "2" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6">
            <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Part 2 · Cue Card · 1 min prep + 1–2 min talk</p>
            <p className="text-sm font-bold text-[var(--text-primary)] mb-3">{currentCard.topic}</p>
            <p className="text-xs text-[var(--text-secondary)] mb-2 font-semibold">You should say:</p>
            <ul className="space-y-1 mb-4">
              {currentCard.points.map((pt) => (
                <li key={pt} className="text-sm text-[var(--text-secondary)] flex items-start gap-1.5">
                  <span className="text-[var(--accent)] font-bold">›</span>{pt}
                </li>
              ))}
            </ul>
            {recordState === "prep" && (
              <div className="bg-[var(--warning-bg)] border border-[#F5A623] rounded-lg p-3 flex items-center gap-2">
                <Clock size={16} className="text-[#F5A623]" />
                <span className="text-sm font-bold text-[#F5A623]">Prep time: {fmtTime(prepTimer)}</span>
              </div>
            )}
            <button onClick={() => { reset(); setCardIndex((i) => (i + 1) % part2Cards.length); }} className="text-xs text-[var(--accent)] font-semibold hover:underline mt-3 block">
              Different card →
            </button>
          </div>
          <RecordPanel state={recordState} timer={fmtTime(speakTimer)} onStart={startPart2Prep} onStop={stopRecording} onReset={reset} startLabel="Start 1-min Prep" />
        </div>
      )}

      {activePart === "3" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6">
            <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Part 3 · Discussion · 4–5 min</p>
            <p className="text-sm text-[var(--text-secondary)] mb-4">Give extended, analytical answers with reasons and examples.</p>
            <div className="bg-[var(--accent-bg)] rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-[var(--text-primary)] italic">&ldquo;{part3Questions[q3Index]}&rdquo;</p>
            </div>
            <button onClick={() => setQ3Index((i) => (i + 1) % part3Questions.length)} className="text-xs text-[var(--accent)] font-semibold hover:underline">
              Next question →
            </button>
          </div>
          <RecordPanel state={recordState} timer={fmtTime(speakTimer)} onStart={startRecording} onStop={stopRecording} onReset={reset} />
        </div>
      )}

      {recordState === "done" && result && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6">
          <h2 className="font-bold text-[var(--text-primary)] mb-4">Estimated Band Scores</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            {[
              { label: "Fluency", val: result.fluency },
              { label: "Lexical Resource", val: result.lexical },
              { label: "Grammar", val: result.grammar },
              { label: "Pronunciation", val: result.pronunciation },
            ].map(({ label, val }) => (
              <div key={label} className="text-center bg-[var(--bg-secondary)] rounded-lg p-4">
                <p className="text-2xl font-bold text-[var(--accent)]">{val == null ? "—" : val.toFixed(1)}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">{label}</p>
              </div>
            ))}
          </div>
          <div className="bg-[var(--accent-bg)] rounded-lg p-4">
            <p className="text-sm font-semibold text-[var(--accent)] mb-1">Overall Estimate: Band {result.overall == null ? "—" : result.overall.toFixed(1)}</p>
            {result.feedback && <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{result.feedback}</p>}
          </div>
          <button onClick={reset} className="mt-4 text-xs border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent-bg)] px-4 py-1.5 rounded font-semibold transition-colors">
            Practice Again
          </button>
        </div>
      )}

      {/* Model answer rewrite */}
      {recordState === "done" && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6">
          <h2 className="font-bold text-[var(--text-primary)] mb-1 flex items-center gap-2">
            <Sparkles size={17} className="text-[var(--accent)]" /> Recommended Model Answer
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mb-4">A Band 8.5–9 rewrite of your answer with a clear, correct structure — keep practicing with this version.</p>

          {rewriteLoading && (
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] py-6 justify-center">
              <Loader2 size={16} className="animate-spin text-[var(--accent)]" /> Building your model answer…
            </div>
          )}

          {!rewriteLoading && rewrite && (
            <>
              {userTranscript && (
                <details className="mb-4">
                  <summary className="text-xs font-semibold text-[var(--text-secondary)] cursor-pointer">View what you said</summary>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed mt-2 bg-[var(--bg-secondary)] rounded-lg p-3">{userTranscript}</p>
                </details>
              )}

              <div className="bg-[var(--accent-bg)] border border-[var(--border)] rounded-lg p-4 mb-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] mb-2">Model Answer</p>
                <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">{rewrite.rewrite}</p>
              </div>

              {rewrite.tips.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-bold text-[var(--text-primary)] mb-2 flex items-center gap-1.5"><Lightbulb size={13} className="text-[#F5A623]" /> Structure tips</p>
                  <ul className="space-y-1.5">
                    {rewrite.tips.map((t, i) => (
                      <li key={i} className="text-xs text-[var(--text-secondary)] flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0" /> {t}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <button onClick={practiceRewrite}
                  className="flex items-center gap-1.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold px-4 py-2 rounded text-sm transition-colors">
                  <Mic2 size={14} /> Practice this answer
                </button>
                <button onClick={saveRewriteScript} disabled={savedRewrite}
                  className="flex items-center gap-1.5 border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent-bg)] font-semibold px-4 py-2 rounded text-sm transition-colors disabled:opacity-70">
                  {savedRewrite ? <><CheckCircle size={14} className="text-[#00B37D]" /> Saved</> : <><Save size={14} /> Save for practice</>}
                </button>
              </div>
            </>
          )}

          {!rewriteLoading && !rewrite && (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-[var(--text-secondary)]">Couldn&apos;t build a model answer.</p>
              <button onClick={() => fetchRewrite(userTranscript)} className="text-xs font-semibold text-[var(--accent)] hover:underline">Try again</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RecordPanel({
  state, timer, onStart, onStop, onReset, startLabel,
}: {
  state: RecordState; timer: string; onStart: () => void; onStop: () => void; onReset: () => void; startLabel?: string;
}) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6 flex flex-col items-center justify-center min-h-52">
      {state === "idle" && (
        <div className="text-center">
          <button onClick={onStart} className="w-20 h-20 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white flex items-center justify-center mx-auto mb-4 transition-colors pulse-ring">
            <Mic size={30} />
          </button>
          <p className="text-sm text-[var(--text-secondary)]">{startLabel ?? "Start Recording"}</p>
        </div>
      )}
      {state === "prep" && (
        <div className="text-center">
          <Clock size={40} className="text-[#F5A623] mx-auto mb-2" />
          <p className="text-sm font-semibold text-[var(--text-primary)]">Preparation time</p>
          <p className="text-xs text-[var(--text-secondary)]">Speaking will start automatically</p>
        </div>
      )}
      {state === "recording" && (
        <div className="text-center">
          <div className="flex items-center gap-1.5 justify-center mb-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-xs font-bold text-red-500 uppercase">Recording</span>
          </div>
          <p className="text-3xl font-bold text-[var(--text-primary)] mb-4 font-mono">{timer}</p>
          <div className="flex items-end gap-1 justify-center h-10 mb-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="wave-bar w-1.5 bg-[var(--accent)] rounded-full" style={{ height: "24px" }} />
            ))}
          </div>
          <button onClick={onStop} className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold px-5 py-2 rounded transition-colors">
            <Square size={14} /> Stop & Analyze
          </button>
        </div>
      )}
      {(state === "transcribing" || state === "analyzing") && (
        <div className="text-center">
          <BarChart2 size={36} className="text-[var(--accent)] mx-auto mb-3 spin-slow" />
          <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">
            {state === "transcribing" ? "Transcribing..." : "Analyzing with AI..."}
          </p>
          <div className="flex justify-center gap-1 mt-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      )}
      {state === "done" && (
        <div className="text-center">
          <p className="font-bold text-[#00B37D] mb-2">Analysis complete!</p>
          <p className="text-xs text-[var(--text-secondary)] mb-4">Scroll down to see your band scores.</p>
          <button onClick={onReset} className="text-xs border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent-bg)] px-4 py-1.5 rounded transition-colors font-semibold">
            Practice Again
          </button>
        </div>
      )}
    </div>
  );
}
