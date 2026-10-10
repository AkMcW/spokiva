"use client";
import Link from "next/link";
import { Bell, Mic2, ShieldCheck, Sun, Moon, Menu, LayoutDashboard, Settings, CreditCard } from "lucide-react";
import { UserButton, useUser } from "@clerk/nextjs";
import { ADMIN_EMAIL, PLAN_FEATURES } from "@/lib/users";
import { useTheme } from "@/context/ThemeContext";
import { useSidebar } from "@/context/SidebarContext";
import TopNavMenus from "@/components/TopNavMenus";

export default function DashboardHeader() {
  const { user } = useUser();
  const { theme, toggle: toggleTheme } = useTheme();
  const { toggleMobile } = useSidebar();
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const isAdmin = email === ADMIN_EMAIL;
  const planInfo = PLAN_FEATURES[isAdmin ? "admin" : "free"];

  return (
    <header
      className="h-14 flex items-center justify-between px-4 sm:px-5 shrink-0 border-b relative z-40"
      style={{ background: "var(--bg-sidebar)", borderColor: "var(--border)" }}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile menu + logo */}
        <button
          onClick={toggleMobile}
          className="lg:hidden p-1.5 rounded-lg transition-colors"
          style={{ color: "var(--text-secondary)" }}
        >
          <Menu size={18} />
        </button>
        <Link href="/dashboard" className="flex items-center gap-2 shrink-0 mr-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--accent)" }}>
            <Mic2 size={15} className="text-white" />
          </div>
          <span className="font-bold text-sm whitespace-nowrap" style={{ color: "var(--text-primary)" }}>Spokiva</span>
        </Link>
        <TopNavMenus />
      </div>

      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg transition-all duration-150"
          style={{ color: "var(--text-secondary)", background: "transparent" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Notifications */}
        <button
          className="relative p-2 rounded-lg transition-all duration-150"
          style={{ color: "var(--text-secondary)" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <Bell size={17} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent)" }} />
        </button>

        {/* Divider */}
        <div className="w-px h-5 mx-1" style={{ background: "var(--border)" }} />

        {/* User area */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:block text-right">
            <div className="flex items-center justify-end gap-1.5">
              <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                {user?.firstName ?? user?.username ?? "User"}
              </span>
              {isAdmin && (
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
                  style={{ background: "#FFF0F0", color: "#E53935" }}
                >
                  <ShieldCheck size={9} /> ADMIN
                </span>
              )}
            </div>
            <p className="text-[11px] font-medium" style={{ color: planInfo.color }}>{planInfo.label}</p>
          </div>

          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-8 h-8",
                userButtonPopoverCard: "shadow-lg",
              },
            }}
          >
            {/* Dashboard and account pages live in the user menu */}
            <UserButton.MenuItems>
              <UserButton.Link label="Dashboard" labelIcon={<LayoutDashboard size={15} />} href="/dashboard" />
              <UserButton.Link label="Settings" labelIcon={<Settings size={15} />} href="/dashboard/settings" />
              <UserButton.Link label="Billing" labelIcon={<CreditCard size={15} />} href="/pricing" />
              <UserButton.Action label="manageAccount" />
              <UserButton.Action label="signOut" />
            </UserButton.MenuItems>
          </UserButton>
        </div>
      </div>
    </header>
  );
}
