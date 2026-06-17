import Link from "next/link";
import type { Claim, Pool } from "@/lib/contracts";

const stateTag: Record<Claim["state"], string> = {
  OPEN: "tag tag-open",
  UNDER_CHALLENGE: "tag tag-challenge",
  UNDER_REVIEW: "tag tag-review",
  RESOLVED: "tag tag-resolved",
  CLOSED: "tag tag-closed",
};

const stateLabel: Record<Claim["state"], string> = {
  OPEN: "Open",
  UNDER_CHALLENGE: "Challenged",
  UNDER_REVIEW: "In Review",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

function fmtGen(wei: number): string {
  const gen = wei / 1e18;
  if (gen >= 1000) return `${(gen / 1000).toFixed(1)}k`;
  if (gen >= 1) return gen.toFixed(0);
  return gen.toFixed(2);
}

export function ClaimRow({ c }: { c: Claim & { pool: Pool } }) {
  const total = c.pool.total_for + c.pool.total_against;
  const forPct = total > 0 ? Math.round((c.pool.total_for / total) * 100) : 50;

  return (
    <Link
      href={`/claim/${c.id}`}
      className="card block px-5 py-4 hover:border-amber/20 hover:bg-[#16130c] transition-all duration-150 group"
    >
      <div className="flex items-start gap-4">

        {/* Claim ID */}
        <div className="shrink-0 text-[10px] text-bone/25 tabular-nums pt-0.5 w-6 text-right">
          #{c.id}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <p className="text-bone text-sm leading-snug group-hover:text-bone/90 line-clamp-2 font-sans">
              {c.statement}
            </p>
            <div className="shrink-0">
              <span className={stateTag[c.state]}>{stateLabel[c.state]}</span>
            </div>
          </div>

          {/* Bottom row */}
          <div className="mt-3 flex items-center gap-4">
            {/* Stake pool size — data, keep mono */}
            <span className="text-amber text-xs tabular-nums glow-amber font-mono">
              {fmtGen(total)} GEN
            </span>

            <span className="text-bone/25 text-xs font-sans">{c.pool.positions} stakers</span>

            {/* FOR / AGAINST bar — capped width so labels don't drift to screen edges */}
            <div className="flex items-center gap-2 w-48 shrink-0">
              <span className="text-[10px] text-amber/60 tabular-nums w-6 text-right shrink-0">{forPct}%</span>
              <div className="flex-1 h-1 bg-[#1f1f22] rounded-full overflow-hidden flex">
                <div
                  className="bg-amber/70 h-full transition-[width] duration-500"
                  style={{ width: `${forPct}%` }}
                />
                <div
                  className="bg-blood/60 h-full transition-[width] duration-500"
                  style={{ width: `${100 - forPct}%` }}
                />
              </div>
              <span className="text-[10px] text-blood/60 tabular-nums w-6 shrink-0">{100 - forPct}%</span>
            </div>

            {/* Verdict badge if resolved */}
            {c.state === "RESOLVED" && c.verdict && (
              <span className="text-[10px] tracking-widest text-emerald-400/70 shrink-0">
                {c.verdict === "NOT_SUPPORTED" ? "NOT SUP." : c.verdict}
              </span>
            )}
          </div>
        </div>

        {/* Arrow */}
        <div className="shrink-0 text-bone/20 group-hover:text-amber/40 transition-colors text-sm pt-0.5">
          →
        </div>
      </div>
    </Link>
  );
}
