"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FileText, Mic, BarChart2, BookOpen,
  Briefcase, Monitor, Users, Settings, CreditCard, Save, Target,
  Mic2, ShieldCheck, Bot, AudioLines, BookMarked, Zap,
  ChevronLeft, ChevronRight, ChevronDown, Library, Wand2, History, GraduationCap, ClipboardCheck,
  Landmark, FilePlus2, type LucideIcon,
} from "lucide-react";
import { useUser as useClerkUser } from "@clerk/nextjs";
import { ADMIN_EMAIL, PLAN_FEATURES } from "@/lib/users";
import { useSidebar } from "@/context/SidebarContext";

export type NavItem = { label: string; href: string; icon: LucideIcon; feature: string | null };
export type NavGroup = { label: string; icon: LucideIcon; items: NavItem[] };
export type NavSection = { label: string; items: NavItem[]; groups?: NavGroup[] };

export const navSections: NavSection[] = [
  {
    label: "Main",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, feature: null },
    ],
    groups: [
      {
        label: "Script", icon: FileText,
        items: [
          { label: "Script Writer", href: "/dashboard/script-writer", icon: FileText, feature: "canUseScriptWriter" },
          { label: "Add Script", href: "/dashboard/add-script", icon: FilePlus2, feature: null },
          { label: "Script Library", href: "/dashboard/script-library", icon: Library, feature: null },
          { label: "Script Generator", href: "/dashboard/script-generator", icon: Wand2, feature: null },
          { label: "Saved Scripts", href: "/dashboard/saved-scripts", icon: Save, feature: null },
        ],
      },
      {
        label: "Practice", icon: Mic,
        items: [
          { label: "Practice", href: "/dashboard/practice", icon: Mic, feature: "canUsePractice" },
          { label: "Recordings", href: "/dashboard/records", icon: AudioLines, feature: null },
        ],
      },
      {
        label: "Progress", icon: BarChart2,
        items: [
          { label: "Session Results", href: "/dashboard/session-results", icon: History, feature: null },
          { label: "Progress", href: "/dashboard/progress", icon: BarChart2, feature: "canUseProgress" },
        ],
      },
    ],
  },
  {
    label: "Practice Modes",
    items: [],
    groups: [
      {
        label: "Global Exams", icon: GraduationCap,
        items: [
          { label: "IELTS Speaking", href: "/dashboard/ielts", icon: BookOpen, feature: "canUseIELTS" },
          { label: "PTE Academic", href: "/dashboard/pte", icon: BookMarked, feature: "canUsePTE" },
          { label: "C2 Fluency Lab", href: "/dashboard/c2-fluency-lab", icon: GraduationCap, feature: "canUseC2Lab" },
          { label: "Exam Speaking", href: "/dashboard/exam-speaking", icon: ClipboardCheck, feature: "canUseExamMode" },
        ],
      },
      {
        label: "Challenge", icon: Zap,
        items: [
          { label: "Challenges", href: "/dashboard/challenges", icon: Zap, feature: "canUseChallenges" },
          { label: "Pitch Coach", href: "/dashboard/pitch", icon: Target, feature: "canUsePitchCoach" },
          { label: "Interview", href: "/dashboard/interview", icon: Briefcase, feature: "canUseInterview" },
          { label: "Presentation", href: "/dashboard/presentation", icon: Monitor, feature: "canUsePresentation" },
          { label: "Virtual Audience", href: "/dashboard/audience", icon: Users, feature: "canUseAudience" },
        ],
      },
      {
        label: "AI Coach", icon: Bot,
        items: [
          { label: "AI Coach", href: "/dashboard/ai-coach", icon: Bot, feature: null },
        ],
      },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Settings", href: "/dashboard/settings", icon: Settings, feature: null },
      { label: "Billing", href: "/dashboard/billing", icon: CreditCard, feature: null },
    ],
  },
  {
    label: "Learn",
    items: [
      { label: "Phonetics", href: "/dashboard/phonetics", icon: BookMarked, feature: null },
      { label: "Vocabulary", href: "/dashboard/vocabulary", icon: Library, feature: null },
      { label: "Outstanding Speeches", href: "/dashboard/speeches", icon: Landmark, feature: null },
    ],
  },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { user } = useClerkUser();
  const { collapsed, toggle, mobileOpen, closeMobile } = useSidebar();
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const isAdmin = email === ADMIN_EMAIL;
  const planInfo = PLAN_FEATURES[isAdmin ? "admin" : "free"];
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Script: true, Practice: true, Progress: true,
    "Global Exams": true, Challenge: true, "AI Coach": true,
  });
  const toggleGroup = (label: string) => setOpenGroups((g) => ({ ...g, [label]: !g[label] }));

  function renderItem(
    item: { label: string; href: string; icon: LucideIcon; feature: string | null },
    isCollapsed: boolean,
    isMobile: boolean,
  ) {
    const active = pathname === item.href;
    const Icon = item.icon;
    const hasAccess = isAdmin || !item.feature || (planInfo as unknown as Record<string, boolean>)[item.feature];
    return (
      <li key={item.label}>
        <Link
          href={item.href}
          title={isCollapsed ? item.label : undefined}
          onClick={isMobile ? closeMobile : undefined}
          className="flex items-center gap-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative"
          style={{
            padding: isCollapsed ? "8px 10px" : "7px 10px",
            color: !hasAccess ? "var(--text-muted)" : active ? "var(--accent)" : "var(--text-secondary)",
            background: active ? "var(--bg-active)" : "transparent",
            fontWeight: active ? 600 : 500,
          }}
          onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
          onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          <Icon size={16} className="shrink-0" />
          {!isCollapsed && <span className="truncate">{item.label}</span>}
          {!isCollapsed && !hasAccess && (
            <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{ background: "var(--accent-bg)", color: "var(--accent)" }}>
              Pro
            </span>
          )}
          {isCollapsed && (
            <span className="pointer-events-none absolute left-full ml-2 px-2 py-1 text-xs font-medium rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50"
              style={{ background: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border)", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
              {item.label}
            </span>
          )}
        </Link>
      </li>
    );
  }

  function SidebarInner({ isMobile = false }: { isMobile?: boolean }) {
    const show = !isMobile; // show labels and plan badge always on mobile
    const isCollapsed = !isMobile && collapsed;
    return (
      <aside
        className="flex flex-col h-full relative"
        style={{ background: "var(--bg-sidebar)", borderRight: "1px solid var(--border)" }}
      >
        {/* Logo */}
        <div
          className="h-16 flex items-center gap-2.5 border-b overflow-hidden shrink-0"
          style={{ borderColor: "var(--border)", padding: isCollapsed ? "0 18px" : "0 16px" }}
        >
          <Link href="/" className="flex items-center gap-2.5 shrink-0" onClick={isMobile ? closeMobile : undefined}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--accent)" }}>
              <Mic2 size={15} className="text-white" />
            </div>
            {!isCollapsed && (
              <span className="font-bold text-sm whitespace-nowrap" style={{ color: "var(--text-primary)" }}>
                Spokiva AI
              </span>
            )}
          </Link>
        </div>

        {/* Collapse toggle (desktop only) */}
        {!isMobile && (
          <button
            onClick={toggle}
            className="absolute -right-3 top-[72px] w-6 h-6 rounded-full flex items-center justify-center z-20 border transition-colors"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border)",
              color: "var(--text-secondary)",
              boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
            }}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
          </button>
        )}

        <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden" style={{ padding: isCollapsed ? "12px 8px" : "12px 10px" }}>
          {navSections.map((section) => (
            <div key={section.label} className="mb-5">
              {!isCollapsed && (
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5 px-2" style={{ color: "var(--text-muted)" }}>
                  {section.label}
                </p>
              )}
              {isCollapsed && <div className="w-full h-px mb-3" style={{ background: "var(--border)" }} />}
              <ul className="space-y-0.5">
                {section.items.map((item) => renderItem(item, isCollapsed, isMobile))}
              </ul>

              {/* Collapsible submenus */}
              {section.groups?.map((grp) => {
                const GrpIcon = grp.icon;
                const open = openGroups[grp.label] ?? true;
                if (isCollapsed) {
                  // In the narrow rail, show group items flat (icon-only)
                  return (
                    <ul key={grp.label} className="space-y-0.5 mt-0.5">
                      {grp.items.map((item) => renderItem(item, isCollapsed, isMobile))}
                    </ul>
                  );
                }
                return (
                  <div key={grp.label} className="mt-1">
                    <button
                      onClick={() => toggleGroup(grp.label)}
                      className="w-full flex items-center gap-2.5 rounded-lg text-sm font-semibold transition-all duration-150"
                      style={{ padding: "7px 10px", color: "var(--text-primary)" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                    >
                      <GrpIcon size={16} className="shrink-0" />
                      <span className="truncate flex-1 text-left">{grp.label}</span>
                      <ChevronDown size={14} className="shrink-0 transition-transform" style={{ transform: open ? "none" : "rotate(-90deg)", color: "var(--text-muted)" }} />
                    </button>
                    {open && (
                      <ul className="space-y-0.5 mt-0.5 ml-3 pl-2 border-l" style={{ borderColor: "var(--border)" }}>
                        {grp.items.map((item) => renderItem(item, isCollapsed, isMobile))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Plan badge */}
        {(show || !isCollapsed) && (
          <div className="p-3 shrink-0 border-t" style={{ borderColor: "var(--border)" }}>
            <div className="rounded-lg p-3" style={{ background: "var(--accent-bg)" }}>
              <div className="flex items-center gap-1.5 mb-0.5">
                {isAdmin && <ShieldCheck size={12} style={{ color: "var(--accent)" }} />}
                <p className="text-xs font-bold" style={{ color: "var(--accent)" }}>{planInfo.label} Plan</p>
              </div>
              {isAdmin ? (
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Full access · All features</p>
              ) : (
                <>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>5 sessions used</p>
                  <Link href="/pricing" onClick={isMobile ? closeMobile : undefined}
                    className="mt-2 block text-center text-xs font-semibold py-1.5 rounded-lg text-white transition-colors"
                    style={{ background: "var(--accent)" }}>
                    Upgrade
                  </Link>
                </>
              )}
            </div>
          </div>
        )}

        {/* Collapsed plan dot (desktop only) */}
        {!isMobile && isCollapsed && (
          <div className="p-3 shrink-0 border-t flex justify-center" style={{ borderColor: "var(--border)" }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "var(--accent-bg)" }}>
              {isAdmin ? <ShieldCheck size={14} style={{ color: "var(--accent)" }} /> : <CreditCard size={14} style={{ color: "var(--accent)" }} />}
            </div>
          </div>
        )}
      </aside>
    );
  }

  return (
    <>
      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.4)" }}
            onClick={closeMobile}
          />
          {/* Drawer */}
          <div className="absolute left-0 top-0 bottom-0 w-64 shadow-xl">
            <SidebarInner isMobile />
          </div>
        </div>
      )}
    </>
  );
}
