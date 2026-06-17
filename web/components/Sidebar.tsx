import Link from "next/link";
import { ConnectButton } from "./ConnectButton";

export function Sidebar({ activeFilter: _ }: { activeFilter: string }) {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md"
      style={{ background: "rgba(10,9,9,0.88)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-baseline gap-2.5 shrink-0">
          <span className="text-sm font-bold font-mono tracking-[0.35em]"
            style={{ color: "#edebe6", textShadow: "0 0 16px rgba(139,92,246,0.6)" }}>
            ERISTIC
          </span>
          <span className="text-[9px] font-mono tracking-widest hidden sm:block"
            style={{ color: "rgba(237,235,230,0.2)" }}>
            {(process.env.NEXT_PUBLIC_CHAIN ?? "studionet").toUpperCase()}
          </span>
        </Link>

        {/* Right */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link href="/create"
            className="px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all"
            style={{ background: "#7c3aed", color: "#fff", boxShadow: "0 0 18px rgba(124,58,237,0.35)" }}>
            <span className="hidden sm:inline">+ New Claim</span>
            <span className="sm:hidden">+</span>
          </Link>
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
