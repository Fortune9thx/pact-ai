import type { Claim, Pool } from "@/lib/contracts";

export function RightPanel({ claims }: { claims: Array<Claim & { pool: Pool }> }) {
  const trending = [...claims]
    .filter((c) => c.state !== "CLOSED")
    .sort((a, b) => b.pool.positions - a.pool.positions)
    .slice(0, 4);
  const largest = [...claims]
    .sort((a, b) => (b.pool.total_for + b.pool.total_against) - (a.pool.total_for + a.pool.total_against))
    .slice(0, 4);
  const recent = claims.filter((c) => c.state === "RESOLVED").slice(0, 4);

  return (
    <aside className="w-72 shrink-0 border-l rule px-5 py-6 space-y-8 sticky top-0 h-screen overflow-auto">
      <Section title="TRENDING DISPUTES" rows={trending.map((c) => ({
        left: `#${c.id}`,
        mid: c.statement,
        right: `${c.pool.positions}`,
      }))} />
      <Section title="LARGEST STAKE POOLS" rows={largest.map((c) => ({
        left: `#${c.id}`,
        mid: c.statement,
        right: `${((c.pool.total_for + c.pool.total_against) / 1e18).toFixed(0)} GEN`,
      }))} />
      <Section title="RECENT VERDICTS" rows={recent.map((c) => ({
        left: c.verdict.slice(0, 3),
        mid: c.statement,
        right: `${(c.confidence / 100).toFixed(0)}%`,
      }))} />
      <Section title="VALIDATOR ACTIVITY" rows={
        // Derived from on-chain state, not mocked. Surfaces the kinds of
        // events the user actually wants to see: in-review and just-resolved.
        claims
          .filter((c) => c.state === "UNDER_REVIEW" || c.state === "RESOLVED")
          .sort((a, b) => b.created_at - a.created_at)
          .slice(0, 5)
          .map((c) => ({
            left: c.state === "UNDER_REVIEW" ? "▸" : "▣",
            mid: c.state === "UNDER_REVIEW"
              ? `reviewing #${c.id}`
              : `verdict #${c.id} · ${c.verdict.slice(0, 3)}`,
            right: c.state === "UNDER_REVIEW" ? "live" : `${(c.confidence / 100).toFixed(0)}%`,
          }))
      } />
    </aside>
  );
}

function Section({ title, rows }: { title: string; rows: Array<{ left: string; mid: string; right: string }> }) {
  return (
    <div>
      <div className="text-[10px] tracking-[0.25em] text-bone/40 mb-2">{title}</div>
      <div className="space-y-1.5">
        {rows.length === 0 && <div className="text-bone/30 text-xs italic">no data</div>}
        {rows.map((r, i) => (
          <div key={i} className="text-xs flex gap-2 items-baseline">
            <span className="text-amber/70 tabular-nums shrink-0 w-8">{r.left}</span>
            <span className="text-bone/80 truncate flex-1">{r.mid}</span>
            <span className="text-bone/40 tabular-nums shrink-0">{r.right}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
