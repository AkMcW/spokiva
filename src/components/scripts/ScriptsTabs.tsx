"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Wand2, ClipboardPaste, Library, Link2, FolderOpen } from "lucide-react";

// The Scripts hub: one place for every way to get a script. Each tab is its own
// page; this bar is shown at the top of all of them.
export const SCRIPT_TABS = [
  { href: "/dashboard/scripts", label: "Start", icon: LayoutGrid, desc: "" },
  { href: "/dashboard/script-writer", label: "Write with AI", icon: Wand2, desc: "Answer a few simple questions and the AI writes a script for you." },
  { href: "/dashboard/add-script", label: "Paste my own", icon: ClipboardPaste, desc: "Already have a speech or notes? Paste it in and practise it." },
  { href: "/dashboard/script-library", label: "Ready-made", icon: Library, desc: "Pick a finished example script and start practising right away." },
  { href: "/dashboard/script-generator", label: "From a link or file", icon: Link2, desc: "Turn an article, video, PDF or notes into a script." },
  { href: "/dashboard/saved-scripts", label: "My scripts", icon: FolderOpen, desc: "Scripts you've saved. Open, edit or practise them." },
] as const;

export default function ScriptsTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Scripts" className="mb-5 overflow-x-auto">
      <div className="flex gap-1 min-w-max border-b" style={{ borderColor: "var(--border)" }}>
        {SCRIPT_TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} aria-current={active ? "page" : undefined}
              className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap"
              style={active
                ? { borderColor: "var(--accent)", color: "var(--accent)" }
                : { borderColor: "transparent", color: "var(--text-secondary)" }}>
              <Icon size={15} /> {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
