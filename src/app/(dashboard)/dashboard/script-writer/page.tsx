"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Wand2, Shuffle, Sparkles, ArrowLeft, ArrowRight, Check, Loader2, SlidersHorizontal, ListChecks, Lightbulb } from "lucide-react";
import ScriptsTabs from "@/components/scripts/ScriptsTabs";
import ScriptResult, { useScriptHistory, stripMarks } from "@/components/scripts/ScriptResult";
import {
  OCCASION_GROUPS, ALL_AUDIENCES, TONES, DURATIONS, STYLES, PRESETS,
  groupForScenario, type Preset,
} from "@/lib/scriptOptions";

interface FormState {
  scenario: string;
  goal: string;
  audience: string;
  tone: string;
  duration: string;
  style: string;
}
interface GuideQuestion { question: string; example: string }
type Mode = "guided" | "advanced";

const DRAFT_KEY = "spokiva_writer_draft";
const MODE_KEY = "spokiva_writer_mode";
const EMPTY_FORM: FormState = { scenario: "", goal: "", audience: "", tone: "Professional", duration: "2min", style: "" };
const STEPS = ["Occasion", "Listeners", "Your details", "Length"];

// ─── Small UI helpers ──────────────────────────────────────────────────────────
function Chip({ selected, onClick, children, title }: { selected: boolean; onClick: () => void; children: React.ReactNode; title?: string }) {
  return (
    <button type="button" onClick={onClick} title={title} aria-pressed={selected}
      className="px-3 py-2 rounded-lg text-sm border transition-colors text-left"
      style={selected
        ? { background: "var(--accent-bg)", borderColor: "var(--accent)", color: "var(--accent)", fontWeight: 600 }
        : { borderColor: "var(--border)", color: "var(--text-primary)" }}>
      {children}
    </button>
  );
}

function StepHeading({ title, help }: { title: string; help: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{title}</h2>
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{help}</p>
    </div>
  );
}

const field = "w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]";
const fieldStyle = { borderColor: "var(--border)", background: "var(--bg-card)", color: "var(--text-primary)" };

export default function ScriptWriterPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("guided");
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [customAudience, setCustomAudience] = useState(false);

  const [questions, setQuestions] = useState<GuideQuestion[] | null>(null);
  const [questionsFor, setQuestionsFor] = useState("");
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [answers, setAnswers] = useState<string[]>(["", "", ""]);
  const [extra, setExtra] = useState("");

  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savedTitle, setSavedTitle] = useState("");
  const history = useScriptHistory("");
  const loaded = useRef(false);
  const resultRef = useRef<HTMLDivElement>(null);

  // ── Restore: a script sent from "My scripts" → Edit wins over the saved draft ──
  useEffect(() => {
    try {
      const m = localStorage.getItem(MODE_KEY);
      if (m === "guided" || m === "advanced") setMode(m);
      const edit = localStorage.getItem("spokiva_edit_script");
      if (edit) {
        localStorage.removeItem("spokiva_edit_script");
        const s = JSON.parse(edit);
        if (s?.content) {
          history.reset(String(s.content));
          setForm((f) => ({ ...f, scenario: s.scenario || f.scenario, duration: s.duration || f.duration }));
          setSavedTitle(String(s.title ?? ""));
          setGenerated(true);
          loaded.current = true;
          return;
        }
      }
      const d = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null");
      if (d) {
        if (d.form) setForm({ ...EMPTY_FORM, ...d.form });
        if (typeof d.step === "number") setStep(Math.min(3, Math.max(0, d.step)));
        if (d.groupId) setGroupId(d.groupId);
        if (Array.isArray(d.questions)) { setQuestions(d.questions); setQuestionsFor(d.questionsFor ?? ""); }
        if (Array.isArray(d.answers)) setAnswers(d.answers);
        if (typeof d.extra === "string") setExtra(d.extra);
        if (d.script) { history.reset(d.script); setGenerated(true); }
        if (d.savedTitle) setSavedTitle(d.savedTitle);
      }
    } catch {}
    loaded.current = true;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Autosave the draft ──
  useEffect(() => {
    if (!loaded.current) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          form, step, groupId, questions, questionsFor, answers, extra, savedTitle,
          script: generated ? history.value : "",
        }));
      } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [form, step, groupId, questions, questionsFor, answers, extra, generated, history.value, savedTitle]);

  useEffect(() => { try { localStorage.setItem(MODE_KEY, mode); } catch {} }, [mode]);

  const group = OCCASION_GROUPS.find((g) => g.id === groupId) ?? groupForScenario(form.scenario);
  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  // ── Wizard step 3: fetch tailored questions ──
  async function loadQuestions() {
    const key = `${form.scenario}|${form.audience}`;
    if (questions && questionsFor === key) return;
    setLoadingQuestions(true);
    try {
      const res = await fetch("/api/scripts/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: form.scenario, audience: form.audience }),
      });
      const data = await res.json();
      setQuestions(data.questions);
      setQuestionsFor(key);
      setAnswers(["", "", ""]);
    } catch {
      setQuestions([
        { question: "What is the main thing you want your listeners to remember?", example: "" },
        { question: "What facts, names or numbers should be included?", example: "" },
        { question: "What do you want people to do or feel at the end?", example: "" },
      ]);
      setQuestionsFor(key);
    } finally {
      setLoadingQuestions(false);
    }
  }

  function guidedGoal(): string {
    const qa = (questions ?? [])
      .map((q, i) => (answers[i]?.trim() ? `${q.question}\n→ ${answers[i].trim()}` : ""))
      .filter(Boolean);
    if (extra.trim()) qa.push(`Anything else:\n→ ${extra.trim()}`);
    return qa.join("\n\n");
  }

  const hasDetails = answers.some((a) => a.trim()) || extra.trim().length > 0;
  const canNext = [!!form.scenario, !!form.audience.trim(), true, !!form.duration][step];

  function next() {
    if (!canNext) return;
    if (step === 1) loadQuestions();
    if (step < 3) setStep(step + 1);
    else generate();
  }

  async function generate() {
    setLoading(true);
    setError("");
    const payload = mode === "guided" ? { ...form, goal: guidedGoal() } : form;
    try {
      const res = await fetch("/api/scripts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error || !data.script) throw new Error(data.error ?? "The AI couldn't write the script.");
      history.reset(String(data.script).trim());
      setSavedTitle("");
      setGenerated(true);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (err) {
      setError(`${err instanceof Error ? err.message : "Something went wrong."} Please try again.`);
    } finally {
      setLoading(false);
    }
  }

  function applyPreset(p: Preset) {
    setForm(p.form);
    setGroupId(groupForScenario(p.form.scenario)?.id ?? null);
    setCustomAudience(!ALL_AUDIENCES.includes(p.form.audience));
    setMode("advanced");
  }

  function startOver() {
    history.reset("");
    setGenerated(false);
    setSavedTitle("");
    setStep(0);
    setForm(EMPTY_FORM);
    setGroupId(null);
    setQuestions(null);
    setAnswers(["", "", ""]);
    setExtra("");
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const wordsOf = (t: string) => stripMarks(t).split(/\s+/).filter(Boolean).length;

  async function save() {
    const content = history.value;
    const title = savedTitle
      || (mode === "guided" ? answers.find((a) => a.trim())?.slice(0, 60) : form.goal?.slice(0, 60))
      || form.scenario || "My script";
    const res = await fetch("/api/scripts/saved", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, scenario: form.scenario || "Custom", content, wordCount: wordsOf(content), duration: form.duration }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Couldn't save the script. Please try again.");
    }
    setSavedTitle(title);
  }

  function practise() {
    const content = history.value;
    localStorage.setItem("spokiva_active_script", JSON.stringify({ content, scenario: form.scenario || "Custom", wordCount: wordsOf(content) }));
    router.push("/dashboard/practice");
  }

  const targetWords = DURATIONS.find((d) => d.value === form.duration)?.words;

  // ── Result view ──
  if (generated) {
    return (
      <div className="w-full max-w-4xl mx-auto" ref={resultRef}>
        <ScriptsTabs />
        <div className="mb-5">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{savedTitle || "Your script is ready"}</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            {form.scenario && <>{form.scenario}{form.audience && <> · for {form.audience}</>} · </>}
            Read it out loud once. If something doesn&apos;t sound like you, change it.
          </p>
        </div>
        <div className="rounded-xl p-5 sm:p-6 border" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          <ScriptResult history={history} targetWords={targetWords} onSave={save} onPractice={practise} onStartOver={startOver} />
        </div>
      </div>
    );
  }

  // ── Create view ──
  return (
    <div className="w-full max-w-4xl mx-auto">
      <ScriptsTabs />
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Write a script with AI</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            {mode === "guided" ? "Answer 4 quick steps. The AI writes a script you can practise." : "Set every option yourself, or start from an example."}
          </p>
        </div>
        <div className="inline-flex rounded-lg p-0.5" style={{ background: "var(--bg-secondary)" }} role="tablist" aria-label="Writing mode">
          {([
            { id: "guided", label: "Step by step", icon: ListChecks },
            { id: "advanced", label: "All options", icon: SlidersHorizontal },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button key={id} role="tab" aria-selected={mode === id} onClick={() => setMode(id)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md transition-colors"
              style={mode === id ? { background: "var(--bg-card)", color: "var(--text-primary)", boxShadow: "0 1px 2px rgba(0,0,0,.08)" } : { color: "var(--text-secondary)" }}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
      </div>

      {mode === "guided" ? (
        <div className="rounded-xl border" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
          {/* Progress */}
          <ol className="flex border-b" style={{ borderColor: "var(--border)" }}>
            {STEPS.map((label, i) => (
              <li key={label} className="flex-1">
                <button type="button" onClick={() => i < step && setStep(i)} disabled={i > step}
                  className="w-full flex items-center justify-center gap-1.5 py-3 text-xs font-semibold border-b-2 -mb-px"
                  style={{ borderColor: i === step ? "var(--accent)" : "transparent", color: i <= step ? "var(--text-primary)" : "var(--text-muted)" }}
                  aria-current={i === step ? "step" : undefined}>
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0"
                    style={i < step ? { background: "var(--accent)", color: "var(--on-accent, #fff)" } : i === step ? { border: "2px solid var(--accent)", color: "var(--accent)" } : { border: "1px solid var(--border)" }}>
                    {i < step ? <Check size={11} /> : i + 1}
                  </span>
                  <span className="hidden sm:inline">{label}</span>
                </button>
              </li>
            ))}
          </ol>

          <div className="p-5 sm:p-6 min-h-[22rem]">
            {step === 0 && (
              <>
                <StepHeading title="What are you preparing for?" help="Pick the closest match. You can add your own details later." />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5">
                  {OCCASION_GROUPS.map((g) => (
                    <button key={g.id} type="button" onClick={() => { setGroupId(g.id); if (!g.scenarios.includes(form.scenario)) set({ scenario: "", audience: "" }); }}
                      aria-pressed={group?.id === g.id}
                      className="flex flex-col items-start gap-0.5 p-3 rounded-xl border text-left transition-colors"
                      style={group?.id === g.id ? { borderColor: "var(--accent)", background: "var(--accent-bg)" } : { borderColor: "var(--border)" }}>
                      <span className="text-xl">{g.emoji}</span>
                      <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{g.label}</span>
                      <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{g.hint}</span>
                    </button>
                  ))}
                </div>
                {group && (
                  <>
                    <p className="text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Which one exactly?</p>
                    <div className="flex flex-wrap gap-2">
                      {group.scenarios.map((s) => (
                        <Chip key={s} selected={form.scenario === s} onClick={() => set({ scenario: s, audience: group.audiences.includes(form.audience) ? form.audience : "" })}>{s}</Chip>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            {step === 1 && (
              <>
                <StepHeading title="Who will be listening?" help="The AI uses the right words and level of detail for them." />
                <div className="flex flex-wrap gap-2 mb-3">
                  {(group?.audiences ?? ALL_AUDIENCES).map((a) => (
                    <Chip key={a} selected={!customAudience && form.audience === a} onClick={() => { setCustomAudience(false); set({ audience: a }); }}>{a}</Chip>
                  ))}
                  <Chip selected={customAudience} onClick={() => { setCustomAudience(true); set({ audience: "" }); }}>Someone else…</Chip>
                </div>
                {customAudience && (
                  <input autoFocus value={form.audience} onChange={(e) => set({ audience: e.target.value })}
                    placeholder="e.g. My child's school parents" className={`${field} mb-4`} style={fieldStyle} />
                )}
                <p className="text-sm font-semibold mt-5 mb-2" style={{ color: "var(--text-primary)" }}>How do you want to sound?</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {TONES.slice(0, 8).map((t) => (
                    <Chip key={t.value} selected={form.tone === t.value} onClick={() => set({ tone: t.value })}>
                      <span className="block">{t.value}</span>
                      <span className="block text-[11px] font-normal" style={{ color: "var(--text-secondary)" }}>{t.hint}</span>
                    </Chip>
                  ))}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <StepHeading title="Tell us a little about your situation" help="Short answers are fine. The more real details you give, the more the script sounds like you." />
                {loadingQuestions || !questions ? (
                  <div className="flex items-center gap-2 text-sm py-10 justify-center" style={{ color: "var(--text-secondary)" }}>
                    <Loader2 size={16} className="animate-spin" /> Preparing a few questions for you…
                  </div>
                ) : (
                  <div className="space-y-4">
                    {questions.map((q, i) => (
                      <div key={i}>
                        <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }} htmlFor={`q${i}`}>{i + 1}. {q.question}</label>
                        <textarea id={`q${i}`} rows={2} value={answers[i] ?? ""} onChange={(e) => setAnswers((a) => a.map((v, j) => (j === i ? e.target.value : v)))}
                          placeholder={q.example ? `e.g. ${q.example}` : "Type your answer"} className={`${field} resize-none`} style={fieldStyle} />
                      </div>
                    ))}
                    <div>
                      <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }} htmlFor="extra">
                        Anything else? <span className="font-normal" style={{ color: "var(--text-secondary)" }}>(optional)</span>
                      </label>
                      <textarea id="extra" rows={2} value={extra} onChange={(e) => setExtra(e.target.value)}
                        placeholder="e.g. Keep it simple — English is my second language." className={`${field} resize-none`} style={fieldStyle} />
                    </div>
                    {!hasDetails && (
                      <p className="text-xs flex items-start gap-1.5 rounded-lg p-2.5" style={{ background: "var(--warning-bg)", color: "var(--warning-text)" }}>
                        <Lightbulb size={13} className="shrink-0 mt-0.5" /> You can skip this, but the script will be general rather than about you.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            {step === 3 && (
              <>
                <StepHeading title="How long should it be?" help="How long you'll speak for. You can make it shorter or longer afterwards." />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
                  {DURATIONS.map((d) => (
                    <Chip key={d.value} selected={form.duration === d.value} onClick={() => set({ duration: d.value })}>
                      <span className="block">{d.label}</span>
                      <span className="block text-[11px] font-normal" style={{ color: "var(--text-secondary)" }}>{d.hint}</span>
                    </Chip>
                  ))}
                </div>
                <details className="rounded-lg border p-3" style={{ borderColor: "var(--border)" }} open={!!form.style}>
                  <summary className="text-sm font-semibold cursor-pointer flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                    <Sparkles size={13} style={{ color: "#F5A623" }} /> Sound like a famous speaker? <span className="font-normal" style={{ color: "var(--text-secondary)" }}>(optional)</span>
                  </summary>
                  <select value={form.style} onChange={(e) => set({ style: e.target.value })} className={`${field} mt-3`} style={fieldStyle}>
                    {STYLES.map((s) => <option key={s.value} value={s.value}>{s.emoji ? `${s.emoji} ${s.label}` : s.label}</option>)}
                  </select>
                </details>

                <div className="mt-6 rounded-lg p-4 text-sm" style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}>
                  <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Summary</p>
                  {form.scenario} · for {form.audience} · {form.tone} · {DURATIONS.find((d) => d.value === form.duration)?.label}
                  {form.style && <> · in the style of {STYLES.find((s) => s.value === form.style)?.label}</>}
                  {hasDetails ? " · with your details" : " · no personal details"}
                </div>
              </>
            )}

            {error && <p className="mt-4 text-sm rounded-lg p-3" style={{ background: "var(--danger-bg)", color: "#E53935" }}>{error}</p>}
          </div>

          {/* Footer navigation */}
          <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-t" style={{ borderColor: "var(--border)" }}>
            <button type="button" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0 || loading}
              className="flex items-center gap-1 text-sm font-medium px-3 py-2 rounded-lg disabled:opacity-0" style={{ color: "var(--text-secondary)" }}>
              <ArrowLeft size={15} /> Back
            </button>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>Step {step + 1} of {STEPS.length}</span>
            <button type="button" onClick={next} disabled={!canNext || loading || (step === 2 && loadingQuestions)}
              className="flex items-center gap-1.5 text-sm font-semibold px-5 py-2.5 rounded-lg text-white disabled:opacity-50 transition-colors"
              style={{ background: "var(--accent)" }}>
              {step < 3 ? <>{step === 2 && !hasDetails ? "Skip" : "Next"} <ArrowRight size={15} /></>
                : loading ? <><Loader2 size={15} className="animate-spin" /> Writing your script…</>
                : <><Wand2 size={15} /> Write my script</>}
            </button>
          </div>
          {loading && <p className="text-xs text-center pb-4" style={{ color: "var(--text-secondary)" }}>This usually takes 10–30 seconds.</p>}
        </div>
      ) : (
        <AdvancedForm form={form} set={set} onPreset={applyPreset} onGenerate={generate} loading={loading} error={error} />
      )}
    </div>
  );
}

// ─── "All options" form (for confident users) ──────────────────────────────────
function AdvancedForm({ form, set, onPreset, onGenerate, loading, error }: {
  form: FormState;
  set: (p: Partial<FormState>) => void;
  onPreset: (p: Preset) => void;
  onGenerate: () => void;
  loading: boolean;
  error: string;
}) {
  const label = "block text-sm font-semibold mb-1.5";
  return (
    <div className="space-y-5">
      <div className="rounded-xl border p-4" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Start from an example</p>
          <button type="button" onClick={() => onPreset(PRESETS[Math.floor(Math.random() * PRESETS.length)])}
            className="flex items-center gap-1 text-xs font-semibold" style={{ color: "var(--accent)" }}>
            <Shuffle size={13} /> Surprise me
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {PRESETS.map((p) => (
            <button key={p.label} type="button" onClick={() => onPreset(p)}
              className="flex flex-col items-start gap-1 p-2.5 border rounded-lg hover:border-[var(--accent)] hover:bg-[var(--accent-bg)] transition-colors text-left"
              style={{ borderColor: "var(--border)" }}>
              <span className="text-base">{p.icon}</span>
              <span className="text-xs font-semibold leading-tight" style={{ color: "var(--text-primary)" }}>{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border p-5 sm:p-6 space-y-4" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
        <div>
          <label className={label} style={{ color: "var(--text-primary)" }}>Occasion</label>
          <select value={form.scenario} onChange={(e) => set({ scenario: e.target.value })} className={field} style={fieldStyle}>
            <option value="">Choose…</option>
            {OCCASION_GROUPS.map((g) => (
              <optgroup key={g.id} label={`${g.emoji} ${g.label}`}>
                {g.scenarios.map((s) => <option key={s} value={s}>{s}</option>)}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label className={label} style={{ color: "var(--text-primary)" }}>
            What do you want to say? <span className="font-normal" style={{ color: "var(--text-secondary)" }}>(recommended — the more detail, the better)</span>
          </label>
          <textarea value={form.goal} onChange={(e) => set({ goal: e.target.value })} rows={4}
            placeholder="e.g. Update my manager on the website project: 8 of 10 pages done, we're waiting for photos, launch is 14 March."
            className={`${field} resize-y`} style={fieldStyle} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={label} style={{ color: "var(--text-primary)" }}>Listeners</label>
            <input list="audiences" value={form.audience} onChange={(e) => set({ audience: e.target.value })}
              placeholder="Pick or type, e.g. Colleagues" className={field} style={fieldStyle} />
            <datalist id="audiences">{ALL_AUDIENCES.map((a) => <option key={a} value={a} />)}</datalist>
          </div>
          <div>
            <label className={label} style={{ color: "var(--text-primary)" }}>Tone</label>
            <select value={form.tone} onChange={(e) => set({ tone: e.target.value })} className={field} style={fieldStyle}>
              {TONES.map((t) => <option key={t.value} value={t.value}>{t.value} — {t.hint}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className={label} style={{ color: "var(--text-primary)" }}>Length</label>
          <div className="flex gap-2 flex-wrap">
            {DURATIONS.map((d) => (
              <button key={d.value} type="button" onClick={() => set({ duration: d.value })} title={d.hint}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors"
                style={form.duration === d.value ? { background: "var(--accent)", color: "var(--on-accent, #fff)", borderColor: "var(--accent)" } : { borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                {d.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={label} style={{ color: "var(--text-primary)" }}>
            <Sparkles size={13} className="inline mr-1" style={{ color: "#F5A623" }} />Sound like a famous speaker <span className="font-normal" style={{ color: "var(--text-secondary)" }}>(optional)</span>
          </label>
          <select value={form.style} onChange={(e) => set({ style: e.target.value })} className={field} style={fieldStyle}>
            {STYLES.map((s) => <option key={s.value} value={s.value}>{s.emoji ? `${s.emoji} ${s.label}` : s.label}</option>)}
          </select>
        </div>

        {error && <p className="text-sm rounded-lg p-3" style={{ background: "var(--danger-bg)", color: "#E53935" }}>{error}</p>}

        <button type="button" onClick={onGenerate} disabled={loading || !form.scenario}
          className="w-full text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          style={{ background: "var(--accent)" }}>
          {loading ? <><Loader2 size={16} className="animate-spin" /> Writing your script… (10–30 seconds)</> : <><Wand2 size={16} /> Write my script</>}
        </button>
        {!form.scenario && <p className="text-xs text-center -mt-2" style={{ color: "var(--text-muted)" }}>Choose an occasion first.</p>}
      </div>
    </div>
  );
}

