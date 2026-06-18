"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, PlusCircle, GitBranch, BookOpen } from "lucide-react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/create", label: "Create Deal", icon: PlusCircle },
];

const footerLinks = [
  { href: "https://docs.genlayer.com", label: "GenLayer Docs", icon: BookOpen, external: true },
  { href: "https://github.com/Fortune9thx/pact-ai", label: "GitHub", icon: GitBranch, external: true },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden md:flex w-56 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]">
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center gap-2.5 px-4 border-b border-[var(--color-border)]">
        <Image
          src="/logo.png"
          alt="Pact"
          width={36}
          height={36}
          className="rounded-lg shrink-0"
          priority
        />
        <div>
          <p className="text-sm font-semibold tracking-tight text-[var(--color-foreground)]">
            Pact
          </p>
          <p className="text-[10px] text-[var(--color-muted-foreground)]">
            GenLayer Testnet
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="flex flex-col gap-0.5">
          <p className="px-2 mb-2 text-[10px] font-medium uppercase tracking-widest text-[var(--color-muted-foreground)]">
            Navigation
          </p>
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                  active
                    ? "bg-[var(--color-primary)]/12 text-[var(--color-primary)] font-medium"
                    : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-foreground)]"
                )}
              >
                <Icon className="size-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </div>

        {/* Status chip */}
        <div className="mt-6 mx-2 p-3 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
          <div className="flex items-center gap-2 mb-1">
            <span className="relative flex size-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-verdict-pass)] opacity-50" />
              <span className="relative inline-flex rounded-full size-1.5 bg-[var(--color-verdict-pass)]" />
            </span>
            <p className="text-xs font-medium text-[var(--color-foreground)]">Testnet Live</p>
          </div>
          <p className="text-[10px] text-[var(--color-muted-foreground)] leading-relaxed">
            AI validators running on Bradbury. Real GEN escrow active.
          </p>
        </div>
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-[var(--color-border)] px-3 py-3">
        <div className="flex flex-col gap-0.5">
          {footerLinks.map(({ href, label, icon: Icon, external }) => (
            <a
              key={href}
              href={href}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-[var(--color-muted-foreground)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-foreground)] transition-colors"
            >
              <Icon className="size-3.5 shrink-0" />
              {label}
            </a>
          ))}
        </div>
      </div>
    </aside>
  );
}
