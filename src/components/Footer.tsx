import Link from "next/link";
import { Mic2 } from "lucide-react";

const footerLinks = {
  Product: [
    { label: "Features", href: "/features" },
    { label: "Pricing", href: "/pricing" },
    { label: "IELTS Speaking", href: "/ielts-speaking" },
    { label: "Business Communication", href: "/business" },
    { label: "Interview Coach", href: "/interview-coach" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Contact", href: "#" },
  ],
  Support: [
    { label: "Help Center", href: "#" },
    { label: "Community", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-[#1F1F1F] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-[#404040]">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-[#0056D2] rounded-lg flex items-center justify-center">
                <Mic2 size={18} className="text-white" />
              </div>
              <span className="text-lg font-bold">Spokiva</span>
            </Link>
            <p className="text-sm text-[#9E9E9E] leading-relaxed">
              AI-powered communication coach for work, exams, and public speaking.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#9E9E9E] mb-4">{section}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-[#BDBDBD] hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#9E9E9E]">
          <p>© 2024 Spokiva. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00B37D]"></span>
            <span>All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
