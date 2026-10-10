"use client";
import { useEffect, useState } from "react";

interface Analysis {
  scores: {
    pronunciation: number; fluency: number; confidence: number;
    structure: number; vocabulary: number; pace: number; overall: number;
  };
  fillerWords: { count: number; words: string[] };
  wpm: number;
  strengths: string[];
  improvements: string[];
  aiFeedback: string;
  bandScore?: number | null;
  transcript?: string;
}

function parseAnalysis(raw: string | null): Analysis | null {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw);
    const s = p.scores ?? {};
    p.scores = {
      pronunciation: Number(s.pronunciation) || 0,
      fluency: Number(s.fluency) || 0,
      confidence: Number(s.confidence) || 0,
      structure: Number(s.structure) || 0,
      vocabulary: Number(s.vocabulary) || 0,
      pace: Number(s.pace) || 0,
      overall: Number(s.overall) || 0,
    };
    p.fillerWords = p.fillerWords ?? { count: 0, words: [] };
    p.strengths = Array.isArray(p.strengths) ? p.strengths : [];
    p.improvements = Array.isArray(p.improvements) ? p.improvements : [];
    p.wpm = Number(p.wpm) || 0;
    return p;
  } catch { return null; }
}

function scoreColor(score: number) {
  if (score >= 80) return "#00B37D";
  if (score >= 60) return "#F5A623";
  return "#E53935";
}

function scoreLabel(score: number) {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Great";
  if (score >= 70) return "Good";
  if (score >= 60) return "Fair";
  return "Needs Work";
}

const SCORE_KEYS: (keyof Analysis["scores"])[] = [
  "pronunciation", "fluency", "confidence", "structure", "vocabulary", "pace"
];

export default function PrintReportPage() {
  const [data, setData] = useState<Analysis | null>(null);

  useEffect(() => {
    setData(parseAnalysis(sessionStorage.getItem("spokiva_analysis")));
  }, []);

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#636363]">
        <p>No session data found. <a href="/dashboard/results" className="text-[#0056D2] underline">Go back</a></p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
        }
        @page { margin: 18mm 14mm; }
      `}</style>

      {/* Print controls */}
      <div className="no-print fixed top-4 right-4 flex gap-2 z-50">
        <button
          onClick={() => window.print()}
          className="bg-[#0056D2] text-white font-semibold px-5 py-2 rounded shadow text-sm hover:bg-[#003B8E] transition-colors"
        >
          Print / Save PDF
        </button>
        <button
          onClick={() => window.close()}
          className="border border-[#E0E0E0] text-[#636363] font-semibold px-4 py-2 rounded text-sm hover:bg-[#F5F5F5] transition-colors"
        >
          Close
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-8 py-10 font-sans text-[#1F1F1F]">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#0056D2] pb-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 bg-[#0056D2] rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">SF</span>
              </div>
              <span className="text-lg font-bold text-[#0056D2]">Spokiva</span>
            </div>
            <p className="text-xs text-[#636363]">Speaking Practice Report</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">{today}</p>
            {data.wpm > 0 && <p className="text-xs text-[#636363]">{data.wpm} words per minute</p>}
          </div>
        </div>

        {/* Overall score */}
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-widest text-[#636363] mb-2">Overall Score</p>
          <div
            className="inline-flex flex-col items-center justify-center w-28 h-28 rounded-full border-8 mb-2"
            style={{ borderColor: scoreColor(data.scores.overall) }}
          >
            <span className="text-4xl font-bold">{data.scores.overall}</span>
            <span className="text-xs text-[#636363]">/100</span>
          </div>
          <p className="text-sm font-semibold" style={{ color: scoreColor(data.scores.overall) }}>
            {scoreLabel(data.scores.overall)}
          </p>
          {data.fillerWords.count > 0 && (
            <p className="text-xs text-[#636363] mt-1">
              {data.fillerWords.count} filler word{data.fillerWords.count !== 1 ? "s" : ""}
              {data.fillerWords.words.length > 0 && ` (${data.fillerWords.words.map(w => `"${w}"`).join(", ")})`}
            </p>
          )}
          {data.bandScore != null && (
            <p className="text-xs text-[#636363]">Estimated IELTS Band: <strong>{data.bandScore}</strong></p>
          )}
        </div>

        {/* Score breakdown table */}
        <div className="mb-8">
          <p className="text-sm font-bold mb-3 border-b border-[#E0E0E0] pb-1">Score Breakdown</p>
          <div className="grid grid-cols-3 gap-3">
            {SCORE_KEYS.map((key) => {
              const score = data.scores[key];
              const label = key.charAt(0).toUpperCase() + key.slice(1);
              return (
                <div key={key} className="border border-[#E0E0E0] rounded p-3 text-center">
                  <p className="text-xs text-[#636363] mb-1">{label}</p>
                  <p className="text-2xl font-bold" style={{ color: scoreColor(score) }}>{score}</p>
                  <div className="mt-1 h-1.5 bg-[#F5F5F5] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: scoreColor(score) }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Strengths + Improvements */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <p className="text-sm font-bold mb-2 text-[#00B37D]">✓ Strengths</p>
            <ul className="space-y-1.5">
              {data.strengths.map((s, i) => (
                <li key={i} className="text-xs text-[#636363] flex items-start gap-1.5">
                  <span className="text-[#00B37D] shrink-0 mt-0.5">•</span>{s}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-bold mb-2 text-[#F5A623]">↑ Improvement Areas</p>
            <ul className="space-y-1.5">
              {data.improvements.map((s, i) => (
                <li key={i} className="text-xs text-[#636363] flex items-start gap-1.5">
                  <span className="text-[#F5A623] shrink-0 mt-0.5">•</span>{s}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* AI Feedback */}
        <div className="bg-[#F0F4FF] rounded-lg p-4 mb-8">
          <p className="text-xs font-bold text-[#0056D2] mb-2">AI Coach Feedback</p>
          <p className="text-xs text-[#636363] leading-relaxed">{data.aiFeedback}</p>
        </div>

        {/* Transcript */}
        {data.transcript && (
          <div className="mb-8">
            <p className="text-sm font-bold mb-2 border-b border-[#E0E0E0] pb-1">Your Transcript</p>
            <p className="text-xs text-[#636363] leading-relaxed">{data.transcript}</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-[10px] text-[#9E9E9E] border-t border-[#E0E0E0] pt-4">
          Generated by Spokiva · spokiva.app · {today}
        </div>
      </div>
    </>
  );
}
