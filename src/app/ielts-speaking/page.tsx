import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { BookOpen, Clock, Mic2, CheckCircle, ArrowRight } from "lucide-react";

const parts = [
  {
    part: "Part 1",
    duration: "4–5 minutes",
    description: "The examiner asks you questions about yourself and familiar topics such as home, family, work, studies, and interests.",
    icon: Mic2,
    sampleQuestions: [
      "Do you enjoy cooking? Why or why not?",
      "How often do you use public transport?",
      "What do you usually do in your free time?",
      "Did you enjoy studying at school? Why?",
    ],
  },
  {
    part: "Part 2",
    duration: "3–4 minutes",
    description: "You receive a task card with a topic and bullet points. You have 1 minute to prepare, then speak for 1–2 minutes.",
    icon: BookOpen,
    sampleQuestions: [
      "Describe a memorable journey you have taken.",
      "Talk about a person who has influenced you.",
      "Describe a place you have always wanted to visit.",
      "Talk about a skill you would like to learn.",
    ],
  },
  {
    part: "Part 3",
    duration: "4–5 minutes",
    description: "A two-way discussion with the examiner on abstract topics connected to the Part 2 theme. Tests deeper analytical thinking.",
    icon: Clock,
    sampleQuestions: [
      "Why do people enjoy travelling to foreign countries?",
      "How does technology affect the way we communicate today?",
      "Do you think governments should invest in public transport?",
      "What role does education play in personal development?",
    ],
  },
];

const criteria = [
  {
    name: "Fluency & Coherence",
    band1: "Monosyllabic or no communication",
    band5: "Noticeable repetition and hesitation",
    band7: "Speaks at length with minimal hesitation",
    band9: "Speaks fluently with only natural hesitation",
  },
  {
    name: "Lexical Resource",
    band1: "No vocabulary",
    band5: "Basic vocabulary, errors affect communication",
    band7: "Flexible and varied vocabulary, some errors",
    band9: "Full, natural, precise vocabulary control",
  },
  {
    name: "Grammatical Range",
    band1: "No grammatical forms",
    band5: "Limited structures, frequent errors",
    band7: "Complex structures with some errors",
    band9: "Full range, only sporadic minor errors",
  },
  {
    name: "Pronunciation",
    band1: "Almost unintelligible",
    band5: "Generally understood despite mispronunciations",
    band7: "Easy to understand, L1 accent no issue",
    band9: "Expert use of all pronunciation features",
  },
];

export default function IELTSSpeakingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-[var(--accent-bg)] py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-[var(--accent)] text-white text-xs font-bold px-3 py-1 rounded-full">IELTS</span>
              <span className="text-sm text-[var(--text-secondary)]">Official Band 1–9 Assessment</span>
            </div>
            <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-4">
              IELTS Speaking Coach
            </h1>
            <p className="text-lg text-[var(--text-secondary)] mb-8 max-w-2xl leading-relaxed">
              Practice all three parts of the IELTS Speaking test with realistic AI-generated prompts, 1-minute prep timers, and band score estimates aligned to official examiner criteria.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold px-8 py-3 rounded transition-colors"
              >
                Start IELTS Practice <ArrowRight size={16} />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent-bg)] font-semibold px-8 py-3 rounded transition-colors"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </section>

        {/* 3 Parts */}
        <section className="bg-[var(--bg-card)] py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2 text-center">The three parts of IELTS Speaking</h2>
            <p className="text-[var(--text-secondary)] text-center mb-10">Practice each part individually or run a complete 11–14 minute test.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {parts.map(({ part, duration, description, icon: Icon, sampleQuestions }) => (
                <div key={part} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6">
                  <div className="w-10 h-10 bg-[var(--accent-bg)] rounded-lg flex items-center justify-center mb-4">
                    <Icon size={20} className="text-[var(--accent)]" />
                  </div>
                  <h3 className="font-bold text-[var(--text-primary)] mb-1">{part}</h3>
                  <span className="inline-block text-xs bg-[var(--bg-secondary)] text-[var(--text-secondary)] px-2 py-0.5 rounded mb-3">{duration}</span>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">{description}</p>
                  <div>
                    <p className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-2">Sample Questions</p>
                    <ul className="space-y-1.5">
                      {sampleQuestions.map((q) => (
                        <li key={q} className="text-xs text-[var(--text-secondary)] flex items-start gap-1.5">
                          <span className="text-[var(--accent)] font-bold mt-0.5">›</span>
                          {q}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Scoring Criteria Table */}
        <section className="bg-[var(--bg-secondary)] py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2 text-center">IELTS Band Score Criteria</h2>
            <p className="text-[var(--text-secondary)] text-center mb-10">Spokiva estimates your band across all four official dimensions.</p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-[var(--bg-card)] rounded-lg overflow-hidden border border-[var(--border)]">
                <thead>
                  <tr className="bg-[var(--accent)] text-white">
                    <th className="text-left px-4 py-3 text-sm font-bold">Criteria</th>
                    <th className="px-4 py-3 text-sm font-bold text-center">Band 1–2</th>
                    <th className="px-4 py-3 text-sm font-bold text-center">Band 5</th>
                    <th className="px-4 py-3 text-sm font-bold text-center">Band 7</th>
                    <th className="px-4 py-3 text-sm font-bold text-center">Band 9</th>
                  </tr>
                </thead>
                <tbody>
                  {criteria.map((row, i) => (
                    <tr key={row.name} className={i % 2 === 0 ? "bg-[var(--bg-card)]" : "bg-[var(--bg-secondary)]"}>
                      <td className="px-4 py-3 text-sm font-semibold text-[var(--text-primary)] border-b border-[var(--border)]">{row.name}</td>
                      <td className="px-4 py-3 text-xs text-[var(--text-secondary)] border-b border-[var(--border)] text-center">{row.band1}</td>
                      <td className="px-4 py-3 text-xs text-[var(--text-secondary)] border-b border-[var(--border)] text-center">{row.band5}</td>
                      <td className="px-4 py-3 text-xs text-[var(--text-secondary)] border-b border-[var(--border)] text-center">{row.band7}</td>
                      <td className="px-4 py-3 text-xs text-[#00B37D] font-medium border-b border-[var(--border)] text-center">{row.band9}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Why Spokiva for IELTS */}
        <section className="bg-[var(--bg-card)] py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-8 text-center">Why Spokiva for IELTS?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                "Band score estimates aligned to official IELTS criteria",
                "Examiner-style written feedback after every session",
                "Part 2 includes 1-minute preparation timer",
                "Unlimited practice questions across all 3 parts",
                "Track your band score improvement over time",
                "Vocabulary and grammar suggestions per response",
                "Fluency and coherence scoring with specific tips",
                "Works on mobile — practice anywhere, anytime",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-[#00B37D] mt-0.5 shrink-0" />
                  <span className="text-sm text-[var(--text-primary)]">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Demo CTA */}
        <section className="bg-[var(--accent)] py-14 px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-4">Ready to target Band 7+?</h2>
            <p className="text-blue-100 mb-6">Start practicing free. No credit card required.</p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-[var(--bg-card)] text-[var(--accent)] hover:bg-[var(--accent-bg)] font-bold px-8 py-3 rounded transition-colors"
            >
              Start Free IELTS Practice <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
