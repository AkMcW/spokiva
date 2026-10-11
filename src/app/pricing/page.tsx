import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { CheckCircle, X } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "Perfect for exploring the platform.",
    highlight: false,
    badge: null,
    features: [
      { text: "5 practice sessions/month", included: true },
      { text: "3 AI-generated scripts", included: true },
      { text: "Basic pronunciation score", included: true },
      { text: "Email support", included: true },
      { text: "IELTS Speaking mode", included: false },
      { text: "Interview Coach mode", included: false },
      { text: "Progress tracking", included: false },
      { text: "Virtual Audience Simulation", included: false },
    ],
    cta: "Get Started Free",
    ctaHref: "/signup",
  },
  {
    name: "Starter",
    price: "$9",
    period: "/month",
    description: "Great for casual learners building a habit.",
    highlight: false,
    badge: null,
    features: [
      { text: "20 practice sessions/month", included: true },
      { text: "10 AI-generated scripts", included: true },
      { text: "Full pronunciation analysis", included: true },
      { text: "IELTS Speaking mode", included: true },
      { text: "Interview Coach mode", included: false },
      { text: "Progress tracking", included: true },
      { text: "Priority email support", included: true },
      { text: "Virtual Audience Simulation", included: false },
    ],
    cta: "Choose Starter",
    ctaHref: "/signup",
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    description: "For serious learners targeting real results.",
    highlight: true,
    badge: "Most Popular",
    features: [
      { text: "Unlimited practice sessions", included: true },
      { text: "Unlimited AI scripts", included: true },
      { text: "Full pronunciation analysis", included: true },
      { text: "IELTS Speaking mode", included: true },
      { text: "Interview Coach mode", included: true },
      { text: "Presentation Coach", included: true },
      { text: "Progress tracking & analytics", included: true },
      { text: "Virtual Audience Simulation", included: false },
    ],
    cta: "Choose Pro",
    ctaHref: "/signup",
  },
  {
    name: "Pro+ Simulation",
    price: "$39",
    period: "/month",
    description: "Unlock virtual audience simulation for peak performance.",
    highlight: false,
    badge: "Best for Exams",
    features: [
      { text: "Everything in Pro", included: true },
      { text: "Virtual Audience Simulation", included: true },
      { text: "6 audience modes", included: true },
      { text: "IELTS Exam Room simulation", included: true },
      { text: "Interview Panel simulation", included: true },
      { text: "Executive Boardroom mode", included: true },
      { text: "Advanced AI coaching notes", included: true },
      { text: "1-on-1 monthly review call", included: true },
    ],
    cta: "Choose Pro+",
    ctaHref: "/signup",
  },
  {
    name: "Team",
    price: "$99",
    period: "/10 users/month",
    description: "For organizations training their workforce.",
    highlight: false,
    badge: null,
    features: [
      { text: "Everything in Pro+", included: true },
      { text: "10 user seats included", included: true },
      { text: "Team analytics dashboard", included: true },
      { text: "Manager reporting", included: true },
      { text: "Custom scenario builder", included: true },
      { text: "SSO / SAML integration", included: true },
      { text: "Dedicated account manager", included: true },
      { text: "Custom onboarding", included: true },
    ],
    cta: "Contact Sales",
    ctaHref: "#",
  },
];

const faqs = [
  {
    q: "Can I cancel anytime?",
    a: "Yes. All plans are month-to-month with no long-term commitment. Cancel any time from your account settings and you won't be charged again.",
  },
  {
    q: "Is there a free trial for paid plans?",
    a: "All new accounts start on the Free plan automatically. You can upgrade at any time to unlock premium features.",
  },
  {
    q: "What counts as a 'practice session'?",
    a: "A practice session is one complete recording and analysis cycle — from pressing Record to receiving your AI feedback report.",
  },
  {
    q: "How is the Team plan billed?",
    a: "The Team plan is billed monthly at $99 for up to 10 users. Additional seats can be added at $8/user/month.",
  },
  {
    q: "Does the Free plan include IELTS practice?",
    a: "No. IELTS Speaking mode is available on Starter and above. Free users can access the general practice module.",
  },
  {
    q: "Can I get a refund?",
    a: "We offer a 7-day money-back guarantee on all paid plans. Contact support within 7 days of your first charge for a full refund.",
  },
];

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-[var(--accent-bg)] py-16 px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-4">Simple, transparent pricing</h1>
            <p className="text-lg text-[var(--text-secondary)]">
              Start for free. Upgrade when you need more sessions, features, or simulation modes.
            </p>
          </div>
        </section>

        {/* Plans */}
        <section className="bg-[var(--bg-card)] py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`rounded-lg border p-6 flex flex-col ${
                    plan.highlight
                      ? "bg-[var(--accent)] border-[var(--accent)] text-white shadow-lg scale-[1.02]"
                      : "bg-[var(--bg-card)] border-[var(--border)]"
                  }`}
                >
                  <div className="mb-4">
                    {plan.badge && (
                      <span
                        className={`inline-block text-xs font-bold px-2 py-0.5 rounded mb-2 ${
                          plan.highlight
                            ? "bg-[var(--bg-card)] text-[var(--accent)]"
                            : "bg-[#F5A623] text-white"
                        }`}
                      >
                        {plan.badge}
                      </span>
                    )}
                    <h2 className={`text-lg font-bold ${plan.highlight ? "text-white" : "text-[var(--text-primary)]"}`}>
                      {plan.name}
                    </h2>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className={`text-3xl font-bold ${plan.highlight ? "text-white" : "text-[var(--text-primary)]"}`}>
                        {plan.price}
                      </span>
                      <span className={`text-xs ${plan.highlight ? "text-blue-200" : "text-[var(--text-secondary)]"}`}>
                        {plan.period}
                      </span>
                    </div>
                    <p className={`text-xs mt-1 leading-relaxed ${plan.highlight ? "text-blue-200" : "text-[var(--text-secondary)]"}`}>
                      {plan.description}
                    </p>
                  </div>

                  <ul className="space-y-2 mb-6 flex-1">
                    {plan.features.map((f) => (
                      <li key={f.text} className="flex items-start gap-2 text-xs">
                        {f.included ? (
                          <CheckCircle size={13} className={`mt-0.5 shrink-0 ${plan.highlight ? "text-blue-200" : "text-[#00B37D]"}`} />
                        ) : (
                          <X size={13} className={`mt-0.5 shrink-0 ${plan.highlight ? "text-blue-300" : "text-[var(--text-muted)]"}`} />
                        )}
                        <span className={f.included ? (plan.highlight ? "text-blue-100" : "text-[var(--text-primary)]") : (plan.highlight ? "text-blue-300" : "text-[var(--text-muted)]")}>
                          {f.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={plan.ctaHref}
                    className={`block text-center py-2.5 rounded font-semibold text-sm transition-colors ${
                      plan.highlight
                        ? "bg-[var(--bg-card)] text-[var(--accent)] hover:bg-[var(--accent-bg)]"
                        : "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-[var(--bg-secondary)] py-16 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-8 text-center">Frequently asked questions</h2>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <div key={faq.q} className="bg-[var(--bg-card)] rounded-lg border border-[var(--border)] p-6">
                  <h3 className="font-semibold text-[var(--text-primary)] mb-2">{faq.q}</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[var(--accent)] py-14 px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-4">Ready to speak with confidence?</h2>
            <p className="text-blue-100 mb-6">Start free, no credit card required.</p>
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
