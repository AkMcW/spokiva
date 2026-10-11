import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { Mic2 } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] flex flex-col items-center justify-center px-4 py-12">
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 justify-center">
          <div className="w-10 h-10 bg-[var(--accent)] rounded-xl flex items-center justify-center">
            <Mic2 size={22} className="text-white" />
          </div>
          <span className="text-xl font-bold text-[var(--text-primary)]">Spokiva</span>
        </Link>
      </div>
      <SignIn forceRedirectUrl="/dashboard/script-writer" />
    </div>
  );
}
