"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wand2, Copy, RotateCcw, Save, CheckCircle, ChevronDown, ChevronUp, Sparkles, Zap, Mic, Shuffle } from "lucide-react";

// ─── 46 Scenarios ───────────────────────────────────────────────
const SCENARIOS = [
  // Business
  "Business Meeting Update",
  "Executive Summary Presentation",
  "Board Room Update",
  "Quarterly Business Review",
  "Budget Proposal",
  "Risk & Issues Update",
  "Project Kickoff",
  "Product Launch Announcement",
  "Team Briefing",
  "Performance Review (Self)",
  "Difficult Conversation",
  "Crisis Communication",
  "Customer Complaint Response",
  "Negotiation Opening",
  "Sales Pitch",
  "Cold Call Introduction",
  "Product Demo",
  "Investor Pitch",
  // Presentations & Public Speaking
  "Conference Keynote",
  "Technical Presentation",
  "Training Presentation",
  "TED-style Talk",
  "Wedding Speech",
  "Award Acceptance Speech",
  "Toast / Tribute",
  "Graduation Speech",
  "Fundraising Appeal",
  // Career
  "Job Interview: Tell Me About Yourself",
  "Job Interview: Strengths & Weaknesses",
  "Job Interview: STAR Method Answer",
  "Job Promotion Pitch",
  "MBA Interview",
  "Scholarship Interview",
  "University Admission Interview",
  "LinkedIn Professional Intro",
  // Exam Prep
  "IELTS Speaking Part 1",
  "IELTS Speaking Part 2 (Cue Card)",
  "IELTS Speaking Part 3 (Discussion)",
  "TOEFL Independent Speaking",
  "TOEFL Integrated Speaking",
  "PTE Retell Lecture",
  "TOEIC Picture Description",
  "Cambridge C1 Long Turn",
  // Social
  "Media Interview Response",
  "Podcast Introduction",
];

// ─── 10 Presets ─────────────────────────────────────────────────
const PRESETS = [
  {
    label: "Tell Me About Yourself",
    icon: "🎯",
    form: { scenario: "Job Interview: Tell Me About Yourself", goal: "A compelling 90-second personal introduction covering my background, key strengths, and why I am the right fit for this role.", audience: "Interview Panel", tone: "Professional", duration: "1min", style: "" },
  },
  {
    label: "IELTS Part 2 Cue Card",
    icon: "📚",
    form: { scenario: "IELTS Speaking Part 2 (Cue Card)", goal: "Describe a memorable trip I took. Include where I went, who I went with, what I did, and why it was memorable.", audience: "IELTS Examiner", tone: "Conversational", duration: "2min", style: "" },
  },
  {
    label: "Q3 Project Status Update",
    icon: "📊",
    form: { scenario: "Business Meeting Update", goal: "Give a concise Q3 status update covering: progress against targets, two current blockers, and the plan for the next sprint.", audience: "Senior Management", tone: "Professional", duration: "2min", style: "" },
  },
  {
    label: "Investor Pitch Intro",
    icon: "💡",
    form: { scenario: "Investor Pitch", goal: "Open an investor pitch for a B2B SaaS startup. Cover the problem we solve, our solution, traction, and the ask.", audience: "Investors", tone: "Persuasive", duration: "3min", style: "" },
  },
  {
    label: "Executive Board Update",
    icon: "🏢",
    form: { scenario: "Board Room Update", goal: "Present a strategic update to the board covering key business metrics, risks, and the decision needed from the board today.", audience: "Board of Directors", tone: "Formal", duration: "3min", style: "" },
  },
  {
    label: "Sales Discovery Opening",
    icon: "💼",
    form: { scenario: "Sales Pitch", goal: "Open a discovery call with a new prospect. Build rapport, explain our value proposition, and transition into discovery questions.", audience: "Potential Client", tone: "Conversational", duration: "1min", style: "" },
  },
  {
    label: "TOEFL Independent Task",
    icon: "🌍",
    form: { scenario: "TOEFL Independent Speaking", goal: "Respond to: 'Some people prefer to work in teams. Others prefer to work alone. Which do you prefer and why?' Give a structured 45-second response.", audience: "TOEFL Examiner", tone: "Formal", duration: "30s", style: "" },
  },
  {
    label: "Conference Keynote Opener",
    icon: "🎤",
    form: { scenario: "Conference Keynote", goal: "Open a technology conference keynote. Start with a powerful hook, establish credibility, introduce the theme, and preview the talk.", audience: "Tech Professionals", tone: "Inspirational", duration: "3min", style: "" },
  },
  {
    label: "MBA Interview Why MBA",
    icon: "🎓",
    form: { scenario: "MBA Interview", goal: "Answer 'Why do you want an MBA and why now?' Connect my professional experience, career goals, and what the MBA will unlock for me.", audience: "MBA Admissions Panel", tone: "Professional", duration: "2min", style: "" },
  },
  {
    label: "Wedding Toast",
    icon: "🥂",
    form: { scenario: "Wedding Speech", goal: "Give a heartfelt and funny best man / maid of honor wedding toast. Share a story about the couple, express love, and raise a toast.", audience: "Wedding Guests", tone: "Warm & Humorous", duration: "2min", style: "" },
  },
  {
    label: "Product Demo Opener",
    icon: "🖥️",
    form: { scenario: "Product Demo", goal: "Open a live product demo. Hook the audience with the core problem, show empathy, and transition smoothly into the live demonstration.", audience: "Potential Clients", tone: "Conversational", duration: "1min", style: "" },
  },
  {
    label: "Crisis Communication",
    icon: "🚨",
    form: { scenario: "Crisis Communication", goal: "Address a service outage or product issue to customers. Acknowledge the problem, take ownership, explain what happened, and outline the fix.", audience: "Customers", tone: "Empathetic", duration: "2min", style: "" },
  },
  {
    label: "Scholarship Interview",
    icon: "🏅",
    form: { scenario: "Scholarship Interview", goal: "Introduce myself and explain why I deserve this scholarship. Cover academic achievements, community involvement, and future goals.", audience: "Scholarship Panel", tone: "Confident", duration: "2min", style: "" },
  },
  {
    label: "Team Motivational Briefing",
    icon: "💪",
    form: { scenario: "Team Briefing", goal: "Motivate the team at the start of a challenging project. Acknowledge the difficulty ahead, remind them of past wins, and build excitement for what's coming.", audience: "Team Members", tone: "Inspirational", duration: "2min", style: "" },
  },
  {
    label: "Negotiation Opening",
    icon: "🤝",
    form: { scenario: "Negotiation Opening", goal: "Open a high-stakes contract negotiation. Set a collaborative tone, state our position confidently, and invite a productive dialogue.", audience: "Business Partner", tone: "Professional", duration: "1min", style: "" },
  },
  {
    label: "TED-style Talk Intro",
    icon: "💬",
    form: { scenario: "TED-style Talk", goal: "Open a TED-style talk with a personal story that reveals a surprising truth about human behaviour. Hook the audience in the first 30 seconds.", audience: "General Public", tone: "Inspirational", duration: "3min", style: "Simon Sinek — Start With Why framework, conceptual, repeating core ideas, simple powerful language" },
  },
  {
    label: "Performance Self-Review",
    icon: "📋",
    form: { scenario: "Performance Review (Self)", goal: "Deliver a confident self-appraisal covering my top three achievements this year, one area I am actively improving, and my goals for next year.", audience: "Line Manager", tone: "Professional", duration: "2min", style: "" },
  },
  {
    label: "Cold Call Introduction",
    icon: "📞",
    form: { scenario: "Cold Call Introduction", goal: "Deliver a 30-second cold call opener that earns a conversation. State who I am, the specific reason for calling, and end with a permission question.", audience: "Prospect", tone: "Conversational", duration: "30s", style: "" },
  },
  {
    label: "Fundraising Appeal",
    icon: "❤️",
    form: { scenario: "Fundraising Appeal", goal: "Make an emotional fundraising appeal for a children's education charity. Tell a beneficiary story, share the impact of donations, and issue a clear call to action.", audience: "Donors", tone: "Empathetic", duration: "3min", style: "" },
  },
];

// ─── Famous Speaking Styles ─────────────────────────────────────
const STYLES = [
  { label: "No specific style", value: "" },
  { label: "Steve Jobs", value: "Steve Jobs — simple, storytelling, dramatic pauses, 'one more thing' suspense, minimalist language", emoji: "🍎" },
  { label: "Barack Obama", value: "Barack Obama — measured cadence, inclusive 'we' language, inspirational, hopeful, oratorical rhythm", emoji: "🇺🇸" },
  { label: "Simon Sinek", value: "Simon Sinek — Start With Why framework, conceptual, repeating core ideas, simple powerful language", emoji: "💡" },
  { label: "Brené Brown", value: "Brené Brown — vulnerable, story-driven, academic research woven with personal anecdotes, warm and authentic", emoji: "❤️" },
  { label: "Elon Musk", value: "Elon Musk — direct, data-driven, bold vision, matter-of-fact delivery, future-focused, blunt honesty", emoji: "🚀" },
  { label: "Oprah Winfrey", value: "Oprah Winfrey — warm, empowering, emotional connection, personal stories, uplifting and energizing", emoji: "✨" },
  { label: "Winston Churchill", value: "Winston Churchill — powerful rhetorical questions, tricolon (rule of three), dramatic pauses, historic gravitas", emoji: "🎖️" },
  { label: "Martin Luther King Jr.", value: "Martin Luther King Jr. — repetition (anaphora), vivid imagery, moral urgency, rhythmic and poetic cadence", emoji: "🕊️" },
  { label: "Tony Robbins", value: "Tony Robbins — high energy, pattern interrupts, direct commands, empowering questions, bold certainty", emoji: "🔥" },
  { label: "Sheryl Sandberg", value: "Sheryl Sandberg — data-backed, authentic personal stories, leadership-focused, empowering professional tone", emoji: "👩‍💼" },
  { label: "Richard Feynman", value: "Richard Feynman — explain complex ideas simply, curious and playful, analogies, step-by-step reasoning", emoji: "🔬" },
  { label: "Malala Yousafzai", value: "Malala Yousafzai — calm moral courage, personal narrative, universal values, simple direct language, quiet yet powerful conviction", emoji: "📖" },
  { label: "Jordan Peterson", value: "Jordan Peterson — precise vocabulary, archetypal references, structured arguments, building complexity step-by-step, serious intellectual tone", emoji: "🦞" },
  { label: "Gary Vaynerchuk", value: "Gary Vaynerchuk — raw and direct, high energy, street-smart authenticity, no-fluff hustle mindset, casual but urgent", emoji: "⚡" },
  { label: "Satya Nadella", value: "Satya Nadella — empathetic leadership, growth mindset language, cultural transformation, humble and visionary, strategic clarity", emoji: "🌐" },
  { label: "Nelson Mandela", value: "Nelson Mandela — dignified and measured, moral authority, reconciliation and unity, long-view perspective, quiet gravitas", emoji: "✊" },
  { label: "Amy Cuddy", value: "Amy Cuddy — research-backed storytelling, personal vulnerability, accessible science, empowering and practical, relatable examples", emoji: "🧠" },
  { label: "Seth Godin", value: "Seth Godin — short punchy sentences, counterintuitive insight, marketing philosophy, memorable metaphors, challenges assumptions", emoji: "🟣" },
  { label: "Chimamanda Ngozi Adichie", value: "Chimamanda Ngozi Adichie — rich storytelling, literary precision, cultural depth, warm wit, challenges single narratives with nuance", emoji: "🌍" },
  { label: "Jocko Willink", value: "Jocko Willink — extreme ownership, military directness, no excuses, short declarative sentences, disciplined and commanding tone", emoji: "🪖" },
  { label: "Yuval Noah Harari", value: "Yuval Noah Harari — sweeping historical perspective, clear analytical prose, thought-provoking questions, connects big ideas across disciplines", emoji: "📚" },
];

const AUDIENCES = [
  "Colleagues", "Senior Management", "Board of Directors", "Clients", "Investors",
  "Interview Panel", "MBA Admissions Panel", "IELTS Examiner", "TOEFL Examiner",
  "General Public", "Tech Professionals", "Students", "Media / Press", "Wedding Guests",
];

const TONES = [
  "Professional", "Conversational", "Formal", "Persuasive", "Inspirational",
  "Warm & Humorous", "Confident", "Academic", "Executive", "Empathetic",
];

const DURATIONS = ["30s", "1min", "2min", "3min", "5min", "10min"];

const OPTIMIZE_OPTIONS = [
  { label: "More Professional", instruction: "Make this script more professional and executive-level" },
  { label: "Simplify", instruction: "Simplify the language so it's easier to understand and more conversational" },
  { label: "More Persuasive", instruction: "Make this script more persuasive and compelling" },
  { label: "Add Storytelling", instruction: "Add a brief personal story or analogy to make this more engaging" },
  { label: "Add Q&A Section", instruction: "Add 3 likely questions the audience might ask, with strong answers" },
  { label: "Stronger Opening", instruction: "Rewrite the opening to be more powerful and attention-grabbing" },
  { label: "Stronger Closing", instruction: "Rewrite the closing to be more memorable and impactful" },
  { label: "Make Shorter", instruction: "Make this script shorter and more concise without losing the key messages" },
  { label: "Make Longer", instruction: "Expand this script with more detail, examples, and supporting points" },
  { label: "Add Transitions", instruction: "Add smooth transitional phrases between sections" },
  { label: "More Confident Tone", instruction: "Rewrite with a more confident, assertive tone" },
  { label: "Bullet Points", instruction: "Convert this to speaker notes in bullet point format" },
];

interface FormState {
  scenario: string;
  goal: string;
  audience: string;
  tone: string;
  duration: string;
  style: string;
}

export default function ScriptWriterPage() {
  const router = useRouter();
  const [generated, setGenerated] = useState(false);
  const [script, setScript] = useState("");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showPresets, setShowPresets] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  const [form, setForm] = useState<FormState>({
    scenario: "Business Meeting Update",
    goal: "",
    audience: "Colleagues",
    tone: "Professional",
    duration: "2min",
    style: "",
  });

  function applyPreset(preset: typeof PRESETS[0]) {
    setForm(preset.form);
    setShowPresets(false);
  }

  function handleShuffle() {
    const p = PRESETS[Math.floor(Math.random() * PRESETS.length)];
    setForm(p.form);
    setGenerated(false);
    setSaved(false);
  }

  async function handleGenerate() {
    setLoading(true);
    setError("");
    setGenerated(false);
    setSaved(false);
    try {
      const res = await fetch("/api/scripts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setScript(data.script);
      setWordCount(data.script.split(/\s+/).filter(Boolean).length);
      setGenerated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate script.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOptimize(opt: typeof OPTIMIZE_OPTIONS[0]) {
    setOptimizing(opt.label);
    try {
      const res = await fetch("/api/scripts/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script, instruction: opt.instruction }),
      });
      const data = await res.json();
      if (data.script) {
        setScript(data.script);
        setWordCount(data.script.split(/\s+/).filter(Boolean).length);
        setSaved(false);
      }
    } catch {
      // silent fail on optimize
    } finally {
      setOptimizing(null);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(script).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSendToPractice() {
    localStorage.setItem("spokiva_active_script", JSON.stringify({
      content: script,
      scenario: form.scenario,
      wordCount,
    }));
    router.push("/dashboard/practice");
  }

  async function handleSave() {
    if (!script.trim()) return;
    setSaved(false);
    try {
      const res = await fetch("/api/scripts/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.goal?.slice(0, 60) || form.scenario,
          scenario: form.scenario,
          content: script,
          wordCount,
          duration: form.duration,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Save failed");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save script");
    }
  }

  const estimatedDuration = Math.round(wordCount / 130);

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">AI Script Writer</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Generate a polished speaking script powered by GPT-4o.</p>
      </div>

      {/* Presets */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg overflow-hidden">
        <div className="w-full flex items-center justify-between px-5 py-3 hover:bg-[var(--bg-hover)] transition-colors">
          <button
            onClick={() => setShowPresets(!showPresets)}
            className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)] flex-1 text-left"
          >
            <Zap size={15} className="text-[#F5A623]" />
            Quick Presets — start from a template
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handleShuffle}
              title="Shuffle — fill the form with a random preset"
              className="flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
            >
              <Shuffle size={14} /> Shuffle
            </button>
            <button onClick={() => setShowPresets(!showPresets)} aria-label="Toggle presets">
              {showPresets ? <ChevronUp size={16} className="text-[var(--text-secondary)]" /> : <ChevronDown size={16} className="text-[var(--text-secondary)]" />}
            </button>
          </div>
        </div>
        {showPresets && (
          <div className="px-5 pb-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 border-t border-[var(--border)] pt-4">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => applyPreset(p)}
                className="flex flex-col items-start gap-1 p-3 border border-[var(--border)] rounded-lg hover:border-[var(--accent)] hover:bg-[var(--accent-bg)] transition-all text-left"
              >
                <span className="text-lg">{p.icon}</span>
                <span className="text-xs font-semibold text-[var(--text-primary)] leading-tight">{p.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Form */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6 space-y-4">
          <h2 className="font-bold text-[var(--text-primary)]">Configure your script</h2>

          {/* Scenario */}
          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">Scenario <span className="text-[var(--text-secondary)] font-normal">({SCENARIOS.length} options)</span></label>
            <select
              value={form.scenario}
              onChange={(e) => setForm({ ...form, scenario: e.target.value })}
              className="w-full px-3 py-2.5 border border-[var(--border)] rounded text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] bg-[var(--bg-card)]"
            >
              {SCENARIOS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>

          {/* Goal */}
          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">Speaking goal <span className="text-[var(--text-secondary)] font-normal">(optional — describe what you want to say)</span></label>
            <textarea
              value={form.goal}
              onChange={(e) => setForm({ ...form, goal: e.target.value })}
              placeholder="e.g. Give a Q3 project status update covering progress, blockers, and next steps for my engineering team."
              rows={3}
              className="w-full px-3 py-2.5 border border-[var(--border)] rounded text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] resize-none"
            />
          </div>

          {/* Audience & Tone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">Audience</label>
              <select
                value={form.audience}
                onChange={(e) => setForm({ ...form, audience: e.target.value })}
                className="w-full px-3 py-2.5 border border-[var(--border)] rounded text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] bg-[var(--bg-card)]"
              >
                {AUDIENCES.map((a) => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">Tone</label>
              <select
                value={form.tone}
                onChange={(e) => setForm({ ...form, tone: e.target.value })}
                className="w-full px-3 py-2.5 border border-[var(--border)] rounded text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] bg-[var(--bg-card)]"
              >
                {TONES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">Duration</label>
            <div className="flex gap-2 flex-wrap">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setForm({ ...form, duration: d })}
                  className={`px-3 py-1.5 rounded text-xs font-semibold border transition-colors ${
                    form.duration === d
                      ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                      : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Speaking Style */}
          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
              <Sparkles size={13} className="inline mr-1 text-[#F5A623]" />
              Speaking style
            </label>
            <select
              value={form.style}
              onChange={(e) => setForm({ ...form, style: e.target.value })}
              className="w-full px-3 py-2.5 border border-[var(--border)] rounded text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] bg-[var(--bg-card)]"
            >
              {STYLES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.emoji ? `${s.emoji} ${s.label}` : s.label}
                </option>
              ))}
            </select>
            {form.style && (
              <p className="text-xs text-[var(--accent)] mt-1 font-medium">
                AI will write in the style of {STYLES.find(s => s.value === form.style)?.label}
              </p>
            )}
          </div>

          {error && (
            <div className="bg-[var(--danger-bg)] border border-[var(--danger-border)] rounded-lg p-3">
              <p className="text-xs text-[#E53935] font-medium">{error}</p>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-60 text-white font-semibold py-3 rounded transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <Wand2 size={16} />
            {loading ? "Generating with GPT-4o..." : "Generate Script"}
          </button>
        </div>

        {/* Right: Output */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-[var(--text-primary)]">Generated Script</h2>
              {generated && (
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {wordCount} words · ~{estimatedDuration} min read
                </p>
              )}
            </div>
            {generated && (
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-xs border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] px-2.5 py-1.5 rounded transition-colors"
                >
                  <Copy size={12} />
                  {copied ? "Copied!" : "Copy"}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saved}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded transition-colors font-semibold ${
                    saved
                      ? "bg-[var(--success-bg)] text-[#00B37D] border border-[#00B37D]"
                      : "bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white"
                  }`}
                >
                  {saved ? <CheckCircle size={12} /> : <Save size={12} />}
                  {saved ? "Saved!" : "Save Script"}
                </button>
                <button
                  onClick={handleSendToPractice}
                  className="flex items-center gap-1 text-xs bg-[#00B37D] hover:bg-[#009066] text-white px-2.5 py-1.5 rounded transition-colors font-semibold"
                >
                  <Mic size={12} />
                  Practice This
                </button>
                <button
                  onClick={() => { setScript(""); setGenerated(false); setSaved(false); }}
                  className="flex items-center gap-1 text-xs border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] px-2.5 py-1.5 rounded transition-colors"
                >
                  <RotateCcw size={12} />
                  Reset
                </button>
              </div>
            )}
          </div>

          {!generated ? (
            <div className="flex-1 flex items-center justify-center text-center py-16 border-2 border-dashed border-[var(--border)] rounded-lg">
              <div>
                <Wand2 size={40} className="text-[var(--text-muted)] mx-auto mb-3" />
                <p className="text-sm text-[var(--text-secondary)] max-w-xs">
                  {loading
                    ? "GPT-4o is writing your script..."
                    : "Configure your script settings and click Generate Script."}
                </p>
                {loading && (
                  <div className="flex justify-center gap-1 mt-4">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-2 h-2 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 bg-[var(--bg-secondary)] rounded-lg p-4 mb-4 overflow-y-auto max-h-96">
                <pre className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap font-sans">{script}</pre>
              </div>

              {/* Optimize Buttons */}
              <div>
                <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Optimize with AI</p>
                <div className="flex flex-wrap gap-2">
                  {OPTIMIZE_OPTIONS.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => handleOptimize(opt)}
                      disabled={!!optimizing}
                      className={`text-xs border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent-bg)] px-3 py-1.5 rounded transition-colors font-medium disabled:opacity-50 ${
                        optimizing === opt.label ? "bg-[var(--accent-bg)]" : ""
                      }`}
                    >
                      {optimizing === opt.label ? "..." : opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
