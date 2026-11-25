"use client";
import ScriptsTabs from "@/components/scripts/ScriptsTabs";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, FileText, Mic, Trash2, Loader2, Pencil, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface SavedScript {
  id: number;
  title: string;
  scenario: string;
  content: string;
  word_count: number;
  duration: string;
  created_at: string;
}

export default function SavedScriptsPage() {
  const router = useRouter();
  const [scripts, setScripts] = useState<SavedScript[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [savingTitle, setSavingTitle] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/scripts/saved");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      setScripts(data.scripts ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load scripts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function deleteScript(id: number) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/scripts/saved?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setScripts((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setError("Failed to delete script");
    } finally {
      setDeletingId(null);
    }
  }

  function startRename(script: SavedScript) {
    setRenamingId(script.id);
    setDraftTitle(script.title);
    setError("");
  }

  async function saveRename(id: number) {
    const title = draftTitle.trim();
    const current = scripts.find((s) => s.id === id)?.title;
    if (!title || title === current) { setRenamingId(null); return; }
    setSavingTitle(true);
    try {
      const res = await fetch("/api/scripts/saved", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, title }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Rename failed");
      setScripts((prev) => prev.map((s) => (s.id === id ? { ...s, title: data.script?.title ?? title } : s)));
      setRenamingId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't rename the script");
    } finally {
      setSavingTitle(false);
    }
  }

  function sendToPractice(script: SavedScript) {
    localStorage.setItem("spokiva_active_script", JSON.stringify({
      content: script.content,
      scenario: script.scenario,
      wordCount: script.word_count,
    }));
    router.push("/dashboard/practice");
  }

  const filtered = scripts.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.scenario.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (iso: string) => {
    try { return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
    catch { return iso; }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <ScriptsTabs />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>My scripts</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            {loading ? "Loading…" : `${scripts.length} script${scripts.length !== 1 ? "s" : ""} saved`}
          </p>
        </div>
        <Link
          href="/dashboard/script-writer"
          className="inline-flex items-center gap-2 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
          style={{ background: "var(--accent)" }}
        >
          <FileText size={14} />
          New Script
        </Link>
      </div>

      {error && (
        <div className="rounded-lg p-3 text-sm text-red-600 bg-[var(--danger-bg)] border border-[var(--danger-border)]">{error}</div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search scripts by title or scenario…"
          className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 transition-all"
          style={{
            border: "1px solid var(--border)",
            background: "var(--bg-card)",
            color: "var(--text-primary)",
          }}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin" style={{ color: "var(--accent)" }} />
        </div>
      ) : scripts.length === 0 ? (
        <div className="rounded-xl p-10 text-center card-flat">
          <FileText size={36} className="mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
          <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>No saved scripts yet</p>
          <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
            Generate a script in Script Writer and click &ldquo;Save Script&rdquo; to see it here.
          </p>
          <Link
            href="/dashboard/script-writer"
            className="inline-flex items-center gap-2 text-white font-semibold px-4 py-2 rounded-lg text-sm"
            style={{ background: "var(--accent)" }}
          >
            Go to Script Writer
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl p-10 text-center card-flat">
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No scripts match your search.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((script) => (
            <div
              key={script.id}
              className="card-flat rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4"
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--accent-bg)" }}>
                <FileText size={18} style={{ color: "var(--accent)" }} />
              </div>

              <div className="flex-1 min-w-0">
                {renamingId === script.id ? (
                  <form className="flex items-center gap-1.5 mb-1" onSubmit={(e) => { e.preventDefault(); saveRename(script.id); }}>
                    <input
                      autoFocus
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Escape") setRenamingId(null); }}
                      onFocus={(e) => e.currentTarget.select()}
                      maxLength={120}
                      aria-label="Script name"
                      className="flex-1 min-w-0 px-2 py-1 text-sm font-semibold rounded border focus:outline-none focus:border-[var(--accent)]"
                      style={{ borderColor: "var(--border)", background: "var(--bg-card)", color: "var(--text-primary)" }}
                    />
                    <button type="submit" disabled={savingTitle || !draftTitle.trim()} title="Save name"
                      className="p-1.5 rounded text-white disabled:opacity-50" style={{ background: "var(--accent)" }}>
                      {savingTitle ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    </button>
                    <button type="button" onClick={() => setRenamingId(null)} title="Cancel"
                      className="p-1.5 rounded border" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                      <X size={13} />
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center gap-1.5 mb-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>
                      {script.title}
                    </h3>
                    <button onClick={() => startRename(script)} title="Rename" aria-label={`Rename ${script.title}`}
                      className="shrink-0 p-1 rounded hover:bg-[var(--bg-hover)]" style={{ color: "var(--text-muted)" }}>
                      <Pencil size={12} />
                    </button>
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--accent-bg)", color: "var(--accent)" }}>
                    {script.scenario}
                  </span>
                  <span style={{ color: "var(--text-muted)" }}>{script.word_count} words</span>
                  <span style={{ color: "var(--text-muted)" }}>{formatDate(script.created_at)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href="/dashboard/script-writer"
                  onClick={() => localStorage.setItem("spokiva_edit_script", JSON.stringify(script))}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-colors font-medium"
                  style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                >
                  Edit
                </Link>
                <button
                  onClick={() => sendToPractice(script)}
                  className="flex items-center gap-1 text-xs text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
                  style={{ background: "var(--accent)" }}
                >
                  <Mic size={12} />
                  Practice
                </button>
                <button
                  onClick={() => deleteScript(script.id)}
                  disabled={deletingId === script.id}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-colors font-medium"
                  style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                >
                  {deletingId === script.id
                    ? <Loader2 size={12} className="animate-spin" />
                    : <Trash2 size={12} />
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
