"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, Smile, Frown, Building, UserCheck, BookOpen, Lock, Play, ShieldCheck } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { ADMIN_EMAIL } from "@/lib/users";

const audienceModes = [
  {
    icon: Smile,
    name: "Friendly Audience",
    description: "A supportive, encouraging crowd. Ideal for building basic confidence and overcoming stage fright.",
    color: "#00B37D",
    bg: "var(--success-bg)",
  },
  {
    icon: Users,
    name: "Professional Audience",
    description: "A neutral, attentive group of colleagues or peers. Standard workplace presentation simulation.",
    color: "var(--accent)",
    bg: "var(--accent-bg)",
  },
  {
    icon: Frown,
    name: "Difficult Audience",
    description: "Skeptical, distracted, or challenging listeners. Tests your ability to maintain composure under pressure.",
    color: "#E53935",
    bg: "var(--danger-bg)",
  },
  {
    icon: Building,
    name: "Executive Boardroom",
    description: "High-stakes simulation with a senior leadership audience. Emphasis on conciseness, data, and executive presence.",
    color: "#7B61FF",
    bg: "var(--info-bg)",
  },
  {
    icon: UserCheck,
    name: "Interview Panel",
    description: "Multi-person formal interview panel. Simulates pressure of being evaluated by multiple interviewers simultaneously.",
    color: "#F5A623",
    bg: "var(--warning-bg)",
  },
  {
    icon: BookOpen,
    name: "IELTS Exam Room",
    description: "Timed IELTS Speaking test environment with examiner-style interaction and official test format.",
    color: "var(--accent)",
    bg: "var(--accent-bg)",
  },
];

export default function AudiencePage() {
  const router = useRouter();
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const isAdmin = email === ADMIN_EMAIL;
  const hasAccess = isAdmin;

  function startSession(modeName: string) {
    localStorage.setItem("spokiva_active_script", JSON.stringify({
      content: "",
      scenario: `Virtual Audience: ${modeName}`,
      wordCount: 0,
    }));
    router.push("/dashboard/practice");
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Virtual Audience Simulation</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Practice speaking in front of realistic AI audience simulations.</p>
        </div>
        {hasAccess && (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-[var(--success-bg)] text-[#00B37D] px-3 py-1.5 rounded-full">
            {isAdmin ? <ShieldCheck size={12} /> : null}
            {isAdmin ? "Admin Access" : "Unlocked"}
          </span>
        )}
      </div>

      {/* Banner */}
      {!hasAccess ? (
        <div className="bg-[var(--warning-bg)] border border-[#F5A623] rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Lock size={18} className="text-[#F5A623] mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-[var(--text-primary)] text-sm">Upgrade to Pro+ to unlock Virtual Audience Simulation</p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">All 6 audience modes included in Pro+ Simulation at $39/month.</p>
            </div>
          </div>
          <Link
            href="/pricing"
            className="inline-block bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold px-5 py-2 rounded text-sm transition-colors shrink-0"
          >
            Upgrade to Pro+
          </Link>
        </div>
      ) : (
        <div className="bg-[var(--success-bg)] border border-[#00B37D] rounded-lg p-4 flex items-center gap-3">
          {isAdmin ? (
            <ShieldCheck size={18} className="text-[#00B37D] shrink-0" />
          ) : (
            <Play size={18} className="text-[#00B37D] shrink-0" />
          )}
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {isAdmin
              ? "Admin access — all audience modes fully unlocked."
              : "All 6 audience modes are unlocked on your Pro+ plan. Select a mode to begin."}
          </p>
        </div>
      )}

      {/* Audience Mode Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {audienceModes.map(({ icon: Icon, name, description, color, bg }) => (
          <div
            key={name}
            className={`bg-[var(--bg-card)] border rounded-lg p-5 relative transition-all ${
              hasAccess
                ? "border-[var(--border)] hover:shadow-md hover:border-[var(--accent)] cursor-pointer"
                : "border-[var(--border)] opacity-60"
            }`}
          >
            {!hasAccess && (
              <div className="absolute top-3 right-3">
                <span className="bg-[#F5A623] text-white text-[10px] font-bold px-2 py-0.5 rounded">Coming Soon</span>
              </div>
            )}

            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: hasAccess ? bg : "var(--bg-secondary)" }}>
              <Icon size={20} style={{ color: hasAccess ? color : "var(--text-muted)" }} />
            </div>

            <h3 className={`font-semibold mb-1 ${hasAccess ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>{name}</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3">{description}</p>

            {hasAccess ? (
              <button onClick={() => startSession(name)} className="w-full text-center text-xs font-semibold bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white py-2 rounded transition-colors flex items-center justify-center gap-1.5">
                <Play size={11} />
                Start Session
              </button>
            ) : (
              <button disabled className="w-full text-center text-xs font-semibold text-[var(--text-muted)] border border-[var(--border)] py-2 rounded cursor-not-allowed">
                <Lock size={11} className="inline mr-1" />
                Locked — Pro+ required
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Why section — only show for non-subscribers */}
      {!hasAccess && (
        <div className="bg-[var(--accent-bg)] rounded-lg p-6">
          <h2 className="font-bold text-[var(--text-primary)] mb-3">Why Virtual Audience Simulation?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { title: "Real pressure, zero risk", desc: "Experience high-stakes speaking scenarios before the real thing." },
              { title: "6 audience modes", desc: "From friendly to hostile — every professional scenario covered." },
              { title: "Confidence that transfers", desc: "Research shows simulated practice dramatically reduces real anxiety." },
            ].map(({ title, desc }) => (
              <div key={title}>
                <p className="font-semibold text-[var(--accent)] text-sm mb-1">{title}</p>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Link href="/pricing" className="inline-block bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold px-6 py-2.5 rounded text-sm transition-colors">
              View Pro+ Plan
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
