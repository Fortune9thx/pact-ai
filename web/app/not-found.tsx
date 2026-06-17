import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center"
      style={{ background: "#0a0909" }}>
      <div className="pointer-events-none fixed inset-0"
        style={{ background: "radial-gradient(ellipse 70% 40% at 50% 0%, rgba(139,92,246,0.15) 0%, transparent 70%)" }} />
      <p className="text-[10px] font-mono tracking-[0.4em] uppercase mb-4"
        style={{ color: "rgba(237,235,230,0.25)" }}>
        404 · Not Found
      </p>
      <h1 className="text-4xl sm:text-6xl font-bold font-mono mb-3"
        style={{ color: "#edebe6", letterSpacing: "-0.03em" }}>
        Claim not found.
      </h1>
      <p className="text-sm max-w-sm mb-8 leading-relaxed"
        style={{ color: "rgba(237,235,230,0.35)" }}>
        This claim may have been closed, or the URL is invalid. The Arena has all active disputes.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/arena"
          className="px-7 py-3 rounded-full text-sm font-bold tracking-wide text-white"
          style={{ background: "#7c3aed", boxShadow: "0 0 28px rgba(124,58,237,0.4)" }}>
          Enter the Arena
        </Link>
        <Link href="/"
          className="px-7 py-3 rounded-full text-sm font-medium transition-all"
          style={{
            border: "1px solid rgba(139,92,246,0.3)",
            color: "#a78bfa",
            background: "rgba(139,92,246,0.06)",
          }}>
          Home
        </Link>
      </div>
    </div>
  );
}
