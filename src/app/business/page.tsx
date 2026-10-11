import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { Briefcase, Monitor, Users, CheckCircle, ArrowRight } from "lucide-react";

const useCases = [
  {
    icon: Users,
    title: "Business Meetings",
    description:
      "Speak up confidently in team meetings, client calls, and cross-functional discussions. Practice managing turn-taking, expressing opinions clearly, and summarizing action items.",
    scenarios: [
      "Weekly status updates with your manager",
      "Client discovery and requirements meetings",
      "Cross-cultural team alignment calls",
      "Negotiation and conflict resolution",
    ],
  },
  {
    icon: Monitor,
    title: "Presentations",
    description:
      "Deliver compelling presentations to any audience. Practice your opening hook, main argument, data storytelling, and closing call to action with AI feedback on every delivery.",
    scenarios: [
      "Quarterly business reviews",
      "Product roadmap presentations",
      "Sales pitches and demos",
      "Conference and webinar talks",
    ],
  },
  {
    icon: Briefcase,
    title: "Executive Updates",
    description:
      "Communicate clearly and concisely with senior leadership. Practice delivering updates with confidence, handling tough questions, and projecting executive presence.",
    scenarios: [
      "C-suite project updates",
      "Board meeting summaries",
      "Escalation and risk briefings",
      "Strategic proposals",
    ],
  },
];

const sampleScript = `Good morning, everyone. Thank you for joining today's project update.

I want to cover three key areas: our progress against Q3 targets, two blockers we're managing, and our plan for the next two weeks.

On progress: we completed the backend API integration last Friday — three days ahead of schedule. The QA team has started regression testing, and we're currently at 94% test pass rate.

On blockers: we have two items. First, the vendor hasn't delivered the final design assets, which is delaying the frontend build. I've escalated this to our account manager and expect resolution by Wednesday. Second, we need a decision on the mobile-first vs. desktop-first rollout approach before we can finalize the release plan.

For the next two weeks: we'll complete QA by June 12th, run UAT with the client team the following week, and target a soft launch on June 20th.

Are there any questions on the timeline or blockers before we discuss the release decision?`;

export default function BusinessPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-[var(--accent-bg)] py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <span className="inline-block bg-[var(--accent)] text-white text-xs font-bold px-3 py-1 rounded-full mb-4">
              Business Communication
            </span>
            <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-4">
              Speak up at work with confidence
            </h1>
            <p className="text-lg text-[var(--text-secondary)] mb-8 max-w-2xl leading-relaxed">
              Spokiva Business helps non-native English professionals communicate clearly in meetings, presentations, and executive updates — with AI-powered script generation and real-time delivery feedback.
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
                View Business Plans
              </Link>
            </div>
          </div>
        </section>

        {/* Target audience */}
        <section className="bg-[var(--bg-card)] py-12 px-4 border-b border-[var(--border)]">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-5">Built for professionals from</p>
            <div className="flex flex-wrap gap-3 justify-center">
              {["India", "China", "Brazil", "Mexico", "Nigeria", "Vietnam", "Philippines", "South Korea", "Germany", "France", "Japan", "Turkey"].map((country) => (
                <span key={country} className="bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm px-4 py-2 rounded-full border border-[var(--border)]">
                  {country}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="bg-[var(--bg-secondary)] py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2 text-center">Practice real workplace scenarios</h2>
            <p className="text-[var(--text-secondary)] text-center mb-10">Choose a scenario, generate a script, and practice with AI feedback.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {useCases.map(({ icon: Icon, title, description, scenarios }) => (
                <div key={title} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6">
                  <div className="w-10 h-10 bg-[var(--accent-bg)] rounded-lg flex items-center justify-center mb-4">
                    <Icon size={20} className="text-[var(--accent)]" />
                  </div>
                  <h3 className="font-bold text-[var(--text-primary)] mb-2">{title}</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">{description}</p>
                  <ul className="space-y-1.5">
                    {scenarios.map((s) => (
                      <li key={s} className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
                        <CheckCircle size={12} className="text-[#00B37D] mt-0.5 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sample Script */}
        <section className="bg-[var(--bg-card)] py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
              <div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">AI-generated script example</h2>
                <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
                  Tell Spokiva your meeting topic, audience, and duration — and get a structured, professional script ready to practice in seconds.
                </p>
                <ul className="space-y-2 mb-6">
                  {[
                    "Structured openings and transitions",
                    "Professional business vocabulary",
                    "Clear agenda and action item framing",
                    "One-click: Make More Concise, Add Data Points, Make Formal",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-[var(--text-primary)]">
                      <CheckCircle size={14} className="text-[#00B37D] mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className="inline-block bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold px-6 py-2.5 rounded text-sm transition-colors"
                >
                  Generate My Script
                </Link>
              </div>
              <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold text-[var(--accent)] bg-[var(--accent-bg)] px-2 py-0.5 rounded">AI Generated</span>
                  <span className="text-xs text-[var(--text-secondary)]">Business Meeting • 2 minutes • Professional</span>
                </div>
                <pre className="text-xs text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap font-sans">{sampleScript}</pre>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="bg-[var(--bg-secondary)] py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-8 text-center">Why non-native professionals choose Spokiva</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                "Practice before high-stakes meetings, not after",
                "Reduce filler words (um, ah, like, basically)",
                "Build confidence with repetition and AI feedback",
                "Improve pace, pausing, and emphasis",
                "Learn professional vocabulary in context",
                "Get feedback on tone and formality level",
                "Accessible on mobile — practice in your commute",
                "See measurable improvement week over week",
              ].map((b) => (
                <div key={b} className="flex items-start gap-2 bg-[var(--bg-card)] p-4 rounded-lg border border-[var(--border)]">
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
            <h2 className="text-2xl font-bold text-white mb-4">Start speaking up at work today</h2>
            <p className="text-blue-100 mb-6">Free plan available. No credit card needed.</p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-[var(--bg-card)] text-[var(--accent)] hover:bg-[var(--accent-bg)] font-bold px-8 py-3 rounded transition-colors"
            >
              Get Started Free <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
