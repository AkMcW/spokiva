"use client";
import { useState, useEffect, useRef } from "react";
import { Mic, Download, Trash2, Play, Square, FileAudio, BarChart2 } from "lucide-react";
import { getAllRecordings, deleteRecording, type SavedRecord } from "@/lib/recordings";

function fmtDuration(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function scoreColor(score: number) {
  if (score >= 80) return "text-[#00B37D]";
  if (score >= 60) return "text-[#F5A623]";
  return "text-red-500";
}

export default function RecordsPage() {
  const [records, setRecords] = useState<SavedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    getAllRecordings().then((r) => { setRecords(r); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  function stopAudio() {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (urlRef.current) { URL.revokeObjectURL(urlRef.current); urlRef.current = null; }
    setPlayingId(null);
  }

  function togglePlay(record: SavedRecord) {
    if (playingId === record.id) { stopAudio(); return; }
    stopAudio();
    const url = URL.createObjectURL(record.audioBlob);
    urlRef.current = url;
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => { stopAudio(); };
    audio.play();
    setPlayingId(record.id);
  }

  function downloadRecord(record: SavedRecord) {
    const ext = record.mimeType?.includes("mp4") ? "m4a"
      : record.mimeType?.includes("ogg") ? "ogg"
      : record.mimeType?.includes("wav") ? "wav"
      : "webm";
    const url = URL.createObjectURL(record.audioBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `spokiva-${record.scenario.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-${new Date(record.createdAt).toISOString().slice(0, 10)}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDelete(id: number) {
    if (playingId === id) stopAudio();
    await deleteRecording(id);
    setRecords((r) => r.filter((rec) => rec.id !== id));
  }

  // cleanup on unmount
  useEffect(() => () => stopAudio(), []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Saved Recordings</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {loading ? "Loading…" : `${records.length} recording${records.length !== 1 ? "s" : ""} saved locally`}
          </p>
        </div>
      </div>

      {loading && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-10 text-center">
          <div className="flex justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      )}

      {!loading && records.length === 0 && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-12 text-center">
          <FileAudio size={40} className="text-[var(--text-muted)] mx-auto mb-3" />
          <p className="font-semibold text-[var(--text-primary)] mb-1">No recordings yet</p>
          <p className="text-sm text-[var(--text-secondary)]">Complete a practice session and your recordings will appear here automatically.</p>
        </div>
      )}

      {!loading && records.length > 0 && (
        <div className="space-y-3">
          {records.map((record) => (
            <div key={record.id} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Icon */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${playingId === record.id ? "bg-[var(--accent)]" : "bg-[var(--accent-bg)]"}`}>
                  <Mic size={18} className={playingId === record.id ? "text-white" : "text-[var(--accent)]"} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[var(--accent-bg)] text-[var(--accent)]">
                      {record.scenario}
                    </span>
                    {record.overallScore > 0 && (
                      <span className={`text-xs font-bold ${scoreColor(record.overallScore)}`}>
                        <BarChart2 size={11} className="inline mr-0.5" />
                        {record.overallScore}/100
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
                    <span>{fmtDate(record.createdAt)}</span>
                    <span>·</span>
                    <span>{fmtDuration(record.duration)}</span>
                    {record.wpm > 0 && <><span>·</span><span>{record.wpm} wpm</span></>}
                  </div>
                  {record.transcript && (
                    <p className="text-xs text-[var(--text-secondary)] mt-1.5 line-clamp-2 leading-relaxed">{record.transcript}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => togglePlay(record)}
                    className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded transition-colors ${
                      playingId === record.id
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : "bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white"
                    }`}
                  >
                    {playingId === record.id ? <Square size={12} /> : <Play size={12} />}
                    {playingId === record.id ? "Stop" : "Play"}
                  </button>
                  <button
                    onClick={() => downloadRecord(record)}
                    className="flex items-center gap-1 text-xs border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] px-3 py-1.5 rounded transition-colors font-medium"
                  >
                    <Download size={12} />
                    Download
                  </button>
                  <button
                    onClick={() => handleDelete(record.id)}
                    className="flex items-center gap-1 text-xs border border-[var(--border)] text-[var(--text-secondary)] hover:border-red-400 hover:text-red-500 px-3 py-1.5 rounded transition-colors font-medium"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {/* Waveform / playing indicator */}
              {playingId === record.id && (
                <div className="mt-3 flex items-center gap-1 justify-center h-6">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div key={i} className="wave-bar w-1 bg-[var(--accent)] rounded-full" style={{ height: "16px" }} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="bg-[var(--bg-secondary)] rounded-lg p-4 text-xs text-[var(--text-secondary)]">
        <p className="font-semibold text-[var(--text-primary)] mb-1">About saved recordings</p>
        Recordings are stored locally in your browser (IndexedDB) and never uploaded. Clearing browser data will remove them. Download to keep a permanent copy.
      </div>
    </div>
  );
}
