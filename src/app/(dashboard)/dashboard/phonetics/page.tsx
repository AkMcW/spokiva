"use client";
import { BookOpen, Mic, Volume2, Info } from "lucide-react";

const shortVowels = [
  { symbol: "/ɪ/", example: "bit", hint: "Short, relaxed 'i'" },
  { symbol: "/e/", example: "bed", hint: "Mid-front, mouth slightly open" },
  { symbol: "/æ/", example: "cat", hint: "Low front, jaw drops" },
  { symbol: "/ʌ/", example: "cup", hint: "Central, unstressed" },
  { symbol: "/ɒ/", example: "hot", hint: "Low back, rounded (BrE)" },
  { symbol: "/ʊ/", example: "book", hint: "Short, lips loosely rounded" },
  { symbol: "/ə/", example: "about", hint: "Schwa — most common vowel" },
];

const longVowels = [
  { symbol: "/iː/", example: "feet", hint: "Tense, spread lips" },
  { symbol: "/ɑː/", example: "car", hint: "Low back, open mouth" },
  { symbol: "/ɔː/", example: "more", hint: "Rounded lips, mid-back" },
  { symbol: "/uː/", example: "food", hint: "High back, tight lip rounding" },
  { symbol: "/ɜː/", example: "bird", hint: "Mid central, no rounding" },
];

const diphthongs = [
  { symbol: "/eɪ/", example: "day", hint: "Start at /e/, glide to /ɪ/" },
  { symbol: "/aɪ/", example: "my", hint: "Start open, glide up" },
  { symbol: "/ɔɪ/", example: "boy", hint: "Rounded start, glide to /ɪ/" },
  { symbol: "/aʊ/", example: "now", hint: "Start open, glide back" },
  { symbol: "/əʊ/", example: "go", hint: "Schwa start, glide to /ʊ/" },
  { symbol: "/ɪə/", example: "ear", hint: "High front, glide to schwa" },
  { symbol: "/eə/", example: "air", hint: "Mid front, glide to schwa" },
  { symbol: "/ʊə/", example: "tour", hint: "High back, glide to schwa" },
];

const consonants = [
  { symbol: "/θ/", name: "voiceless TH", example: "think, bath", tip: "Tongue tip between teeth, breathe out — no voice" },
  { symbol: "/ð/", name: "voiced TH", example: "this, breathe", tip: "Same position as /θ/ but add voice (vibration)" },
  { symbol: "/r/", name: "English R", example: "red, arrow", tip: "Curl tongue back slightly, don't trill or tap" },
  { symbol: "/l/", name: "clear L", example: "lip, play", tip: "Tongue tip touches ridge behind upper teeth" },
  { symbol: "/v/", name: "voiced V", example: "very, love", tip: "Upper teeth on lower lip, add voice — not /b/" },
  { symbol: "/w/", name: "W glide", example: "wet, away", tip: "Round lips tightly, then open into vowel" },
  { symbol: "/ʃ/", name: "SH", example: "ship, wash", tip: "Lips slightly forward, tongue raised — shhhh" },
  { symbol: "/ʒ/", name: "ZH", example: "measure, vision", tip: "Like /ʃ/ but voiced; rare in English" },
  { symbol: "/tʃ/", name: "CH", example: "church, match", tip: "Start with /t/ stop, release into /ʃ/" },
  { symbol: "/dʒ/", name: "J / DG", example: "judge, gem", tip: "Like /tʃ/ but voiced throughout" },
];

const commonMistakes = [
  {
    group: "Thai Speakers",
    icon: "🇹🇭",
    mistakes: [
      "Dropping final consonants (e.g. 'cat' → 'ca')",
      "Confusing /r/ and /l/ ('right' vs 'light')",
      "Missing /v/ — often replaced with /w/",
      "No distinction between short and long vowels",
    ],
  },
  {
    group: "East Asian Speakers",
    icon: "🌏",
    mistakes: [
      "/r/ and /l/ confusion (especially for Japanese/Korean learners)",
      "Adding vowels between consonant clusters ('street' → 'suh-tree-tuh')",
      "/θ/ and /ð/ replaced with /s/ or /d/",
      "Flat intonation — English is pitch-varied",
    ],
  },
  {
    group: "Indian English Speakers",
    icon: "🇮🇳",
    mistakes: [
      "Retroflex /t/ and /d/ instead of alveolar stops",
      "/w/ pronounced as /v/ ('wine' sounds like 'vine')",
      "Schwa /ə/ often stressed or skipped entirely",
      "Final consonant clusters simplified",
    ],
  },
];

const minimalPairs = [
  { a: "ship", b: "sheep", symbols: "/ɪ/ vs /iː/" },
  { a: "bit", b: "beat", symbols: "/ɪ/ vs /iː/" },
  { a: "full", b: "fool", symbols: "/ʊ/ vs /uː/" },
  { a: "pen", b: "pan", symbols: "/e/ vs /æ/" },
  { a: "light", b: "right", symbols: "/l/ vs /r/" },
  { a: "think", b: "sink", symbols: "/θ/ vs /s/" },
  { a: "then", b: "den", symbols: "/ð/ vs /d/" },
  { a: "vine", b: "wine", symbols: "/v/ vs /w/" },
  { a: "cheap", b: "jeep", symbols: "/tʃ/ vs /dʒ/" },
  { a: "shore", b: "sure", symbols: "/ʃ/ vs /ʒ/" },
];

const tips = [
  { icon: <Volume2 className="w-5 h-5 text-[var(--accent)]" />, title: "Listen actively", body: "Use podcasts, movies, or YouTube. Pause and mimic the exact sounds you hear, not just the words." },
  { icon: <Mic className="w-5 h-5 text-[var(--accent)]" />, title: "Record yourself", body: "Record a sentence, then listen back. Compare your vowels and consonants to a native speaker version." },
  { icon: <BookOpen className="w-5 h-5 text-[var(--accent)]" />, title: "Use IPA references", body: "When looking up words in a dictionary, always check the IPA transcription — don't guess from spelling." },
  { icon: <Info className="w-5 h-5 text-[var(--accent)]" />, title: "Focus on problem sounds", body: "Identify your top 3 problem sounds and drill minimal pairs for each daily for 5 minutes." },
];

export default function PhoneticsPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] px-4 py-8 md:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent)] flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Phonetic Knowledge</h1>
            <p className="text-[var(--text-secondary)] text-sm">Master English sounds for clearer, more confident speech</p>
          </div>
        </div>
      </div>

      {/* IPA Vowel Chart */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">IPA Vowel Chart</h2>

        {/* Short Vowels */}
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-6 mb-4">
          <h3 className="text-sm font-semibold text-[var(--accent)] uppercase tracking-wide mb-4">Short Vowels</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {shortVowels.map((v) => (
              <div key={v.symbol} className="bg-[var(--bg-secondary)] rounded-xl p-3 border border-[var(--border)]">
                <span className="text-2xl font-bold text-[var(--accent)] block mb-1">{v.symbol}</span>
                <span className="text-sm font-semibold text-[var(--text-primary)] block">"{v.example}"</span>
                <span className="text-xs text-[var(--text-secondary)]">{v.hint}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Long Vowels */}
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-6 mb-4">
          <h3 className="text-sm font-semibold text-[var(--accent)] uppercase tracking-wide mb-4">Long Vowels</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {longVowels.map((v) => (
              <div key={v.symbol} className="bg-[var(--bg-secondary)] rounded-xl p-3 border border-[var(--border)]">
                <span className="text-2xl font-bold text-[var(--accent)] block mb-1">{v.symbol}</span>
                <span className="text-sm font-semibold text-[var(--text-primary)] block">"{v.example}"</span>
                <span className="text-xs text-[var(--text-secondary)]">{v.hint}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Diphthongs */}
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-6">
          <h3 className="text-sm font-semibold text-[var(--accent)] uppercase tracking-wide mb-4">Diphthongs</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {diphthongs.map((v) => (
              <div key={v.symbol} className="bg-[var(--bg-secondary)] rounded-xl p-3 border border-[var(--border)]">
                <span className="text-2xl font-bold text-[var(--accent)] block mb-1">{v.symbol}</span>
                <span className="text-sm font-semibold text-[var(--text-primary)] block">"{v.example}"</span>
                <span className="text-xs text-[var(--text-secondary)]">{v.hint}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Consonant Chart */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Key Problem Consonants</h2>
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden">
          <div className="hidden md:grid grid-cols-4 bg-[var(--bg-secondary)] border-b border-[var(--border)] px-6 py-3">
            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase">Symbol</span>
            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase">Name</span>
            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase">Example</span>
            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase">How to produce</span>
          </div>
          {consonants.map((c, i) => (
            <div
              key={c.symbol}
              className={`grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-0 px-6 py-4 ${i < consonants.length - 1 ? "border-b border-[var(--border)]" : ""}`}
            >
              <span className="text-xl font-bold text-[var(--accent)]">{c.symbol}</span>
              <span className="text-sm font-semibold text-[var(--text-primary)] md:self-center">{c.name}</span>
              <span className="text-sm text-[var(--text-primary)] md:self-center italic">"{c.example}"</span>
              <span className="text-sm text-[var(--text-secondary)] md:self-center">{c.tip}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Common Mistakes */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Common Mistakes by Speaker Background</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {commonMistakes.map((group) => (
            <div key={group.group} className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">{group.icon}</span>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">{group.group}</h3>
              </div>
              <ul className="space-y-2">
                {group.mistakes.map((m, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[var(--accent)] flex-shrink-0" />
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Minimal Pairs Drills */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          <span className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-[var(--accent)]" />
            Practice Drills — Minimal Pairs
          </span>
        </h2>
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden">
          <div className="grid grid-cols-3 bg-[var(--bg-secondary)] border-b border-[var(--border)] px-6 py-3">
            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase">Word A</span>
            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase">Word B</span>
            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase">Contrast</span>
          </div>
          {minimalPairs.map((pair, i) => (
            <div
              key={i}
              className={`grid grid-cols-3 px-6 py-3 ${i < minimalPairs.length - 1 ? "border-b border-[var(--border)]" : ""} ${i % 2 === 0 ? "" : "bg-[var(--bg-secondary)]"}`}
            >
              <span className="text-sm font-semibold text-[var(--text-primary)]">{pair.a}</span>
              <span className="text-sm font-semibold text-[var(--text-primary)]">{pair.b}</span>
              <span className="text-xs text-[var(--accent)] font-mono self-center">{pair.symbols}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-[var(--text-secondary)] flex items-center gap-1">
          <Info className="w-3.5 h-3.5" />
          Say each pair aloud 5× slowly, then 5× at normal speed. Focus on the vowel or consonant difference.
        </p>
      </section>

      {/* Tips for Clear Speech */}
      <section className="mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          <span className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-[var(--accent)]" />
            Tips for Clear Speech
          </span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tips.map((tip, i) => (
            <div key={i} className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-5 flex gap-4">
              <div className="w-9 h-9 rounded-xl bg-[var(--accent-bg)] flex items-center justify-center flex-shrink-0">
                {tip.icon}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">{tip.title}</h3>
                <p className="text-sm text-[var(--text-secondary)]">{tip.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
