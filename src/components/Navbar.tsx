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
    <header className="sticky top-0 z-50 bg-white border-b border-[#E0E0E0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-[#0056D2] rounded-lg flex items-center justify-center">
            <Mic2 size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold text-[#1F1F1F]">Spokiva</span>
          <span className="text-xs font-semibold bg-[#E8F1FF] text-[#0056D2] px-1.5 py-0.5 rounded">AI</span>
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
                <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-[#1F1F1F] hover:text-[#0056D2] rounded transition-colors">
                  {item.label}
                  <ChevronDown size={14} />
                </button>
                {dropdown === item.label && (
                  <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-lg border border-[#E0E0E0] shadow-lg py-1 z-50">
                    {item.children.map((child) => (
                      <Link
                        key={child.label}
                        href={child.href}
                        className="block px-4 py-2.5 text-sm text-[#1F1F1F] hover:bg-[#F5F5F5] hover:text-[#0056D2] transition-colors"
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
                className="px-3 py-2 text-sm font-medium text-[#1F1F1F] hover:text-[#0056D2] rounded transition-colors"
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        {/* Auth CTA */}
        <div className="hidden md:flex items-center gap-3">
          {!isSignedIn ? (
            <>
              <SignInButton mode="modal">
                <button className="text-sm font-semibold text-[#1F1F1F] hover:text-[#0056D2] transition-colors">
                  Log In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="inline-flex items-center bg-[#0056D2] hover:bg-[#003B8E] text-white font-semibold px-4 py-2 rounded text-sm transition-colors">
                  Start for Free
                </button>
              </SignUpButton>
            </>
          ) : (
            <>
              <Link href="/dashboard/script-writer" className="text-sm font-semibold text-[#0056D2] hover:text-[#003B8E] transition-colors">
                Dashboard
              </Link>
              <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setOpen(!open)} className="md:hidden p-1 text-[#1F1F1F]">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden border-t border-[#E0E0E0] bg-white px-4 py-4 space-y-1">
          <Link href="/features" onClick={() => setOpen(false)} className="block py-2 text-sm font-medium text-[#1F1F1F]">Features</Link>
          <Link href="/ielts-speaking" onClick={() => setOpen(false)} className="block py-2 text-sm font-medium text-[#1F1F1F]">IELTS Speaking</Link>
          <Link href="/business" onClick={() => setOpen(false)} className="block py-2 text-sm font-medium text-[#1F1F1F]">Business Communication</Link>
          <Link href="/interview-coach" onClick={() => setOpen(false)} className="block py-2 text-sm font-medium text-[#1F1F1F]">Interview Coach</Link>
          <Link href="/pricing" onClick={() => setOpen(false)} className="block py-2 text-sm font-medium text-[#1F1F1F]">Pricing</Link>
          <div className="pt-3 flex flex-col gap-2">
            {!isSignedIn ? (
              <>
                <SignInButton mode="modal">
                  <button onClick={() => setOpen(false)} className="w-full text-center py-2 border border-[#0056D2] text-[#0056D2] rounded font-semibold text-sm">
                    Log In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button onClick={() => setOpen(false)} className="w-full text-center py-2 bg-[#0056D2] text-white rounded font-semibold text-sm">
                    Start for Free
                  </button>
                </SignUpButton>
              </>
            ) : (
              <Link href="/dashboard/script-writer" onClick={() => setOpen(false)} className="block text-center py-2 bg-[#0056D2] text-white rounded font-semibold text-sm">
                Go to Dashboard
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
