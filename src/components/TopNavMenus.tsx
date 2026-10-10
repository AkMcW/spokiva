"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useUser as useClerkUser } from "@clerk/nextjs";
import { ADMIN_EMAIL, PLAN_FEATURES } from "@/lib/users";
import { navSections, type NavItem, type NavGroup } from "@/components/DashboardSidebar";

// A top-level menu is either a direct link or a dropdown of one or more columns.
type TopMenu =
  | { kind: "link"; item: NavItem }
  | { kind: "dropdown"; label: string; columns: NavGroup[] };

function buildMenus(): TopMenu[] {
  const main = navSections.find((s) => s.label === "Main");
  const modes = navSections.find((s) => s.label === "Practice Modes");
  const learn = navSections.find((s) => s.label === "Learn");
  const account = navSections.find((s) => s.label === "Account");
  const menus: TopMenu[] = [];

  main?.items.forEach((item) => menus.push({ kind: "link", item }));
  main?.groups?.forEach((g) => menus.push({ kind: "dropdown", label: g.label, columns: [g] }));
  if (modes?.groups?.length) menus.push({ kind: "dropdown", label: "Practice Modes", columns: modes.groups });
  if (learn) menus.push({ kind: "dropdown", label: "Learn", columns: [{ label: "Learn", icon: learn.items[0].icon, items: learn.items }] });
  if (account) menus.push({ kind: "dropdown", label: "Account", columns: [{ label: "Account", icon: account.items[0].icon, items: account.items }] });
  return menus;
}

const MENUS = buildMenus();

export default function TopNavMenus() {
  const pathname = usePathname();
  const { user } = useClerkUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const isAdmin = email === ADMIN_EMAIL;
  const planInfo = PLAN_FEATURES[isAdmin ? "admin" : "free"] as unknown as Record<string, boolean>;
  const [open, setOpen] = useState<string | null>(null);
  const navRef = useRef<HTMLElement | null>(null);

  // Close on route change and on outside click / Escape.
  useEffect(() => { setOpen(null); }, [pathname]);
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpen(null);
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(null); }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, []);

  const hasAccess = (item: NavItem) => isAdmin || !item.feature || planInfo[item.feature];
  const isActiveGroup = (cols: NavGroup[]) => cols.some((c) => c.items.some((i) => i.href === pathname));

  return (
    <nav ref={navRef} className="hidden lg:flex items-center gap-0.5">
      {MENUS.map((m) => {
        if (m.kind === "link") {
          const active = pathname === m.item.href;
          return (
            <Link key={m.item.href} href={m.item.href}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{ color: active ? "var(--accent)" : "var(--text-secondary)", background: active ? "var(--bg-active)" : "transparent" }}>
              {m.item.label}
            </Link>
          );
        }
        const isOpen = open === m.label;
        const active = isActiveGroup(m.columns);
        const multi = m.columns.length > 1;
        return (
          <div key={m.label} className="relative">
            <button
              onClick={() => setOpen(isOpen ? null : m.label)}
              aria-expanded={isOpen}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                color: active || isOpen ? "var(--accent)" : "var(--text-secondary)",
                background: isOpen ? "var(--bg-hover)" : active ? "var(--bg-active)" : "transparent",
              }}
            >
              {m.label}
              <ChevronDown size={14} className="transition-transform" style={{ transform: isOpen ? "rotate(180deg)" : "none" }} />
            </button>

            {isOpen && (
              <div
                className={`absolute left-0 top-full mt-1.5 z-50 rounded-xl border p-2 shadow-xl ${multi ? "grid grid-cols-3 gap-1 w-[640px]" : "w-60"}`}
                style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
              >
                {m.columns.map((col) => (
                  <div key={col.label}>
                    {multi && (
                      <p className="text-[10px] font-bold uppercase tracking-widest px-2.5 pt-1.5 pb-1" style={{ color: "var(--text-muted)" }}>
                        {col.label}
                      </p>
                    )}
                    <ul>
                      {col.items.map((item) => {
                        const Icon = item.icon;
                        const itemActive = pathname === item.href;
                        const ok = hasAccess(item);
                        return (
                          <li key={item.href}>
                            <Link href={item.href}
                              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors"
                              style={{
                                color: !ok ? "var(--text-muted)" : itemActive ? "var(--accent)" : "var(--text-primary)",
                                background: itemActive ? "var(--bg-active)" : "transparent",
                                fontWeight: itemActive ? 600 : 500,
                              }}
                              onMouseEnter={(e) => { if (!itemActive) e.currentTarget.style.background = "var(--bg-hover)"; }}
                              onMouseLeave={(e) => { if (!itemActive) e.currentTarget.style.background = "transparent"; }}
                            >
                              <Icon size={15} className="shrink-0" />
                              <span className="truncate flex-1">{item.label}</span>
                              {!ok && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{ background: "var(--accent-bg)", color: "var(--accent)" }}>Pro</span>
                              )}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
