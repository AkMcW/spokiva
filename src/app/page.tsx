import Footer from "@/components/Footer";
import Link from "next/link";
import type { Metadata, Viewport } from "next";
import LandingHero from "@/components/landing/LandingHero";
import { Mic2, BarChart2, FileText, Users, BookOpen, Briefcase, CheckCircle, ArrowRight, Star } from "lucide-react";

const features = [
  { icon: FileText, title: "AI Script Writer", desc: "Generate polished scripts for any scenario — meetings, interviews, IELTS speaking, presentations — in seconds." },
  { icon: Mic2, title: "Speech Practice & Recording", desc: "Record yourself speaking and receive instant AI feedback on your delivery, rhythm, and filler words." },
  { icon: BarChart2, title: "Pronunciation Analysis", desc: "Phoneme-level pronunciation scoring with specific guidance on sounds that need improvement." },
  { icon: BookOpen, title: "IELTS Speaking Coach", desc: "Practice Parts 1, 2, and 3 with band score estimates and examiner-style feedback aligned to official criteria." },
  { icon: Briefcase, title: "Interview Coach", desc: "Master the STAR method with structured practice for job interviews, MBA applications, and leadership roles." },
  { icon: Users, title: "Virtual Audience Simulation", desc: "Simulate presenting to a Friendly, Professional, or Difficult audience to build confidence under pressure." },
];

const steps = [
  { num: "01", title: "Choose Your Scenario", desc: "Select from Business Meeting, IELTS Speaking, Interview, Presentation, or Public Speaking." },
  { num: "02", title: "Generate or Write a Script", desc: "Let AI craft a tailored script, or write your own and have it optimized." },
  { num: "03", title: "Practice with AI Feedback", desc: "Record your speech and receive instant scores on pronunciation, fluency, confidence, and structure." },
  { num: "04", title: "Track Your Progress", desc: "See your improvement across sessions with detailed analytics and streak tracking." },
];

const testimonials = [
  { name: "Priya Sharma", role: "IELTS Candidate", score: "Band 7.5", quote: "Spokiva helped me go from Band 5.5 to 7.5 in just 6 weeks. The AI feedback was more detailed than my tutor's." },
  { name: "Marcus Chen", role: "Senior Manager, Deloitte", score: "Promoted in 3 months", quote: "I used to struggle presenting to the C-suite. After 30 days of Spokiva practice, I felt completely confident." },
  { name: "Aisha Okonkwo", role: "MBA Applicant", score: "Accepted to 3 top schools", quote: "The interview coach helped me nail my STAR answers. The virtual panel simulation was a game changer." },
];

const plans = [
  { name: "Free", price: "$0", features: ["5 practice sessions/month", "AI Script Writer (3 scripts)", "Basic pronunciation score", "Email support"] },
  { name: "Pro", price: "$19", highlight: true, features: ["Unlimited sessions", "Unlimited scripts", "Full pronunciation analysis", "IELTS + Interview modes", "Progress tracking", "Priority support"] },
  { name: "Team", price: "$99", sub: "/10 users", features: ["Everything in Pro", "Team analytics dashboard", "Manager reporting", "Custom scenarios", "Dedicated account manager"] },
];

const useCasePills = [
  "IELTS Speaking", "Job Interviews", "MBA Applications", "Business Presentations",
  "Executive Updates", "Public Speaking", "Sales Pitches", "Team Meetings",
];

export const metadata: Metadata = {
  title: "Spokiva — Speak English with confidence",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#020816",
};

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <LandingHero />
      <div className="flex-1">
        {/* Use Case Pills */}
        <section className="bg-white py-10 px-4 border-b border-[#E0E0E0]">
          <div className="max-w-5xl mx-auto">
            <p className="text-center text-sm font-semibold text-[#636363] mb-5 uppercase tracking-wider">Practice for any situation</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {useCasePills.map((pill) => (
                <span key={pill} className="bg-[#F5F5F5] text-[#1F1F1F] text-sm px-4 py-2 rounded-full border border-[#E0E0E0] font-medium">{pill}</span>
              ))}
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section className="bg-[#F5F5F5] py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-[#1F1F1F] mb-4">The problem with traditional speaking practice</h2>
            <p className="text-[#636363] mb-10 text-lg">Most language learners practice the wrong way — repeating without feedback, reading without analysis, presenting without an audience.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: "No Real Feedback", desc: "Speaking alone in a mirror gives zero data on pronunciation errors, pace issues, or filler word frequency." },
                { title: "Too Expensive", desc: "Human coaches charge $50–$150/hour. Most learners can't afford consistent sessions." },
                { title: "No Structured Path", desc: "Random YouTube videos and apps don't provide a structured progression toward measurable speaking goals." },
              ].map((p) => (
                <div key={p.title} className="bg-white rounded-lg p-6 border border-[#E0E0E0]">
                  <h3 className="font-bold text-[#1F1F1F] mb-2">{p.title}</h3>
                  <p className="text-sm text-[#636363] leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="bg-white py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[#1F1F1F] mb-3">Everything you need to speak better</h2>
              <p className="text-[#636363] text-lg">Six powerful tools, one AI coach.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="bg-white border border-[#E0E0E0] rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 bg-[#E8F1FF] rounded-lg flex items-center justify-center mb-4">
                    <Icon size={20} className="text-[#0056D2]" />
                  </div>
                  <h3 className="font-bold text-[#1F1F1F] mb-2">{title}</h3>
                  <p className="text-sm text-[#636363] leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="bg-[#F5F5F5] py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[#1F1F1F] mb-3">How Spokiva works</h2>
              <p className="text-[#636363] text-lg">From zero to confident speaker in four steps.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {steps.map((step) => (
                <div key={step.num} className="bg-white rounded-lg p-6 border border-[#E0E0E0] flex gap-4">
                  <span className="text-3xl font-bold text-[#0056D2] opacity-30 leading-none shrink-0">{step.num}</span>
                  <div>
                    <h3 className="font-bold text-[#1F1F1F] mb-1">{step.title}</h3>
                    <p className="text-sm text-[#636363] leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="bg-white py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[#1F1F1F] mb-3">Real results from real speakers</h2>
              <p className="text-[#636363] text-lg">Join 50,000+ learners who've improved with Spokiva.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <div key={t.name} className="bg-[#F5F5F5] rounded-lg p-6 border border-[#E0E0E0]">
                  <div className="flex gap-1 mb-3">
                    {[1,2,3,4,5].map(i => <Star key={i} size={14} className="text-[#F5A623] fill-[#F5A623]" />)}
                  </div>
                  <p className="text-sm text-[#1F1F1F] leading-relaxed mb-4 italic">&ldquo;{t.quote}&rdquo;</p>
                  <div>
                    <p className="font-semibold text-[#1F1F1F] text-sm">{t.name}</p>
                    <p className="text-xs text-[#636363]">{t.role}</p>
                    <span className="inline-block mt-2 bg-[#E6F7F2] text-[#00B37D] text-xs font-semibold px-2 py-0.5 rounded">{t.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Preview */}
        <section className="bg-[#F5F5F5] py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[#1F1F1F] mb-3">Simple, transparent pricing</h2>
              <p className="text-[#636363] text-lg">Start free. Upgrade when you&apos;re ready.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div key={plan.name} className={`rounded-lg p-6 border ${plan.highlight ? "bg-[#0056D2] border-[#0056D2] text-white" : "bg-white border-[#E0E0E0]"}`}>
                  <h3 className={`font-bold text-lg mb-1 ${plan.highlight ? "text-white" : "text-[#1F1F1F]"}`}>{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className={`text-3xl font-bold ${plan.highlight ? "text-white" : "text-[#1F1F1F]"}`}>{plan.price}</span>
                    <span className={`text-sm ${plan.highlight ? "text-blue-200" : "text-[#636363]"}`}>/month{plan.sub || ""}</span>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <CheckCircle size={14} className={`mt-0.5 shrink-0 ${plan.highlight ? "text-blue-200" : "text-[#00B37D]"}`} />
                        <span className={plan.highlight ? "text-blue-100" : "text-[#636363]"}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/signup" className={`block text-center py-2.5 rounded font-semibold text-sm transition-colors ${plan.highlight ? "bg-white text-[#0056D2] hover:bg-[#E8F1FF]" : "bg-[#0056D2] text-white hover:bg-[#003B8E]"}`}>
                    {plan.name === "Free" ? "Get Started Free" : `Choose ${plan.name}`}
                  </Link>
                </div>
              ))}
            </div>
            <p className="text-center mt-6">
              <Link href="/pricing" className="text-sm text-[#0056D2] font-semibold hover:underline">View full pricing details →</Link>
            </p>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-[#0056D2] py-16 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Start speaking with confidence today</h2>
            <p className="text-blue-100 text-lg mb-8">Join 50,000+ learners improving their English speaking skills with AI-powered coaching.</p>
            <Link href="/signup" className="inline-flex items-center justify-center gap-2 bg-white text-[#0056D2] hover:bg-[#E8F1FF] font-bold px-10 py-4 rounded text-base transition-colors">
              Create Free Account <ArrowRight size={18} />
            </Link>
            <p className="text-blue-200 text-sm mt-4">No credit card required · Cancel anytime</p>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
