"use client";
import { getScoreColor } from "@/lib/utils";

interface ScoreRingProps {
  score: number | null;  // null = not measured, shown as "—"
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export default function ScoreRing({ score, size = 80, strokeWidth = 7, label }: ScoreRingProps) {
  const measured = typeof score === "number" && Number.isFinite(score);
  const safeScore = measured ? Math.max(0, Math.min(100, Math.round(score))) : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safeScore / 100) * circumference;
  const color = getScoreColor(safeScore);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            style={{ stroke: "var(--border)" }}
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-base font-bold text-[var(--text-primary)]">{measured ? safeScore : "—"}</span>
        </div>
      </div>
      {label && <span className="text-xs text-[var(--text-secondary)] font-medium text-center">{label}</span>}
    </div>
  );
}
