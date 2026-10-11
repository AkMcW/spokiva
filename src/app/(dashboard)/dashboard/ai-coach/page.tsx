"use client";
import { useState, useRef, useEffect } from "react";
import { Mic, Square, Volume2, VolumeX, Bot, User, Loader2, Radio } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const TOPICS = [
  "Free conversation practice",
  "Job interview coaching",
  "Public speaking tips",
  "IELTS speaking prep",
  "Pronunciation & clarity",
  "Business presentation skills",
  "Confidence building",
  "Storytelling technique",
];

export default function AICoachPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [recording, setRecording] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState("");
  const [topic, setTopic] = useState(TOPICS[0]);
  const [started, setStarted] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [handsFree, setHandsFree] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Hands-free / voice-activity detection
  const handsFreeRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const vadRafRef = useRef<number | null>(null);
  const silenceStartRef = useRef<number | null>(null);
  const speechDetectedRef = useRef(false);

  useEffect(() => { handsFreeRef.current = handsFree; }, [handsFree]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (audioRef.current) audioRef.current.pause();
    teardownVAD();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startSession() {
    setStarted(true);
    setError("");

    // Kick off with an opening message (stored for context, hidden in the UI)
    const opening: Message = { role: "user", content: `I'd like to practice: ${topic}` };
    setMessages([opening]);
    await sendToCoach([opening]);
  }

  // Sends the full conversation history to the coach and appends only the
  // assistant's reply (callers are responsible for adding the user's message).
  async function sendToCoach(history: Message[]) {
    setThinking(true);
    setError("");
    try {
      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to get response");

      const assistantMsg: Message = { role: "assistant", content: data.text };
      setMessages((prev) => [...prev, assistantMsg]);

      if (data.audio && !muted) {
        await playAudio(data.audio);
      }
      setThinking(false);
      // In hands-free mode, start listening again as soon as the coach finishes
      if (handsFreeRef.current) startListening();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get response");
      setThinking(false);
    }
  }

  // Resolves when playback finishes so hands-free can resume listening after.
  function playAudio(base64: string) {
    return new Promise<void>((resolve) => {
      if (audioRef.current) { audioRef.current.pause(); }
      const audio = new Audio(`data:audio/mpeg;base64,${base64}`);
      audioRef.current = audio;
      setSpeaking(true);
      audio.onended = () => { setSpeaking(false); resolve(); };
      audio.onerror = () => { setSpeaking(false); resolve(); };
      audio.play().catch(() => { setSpeaking(false); resolve(); });
    });
  }

  function teardownVAD() {
    if (vadRafRef.current) { cancelAnimationFrame(vadRafRef.current); vadRafRef.current = null; }
    if (audioContextRef.current) { audioContextRef.current.close().catch(() => {}); audioContextRef.current = null; }
    silenceStartRef.current = null;
    speechDetectedRef.current = false;
  }

  // Monitor mic volume; auto-stop & send when the user goes quiet after speaking.
  function setupVAD(stream: MediaStream) {
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      const buf = new Uint8Array(analyser.frequencyBinCount);
      speechDetectedRef.current = false;
      silenceStartRef.current = null;
      const startedAt = Date.now();

      const SPEAK_THRESHOLD = 0.025; // RMS above this counts as speech
      const SILENCE_MS = 1500;       // quiet this long after speech → send
      const NO_SPEECH_TIMEOUT = 9000; // never spoke → cancel and wait

      const tick = () => {
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v; }
        const rms = Math.sqrt(sum / buf.length);
        const now = Date.now();

        if (rms > SPEAK_THRESHOLD) {
          speechDetectedRef.current = true;
          silenceStartRef.current = null;
        } else if (speechDetectedRef.current) {
          if (silenceStartRef.current == null) silenceStartRef.current = now;
          else if (now - silenceStartRef.current > SILENCE_MS) { stopRecording(); return; }
        } else if (now - startedAt > NO_SPEECH_TIMEOUT) {
          cancelListening();
          return;
        }
        vadRafRef.current = requestAnimationFrame(tick);
      };
      vadRafRef.current = requestAnimationFrame(tick);
    } catch {
      /* VAD unavailable — user can still tap to stop */
    }
  }

  // Hands-free listen: same as startRecording but with silence detection.
  async function startListening() {
    if (recording || thinking) return;
    setError("");
    if (audioRef.current) { audioRef.current.pause(); setSpeaking(false); }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = ["audio/webm", "audio/mp4", "audio/ogg"].find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.start(100);
      setRecording(true);
      setSeconds(0);
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
      setupVAD(stream);
    } catch {
      setError("Microphone access denied.");
    }
  }

  // Stop listening WITHOUT sending (e.g. user never spoke in hands-free mode).
  function cancelListening() {
    teardownVAD();
    if (intervalRef.current) clearInterval(intervalRef.current);
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = null;
      recorder.stop();
      recorder.stream.getTracks().forEach((t) => t.stop());
    }
    setRecording(false);
  }

  async function startRecording() {
    setError("");
    if (audioRef.current) { audioRef.current.pause(); setSpeaking(false); }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = ["audio/webm", "audio/mp4", "audio/ogg"].find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.start(100);
      setRecording(true);
      setSeconds(0);
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setError("Microphone access denied.");
    }
  }

  async function stopRecording() {
    teardownVAD();
    if (intervalRef.current) clearInterval(intervalRef.current);
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    recorder.stop();
    recorder.stream.getTracks().forEach((t) => t.stop());
    setRecording(false);

    recorder.onstop = async () => {
      const mimeType = recorder.mimeType || "audio/webm";
      const blob = new Blob(chunksRef.current, { type: mimeType });

      // Transcribe
      setThinking(true);
      try {
        const form = new FormData();
        form.append("audio", blob, "recording.webm");
        const res = await fetch("/api/practice/transcribe", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error);
        const userText = data.transcript?.trim();
        if (!userText) {
          // In hands-free mode, silently resume listening instead of erroring out
          setThinking(false);
          if (handsFreeRef.current) { startListening(); return; }
          throw new Error("No speech detected — please try again");
        }

        const userMsg: Message = { role: "user", content: userText };
        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        await sendToCoach(updatedMessages);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Transcription failed");
        setThinking(false);
      }
    };
  }

  const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  if (!started) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">AI Speaking Coach</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Have a real spoken conversation with your AI coach. Speak, listen, and get instant feedback.</p>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-8 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-[var(--accent-bg)] flex items-center justify-center mx-auto">
            <Bot size={40} className="text-[var(--accent)]" />
          </div>
          <div>
            <h2 className="font-bold text-[var(--text-primary)] text-lg mb-1">Meet Coach Alex</h2>
            <p className="text-sm text-[var(--text-secondary)]">Your AI speech coach powered by GPT-4o with natural voice replies. Choose a topic and start speaking.</p>
          </div>

          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)] mb-3">What would you like to practice?</p>
            <div className="grid grid-cols-2 gap-2">
              {TOPICS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTopic(t)}
                  className={`text-sm px-3 py-2 rounded border text-left transition-colors ${
                    topic === t
                      ? "border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--accent)] font-semibold"
                      : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={startSession}
            className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Mic size={18} />
            Start Conversation
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center text-xs text-[var(--text-secondary)]">
          {[
            { icon: "🎙️", label: "Speak naturally", desc: "Hold the mic button and talk" },
            { icon: "🤖", label: "AI responds", desc: "GPT-4o generates coaching" },
            { icon: "🔊", label: "Hear feedback", desc: "The coach voices the reply" },
          ].map(({ icon, label, desc }) => (
            <div key={label} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4">
              <div className="text-2xl mb-2">{icon}</div>
              <p className="font-semibold text-[var(--text-primary)] mb-1">{label}</p>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${speaking ? "bg-[var(--accent)]" : "bg-[var(--accent-bg)]"}`}>
            <Bot size={20} className={speaking ? "text-white" : "text-[var(--accent)]"} />
          </div>
          <div>
            <p className="font-bold text-[var(--text-primary)] text-sm">Coach Alex</p>
            <p className="text-xs text-[var(--text-secondary)]">
              {speaking ? "Speaking…" : thinking ? "Thinking…" : recording ? "Listening…" : "Ready"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setHandsFree((on) => {
                const next = !on;
                handsFreeRef.current = next;
                if (next) {
                  // turn on → start listening if idle
                  if (!recording && !thinking && !speaking) startListening();
                } else {
                  // turn off → stop any auto-listening
                  if (recording) cancelListening();
                }
                return next;
              });
            }}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded border transition-colors ${
              handsFree ? "border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--accent)]" : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
            }`}
            title="Hands-free conversation — auto-listen and auto-send"
          >
            <Radio size={14} /> Hands-free
          </button>
          <button
            onClick={() => { setMuted((m) => !m); if (audioRef.current) { audioRef.current.pause(); setSpeaking(false); } }}
            className="p-2 rounded border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
            title={muted ? "Unmute" : "Mute"}
          >
            {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
          <button
            onClick={() => { cancelListening(); teardownVAD(); if (audioRef.current) audioRef.current.pause(); setSpeaking(false); setHandsFree(false); setStarted(false); setMessages([]); setError(""); }}
            className="text-xs border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] px-3 py-1.5 rounded transition-colors font-medium"
          >
            End session
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {messages
          .filter((m) => !(m.role === "user" && m.content.startsWith("I'd like to practice:")))
          .map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "assistant" ? "bg-[var(--accent-bg)]" : "bg-[var(--bg-secondary)]"}`}>
              {msg.role === "assistant" ? <Bot size={15} className="text-[var(--accent)]" /> : <User size={15} className="text-[var(--text-secondary)]" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === "assistant"
                ? "bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] rounded-tl-sm"
                : "bg-[var(--accent)] text-white rounded-tr-sm"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {thinking && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--accent-bg)] flex items-center justify-center shrink-0">
              <Bot size={15} className="text-[var(--accent)]" />
            </div>
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
              <Loader2 size={14} className="text-[var(--accent)] animate-spin" />
              <span className="text-xs text-[var(--text-secondary)] ml-1">Coach Alex is responding…</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-[var(--danger-bg)] border border-[var(--danger-border)] rounded-lg p-3 text-xs text-[#E53935]">{error}</div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Recording control */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 flex flex-col items-center gap-3">
        {recording ? (
          <>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-xs font-bold text-red-500 uppercase tracking-wider">
                {handsFree ? "Listening" : "Recording"} — {fmtTime(seconds)}
              </span>
            </div>
            <div className="flex items-end gap-0.5 h-8">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="wave-bar w-1 bg-[var(--accent)] rounded-full" style={{ height: "20px" }} />
              ))}
            </div>
            {handsFree && (
              <p className="text-xs text-[var(--text-muted)]">Speak naturally — I&apos;ll send automatically when you pause.</p>
            )}
            <button
              onClick={stopRecording}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-2.5 rounded-full transition-colors text-sm"
            >
              <Square size={14} /> {handsFree ? "Send now" : "Stop & Send"}
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <button
              disabled={thinking || speaking}
              onClick={handsFree ? startListening : startRecording}
              className="w-16 h-16 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:bg-[var(--border)] disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors pulse-ring"
            >
              <Mic size={26} />
            </button>
            <p className="text-xs text-[var(--text-muted)]">
              {thinking ? "Wait for Coach Alex to finish…" : speaking ? "Coach Alex is speaking…" : handsFree ? "Hands-free on — tap to start, then just talk" : "Press to speak"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
