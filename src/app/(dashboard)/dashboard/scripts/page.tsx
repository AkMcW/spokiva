"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import ScriptsTabs, { SCRIPT_TABS } from "@/components/scripts/ScriptsTabs";

const DRAFT_KEY = "spokiva_writer_draft";

export default function ScriptsHubPage() {
  const [hasDraft, setHasDraft] = useState(false);
  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null");
      setHasDraft(!!d?.script?.trim());
    } catch {}
  }, []);

  const [write, ...others] = SCRIPT_TABS.slice(1);

  return (
    <div className="w-full max-w-5xl mx-auto">
      <ScriptsTabs />
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Scripts</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          A script is what you&apos;ll say out loud. Get one here, then practise it and get feedback on your speaking.
        </p>
      </div>

      {hasDraft && (
        <Link href="/dashboard/script-writer" className="flex items-center justify-between gap-3 rounded-lg p-4 mb-4 border"
          style={{ background: "var(--accent-bg)", borderColor: "var(--accent)" }}>
          <span className="text-sm font-semibold" style={{ color: "var(--accent)" }}>You have an unfinished script. Continue where you left off</span>
          <ArrowRight size={16} style={{ color: "var(--accent)" }} />
        </Link>
      )}

      <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Not sure? Start here</p>
      <Link href={write.href}
        className="group flex items-center gap-4 rounded-xl p-5 mb-6 border transition-colors hover:border-[var(--accent)]"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
        <span className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--accent)", color: "var(--on-accent, #fff)" }}>
          <write.icon size={22} />
        </span>
        <span className="flex-1">
          <span className="flex items-center gap-2 font-bold" style={{ color: "var(--text-primary)" }}>
            {write.label}
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded inline-flex items-center gap-0.5" style={{ background: "var(--accent-bg)", color: "var(--accent)" }}>
              <Sparkles size={10} /> Recommended
            </span>
          </span>
          <span className="block text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>{write.desc} Takes about 2 minutes.</span>
        </span>
        <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" style={{ color: "var(--accent)" }} />
      </Link>

      <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Other ways</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {others.map(({ href, label, desc, icon: Icon }) => (
          <Link key={href} href={href}
            className="flex items-start gap-3 rounded-xl p-4 border transition-colors hover:border-[var(--accent)]"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
            <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--accent-bg)", color: "var(--accent)" }}>
              <Icon size={18} />
            </span>
            <span>
              <span className="block font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{label}</span>
              <span className="block text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{desc}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
