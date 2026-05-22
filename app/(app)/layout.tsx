import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { DemoBanner } from "@/components/layout/DemoBanner";
import { BlueprintCanvas } from "@/components/layout/BlueprintCanvas";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen overflow-x-hidden relative">
      <BlueprintCanvas />
      <Sidebar />
      <div className="flex flex-1 flex-col md:pl-56 min-w-0 relative" style={{ zIndex: 1 }}>
        <DemoBanner />
        <Header />
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
