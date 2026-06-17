import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { ArenaClaimCard } from "@/components/ArenaClaimCard";
import { MyStakes } from "@/components/MyStakes";
import { AutoRefresh } from "@/components/AutoRefresh";
import { fetchAllClaims } from "@/lib/genlayer";
import { ADDRS, type Claim, type Pool } from "@/lib/contracts";

export const dynamic = "force-dynamic";

type Row = Claim & { pool: Pool };

async function loadClaims(): Promise<Row[]> {
  if (!ADDRS.registry) return [];
  try {
    return await fetchAllClaims();
  } catch (e) {
    console.error("registry read failed", e);
    return [];
  }
}

function applyFilter(rows: Row[], f: string): Row[] {
  switch (f) {
    case "active":   return rows.filter((c) => c.state === "OPEN" || c.state === "UNDER_CHALLENGE");
    case "review":   return rows.filter((c) => c.state === "UNDER_REVIEW");
    case "resolved": return rows.filter((c) => c.state === "RESOLVED");
    case "mine":     return rows;
    default:         return rows.filter((c) => c.state !== "CLOSED");
  }
}

const FILTERS = [
  { slug: "arena",    label: "All" },
  { slug: "active",   label: "Active" },
  { slug: "review",   label: "In Review" },
  { slug: "resolved", label: "Resolved" },
  { slug: "mine",     label: "My Stakes" },
];

export default async function Arena({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const sp = await searchParams;
  const filter = sp.filter ?? "arena";
  const all = await loadClaims();
  const rows = applyFilter(all, filter);

  const stats = {
    total:    all.filter((c) => c.state !== "CLOSED").length,
    active:   all.filter((c) => c.state === "OPEN" || c.state === "UNDER_CHALLENGE").length,
    review:   all.filter((c) => c.state === "UNDER_REVIEW").length,
    resolved: all.filter((c) => c.state === "RESOLVED").length,
  };

  return (
    <div className="min-h-screen" style={{ background: "#0a0909" }}>
      <AutoRefresh />
      <Sidebar activeFilter={filter} />

      {/* ── PAGE HEADER ── */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="max-w-screen-xl mx-auto px-6 pt-10 pb-0">

          {/* Network badge */}
          <div className="flex items-center gap-2 mb-5">
            <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "#ef4444" }} />
            <span className="text-[10px] tracking-[0.4em] uppercase font-mono" style={{ color: "rgba(237,235,230,0.3)" }}>
              {(process.env.NEXT_PUBLIC_CHAIN ?? "studionet").toUpperCase()} · Live
            </span>
          </div>

          {/* Title */}
          <h1 className="font-bold mb-8" style={{
            fontSize: "clamp(32px, 4.5vw, 60px)",
            color: "#edebe6",
            letterSpacing: "-0.02em",
          }}>
            The Arena
          </h1>

          {/* Stats — all same muted white, ONE number in purple (in-review = processing) */}
          <div className="flex items-end gap-10 mb-8">
            {[
              { value: stats.total,    label: "Total Claims", accent: false },
              { value: stats.active,   label: "Active",       accent: false },
              { value: stats.review,   label: "In Review",    accent: true  },
              { value: stats.resolved, label: "Resolved",     accent: false },
            ].map(({ value, label, accent }) => (
              <div key={label} className="flex flex-col gap-1">
                <span className="text-3xl font-bold font-mono tabular-nums leading-none"
                  style={{
                    color: accent ? "#8b5cf6" : "#edebe6",
                    textShadow: accent ? "0 0 24px rgba(139,92,246,0.5)" : "none",
                  }}>
                  {value}
                </span>
                <span className="text-[10px] tracking-[0.3em] uppercase font-mono"
                  style={{ color: "rgba(237,235,230,0.28)" }}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Filter tabs — underline style */}
          <div className="flex items-center gap-0 overflow-x-auto">
            {FILTERS.map((f) => {
              const active = filter === f.slug;
              return (
                <Link key={f.slug} href={`/arena?filter=${f.slug}`}
                  className="px-4 py-3 text-sm font-medium whitespace-nowrap transition-all duration-150 relative"
                  style={{
                    color: active ? "#edebe6" : "rgba(237,235,230,0.38)",
                    borderBottom: active ? "2px solid #8b5cf6" : "2px solid transparent",
                  }}>
                  {f.label}
                  {f.slug === "review" && stats.review > 0 && (
                    <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold font-mono"
                      style={{ background: "rgba(139,92,246,0.2)", color: "#a78bfa" }}>
                      {stats.review}
                    </span>
                  )}
                </Link>
              );
            })}
            <div className="flex-1" />
            <Link href="/create"
              className="mb-1 px-5 py-2 rounded-full text-sm font-semibold tracking-wide text-white transition-all"
              style={{
                background: "#7c3aed",
                boxShadow: "0 0 24px rgba(124,58,237,0.4)",
              }}>
              + File a Claim
            </Link>
          </div>
        </div>
      </div>

      {/* ── CLAIMS LIST ── */}
      <main className="max-w-screen-xl mx-auto px-6 py-6">
        {!ADDRS.registry && (
          <div className="rounded-lg p-5 mb-6 text-sm"
            style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.18)", color: "#d97706" }}>
            Registry not configured — set <code className="opacity-70">NEXT_PUBLIC_REGISTRY</code> in <code className="opacity-70">.env.local</code>
          </div>
        )}

        {filter === "mine" ? (
          <MyStakes />
        ) : rows.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <div className="flex flex-col gap-3">
            {rows.map((c) => (
              <ArenaClaimCard key={c.id} c={c} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function EmptyState({ filter }: { filter: string }) {
  const msg: Record<string, string> = {
    active:   "No active disputes right now.",
    review:   "Nothing is currently under AI review.",
    resolved: "No verdicts have been rendered yet.",
    arena:    "The Arena is empty. File the first claim.",
  };
  return (
    <div className="py-32 flex flex-col items-center gap-4 text-center">
      <p className="text-base font-medium" style={{ color: "rgba(237,235,230,0.4)" }}>
        {msg[filter] ?? msg.arena}
      </p>
      <Link href="/create"
        className="px-6 py-2.5 rounded-full text-sm font-semibold text-white"
        style={{ background: "#7c3aed", boxShadow: "0 0 20px rgba(124,58,237,0.35)" }}>
        File a Claim
      </Link>
    </div>
  );
}
