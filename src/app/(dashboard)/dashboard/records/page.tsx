"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, Download, Trash2, Play, Square, FileAudio, BarChart2, CloudUpload, Loader2, AlertCircle } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import {
  getAllRecordings, deleteRecording, uploadRecording,
  type SavedRecord, type CloudRecording,
} from "@/lib/recordings";

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
  const { user } = useUser();
  const [records, setRecords] = useState<CloudRecording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [playingId, setPlayingId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Recordings saved only in this browser (before cloud storage, or when an upload failed)
  const [local, setLocal] = useState<SavedRecord[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");

  const loadCloud = useCallback(async () => {
    try {
      const res = await fetch("/api/recordings");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load recordings");
      setRecords(data.recordings ?? []);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load recordings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCloud();
    getAllRecordings().then(setLocal).catch(() => setLocal([]));
  }, [loadCloud]);

  function stopAudio() {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setPlayingId(null);
  }

  function togglePlay(record: CloudRecording) {
    if (playingId === record.id) { stopAudio(); return; }
    stopAudio();
    const audio = new Audio(`/api/recordings/${record.id}`);
    audioRef.current = audio;
    audio.onended = () => stopAudio();
    audio.onerror = () => { stopAudio(); setError("Couldn't play that recording."); };
    audio.play().catch(() => stopAudio());
    setPlayingId(record.id);
  }

  async function handleDelete(id: number) {
    if (playingId === id) stopAudio();
    const res = await fetch(`/api/recordings?id=${id}`, { method: "DELETE" });
    if (res.ok) setRecords((r) => r.filter((rec) => rec.id !== id));
    else setError("Failed to delete recording");
  }

  async function uploadLocal() {
    if (!user?.id) { setUploadMsg("Sign in to upload recordings to your account."); return; }
    setUploading(true);
    setUploadMsg("");
    let done = 0;
    const failed: string[] = [];
    for (const rec of local) {
      try {
        const { id, ...rest } = rec;
        await uploadRecording(rest, user.id);
        await deleteRecording(id);
        done++;
      } catch (e) {
        failed.push(e instanceof Error ? e.message : "upload failed");
      }
    }
    const remaining = await getAllRecordings().catch(() => []);
    setLocal(remaining);
    setUploading(false);
    setUploadMsg(failed.length
      ? `Uploaded ${done}. ${failed.length} couldn't be uploaded (${failed[0]}) and are still on this device.`
      : `Uploaded ${done} recording${done !== 1 ? "s" : ""} to your account.`);
    loadCloud();
  }

  // cleanup on unmount
  useEffect(() => () => stopAudio(), []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Saved Recordings</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {loading ? "Loading…" : `${records.length} recording${records.length !== 1 ? "s" : ""} in your account`}
          </p>
        </div>
      </div>

      {/* Local-only recordings → upload */}
      {local.length > 0 && (
        <div className="rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3 border" style={{ background: "var(--warning-bg)", borderColor: "var(--border)" }}>
          <CloudUpload size={20} className="shrink-0" style={{ color: "var(--warning-text)" }} />
          <p className="text-sm flex-1" style={{ color: "var(--warning-text)" }}>
            {local.length} recording{local.length !== 1 ? "s are" : " is"} saved only in this browser. Upload {local.length !== 1 ? "them" : "it"} to keep {local.length !== 1 ? "them" : "it"} with your account on every device.
          </p>
          <button onClick={uploadLocal} disabled={uploading}
            className="flex items-center justify-center gap-1.5 text-xs font-semibold px-4 py-2 rounded bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white transition-colors disabled:opacity-70 shrink-0">
            {uploading ? <><Loader2 size={13} className="animate-spin" /> Uploading…</> : <><CloudUpload size={13} /> Upload to account</>}
          </button>
        </div>
      )}
      {uploadMsg && <p className="text-sm text-[var(--text-secondary)]">{uploadMsg}</p>}

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg text-sm border" style={{ background: "var(--danger-bg)", borderColor: "var(--danger-border)", color: "#E53935" }}>
          <AlertCircle size={15} className="shrink-0" /> {error}
        </div>
      )}

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
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${playingId === record.id ? "bg-[var(--accent)]" : "bg-[var(--accent-bg)]"}`}>
                  <Mic size={18} className={playingId === record.id ? "text-white" : "text-[var(--accent)]"} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[var(--accent-bg)] text-[var(--accent)]">
                      {record.scenario || "Practice"}
                    </span>
                    {record.overall_score > 0 && (
                      <span className={`text-xs font-bold ${scoreColor(record.overall_score)}`}>
                        <BarChart2 size={11} className="inline mr-0.5" />
                        {record.overall_score}/100
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
                    <span>{fmtDate(record.created_at)}</span>
                    <span>·</span>
                    <span>{fmtDuration(record.duration)}</span>
                    {record.wpm > 0 && <><span>·</span><span>{record.wpm} wpm</span></>}
                  </div>
                  {record.transcript && (
                    <p className="text-xs text-[var(--text-secondary)] mt-1.5 line-clamp-2 leading-relaxed">{record.transcript}</p>
                  )}
                </div>

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
                  <a
                    href={`/api/recordings/${record.id}?download=1`}
                    className="flex items-center gap-1 text-xs border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] px-3 py-1.5 rounded transition-colors font-medium"
                  >
                    <Download size={12} />
                    Download
                  </a>
                  <button
                    onClick={() => handleDelete(record.id)}
                    title="Delete recording"
                    className="flex items-center gap-1 text-xs border border-[var(--border)] text-[var(--text-secondary)] hover:border-red-400 hover:text-red-500 px-3 py-1.5 rounded transition-colors font-medium"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

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
        Recordings are saved privately to your Spokiva account, so they&apos;re available on any device you sign in to. If an upload ever fails (for example while offline), the recording is kept in this browser and you can upload it later from this page.
      </div>
    </div>
  );
}
