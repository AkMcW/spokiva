"use client";
import { useState, useRef, useMemo } from "react";
import {
  Volume2, Play, Pause, Download, Copy, CheckCircle, Loader2,
  Repeat, ArrowRight, ArrowLeft, RotateCcw, Info, Users, ChevronDown, X, Search,
} from "lucide-react";

interface VoiceOpt { id: string; name: string; category: string; description: string; previewUrl: string }

function splitSentences(t: string): string[] {
  return t
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export default function PracticeListenShadow({ text }: { text: string }) {
  const [voiceId, setVoiceId] = useState("");
  const [mode, setMode] = useState<"listen" | "shadow">("listen");
  const [err, setErr] = useState("");

  // ElevenLabs "My Voices" picker (balloon)
  const [voices, setVoices] = useState<VoiceOpt[] | null>(null);
  const [voicesLoading, setVoicesLoading] = useState(false);
  const [voicesConfigured, setVoicesConfigured] = useState(true);
  const [voicesErr, setVoicesErr] = useState("");
  const [showVoices, setShowVoices] = useState(false);
  const [voiceSearch, setVoiceSearch] = useState("");
  const previewRef = useRef<HTMLAudioElement | null>(null);

  // ── Listen ──
  const [audioB64, setAudioB64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ── Shadow ──
  const sentences = useMemo(() => splitSentences(text), [text]);
  const [idx, setIdx] = useState(0);
  const [shadowLoading, setShadowLoading] = useState(false);
  const [shadowPlaying, setShadowPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const shadowCache = useRef<Record<number, string>>({});
  const shadowAudioRef = useRef<HTMLAudioElement | null>(null);

  async function tts(t: string): Promise<string> {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: t, voiceId: voiceId.trim() || undefined }),
    });
    const data = await res.json();
    if (!res.ok || !data.audio) throw new Error(data.error || "Text-to-speech failed");
    return data.audio as string;
  }

  function stopAll() {
    if (audioRef.current) audioRef.current.pause();
    if (shadowAudioRef.current) shadowAudioRef.current.pause();
    if (previewRef.current) previewRef.current.pause();
    setPlaying(false);
    setShadowPlaying(false);
  }

  async function loadVoices() {
    setVoicesLoading(true);
    setVoicesErr("");
    try {
      const res = await fetch("/api/tts/voices");
      const data = await res.json();
      setVoicesConfigured(!!data.configured);
      setVoices(Array.isArray(data.voices) ? data.voices : []);
      if (data.error) setVoicesErr(data.error);
    } catch {
      setVoicesErr("Failed to load voices.");
      setVoices([]);
    } finally {
      setVoicesLoading(false);
    }
  }

  function toggleVoices() {
    const next = !showVoices;
    setShowVoices(next);
    if (next && voices === null && !voicesLoading) loadVoices();
  }

  function previewVoice(url: string) {
    if (!url) return;
    if (previewRef.current) previewRef.current.pause();
    const audio = new Audio(url);
    previewRef.current = audio;
    audio.play().catch(() => {});
  }

  function selectVoice(v: VoiceOpt) {
    setVoiceId(v.id);
    setShowVoices(false);
  }

  const filteredVoices = (voices ?? []).filter((v) => {
    const q = voiceSearch.trim().toLowerCase();
    if (!q) return true;
    return v.name.toLowerCase().includes(q) || v.description.toLowerCase().includes(q) || v.category.toLowerCase().includes(q);
  });

  // ── Listen actions ──
  async function generateListen() {
    setErr("");
    setLoading(true);
    try {
      const b = await tts(text);
      setAudioB64(b);
      playListen(b);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Text-to-speech failed");
    } finally {
      setLoading(false);
    }
  }

  function playListen(b64?: string) {
    const src = b64 ?? audioB64;
    if (!src) return;
    if (playing) { audioRef.current?.pause(); setPlaying(false); return; }
    const audio = new Audio(`data:audio/mpeg;base64,${src}`);
    audioRef.current = audio;
    audio.onended = () => setPlaying(false);
    audio.onerror = () => setPlaying(false);
    setPlaying(true);
    audio.play().catch(() => setPlaying(false));
  }

  function download() {
    if (!audioB64) return;
    const a = document.createElement("a");
    a.href = `data:audio/mpeg;base64,${audioB64}`;
    a.download = "spokiva-tts.mp3";
    a.click();
  }

  function copyText() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // ── Shadow actions ──
  async function playSentence(i: number) {
    const s = sentences[i];
    if (!s) return;
    setErr("");
    if (shadowAudioRef.current) shadowAudioRef.current.pause();
    setShadowLoading(true);
    try {
      let b = shadowCache.current[i];
      if (!b) { b = await tts(s); shadowCache.current[i] = b; }
      const audio = new Audio(`data:audio/mpeg;base64,${b}`);
      shadowAudioRef.current = audio;
      audio.onended = () => setShadowPlaying(false); // auto-pause → user repeats
      audio.onerror = () => setShadowPlaying(false);
      setShadowPlaying(true);
      await audio.play().catch(() => setShadowPlaying(false));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Text-to-speech failed");
    } finally {
      setShadowLoading(false);
    }
  }

  function startShadow() {
    setStarted(true);
    setIdx(0);
    playSentence(0);
  }

  function goNext() {
    if (idx >= sentences.length - 1) return;
    const n = idx + 1;
    setIdx(n);
    playSentence(n);
  }

  function goPrev() {
    if (idx <= 0) return;
    const p = idx - 1;
    setIdx(p);
    playSentence(p);
  }

  const isLast = idx >= sentences.length - 1;

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h2 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Volume2 size={17} className="text-[var(--accent)]" /> Listen &amp; Shadow
        </h2>
        <div className="flex items-center gap-1 border border-[var(--border)] rounded overflow-hidden text-xs font-semibold">
          <button onClick={() => { stopAll(); setMode("listen"); }}
            className={`px-3 py-1.5 transition-colors ${mode === "listen" ? "bg-[var(--accent)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"}`}>
            AI Speak
          </button>
          <button onClick={() => { stopAll(); setMode("shadow"); }}
            className={`px-3 py-1.5 transition-colors ${mode === "shadow" ? "bg-[var(--accent)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"}`}>
            Shadowing
          </button>
        </div>
      </div>

      {/* Voice ID */}
      <div className="mb-4 relative">
        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
          ElevenLabs Voice ID <span className="font-normal">(optional — leave blank for the default voice)</span>
        </label>
        <div className="flex gap-2">
          <input
            value={voiceId}
            onChange={(e) => setVoiceId(e.target.value)}
            placeholder="e.g. 21m00Tcm4TlvDq8ikWAM"
            className="flex-1 min-w-0 px-3 py-2 border border-[var(--border)] rounded text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
          />
          <button
            onClick={toggleVoices}
            className="flex items-center gap-1.5 border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] font-semibold px-3 py-2 rounded text-sm transition-colors shrink-0"
            title="Choose from your ElevenLabs voices"
          >
            <Users size={15} /> My Voices <ChevronDown size={13} className={`transition-transform ${showVoices ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Voice picker balloon */}
        {showVoices && (
          <div className="absolute right-0 z-30 mt-2 w-full sm:w-96 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)]">
              <span className="text-sm font-bold text-[var(--text-primary)]">Your ElevenLabs Voices</span>
              <button onClick={() => setShowVoices(false)} className="text-[var(--text-muted)] hover:text-[#E53935]"><X size={16} /></button>
            </div>

            {voicesConfigured && voices && voices.length > 0 && (
              <div className="px-3 pt-2.5">
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    value={voiceSearch}
                    onChange={(e) => setVoiceSearch(e.target.value)}
                    placeholder="Search voices…"
                    className="w-full pl-8 pr-3 py-1.5 border border-[var(--border)] rounded text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>
            )}

            <div className="max-h-72 overflow-y-auto p-2">
              {voicesLoading && (
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] px-2 py-6 justify-center">
                  <Loader2 size={15} className="animate-spin text-[var(--accent)]" /> Loading your voices…
                </div>
              )}

              {!voicesLoading && !voicesConfigured && (
                <div className="px-3 py-4 text-xs text-[var(--text-secondary)] leading-relaxed">
                  ElevenLabs isn&apos;t connected on the server, so your voice library can&apos;t be listed. You can still paste a Voice ID manually, or the default voice will be used.
                </div>
              )}

              {!voicesLoading && voicesConfigured && voicesErr && (
                <div className="px-3 py-3 text-xs text-[#E53935]">{voicesErr}</div>
              )}

              {!voicesLoading && voicesConfigured && voices && voices.length === 0 && !voicesErr && (
                <div className="px-3 py-4 text-xs text-[var(--text-secondary)]">No voices found in your ElevenLabs account.</div>
              )}

              {!voicesLoading && filteredVoices.map((v) => (
                <div key={v.id}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${voiceId === v.id ? "bg-[var(--accent-bg)]" : "hover:bg-[var(--bg-hover)]"}`}
                  onClick={() => selectVoice(v)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-[var(--text-primary)] truncate">{v.name}</span>
                      {v.category && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)] capitalize shrink-0">{v.category}</span>}
                      {voiceId === v.id && <CheckCircle size={13} className="text-[#00B37D] shrink-0" />}
                    </div>
                    {v.description && <p className="text-[11px] text-[var(--text-muted)] truncate">{v.description}</p>}
                    <p className="text-[10px] text-[var(--text-muted)] font-mono truncate">{v.id}</p>
                  </div>
                  {v.previewUrl && (
                    <button
                      onClick={(e) => { e.stopPropagation(); previewVoice(v.previewUrl); }}
                      className="p-1.5 rounded-full text-[var(--accent)] hover:bg-[var(--accent-bg)] shrink-0"
                      title="Preview voice">
                      <Play size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {err && (
        <div className="bg-[var(--danger-bg)] border border-[var(--danger-border)] rounded-lg p-3 mb-4 text-xs text-[#E53935]">{err}</div>
      )}

      {/* ── AI Speak (listen) ── */}
      {mode === "listen" && (
        <div>
          <p className="text-xs text-[var(--text-secondary)] mb-3">Generate a spoken version of your whole script — listen back, download it, or copy the text.</p>
          <div className="flex flex-wrap gap-2">
            {!audioB64 ? (
              <button onClick={generateListen} disabled={loading}
                className="flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold px-4 py-2 rounded text-sm transition-colors disabled:opacity-70">
                {loading ? <><Loader2 size={15} className="animate-spin" /> Generating…</> : <><Volume2 size={15} /> Let AI speak</>}
              </button>
            ) : (
              <>
                <button onClick={() => playListen()}
                  className="flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold px-4 py-2 rounded text-sm transition-colors">
                  {playing ? <><Pause size={15} /> Pause</> : <><Play size={15} /> Play</>}
                </button>
                <button onClick={generateListen} disabled={loading}
                  className="flex items-center gap-2 border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] font-semibold px-4 py-2 rounded text-sm transition-colors disabled:opacity-70">
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />} Regenerate
                </button>
                <button onClick={download}
                  className="flex items-center gap-2 border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] font-semibold px-4 py-2 rounded text-sm transition-colors">
                  <Download size={15} /> Save audio
                </button>
              </>
            )}
            <button onClick={copyText}
              className="flex items-center gap-2 border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] font-semibold px-4 py-2 rounded text-sm transition-colors">
              {copied ? <><CheckCircle size={15} className="text-[#00B37D]" /> Copied</> : <><Copy size={15} /> Copy text</>}
            </button>
          </div>
        </div>
      )}

      {/* ── Shadowing ── */}
      {mode === "shadow" && (
        <div>
          <p className="text-xs text-[var(--text-secondary)] mb-3 flex items-start gap-1.5">
            <Info size={13} className="mt-0.5 shrink-0 text-[var(--accent)]" />
            Listen to one sentence, it auto-pauses, you repeat it aloud, then hit Continue for the next.
          </p>

          {sentences.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No script text to shadow.</p>
          ) : !started ? (
            <button onClick={startShadow}
              className="flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold px-4 py-2 rounded text-sm transition-colors">
              <Repeat size={15} /> Start shadowing ({sentences.length} sentences)
            </button>
          ) : (
            <div>
              {/* Progress */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Sentence {idx + 1} of {sentences.length}</span>
                <div className="flex items-center gap-1">
                  {shadowLoading && <Loader2 size={13} className="animate-spin text-[var(--accent)]" />}
                  {shadowPlaying && <span className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-wider">Playing…</span>}
                  {!shadowPlaying && !shadowLoading && <span className="text-[10px] font-bold text-[#00B37D] uppercase tracking-wider">Your turn — repeat it</span>}
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-[var(--bg-secondary)] mb-4">
                <div className="h-1.5 rounded-full bg-[var(--accent)] transition-all duration-300" style={{ width: `${((idx + 1) / sentences.length) * 100}%` }} />
              </div>

              {/* Current sentence */}
              <div className="bg-[var(--accent-bg)] border border-[var(--border)] rounded-lg p-4 mb-4">
                <p className="text-base text-[var(--text-primary)] leading-relaxed">{sentences[idx]}</p>
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => playSentence(idx)} disabled={shadowLoading}
                  className="flex items-center gap-2 border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent-bg)] font-semibold px-4 py-2 rounded text-sm transition-colors disabled:opacity-70">
                  {shadowPlaying ? <Pause size={15} /> : <Play size={15} />} Replay
                </button>
                <button onClick={goPrev} disabled={idx <= 0}
                  className="flex items-center gap-1.5 border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] font-semibold px-3 py-2 rounded text-sm transition-colors disabled:opacity-40">
                  <ArrowLeft size={15} /> Prev
                </button>
                {!isLast ? (
                  <button onClick={goNext}
                    className="flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold px-4 py-2 rounded text-sm transition-colors">
                    Continue <ArrowRight size={15} />
                  </button>
                ) : (
                  <button onClick={() => { setStarted(false); setIdx(0); }}
                    className="flex items-center gap-2 bg-[#00B37D] hover:bg-[#009467] text-white font-semibold px-4 py-2 rounded text-sm transition-colors">
                    <CheckCircle size={15} /> Finish
                  </button>
                )}
                <button onClick={() => { stopAll(); setStarted(false); setIdx(0); }}
                  className="text-xs text-[var(--text-secondary)] hover:text-[#E53935] transition-colors ml-1">
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
