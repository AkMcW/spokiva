import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { FileText, Mic2, BarChart2, BookOpen, Briefcase, Users, CheckCircle, X } from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "AI Script Writer",
    tagline: "Generate polished scripts in seconds",
    description:
      "Our AI Script Writer creates tailored speaking scripts for any scenario. Enter your topic, audience type, tone, and duration — and get a structured, natural-sounding script that you can refine with one click.",
    benefits: [
      "Business meeting scripts with professional tone",
      "IELTS Part 2 cue card answers (1–2 minutes)",
      "Interview answers structured with STAR method",
      "Presentation openings, main points, and closings",
      "One-click optimization: Make More Professional, Simplify, Add Q&A",
    ],
  },
  {
    icon: Mic2,
    title: "Speech Practice & Recording",
    tagline: "Record, review, improve — on repeat",
    description:
      "The Practice module lets you record yourself speaking in the browser with no downloads required. After each session, our AI analyzes your recording and delivers a detailed performance report.",
    benefits: [
      "In-browser recording with no app required",
      "Real-time waveform visualization",
      "Instant analysis after every session",
      "Filler word detection (um, uh, like, you know)",
      "Pace and pause pattern tracking",
    ],
  },
  {
    icon: BarChart2,
    title: "Pronunciation Analysis",
    tagline: "Know exactly which sounds to fix",
    description:
      "Spokiva's pronunciation engine goes beyond a simple score. It identifies specific phonemes you're mispronouncing, compares your delivery to a native reference, and provides targeted drills.",
    benefits: [
      "Phoneme-level error detection",
      "Word stress and intonation analysis",
      "Accent-neutral reference model",
      "Specific improvement exercises per sound",
      "Progress tracking across sessions",
    ],
  },
  {
    icon: BookOpen,
    title: "IELTS Speaking Coach",
    tagline: "Band score estimates with examiner feedback",
    description:
      "Practice all three parts of the IELTS Speaking test with realistic prompts. Get band score estimates across all four official criteria and receive examiner-style written feedback after every session.",
    benefits: [
      "Part 1: Personal questions (4–5 minutes)",
      "Part 2: Cue card with 1-min prep, 2-min talk",
      "Part 3: Two-way discussion on abstract topics",
      "Band scores for Fluency, Lexical Resource, Grammar, Pronunciation",
      "Examiner-style written feedback with improvement tips",
    ],
  },
  {
    icon: Briefcase,
    title: "Interview Coach",
    tagline: "Nail every question with structured answers",
    description:
      "The Interview Coach module helps you prepare for job interviews, MBA applications, and leadership assessments. Practice common question types with the STAR method scaffold built in.",
    benefits: [
      "Situation–Task–Action–Result answer framework",
      "Behavioral, competency, and situational question banks",
      "MBA interview simulation (HBS, Wharton formats)",
      "AI tips displayed while you formulate your answer",
      "Mock feedback score on relevance, structure, and delivery",
    ],
  },
  {
    icon: Users,
    title: "Virtual Audience Simulation",
    tagline: "Practice under pressure before it matters",
    description:
      "Virtual Audience Simulation creates realistic pressure scenarios so you feel confident in the real thing. Choose from six audience modes, from a friendly supportive crowd to a difficult executive boardroom.",
    benefits: [
      "Friendly Audience — confidence-building mode",
      "Professional Audience — general workplace",
      "Difficult Audience — hecklers and skeptics",
      "Executive Boardroom — high-stakes pressure",
      "Interview Panel — formal multi-person panel",
      "IELTS Exam Room — timed exam simulation",
    ],
  },
];

const comparisonRows = [
  { feature: "AI-generated scripts", spokiva: true, duolingo: false, elsa: false, youtube: false },
  { feature: "Speech recording & analysis", spokiva: true, duolingo: false, elsa: true, youtube: false },
  { feature: "Pronunciation phoneme scoring", spokiva: true, duolingo: false, elsa: true, youtube: false },
  { feature: "IELTS band score estimates", spokiva: true, duolingo: false, elsa: false, youtube: false },
  { feature: "Interview Coach (STAR method)", spokiva: true, duolingo: false, elsa: false, youtube: false },
  { feature: "Virtual Audience Simulation", spokiva: true, duolingo: false, elsa: false, youtube: false },
  { feature: "Progress analytics dashboard", spokiva: true, duolingo: true, elsa: true, youtube: false },
  { feature: "Business scenario scripts", spokiva: true, duolingo: false, elsa: false, youtube: false },
];

export default function FeaturesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-[var(--accent-bg)] py-16 px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-4">Everything you need to speak better</h1>
            <p className="text-lg text-[var(--text-secondary)] mb-8">
              Six powerful AI tools covering every dimension of spoken English — from script generation to real-time pronunciation analysis.
            </p>
            <Link
              href="/signup"
              className="inline-block bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold px-8 py-3 rounded transition-colors"
            >
              Start for Free
            </Link>
          </div>
        </section>

        {/* Features */}
        {features.map((feature, i) => {
          const Icon = feature.icon;
          const isEven = i % 2 === 0;
          return (
            <section key={feature.title} className={`py-16 px-4 ${isEven ? "bg-[var(--bg-card)]" : "bg-[var(--bg-secondary)]"}`}>
              <div className="max-w-5xl mx-auto">
                <div className={`flex flex-col ${isEven ? "md:flex-row" : "md:flex-row-reverse"} gap-10 items-start`}>
                  <div className="flex-1">
                    <div className="w-12 h-12 bg-[var(--accent-bg)] rounded-xl flex items-center justify-center mb-4">
                      <Icon size={24} className="text-[var(--accent)]" />
                    </div>
                    <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">{feature.title}</h2>
                    <p className="text-[var(--accent)] font-semibold text-sm mb-3">{feature.tagline}</p>
                    <p className="text-[var(--text-secondary)] leading-relaxed mb-6">{feature.description}</p>
                    <ul className="space-y-2">
                      {feature.benefits.map((b) => (
                        <li key={b} className="flex items-start gap-2 text-sm text-[var(--text-primary)]">
                          <CheckCircle size={15} className="text-[#00B37D] mt-0.5 shrink-0" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex-1 bg-[var(--accent-bg)] rounded-xl h-64 flex items-center justify-center">
                    <div className="text-center p-8">
                      <Icon size={64} className="text-[var(--accent)] opacity-20 mx-auto mb-3" />
                      <p className="text-[var(--accent)] font-semibold text-sm">{feature.title}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        })}

        {/* Comparison Table */}
        <section className="bg-[var(--bg-card)] py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2 text-center">How Spokiva compares</h2>
            <p className="text-[var(--text-secondary)] text-center mb-10">vs. Duolingo, ELSA Speak, and YouTube tutorials</p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[var(--bg-secondary)]">
                    <th className="text-left px-4 py-3 text-sm font-bold text-[var(--text-primary)] border border-[var(--border)]">Feature</th>
                    <th className="px-4 py-3 text-sm font-bold text-[var(--accent)] border border-[var(--border)] text-center">Spokiva</th>
                    <th className="px-4 py-3 text-sm font-bold text-[var(--text-secondary)] border border-[var(--border)] text-center">Duolingo</th>
                    <th className="px-4 py-3 text-sm font-bold text-[var(--text-secondary)] border border-[var(--border)] text-center">ELSA Speak</th>
                    <th className="px-4 py-3 text-sm font-bold text-[var(--text-secondary)] border border-[var(--border)] text-center">YouTube</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, i) => (
                    <tr key={row.feature} className={i % 2 === 0 ? "bg-[var(--bg-card)]" : "bg-[var(--bg-secondary)]"}>
                      <td className="px-4 py-3 text-sm text-[var(--text-primary)] border border-[var(--border)]">{row.feature}</td>
                      {[row.spokiva, row.duolingo, row.elsa, row.youtube].map((val, j) => (
                        <td key={j} className="px-4 py-3 border border-[var(--border)] text-center">
                          {val ? (
                            <CheckCircle size={16} className={j === 0 ? "text-[#00B37D] mx-auto" : "text-[var(--text-secondary)] mx-auto"} />
                          ) : (
                            <X size={16} className="text-[var(--text-muted)] mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[var(--accent)] py-14 px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-4">Ready to get started?</h2>
            <p className="text-blue-100 mb-6">Join 50,000+ speakers improving with Spokiva.</p>
            <Link
              href="/signup"
              className="inline-block bg-[var(--bg-card)] text-[var(--accent)] hover:bg-[var(--accent-bg)] font-bold px-8 py-3 rounded transition-colors"
            >
              Create Free Account
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
