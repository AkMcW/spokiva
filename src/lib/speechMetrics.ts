// Objective speech measurements and the scores derived from them.
//
// The text-only AI model can't hear audio, so delivery scores (pace, fluency,
// pronunciation clarity, confidence) are computed here from transcription data:
//   - word timestamps (whisper-1)  → speaking rate, pauses, repetitions, fillers
//   - token log-probabilities (gpt-4o-transcribe) → how clearly words were recognised
// Structure and vocabulary still come from the AI. The overall score is a
// weighted average of whatever could actually be measured — never invented.
// Pure functions, no I/O: safe to unit-test and to run on server or client.

export interface TimedWord { word: string; start: number; end: number }
export interface TokenLogprob { token: string; logprob: number }

export interface SpeechMetrics {
  durationSec: number | null;      // full recording length
  speakingSec: number | null;      // first word → last word
  wordCount: number;
  wpm: number | null;              // words per minute over the speaking span
  pauseCount: number | null;       // gaps ≥ 0.4 s between words
  longPauseCount: number | null;   // gaps ≥ 1.2 s
  longestPauseSec: number | null;
  pauseRatio: number | null;       // share of speaking span spent in pauses
  fillerCount: number;
  fillerWords: string[];           // distinct fillers heard, e.g. ["um","you know"]
  repetitionCount: number;         // immediate stutter repeats ("the the")
  clarity: number | null;          // 0–1 mean recognition confidence per word
  unclearWords: string[];          // words recognised with low confidence (likely mispronounced)
  hasTiming: boolean;
}

export interface MeasuredScores {
  pace: number | null;
  fluency: number | null;
  pronunciation: number | null;
  confidence: number | null;
}

export interface ScriptComparison {
  wordsInScript: number;
  wordsCovered: number;
  accuracyPercent: number;
  missedWords: string[];
  addedWords: string[];
}

// Hesitation fillers. Ambiguous words ("like", "so", "actually") are excluded
// because they're usually legitimate in normal speech.
const SINGLE_FILLERS = new Set(["um", "umm", "uh", "uhh", "uhm", "er", "erm", "ah", "ahh", "hmm", "mm", "mmm", "eh"]);
const PHRASE_FILLERS = ["you know", "i mean", "kind of", "sort of"];

export function normalizeWord(w: string): string {
  return w.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9']+/g, "").replace(/^'+|'+$/g, "");
}

export function tokenizeWords(text: string): string[] {
  return text
    // strip Spokiva speaking notation: [SLOW], **emphasis**, / // /// pauses
    .replace(/\[[A-Z ]+\]/g, " ")
    .replace(/\*\*/g, "")
    .replace(/\/+/g, " ")
    .split(/\s+/)
    .map(normalizeWord)
    .filter(Boolean);
}

const clamp = (v: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, v));
const round = (v: number, dp = 0) => Math.round(v * 10 ** dp) / 10 ** dp;

function countFillers(words: string[]): { count: number; found: string[] } {
  const found = new Set<string>();
  let count = 0;
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (SINGLE_FILLERS.has(w)) { count++; found.add(w); continue; }
    const pair = `${w} ${words[i + 1] ?? ""}`;
    if (PHRASE_FILLERS.includes(pair)) { count++; found.add(pair); i++; }
  }
  return { count, found: [...found] };
}

function countRepetitions(words: string[]): number {
  let n = 0;
  for (let i = 1; i < words.length; i++) {
    if (words[i] === words[i - 1] && words[i].length > 0 && !SINGLE_FILLERS.has(words[i])) n++;
  }
  return n;
}

// Groups transcription tokens into words (a token starting with a space begins
// a new word) and returns each word's confidence = exp(mean token logprob).
export function wordConfidences(tokens: TokenLogprob[]): { word: string; p: number }[] {
  const out: { word: string; lps: number[] }[] = [];
  for (const t of tokens) {
    if (!out.length || /^\s/.test(t.token)) out.push({ word: t.token.trim(), lps: [t.logprob] });
    else { out[out.length - 1].word += t.token; out[out.length - 1].lps.push(t.logprob); }
  }
  return out
    .map((w) => ({ word: normalizeWord(w.word), p: Math.exp(w.lps.reduce((a, b) => a + b, 0) / w.lps.length) }))
    .filter((w) => w.word.length > 0);
}

export function computeMetrics(input: {
  transcript: string;
  timedWords?: TimedWord[] | null;
  durationSec?: number | null;
  tokenLogprobs?: TokenLogprob[] | null;
}): SpeechMetrics {
  const words = tokenizeWords(input.transcript);
  const timed = (input.timedWords ?? []).filter((w) => Number.isFinite(w.start) && Number.isFinite(w.end));
  const hasTiming = timed.length >= 3;

  // Fillers/repeats: whisper's word list keeps "um/uh" more reliably, so prefer it.
  const fillerSource = hasTiming ? timed.map((w) => normalizeWord(w.word)).filter(Boolean) : words;
  const fillers = countFillers(fillerSource);
  const repetitionCount = countRepetitions(fillerSource);

  let speakingSec: number | null = null, pauseCount: number | null = null, longPauseCount: number | null = null;
  let longestPauseSec: number | null = null, pauseRatio: number | null = null;
  if (hasTiming) {
    speakingSec = Math.max(0.1, timed[timed.length - 1].end - timed[0].start);
    let pauses = 0, longPauses = 0, longest = 0, pauseTime = 0;
    for (let i = 1; i < timed.length; i++) {
      const gap = timed[i].start - timed[i - 1].end;
      if (gap >= 0.4) { pauses++; pauseTime += gap; }
      if (gap >= 1.2) longPauses++;
      longest = Math.max(longest, gap);
    }
    pauseCount = pauses; longPauseCount = longPauses;
    longestPauseSec = round(Math.max(0, longest), 1);
    pauseRatio = round(pauseTime / speakingSec, 3);
  }

  const span = speakingSec ?? (input.durationSec && input.durationSec > 0 ? input.durationSec : null);
  const wpm = span && words.length > 0 ? Math.round(words.length / (span / 60)) : null;

  let clarity: number | null = null;
  let unclearWords: string[] = [];
  if (input.tokenLogprobs?.length) {
    const conf = wordConfidences(input.tokenLogprobs).filter((w) => !SINGLE_FILLERS.has(w.word));
    if (conf.length) {
      clarity = round(conf.reduce((a, w) => a + w.p, 0) / conf.length, 3);
      unclearWords = [...new Set(conf.filter((w) => w.p < 0.6 && w.word.length > 2).sort((a, b) => a.p - b.p).map((w) => w.word))].slice(0, 10);
    }
  }

  return {
    durationSec: input.durationSec ? round(input.durationSec, 1) : speakingSec ? round(speakingSec, 1) : null,
    speakingSec: speakingSec ? round(speakingSec, 1) : null,
    wordCount: words.length,
    wpm,
    pauseCount, longPauseCount, longestPauseSec, pauseRatio,
    fillerCount: fillers.count,
    fillerWords: fillers.found,
    repetitionCount,
    clarity,
    unclearWords,
    hasTiming,
  };
}

// ── Scores (0–100) from measurements ───────────────────────────────────────────
// Below MIN_WORDS a sample is too short to judge delivery reliably.
export const MIN_WORDS = 15;

// Comfortable presentation pace is ~130–160 wpm.
export function paceScore(wpm: number | null): number | null {
  if (wpm == null) return null;
  if (wpm >= 130 && wpm <= 160) return 100;
  return Math.round(clamp(wpm < 130 ? 100 - (130 - wpm) * 1.2 : 100 - (wpm - 160) * 1.0));
}

export function scoreFromMetrics(m: SpeechMetrics | null | undefined): MeasuredScores {
  if (!m || m.wordCount < MIN_WORDS) return { pace: null, fluency: null, pronunciation: null, confidence: null };
  const per100 = (n: number) => (n / m.wordCount) * 100;
  const minutes = m.speakingSec ? m.speakingSec / 60 : null;
  const fillerRate = per100(m.fillerCount);          // fillers per 100 words
  const repeatRate = per100(m.repetitionCount);      // repeats per 100 words

  let fluency: number | null = null, confidence: number | null = null;
  if (m.hasTiming && minutes) {
    const longPerMin = (m.longPauseCount ?? 0) / minutes;
    const extraPauseTime = Math.max(0, (m.pauseRatio ?? 0) - 0.2); // some pausing is natural
    fluency = Math.round(clamp(100 - longPerMin * 4 - fillerRate * 2 - repeatRate * 2 - extraPauseTime * 60));
    const slowPenalty = m.wpm != null && m.wpm < 100 ? (100 - m.wpm) * 0.5 : 0;
    confidence = Math.round(clamp(100 - fillerRate * 2 - longPerMin * 3 - repeatRate * 2 - slowPenalty));
  }

  // Recognition confidence → clarity. Clear speech typically scores ~0.95+;
  // 0.60 or below means much of the speech was hard to recognise.
  const pronunciation = m.clarity == null ? null : Math.round(clamp(((m.clarity - 0.6) / 0.36) * 100));

  return { pace: paceScore(m.wpm), fluency, pronunciation, confidence };
}

// Weighted overall from whichever dimensions are available (weights renormalised).
export const OVERALL_WEIGHTS = { pronunciation: 0.25, fluency: 0.25, confidence: 0.15, structure: 0.15, vocabulary: 0.1, pace: 0.1 } as const;
export type ScoreKey = keyof typeof OVERALL_WEIGHTS;

export function overallScore(scores: Partial<Record<ScoreKey, number | null>>): number | null {
  let sum = 0, weight = 0;
  for (const k of Object.keys(OVERALL_WEIGHTS) as ScoreKey[]) {
    const v = scores[k];
    if (typeof v === "number" && Number.isFinite(v)) { sum += v * OVERALL_WEIGHTS[k]; weight += OVERALL_WEIGHTS[k]; }
  }
  // Need at least two dimensions' worth of evidence for a meaningful overall.
  return weight >= 0.3 ? Math.round(sum / weight) : null;
}

// Approximate IELTS speaking band from a 0–100 score.
export function toBand(score: number | null | undefined): number | null {
  if (score == null || !Number.isFinite(score)) return null;
  const table: [number, number][] = [[95, 9], [88, 8.5], [82, 8], [76, 7.5], [70, 7], [64, 6.5], [58, 6], [52, 5.5], [46, 5], [40, 4.5], [34, 4]];
  for (const [min, band] of table) if (score >= min) return band;
  return 3.5;
}

// Coerces an AI-returned score to a 0–100 integer, or null if absent/invalid.
export function toScore(v: unknown): number | null {
  const n = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? Math.round(clamp(n)) : null;
}

// Exact word-level script comparison via longest common subsequence.
export function compareToScript(script: string, transcript: string): ScriptComparison {
  const s = tokenizeWords(script);
  const t = tokenizeWords(transcript).filter((w) => !SINGLE_FILLERS.has(w));
  const n = s.length, m = t.length;
  if (!n) return { wordsInScript: 0, wordsCovered: 0, accuracyPercent: 0, missedWords: [], addedWords: [] };
  const dp: Uint16Array[] = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) {
    dp[i][j] = s[i] === t[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  }
  const missed: string[] = [], added: string[] = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (s[i] === t[j]) { i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) missed.push(s[i++]);
    else added.push(t[j++]);
  }
  while (i < n) missed.push(s[i++]);
  while (j < m) added.push(t[j++]);
  const covered = dp[0][0];
  const uniq = (a: string[]) => [...new Set(a)].slice(0, 20);
  return {
    wordsInScript: n,
    wordsCovered: covered,
    accuracyPercent: round((covered / n) * 100, 1),
    missedWords: uniq(missed),
    addedWords: uniq(added),
  };
}

// ── Shared helpers for analyzers ───────────────────────────────────────────────

// Metrics come back from the browser, so validate the shape before trusting it.
export function parseMetrics(raw: unknown): SpeechMetrics | null {
  if (!raw || typeof raw !== "object") return null;
  const m = raw as Partial<SpeechMetrics>;
  if (typeof m.wordCount !== "number" || typeof m.fillerCount !== "number") return null;
  return {
    durationSec: num(m.durationSec), speakingSec: num(m.speakingSec), wordCount: m.wordCount, wpm: num(m.wpm),
    pauseCount: num(m.pauseCount), longPauseCount: num(m.longPauseCount), longestPauseSec: num(m.longestPauseSec),
    pauseRatio: num(m.pauseRatio), fillerCount: m.fillerCount,
    fillerWords: Array.isArray(m.fillerWords) ? m.fillerWords.map(String).slice(0, 20) : [],
    repetitionCount: num(m.repetitionCount) ?? 0, clarity: num(m.clarity),
    unclearWords: Array.isArray(m.unclearWords) ? m.unclearWords.map(String).slice(0, 10) : [],
    hasTiming: !!m.hasTiming,
  };
}
function num(v: unknown): number | null { return typeof v === "number" && Number.isFinite(v) ? v : null; }

// Facts block for an AI prompt, so feedback about pace/pauses/fillers/clarity
// matches what was actually measured from the audio.
export function deliveryFactsPrompt(metrics: SpeechMetrics | null): string {
  if (!metrics) return "";
  return `MEASURED DELIVERY (from the audio — treat as facts; base any judgement of pace, pauses, hesitation and clarity on them):
- Words: ${metrics.wordCount}; speaking time: ${metrics.speakingSec ?? metrics.durationSec ?? "unknown"} s; pace: ${metrics.wpm ?? "unknown"} wpm
- Pauses ≥0.4 s: ${metrics.pauseCount ?? "unknown"}; long pauses ≥1.2 s: ${metrics.longPauseCount ?? "unknown"}; longest: ${metrics.longestPauseSec ?? "unknown"} s
- Hesitation fillers: ${metrics.fillerCount}${metrics.fillerWords.length ? ` (${metrics.fillerWords.join(", ")})` : ""}; stutter repeats: ${metrics.repetitionCount}
- Recognition clarity: ${metrics.clarity != null ? Math.round(metrics.clarity * 100) + "%" : "unknown"}${metrics.unclearWords.length ? `; words the recogniser found hard to understand (likely mispronounced): ${metrics.unclearWords.join(", ")}` : ""}

`;
}
