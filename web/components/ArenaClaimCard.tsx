"use client";

import Link from "next/link";
import type { Claim, Pool } from "@/lib/contracts";

type Row = Claim & { pool: Pool };

function fmtGen(wei: number) {
  const g = wei / 1e18;
  if (g >= 1000) return `${(g / 1000).toFixed(1)}K`;
  if (g >= 1) return g.toFixed(2);
  return g.toFixed(3);
}

const STATE: Record<string, { label: string; color: string; bg: string; border: string }> = {
  OPEN:            { label: "Open",       color: "#f59e0b", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.25)"  },
  UNDER_CHALLENGE: { label: "Challenged", color: "#ef4444", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.25)"   },
  UNDER_REVIEW:    { label: "In Review",  color: "#8b5cf6", bg: "rgba(139,92,246,0.10)",  border: "rgba(139,92,246,0.35)"  },
  RESOLVED:        { label: "Resolved",   color: "#22c55e", bg: "rgba(34,197,94,0.07)",   border: "rgba(34,197,94,0.22)"   },
  CLOSED:          { label: "Closed",     color: "#52525b", bg: "rgba(82,82,91,0.06)",    border: "rgba(82,82,91,0.2)"     },
};

export function ArenaClaimCard({ c }: { c: Row }) {
  const cfg = STATE[c.state] ?? STATE.CLOSED;
  const total = c.pool.total_for + c.pool.total_against;
  const forPct = total > 0 ? Math.round((c.pool.total_for / total) * 100) : 50;
  const isReview = c.state === "UNDER_REVIEW";

  return (
    <Link
      href={`/claim/${c.id}`}
      className="group block rounded-xl transition-all duration-200"
      style={{
        background: "#111010",
        border: "1px solid rgba(255,255,255,0.09)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(139,92,246,0.35)";
        (e.currentTarget as HTMLElement).style.background = "#161414";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.09)";
        (e.currentTarget as HTMLElement).style.background = "#111010";
      }}
    >
      {/* Top bar: state accent line */}
      <div className="h-[2px] rounded-t-xl" style={{ background: cfg.border }} />

      <div className="px-5 py-4">
        {/* Row 1: ID + state badge + GEN */}
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono tabular-nums"
              style={{ color: "rgba(237,235,230,0.22)" }}>
              #{c.id}
            </span>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold tracking-wide uppercase"
              style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
            >
              {isReview && (
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-70"
                    style={{ background: cfg.color }} />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5"
                    style={{ background: cfg.color }} />
                </span>
              )}
              {cfg.label}
            </span>
          </div>

          <span
            className="text-sm font-mono font-bold tabular-nums"
            style={{ color: total > 0 ? "#edebe6" : "rgba(237,235,230,0.22)" }}
          >
            {fmtGen(total)} GEN
          </span>
        </div>

        {/* Row 2: Statement */}
        <p className="text-sm leading-relaxed line-clamp-2 mb-4 transition-colors duration-150 group-hover:text-white"
          style={{ color: "rgba(237,235,230,0.82)" }}>
          {c.statement}
        </p>

        {/* Row 3: FOR vs AGAINST bar */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[10px] font-mono"
            style={{ color: "rgba(237,235,230,0.3)" }}>
            <span style={{ color: "#a78bfa" }}>FOR  {fmtGen(c.pool.total_for)} GEN</span>
            {c.pool.positions > 0 && (
              <span>{c.pool.positions} staker{c.pool.positions !== 1 ? "s" : ""}</span>
            )}
            <span style={{ color: "#f87171" }}>AGAINST  {fmtGen(c.pool.total_against)} GEN</span>
          </div>

          {total > 0 ? (
            <div className="h-2 w-full rounded-full overflow-hidden flex"
              style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="h-full transition-all duration-500"
                style={{ width: `${forPct}%`, background: "linear-gradient(90deg,#6d28d9,#8b5cf6)" }} />
              <div className="h-full transition-all duration-500"
                style={{ width: `${100 - forPct}%`, background: "linear-gradient(90deg,#b91c1c,#ef4444)" }} />
            </div>
          ) : (
            <div className="h-2 w-full rounded-full"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.08)" }} />
          )}

          {total === 0 && (
            <p className="text-[10px] font-mono text-center mt-0.5"
              style={{ color: "rgba(237,235,230,0.2)" }}>
              no stakes yet — be the first to stake
            </p>
          )}
        </div>

        {/* Verdict row (resolved only) */}
        {c.state === "RESOLVED" && c.verdict && (
          <div className="mt-3 pt-3 flex items-center gap-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <span className="text-[10px] font-mono tracking-widest uppercase"
              style={{ color: "rgba(237,235,230,0.25)" }}>Verdict</span>
            <span className="text-xs font-mono font-bold"
              style={{
                color: c.verdict === "SUPPORTED" ? "#22c55e"
                     : c.verdict === "NOT_SUPPORTED" ? "#ef4444"
                     : "#a78bfa",
              }}>
              {c.verdict === "NOT_SUPPORTED" ? "Not Supported" : c.verdict}
            </span>
            {c.confidence > 0 && (
              <span className="text-[10px] font-mono ml-auto"
                style={{ color: "rgba(237,235,230,0.25)" }}>
                {(c.confidence / 100).toFixed(0)}% confidence
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
