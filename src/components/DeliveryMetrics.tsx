"use client";
import type { SpeechMetrics } from "@/lib/speechMetrics";

// Delivery measured from the recording (see /api/practice/transcribe).
export default function DeliveryMetrics({ metrics, title = "Delivery Metrics", className = "" }: {
  metrics: SpeechMetrics | null | undefined;
  title?: string;
  className?: string;
}) {
  if (!metrics) return null;
  const items = [
    { label: "Pace", value: metrics.wpm != null ? `${metrics.wpm} wpm` : "—", hint: "Aim for 130–160" },
    { label: "Pauses", value: metrics.pauseCount ?? "—", hint: metrics.longPauseCount != null ? `${metrics.longPauseCount} over 1.2 s` : "" },
    { label: "Longest pause", value: metrics.longestPauseSec != null ? `${metrics.longestPauseSec} s` : "—", hint: "" },
    { label: "Fillers", value: metrics.fillerCount, hint: metrics.repetitionCount ? `${metrics.repetitionCount} repeat${metrics.repetitionCount !== 1 ? "s" : ""}` : "" },
    { label: "Clarity", value: metrics.clarity != null ? `${Math.round(metrics.clarity * 100)}%` : "—", hint: "Words recognised clearly" },
  ];
  return (
    <div className={`rounded-lg p-5 ${className}`} style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      <h2 className="font-bold mb-4" style={{ color: "var(--text-primary)" }}>{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {items.map(({ label, value, hint }) => (
          <div key={label} className="rounded-lg p-3 text-center" style={{ background: "var(--bg-secondary)" }}>
            <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{value}</p>
            <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>{label}</p>
            {hint && <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>{hint}</p>}
          </div>
        ))}
      </div>
      {metrics.unclearWords.length > 0 && (
        <p className="text-xs mt-4" style={{ color: "var(--text-secondary)" }}>
          <strong>Hard to recognise:</strong> {metrics.unclearWords.join(", ")} — practise these words slowly and clearly.
        </p>
      )}
    </div>
  );
}
