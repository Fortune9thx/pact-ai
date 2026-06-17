import Link from "next/link";
import Image from "next/image";
import { fetchAllClaims } from "@/lib/genlayer";
import { ADDRS, type Claim, type Pool } from "@/lib/contracts";
import { ConnectButton } from "@/components/ConnectButton";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "ERISTIC — Decentralized Claim Adjudication",
  description: "File a claim, stake your conviction, get an AI verdict on GenLayer.",
};

type Row = Claim & { pool: Pool };

async function loadData(): Promise<{
  claims: Row[];
  stats: { total: number; active: number; inReview: number; resolved: number; staked: number };
}> {
  if (!ADDRS.registry) {
    return { claims: [], stats: { total: 0, active: 0, inReview: 0, resolved: 0, staked: 0 } };
  }
  try {
    const claims = await fetchAllClaims();
    const staked = claims.reduce((s, c) => s + c.pool.total_for + c.pool.total_against, 0);
    return {
      claims,
      stats: {
        total: claims.length,
        active: claims.filter((c) => c.state === "OPEN" || c.state === "UNDER_CHALLENGE").length,
        inReview: claims.filter((c) => c.state === "UNDER_REVIEW").length,
        resolved: claims.filter((c) => c.state === "RESOLVED").length,
        staked,
      },
    };
  } catch {
    return { claims: [], stats: { total: 0, active: 0, inReview: 0, resolved: 0, staked: 0 } };
  }
}

function fmtGen(wei: number) {
  const g = wei / 1e18;
  if (g >= 1000) return `${(g / 1000).toFixed(1)}K`;
  if (g >= 1) return g.toFixed(1);
  return g.toFixed(2);
}

export default async function Home() {
  const { claims, stats } = await loadData();

  const priority = ["UNDER_REVIEW", "UNDER_CHALLENGE", "OPEN", "RESOLVED"];
  const featured: Row | undefined =
    priority.reduce<Row | undefined>((found, state) => {
      if (found) return found;
      return claims.find((c) => c.state === state);
    }, undefined) ?? claims[0];

  const forPct = featured
    ? featured.pool.total_for + featured.pool.total_against > 0
      ? Math.round(
          (featured.pool.total_for /
            (featured.pool.total_for + featured.pool.total_against)) * 100
        )
      : 50
    : 50;

  const stateLabel: Record<string, string> = {
    OPEN: "Open", UNDER_CHALLENGE: "Challenged",
    UNDER_REVIEW: "In Review", RESOLVED: "Resolved", CLOSED: "Closed",
  };
  const stateColor: Record<string, string> = {
    OPEN: "text-amber border-amber/50 bg-amber/8",
    UNDER_CHALLENGE: "text-red-400 border-red-500/40 bg-red-500/8",
    UNDER_REVIEW: "text-violet-300 border-violet-400/40 bg-violet-500/8",
    RESOLVED: "text-emerald-400 border-emerald-400/40 bg-emerald-500/8",
    CLOSED: "text-zinc-500 border-zinc-600 bg-zinc-800/20",
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: "#0a0808" }}>

      {/* ── NAV ── */}
      <header className="fixed top-0 z-50 w-full border-b border-white/[0.06] bg-[#0a0808]/85 backdrop-blur-md">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4 sm:gap-8">
          <Link href="/" className="shrink-0 text-white text-sm tracking-[0.35em] font-bold font-mono"
            style={{ textShadow: "0 0 20px rgba(139,92,246,0.8), 0 0 40px rgba(139,92,246,0.4)" }}>
            ERISTIC
          </Link>
          <nav className="hidden md:flex items-center gap-1 flex-1">
            {[
              { href: "/arena", label: "Arena" },
              { href: "/create", label: "File a Claim" },
              { href: "/arena?filter=resolved", label: "Verdicts" },
            ].map(({ href, label }) => (
              <Link key={href} href={href}
                className="px-3 py-1.5 text-sm text-white/40 hover:text-white/75 hover:bg-white/5 rounded-full transition-all duration-150">
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex-1 md:hidden" />
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link href="/create"
              className="hidden sm:inline-flex items-center justify-center px-4 py-1.5 rounded-full text-xs font-bold tracking-[0.12em] uppercase text-white transition-all"
              style={{ background: "linear-gradient(135deg, #7c3aed, #8b5cf6)" }}>
              + New
            </Link>
            <ConnectButton />
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative flex flex-col items-center justify-center min-h-screen pt-14 px-4 sm:px-6 overflow-hidden">

        {/* Deep purple bloom — more intense */}
        <div className="pointer-events-none absolute inset-0 z-0"
          style={{
            background: "radial-gradient(ellipse 80% 55% at 50% -5%, rgba(139,92,246,0.28) 0%, rgba(109,40,217,0.08) 50%, transparent 72%)",
          }}
        />
        {/* Secondary warm bloom low-center */}
        <div className="pointer-events-none absolute z-0"
          style={{
            bottom: "5%", left: "50%", transform: "translateX(-50%)",
            width: "600px", height: "300px",
            background: "radial-gradient(ellipse at center, rgba(139,92,246,0.06) 0%, transparent 70%)",
          }}
        />

        {/* ── FLOATING AVATARS ── */}

        {/* av3 photo */}
        <div className="absolute z-10 avatar-float-1 av-pos-1">
          <Avatar size={68} blur={1.5} opacity={0.82} ring="rgba(139,92,246,0.4)">
            <Image src="/av3.jpg" alt="" width={68} height={68} className="object-cover w-full h-full" unoptimized />
          </Avatar>
        </div>

        {/* av4 photo */}
        <div className="absolute z-10 avatar-float-2 av-pos-2">
          <Avatar size={76} blur={2} opacity={0.7} ring="rgba(255,255,255,0.15)">
            <Image src="/av4.jpg" alt="" width={76} height={76} className="object-cover w-full h-full" unoptimized />
          </Avatar>
        </div>

        {/* av5 photo */}
        <div className="absolute z-10 avatar-float-3 av-pos-3">
          <Avatar size={58} blur={2.5} opacity={0.6} ring="rgba(139,92,246,0.3)">
            <Image src="/av5.jpg" alt="" width={58} height={58} className="object-cover w-full h-full" unoptimized />
          </Avatar>
        </div>

        {/* av1 photo */}
        <div className="absolute z-10 avatar-float-4 av-pos-4">
          <Avatar size={80} blur={1} opacity={0.88} ring="rgba(139,92,246,0.5)">
            <Image src="/av1.jpg" alt="" width={80} height={80} className="object-cover w-full h-full" unoptimized />
          </Avatar>
        </div>

        {/* FC Barcelona */}
        <div className="absolute z-10 avatar-float-5 av-pos-5">
          <Avatar size={66} blur={2} opacity={0.72} ring="rgba(165,0,68,0.5)">
            <div className="w-full h-full rounded-full overflow-hidden"
              style={{ background: "linear-gradient(145deg, #a50044 0%, #004d98 55%, #a50044 100%)" }}>
              <div className="w-full h-full flex flex-col items-center justify-center gap-0.5">
                <span className="text-white font-black text-[11px] tracking-widest drop-shadow">FCB</span>
                <div className="flex gap-0.5">
                  <div className="w-1.5 h-2.5 rounded-sm" style={{ background: "#ffcc00" }} />
                  <div className="w-1.5 h-2.5 rounded-sm" style={{ background: "#a50044" }} />
                  <div className="w-1.5 h-2.5 rounded-sm" style={{ background: "#004d98" }} />
                </div>
              </div>
            </div>
          </Avatar>
        </div>

        {/* Bitcoin */}
        <div className="absolute z-10 avatar-float-6 av-pos-6">
          <Avatar size={72} blur={1.5} opacity={0.78} ring="rgba(247,147,26,0.5)">
            <div className="w-full h-full flex items-center justify-center rounded-full"
              style={{ background: "linear-gradient(135deg, #fbbf24 0%, #f7931a 50%, #e8820c 100%)" }}>
              <svg viewBox="0 0 64 64" className="w-10 h-10" fill="white">
                <path d="M47 27c1-4-3-6-7-7l1-6-4-1-1 5-3-1 1-5-4-1-1 6-9-2-1 4 3 1c2 0 2 1 2 2l-4 16c0 1 0 2-2 1l-3-1-2 5 9 2-1 6 4 1 1-6 3 1-1 6 4 1 1-6c6 1 11 0 12-5 1-4-1-7-4-8 2-1 4-3 5-7zm-7 12c-1 3-6 2-8 1l2-7c2 0 8 0 6 6zm2-12c-1 3-5 2-7 1l2-6c2 0 7 0 5 5z" />
              </svg>
            </div>
          </Avatar>
        </div>

        {/* av2 photo */}
        <div className="absolute z-10 avatar-float-7 av-pos-7">
          <Avatar size={50} blur={3} opacity={0.5} ring="rgba(255,255,255,0.1)">
            <Image src="/av2.jpg" alt="" width={50} height={50} className="object-cover w-full h-full" unoptimized />
          </Avatar>
        </div>

        {/* ── FEATURED CLAIM CARD ── */}
        <div className="relative z-20 w-full max-w-md">
          {featured ? (
            <div className="rounded-2xl overflow-hidden shadow-2xl"
              style={{
                background: "linear-gradient(160deg, #18140f 0%, #110f0a 100%)",
                border: "1px solid rgba(139,92,246,0.2)",
                boxShadow: "0 0 0 1px rgba(139,92,246,0.08), 0 24px 60px rgba(0,0,0,0.6), 0 0 80px rgba(139,92,246,0.07)",
              }}>

              {/* Card header */}
              <div className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.35)" }}>
                    <span className="text-[11px] font-mono font-bold" style={{ color: "#a78bfa" }}>#{featured.id}</span>
                  </div>
                  <span className="text-xs font-mono tracking-widest uppercase" style={{ color: "rgba(217,212,199,0.4)" }}>
                    Live Claim
                  </span>
                </div>
                <span className={`text-[10px] tracking-widest uppercase border rounded-sm px-2 py-[3px] font-mono ${stateColor[featured.state] ?? ""}`}>
                  {stateLabel[featured.state]}
                </span>
              </div>

              {/* Statement */}
              <div className="px-5 pt-4 pb-2">
                <p className="text-sm leading-snug line-clamp-3" style={{ color: "rgba(217,212,199,0.9)" }}>
                  {featured.statement}
                </p>
              </div>

              {/* FOR / AGAINST */}
              <div className="px-5 pb-4 mt-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] tracking-widest uppercase font-mono" style={{ color: "#a78bfa" }}>For</span>
                  <span className="text-[10px] tracking-widest uppercase font-mono" style={{ color: "#f87171" }}>Against</span>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden flex"
                  style={{ background: "rgba(255,255,255,0.05)" }}>
                  <div className="h-full rounded-l-full transition-all duration-700"
                    style={{ width: `${forPct}%`, background: "linear-gradient(90deg, #7c3aed, #8b5cf6)" }} />
                  <div className="h-full rounded-r-full transition-all duration-700"
                    style={{ width: `${100 - forPct}%`, background: "linear-gradient(90deg, #dc2626, #ef4444)" }} />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs font-mono tabular-nums font-semibold" style={{ color: "#a78bfa" }}>
                    {fmtGen(featured.pool.total_for)} GEN
                  </span>
                  <span className="text-[10px] font-mono" style={{ color: "rgba(217,212,199,0.25)" }}>
                    {featured.pool.positions} stakers
                  </span>
                  <span className="text-xs font-mono tabular-nums font-semibold" style={{ color: "#f87171" }}>
                    {fmtGen(featured.pool.total_against)} GEN
                  </span>
                </div>
              </div>

              {/* Amounts */}
              <div className="px-5 py-3 space-y-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px]" style={{ color: "rgba(217,212,199,0.35)" }}>Total staked</span>
                  <span className="text-[11px] font-mono tabular-nums" style={{ color: "rgba(217,212,199,0.8)" }}>
                    {fmtGen(featured.pool.total_for + featured.pool.total_against)} GEN
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px]" style={{ color: "rgba(217,212,199,0.35)" }}>Verdict</span>
                  <span className="text-[11px] font-mono" style={{ color: featured.verdict ? "#34d399" : "rgba(217,212,199,0.4)" }}>
                    {featured.verdict || "Pending AI review"}
                  </span>
                </div>
              </div>

              {/* CTA */}
              <div className="px-5 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <Link href={`/claim/${featured.id}`}
                  className="w-full flex items-center justify-center py-2.5 rounded-full text-xs font-bold tracking-[0.15em] uppercase transition-all duration-200"
                  style={{
                    background: "linear-gradient(135deg, #7c3aed, #8b5cf6)",
                    color: "#fff",
                    boxShadow: "0 4px 24px rgba(139,92,246,0.35)",
                  }}>
                  Challenge this Claim →
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl p-8 text-center shadow-2xl"
              style={{ background: "#131108", border: "1px solid rgba(139,92,246,0.15)" }}>
              <p className="text-sm mb-4" style={{ color: "rgba(217,212,199,0.3)" }}>No claims yet</p>
              <Link href="/create" className="btn-amber px-6 py-2.5 text-xs">File the first claim</Link>
            </div>
          )}
        </div>

        {/* ── HEADLINE BELOW ── */}
        <div className="relative z-20 text-center mt-10 max-w-2xl">
          <h1 className="font-bold leading-[0.93] tracking-tight text-white"
            style={{ fontSize: "clamp(34px, 5vw, 72px)" }}>
            Debate. Stake
            <br />
            Get your{" "}
            <span style={{
              background: "linear-gradient(135deg, #a78bfa 0%, #8b5cf6 50%, #7c3aed 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 0 24px rgba(139,92,246,0.6))",
            }}>
              verdict.
            </span>
          </h1>
          <p className="mt-5 text-base leading-relaxed max-w-lg mx-auto" style={{ color: "rgba(217,212,199,0.45)" }}>
            Put your claims on-chain. AI validators reach consensus —
            no judges, no politics, no middlemen.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8 w-full">
            <Link href="/create"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-full text-sm font-bold tracking-[0.12em] uppercase text-white transition-all duration-200"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #8b5cf6)",
                boxShadow: "0 4px 28px rgba(139,92,246,0.45)",
              }}>
              Enter the Arena
            </Link>
            <Link href="/arena" className="btn-ghost w-full sm:w-auto px-8 py-3.5 text-sm">
              View All Claims
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS GRID ── */}
      <section className="max-w-screen-xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard value={String(stats.total)}    unit="CLAIMS" label="Total filed" />
          <StatCard value={String(stats.active)}   unit="OPEN"   label="Active disputes"   accent />
          <StatCard value={String(stats.inReview)} unit="REVIEW" label="Under AI review"   purple />
          <StatCard value={String(stats.resolved)} unit="DONE"   label="Verdicts rendered" />
          <StatCard value={fmtGen(stats.staked)}   unit="GEN"    label="Total staked"      accent />
          <StatCard value="5"                       unit="NODES"  label="Validator consensus" />
        </div>
      </section>

      {/* ── LIVE CLAIMS ── */}
      <section className="max-w-screen-xl mx-auto px-4 sm:px-6 pb-24 sm:pb-32">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] tracking-[0.4em] uppercase font-mono mb-1" style={{ color: "rgba(217,212,199,0.25)" }}>
              Live · {(process.env.NEXT_PUBLIC_CHAIN ?? "studionet").toUpperCase()}
            </p>
            <h2 className="text-xl font-semibold text-white">Active Claims</h2>
          </div>
          <Link href="/arena"
            className="text-xs tracking-widest uppercase font-mono transition-colors"
            style={{ color: "rgba(139,92,246,0.7)" }}>
            View all →
          </Link>
        </div>

        {claims.length === 0 ? (
          <div className="rounded-xl p-10 text-center text-sm"
            style={{ background: "#111009", border: "1px solid rgba(255,255,255,0.05)", color: "rgba(217,212,199,0.3)" }}>
            No claims yet — the Arena waits.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {claims.slice(0, 6).map((c) => (
              <ClaimCard key={c.id} c={c} />
            ))}
          </div>
        )}
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} className="py-10">
        <div className="max-w-screen-xl mx-auto px-6 flex flex-col sm:flex-row items-start justify-between gap-8">
          <div>
            <span className="text-sm tracking-[0.35em] font-bold font-mono block mb-2 text-white"
              style={{ textShadow: "0 0 16px rgba(139,92,246,0.6)" }}>ERISTIC</span>
            <p className="text-xs leading-relaxed max-w-xs" style={{ color: "rgba(217,212,199,0.3)" }}>
              Decentralized claim adjudication powered by GenLayer AI consensus.
            </p>
          </div>
          <div className="flex gap-12 text-xs">
            <div className="flex flex-col gap-3">
              <span className="uppercase tracking-widest font-mono text-[10px]" style={{ color: "rgba(255,255,255,0.18)" }}>App</span>
              {[
                { href: "/arena", label: "Arena" },
                { href: "/create", label: "File a Claim" },
                { href: "/arena?filter=resolved", label: "Verdicts" },
              ].map(({ href, label }) => (
                <Link key={href} href={href} className="transition-colors hover:text-white/70"
                  style={{ color: "rgba(217,212,199,0.35)" }}>{label}</Link>
              ))}
            </div>
            <div className="flex flex-col gap-3">
              <span className="uppercase tracking-widest font-mono text-[10px]" style={{ color: "rgba(255,255,255,0.18)" }}>Network</span>
              <span className="font-mono" style={{ color: "rgba(217,212,199,0.35)" }}>
                {(process.env.NEXT_PUBLIC_CHAIN ?? "studionet").toUpperCase()}
              </span>
              <span style={{ color: "rgba(217,212,199,0.35)" }}>GenLayer</span>
            </div>
          </div>
        </div>
        <div className="max-w-screen-xl mx-auto px-6 mt-8 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <span className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.1)" }}>
            © 2026 Eristic · On-chain truth, off-chain politics
          </span>
        </div>
      </footer>
    </div>
  );
}

/* ── AVATAR WRAPPER ── */
function Avatar({
  size, blur, opacity, ring, children,
}: {
  size: number; blur: number; opacity: number; ring: string; children: React.ReactNode;
}) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", overflow: "hidden",
      filter: `blur(${blur}px)`,
      opacity,
      border: `2px solid ${ring}`,
      boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)`,
    }}>
      {children}
    </div>
  );
}

/* ── STAT CARD ── */
function StatCard({
  value, unit, label, accent = false, purple = false,
}: {
  value: string; unit: string; label: string; accent?: boolean; purple?: boolean;
}) {
  const valueColor = purple
    ? "#a78bfa"
    : accent
    ? "#f59e0b"
    : "rgba(217,212,199,0.95)";
  const glow = purple
    ? "0 0 20px rgba(139,92,246,0.4)"
    : accent
    ? "0 0 20px rgba(245,158,11,0.35)"
    : "none";

  return (
    <div className="rounded-xl px-6 py-5 flex flex-col gap-1"
      style={{
        background: "linear-gradient(160deg, #151009 0%, #100e08 100%)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}>
      <div className="flex items-start justify-between">
        <span className="text-3xl font-bold font-mono tabular-nums leading-none"
          style={{ color: valueColor, textShadow: glow }}>
          {value}
        </span>
        <span className="text-[10px] tracking-widest font-mono pt-1" style={{ color: "rgba(217,212,199,0.25)" }}>
          {unit}
        </span>
      </div>
      <span className="text-[11px] uppercase tracking-widest mt-1" style={{ color: "rgba(217,212,199,0.3)" }}>
        {label}
      </span>
    </div>
  );
}

/* ── CLAIM CARD (landing grid) ── */
function ClaimCard({ c }: { c: Row }) {
  const total = c.pool.total_for + c.pool.total_against;
  const forPct = total > 0 ? Math.round((c.pool.total_for / total) * 100) : 50;

  const stateColor: Record<string, string> = {
    OPEN: "#a78bfa", UNDER_CHALLENGE: "#f87171",
    UNDER_REVIEW: "#c4b5fd", RESOLVED: "#34d399", CLOSED: "#52525b",
  };
  const stateLabel: Record<string, string> = {
    OPEN: "Open", UNDER_CHALLENGE: "Challenged",
    UNDER_REVIEW: "In Review", RESOLVED: "Resolved", CLOSED: "Closed",
  };

  return (
    <Link href={`/claim/${c.id}`}
      className="flex flex-col gap-3 rounded-xl px-5 py-4 transition-all duration-150 group hover:border-[rgba(139,92,246,0.3)]"
      style={{
        background: "linear-gradient(160deg, #141009 0%, #0f0e09 100%)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono" style={{ color: "rgba(217,212,199,0.2)" }}>#{c.id}</span>
          <span className="text-[10px] tracking-widest uppercase font-mono font-semibold"
            style={{ color: stateColor[c.state] }}>
            {stateLabel[c.state]}
          </span>
        </div>
        <span className="text-xs font-mono tabular-nums font-semibold" style={{ color: "#f59e0b" }}>
          {fmtGen(total)} GEN
        </span>
      </div>

      <p className="text-sm leading-snug line-clamp-2" style={{ color: "rgba(217,212,199,0.85)" }}>
        {c.statement}
      </p>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 rounded-full overflow-hidden flex"
          style={{ background: "rgba(255,255,255,0.05)" }}>
          <div className="h-full"
            style={{ width: `${forPct}%`, background: "linear-gradient(90deg,#7c3aed,#8b5cf6)" }} />
          <div className="h-full"
            style={{ width: `${100 - forPct}%`, background: "linear-gradient(90deg,#dc2626,#ef4444)" }} />
        </div>
        <span className="text-[10px] font-mono shrink-0" style={{ color: "rgba(217,212,199,0.25)" }}>
          {c.pool.positions} stakers
        </span>
        <span className="text-sm transition-colors" style={{ color: "rgba(217,212,199,0.15)" }}>→</span>
      </div>
    </Link>
  );
}
