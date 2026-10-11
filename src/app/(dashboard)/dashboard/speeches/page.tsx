"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { SPEECHES, Speech } from "@/data/speeches";
import {
  Landmark, Search, ArrowLeft, ExternalLink, Mic2, Copy, CheckCircle,
  Lightbulb, Quote, Lock, Calendar, MapPin, Layers,
} from "lucide-react";

// ── Grouping helpers (derived, so no per-entry data edits needed) ──
const ERA_ORDER = [
  "19th Century",
  "Early 20th Century (1900–1945)",
  "Post-War & Civil Rights (1946–1979)",
  "Modern Era (1980–2009)",
  "Contemporary (2010–Present)",
];

function eraOf(date: string): string {
  const m = date.match(/(\d{4})/g);
  const year = m ? parseInt(m[m.length - 1], 10) : 2000;
  if (year < 1900) return ERA_ORDER[0];
  if (year <= 1945) return ERA_ORDER[1];
  if (year <= 1979) return ERA_ORDER[2];
  if (year <= 2009) return ERA_ORDER[3];
  return ERA_ORDER[4];
}

const THEME_ORDER = [
  "Justice & Human Rights",
  "Freedom & Democracy",
  "War & Crisis",
  "Independence & Nation-Building",
  "Grief & Reconciliation",
  "Vision & Inspiration",
  "Life, Legacy & Wisdom",
];

// speech number → theme
const THEME_BY_NUM: Record<number, string> = {
  1: "Vision & Inspiration", 2: "Justice & Human Rights", 3: "Justice & Human Rights",
  4: "Justice & Human Rights", 5: "Freedom & Democracy", 6: "Grief & Reconciliation",
  7: "Freedom & Democracy", 8: "Vision & Inspiration", 9: "War & Crisis", 10: "War & Crisis",
  11: "War & Crisis", 12: "War & Crisis", 13: "Freedom & Democracy", 14: "Justice & Human Rights",
  15: "Grief & Reconciliation", 16: "Independence & Nation-Building", 17: "Independence & Nation-Building",
  18: "Justice & Human Rights", 19: "Justice & Human Rights", 20: "Justice & Human Rights",
  21: "Justice & Human Rights", 22: "Justice & Human Rights", 23: "Freedom & Democracy",
  24: "Grief & Reconciliation", 25: "Grief & Reconciliation", 26: "Freedom & Democracy",
  27: "Freedom & Democracy", 28: "War & Crisis", 29: "Vision & Inspiration", 30: "Life, Legacy & Wisdom",
  31: "Life, Legacy & Wisdom", 32: "Justice & Human Rights", 33: "Life, Legacy & Wisdom",
  34: "Life, Legacy & Wisdom", 35: "Life, Legacy & Wisdom", 36: "Justice & Human Rights",
  37: "Justice & Human Rights", 38: "Justice & Human Rights", 39: "Justice & Human Rights",
  40: "Justice & Human Rights", 41: "Life, Legacy & Wisdom", 42: "Justice & Human Rights",
  43: "Grief & Reconciliation",
};

const THEME_EMOJI: Record<string, string> = {
  "Justice & Human Rights": "⚖️",
  "Freedom & Democracy": "🗽",
  "War & Crisis": "🛡️",
  "Independence & Nation-Building": "🏛️",
  "Grief & Reconciliation": "🕊️",
  "Vision & Inspiration": "✨",
  "Life, Legacy & Wisdom": "📖",
};

type GroupBy = "none" | "era" | "theme";

export default function SpeechesPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Speech | null>(null);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);
  const [groupBy, setGroupBy] = useState<GroupBy>("none");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return SPEECHES;
    return SPEECHES.filter((s) =>
      s.speaker.toLowerCase().includes(q) ||
      s.title.toLowerCase().includes(q) ||
      s.topic.toLowerCase().includes(q)
    );
  }, [search]);

  function practice(s: Speech) {
    if (!s.fullText) return;
    sessionStorage.setItem("sf_practice_script", s.fullText);
    sessionStorage.setItem("sf_practice_scenario", `${s.speaker} — ${s.title}`);
    router.push("/dashboard/practice");
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // ── Detail view ──
  if (selected) {
    const s = selected;
    return (
      <div className="max-w-3xl mx-auto space-y-5">
        <button onClick={() => setSelected(null)} className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
          <ArrowLeft size={15} /> All speeches
        </button>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--accent-bg)", color: "var(--accent)" }}>#{s.num}</span>
            {s.publicDomain
              ? <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--success-bg)", color: "var(--success-text)" }}>Public domain</span>
              : <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: "var(--warning-bg)", color: "var(--warning-text)" }}><Lock size={9} /> In copyright</span>}
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{s.title}</h1>
          <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--accent)" }}>{s.speaker}</p>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs" style={{ color: "var(--text-secondary)" }}>
            <span className="flex items-center gap-1"><Calendar size={12} /> {s.date}</span>
            <span className="flex items-center gap-1"><MapPin size={12} /> {s.place}</span>
            <span>{s.topic}</span>
          </div>
        </div>

        {/* Why it stands out */}
        <div className="rounded-xl p-5" style={{ background: "var(--accent-bg)", border: "1px solid var(--accent)" }}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--accent)" }}>Why it stands out</p>
          <p className="text-sm" style={{ color: "var(--text-primary)" }}>{s.whyItStands}</p>
        </div>

        {/* What to learn */}
        <div className="rounded-xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h2 className="font-bold mb-3 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Lightbulb size={16} style={{ color: "#F5A623" }} /> What you can learn from it
          </h2>
          <ul className="space-y-2">
            {s.learn.map((l, i) => (
              <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--accent)" }} /> {l}
              </li>
            ))}
          </ul>
        </div>

        {/* Iconic line */}
        {s.excerpt && (
          <div className="rounded-xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="flex items-start gap-3">
              <Quote size={18} className="shrink-0 mt-0.5" style={{ color: "var(--accent)" }} />
              <p className="text-base italic leading-relaxed" style={{ color: "var(--text-primary)" }}>{s.excerpt}</p>
            </div>
          </div>
        )}

        {/* Full text (public domain only) */}
        {s.fullText ? (
          <div className="rounded-xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
              <h2 className="font-bold" style={{ color: "var(--text-primary)" }}>Full transcript</h2>
              <div className="flex gap-2">
                <button onClick={() => copyText(s.fullText!)}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded border transition-colors"
                  style={{ color: "var(--text-secondary)", borderColor: "var(--border)" }}>
                  {copied ? <CheckCircle size={13} style={{ color: "#00B37D" }} /> : <Copy size={13} />} {copied ? "Copied" : "Copy"}
                </button>
                <button onClick={() => practice(s)}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded text-white transition-colors"
                  style={{ background: "var(--accent)" }}>
                  <Mic2 size={13} /> Practice this
                </button>
              </div>
            </div>
            <p className="text-sm leading-loose whitespace-pre-wrap" style={{ color: "var(--text-primary)" }}>{s.fullText}</p>
          </div>
        ) : (
          <div className="rounded-xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
              This speech is still under copyright, so the full transcript isn&apos;t reproduced here. Read the official transcript at the source below, then use the takeaways above to shape your own practice.
            </p>
          </div>
        )}

        {/* Source */}
        <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: "var(--accent)" }}>
          <ExternalLink size={14} /> Read the full transcript — {s.sourceLabel}
        </a>
      </div>
    );
  }

  // ── List view ──
  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
          <Landmark size={24} style={{ color: "var(--accent)" }} /> Outstanding Speeches
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Study the greatest speeches ever delivered — structure, rhythm, and rhetoric. Public-domain speeches include the full transcript you can practice directly.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-secondary)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search speaker, title, or topic…"
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}><Layers size={14} /> Group by</span>
          <div className="flex items-center gap-1 border rounded-lg overflow-hidden text-xs font-semibold" style={{ borderColor: "var(--border)" }}>
            {([["none", "None"], ["era", "Era"], ["theme", "Theme"]] as [GroupBy, string][]).map(([val, label]) => (
              <button key={val} onClick={() => setGroupBy(val)}
                className="px-3 py-1.5 transition-colors"
                style={groupBy === val
                  ? { background: "var(--accent)", color: "#fff" }
                  : { background: "var(--bg-card)", color: "var(--text-secondary)" }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {groupBy === "none" ? (
        <div className="space-y-3">
          {filtered.map((s) => renderCard(s))}
        </div>
      ) : (
        (() => {
          const order = groupBy === "era" ? ERA_ORDER : THEME_ORDER;
          const keyOf = (s: Speech) => (groupBy === "era" ? eraOf(s.date) : THEME_BY_NUM[s.num] ?? "Other");
          const groups = order
            .map((g) => ({ label: g, items: filtered.filter((s) => keyOf(s) === g) }))
            .filter((g) => g.items.length > 0);
          if (groups.length === 0) {
            return <p className="text-sm text-center py-10" style={{ color: "var(--text-secondary)" }}>No speeches match your search.</p>;
          }
          return (
            <div className="space-y-6">
              {groups.map((g) => (
                <div key={g.label}>
                  <div className="flex items-center gap-2 mb-2.5">
                    {groupBy === "theme" && <span className="text-lg">{THEME_EMOJI[g.label]}</span>}
                    <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: "var(--text-primary)" }}>{g.label}</h2>
                    <span className="text-[11px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--accent-bg)", color: "var(--accent)" }}>{g.items.length}</span>
                  </div>
                  <div className="space-y-3">
                    {g.items.map((s) => renderCard(s))}
                  </div>
                </div>
              ))}
            </div>
          );
        })()
      )}
    </div>
  );

  function renderCard(s: Speech) {
    return (
      <button key={s.num} onClick={() => setSelected(s)}
        className="w-full text-left rounded-xl p-4 transition-all hover:shadow-md"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}>
        <div className="flex items-start gap-3">
          <span className="text-xs font-bold px-2 py-1 rounded-lg shrink-0" style={{ background: "var(--accent-bg)", color: "var(--accent)" }}>#{s.num}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bold" style={{ color: "var(--text-primary)" }}>{s.title}</h2>
              {s.publicDomain
                ? <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "var(--success-bg)", color: "var(--success-text)" }}>Full text</span>
                : <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-0.5" style={{ background: "var(--warning-bg)", color: "var(--warning-text)" }}><Lock size={8} /> Link</span>}
            </div>
            <p className="text-sm font-semibold" style={{ color: "var(--accent)" }}>{s.speaker}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{s.date} · {s.place} · {s.topic}</p>
            <p className="text-xs mt-1.5" style={{ color: "var(--text-secondary)" }}>{s.whyItStands}</p>
          </div>
        </div>
      </button>
    );
  }
}
