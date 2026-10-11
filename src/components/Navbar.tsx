"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, X, Mic2, ChevronDown } from "lucide-react";
import {
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import ThemePicker from "@/components/ThemePicker";

const navItems = [
  {
    label: "Solutions",
    children: [
      { label: "IELTS Speaking", href: "/ielts-speaking" },
      { label: "Business Communication", href: "/business" },
      { label: "Interview Coach", href: "/interview-coach" },
      { label: "Presentation Coach", href: "#" },
    ],
  },
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [dropdown, setDropdown] = useState<string | null>(null);
  const { isSignedIn } = useUser();

  return (
    <header className="sticky top-0 z-50 bg-[var(--bg-card)] border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-[var(--accent)] rounded-lg flex items-center justify-center">
            <Mic2 size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold text-[var(--text-primary)]">Spokiva</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {navItems.map((item) =>
            item.children ? (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => setDropdown(item.label)}
                onMouseLeave={() => setDropdown(null)}
              >
                <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-[var(--text-primary)] hover:text-[var(--accent)] rounded transition-colors">
                  {item.label}
                  <ChevronDown size={14} />
                </button>
                {dropdown === item.label && (
                  <div className="absolute top-full left-0 mt-1 w-52 bg-[var(--bg-card)] rounded-lg border border-[var(--border)] shadow-lg py-1 z-50">
                    {item.children.map((child) => (
                      <Link
                        key={child.label}
                        href={child.href}
                        className="block px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] hover:text-[var(--accent)] transition-colors"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={item.label}
                href={item.href!}
                className="px-3 py-2 text-sm font-medium text-[var(--text-primary)] hover:text-[var(--accent)] rounded transition-colors"
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        {/* Auth CTA */}
        <div className="hidden md:flex items-center gap-3">
          <ThemePicker />
          {!isSignedIn ? (
            <>
              <SignInButton mode="modal">
                <button className="text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors">
                  Log In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="inline-flex items-center bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold px-4 py-2 rounded text-sm transition-colors">
                  Start for Free
                </button>
              </SignUpButton>
            </>
          ) : (
            <>
              <Link href="/dashboard/script-writer" className="text-sm font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors">
                Dashboard
              </Link>
              <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
            </>
          )}
        </div>

        {/* Mobile: theme + menu toggle */}
        <div className="md:hidden flex items-center gap-1">
          <ThemePicker />
          <button onClick={() => setOpen(!open)} className="p-1 text-[var(--text-primary)]">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden border-t border-[var(--border)] bg-[var(--bg-card)] px-4 py-4 space-y-1">
          <Link href="/features" onClick={() => setOpen(false)} className="block py-2 text-sm font-medium text-[var(--text-primary)]">Features</Link>
          <Link href="/ielts-speaking" onClick={() => setOpen(false)} className="block py-2 text-sm font-medium text-[var(--text-primary)]">IELTS Speaking</Link>
          <Link href="/business" onClick={() => setOpen(false)} className="block py-2 text-sm font-medium text-[var(--text-primary)]">Business Communication</Link>
          <Link href="/interview-coach" onClick={() => setOpen(false)} className="block py-2 text-sm font-medium text-[var(--text-primary)]">Interview Coach</Link>
          <Link href="/pricing" onClick={() => setOpen(false)} className="block py-2 text-sm font-medium text-[var(--text-primary)]">Pricing</Link>
          <div className="pt-3 flex flex-col gap-2">
            {!isSignedIn ? (
              <>
                <SignInButton mode="modal">
                  <button onClick={() => setOpen(false)} className="w-full text-center py-2 border border-[var(--accent)] text-[var(--accent)] rounded font-semibold text-sm">
                    Log In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button onClick={() => setOpen(false)} className="w-full text-center py-2 bg-[var(--accent)] text-white rounded font-semibold text-sm">
                    Start for Free
                  </button>
                </SignUpButton>
              </>
            ) : (
              <Link href="/dashboard/script-writer" onClick={() => setOpen(false)} className="block text-center py-2 bg-[var(--accent)] text-white rounded font-semibold text-sm">
                Go to Dashboard
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
