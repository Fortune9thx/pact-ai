"use client";

import { WalletConnection } from "@/components/wallet/WalletConnection";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";

const pageTitles: Record<string, { title: string; description: string }> = {
  "/dashboard": { title: "Dashboard", description: "Overview of your deals and escrow activity" },
  "/create": { title: "Create Deal", description: "Fund an escrow for creative work" },
};

function getPageMeta(pathname: string) {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (pathname.startsWith("/deal/")) return { title: "Deal Details", description: "View deal status and AI verdict" };
  if (pathname.startsWith("/submit/")) return { title: "Submit Work", description: "Upload your creative submission" };
  return { title: "VibeCheck", description: "" };
}

export function Header() {
  const pathname = usePathname();
  const { title, description } = getPageMeta(pathname);

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-sm px-4 md:px-6">
      {/* Page context */}
      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-semibold text-[var(--color-foreground)] leading-none">
          {title}
        </h1>
        {description && (
          <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5 truncate">
            {description}
          </p>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button className="flex items-center justify-center size-8 rounded-lg text-[var(--color-muted-foreground)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-foreground)] transition-colors relative">
          <Bell className="size-4" />
        </button>
        <WalletConnection />
      </div>
    </header>
  );
}
