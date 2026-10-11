"use client";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Flame, Clock, Mic, TrendingUp, AlertCircle } from "lucide-react";

interface Scores {
  pronunciation?: number;
  fluency?: number;
  confidence?: number;
  structure?: number;
  vocabulary?: number;
  pace?: number;
  overall?: number;
}

interface Session {
  id: number;
  scenario: string;
  scores: Scores;
  filler_words: { count?: number };
  wpm: number;
  duration_seconds: number;
  ai_feedback: string;
  created_at: string;
}

function fmt(seconds: number) {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function ScoreBadge({ score }: { score: number }) {
  const cls =
    score >= 80 ? "bg-[var(--success-bg)] text-[#00B37D]" :
    score >= 65 ? "bg-[var(--warning-bg)] text-[#F5A623]" :
    "bg-[var(--danger-bg)] text-red-600";
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${cls}`}>{score}</span>;
}

function buildChartData(sessions: Session[]) {
  // Group by week, average the key scores
  const byWeek: Record<string, { pronunciation: number[]; fluency: number[]; confidence: number[] }> = {};
  [...sessions].reverse().forEach((s) => {
    const d = new Date(s.created_at);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (!byWeek[key]) byWeek[key] = { pronunciation: [], fluency: [], confidence: [] };
    if (s.scores.pronunciation) byWeek[key].pronunciation.push(s.scores.pronunciation);
    if (s.scores.fluency) byWeek[key].fluency.push(s.scores.fluency);
    if (s.scores.confidence) byWeek[key].confidence.push(s.scores.confidence);
  });
  return Object.entries(byWeek).map(([week, vals]) => ({
    week,
    Pronunciation: vals.pronunciation.length ? Math.round(vals.pronunciation.reduce((a, b) => a + b) / vals.pronunciation.length) : undefined,
    Fluency: vals.fluency.length ? Math.round(vals.fluency.reduce((a, b) => a + b) / vals.fluency.length) : undefined,
    Confidence: vals.confidence.length ? Math.round(vals.confidence.reduce((a, b) => a + b) / vals.confidence.length) : undefined,
  }));
}

export default function ProgressPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/practice/sessions")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setSessions(d.sessions ?? []);
      })
      .catch(() => setError("Could not load session history."))
      .finally(() => setLoading(false));
  }, []);

  const totalMinutes = Math.round(sessions.reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0) / 60);
  const avgScore = sessions.length
    ? Math.round(sessions.reduce((sum, s) => sum + (s.scores?.overall ?? 0), 0) / sessions.length)
    : 0;

  // Streak: count consecutive days with at least one session ending today
  const streak = (() => {
    if (!sessions.length) return 0;
    const days = new Set(sessions.map((s) => new Date(s.created_at).toDateString()));
    let count = 0;
    const d = new Date();
    while (days.has(d.toDateString())) {
      count++;
      d.setDate(d.getDate() - 1);
    }
    return count;
  })();

  const chartData = buildChartData(sessions);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Progress</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>Track your improvement across all sessions.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-lg p-5 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <Flame size={20} className="mx-auto mb-2" style={{ color: "#F5A623" }} />
          <p className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{streak}</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>Day Streak</p>
        </div>
        <div className="rounded-lg p-5 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <Mic size={20} className="mx-auto mb-2" style={{ color: "var(--accent)" }} />
          <p className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{sessions.length}</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>Total Sessions</p>
        </div>
        <div className="rounded-lg p-5 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <Clock size={20} className="mx-auto mb-2" style={{ color: "#00B37D" }} />
          <p className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{totalMinutes}</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>Speaking Minutes</p>
        </div>
        <div className="rounded-lg p-5 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <TrendingUp size={20} className="mx-auto mb-2" style={{ color: "#7B61FF" }} />
          <p className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{avgScore || "—"}</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>Avg Score</p>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="rounded-lg p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h2 className="font-bold mb-4" style={{ color: "var(--text-primary)" }}>Score Trend by Week</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} />
              <YAxis domain={[40, 100]} tick={{ fontSize: 11, fill: "var(--text-secondary)" }} />
              <Tooltip contentStyle={{ border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px", background: "var(--bg-card)", color: "var(--text-primary)" }} />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Line type="monotone" dataKey="Pronunciation" stroke="#0056D2" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              <Line type="monotone" dataKey="Fluency" stroke="#00B37D" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              <Line type="monotone" dataKey="Confidence" stroke="#F5A623" strokeWidth={2} dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Session history */}
      <div className="rounded-lg overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <h2 className="font-bold" style={{ color: "var(--text-primary)" }}>Session History</h2>
        </div>

        {loading && (
          <div className="px-5 py-8 text-center">
            <div className="flex gap-1.5 justify-center">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ background: "var(--accent)", animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
            <p className="text-sm mt-3" style={{ color: "var(--text-secondary)" }}>Loading sessions...</p>
          </div>
        )}

        {!loading && error && (
          <div className="px-5 py-6 flex items-center gap-2 text-sm" style={{ color: "#E53935" }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {!loading && !error && sessions.length === 0 && (
          <div className="px-5 py-10 text-center">
            <Mic size={32} className="mx-auto mb-3 opacity-30" style={{ color: "var(--text-secondary)" }} />
            <p className="font-semibold" style={{ color: "var(--text-primary)" }}>No sessions yet</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>Complete a practice session and your results will appear here.</p>
          </div>
        )}

        {!loading && sessions.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)" }}>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Scenario</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider hidden sm:table-cell" style={{ color: "var(--text-secondary)" }}>WPM</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider hidden sm:table-cell" style={{ color: "var(--text-secondary)" }}>Duration</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Score</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider hidden md:table-cell" style={{ color: "var(--text-secondary)" }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s, i) => (
                  <tr key={s.id} style={{ borderBottom: i < sessions.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <td className="px-4 py-3 text-sm font-medium max-w-[180px] truncate" style={{ color: "var(--text-primary)" }}>
                      {s.scenario || "Practice Session"}
                    </td>
                    <td className="px-4 py-3 text-xs hidden sm:table-cell" style={{ color: "var(--text-secondary)" }}>{s.wpm || "—"}</td>
                    <td className="px-4 py-3 text-xs hidden sm:table-cell" style={{ color: "var(--text-secondary)" }}>{fmt(s.duration_seconds)}</td>
                    <td className="px-4 py-3">
                      {s.scores?.overall ? <ScoreBadge score={s.scores.overall} /> : <span style={{ color: "var(--text-secondary)" }}>—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs hidden md:table-cell" style={{ color: "var(--text-secondary)" }}>{fmtDate(s.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
