import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { SidebarProvider } from "@/context/SidebarContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex flex-col h-screen overflow-hidden" style={{ background: "var(--bg-secondary)" }}>
        {/* Mobile-only slide-out drawer; desktop uses the top-bar menus */}
        <DashboardSidebar />
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
