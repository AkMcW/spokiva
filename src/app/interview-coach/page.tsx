import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { Briefcase, CheckCircle, ArrowRight, Star } from "lucide-react";

const questionTypes = [
  {
    type: "Behavioral",
    description: "Tell me about a time when… questions that test past experience and behavior.",
    examples: ["Tell me about a time you led a team through a difficult change.", "Describe a situation where you had to meet a tight deadline."],
  },
  {
    type: "Competency",
    description: "Questions testing specific skills like leadership, communication, and problem-solving.",
    examples: ["How do you prioritize competing tasks under pressure?", "Give an example of a complex problem you solved analytically."],
  },
  {
    type: "Situational",
    description: "Hypothetical questions about how you would handle a future scenario.",
    examples: ["What would you do if a key team member quit mid-project?", "How would you handle a client who keeps changing requirements?"],
  },
  {
    type: "Motivational",
    description: "Questions exploring your values, drivers, and career goals.",
    examples: ["Why do you want to work at this company?", "Where do you see yourself in 5 years?"],
  },
];

const practiceModes = [
  { name: "Job Interview", desc: "Standard corporate interview with common behavioral and competency questions." },
  { name: "MBA Interview", desc: "HBS, Wharton, and LBS-style interviews focused on leadership and motivation." },
  { name: "Leadership Q&A", desc: "Senior leader and executive-level questions on strategy and team management." },
  { name: "Technical Interview", desc: "Combine technical knowledge questions with behavioral STAR answers." },
];

const starExample = {
  question: "Tell me about a time you led a project under a tight deadline.",
  situation: "Our product launch was moved forward by 3 weeks due to a competitor announcement.",
  task: "As project manager, I needed to realign the team and compress the timeline without compromising quality.",
  action: "I ran a sprint planning session the next morning, reprioritized the backlog by business impact, and negotiated with the design team to deliver wireframes in 48 hours instead of the usual 5 days.",
  result: "We delivered the MVP on the new deadline. The launch exceeded our first-week activation target by 22%, and the CEO recognized the team's effort in the all-hands meeting.",
};

export default function InterviewCoachPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-[var(--accent-bg)] py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <span className="inline-block bg-[var(--accent)] text-white text-xs font-bold px-3 py-1 rounded-full mb-4">
              Interview Coach
            </span>
            <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-4">
              Interview Coach
            </h1>
            <p className="text-lg text-[var(--text-secondary)] mb-8 max-w-2xl leading-relaxed">
              Master the STAR method, practice common interview question types, and get AI feedback on your answers. Prepare for job interviews, MBA applications, and leadership assessments.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold px-8 py-3 rounded transition-colors"
              >
                Start Practicing Free <ArrowRight size={16} />
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

        {/* STAR Method */}
        <section className="bg-[var(--bg-card)] py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
              <div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">The STAR Method — built in</h2>
                <p className="text-[var(--text-secondary)] leading-relaxed mb-6">
                  Spokiva structures every interview answer using the STAR framework — the gold standard for behavioral interview responses.
                </p>
                <div className="space-y-4">
                  {[
                    { letter: "S", label: "Situation", desc: "Set the context. Describe the scenario clearly and concisely." },
                    { letter: "T", label: "Task", desc: "Explain your specific responsibility or challenge." },
                    { letter: "A", label: "Action", desc: "Detail the specific steps you took — use 'I', not 'we'." },
                    { letter: "R", label: "Result", desc: "Quantify the outcome. What changed? What did you achieve?" },
                  ].map((item) => (
                    <div key={item.letter} className="flex gap-4">
                      <div className="w-10 h-10 bg-[var(--accent)] text-white rounded-lg flex items-center justify-center font-bold text-lg shrink-0">
                        {item.letter}
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">{item.label}</p>
                        <p className="text-sm text-[var(--text-secondary)]">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* STAR Example */}
              <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)] p-5">
                <p className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider mb-3">Sample STAR Answer</p>
                <p className="text-sm font-semibold text-[var(--text-primary)] mb-3 italic">&ldquo;{starExample.question}&rdquo;</p>
                <div className="space-y-3">
                  {[
                    { label: "Situation", text: starExample.situation },
                    { label: "Task", text: starExample.task },
                    { label: "Action", text: starExample.action },
                    { label: "Result", text: starExample.result },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="text-xs font-bold text-[var(--accent)] mb-0.5">{item.label}</p>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Question Types */}
        <section className="bg-[var(--bg-secondary)] py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2 text-center">Question types we cover</h2>
            <p className="text-[var(--text-secondary)] text-center mb-10">Practice with hundreds of real questions across every category.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {questionTypes.map(({ type, description, examples }) => (
                <div key={type} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase size={16} className="text-[var(--accent)]" />
                    <h3 className="font-bold text-[var(--text-primary)]">{type}</h3>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] mb-3 leading-relaxed">{description}</p>
                  <ul className="space-y-1">
                    {examples.map((e) => (
                      <li key={e} className="text-xs text-[var(--text-secondary)] italic flex items-start gap-1">
                        <span className="text-[var(--accent)] font-bold mt-0.5">›</span>
                        {e}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Practice Modes */}
        <section className="bg-[var(--bg-card)] py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2 text-center">Practice modes</h2>
            <p className="text-[var(--text-secondary)] text-center mb-10">Choose a scenario that matches your target interview.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {practiceModes.map(({ name, desc }) => (
                <div key={name} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-5 flex items-start gap-4">
                  <div className="w-8 h-8 bg-[var(--accent)] rounded text-white flex items-center justify-center shrink-0">
                    <Star size={14} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--text-primary)] mb-1">{name}</h3>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="bg-[var(--bg-secondary)] py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-8 text-center">What you get with Interview Coach</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                "AI tips displayed as you formulate your answer",
                "STAR structure scoring on every response",
                "Fluency and confidence delivery feedback",
                "Vocabulary suggestions for professional impact",
                "Mock panel interview simulation (Pro+)",
                "Hundreds of real behavioral questions",
                "MBA-specific question bank (HBS, Wharton, LBS)",
                "Progress tracking across interview sessions",
              ].map((b) => (
                <div key={b} className="flex items-start gap-2">
                  <CheckCircle size={15} className="text-[#00B37D] mt-0.5 shrink-0" />
                  <span className="text-sm text-[var(--text-primary)]">{b}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[var(--accent)] py-14 px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-4">Ace your next interview</h2>
            <p className="text-blue-100 mb-6">Start free. No credit card required.</p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-[var(--bg-card)] text-[var(--accent)] hover:bg-[var(--accent-bg)] font-bold px-8 py-3 rounded transition-colors"
            >
              Start Interview Practice <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
