"use client";
import { useState } from "react";
import Link from "next/link";
import { CheckCircle, Palette } from "lucide-react";
import { ThemeGrid } from "@/components/ThemePicker";

export default function SettingsPage() {
  const [profile, setProfile] = useState({
    name: "Alex Johnson",
    email: "alex.johnson@example.com",
    language: "English (US)",
  });
  const [saved, setSaved] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Settings</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Manage your appearance, profile and plan.</p>
      </div>

      {/* Appearance */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6">
        <h2 className="font-bold text-[var(--text-primary)] mb-1 flex items-center gap-2"><Palette size={17} className="text-[var(--accent)]" /> Reading theme</h2>
        <p className="text-sm text-[var(--text-secondary)] mb-4">Soft palettes designed for long reading sessions. Your choice is saved on this device.</p>
        <ThemeGrid />
      </div>

      {/* Profile Section */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6">
        <h2 className="font-bold text-[var(--text-primary)] mb-5">Profile</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">Full name</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full px-3 py-2.5 border border-[var(--border)] rounded text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">Email address</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className="w-full px-3 py-2.5 border border-[var(--border)] rounded text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">Interface language</label>
            <select
              value={profile.language}
              onChange={(e) => setProfile({ ...profile, language: e.target.value })}
              className="w-full px-3 py-2.5 border border-[var(--border)] rounded text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
            >
              {["English (US)", "English (UK)", "Spanish", "French", "German", "Portuguese", "Hindi", "Chinese (Simplified)"].map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold px-6 py-2.5 rounded text-sm transition-colors"
            >
              Save Changes
            </button>
            {saved && (
              <div className="flex items-center gap-1 text-[#00B37D] text-sm font-medium">
                <CheckCircle size={15} />
                Saved!
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Plan Section */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-6">
        <h2 className="font-bold text-[var(--text-primary)] mb-4">Plan & Billing</h2>

        <div className="flex items-center gap-3 mb-5">
          <span className="bg-[var(--accent-bg)] text-[var(--accent)] font-bold text-sm px-3 py-1 rounded-full">Free Plan</span>
          <span className="text-sm text-[var(--text-secondary)]">Active since Jan 2026</span>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between py-2 border-b border-[var(--border)]">
            <span className="text-sm text-[var(--text-secondary)]">Sessions used this month</span>
            <div className="flex items-center gap-2">
              <div className="w-32 bg-[var(--border)] rounded-full h-1.5">
                <div className="bg-[var(--accent)] h-1.5 rounded-full" style={{ width: "60%" }}></div>
              </div>
              <span className="text-sm font-semibold text-[var(--text-primary)]">3 / 5</span>
            </div>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-[var(--border)]">
            <span className="text-sm text-[var(--text-secondary)]">Scripts generated this month</span>
            <div className="flex items-center gap-2">
              <div className="w-32 bg-[var(--border)] rounded-full h-1.5">
                <div className="bg-[var(--accent)] h-1.5 rounded-full" style={{ width: "33%" }}></div>
              </div>
              <span className="text-sm font-semibold text-[var(--text-primary)]">1 / 3</span>
            </div>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-[var(--text-secondary)]">Renewal date</span>
            <span className="text-sm font-semibold text-[var(--text-primary)]">Jul 1, 2026</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold px-5 py-2.5 rounded text-sm transition-colors"
          >
            Upgrade Plan
          </Link>
          <button
            className="inline-flex items-center justify-center border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] font-semibold px-5 py-2.5 rounded text-sm transition-colors"
          >
            Manage Billing
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-[var(--bg-card)] border border-[var(--danger-border)] rounded-lg p-5">
        <h2 className="font-bold text-[var(--text-primary)] mb-2">Danger Zone</h2>
        <p className="text-xs text-[var(--text-secondary)] mb-3">Permanently delete your account and all associated data.</p>
        <button className="text-xs border border-red-300 text-red-500 hover:bg-[var(--danger-bg)] font-semibold px-4 py-2 rounded transition-colors">
          Delete Account
        </button>
      </div>
    </div>
  );
}
